import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { comedians, tours } from "@/db/schema";
import { requireOrg } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusPill } from "@/components/ui/pill";
import { formatDate, formatPence } from "@/lib/utils";
import { getComedianStats } from "@/lib/finance";
import { deleteComedianAction } from "../actions";

function EstChip() {
  return (
    <span className="ml-1.5 rounded bg-amber-100 px-1 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
      Est.
    </span>
  );
}

export default async function ComedianDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { orgId } = await requireOrg();
  const [c] = await db
    .select()
    .from(comedians)
    .where(and(eq(comedians.id, id), eq(comedians.orgId, orgId)))
    .limit(1);
  if (!c) notFound();

  const stats = await getComedianStats(orgId, c.id);

  // Tour list for this comedian
  const tourRows = await db
    .select({
      id: tours.id,
      name: tours.name,
      status: tours.status,
      startDate: tours.startDate,
      endDate: tours.endDate,
    })
    .from(tours)
    .where(
      and(
        eq(tours.orgId, orgId),
        eq(tours.comedianId, c.id),
        isNull(tours.archivedAt),
      ),
    )
    .orderBy(desc(tours.startDate), asc(tours.name));

  const marginPct =
    stats.revenuePence > 0
      ? Math.round((stats.netPence / stats.revenuePence) * 100)
      : null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Comedian"
        title={c.stageName}
        description={c.legalName ?? undefined}
        actions={
          <>
            <Link href={`/comedians/${c.id}/edit`}>
              <Button variant="outline">Edit</Button>
            </Link>
            <form action={deleteComedianAction}>
              <input type="hidden" name="id" value={c.id} />
              <Button type="submit" variant="destructive" formNoValidate>
                Archive
              </Button>
            </form>
          </>
        }
      />

      {/* Career KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard label="Tours" value={stats.tourCount.toString()} />
        <KpiCard
          label="Shows"
          value={stats.showCount.toString()}
          sub={
            stats.firstShowDate && stats.lastShowDate ? (
              <>
                {formatDate(stats.firstShowDate)} – {formatDate(stats.lastShowDate)}
              </>
            ) : null
          }
        />
        <KpiCard
          label={
            <>
              Revenue
              {stats.hasEstimates && <EstChip />}
            </>
          }
          value={formatPence(stats.revenuePence)}
          sub={
            stats.showCount > 0 ? (
              <>Avg {formatPence(stats.avgRevenuePerShow)} / show</>
            ) : null
          }
        />
        <KpiCard
          label={
            <>
              Net P&amp;L
              {stats.hasEstimates && <EstChip />}
            </>
          }
          value={formatPence(stats.netPence)}
          valueClassName={stats.netPence < 0 ? "text-destructive" : undefined}
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
                </>
              )}
            </>
          }
        />
      </div>

      {/* Performance + breakdowns */}
      {stats.showCount > 0 && (
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Average occupancy</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.avgOccupancyPercent == null ? (
                <p className="text-sm text-muted-foreground">
                  No capacity data yet.
                </p>
              ) : (
                <>
                  <p className="font-display text-3xl tabular-nums">
                    {stats.avgOccupancyPercent}%
                  </p>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="bg-accent"
                      style={{
                        width: `${Math.min(100, stats.avgOccupancyPercent)}%`,
                      }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {stats.ticketsSold.toLocaleString("en-GB")} tickets sold across all shows
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top venues</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.topVenues.length === 0 ? (
                <p className="text-sm text-muted-foreground">No venues yet.</p>
              ) : (
                <ul className="space-y-1.5 text-sm">
                  {stats.topVenues.map((v) => (
                    <li key={v.name} className="flex items-center justify-between gap-3">
                      <span className="truncate">{v.name}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {v.count}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top cities</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.topCities.length === 0 ? (
                <p className="text-sm text-muted-foreground">No cities yet.</p>
              ) : (
                <ul className="space-y-1.5 text-sm">
                  {stats.topCities.map((c) => (
                    <li key={c.city} className="flex items-center justify-between gap-3">
                      <span className="truncate">{c.city}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {c.count}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Status breakdown */}
      {stats.showCount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Show status breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-wrap gap-3 text-sm">
              {Object.entries(stats.statusCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([status, count]) => (
                  <li key={status} className="flex items-center gap-2">
                    <StatusPill status={status} />
                    <span className="tabular-nums text-muted-foreground">
                      {count}
                    </span>
                  </li>
                ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Tours list */}
      {tourRows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tours</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {tourRows.map((tour) => (
                <li key={tour.id} className="px-6 py-3">
                  <Link
                    href={`/tours/${tour.id}`}
                    className="flex items-center justify-between gap-3 hover:underline"
                  >
                    <span className="flex items-center gap-3">
                      <span className="font-medium">{tour.name}</span>
                      <StatusPill status={tour.status} />
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(tour.startDate)} – {formatDate(tour.endDate)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Email:</span>{" "}
              {c.email ?? "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Phone:</span>{" "}
              {c.phone ?? "—"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Representation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Agent:</span>{" "}
              {c.agentName ?? "—"}
              {c.agentCompany && ` (${c.agentCompany})`}
            </p>
            <p>
              <span className="text-muted-foreground">Manager:</span>{" "}
              {c.managerName ?? "—"}
              {c.managerCompany && ` (${c.managerCompany})`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hospitality rider</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">
              {c.hospitalityRider ?? "—"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Technical rider</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">
              {c.technicalRider ?? "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {c.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{c.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
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
