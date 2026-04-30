import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { tours, comedians, venues, showTasks, shows } from "@/db/schema";
import { requireOrg } from "@/lib/auth";
import { canDelete, canEdit, canInvite, getTourRole } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { formatDate, formatPence } from "@/lib/utils";
import { getTourFinancials } from "@/lib/finance";
import { deleteTourAction } from "../actions";
import { CloneTourButton } from "./clone-tour-button";
import { PageHeader } from "@/components/app/page-header";
import { StatusPill } from "@/components/ui/pill";

type SortKey = "date" | "city" | "status" | "sold" | "revenue" | "net";
type SortDir = "asc" | "desc";

const SORT_KEYS: ReadonlyArray<SortKey> = [
  "date",
  "city",
  "status",
  "sold",
  "revenue",
  "net",
];

function EstChip() {
  return (
    <span className="ml-1.5 rounded bg-amber-100 px-1 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
      Est.
    </span>
  );
}

export default async function TourDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sort?: string; dir?: string }>;
}) {
  const { id } = await params;
  const { sort: sortParam, dir: dirParam } = await searchParams;
  const sort: SortKey = (SORT_KEYS as readonly string[]).includes(sortParam ?? "")
    ? (sortParam as SortKey)
    : "date";
  const dir: SortDir = dirParam === "desc" ? "desc" : "asc";

  const { user } = await requireOrg();

  const tourRole = await getTourRole(user.id, id);
  if (!tourRole) notFound();
  const showFinancials = tourRole.canViewFinancials;
  const allowEdit = canEdit(tourRole.role);
  const allowDelete = canDelete(tourRole.role);
  const allowInvite = canInvite(tourRole.role);

  const [t] = await db
    .select({
      id: tours.id,
      name: tours.name,
      status: tours.status,
      startDate: tours.startDate,
      endDate: tours.endDate,
      description: tours.description,
      budgetPence: tours.budgetPence,
      comedianId: tours.comedianId,
      comedianName: comedians.stageName,
      tourOrgId: tours.orgId,
    })
    .from(tours)
    .leftJoin(comedians, eq(tours.comedianId, comedians.id))
    .where(eq(tours.id, id))
    .limit(1);
  if (!t) notFound();

  const tourOrgId = t.tourOrgId;

  const { perShow, totals, showCount } = await getTourFinancials(tourOrgId, t.id);

  // Fetch venue names for the agenda (use the tour's org_id, not necessarily the user's primary org)
  const venueIds = perShow
    .map((p) => p.show.venueId)
    .filter((v): v is string => v != null);
  const venueRows = venueIds.length
    ? await db
        .select({ id: venues.id, name: venues.name, city: venues.city })
        .from(venues)
        .where(and(eq(venues.orgId, tourOrgId), isNull(venues.archivedAt)))
    : [];
  const venueMap = new Map(venueRows.map((v) => [v.id, v]));

  // Task counts per show (one query for the whole tour)
  const showIds = perShow.map((p) => p.show.id);
  const taskRows = showIds.length
    ? await db
        .select({
          showId: showTasks.showId,
          done: showTasks.done,
        })
        .from(showTasks)
        .where(eq(showTasks.orgId, tourOrgId))
    : [];
  const taskCounts = new Map<string, { total: number; done: number }>();
  for (const r of taskRows) {
    const c = taskCounts.get(r.showId) ?? { total: 0, done: 0 };
    c.total += 1;
    if (r.done) c.done += 1;
    taskCounts.set(r.showId, c);
  }
  void shows;

  // Sort the per-show list according to query params
  const sortedShows = [...perShow].sort((a, b) => {
    const va = sortValue(sort, a, venueMap);
    const vb = sortValue(sort, b, venueMap);
    let cmp = 0;
    if (typeof va === "number" && typeof vb === "number") cmp = va - vb;
    else cmp = String(va).localeCompare(String(vb));
    return dir === "asc" ? cmp : -cmp;
  });

  // Status breakdown for the dashboard
  const statusCounts = perShow.reduce<Record<string, number>>((acc, p) => {
    acc[p.show.status] = (acc[p.show.status] ?? 0) + 1;
    return acc;
  }, {});

  // Cost breakdown (in pence)
  const costParts = [
    { label: "Venue fees", value: totals.venueFeePence, color: "bg-[#C8553D]" },
    { label: "Accommodation", value: totals.accommodationPence, color: "bg-[#8a8275]" },
    { label: "Travel", value: totals.travelPence, color: "bg-[#3F8EFC]" },
    { label: "Marketing", value: totals.marketingPence, color: "bg-[#7E5BC2]" },
  ] as const;

  // Margin %: net / revenue. Only meaningful if revenue > 0.
  const marginPct =
    totals.revenuePence > 0
      ? Math.round((totals.netPence / totals.revenuePence) * 100)
      : null;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t.comedianName ?? "Tour"}
        title={
          <span className="flex items-center gap-3">
            <span>{t.name}</span>
            <StatusPill status={t.status} />
          </span>
        }
        description={
          <>
            {formatDate(t.startDate)} – {formatDate(t.endDate)}
            {t.description ? <> · {t.description}</> : null}
          </>
        }
        actions={
          <>
            <Link href={`/tours/${t.id}/itinerary`}>
              <Button variant="outline">Itinerary</Button>
            </Link>
            {allowEdit && (
              <Link href={`/tours/${t.id}/edit`}>
                <Button variant="outline">Edit</Button>
              </Link>
            )}
            {allowEdit && (
              <CloneTourButton tourId={t.id} sourceName={t.name} sourceStartDate={t.startDate} />
            )}
            {allowInvite && (
              <Link href={`/tours/${t.id}/team`}>
                <Button variant="outline">Team</Button>
              </Link>
            )}
            <a
              href={`/api/tours/${t.id}/tour-book`}
              target="_blank"
              rel="noopener"
            >
              <Button variant="outline">Tour book PDF</Button>
            </a>
            {allowDelete && (
              <form action={deleteTourAction}>
                <input type="hidden" name="id" value={t.id} />
                <Button type="submit" variant="destructive" formNoValidate>
                  Archive
                </Button>
              </form>
            )}
          </>
        }
      />

      {/* KPI cards */}
      <div className={`grid gap-4 ${showFinancials ? "md:grid-cols-4" : "md:grid-cols-2"}`}>
        <KpiCard label="Shows" value={String(showCount)} />
        <KpiCard label="Tickets sold" value={totals.ticketsSold.toLocaleString("en-GB")} />
        {showFinancials && (
          <>
            <KpiCard
              label={
                <>
                  Revenue
                  {totals.hasEstimates && <EstChip />}
                </>
              }
              value={formatPence(totals.revenuePence)}
            />
            <KpiCard
              label={
                <>
                  Net P&amp;L
                  {totals.hasEstimates && <EstChip />}
                </>
              }
              value={formatPence(totals.netPence)}
              valueClassName={totals.netPence < 0 ? "text-destructive" : undefined}
              sub={
                <>
                  {marginPct != null && (
                    <>
                      Margin{" "}
                      <span
                        className={`font-medium tabular-nums ${
                          marginPct < 0 ? "text-destructive" : "text-foreground"
                        }`}
                      >
                        {marginPct}%
                      </span>
                      {" · "}
                    </>
                  )}
                  Costs {formatPence(totals.costsPence)}
                </>
              }
            />
          </>
        )}
      </div>

      {/* Cost breakdown + status breakdown */}
      <div className={`grid gap-6 ${showFinancials ? "md:grid-cols-3" : "md:grid-cols-1"}`}>
        {showFinancials && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Cost breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {totals.costsPence === 0 ? (
              <p className="text-sm text-muted-foreground">
                No costs recorded yet. Add venue fees, accommodation, travel or
                marketing budgets to shows to see the breakdown.
              </p>
            ) : (
              <>
                <div className="flex h-3 w-full overflow-hidden rounded-full bg-surface-2">
                  {costParts.map((p) => {
                    const pct = (p.value / totals.costsPence) * 100;
                    if (pct <= 0) return null;
                    return (
                      <div
                        key={p.label}
                        className={p.color}
                        style={{ width: `${pct}%` }}
                        title={`${p.label}: ${formatPence(p.value)} (${pct.toFixed(1)}%)`}
                      />
                    );
                  })}
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                  {costParts.map((p) => {
                    const pct = totals.costsPence
                      ? Math.round((p.value / totals.costsPence) * 100)
                      : 0;
                    return (
                      <div key={p.label} className="space-y-0.5">
                        <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span className={`h-2 w-2 rounded-sm ${p.color}`} />
                          {p.label}
                        </dt>
                        <dd className="font-display tabular-nums">
                          {formatPence(p.value)}
                          <span className="ml-1.5 text-xs text-muted-foreground">
                            {pct}%
                          </span>
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              </>
            )}
          </CardContent>
        </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Status breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {showCount === 0 ? (
              <p className="text-sm text-muted-foreground">No shows yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {Object.entries(statusCounts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([status, count]) => {
                    const pct = Math.round((count / showCount) * 100);
                    return (
                      <li key={status} className="flex items-center justify-between gap-3">
                        <StatusPill status={status} />
                        <span className="tabular-nums text-muted-foreground">
                          {count}{" "}
                          <span className="text-xs">({pct}%)</span>
                        </span>
                      </li>
                    );
                  })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Shows table — sortable */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Shows</CardTitle>
          {allowEdit && (
            <Link href={`/tours/${t.id}/shows/new`}>
              <Button size="sm">Add show</Button>
            </Link>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {perShow.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              No shows yet. Add the first one to start scheduling.
            </p>
          ) : (
            <Table>
              <THead>
                <TR>
                  <SortableTH tourId={t.id} k="date" sort={sort} dir={dir}>Date</SortableTH>
                  <SortableTH tourId={t.id} k="city" sort={sort} dir={dir}>City / venue</SortableTH>
                  <SortableTH tourId={t.id} k="status" sort={sort} dir={dir}>Status</SortableTH>
                  <SortableTH tourId={t.id} k="sold" sort={sort} dir={dir} align="right">Sold / cap</SortableTH>
                  <TH className="text-right">Tasks</TH>
                  {showFinancials && <SortableTH tourId={t.id} k="revenue" sort={sort} dir={dir} align="right">Revenue</SortableTH>}
                  {showFinancials && <SortableTH tourId={t.id} k="net" sort={sort} dir={dir} align="right">Net</SortableTH>}
                </TR>
              </THead>
              <TBody>
                {sortedShows.map(({ show, fin }) => {
                  const v = show.venueId ? venueMap.get(show.venueId) : null;
                  return (
                    <TR key={show.id}>
                      <TD className="whitespace-nowrap">
                        <Link
                          href={`/tours/${t.id}/shows/${show.id}`}
                          className="font-medium hover:underline"
                        >
                          {formatDate(show.showDate)}
                        </Link>
                      </TD>
                      <TD>
                        <div className="text-sm">
                          {show.city ?? v?.city ?? "—"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {v?.name ?? "No venue"}
                        </div>
                      </TD>
                      <TD>
                        <StatusPill status={show.status} />
                      </TD>
                      <TD className="text-right tabular-nums">
                        {fin.ticketsSold}
                        {show.ticketCapacity != null
                          ? ` / ${show.ticketCapacity}`
                          : ""}
                      </TD>
                      <TD className="text-right tabular-nums text-xs text-muted-foreground">
                        {(() => {
                          const c = taskCounts.get(show.id);
                          if (!c || c.total === 0) return "—";
                          return `${c.done}/${c.total}`;
                        })()}
                      </TD>
                      {showFinancials && (
                        <TD className="text-right tabular-nums">
                          {formatPence(fin.ticketRevenuePence)}
                          {fin.isEstimated && <EstChip />}
                        </TD>
                      )}
                      {showFinancials && (
                        <TD
                          className={`text-right tabular-nums ${
                            fin.netPence < 0 ? "text-destructive" : ""
                          }`}
                        >
                          {formatPence(fin.netPence)}
                          {fin.isEstimated && <EstChip />}
                        </TD>
                      )}
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {showFinancials && t.budgetPence != null && (
        <Card>
          <CardHeader>
            <CardTitle>Tour budget</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <BudgetBar budgetPence={t.budgetPence} spentPence={totals.costsPence} />
            <p className="text-sm text-muted-foreground">
              Budget <span className="font-medium text-foreground tabular-nums">{formatPence(t.budgetPence)}</span>
              {" · "}
              Spent <span className="font-medium text-foreground tabular-nums">{formatPence(totals.costsPence)}</span>
              {" · "}
              {t.budgetPence - totals.costsPence >= 0 ? "Remaining" : "Over by"}{" "}
              <span
                className={`font-medium tabular-nums ${
                  t.budgetPence - totals.costsPence < 0 ? "text-destructive" : "text-foreground"
                }`}
              >
                {formatPence(Math.abs(t.budgetPence - totals.costsPence))}
              </span>
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

type ShowRow = {
  show: { showDate: string; status: string; city: string | null; venueId: string | null };
  fin: { ticketsSold: number; ticketRevenuePence: number; netPence: number };
};

function sortValue(
  key: SortKey,
  row: ShowRow,
  venueMap: Map<string, { name: string; city: string | null }>,
): string | number {
  const v = row.show.venueId ? venueMap.get(row.show.venueId) : null;
  switch (key) {
    case "date":
      return row.show.showDate;
    case "city":
      return (row.show.city ?? v?.city ?? "").toLowerCase();
    case "status":
      return row.show.status;
    case "sold":
      return row.fin.ticketsSold;
    case "revenue":
      return row.fin.ticketRevenuePence;
    case "net":
      return row.fin.netPence;
  }
}

function KpiCard({
  label,
  value,
  sub,
  valueClassName,
}: {
  label: React.ReactNode;
  value: string;
  sub?: React.ReactNode;
  valueClassName?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xs uppercase tracking-wider font-medium text-subtle">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className={`font-display text-3xl tabular-nums ${valueClassName ?? ""}`}>
          {value}
        </p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function SortableTH({
  k,
  sort,
  dir,
  tourId,
  align = "left",
  children,
}: {
  k: SortKey;
  sort: SortKey;
  dir: SortDir;
  tourId: string;
  align?: "left" | "right";
  children: React.ReactNode;
}) {
  const active = sort === k;
  const nextDir: SortDir = active && dir === "asc" ? "desc" : "asc";
  const indicator = active ? (dir === "asc" ? "↑" : "↓") : "";
  const href = `/tours/${tourId}?sort=${k}&dir=${nextDir}`;
  return (
    <TH className={align === "right" ? "text-right" : ""}>
      <Link
        href={href}
        className={`inline-flex items-center gap-1 hover:text-foreground ${
          active ? "text-foreground" : ""
        }`}
      >
        {children}
        {indicator && <span className="text-xs">{indicator}</span>}
      </Link>
    </TH>
  );
}

function BudgetBar({
  budgetPence,
  spentPence,
}: {
  budgetPence: number;
  spentPence: number;
}) {
  const pct = budgetPence > 0 ? Math.min(100, (spentPence / budgetPence) * 100) : 0;
  const over = spentPence > budgetPence;
  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-surface-2">
      <div
        className={over ? "bg-destructive" : "bg-accent"}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
