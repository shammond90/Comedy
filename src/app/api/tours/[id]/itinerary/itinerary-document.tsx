import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import {
  formatDayName,
  formatDayNumber,
  formatLongDate,
  formatMonthShort,
  formatTimeFromString,
  type DayBucket,
  type ItineraryData,
  type ShowBundle,
  type TimelineEvent,
  type TimelineEventKind,
} from "@/lib/itinerary";

Font.registerHyphenationCallback((word) => [word]);

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
  travel: "#3F8EFC",
  travelSoft: "#dbe8ff",
  accom: "#7E5BC2",
  accomSoft: "#e6dcf5",
  ink: "#2a2520",
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: palette.paper,
    color: palette.fg,
    fontFamily: "Helvetica",
    fontSize: 10,
    paddingTop: 44,
    paddingBottom: 48,
    paddingHorizontal: 44,
    lineHeight: 1.4,
  },
  pageFooter: {
    position: "absolute",
    bottom: 20,
    left: 44,
    right: 44,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: palette.subtle,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  /* Header strip */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: palette.borderStrong,
    marginBottom: 16,
  },
  dateBlock: {
    width: 64,
    height: 64,
    borderWidth: 1,
    borderColor: palette.borderStrong,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
    backgroundColor: "#ffffff",
  },
  dateMonth: {
    fontSize: 8,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: palette.subtle,
  },
  dateNumber: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    color: palette.ink,
  },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  headerEyebrow: {
    fontSize: 8,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: palette.subtle,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
  },
  tagRow: { flexDirection: "row" },
  tag: {
    fontSize: 7,
    letterSpacing: 1,
    textTransform: "uppercase",
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
    marginLeft: 4,
    fontFamily: "Helvetica-Bold",
  },
  tagShow: { backgroundColor: palette.accentSoft, color: palette.accent },
  tagTravel: { backgroundColor: palette.travelSoft, color: palette.travel },
  tagAccom: { backgroundColor: palette.accomSoft, color: palette.accom },

  /* Two-column body */
  body: { flexDirection: "row" },
  timelineCol: { flex: 1, paddingRight: 18 },
  sideCol: { width: 200 },

  /* Timeline */
  timelineItem: {
    flexDirection: "row",
    marginBottom: 10,
  },
  timelineTime: {
    width: 44,
    fontSize: 9,
    color: palette.muted,
    fontFamily: "Helvetica-Bold",
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
    marginTop: 3,
  },
  timelineBody: { flex: 1 },
  timelineTitle: { fontSize: 10, fontFamily: "Helvetica-Bold" },
  timelineSubtitle: { fontSize: 9, color: palette.muted, marginTop: 1 },
  timelineDetail: { fontSize: 8.5, color: palette.muted, marginTop: 1 },

  /* Side cards */
  card: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  cardLabel: {
    fontSize: 7,
    letterSpacing: 1,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  cardKey: {
    fontSize: 8,
    color: palette.subtle,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cardValue: { fontSize: 10, fontFamily: "Helvetica-Bold" },
  cardSection: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 0.5,
  },
  cardLine: { fontSize: 9, color: palette.fg },
  cardMuted: { fontSize: 8.5, color: palette.muted },

  showCard: {
    borderColor: palette.accent,
    backgroundColor: "#fbf4f2",
  },
  showLabel: { color: palette.accent },
  showSection: { borderTopColor: palette.accentSoft },

  hotelCard: {
    borderColor: palette.accom,
    backgroundColor: "#f6f1fb",
  },
  hotelLabel: { color: palette.accom },

  travelCard: {
    borderColor: palette.travel,
    backgroundColor: "#eff5fe",
  },
  travelLabel: { color: palette.travel },

  /* Cover */
  cover: {
    paddingTop: 80,
    paddingBottom: 56,
    paddingHorizontal: 64,
    height: "100%",
    backgroundColor: palette.paper,
  },
  coverEyebrow: {
    fontSize: 9,
    letterSpacing: 3,
    textTransform: "uppercase",
    color: palette.accent,
    marginBottom: 24,
  },
  coverTitle: {
    fontSize: 44,
    fontFamily: "Helvetica-Bold",
    lineHeight: 1.1,
    marginBottom: 16,
  },
  coverSub: { fontSize: 14, color: palette.muted, marginBottom: 6 },
  coverFoot: {
    position: "absolute",
    bottom: 56,
    left: 64,
    right: 64,
    fontSize: 8,
    color: palette.subtle,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
});

const dotColor: Record<TimelineEventKind, string> = {
  "travel-depart": palette.travel,
  "travel-arrive": palette.travel,
  "check-in": palette.accom,
  "check-out": palette.accom,
  doors: "#d99917",
  show: palette.accent,
  reminder: palette.ink,
};

export function ItineraryDocument({
  data,
  days,
}: {
  data: ItineraryData;
  days: DayBucket[];
}) {
  const tourName = data.tour.name;
  const comedianName = data.comedian?.stageName ?? "Tour";

  return (
    <Document title={`${tourName} — Itinerary`}>
      {/* Cover */}
      <Page size="A4" style={styles.cover}>
        <Text style={styles.coverEyebrow}>{comedianName} · Itinerary</Text>
        <Text style={styles.coverTitle}>{tourName}</Text>
        <Text style={styles.coverSub}>
          {days.length} day{days.length === 1 ? "" : "s"}
          {days.length > 0 &&
            ` · ${formatLongDate(days[0].key)} – ${formatLongDate(
              days[days.length - 1].key,
            )}`}
        </Text>
        <View style={styles.coverFoot}>
          <Text>Day-by-day itinerary</Text>
        </View>
      </Page>

      {/* One page per day */}
      {days.map((day) => (
        <DayPage key={day.key} day={day} tourName={tourName} />
      ))}
    </Document>
  );
}

function DayPage({ day, tourName }: { day: DayBucket; tourName: string }) {
  const sb = day.show;
  const accom = sb?.accommodations ?? [];
  const travelLegs = sb?.travel ?? [];

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.dateBlock}>
            <Text style={styles.dateMonth}>{formatMonthShort(day.key)}</Text>
            <Text style={styles.dateNumber}>{formatDayNumber(day.key)}</Text>
          </View>
          <View>
            <Text style={styles.headerEyebrow}>{formatDayName(day.key)}</Text>
            <Text style={styles.headerTitle}>{formatLongDate(day.key)}</Text>
          </View>
        </View>
        <View style={styles.tagRow}>
          {day.hasShow && <Text style={[styles.tag, styles.tagShow]}>Show</Text>}
          {day.hasTravel && (
            <Text style={[styles.tag, styles.tagTravel]}>Travel</Text>
          )}
          {day.hasAccom && (
            <Text style={[styles.tag, styles.tagAccom]}>Hotel</Text>
          )}
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.timelineCol}>
          <Timeline events={day.events} />
        </View>
        <View style={styles.sideCol}>
          {sb && <ShowCard sb={sb} />}
          {accom.length > 0 && <HotelCard accommodations={accom} />}
          {travelLegs.length > 0 && <TravelCard travelLegs={travelLegs} />}
        </View>
      </View>

      <View style={styles.pageFooter} fixed>
        <Text>{tourName}</Text>
        <Text
          render={({ pageNumber, totalPages }) =>
            `${pageNumber} / ${totalPages}`
          }
        />
      </View>
    </Page>
  );
}

function Timeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return <Text style={styles.cardMuted}>No timed events for this day.</Text>;
  }
  return (
    <View>
      {events.map((ev, i) => (
        <View key={i} style={styles.timelineItem} wrap={false}>
          <Text style={styles.timelineTime}>{ev.time ?? "--:--"}</Text>
          <View
            style={[
              styles.timelineDot,
              { backgroundColor: dotColor[ev.kind] },
            ]}
          />
          <View style={styles.timelineBody}>
            <Text style={styles.timelineTitle}>{ev.title}</Text>
            {ev.subtitle && (
              <Text style={styles.timelineSubtitle}>{ev.subtitle}</Text>
            )}
            {ev.details.map((d, j) => (
              <Text key={j} style={styles.timelineDetail}>
                {d}
              </Text>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

function ShowCard({ sb }: { sb: ShowBundle }) {
  const venue = sb.venue;
  const showTime = formatTimeFromString(sb.show.showTime);
  const doorsTime = formatTimeFromString(sb.show.doorsTime);
  const venueLines = [
    venue?.addressLine1,
    venue?.addressLine2,
    [venue?.city, venue?.postcode].filter(Boolean).join(" "),
    venue?.country,
  ].filter((l): l is string => !!l && l.length > 0);

  return (
    <View style={[styles.card, styles.showCard]} wrap={false}>
      <Text style={[styles.cardLabel, styles.showLabel]}>Tonight&apos;s show</Text>
      <Text style={styles.cardTitle}>
        {venue?.name ?? sb.show.city ?? "Venue TBC"}
      </Text>
      <View style={styles.cardRow}>
        <Text style={styles.cardKey}>Doors</Text>
        <Text style={styles.cardValue}>{doorsTime ?? "—"}</Text>
      </View>
      <View style={styles.cardRow}>
        <Text style={styles.cardKey}>Show</Text>
        <Text style={styles.cardValue}>{showTime ?? "—"}</Text>
      </View>
      {sb.show.supportAct && (
        <View style={styles.cardRow}>
          <Text style={styles.cardKey}>Support</Text>
          <Text style={styles.cardValue}>{sb.show.supportAct}</Text>
        </View>
      )}

      {venueLines.length > 0 && (
        <View style={[styles.cardSection, styles.showSection]}>
          <Text style={styles.cardLabel}>Address</Text>
          {venueLines.map((line, i) => (
            <Text key={i} style={styles.cardLine}>
              {line}
            </Text>
          ))}
        </View>
      )}

      {(venue?.primaryContactName ||
        venue?.primaryContactPhone ||
        venue?.primaryContactEmail) && (
        <View style={[styles.cardSection, styles.showSection]}>
          <Text style={styles.cardLabel}>Venue contact</Text>
          {venue?.primaryContactName && (
            <Text style={styles.cardLine}>{venue.primaryContactName}</Text>
          )}
          {venue?.primaryContactPhone && (
            <Text style={styles.cardLine}>{venue.primaryContactPhone}</Text>
          )}
          {venue?.primaryContactEmail && (
            <Text style={styles.cardLine}>{venue.primaryContactEmail}</Text>
          )}
        </View>
      )}

      {(venue?.technicalContactName ||
        venue?.technicalContactPhone ||
        venue?.technicalContactEmail) && (
        <View style={[styles.cardSection, styles.showSection]}>
          <Text style={styles.cardLabel}>Technical contact</Text>
          {venue?.technicalContactName && (
            <Text style={styles.cardLine}>{venue.technicalContactName}</Text>
          )}
          {venue?.technicalContactPhone && (
            <Text style={styles.cardLine}>{venue.technicalContactPhone}</Text>
          )}
          {venue?.technicalContactEmail && (
            <Text style={styles.cardLine}>{venue.technicalContactEmail}</Text>
          )}
        </View>
      )}
    </View>
  );
}

function HotelCard({
  accommodations,
}: {
  accommodations: ShowBundle["accommodations"];
}) {
  return (
    <View style={[styles.card, styles.hotelCard]} wrap={false}>
      <Text style={[styles.cardLabel, styles.hotelLabel]}>Accommodation</Text>
      {accommodations.map((a, i) => (
        <View key={a.id} style={i > 0 ? { marginTop: 6 } : undefined}>
          <Text style={styles.cardValue}>{a.hotelName ?? "Hotel"}</Text>
          {a.address && <Text style={styles.cardLine}>{a.address}</Text>}
          {a.contactPhone && (
            <Text style={styles.cardLine}>Tel: {a.contactPhone}</Text>
          )}
          {a.bookingReference && (
            <Text style={styles.cardMuted}>Ref: {a.bookingReference}</Text>
          )}
          {(a.checkIn || a.checkOut) && (
            <Text style={styles.cardMuted}>
              {a.checkIn ? `In: ${a.checkIn}` : ""}
              {a.checkIn && a.checkOut ? " · " : ""}
              {a.checkOut ? `Out: ${a.checkOut}` : ""}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
}

function TravelCard({
  travelLegs,
}: {
  travelLegs: ShowBundle["travel"];
}) {
  return (
    <View style={[styles.card, styles.travelCard]} wrap={false}>
      <Text style={[styles.cardLabel, styles.travelLabel]}>Travel</Text>
      {travelLegs.map((t, i) => (
        <View key={t.id} style={i > 0 ? { marginTop: 6 } : undefined}>
          <Text style={styles.cardValue}>
            {t.departureLocation ?? "?"} {"->"} {t.arrivalLocation ?? "?"}
          </Text>
          {t.bookingReference && (
            <Text style={styles.cardMuted}>Ref: {t.bookingReference}</Text>
          )}
        </View>
      ))}
    </View>
  );
}
