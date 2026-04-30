import { and, asc, eq, isNull } from "drizzle-orm";
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
import type {
  Tour,
  Show,
  Venue,
  Comedian,
  Accommodation,
  Travel,
  Reminder,
} from "@/db/schema";
import { reminderTypeLabels, travelTypeLabels } from "@/lib/options";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type ShowBundle = {
  show: Show;
  venue: Venue | null;
  accommodations: Accommodation[];
  travel: Travel[];
};

export type ItineraryData = {
  tour: Tour;
  comedian: Comedian | null;
  shows: ShowBundle[];
  reminders: Reminder[];
};

export type TimelineEventKind =
  | "travel-depart"
  | "travel-arrive"
  | "check-in"
  | "check-out"
  | "doors"
  | "show"
  | "reminder";

export type TimelineEvent = {
  kind: TimelineEventKind;
  time: string | null;
  sortTime: string;
  title: string;
  subtitle: string | null;
  details: string[];
};

export type DayBucket = {
  key: string; // YYYY-MM-DD
  hasShow: boolean;
  hasTravel: boolean;
  hasAccom: boolean;
  show: ShowBundle | null;
  events: TimelineEvent[];
};

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function parseDateOnly(value: string | null | undefined): Date | null {
  if (!value) return null;
  const [y, m, d] = value.split("-").map((s) => parseInt(s, 10));
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

export function dateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function dateKeyFromTimestamp(ts: Date | null | undefined): string | null {
  if (!ts) return null;
  return dateKey(new Date(ts));
}

export function dateKeyFromString(s: string | null | undefined): string | null {
  const d = parseDateOnly(s);
  return d ? dateKey(d) : null;
}

export function formatLongDate(key: string): string {
  const d = parseDateOnly(key);
  if (!d) return key;
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatShortDate(key: string): string {
  const d = parseDateOnly(key);
  if (!d) return key;
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
}

export function formatDayName(key: string): string {
  const d = parseDateOnly(key);
  if (!d) return "";
  return DAYS[d.getDay()];
}

export function formatDayNumber(key: string): string {
  const d = parseDateOnly(key);
  if (!d) return key;
  return String(d.getDate());
}

export function formatMonthShort(key: string): string {
  const d = parseDateOnly(key);
  if (!d) return "";
  return MONTHS[d.getMonth()].slice(0, 3);
}

export function formatTimeFromString(value: string | null | undefined): string | null {
  if (!value) return null;
  const parts = value.split(":");
  if (parts.length < 2) return value;
  return `${parts[0]}:${parts[1]}`;
}

export function formatTimeFromTimestamp(ts: Date | null | undefined): string | null {
  if (!ts) return null;
  const d = new Date(ts);
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

/* -------------------------------------------------------------------------- */
/*                              Day bucketing                                 */
/* -------------------------------------------------------------------------- */

export function buildDayBuckets(data: ItineraryData): DayBucket[] {
  const buckets = new Map<
    string,
    {
      show: ShowBundle | null;
      events: TimelineEvent[];
      hasTravel: boolean;
      hasAccom: boolean;
    }
  >();

  function ensure(key: string) {
    let b = buckets.get(key);
    if (!b) {
      b = { show: null, events: [], hasTravel: false, hasAccom: false };
      buckets.set(key, b);
    }
    return b;
  }

  // Shows
  for (const sb of data.shows) {
    const key = sb.show.showDate;
    if (!key) continue;
    const b = ensure(key);
    b.show = sb;

    const showTime = formatTimeFromString(sb.show.showTime);
    const doorsTime = formatTimeFromString(sb.show.doorsTime);

    if (doorsTime) {
      b.events.push({
        kind: "doors",
        time: doorsTime,
        sortTime: doorsTime,
        title: "Doors open",
        subtitle: sb.venue?.name ?? null,
        details: [],
      });
    }

    const showDetails: string[] = [];
    if (sb.show.supportAct) showDetails.push(`Support: ${sb.show.supportAct}`);
    if (sb.show.notes) showDetails.push(sb.show.notes);

    b.events.push({
      kind: "show",
      time: showTime,
      sortTime: showTime ?? "23:58",
      title: showTime ? "Show" : "Show (time TBC)",
      subtitle: sb.venue?.name ?? sb.show.city ?? null,
      details: showDetails,
    });
  }

  // Travel
  for (const sb of data.shows) {
    for (const t of sb.travel) {
      const depKey = dateKeyFromTimestamp(t.departureAt);
      const arrKey = dateKeyFromTimestamp(t.arrivalAt);
      const depTime = formatTimeFromTimestamp(t.departureAt);
      const arrTime = formatTimeFromTimestamp(t.arrivalAt);

      const fromTo =
        t.departureLocation && t.arrivalLocation
          ? `${t.departureLocation} → ${t.arrivalLocation}`
          : (t.departureLocation ?? t.arrivalLocation ?? null);

      const baseDetails: string[] = [];
      if (t.bookingReference) baseDetails.push(`Ref: ${t.bookingReference}`);
      if (t.notes) baseDetails.push(t.notes);

      const typeLabel = travelTypeLabels[t.travelType];

      if (depKey) {
        const b = ensure(depKey);
        b.hasTravel = true;
        b.events.push({
          kind: "travel-depart",
          time: depTime,
          sortTime: depTime ?? "00:01",
          title: `${typeLabel} — depart`,
          subtitle: fromTo,
          details:
            arrKey && arrKey !== depKey && arrTime
              ? [
                  `Arrives ${formatShortDate(arrKey)} at ${arrTime}`,
                  ...baseDetails,
                ]
              : arrTime && arrKey === depKey
                ? [`Arrives ${arrTime}`, ...baseDetails]
                : baseDetails,
        });
      }

      if (arrKey && arrKey !== depKey) {
        const b = ensure(arrKey);
        b.hasTravel = true;
        b.events.push({
          kind: "travel-arrive",
          time: arrTime,
          sortTime: arrTime ?? "00:02",
          title: `${typeLabel} — arrive`,
          subtitle: fromTo,
          details: depKey
            ? [
                `Departed ${formatShortDate(depKey)}${depTime ? ` at ${depTime}` : ""}`,
                ...baseDetails,
              ]
            : baseDetails,
        });
      }
    }
  }

  // Accommodations
  for (const sb of data.shows) {
    for (const a of sb.accommodations) {
      const inKey = dateKeyFromString(a.checkIn);
      const outKey = dateKeyFromString(a.checkOut);

      const baseDetails: string[] = [];
      if (a.address) baseDetails.push(a.address);
      if (a.bookingReference) baseDetails.push(`Ref: ${a.bookingReference}`);
      if (a.contactPhone) baseDetails.push(`Tel: ${a.contactPhone}`);
      if (a.notes) baseDetails.push(a.notes);

      if (inKey) {
        const b = ensure(inKey);
        b.hasAccom = true;
        const checkInTime = a.checkInTime ? a.checkInTime.slice(0, 5) : null;
        b.events.push({
          kind: "check-in",
          time: checkInTime,
          sortTime: checkInTime ?? "14:00",
          title: "Hotel check-in",
          subtitle: a.hotelName ?? null,
          details: baseDetails,
        });
      }
      if (outKey) {
        const b = ensure(outKey);
        b.hasAccom = true;
        const checkOutTime = a.checkOutTime ? a.checkOutTime.slice(0, 5) : null;
        b.events.push({
          kind: "check-out",
          time: checkOutTime,
          sortTime: checkOutTime ?? "11:00",
          title: "Hotel check-out",
          subtitle: a.hotelName ?? null,
          details: baseDetails,
        });
      }
    }
  }

  // Reminders — only on existing day pages
  for (const r of data.reminders) {
    if (r.completedAt) continue;
    const key = dateKeyFromTimestamp(r.dueAt);
    if (!key || !buckets.has(key)) continue;
    const b = ensure(key);
    const time = formatTimeFromTimestamp(r.dueAt);
    b.events.push({
      kind: "reminder",
      time,
      sortTime: time ?? "09:00",
      title: r.title,
      subtitle: reminderTypeLabels[r.type],
      details: r.notes ? [r.notes] : [],
    });
  }

  const orderedKeys = Array.from(buckets.keys()).sort();
  return orderedKeys.map((key) => {
    const b = buckets.get(key)!;
    const events = b.events.slice().sort((x, y) => {
      if (x.sortTime !== y.sortTime) return x.sortTime.localeCompare(y.sortTime);
      const order: Record<TimelineEventKind, number> = {
        "travel-arrive": 0,
        "check-in": 1,
        reminder: 2,
        "check-out": 3,
        doors: 4,
        show: 5,
        "travel-depart": 6,
      };
      return order[x.kind] - order[y.kind];
    });
    return {
      key,
      hasShow: !!b.show,
      hasTravel: b.hasTravel,
      hasAccom: b.hasAccom,
      show: b.show,
      events,
    };
  });
}

/* -------------------------------------------------------------------------- */
/*                              Data loading                                  */
/* -------------------------------------------------------------------------- */

export async function loadItineraryData(
  orgId: string,
  tourId: string,
): Promise<ItineraryData | null> {
  const [tour] = await db
    .select()
    .from(tours)
    .where(and(eq(tours.id, tourId), eq(tours.orgId, orgId)))
    .limit(1);
  if (!tour) return null;

  const [comedian] = await db
    .select()
    .from(comedians)
    .where(
      and(eq(comedians.id, tour.comedianId), eq(comedians.orgId, orgId)),
    )
    .limit(1);

  const showRows = await db
    .select({ show: shows, venue: venues })
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

  return {
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
}
