import {
  shows,
  accommodations,
  travel,
  tours,
  venues,
  comedians,
  type Show,
  type Accommodation,
  type Travel,
} from "@/db/schema";
import { db } from "@/db/client";
import { and, desc, eq, isNull, sum, count, asc, gte } from "drizzle-orm";

export type ShowFinancials = {
  ticketsSold: number;
  ticketsComped: number;
  capacityRemaining: number | null;
  ticketRevenuePence: number;
  venueFeePence: number;
  accommodationPence: number;
  travelPence: number;
  marketingPence: number;
  totalCostsPence: number;
  netPence: number;
  occupancyPercent: number | null;
  /** True when revenue is driven by estimated (not actual) ticket data */
  isEstimated: boolean;
};

/**
 * Revenue priority:
 *  1. actual_revenue_pence is set → use it (isEstimated = false)
 *  2. est_tickets_sold is set → est × ticket_price (isEstimated = true)
 *  3. fallback → 0
 */
export function computeShowFinancials(
  show: Show,
  accommodationTotal: number,
  travelTotal: number,
): ShowFinancials {
  const ticketsSold = show.ticketsSold ?? 0;
  const ticketsComped = show.ticketsComped ?? 0;

  let ticketRevenuePence: number;
  let isEstimated: boolean;

  if (show.actualRevenuePence != null) {
    ticketRevenuePence = show.actualRevenuePence;
    isEstimated = false;
  } else if (show.estTicketsSold != null && show.estTicketsSold > 0) {
    ticketRevenuePence = show.estTicketsSold * (show.ticketPricePence ?? 0);
    isEstimated = true;
  } else {
    ticketRevenuePence = 0;
    isEstimated = false;
  }

  const capacityRemaining =
    show.ticketCapacity != null
      ? Math.max(0, show.ticketCapacity - ticketsSold - ticketsComped)
      : null;

  const occupancyPercent =
    show.ticketCapacity && show.ticketCapacity > 0
      ? Math.round(((ticketsSold + ticketsComped) / show.ticketCapacity) * 100)
      : null;

  const venueFeePence = show.venueHireFeePence ?? 0;
  const marketingPence = show.marketingBudgetPence ?? 0;
  const totalCostsPence =
    venueFeePence + accommodationTotal + travelTotal + marketingPence;
  const netPence = ticketRevenuePence - totalCostsPence;

  return {
    ticketsSold,
    ticketsComped,
    capacityRemaining,
    ticketRevenuePence,
    venueFeePence,
    accommodationPence: accommodationTotal,
    travelPence: travelTotal,
    marketingPence,
    totalCostsPence,
    netPence,
    occupancyPercent,
    isEstimated,
  };
}

/**
 * Fetch financial summaries for every show in a tour, plus aggregated
 * tour-level totals. Used by tour dashboard, P&L exports, etc.
 */
export async function getTourFinancials(orgId: string, tourId: string) {
  const showRows = await db
    .select()
    .from(shows)
    .where(
      and(
        eq(shows.orgId, orgId),
        eq(shows.tourId, tourId),
        isNull(shows.archivedAt),
      ),
    )
    .orderBy(asc(shows.showDate));

  // Aggregate accommodation + travel costs per show in two queries.
  const accomTotals = new Map<string, number>();
  const travelTotals = new Map<string, number>();

  if (showRows.length > 0) {
    const ids = showRows.map((s) => s.id);
    const allAccom = await db
      .select()
      .from(accommodations)
      .where(eq(accommodations.orgId, orgId));
    for (const a of allAccom) {
      if (ids.includes(a.showId)) {
        accomTotals.set(
          a.showId,
          (accomTotals.get(a.showId) ?? 0) + (a.costPence ?? 0),
        );
      }
    }
    const allTravel = await db
      .select()
      .from(travel)
      .where(eq(travel.orgId, orgId));
    for (const t of allTravel) {
      if (ids.includes(t.showId)) {
        travelTotals.set(
          t.showId,
          (travelTotals.get(t.showId) ?? 0) + (t.costPence ?? 0),
        );
      }
    }
  }

  const perShow = showRows.map((s) => ({
    show: s,
    fin: computeShowFinancials(
      s,
      accomTotals.get(s.id) ?? 0,
      travelTotals.get(s.id) ?? 0,
    ),
  }));

  const totals = perShow.reduce(
    (acc, { fin }) => {
      acc.revenuePence += fin.ticketRevenuePence;
      acc.venueFeePence += fin.venueFeePence;
      acc.accommodationPence += fin.accommodationPence;
      acc.travelPence += fin.travelPence;
      acc.marketingPence += fin.marketingPence;
      acc.costsPence += fin.totalCostsPence;
      acc.netPence += fin.netPence;
      acc.ticketsSold += fin.ticketsSold;
      if (fin.isEstimated) acc.hasEstimates = true;
      return acc;
    },
    {
      revenuePence: 0,
      venueFeePence: 0,
      accommodationPence: 0,
      travelPence: 0,
      marketingPence: 0,
      costsPence: 0,
      netPence: 0,
      ticketsSold: 0,
      hasEstimates: false,
    },
  );

  return { perShow, totals, showCount: perShow.length };
}

export async function getShowFinancials(orgId: string, showId: string) {
  const [show] = await db
    .select()
    .from(shows)
    .where(and(eq(shows.id, showId), eq(shows.orgId, orgId)))
    .limit(1);
  if (!show) return null;

  const accomRows = await db
    .select()
    .from(accommodations)
    .where(
      and(eq(accommodations.orgId, orgId), eq(accommodations.showId, showId)),
    );
  const travelRows = await db
    .select()
    .from(travel)
    .where(and(eq(travel.orgId, orgId), eq(travel.showId, showId)));

  const accomTotal = accomRows.reduce((s, r) => s + (r.costPence ?? 0), 0);
  const travelTotal = travelRows.reduce((s, r) => s + (r.costPence ?? 0), 0);

  return {
    show,
    accommodations: accomRows,
    travel: travelRows,
    fin: computeShowFinancials(show, accomTotal, travelTotal),
  };
}

// Shut up unused-import linter for shared types
export type { Show, Accommodation, Travel };
// Also re-export common helpers for query consumers.
export { sum, count, gte };

/* -------------------------------------------------------------------------- */
/* Per-comedian aggregations                                                  */
/* -------------------------------------------------------------------------- */

export type ComedianStats = {
  showCount: number;
  tourCount: number;
  firstShowDate: string | null;
  lastShowDate: string | null;
  statusCounts: Record<string, number>;
  ticketsSold: number;
  revenuePence: number;
  costsPence: number;
  netPence: number;
  avgRevenuePerShow: number;
  /** Average across shows that have a capacity set */
  avgOccupancyPercent: number | null;
  hasEstimates: boolean;
  topVenues: Array<{ name: string; count: number }>;
  topCities: Array<{ city: string; count: number }>;
};

export async function getComedianStats(
  orgId: string,
  comedianId: string,
): Promise<ComedianStats> {
  // All non-archived tours for this comedian
  const tourRows = await db
    .select({ id: tours.id })
    .from(tours)
    .where(
      and(
        eq(tours.orgId, orgId),
        eq(tours.comedianId, comedianId),
        isNull(tours.archivedAt),
      ),
    );
  const tourIds = tourRows.map((t) => t.id);

  if (tourIds.length === 0) {
    return {
      showCount: 0,
      tourCount: 0,
      firstShowDate: null,
      lastShowDate: null,
      statusCounts: {},
      ticketsSold: 0,
      revenuePence: 0,
      costsPence: 0,
      netPence: 0,
      avgRevenuePerShow: 0,
      avgOccupancyPercent: null,
      hasEstimates: false,
      topVenues: [],
      topCities: [],
    };
  }

  // All shows joined with venue (for venue/city rollups). Drizzle's `inArray`
  // would be cleaner but we filter in JS for simplicity given org scoping.
  const showRows = await db
    .select({ show: shows, venue: venues })
    .from(shows)
    .leftJoin(venues, eq(venues.id, shows.venueId))
    .where(and(eq(shows.orgId, orgId), isNull(shows.archivedAt)))
    .orderBy(asc(shows.showDate));
  const myShowRows = showRows.filter((r) => tourIds.includes(r.show.tourId));

  // Aggregate accommodation + travel costs per show
  const accomTotals = new Map<string, number>();
  const travelTotals = new Map<string, number>();
  if (myShowRows.length > 0) {
    const showIds = myShowRows.map((r) => r.show.id);
    const allAccom = await db
      .select()
      .from(accommodations)
      .where(eq(accommodations.orgId, orgId));
    for (const a of allAccom) {
      if (showIds.includes(a.showId)) {
        accomTotals.set(a.showId, (accomTotals.get(a.showId) ?? 0) + (a.costPence ?? 0));
      }
    }
    const allTravel = await db
      .select()
      .from(travel)
      .where(eq(travel.orgId, orgId));
    for (const t of allTravel) {
      if (showIds.includes(t.showId)) {
        travelTotals.set(t.showId, (travelTotals.get(t.showId) ?? 0) + (t.costPence ?? 0));
      }
    }
  }

  let revenuePence = 0;
  let costsPence = 0;
  let ticketsSold = 0;
  let occupancyTotal = 0;
  let occupancyShows = 0;
  let hasEstimates = false;
  const statusCounts: Record<string, number> = {};
  const venueCounts = new Map<string, number>();
  const cityCounts = new Map<string, number>();

  for (const { show, venue } of myShowRows) {
    const fin = computeShowFinancials(
      show,
      accomTotals.get(show.id) ?? 0,
      travelTotals.get(show.id) ?? 0,
    );
    revenuePence += fin.ticketRevenuePence;
    costsPence += fin.totalCostsPence;
    ticketsSold += fin.ticketsSold;
    if (fin.isEstimated) hasEstimates = true;
    if (fin.occupancyPercent != null) {
      occupancyTotal += fin.occupancyPercent;
      occupancyShows += 1;
    }
    statusCounts[show.status] = (statusCounts[show.status] ?? 0) + 1;
    if (venue?.name) {
      venueCounts.set(venue.name, (venueCounts.get(venue.name) ?? 0) + 1);
    }
    const city = venue?.city ?? show.city;
    if (city) {
      cityCounts.set(city, (cityCounts.get(city) ?? 0) + 1);
    }
  }

  const topVenues = Array.from(venueCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));
  const topCities = Array.from(cityCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([city, count]) => ({ city, count }));

  return {
    showCount: myShowRows.length,
    tourCount: tourIds.length,
    firstShowDate: myShowRows[0]?.show.showDate ?? null,
    lastShowDate: myShowRows[myShowRows.length - 1]?.show.showDate ?? null,
    statusCounts,
    ticketsSold,
    revenuePence,
    costsPence,
    netPence: revenuePence - costsPence,
    avgRevenuePerShow:
      myShowRows.length > 0 ? Math.round(revenuePence / myShowRows.length) : 0,
    avgOccupancyPercent:
      occupancyShows > 0 ? Math.round(occupancyTotal / occupancyShows) : null,
    hasEstimates,
    topVenues,
    topCities,
  };
}

/* -------------------------------------------------------------------------- */
/* Org-wide report aggregations                                               */
/* -------------------------------------------------------------------------- */

export type OrgTourReport = {
  tourId: string;
  tourName: string;
  comedianName: string;
  status: string;
  startDate: string | null;
  showCount: number;
  revenuePence: number;
  costsPence: number;
  netPence: number;
  avgOccupancyPercent: number | null;
  hasEstimates: boolean;
};

export type OrgComedianReport = {
  comedianId: string;
  comedianName: string;
  tourCount: number;
  showCount: number;
  revenuePence: number;
  costsPence: number;
  netPence: number;
  avgRevenuePerShow: number;
  avgOccupancyPercent: number | null;
  hasEstimates: boolean;
};

export type OrgVenueReport = {
  venueId: string;
  venueName: string;
  city: string | null;
  showCount: number;
  revenuePence: number;
  avgOccupancyPercent: number | null;
};

export async function getOrgReportData(orgId: string): Promise<{
  tourReports: OrgTourReport[];
  comedianReports: OrgComedianReport[];
  venueReports: OrgVenueReport[];
}> {
  // Fetch all non-archived tours with comedian name
  const tourRows = await db
    .select({
      id: tours.id,
      name: tours.name,
      status: tours.status,
      startDate: tours.startDate,
      comedianId: tours.comedianId,
      comedianStageName: comedians.stageName,
    })
    .from(tours)
    .leftJoin(comedians, eq(comedians.id, tours.comedianId))
    .where(and(eq(tours.orgId, orgId), isNull(tours.archivedAt)));

  // Fetch all non-archived shows with venue
  const showRows = await db
    .select({ show: shows, venue: venues })
    .from(shows)
    .leftJoin(venues, eq(venues.id, shows.venueId))
    .where(and(eq(shows.orgId, orgId), isNull(shows.archivedAt)))
    .orderBy(asc(shows.showDate));

  // Accommodation + travel costs per show
  const accomTotals = new Map<string, number>();
  const travelTotals = new Map<string, number>();
  if (showRows.length > 0) {
    const allAccom = await db.select().from(accommodations).where(eq(accommodations.orgId, orgId));
    const allTravel = await db.select().from(travel).where(eq(travel.orgId, orgId));
    for (const a of allAccom) {
      accomTotals.set(a.showId, (accomTotals.get(a.showId) ?? 0) + (a.costPence ?? 0));
    }
    for (const t of allTravel) {
      travelTotals.set(t.showId, (travelTotals.get(t.showId) ?? 0) + (t.costPence ?? 0));
    }
  }

  // Build a tourId → comedian map
  const tourComedianMap = new Map(tourRows.map((t) => [t.id, t]));

  // ---- Tour reports ----
  const tourShowMap = new Map<string, typeof showRows>();
  for (const r of showRows) {
    const arr = tourShowMap.get(r.show.tourId) ?? [];
    arr.push(r);
    tourShowMap.set(r.show.tourId, arr);
  }

  const tourReports: OrgTourReport[] = tourRows.map((t) => {
    const myShows = tourShowMap.get(t.id) ?? [];
    let revenuePence = 0, costsPence = 0, occupancyTotal = 0, occupancyShows = 0;
    let hasEstimates = false;
    for (const { show } of myShows) {
      const fin = computeShowFinancials(show, accomTotals.get(show.id) ?? 0, travelTotals.get(show.id) ?? 0);
      revenuePence += fin.ticketRevenuePence;
      costsPence += fin.totalCostsPence;
      if (fin.isEstimated) hasEstimates = true;
      if (fin.occupancyPercent != null) { occupancyTotal += fin.occupancyPercent; occupancyShows++; }
    }
    return {
      tourId: t.id,
      tourName: t.name,
      comedianName: t.comedianStageName ?? "—",
      status: t.status,
      startDate: t.startDate,
      showCount: myShows.length,
      revenuePence,
      costsPence,
      netPence: revenuePence - costsPence,
      avgOccupancyPercent: occupancyShows > 0 ? Math.round(occupancyTotal / occupancyShows) : null,
      hasEstimates,
    };
  }).sort((a, b) => (b.startDate ?? "").localeCompare(a.startDate ?? ""));

  // ---- Comedian reports ----
  const comedianTourIds = new Map<string, Set<string>>();
  const comedianAgg = new Map<string, {
    name: string;
    shows: number;
    revenue: number;
    costs: number;
    occupancyTotal: number;
    occupancyCount: number;
    hasEstimates: boolean;
  }>();

  for (const { show } of showRows) {
    const tourInfo = tourComedianMap.get(show.tourId);
    if (!tourInfo?.comedianId) continue;
    const cid = tourInfo.comedianId;
    const fin = computeShowFinancials(show, accomTotals.get(show.id) ?? 0, travelTotals.get(show.id) ?? 0);

    const entry = comedianAgg.get(cid) ?? {
      name: tourInfo.comedianStageName ?? "—",
      shows: 0,
      revenue: 0,
      costs: 0,
      occupancyTotal: 0,
      occupancyCount: 0,
      hasEstimates: false,
    };
    entry.shows++;
    entry.revenue += fin.ticketRevenuePence;
    entry.costs += fin.totalCostsPence;
    if (fin.isEstimated) entry.hasEstimates = true;
    if (fin.occupancyPercent != null) { entry.occupancyTotal += fin.occupancyPercent; entry.occupancyCount++; }
    comedianAgg.set(cid, entry);

    // Track distinct tours per comedian
    const tourSet = comedianTourIds.get(cid) ?? new Set<string>();
    tourSet.add(show.tourId);
    comedianTourIds.set(cid, tourSet);
  }

  const comedianReports: OrgComedianReport[] = Array.from(comedianAgg.entries()).map(([cid, d]) => ({
    comedianId: cid,
    comedianName: d.name,
    tourCount: comedianTourIds.get(cid)?.size ?? 0,
    showCount: d.shows,
    revenuePence: d.revenue,
    costsPence: d.costs,
    netPence: d.revenue - d.costs,
    avgRevenuePerShow: d.shows > 0 ? Math.round(d.revenue / d.shows) : 0,
    avgOccupancyPercent: d.occupancyCount > 0 ? Math.round(d.occupancyTotal / d.occupancyCount) : null,
    hasEstimates: d.hasEstimates,
  })).sort((a, b) => b.revenuePence - a.revenuePence);

  // ---- Venue reports ----
  const venueAgg = new Map<string, {
    name: string;
    city: string | null;
    shows: number;
    revenue: number;
    occupancyTotal: number;
    occupancyCount: number;
  }>();

  for (const { show, venue } of showRows) {
    if (!venue) continue;
    const fin = computeShowFinancials(show, accomTotals.get(show.id) ?? 0, travelTotals.get(show.id) ?? 0);
    const entry = venueAgg.get(venue.id) ?? { name: venue.name, city: venue.city ?? null, shows: 0, revenue: 0, occupancyTotal: 0, occupancyCount: 0 };
    entry.shows++;
    entry.revenue += fin.ticketRevenuePence;
    if (fin.occupancyPercent != null) { entry.occupancyTotal += fin.occupancyPercent; entry.occupancyCount++; }
    venueAgg.set(venue.id, entry);
  }

  const venueReports: OrgVenueReport[] = Array.from(venueAgg.entries()).map(([vid, d]) => ({
    venueId: vid,
    venueName: d.name,
    city: d.city,
    showCount: d.shows,
    revenuePence: d.revenue,
    avgOccupancyPercent: d.occupancyCount > 0 ? Math.round(d.occupancyTotal / d.occupancyCount) : null,
  })).sort((a, b) => b.showCount - a.showCount);

  return { tourReports, comedianReports, venueReports };
}
