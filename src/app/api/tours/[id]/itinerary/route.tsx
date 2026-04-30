import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { requireOrg } from "@/lib/auth";
import { loadItineraryData, buildDayBuckets } from "@/lib/itinerary";
import { ItineraryDocument } from "./itinerary-document";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: tourId } = await params;
  const { orgId } = await requireOrg();

  const data = await loadItineraryData(orgId, tourId);
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
