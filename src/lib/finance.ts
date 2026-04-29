import {
  shows,
  accommodations,
  travel,
  type Show,
  type Accommodation,
  type Travel,
} from "@/db/schema";
import { db } from "@/db/client";
import { and, eq, isNull, sum, count, asc, gte } from "drizzle-orm";

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
