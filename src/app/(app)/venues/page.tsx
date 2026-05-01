import Link from "next/link";
import { and, asc, eq, gte, ilike, inArray, isNull, lte, or } from "drizzle-orm";
import { db } from "@/db/client";
import { venues } from "@/db/schema";
import { requireOrg } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { PageHeader } from "@/components/app/page-header";

const VENUE_TYPES = [
  "comedy_club",
  "theatre",
  "arena",
  "arts_centre",
  "pub",
  "other",
] as const;

const CAPACITY_OPS = ["", "lt", "gt", "between"] as const;

export default async function VenuesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    type?: string;
    capOp?: string;
    capMin?: string;
    capMax?: string;
  }>;
}) {
  const { orgId } = await requireOrg();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const type = (sp.type ?? "").trim();
  const capOp = (sp.capOp ?? "").trim();
  const capMin = (sp.capMin ?? "").trim();
  const capMax = (sp.capMax ?? "").trim();

  const conds = [eq(venues.orgId, orgId), isNull(venues.archivedAt)];

  if (q) {
    const p = `%${q}%`;
    conds.push(
      or(
        ilike(venues.name, p),
        ilike(venues.city, p),
        ilike(venues.country, p),
        ilike(venues.postcode, p),
        ilike(venues.primaryContactName, p),
        ilike(venues.primaryContactEmail, p),
        ilike(venues.secondaryContactName, p),
        ilike(venues.secondaryContactEmail, p),
        ilike(venues.technicalContactName, p),
        ilike(venues.technicalContactEmail, p),
        ilike(venues.notes, p),
      )!,
    );
  }

  if (type && (VENUE_TYPES as readonly string[]).includes(type)) {
    conds.push(
      inArray(venues.venueType, [type as (typeof VENUE_TYPES)[number]]),
    );
  }

  const minN = capMin ? Number.parseInt(capMin, 10) : NaN;
  const maxN = capMax ? Number.parseInt(capMax, 10) : NaN;
  if (capOp === "lt" && Number.isFinite(maxN)) {
    conds.push(lte(venues.capacity, maxN));
  } else if (capOp === "gt" && Number.isFinite(minN)) {
    conds.push(gte(venues.capacity, minN));
  } else if (
    capOp === "between" &&
    Number.isFinite(minN) &&
    Number.isFinite(maxN)
  ) {
    conds.push(gte(venues.capacity, minN));
    conds.push(lte(venues.capacity, maxN));
  }

  const rows = await db
    .select()
    .from(venues)
    .where(and(...conds))
    .orderBy(asc(venues.name));

  const hasFilters = Boolean(q || type || capOp);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Network"
        title="Venues"
        description={`${rows.length} ${rows.length === 1 ? "venue" : "venues"}${hasFilters ? " matched" : " on file"}`}
        actions={
          <Link href="/venues/new">
            <Button variant="accent">Add venue</Button>
          </Link>
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
            placeholder="Name, city, contact…"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">
            Type
          </label>
          <Select name="type" defaultValue={type}>
            <option value="">All</option>
            {VENUE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, " ")}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">
            Capacity
          </label>
          <Select name="capOp" defaultValue={capOp}>
            <option value="">Any</option>
            <option value="lt">Less than</option>
            <option value="gt">More than</option>
            <option value="between">Between</option>
          </Select>
        </div>
        {(capOp === "gt" || capOp === "between") && (
          <div>
            <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">
              Min
            </label>
            <Input
              type="number"
              name="capMin"
              defaultValue={capMin}
              min={0}
              className="w-24"
            />
          </div>
        )}
        {(capOp === "lt" || capOp === "between") && (
          <div>
            <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">
              Max
            </label>
            <Input
              type="number"
              name="capMax"
              defaultValue={capMax}
              min={0}
              className="w-24"
            />
          </div>
        )}
        <div className="flex gap-2">
          <Button type="submit" variant="accent">
            Filter
          </Button>
          {hasFilters && (
            <Link href="/venues">
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
            ? "No venues match those filters."
            : "No venues yet. Add your first one to get started."}
        </p>
      ) : (
        <div className="rounded-lg border border-border bg-background">
          <Table>
            <THead>
              <TR>
                <TH>Name</TH>
                <TH>City</TH>
                <TH>Type</TH>
                <TH className="text-right">Capacity</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((v) => (
                <TR key={v.id}>
                  <TD>
                    <Link
                      href={`/venues/${v.id}`}
                      className="font-medium hover:underline"
                    >
                      {v.name}
                    </Link>
                  </TD>
                  <TD>{v.city ?? "—"}</TD>
                  <TD className="capitalize">
                    {v.venueType.replace(/_/g, " ")}
                  </TD>
                  <TD className="text-right tabular-nums">
                    {v.capacity ?? "—"}
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

void CAPACITY_OPS;
