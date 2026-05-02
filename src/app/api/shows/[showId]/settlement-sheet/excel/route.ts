import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import * as XLSX from "xlsx";
import { db } from "@/db/client";
import { shows, tours, venues, accommodations, travel } from "@/db/schema";
import { requireOrg } from "@/lib/auth";
import { getTourRole } from "@/lib/permissions";
import { computeShowFinancials } from "@/lib/finance";

export const dynamic = "force-dynamic";

function pence(n: number): string {
  return (n / 100).toFixed(2);
}

function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toISOString().slice(0, 10);
}

export async function GET(
  _req: Request,
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
  const fin = computeShowFinancials(show, accomTotal, travelTotal);

  const showDate = fmtDate(show.showDate);
  const venueName = venue?.name ?? "";
  const city = venue?.city ?? show.city ?? "";

  type Row = {
    Date: string;
    Venue: string;
    City: string;
    Category: string;
    Description: string;
    Type: string;
    "Amount (£)": string;
  };

  const rows: Row[] = [];

  // Revenue
  const ticketDesc =
    fin.ticketsSold > 0 && show.ticketPricePence
      ? `Ticket sales (${fin.ticketsSold} × £${pence(show.ticketPricePence)})`
      : fin.isEstimated
        ? `Estimated ticket sales (${show.estTicketsSold ?? 0} × £${pence(show.ticketPricePence ?? 0)})`
        : "Ticket sales";

  rows.push({
    Date: showDate,
    Venue: venueName,
    City: city,
    Category: "Tickets",
    Description: ticketDesc,
    Type: "Revenue",
    "Amount (£)": pence(fin.ticketRevenuePence),
  });

  // Expenses
  if (fin.venueFeePence > 0) {
    rows.push({
      Date: showDate,
      Venue: venueName,
      City: city,
      Category: "Venue",
      Description: "Venue hire fee",
      Type: "Expense",
      "Amount (£)": pence(fin.venueFeePence),
    });
  }

  for (const a of showAccoms) {
    if ((a.costPence ?? 0) > 0) {
      rows.push({
        Date: a.checkIn ? fmtDate(a.checkIn) : showDate,
        Venue: venueName,
        City: city,
        Category: "Accommodation",
        Description: a.hotelName ?? "Accommodation",
        Type: "Expense",
        "Amount (£)": pence(a.costPence ?? 0),
      });
    }
  }

  for (const t of showTravel) {
    if ((t.costPence ?? 0) > 0) {
      const desc =
        t.departureLocation && t.arrivalLocation
          ? `${t.departureLocation} → ${t.arrivalLocation}`
          : t.travelType ?? "Travel";
      rows.push({
        Date: t.departureAt ? fmtDate(t.departureAt) : showDate,
        Venue: venueName,
        City: city,
        Category: "Travel",
        Description: desc,
        Type: "Expense",
        "Amount (£)": pence(t.costPence ?? 0),
      });
    }
  }

  if (fin.marketingPence > 0) {
    rows.push({
      Date: showDate,
      Venue: venueName,
      City: city,
      Category: "Marketing",
      Description: "Marketing budget",
      Type: "Expense",
      "Amount (£)": pence(fin.marketingPence),
    });
  }

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Settlement");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  const safeName = (venue?.name ?? tour.name).replace(/[^a-zA-Z0-9-_ ]/g, "").trim();
  const filename = `settlement-${showDate}-${safeName}.xlsx`;

  return new Response(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
