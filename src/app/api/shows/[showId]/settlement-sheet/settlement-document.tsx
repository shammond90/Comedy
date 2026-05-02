import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type {
  Show,
  Venue,
  Tour,
  Comedian,
  Accommodation,
  Travel,
} from "@/db/schema";
import type { ShowFinancials } from "@/lib/finance";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type SettlementType = "summary" | "full" | "contract";

export type SettlementData = {
  type: SettlementType;
  show: Show;
  tour: Tour;
  venue: Venue | null;
  comedian: Comedian | null;
  accommodations: Accommodation[];
  travel: Travel[];
  financials: ShowFinancials;
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

Font.registerHyphenationCallback((word) => [word]);

const styles = StyleSheet.create({
  page: {
    backgroundColor: palette.paper,
    color: palette.fg,
    fontFamily: "Helvetica",
    fontSize: 10,
    paddingTop: 56,
    paddingBottom: 64,
    paddingHorizontal: 56,
    lineHeight: 1.45,
  },
  footer: {
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
    borderTopWidth: 0.5,
    borderTopColor: palette.borderStrong,
    paddingTop: 8,
  },

  /* Header */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 32,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: palette.borderStrong,
  },
  headerLeft: { flex: 1 },
  eyebrow: {
    fontSize: 8,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: palette.accent,
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: palette.ink,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: palette.muted,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  headerMeta: {
    fontSize: 9,
    color: palette.subtle,
    marginBottom: 3,
  },
  headerMetaBold: {
    fontFamily: "Helvetica-Bold",
    color: palette.fg,
  },

  /* Section */
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 8,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: palette.accent,
    marginBottom: 10,
  },

  /* Info grid (key-value pairs) */
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  infoItem: {
    width: "50%",
    marginBottom: 10,
    paddingRight: 12,
  },
  infoLabel: {
    fontSize: 8,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: palette.subtle,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 10,
    color: palette.fg,
  },

  /* Financial grid */
  finGrid: {
    marginBottom: 4,
  },
  finRow: {
    flexDirection: "row",
    marginBottom: 1,
  },
  finCell: {
    flex: 1,
    padding: 12,
    backgroundColor: palette.paperAlt,
  },
  finCellWide: {
    padding: 12,
    backgroundColor: palette.accentSoft,
    marginTop: 1,
  },
  finCellLabel: {
    fontSize: 8,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: palette.muted,
    marginBottom: 4,
  },
  finCellValue: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: palette.ink,
  },
  finCellValueNeg: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#b91c1c",
  },
  finCellValueAccent: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: palette.accent,
  },

  /* Table */
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: palette.borderStrong,
    paddingBottom: 5,
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: palette.border,
  },
  tableColLabel: { flex: 1, fontSize: 9, color: palette.subtle, letterSpacing: 0.5, textTransform: "uppercase" },
  tableColValue: { width: 80, textAlign: "right", fontSize: 9, color: palette.subtle, letterSpacing: 0.5, textTransform: "uppercase" },
  tableCellLabel: { flex: 1, fontSize: 10 },
  tableCellValue: { width: 80, textAlign: "right", fontSize: 10, fontFamily: "Helvetica-Bold" },

  /* Rider / notes block */
  textBlock: {
    padding: 12,
    backgroundColor: palette.paperAlt,
    borderRadius: 2,
    fontSize: 10,
    lineHeight: 1.6,
    color: palette.fg,
  },
  divider: {
    borderBottomWidth: 0.5,
    borderBottomColor: palette.borderStrong,
    marginVertical: 20,
  },

  /* Signature block */
  sigRow: {
    flexDirection: "row",
    marginTop: 16,
  },
  sigCol: {
    flex: 1,
    marginRight: 24,
  },
  sigColLast: {
    flex: 1,
  },
  sigLine: {
    borderBottomWidth: 1,
    borderBottomColor: palette.fg,
    marginBottom: 6,
    height: 32,
  },
  sigLabel: {
    fontSize: 8,
    letterSpacing: 0.5,
    color: palette.muted,
  },

  accentBar: {
    width: 40,
    height: 2,
    backgroundColor: palette.accent,
    marginBottom: 16,
  },
});

/* -------------------------------------------------------------------------- */
/*                              Helpers                                       */
/* -------------------------------------------------------------------------- */

function pence(n: number | null | undefined): string {
  if (n == null) return "—";
  const abs = Math.abs(n);
  const str = (abs / 100).toFixed(2);
  const formatted = str.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${n < 0 ? "-" : ""}£${formatted}`;
}

function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function fmtDateShort(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function settlementTypeLabel(t: string | null | undefined): string {
  if (!t) return "—";
  const map: Record<string, string> = {
    guarantee: "Guarantee",
    split: "Door split",
    vs_guarantee: "vs. Guarantee",
    flat_fee: "Flat fee",
    percentage: "Percentage",
  };
  return map[t] ?? t;
}

/* -------------------------------------------------------------------------- */
/*                             Sub-components                                 */
/* -------------------------------------------------------------------------- */

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoItem}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || "—"}</Text>
    </View>
  );
}

function PageFooter({ show, type }: { show: Show; type: SettlementType }) {
  return (
    <View style={styles.footer} fixed>
      <Text>{show.showDate ? fmtDate(show.showDate) : "Settlement sheet"}</Text>
      <Text>{type.charAt(0).toUpperCase() + type.slice(1)} settlement · Generated {new Date().toLocaleDateString("en-GB")}</Text>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                          Main document component                           */
/* -------------------------------------------------------------------------- */

export function SettlementDocument({ data }: { data: SettlementData }) {
  const { type, show, tour, venue, comedian, accommodations, travel, financials } = data;
  const isFull = type === "full" || type === "contract";
  const isContract = type === "contract";

  return (
    <Document
      title={`Settlement – ${show.showDate} – ${venue?.name ?? tour.name}`}
      author="Comedy Tour Manager"
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.eyebrow}>{tour.name}</Text>
            <Text style={styles.title}>{venue?.name ?? "Settlement Sheet"}</Text>
            <Text style={styles.subtitle}>
              {venue?.city ?? show.city ?? ""}
              {(venue?.city || show.city) ? "  ·  " : ""}
              {fmtDate(show.showDate)}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerMeta}>
              <Text style={styles.headerMetaBold}>Type: </Text>
              {type.charAt(0).toUpperCase() + type.slice(1)} settlement
            </Text>
            <Text style={styles.headerMeta}>
              <Text style={styles.headerMetaBold}>Status: </Text>
              {show.status.charAt(0).toUpperCase() + show.status.slice(1)}
            </Text>
            {comedian && (
              <Text style={styles.headerMeta}>
                <Text style={styles.headerMetaBold}>Artist: </Text>
                {comedian.stageName}
              </Text>
            )}
          </View>
        </View>

        {/* Show details */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Show details</Text>
          <View style={styles.infoGrid}>
            <InfoItem label="Date" value={fmtDate(show.showDate)} />
            <InfoItem label="Show time" value={show.showTime ?? "—"} />
            <InfoItem label="Doors" value={show.doorsTime ?? "—"} />
            <InfoItem label="City" value={show.city ?? venue?.city ?? "—"} />
            <InfoItem label="Venue" value={venue?.name ?? "—"} />
            <InfoItem label="Address" value={[venue?.addressLine1, venue?.addressLine2, venue?.city, venue?.postcode].filter(Boolean).join(", ") || "—"} />
            {show.supportAct && <InfoItem label="Support act" value={show.supportAct} />}
          </View>
        </View>

        <View style={styles.divider} />

        {/* Settlement terms */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Settlement terms</Text>
          <View style={styles.infoGrid}>
            <InfoItem label="Deal type" value={settlementTypeLabel(show.settlementType)} />
            <InfoItem label="Guarantee" value={pence(show.settlementGuaranteePence)} />
            {show.settlementSplitPercent != null && (
              <InfoItem label="Split %" value={`${show.settlementSplitPercent}%`} />
            )}
            <InfoItem label="Venue hire fee" value={pence(show.venueHireFeePence)} />
          </View>
        </View>

        <View style={styles.divider} />

        {/* Financial summary */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Financial summary</Text>
          <View style={styles.finGrid}>
            <View style={styles.finRow}>
              <View style={[styles.finCell, { marginRight: 1 }]}>
                <Text style={styles.finCellLabel}>Ticket revenue</Text>
                <Text style={styles.finCellValue}>{pence(financials.ticketRevenuePence)}</Text>
              </View>
              <View style={styles.finCell}>
                <Text style={styles.finCellLabel}>Total costs</Text>
                <Text style={styles.finCellValue}>{pence(financials.totalCostsPence)}</Text>
              </View>
            </View>
            <View style={styles.finCellWide}>
              <Text style={styles.finCellLabel}>Net</Text>
              <Text style={financials.netPence < 0 ? styles.finCellValueNeg : styles.finCellValueAccent}>
                {pence(financials.netPence)}
              </Text>
            </View>
          </View>
        </View>

        {/* Full: ticket breakdown + itemised costs */}
        {isFull && (
          <>
            <View style={styles.divider} />

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Ticket breakdown</Text>
              <View style={styles.tableHeader}>
                <Text style={styles.tableColLabel}>Item</Text>
                <Text style={styles.tableColValue}>Count</Text>
                <Text style={styles.tableColValue}>Value</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableCellLabel}>Capacity</Text>
                <Text style={styles.tableCellValue}>{show.ticketCapacity ?? "—"}</Text>
                <Text style={styles.tableCellValue}>—</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableCellLabel}>Tickets sold</Text>
                <Text style={styles.tableCellValue}>{financials.ticketsSold}</Text>
                <Text style={styles.tableCellValue}>{pence(financials.ticketRevenuePence)}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableCellLabel}>Comps</Text>
                <Text style={styles.tableCellValue}>{financials.ticketsComped}</Text>
                <Text style={styles.tableCellValue}>—</Text>
              </View>
              {financials.capacityRemaining != null && (
                <View style={styles.tableRow}>
                  <Text style={styles.tableCellLabel}>Unsold</Text>
                  <Text style={styles.tableCellValue}>{financials.capacityRemaining}</Text>
                  <Text style={styles.tableCellValue}>—</Text>
                </View>
              )}
              {financials.occupancyPercent != null && (
                <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.tableCellLabel}>Occupancy</Text>
                  <Text style={styles.tableCellValue}>{financials.occupancyPercent}%</Text>
                  <Text style={styles.tableCellValue}>—</Text>
                </View>
              )}
            </View>

            <View style={styles.divider} />

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Cost breakdown</Text>
              <View style={styles.tableHeader}>
                <Text style={styles.tableColLabel}>Item</Text>
                <Text style={styles.tableColValue}>Amount</Text>
              </View>
              {financials.venueFeePence > 0 && (
                <View style={styles.tableRow}>
                  <Text style={styles.tableCellLabel}>Venue hire</Text>
                  <Text style={styles.tableCellValue}>{pence(financials.venueFeePence)}</Text>
                </View>
              )}
              {financials.accommodationPence > 0 && (
                <View style={styles.tableRow}>
                  <Text style={styles.tableCellLabel}>Accommodation</Text>
                  <Text style={styles.tableCellValue}>{pence(financials.accommodationPence)}</Text>
                </View>
              )}
              {financials.travelPence > 0 && (
                <View style={styles.tableRow}>
                  <Text style={styles.tableCellLabel}>Travel</Text>
                  <Text style={styles.tableCellValue}>{pence(financials.travelPence)}</Text>
                </View>
              )}
              {financials.marketingPence > 0 && (
                <View style={styles.tableRow}>
                  <Text style={styles.tableCellLabel}>Marketing</Text>
                  <Text style={styles.tableCellValue}>{pence(financials.marketingPence)}</Text>
                </View>
              )}
              <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
                <Text style={[styles.tableCellLabel, { fontFamily: "Helvetica-Bold" }]}>Total costs</Text>
                <Text style={[styles.tableCellValue, { color: palette.accent }]}>{pence(financials.totalCostsPence)}</Text>
              </View>
            </View>

            {/* Accommodation details */}
            {accommodations.length > 0 && (
              <>
                <View style={styles.divider} />
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Accommodation</Text>
                  {accommodations.map((a) => (
                    <View key={a.id} style={[styles.infoGrid, { marginBottom: 12 }]}>
                      <InfoItem label="Hotel" value={a.hotelName ?? "—"} />
                      <InfoItem label="Address" value={a.address ?? "—"} />
                      <InfoItem label="Check-in" value={a.checkIn ? fmtDateShort(a.checkIn) : "—"} />
                      <InfoItem label="Check-out" value={a.checkOut ? fmtDateShort(a.checkOut) : "—"} />
                      <InfoItem label="Reference" value={a.bookingReference ?? "—"} />
                      <InfoItem label="Cost" value={pence(a.costPence)} />
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* Travel details */}
            {travel.length > 0 && (
              <>
                <View style={styles.divider} />
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Travel</Text>
                  {travel.map((t) => (
                    <View key={t.id} style={[styles.infoGrid, { marginBottom: 12 }]}>
                      <InfoItem label="Type" value={t.travelType} />
                      <InfoItem label="From" value={t.departureLocation ?? "—"} />
                      <InfoItem label="To" value={t.arrivalLocation ?? "—"} />
                      <InfoItem
                        label="Departure"
                        value={t.departureAt ? fmtDateShort(t.departureAt) : "—"}
                      />
                      <InfoItem label="Reference" value={t.bookingReference ?? "—"} />
                      <InfoItem label="Cost" value={pence(t.costPence)} />
                    </View>
                  ))}
                </View>
              </>
            )}
          </>
        )}

        {/* Contract: rider + terms + signature */}
        {isContract && comedian && (
          <>
            {(comedian.hospitalityRider || comedian.technicalRider || comedian.dressingRoomRequirements) && (
              <>
                <View style={styles.divider} />
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Artist rider</Text>

                  {comedian.hospitalityRider && (
                    <View style={{ marginBottom: 12 }}>
                      <Text style={[styles.infoLabel, { marginBottom: 6 }]}>Hospitality</Text>
                      <View style={styles.textBlock}>
                        <Text>{comedian.hospitalityRider}</Text>
                      </View>
                    </View>
                  )}

                  {comedian.technicalRider && (
                    <View style={{ marginBottom: 12 }}>
                      <Text style={[styles.infoLabel, { marginBottom: 6 }]}>Technical</Text>
                      <View style={styles.textBlock}>
                        <Text>{comedian.technicalRider}</Text>
                      </View>
                    </View>
                  )}

                  {comedian.dressingRoomRequirements && (
                    <View style={{ marginBottom: 12 }}>
                      <Text style={[styles.infoLabel, { marginBottom: 6 }]}>Dressing room</Text>
                      <View style={styles.textBlock}>
                        <Text>{comedian.dressingRoomRequirements}</Text>
                      </View>
                    </View>
                  )}
                </View>
              </>
            )}

            {/* Agent info */}
            {(comedian.agentName || comedian.agentCompany) && (
              <>
                <View style={styles.divider} />
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Artist representation</Text>
                  <View style={styles.infoGrid}>
                    <InfoItem label="Agent" value={comedian.agentName ?? "—"} />
                    <InfoItem label="Agency" value={comedian.agentCompany ?? "—"} />
                    <InfoItem label="Phone" value={comedian.agentPhone ?? "—"} />
                    <InfoItem label="Email" value={comedian.agentEmail ?? "—"} />
                  </View>
                </View>
              </>
            )}

            <View style={styles.divider} />

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Settlement agreement</Text>
              <View style={styles.textBlock}>
                <Text>
                  {`This settlement sheet confirms the financial terms agreed between the artist and promoter for the above-listed performance. The figures herein represent the final settlement unless otherwise disputed in writing within 14 days of the performance date. Both parties confirm the details above are accurate and accept the net settlement amount of ${pence(financials.netPence)} as full and final payment for this engagement.`}
                </Text>
              </View>
            </View>

            <View style={[styles.divider, { marginTop: 8 }]} />

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Signatures</Text>
              <View style={styles.sigRow}>
                <View style={styles.sigCol}>
                  <View style={styles.sigLine} />
                  <Text style={styles.sigLabel}>Artist / Artist representative</Text>
                  <Text style={[styles.sigLabel, { marginTop: 4 }]}>Date: _____________</Text>
                </View>
                <View style={styles.sigColLast}>
                  <View style={styles.sigLine} />
                  <Text style={styles.sigLabel}>Promoter / Tour manager</Text>
                  <Text style={[styles.sigLabel, { marginTop: 4 }]}>Date: _____________</Text>
                </View>
              </View>
            </View>
          </>
        )}

        <PageFooter show={show} type={type} />
      </Page>
    </Document>
  );
}
