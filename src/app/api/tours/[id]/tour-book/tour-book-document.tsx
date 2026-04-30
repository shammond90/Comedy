import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type {
  Tour,
  Show,
  Venue,
  Comedian,
  Accommodation,
  Travel,
  Reminder,
} from "@/db/schema";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

type ShowBundle = {
  show: Show;
  venue: Venue | null;
  accommodations: Accommodation[];
  travel: Travel[];
};

export type TourBookData = {
  tour: Tour;
  comedian: Comedian | null;
  shows: ShowBundle[];
  reminders: Reminder[];
};

/* -------------------------------------------------------------------------- */
/*                              Design tokens                                 */
/* -------------------------------------------------------------------------- */

const palette = {
  paper: "#f8f5f0",
  paperAlt: "#f1ece2",
  fg: "#1f1b16",
  subtle: "#8a8275",
  muted: "#6b6358",
  border: "#e6e0d4",
  borderStrong: "#d4cbb8",
  accent: "#C8553D",
  accentSoft: "#f0d9d2",
  ink: "#2a2520",
};

// Helvetica is built-in to react-pdf and renders reliably without font loading.
Font.registerHyphenationCallback((word) => [word]);

const styles = StyleSheet.create({
  page: {
    backgroundColor: palette.paper,
    color: palette.fg,
    fontFamily: "Helvetica",
    fontSize: 10,
    paddingTop: 56,
    paddingBottom: 56,
    paddingHorizontal: 56,
    lineHeight: 1.45,
  },
  pageFooter: {
    position: "absolute",
    bottom: 24,
    left: 56,
    right: 56,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: palette.subtle,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  /* Cover */
  cover: {
    backgroundColor: palette.paper,
    color: palette.fg,
    fontFamily: "Helvetica",
    paddingTop: 80,
    paddingBottom: 56,
    paddingHorizontal: 64,
    height: "100%",
  },
  coverEyebrow: {
    fontSize: 9,
    letterSpacing: 3,
    textTransform: "uppercase",
    color: palette.accent,
    marginBottom: 28,
  },
  coverTitle: {
    fontSize: 44,
    fontFamily: "Helvetica-Bold",
    color: palette.ink,
    lineHeight: 1.05,
    marginBottom: 18,
  },
  coverComedian: {
    fontSize: 18,
    color: palette.muted,
    marginBottom: 56,
  },
  accentBar: {
    width: 64,
    height: 3,
    backgroundColor: palette.accent,
    marginBottom: 36,
  },
  coverMetaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 24,
  },
  coverMetaItem: {
    width: "50%",
    marginBottom: 22,
    paddingRight: 16,
  },
  coverMetaLabel: {
    fontSize: 8,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: palette.subtle,
    marginBottom: 4,
  },
  coverMetaValue: {
    fontSize: 13,
    color: palette.fg,
    fontFamily: "Helvetica-Bold",
  },
  coverFooter: {
    position: "absolute",
    bottom: 56,
    left: 64,
    right: 64,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: palette.subtle,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    paddingTop: 16,
    borderTopWidth: 0.5,
    borderTopColor: palette.borderStrong,
  },

  /* Section heading */
  sectionEyebrow: {
    fontSize: 8,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: palette.accent,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    color: palette.ink,
    marginBottom: 14,
  },
  sectionSub: {
    fontSize: 10,
    color: palette.muted,
    marginBottom: 24,
  },

  /* Contents */
  tocRow: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: palette.border,
  },
  tocIndex: {
    width: 36,
    fontSize: 9,
    color: palette.accent,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
  },
  tocLabel: {
    flex: 1,
    fontSize: 11,
    color: palette.fg,
  },
  tocMeta: {
    fontSize: 9,
    color: palette.subtle,
  },

  /* Schedule table */
  scheduleHeader: {
    flexDirection: "row",
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: palette.borderStrong,
    marginBottom: 4,
  },
  scheduleHeaderCell: {
    fontSize: 7.5,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: palette.subtle,
    fontFamily: "Helvetica-Bold",
  },
  scheduleRow: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: palette.border,
  },
  scheduleCell: {
    fontSize: 10,
    color: palette.fg,
  },
  scheduleCellMuted: {
    fontSize: 9,
    color: palette.muted,
  },
  colDate: { width: "16%" },
  colCity: { width: "20%" },
  colVenue: { width: "30%" },
  colStatus: { width: "16%" },
  colDoors: { width: "9%" },
  colShow: { width: "9%" },

  /* Day page */
  dayHeader: {
    marginBottom: 28,
  },
  dayEyebrow: {
    fontSize: 8,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: palette.accent,
    marginBottom: 6,
  },
  dayDate: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    color: palette.ink,
    marginBottom: 16,
  },
  dayLocation: {
    fontSize: 12,
    color: palette.muted,
  },

  /* Timeline */
  timeline: {
    marginTop: 8,
  },
  timelineItem: {
    flexDirection: "row",
    marginBottom: 16,
  },
  timelineTimeCol: {
    width: 64,
    paddingTop: 2,
  },
  timelineTimePill: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: palette.accent,
    letterSpacing: 0.5,
  },
  timelineTimeNone: {
    fontSize: 8,
    color: palette.subtle,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  timelineRail: {
    width: 14,
    alignItems: "center",
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.accent,
    marginTop: 5,
  },
  timelineDotMuted: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.borderStrong,
    marginTop: 5,
  },
  timelineLine: {
    flex: 1,
    width: 1,
    backgroundColor: palette.border,
    marginTop: 2,
  },
  timelineBody: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 4,
  },
  timelineKind: {
    fontSize: 7.5,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: palette.subtle,
    marginBottom: 3,
  },
  timelineTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: palette.ink,
    marginBottom: 2,
  },
  timelineSubtitle: {
    fontSize: 10,
    color: palette.fg,
    marginBottom: 4,
  },
  timelineDetail: {
    fontSize: 9,
    color: palette.muted,
    marginBottom: 1,
  },

  /* Day reference card */
  refCard: {
    marginTop: 20,
    padding: 14,
    backgroundColor: palette.paperAlt,
    borderLeftWidth: 2,
    borderLeftColor: palette.accent,
  },
  refTitle: {
    fontSize: 8,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: palette.subtle,
    marginBottom: 6,
  },
  refRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  refLabel: {
    width: 90,
    fontSize: 9,
    color: palette.subtle,
  },
  refValue: {
    flex: 1,
    fontSize: 9,
    color: palette.fg,
  },

  /* Appendix */
  appendixCard: {
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: palette.border,
  },
  appendixCardLast: {
    marginBottom: 16,
    paddingBottom: 0,
  },
  appendixName: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: palette.ink,
    marginBottom: 10,
  },
  appendixMeta: {
    fontSize: 9,
    color: palette.muted,
    marginBottom: 6,
  },
  contactGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
  },
  contactBlock: {
    width: "50%",
    marginBottom: 6,
    paddingRight: 12,
  },
  contactLabel: {
    fontSize: 7.5,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: palette.subtle,
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 9.5,
    color: palette.fg,
  },

  /* Rider blocks */
  riderBlock: {
    marginBottom: 14,
  },
  riderHeading: {
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: palette.accent,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  riderText: {
    fontSize: 10,
    color: palette.fg,
    lineHeight: 1.5,
  },

  /* Misc */
  empty: {
    fontSize: 10,
    color: palette.subtle,
    fontStyle: "italic",
  },
});

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

function parseDateOnly(value: string | null | undefined): Date | null {
  if (!value) return null;
  // value is "YYYY-MM-DD" — construct as local date.
  const [y, m, d] = value.split("-").map((s) => parseInt(s, 10));
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function dateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function dateKeyFromTimestamp(ts: Date | null | undefined): string | null {
  if (!ts) return null;
  return dateKey(new Date(ts));
}

function dateKeyFromString(s: string | null | undefined): string | null {
  const d = parseDateOnly(s);
  return d ? dateKey(d) : null;
}

function formatLongDate(key: string): string {
  const d = parseDateOnly(key);
  if (!d) return key;
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function formatShortDate(key: string): string {
  const d = parseDateOnly(key);
  if (!d) return key;
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
}

function formatRange(
  startKey: string | null,
  endKey: string | null,
): string | null {
  if (!startKey && !endKey) return null;
  if (startKey && endKey) {
    const s = parseDateOnly(startKey);
    const e = parseDateOnly(endKey);
    if (s && e) {
      const sameYear = s.getFullYear() === e.getFullYear();
      const sameMonth = sameYear && s.getMonth() === e.getMonth();
      if (sameMonth) {
        return `${s.getDate()}–${e.getDate()} ${MONTHS[s.getMonth()]} ${s.getFullYear()}`;
      }
      if (sameYear) {
        return `${s.getDate()} ${MONTHS[s.getMonth()].slice(0, 3)} – ${e.getDate()} ${MONTHS[e.getMonth()].slice(0, 3)} ${s.getFullYear()}`;
      }
      return `${formatShortDate(startKey)} ${s.getFullYear()} – ${formatShortDate(endKey)} ${e.getFullYear()}`;
    }
  }
  return startKey
    ? formatLongDate(startKey)
    : endKey
      ? formatLongDate(endKey)
      : null;
}

function formatTimeFromString(value: string | null | undefined): string | null {
  if (!value) return null;
  // "HH:mm:ss" -> "HH:mm"
  const parts = value.split(":");
  if (parts.length < 2) return value;
  return `${parts[0]}:${parts[1]}`;
}

function formatTimeFromTimestamp(ts: Date | null | undefined): string | null {
  if (!ts) return null;
  const d = new Date(ts);
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function formatPence(pence: number | null | undefined): string | null {
  if (pence === null || pence === undefined) return null;
  const pounds = pence / 100;
  return `£${pounds.toLocaleString("en-GB", {
    minimumFractionDigits: pounds % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

function statusLabel(s: string): string {
  return s
    .split("_")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

function travelTypeLabel(t: string): string {
  return statusLabel(t);
}

function reminderTypeLabel(t: string): string {
  return statusLabel(t);
}

/* -------------------------------------------------------------------------- */
/*                              Day bucketing                                 */
/* -------------------------------------------------------------------------- */

type TimelineEvent =
  | {
      kind: "travel-depart";
      time: string | null;
      sortTime: string;
      title: string;
      subtitle: string | null;
      details: string[];
    }
  | {
      kind: "travel-arrive";
      time: string | null;
      sortTime: string;
      title: string;
      subtitle: string | null;
      details: string[];
    }
  | {
      kind: "check-in";
      time: string | null;
      sortTime: string;
      title: string;
      subtitle: string | null;
      details: string[];
    }
  | {
      kind: "check-out";
      time: string | null;
      sortTime: string;
      title: string;
      subtitle: string | null;
      details: string[];
    }
  | {
      kind: "doors";
      time: string | null;
      sortTime: string;
      title: string;
      subtitle: string | null;
      details: string[];
    }
  | {
      kind: "show";
      time: string | null;
      sortTime: string;
      title: string;
      subtitle: string | null;
      details: string[];
    }
  | {
      kind: "reminder";
      time: string | null;
      sortTime: string;
      title: string;
      subtitle: string | null;
      details: string[];
    };

type DayBucket = {
  key: string;
  hasShow: boolean;
  hasTravel: boolean;
  hasAccom: boolean;
  show: ShowBundle | null;
  events: TimelineEvent[];
};

function buildDayBuckets(data: TourBookData): DayBucket[] {
  const buckets = new Map<
    string,
    { show: ShowBundle | null; events: TimelineEvent[]; hasTravel: boolean; hasAccom: boolean }
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

  // Travel — bucket by departure & arrival calendar dates
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

      if (depKey) {
        const b = ensure(depKey);
        b.hasTravel = true;
        b.events.push({
          kind: "travel-depart",
          time: depTime,
          sortTime: depTime ?? "00:01",
          title: `${travelTypeLabel(t.travelType)} — depart`,
          subtitle: fromTo,
          details:
            arrKey && arrKey !== depKey && arrTime
              ? [`Arrives ${formatShortDate(arrKey)} at ${arrTime}`, ...baseDetails]
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
          title: `${travelTypeLabel(t.travelType)} — arrive`,
          subtitle: fromTo,
          details: depKey
            ? [`Departed ${formatShortDate(depKey)}${depTime ? ` at ${depTime}` : ""}`, ...baseDetails]
            : baseDetails,
        });
      }
    }
  }

  // Accommodations — check-in/check-out dates always get a page (per spec).
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

  // Reminders — surface only on existing day pages
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
      subtitle: reminderTypeLabel(r.type),
      details: r.notes ? [r.notes] : [],
    });
  }

  // Build sorted output
  const orderedKeys = Array.from(buckets.keys()).sort();
  return orderedKeys.map((key) => {
    const b = buckets.get(key)!;
    const events = b.events.slice().sort((x, y) => {
      if (x.sortTime !== y.sortTime) return x.sortTime.localeCompare(y.sortTime);
      // tiebreak by kind weight
      const order: Record<TimelineEvent["kind"], number> = {
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
/*                                Components                                  */
/* -------------------------------------------------------------------------- */

function PageFooter({ tourName }: { tourName: string }) {
  return (
    <View style={styles.pageFooter} fixed>
      <Text>{tourName}</Text>
      <Text
        render={({ pageNumber, totalPages }) =>
          `${pageNumber} / ${totalPages}`
        }
      />
    </View>
  );
}

function CoverPage({ data }: { data: TourBookData }) {
  const { tour, comedian, shows } = data;
  const dateRange = formatRange(tour.startDate, tour.endDate);
  const cities = Array.from(
    new Set(
      shows
        .map((s) => s.venue?.city ?? s.show.city)
        .filter((c): c is string => !!c),
    ),
  );

  return (
    <Page size="A4" style={styles.cover}>
      <Text style={styles.coverEyebrow}>Tour Book</Text>
      <Text style={styles.coverTitle}>{tour.name}</Text>
      {comedian && (
        <Text style={styles.coverComedian}>{comedian.stageName}</Text>
      )}
      <View style={styles.accentBar} />

      <View style={styles.coverMetaGrid}>
        {dateRange && (
          <View style={styles.coverMetaItem}>
            <Text style={styles.coverMetaLabel}>Dates</Text>
            <Text style={styles.coverMetaValue}>{dateRange}</Text>
          </View>
        )}
        <View style={styles.coverMetaItem}>
          <Text style={styles.coverMetaLabel}>Status</Text>
          <Text style={styles.coverMetaValue}>{statusLabel(tour.status)}</Text>
        </View>
        <View style={styles.coverMetaItem}>
          <Text style={styles.coverMetaLabel}>Shows</Text>
          <Text style={styles.coverMetaValue}>{shows.length}</Text>
        </View>
        {cities.length > 0 && (
          <View style={styles.coverMetaItem}>
            <Text style={styles.coverMetaLabel}>Cities</Text>
            <Text style={styles.coverMetaValue}>
              {cities.length} ({cities.slice(0, 3).join(", ")}
              {cities.length > 3 ? "…" : ""})
            </Text>
          </View>
        )}
        {tour.budgetPence !== null && tour.budgetPence !== undefined && (
          <View style={styles.coverMetaItem}>
            <Text style={styles.coverMetaLabel}>Budget</Text>
            <Text style={styles.coverMetaValue}>
              {formatPence(tour.budgetPence)}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.coverFooter} fixed>
        <Text>Generated {formatLongDate(dateKey(new Date()))}</Text>
        <Text>Confidential</Text>
      </View>
    </Page>
  );
}

function ContentsPage({
  data,
  days,
}: {
  data: TourBookData;
  days: DayBucket[];
}) {
  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.sectionEyebrow}>Section 01</Text>
      <Text style={styles.sectionTitle}>Contents</Text>
      <Text style={styles.sectionSub}>What&apos;s inside this tour book.</Text>

      <View style={styles.tocRow}>
        <Text style={styles.tocIndex}>—</Text>
        <Text style={styles.tocLabel}>Schedule overview</Text>
        <Text style={styles.tocMeta}>{data.shows.length} shows</Text>
      </View>

      {days.map((day, i) => {
        const label = day.show
          ? `${day.show.venue?.name ?? day.show.show.city ?? "Show"} — ${day.show.venue?.city ?? day.show.show.city ?? ""}`.trim()
          : day.hasTravel
            ? "Travel day"
            : day.hasAccom
              ? "Accommodation"
              : "Day";
        return (
          <View key={day.key} style={styles.tocRow}>
            <Text style={styles.tocIndex}>
              {String(i + 1).padStart(2, "0")}
            </Text>
            <Text style={styles.tocLabel}>{label}</Text>
            <Text style={styles.tocMeta}>{formatLongDate(day.key)}</Text>
          </View>
        );
      })}

      <View style={styles.tocRow}>
        <Text style={styles.tocIndex}>—</Text>
        <Text style={styles.tocLabel}>Artist details &amp; riders</Text>
        <Text style={styles.tocMeta}>Appendix A</Text>
      </View>
      <View style={styles.tocRow}>
        <Text style={styles.tocIndex}>—</Text>
        <Text style={styles.tocLabel}>Venue directory</Text>
        <Text style={styles.tocMeta}>Appendix B</Text>
      </View>

      <PageFooter tourName={data.tour.name} />
    </Page>
  );
}

function SchedulePage({ data }: { data: TourBookData }) {
  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.sectionEyebrow}>Section 02</Text>
      <Text style={styles.sectionTitle}>Schedule</Text>
      <Text style={styles.sectionSub}>
        All shows in chronological order.
      </Text>

      <View style={styles.scheduleHeader}>
        <Text style={[styles.scheduleHeaderCell, styles.colDate]}>Date</Text>
        <Text style={[styles.scheduleHeaderCell, styles.colCity]}>City</Text>
        <Text style={[styles.scheduleHeaderCell, styles.colVenue]}>Venue</Text>
        <Text style={[styles.scheduleHeaderCell, styles.colStatus]}>
          Status
        </Text>
        <Text style={[styles.scheduleHeaderCell, styles.colDoors]}>Doors</Text>
        <Text style={[styles.scheduleHeaderCell, styles.colShow]}>Show</Text>
      </View>

      {data.shows.length === 0 && (
        <Text style={styles.empty}>No shows scheduled yet.</Text>
      )}

      {data.shows.map(({ show, venue }) => (
        <View key={show.id} style={styles.scheduleRow} wrap={false}>
          <Text style={[styles.scheduleCell, styles.colDate]}>
            {formatShortDate(show.showDate)}
          </Text>
          <Text style={[styles.scheduleCell, styles.colCity]}>
            {venue?.city ?? show.city ?? "—"}
          </Text>
          <Text style={[styles.scheduleCell, styles.colVenue]}>
            {venue?.name ?? "—"}
          </Text>
          <Text style={[styles.scheduleCellMuted, styles.colStatus]}>
            {statusLabel(show.status)}
          </Text>
          <Text style={[styles.scheduleCellMuted, styles.colDoors]}>
            {formatTimeFromString(show.doorsTime) ?? "—"}
          </Text>
          <Text style={[styles.scheduleCellMuted, styles.colShow]}>
            {formatTimeFromString(show.showTime) ?? "—"}
          </Text>
        </View>
      ))}

      <PageFooter tourName={data.tour.name} />
    </Page>
  );
}

function DayPage({
  day,
  index,
  total,
  tourName,
}: {
  day: DayBucket;
  index: number;
  total: number;
  tourName: string;
}) {
  const venue = day.show?.venue ?? null;
  const city =
    venue?.city ?? day.show?.show.city ?? (day.hasTravel ? "Travel day" : day.hasAccom ? "Accommodation" : "");

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.dayHeader}>
        <Text style={styles.dayEyebrow}>
          Day {index + 1} of {total}
          {day.hasShow ? "  •  Show day" : day.hasTravel ? "  •  Travel" : day.hasAccom ? "  •  Accommodation" : ""}
        </Text>
        <Text style={styles.dayDate}>{formatLongDate(day.key)}</Text>
        {city && <Text style={styles.dayLocation}>{city}</Text>}
      </View>

      <View style={styles.timeline}>
        {day.events.map((event, i) => {
          const isLast = i === day.events.length - 1;
          const muted =
            event.kind === "check-in" ||
            event.kind === "check-out" ||
            event.kind === "reminder";
          return (
            <View key={`${event.kind}-${i}`} style={styles.timelineItem} wrap={false}>
              <View style={styles.timelineTimeCol}>
                {event.time ? (
                  <Text style={styles.timelineTimePill}>{event.time}</Text>
                ) : (
                  <Text style={styles.timelineTimeNone}>All day</Text>
                )}
              </View>
              <View style={styles.timelineRail}>
                <View
                  style={muted ? styles.timelineDotMuted : styles.timelineDot}
                />
                {!isLast && <View style={styles.timelineLine} />}
              </View>
              <View style={styles.timelineBody}>
                <Text style={styles.timelineKind}>
                  {event.kind === "travel-depart"
                    ? "Travel · Depart"
                    : event.kind === "travel-arrive"
                      ? "Travel · Arrive"
                      : event.kind === "check-in"
                        ? "Accommodation"
                        : event.kind === "check-out"
                          ? "Accommodation"
                          : event.kind === "doors"
                            ? "Venue"
                            : event.kind === "show"
                              ? "Show"
                              : "Reminder"}
                </Text>
                <Text style={styles.timelineTitle}>{event.title}</Text>
                {event.subtitle && (
                  <Text style={styles.timelineSubtitle}>{event.subtitle}</Text>
                )}
                {event.details.map((d, di) => (
                  <Text key={di} style={styles.timelineDetail}>
                    {d}
                  </Text>
                ))}
              </View>
            </View>
          );
        })}

        {day.events.length === 0 && (
          <Text style={styles.empty}>No scheduled items.</Text>
        )}
      </View>

      {venue && (
        <View style={styles.refCard} wrap={false}>
          <Text style={styles.refTitle}>Venue reference</Text>
          {venue.addressLine1 && (
            <View style={styles.refRow}>
              <Text style={styles.refLabel}>Address</Text>
              <Text style={styles.refValue}>
                {[
                  venue.addressLine1,
                  venue.addressLine2,
                  venue.city,
                  venue.postcode,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </Text>
            </View>
          )}
          {venue.capacity !== null && venue.capacity !== undefined && (
            <View style={styles.refRow}>
              <Text style={styles.refLabel}>Capacity</Text>
              <Text style={styles.refValue}>{venue.capacity}</Text>
            </View>
          )}
          {venue.primaryContactName && (
            <View style={styles.refRow}>
              <Text style={styles.refLabel}>Primary</Text>
              <Text style={styles.refValue}>
                {venue.primaryContactName}
                {venue.primaryContactPhone
                  ? ` · ${venue.primaryContactPhone}`
                  : ""}
                {venue.primaryContactEmail
                  ? ` · ${venue.primaryContactEmail}`
                  : ""}
              </Text>
            </View>
          )}
          {venue.technicalContactName && (
            <View style={styles.refRow}>
              <Text style={styles.refLabel}>Technical</Text>
              <Text style={styles.refValue}>
                {venue.technicalContactName}
                {venue.technicalContactPhone
                  ? ` · ${venue.technicalContactPhone}`
                  : ""}
              </Text>
            </View>
          )}
          {venue.loadInDetails && (
            <View style={styles.refRow}>
              <Text style={styles.refLabel}>Load-in</Text>
              <Text style={styles.refValue}>{venue.loadInDetails}</Text>
            </View>
          )}
          {venue.parkingInfo && (
            <View style={styles.refRow}>
              <Text style={styles.refLabel}>Parking</Text>
              <Text style={styles.refValue}>{venue.parkingInfo}</Text>
            </View>
          )}
        </View>
      )}

      <PageFooter tourName={tourName} />
    </Page>
  );
}

function ArtistAppendix({ data }: { data: TourBookData }) {
  const c = data.comedian;
  if (!c) return null;
  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.sectionEyebrow}>Appendix A</Text>
      <Text style={styles.sectionTitle}>{c.stageName}</Text>
      {c.legalName && (
        <Text style={styles.sectionSub}>Legal name: {c.legalName}</Text>
      )}

      <View style={styles.contactGrid}>
        {(c.phone || c.email) && (
          <View style={styles.contactBlock}>
            <Text style={styles.contactLabel}>Artist</Text>
            {c.phone && <Text style={styles.contactValue}>{c.phone}</Text>}
            {c.email && <Text style={styles.contactValue}>{c.email}</Text>}
          </View>
        )}
        {(c.agentName || c.agentEmail) && (
          <View style={styles.contactBlock}>
            <Text style={styles.contactLabel}>Agent</Text>
            {c.agentName && (
              <Text style={styles.contactValue}>
                {c.agentName}
                {c.agentCompany ? ` · ${c.agentCompany}` : ""}
              </Text>
            )}
            {c.agentPhone && (
              <Text style={styles.contactValue}>{c.agentPhone}</Text>
            )}
            {c.agentEmail && (
              <Text style={styles.contactValue}>{c.agentEmail}</Text>
            )}
          </View>
        )}
        {(c.managerName || c.managerEmail) && (
          <View style={styles.contactBlock}>
            <Text style={styles.contactLabel}>Manager</Text>
            {c.managerName && (
              <Text style={styles.contactValue}>
                {c.managerName}
                {c.managerCompany ? ` · ${c.managerCompany}` : ""}
              </Text>
            )}
            {c.managerPhone && (
              <Text style={styles.contactValue}>{c.managerPhone}</Text>
            )}
            {c.managerEmail && (
              <Text style={styles.contactValue}>{c.managerEmail}</Text>
            )}
          </View>
        )}
      </View>

      {c.hospitalityRider && (
        <View style={styles.riderBlock}>
          <Text style={styles.riderHeading}>Hospitality rider</Text>
          <Text style={styles.riderText}>{c.hospitalityRider}</Text>
        </View>
      )}
      {c.technicalRider && (
        <View style={styles.riderBlock}>
          <Text style={styles.riderHeading}>Technical rider</Text>
          <Text style={styles.riderText}>{c.technicalRider}</Text>
        </View>
      )}
      {c.dressingRoomRequirements && (
        <View style={styles.riderBlock}>
          <Text style={styles.riderHeading}>Dressing room</Text>
          <Text style={styles.riderText}>{c.dressingRoomRequirements}</Text>
        </View>
      )}
      {c.accessibilityRequirements && (
        <View style={styles.riderBlock}>
          <Text style={styles.riderHeading}>Accessibility</Text>
          <Text style={styles.riderText}>{c.accessibilityRequirements}</Text>
        </View>
      )}

      <PageFooter tourName={data.tour.name} />
    </Page>
  );
}

function VenueAppendix({ data }: { data: TourBookData }) {
  const map = new Map<string, Venue>();
  for (const sb of data.shows) {
    if (sb.venue && !map.has(sb.venue.id)) map.set(sb.venue.id, sb.venue);
  }
  const venues = Array.from(map.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  if (venues.length === 0) return null;

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.sectionEyebrow}>Appendix B</Text>
      <Text style={styles.sectionTitle}>Venue directory</Text>
      <Text style={styles.sectionSub}>
        {venues.length} {venues.length === 1 ? "venue" : "venues"} on this tour.
      </Text>

      {venues.map((v, i) => {
        const isLast = i === venues.length - 1;
        return (
          <View
            key={v.id}
            style={isLast ? styles.appendixCardLast : styles.appendixCard}
            wrap={false}
          >
            <Text style={styles.appendixName}>{v.name}</Text>
            <Text style={styles.appendixMeta}>
              {[v.addressLine1, v.addressLine2, v.city, v.postcode]
                .filter(Boolean)
                .join(", ") || "Address not on file"}
              {v.capacity ? `  ·  Capacity ${v.capacity}` : ""}
            </Text>
            <View style={styles.contactGrid}>
              {v.primaryContactName && (
                <View style={styles.contactBlock}>
                  <Text style={styles.contactLabel}>Primary contact</Text>
                  <Text style={styles.contactValue}>
                    {v.primaryContactName}
                    {v.primaryContactRole ? ` · ${v.primaryContactRole}` : ""}
                  </Text>
                  {v.primaryContactPhone && (
                    <Text style={styles.contactValue}>
                      {v.primaryContactPhone}
                    </Text>
                  )}
                  {v.primaryContactEmail && (
                    <Text style={styles.contactValue}>
                      {v.primaryContactEmail}
                    </Text>
                  )}
                </View>
              )}
              {v.technicalContactName && (
                <View style={styles.contactBlock}>
                  <Text style={styles.contactLabel}>Technical contact</Text>
                  <Text style={styles.contactValue}>
                    {v.technicalContactName}
                  </Text>
                  {v.technicalContactPhone && (
                    <Text style={styles.contactValue}>
                      {v.technicalContactPhone}
                    </Text>
                  )}
                  {v.technicalContactEmail && (
                    <Text style={styles.contactValue}>
                      {v.technicalContactEmail}
                    </Text>
                  )}
                </View>
              )}
              {v.loadInDetails && (
                <View style={styles.contactBlock}>
                  <Text style={styles.contactLabel}>Load-in</Text>
                  <Text style={styles.contactValue}>{v.loadInDetails}</Text>
                </View>
              )}
              {v.parkingInfo && (
                <View style={styles.contactBlock}>
                  <Text style={styles.contactLabel}>Parking</Text>
                  <Text style={styles.contactValue}>{v.parkingInfo}</Text>
                </View>
              )}
            </View>
          </View>
        );
      })}

      <PageFooter tourName={data.tour.name} />
    </Page>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  Document                                  */
/* -------------------------------------------------------------------------- */

export function TourBookDocument({ data }: { data: TourBookData }) {
  const days = buildDayBuckets(data);
  return (
    <Document
      title={`${data.tour.name} — Tour Book`}
      author={data.comedian?.stageName ?? "Comedy"}
    >
      <CoverPage data={data} />
      <ContentsPage data={data} days={days} />
      <SchedulePage data={data} />
      {days.map((day, i) => (
        <DayPage
          key={day.key}
          day={day}
          index={i}
          total={days.length}
          tourName={data.tour.name}
        />
      ))}
      <ArtistAppendix data={data} />
      <VenueAppendix data={data} />
    </Document>
  );
}
