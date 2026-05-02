import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { renderToBuffer } from "@react-pdf/renderer";
import { db } from "@/db/client";
import { shows, tours, venues, comedians, accommodations, travel } from "@/db/schema";
import { requireOrg } from "@/lib/auth";
import { getTourRole } from "@/lib/permissions";
import { computeShowFinancials } from "@/lib/finance";
import { SettlementDocument, type SettlementType } from "./settlement-document";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ showId: string }> },
) {
  const { showId } = await params;
  const { user } = await requireOrg();

  const [show] = await db
    .select()
    .from(shows)
    .where(and(eq(shows.id, showId), isNull(shows.archivedAt)))
    .limit(1);

  if (!show) {
    return NextResponse.json({ error: "Show not found" }, { status: 404 });
  }

  const tourRole = await getTourRole(user.id, show.tourId);
  if (!tourRole) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const url = new URL(req.url);
  const rawType = url.searchParams.get("type") ?? "summary";
  const type: SettlementType =
    rawType === "full" || rawType === "contract" ? rawType : "summary";

  const [tour] = await db
    .select()
    .from(tours)
    .where(eq(tours.id, show.tourId))
    .limit(1);

  if (!tour) {
    return NextResponse.json({ error: "Tour not found" }, { status: 404 });
  }

  const [venue] = show.venueId
    ? await db
        .select()
        .from(venues)
        .where(and(eq(venues.id, show.venueId), eq(venues.orgId, show.orgId)))
        .limit(1)
    : [null];

  const [comedian] = tour.comedianId
    ? await db
        .select()
        .from(comedians)
        .where(and(eq(comedians.id, tour.comedianId), eq(comedians.orgId, show.orgId)))
        .limit(1)
    : [null];

  const showAccoms = await db
    .select()
    .from(accommodations)
    .where(and(eq(accommodations.showId, showId), eq(accommodations.orgId, show.orgId)));

  const showTravel = await db
    .select()
    .from(travel)
    .where(and(eq(travel.showId, showId), eq(travel.orgId, show.orgId)));

  const accomTotal = showAccoms.reduce((sum, a) => sum + (a.costPence ?? 0), 0);
  const travelTotal = showTravel.reduce((sum, t) => sum + (t.costPence ?? 0), 0);
  const financials = computeShowFinancials(show, accomTotal, travelTotal);

  const venueName = venue?.name ?? "show";
  const dateStr = show.showDate.replace(/-/g, "");
  const filename = `settlement_${dateStr}_${venueName.replace(/[^a-z0-9]+/gi, "_")}_${type}.pdf`;

  const buffer = await renderToBuffer(
    <SettlementDocument
      data={{
        type,
        show,
        tour,
        venue: venue ?? null,
        comedian: comedian ?? null,
        accommodations: showAccoms,
        travel: showTravel,
        financials,
      }}
    />,
  );

  const blob = new Blob([new Uint8Array(buffer)], { type: "application/pdf" });
  return new Response(blob, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
