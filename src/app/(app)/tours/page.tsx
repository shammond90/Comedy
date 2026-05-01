import Link from "next/link";
import { and, asc, eq, gte, ilike, inArray, isNull, lte, or } from "drizzle-orm";
import { db } from "@/db/client";
import { tours, comedians } from "@/db/schema";
import { requireOrg } from "@/lib/auth";
import { canEdit, getOrgRole, visibleTourCondition } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { PageHeader } from "@/components/app/page-header";
import { StatusPill } from "@/components/ui/pill";
import { formatDate } from "@/lib/utils";

const TOUR_STATUSES = [
  "planning",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
] as const;

export default async function ToursPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; date?: string }>;
}) {
  const { user, orgId } = await requireOrg();
  const orgRole = await getOrgRole(user.id, orgId);
  const canCreate = canEdit(orgRole?.role ?? null);

  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const status = (sp.status ?? "").trim();
  const date = (sp.date ?? "").trim();

  const visibility = await visibleTourCondition(user.id);
  const conds = [isNull(tours.archivedAt)];
  if (visibility) conds.push(visibility);
  if (q) {
    const pattern = `%${q}%`;
    conds.push(
      or(
        ilike(tours.name, pattern),
        ilike(comedians.stageName, pattern),
      )!,
    );
  }
  if (status && (TOUR_STATUSES as readonly string[]).includes(status)) {
    conds.push(
      inArray(tours.status, [status as (typeof TOUR_STATUSES)[number]]),
    );
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    conds.push(lte(tours.startDate, date));
    conds.push(gte(tours.endDate, date));
  }

  const rows = await db
    .select({
      id: tours.id,
      name: tours.name,
      status: tours.status,
      startDate: tours.startDate,
      endDate: tours.endDate,
      comedianName: comedians.stageName,
    })
    .from(tours)
    .leftJoin(comedians, eq(tours.comedianId, comedians.id))
    .where(and(...conds))
    .orderBy(asc(tours.startDate));

  const hasFilters = Boolean(q || status || date);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Production"
        title="Tours"
        description={`${rows.length} ${rows.length === 1 ? "tour" : "tours"}${hasFilters ? " matched" : " in flight"}`}
        actions={
          canCreate ? (
            <Link href="/tours/new">
              <Button variant="accent">Add tour</Button>
            </Link>
          ) : null
        }
      />

      <form
        method="get"
        className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-surface p-3"
      >
        <div className="flex-1 min-w-[12rem]">
          <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">
            Search
          </label>
          <Input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Tour name or comedian"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">
            Status
          </label>
          <Select name="status" defaultValue={status}>
            <option value="">All</option>
            {TOUR_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">
            Active on
          </label>
          <Input type="date" name="date" defaultValue={date} />
        </div>
        <div className="flex gap-2">
          <Button type="submit" variant="accent">
            Filter
          </Button>
          {hasFilters && (
            <Link href="/tours">
              <Button type="button" variant="ghost">
                Clear
              </Button>
            </Link>
          )}
        </div>
      </form>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {hasFilters
            ? "No tours match those filters."
            : "No tours yet. Create your first tour to start scheduling shows."}
        </p>
      ) : (
        <div className="rounded-lg border border-border bg-background">
          <Table>
            <THead>
              <TR>
                <TH>Name</TH>
                <TH>Comedian</TH>
                <TH>Dates</TH>
                <TH>Status</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((t) => (
                <TR key={t.id}>
                  <TD>
                    <Link
                      href={`/tours/${t.id}`}
                      className="font-medium hover:underline"
                    >
                      {t.name}
                    </Link>
                  </TD>
                  <TD>{t.comedianName ?? "—"}</TD>
                  <TD>
                    {formatDate(t.startDate)} – {formatDate(t.endDate)}
                  </TD>
                  <TD>
                    <StatusPill status={t.status} />
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      )}
    </div>
  );
}
