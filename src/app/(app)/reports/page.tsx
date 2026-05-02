import Link from "next/link";
import { requireOrg } from "@/lib/auth";
import { getOrgReportData } from "@/lib/finance";
import { formatPence } from "@/lib/utils";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

function EstChip() {
  return (
    <span className="ml-1.5 rounded bg-amber-100 px-1 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
      Est.
    </span>
  );
}

type Tab = "tours" | "comedians" | "venues";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { orgId } = await requireOrg();
  const sp = await searchParams;
  const tab: Tab = (sp.tab === "comedians" || sp.tab === "venues") ? sp.tab : "tours";

  const { tourReports, comedianReports, venueReports } = await getOrgReportData(orgId);

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: "tours", label: "By Tour" },
    { key: "comedians", label: "By Comedian" },
    { key: "venues", label: "By Venue" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Org-wide financial and show analytics" />

      {/* Tab nav */}
      <nav className="flex gap-1 border-b border-border pb-0">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/reports?tab=${t.key}`}
            className={`px-4 py-2 text-sm font-medium rounded-t transition-colors ${
              tab === t.key
                ? "border-b-2 border-accent text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {/* Tours tab */}
      {tab === "tours" && (
        <Card>
          <CardHeader>
            <CardTitle>Tour summary</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {tourReports.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">No tours found.</p>
            ) : (
              <Table>
                <THead>
                  <TR>
                    <TH>Tour</TH>
                    <TH>Comedian</TH>
                    <TH>Status</TH>
                    <TH className="text-right">Shows</TH>
                    <TH className="text-right">Revenue</TH>
                    <TH className="text-right">Costs</TH>
                    <TH className="text-right">Net</TH>
                    <TH className="text-right">Occupancy</TH>
                  </TR>
                </THead>
                <TBody>
                  {tourReports.map((t) => (
                    <TR key={t.tourId}>
                      <TD>
                        <Link href={`/tours/${t.tourId}`} className="font-medium hover:underline">
                          {t.tourName}
                        </Link>
                      </TD>
                      <TD className="text-muted-foreground">{t.comedianName}</TD>
                      <TD>
                        <span className="capitalize text-xs px-2 py-0.5 rounded-full bg-surface-2">
                          {t.status}
                        </span>
                      </TD>
                      <TD className="text-right tabular-nums">{t.showCount}</TD>
                      <TD className="text-right tabular-nums">
                        {formatPence(t.revenuePence)}
                        {t.hasEstimates && <EstChip />}
                      </TD>
                      <TD className="text-right tabular-nums">{formatPence(t.costsPence)}</TD>
                      <TD className={`text-right tabular-nums ${t.netPence < 0 ? "text-destructive" : ""}`}>
                        {formatPence(t.netPence)}
                        {t.hasEstimates && <EstChip />}
                      </TD>
                      <TD className="text-right tabular-nums">
                        {t.avgOccupancyPercent != null ? `${t.avgOccupancyPercent}%` : "—"}
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Comedians tab */}
      {tab === "comedians" && (
        <Card>
          <CardHeader>
            <CardTitle>Comedian summary</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {comedianReports.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">No comedian data found.</p>
            ) : (
              <Table>
                <THead>
                  <TR>
                    <TH>Comedian</TH>
                    <TH className="text-right">Tours</TH>
                    <TH className="text-right">Shows</TH>
                    <TH className="text-right">Revenue</TH>
                    <TH className="text-right">Net</TH>
                    <TH className="text-right">Avg / show</TH>
                    <TH className="text-right">Avg occupancy</TH>
                  </TR>
                </THead>
                <TBody>
                  {comedianReports.map((c) => (
                    <TR key={c.comedianId}>
                      <TD>
                        <Link href={`/comedians/${c.comedianId}`} className="font-medium hover:underline">
                          {c.comedianName}
                        </Link>
                      </TD>
                      <TD className="text-right tabular-nums">{c.tourCount}</TD>
                      <TD className="text-right tabular-nums">{c.showCount}</TD>
                      <TD className="text-right tabular-nums">
                        {formatPence(c.revenuePence)}
                        {c.hasEstimates && <EstChip />}
                      </TD>
                      <TD className={`text-right tabular-nums ${c.netPence < 0 ? "text-destructive" : ""}`}>
                        {formatPence(c.netPence)}
                        {c.hasEstimates && <EstChip />}
                      </TD>
                      <TD className="text-right tabular-nums">{formatPence(c.avgRevenuePerShow)}</TD>
                      <TD className="text-right tabular-nums">
                        {c.avgOccupancyPercent != null ? `${c.avgOccupancyPercent}%` : "—"}
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Venues tab */}
      {tab === "venues" && (
        <Card>
          <CardHeader>
            <CardTitle>Venue summary</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {venueReports.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">No venue data found.</p>
            ) : (
              <Table>
                <THead>
                  <TR>
                    <TH>Venue</TH>
                    <TH>City</TH>
                    <TH className="text-right">Shows</TH>
                    <TH className="text-right">Total revenue</TH>
                    <TH className="text-right">Avg occupancy</TH>
                  </TR>
                </THead>
                <TBody>
                  {venueReports.map((v) => (
                    <TR key={v.venueId}>
                      <TD>
                        <Link href={`/venues/${v.venueId}`} className="font-medium hover:underline">
                          {v.venueName}
                        </Link>
                      </TD>
                      <TD className="text-muted-foreground">{v.city ?? "—"}</TD>
                      <TD className="text-right tabular-nums">{v.showCount}</TD>
                      <TD className="text-right tabular-nums">{formatPence(v.revenuePence)}</TD>
                      <TD className="text-right tabular-nums">
                        {v.avgOccupancyPercent != null ? `${v.avgOccupancyPercent}%` : "—"}
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
