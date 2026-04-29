import { NextResponse } from "next/server";
import { and, asc, eq, isNull } from "drizzle-orm";
import { renderToBuffer } from "@react-pdf/renderer";
import { db } from "@/db/client";
import {
  tours,
  shows,
  venues,
  comedians,
  accommodations,
  travel,
  reminders,
} from "@/db/schema";
import { requireOrg } from "@/lib/auth";
import { TourBookDocument } from "./tour-book-document";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: tourId } = await params;
  const { orgId } = await requireOrg();

  const [tour] = await db
    .select()
    .from(tours)
    .where(and(eq(tours.id, tourId), eq(tours.orgId, orgId)))
    .limit(1);
  if (!tour) {
    return NextResponse.json({ error: "Tour not found" }, { status: 404 });
  }

  const [comedian] = await db
    .select()
    .from(comedians)
    .where(and(eq(comedians.id, tour.comedianId), eq(comedians.orgId, orgId)))
    .limit(1);

  const showRows = await db
    .select({
      show: shows,
      venue: venues,
    })
    .from(shows)
    .leftJoin(venues, eq(venues.id, shows.venueId))
    .where(
      and(
        eq(shows.orgId, orgId),
        eq(shows.tourId, tourId),
        isNull(shows.archivedAt),
      ),
    )
    .orderBy(asc(shows.showDate));

  const showIds = showRows.map((r) => r.show.id);
  const allAccom = showIds.length
    ? await db
        .select()
        .from(accommodations)
        .where(eq(accommodations.orgId, orgId))
    : [];
  const allTravel = showIds.length
    ? await db.select().from(travel).where(eq(travel.orgId, orgId))
    : [];
  const allReminders = await db
    .select()
    .from(reminders)
    .where(and(eq(reminders.orgId, orgId), eq(reminders.tourId, tourId)));

  const data = {
    tour,
    comedian: comedian ?? null,
    shows: showRows.map((r) => ({
      show: r.show,
      venue: r.venue,
      accommodations: allAccom.filter((a) => a.showId === r.show.id),
      travel: allTravel.filter((t) => t.showId === r.show.id),
    })),
    reminders: allReminders,
  };

  const buffer = await renderToBuffer(<TourBookDocument data={data} />);
  // Convert Node Buffer to a Blob so it satisfies BodyInit in TS lib defs.
  const blob = new Blob([new Uint8Array(buffer)], {
    type: "application/pdf",
  });
  return new Response(blob, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${tour.name.replace(/[^a-z0-9]+/gi, "_")}_tour_book.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
