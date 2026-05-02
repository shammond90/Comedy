import { NextResponse } from "next/server";
import { and, asc, eq, isNull } from "drizzle-orm";
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
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: tourId } = await params;
  const { user } = await requireOrg();

  const tourRole = await getTourRole(user.id, tourId);
  if (!tourRole) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [tour] = await db
    .select()
    .from(tours)
    .where(eq(tours.id, tourId))
    .limit(1);

  if (!tour) {
    return NextResponse.json({ error: "Tour not found" }, { status: 404 });
  }

  // Load all completed shows for this tour, sorted by date
  const tourShows = await db
    .select()
    .from(shows)
    .where(
      and(
        eq(shows.tourId, tourId),
        eq(shows.orgId, tour.orgId),
        eq(shows.status, "completed"),
        isNull(shows.archivedAt),
      ),
    )
    .orderBy(asc(shows.showDate));

  if (tourShows.length === 0) {
    return NextResponse.json({ error: "No completed shows found" }, { status: 404 });
  }

  const showIds = tourShows.map((s) => s.id);

  // Load venue names
  const venueIds = [...new Set(tourShows.map((s) => s.venueId).filter(Boolean))] as string[];
  const venueRows = venueIds.length > 0
    ? await db.select().from(venues).where(and(eq(venues.orgId, tour.orgId)))
    : [];
  const venueMap = new Map(venueRows.map((v) => [v.id, v]));

  // Load all accommodations and travel for these shows
  const allAccoms = await db
    .select()
    .from(accommodations)
    .where(eq(accommodations.orgId, tour.orgId));
  const showAccoms = allAccoms.filter((a) => showIds.includes(a.showId));

  const allTravel = await db
    .select()
    .from(travel)
    .where(eq(travel.orgId, tour.orgId));
  const showTravel = allTravel.filter((t) => showIds.includes(t.showId));

  // Group by showId
  const accomsByShow = new Map<string, typeof showAccoms>();
  for (const a of showAccoms) {
    const arr = accomsByShow.get(a.showId) ?? [];
    arr.push(a);
    accomsByShow.set(a.showId, arr);
  }

  const travelByShow = new Map<string, typeof showTravel>();
  for (const t of showTravel) {
    const arr = travelByShow.get(t.showId) ?? [];
    arr.push(t);
    travelByShow.set(t.showId, arr);
  }

  type Row = {
    Date: string;
    Show: string;
    Venue: string;
    City: string;
    Category: string;
    Description: string;
    Type: string;
    "Amount (£)": string;
  };

  const rows: Row[] = [];

  for (const show of tourShows) {
    const venue = show.venueId ? (venueMap.get(show.venueId) ?? null) : null;
    const venueName = venue?.name ?? "";
    const city = venue?.city ?? show.city ?? "";
    const showDate = fmtDate(show.showDate);
    const showLabel = showDate || tour.name;

    const accomsForShow = accomsByShow.get(show.id) ?? [];
    const travelForShow = travelByShow.get(show.id) ?? [];

    const accomTotal = accomsForShow.reduce((s, a) => s + (a.costPence ?? 0), 0);
    const travelTotal = travelForShow.reduce((s, t) => s + (t.costPence ?? 0), 0);
    const fin = computeShowFinancials(show, accomTotal, travelTotal);

    // Revenue row
    const ticketDesc =
      fin.ticketsSold > 0 && show.ticketPricePence
        ? `Ticket sales (${fin.ticketsSold} × £${pence(show.ticketPricePence)})`
        : fin.isEstimated
          ? `Estimated ticket sales (${show.estTicketsSold ?? 0} × £${pence(show.ticketPricePence ?? 0)})`
          : "Ticket sales";

    rows.push({
      Date: showDate,
      Show: showLabel,
      Venue: venueName,
      City: city,
      Category: "Tickets",
      Description: ticketDesc,
      Type: "Revenue",
      "Amount (£)": pence(fin.ticketRevenuePence),
    });

    // Expense rows
    if (fin.venueFeePence > 0) {
      rows.push({
        Date: showDate,
        Show: showLabel,
        Venue: venueName,
        City: city,
        Category: "Venue",
        Description: "Venue hire fee",
        Type: "Expense",
        "Amount (£)": pence(fin.venueFeePence),
      });
    }

    for (const a of accomsForShow) {
      if ((a.costPence ?? 0) > 0) {
        rows.push({
          Date: a.checkIn ? fmtDate(a.checkIn) : showDate,
          Show: showLabel,
          Venue: venueName,
          City: city,
          Category: "Accommodation",
          Description: a.hotelName ?? "Accommodation",
          Type: "Expense",
          "Amount (£)": pence(a.costPence ?? 0),
        });
      }
    }

    for (const t of travelForShow) {
      if ((t.costPence ?? 0) > 0) {
        const desc =
          t.departureLocation && t.arrivalLocation
            ? `${t.departureLocation} → ${t.arrivalLocation}`
            : t.travelType ?? "Travel";
        rows.push({
          Date: t.departureAt ? fmtDate(t.departureAt) : showDate,
          Show: showLabel,
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
        Show: showLabel,
        Venue: venueName,
        City: city,
        Category: "Marketing",
        Description: "Marketing budget",
        Type: "Expense",
        "Amount (£)": pence(fin.marketingPence),
      });
    }
  }

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Settlement");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const safeName = tour.name.replace(/[^a-zA-Z0-9-_ ]/g, "").trim();
  const filename = `settlement-tour-${safeName}.xlsx`;

  return new Response(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
