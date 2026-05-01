import Link from "next/link";
import { and, asc, eq, ilike, isNull, or } from "drizzle-orm";
import { db } from "@/db/client";
import { comedians, shows, tours, venues } from "@/db/schema";
import { requireOrg } from "@/lib/auth";
import { visibleTourCondition } from "@/lib/permissions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const LIMIT = 8;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { user, orgId } = await requireOrg();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const p = `%${q}%`;

  const tourVisibility = await visibleTourCondition(user.id);

  const [tourRows, venueRows, comedianRows, showRows] = q
    ? await Promise.all([
        db
          .select({
            id: tours.id,
            name: tours.name,
            startDate: tours.startDate,
            endDate: tours.endDate,
            comedianName: comedians.stageName,
          })
          .from(tours)
          .leftJoin(comedians, eq(tours.comedianId, comedians.id))
          .where(
            and(
              isNull(tours.archivedAt),
              tourVisibility ?? eq(tours.orgId, orgId),
              or(
                ilike(tours.name, p),
                ilike(comedians.stageName, p),
                ilike(tours.description, p),
              )!,
            ),
          )
          .orderBy(asc(tours.name))
          .limit(LIMIT),

        db
          .select()
          .from(venues)
          .where(
            and(
              eq(venues.orgId, orgId),
              isNull(venues.archivedAt),
              or(
                ilike(venues.name, p),
                ilike(venues.city, p),
                ilike(venues.country, p),
                ilike(venues.postcode, p),
                ilike(venues.primaryContactName, p),
                ilike(venues.primaryContactEmail, p),
                ilike(venues.notes, p),
              )!,
            ),
          )
          .orderBy(asc(venues.name))
          .limit(LIMIT),

        db
          .select()
          .from(comedians)
          .where(
            and(
              eq(comedians.orgId, orgId),
              isNull(comedians.archivedAt),
              or(
                ilike(comedians.stageName, p),
                ilike(comedians.legalName, p),
                ilike(comedians.email, p),
                ilike(comedians.agentName, p),
                ilike(comedians.agentEmail, p),
              )!,
            ),
          )
          .orderBy(asc(comedians.stageName))
          .limit(LIMIT),

        db
          .select({
            id: shows.id,
            tourId: shows.tourId,
            showDate: shows.showDate,
            city: shows.city,
            tourName: tours.name,
            venueName: venues.name,
          })
          .from(shows)
          .leftJoin(tours, eq(tours.id, shows.tourId))
          .leftJoin(venues, eq(venues.id, shows.venueId))
          .where(
            and(
              isNull(shows.archivedAt),
              tourVisibility ?? eq(shows.orgId, orgId),
              or(
                ilike(tours.name, p),
                ilike(venues.name, p),
                ilike(shows.city, p),
                ilike(shows.notes, p),
              )!,
            ),
          )
          .orderBy(asc(shows.showDate))
          .limit(LIMIT),
      ])
    : [[], [], [], []];

  const total =
    tourRows.length + venueRows.length + comedianRows.length + showRows.length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Search"
        title={q ? `Results for "${q}"` : "Search"}
        description={q ? `${total} match${total === 1 ? "" : "es"}` : "Search across tours, shows, venues, and comedians."}
      />

      <form method="get" className="flex gap-2 max-w-xl">
        <Input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search everything…"
          autoFocus
        />
        <Button type="submit" variant="accent">
          Search
        </Button>
      </form>

      {q && total === 0 && (
        <p className="text-sm text-muted-foreground">
          No matches. Try a shorter or different term.
        </p>
      )}

      {tourRows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tours</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {tourRows.map((t) => (
                <li key={t.id} className="py-2">
                  <Link
                    href={`/tours/${t.id}`}
                    className="block hover:underline"
                  >
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.comedianName ?? "—"}
                      {t.startDate
                        ? ` · ${formatDate(t.startDate)}${t.endDate ? ` – ${formatDate(t.endDate)}` : ""}`
                        : ""}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {showRows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Shows</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {showRows.map((s) => (
                <li key={s.id} className="py-2">
                  <Link
                    href={`/tours/${s.tourId}/shows/${s.id}`}
                    className="block hover:underline"
                  >
                    <p className="text-sm font-medium">
                      {formatDate(s.showDate)} ·{" "}
                      {[s.venueName, s.city].filter(Boolean).join(", ") ||
                        "Venue TBC"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {s.tourName}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {venueRows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Venues</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {venueRows.map((v) => (
                <li key={v.id} className="py-2">
                  <Link
                    href={`/venues/${v.id}`}
                    className="block hover:underline"
                  >
                    <p className="text-sm font-medium">{v.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {[v.city, v.country].filter(Boolean).join(", ") || "—"}
                      {v.capacity ? ` · cap ${v.capacity}` : ""}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {comedianRows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Comedians</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {comedianRows.map((c) => (
                <li key={c.id} className="py-2">
                  <Link
                    href={`/comedians/${c.id}`}
                    className="block hover:underline"
                  >
                    <p className="text-sm font-medium">{c.stageName}</p>
                    <p className="text-xs text-muted-foreground">
                      {[c.agentName, c.email].filter(Boolean).join(" · ") ||
                        "—"}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
