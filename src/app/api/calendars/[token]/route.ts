import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import {
  calendarTokens,
  shows,
  tours,
  venues,
  comedians,
} from "@/db/schema";
import { buildIcs, combineShowDateTime, type IcsEvent } from "@/lib/ics";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  const [t] = await db
    .select()
    .from(calendarTokens)
    .where(eq(calendarTokens.token, token))
    .limit(1);

  if (!t || t.revokedAt) {
    return new Response("Not found", { status: 404 });
  }

  // Resolve shows for the scope.
  let rows: Array<{
    id: string;
    showDate: string;
    showTime: string | null;
    city: string | null;
    venueName: string | null;
    venueCity: string | null;
    notes: string | null;
    tourName: string;
    comedianName: string;
  }> = [];

  const baseQuery = db
    .select({
      id: shows.id,
      showDate: shows.showDate,
      showTime: shows.showTime,
      city: shows.city,
      venueName: venues.name,
      venueCity: venues.city,
      notes: shows.notes,
      tourName: tours.name,
      comedianName: comedians.stageName,
    })
    .from(shows)
    .leftJoin(venues, eq(shows.venueId, venues.id))
    .innerJoin(tours, eq(shows.tourId, tours.id))
    .innerJoin(comedians, eq(tours.comedianId, comedians.id));

  if (t.scope === "org") {
    rows = await baseQuery.where(
      and(eq(shows.orgId, t.orgId), isNull(shows.archivedAt)),
    );
  } else if (t.scope === "tour" && t.scopeId) {
    // Tour scope: a collaborator on a shared tour may have a token whose
    // org_id matches the tour's owning org (set at creation time). Trust
    // the tour_id constraint alone — the token itself is the bearer credential.
    rows = await baseQuery.where(
      and(
        eq(shows.tourId, t.scopeId),
        isNull(shows.archivedAt),
      ),
    );
  } else if (t.scope === "comedian" && t.scopeId) {
    rows = await baseQuery.where(
      and(
        eq(shows.orgId, t.orgId),
        eq(tours.comedianId, t.scopeId),
        isNull(shows.archivedAt),
      ),
    );
  }

  // Update last_used (best-effort).
  try {
    await db
      .update(calendarTokens)
      .set({ lastUsedAt: new Date() })
      .where(eq(calendarTokens.id, t.id));
  } catch {
    // ignore
  }

  const events: IcsEvent[] = rows.map((r) => {
    const { start, end } = combineShowDateTime(r.showDate, r.showTime);
    const loc = [r.venueName, r.city ?? r.venueCity].filter(Boolean).join(", ");
    const summary = `${r.comedianName} — ${r.tourName}`;
    return {
      uid: `${r.id}@comedy-tour-manager`,
      summary,
      description: r.notes ?? null,
      location: loc || null,
      start,
      end,
    };
  });

  const ics = buildIcs({
    calendarName: t.label ?? "Comedy tour calendar",
    events,
  });

  return new Response(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
