import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { renderToBuffer } from "@react-pdf/renderer";
import { db } from "@/db/client";
import { tours } from "@/db/schema";
import { requireOrg } from "@/lib/auth";
import { getTourRole } from "@/lib/permissions";
import { loadItineraryData, buildDayBuckets } from "@/lib/itinerary";
import { ItineraryDocument } from "./itinerary-document";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: tourId } = await params;
  const { user } = await requireOrg();

  const tourRole = await getTourRole(user.id, tourId);
  if (!tourRole) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [tourRow] = await db
    .select({ orgId: tours.orgId })
    .from(tours)
    .where(eq(tours.id, tourId))
    .limit(1);
  if (!tourRow) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const data = await loadItineraryData(tourRow.orgId, tourId);
  if (!data) {
    return NextResponse.json({ error: "Tour not found" }, { status: 404 });
  }

  const days = buildDayBuckets(data);

  const buffer = await renderToBuffer(
    <ItineraryDocument data={data} days={days} />,
  );
  const blob = new Blob([new Uint8Array(buffer)], {
    type: "application/pdf",
  });
  return new Response(blob, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${data.tour.name.replace(/[^a-z0-9]+/gi, "_")}_itinerary.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
