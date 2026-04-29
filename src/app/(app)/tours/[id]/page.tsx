import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { tours, comedians, venues } from "@/db/schema";
import { requireOrg } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { formatDate, formatPence } from "@/lib/utils";
import { getTourFinancials } from "@/lib/finance";
import { deleteTourAction } from "../actions";
import { PageHeader } from "@/components/app/page-header";
import { StatusPill } from "@/components/ui/pill";

export default async function TourDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { orgId } = await requireOrg();

  const [t] = await db
    .select({
      id: tours.id,
      name: tours.name,
      status: tours.status,
      startDate: tours.startDate,
      endDate: tours.endDate,
      description: tours.description,
      budgetPence: tours.budgetPence,
      comedianId: tours.comedianId,
      comedianName: comedians.stageName,
    })
    .from(tours)
    .leftJoin(comedians, eq(tours.comedianId, comedians.id))
    .where(and(eq(tours.id, id), eq(tours.orgId, orgId)))
    .limit(1);
  if (!t) notFound();

  const { perShow, totals, showCount } = await getTourFinancials(orgId, t.id);

  // Fetch venue names for the agenda
  const venueIds = perShow
    .map((p) => p.show.venueId)
    .filter((v): v is string => v != null);
  const venueRows = venueIds.length
    ? await db
        .select({ id: venues.id, name: venues.name, city: venues.city })
        .from(venues)
        .where(and(eq(venues.orgId, orgId), isNull(venues.archivedAt)))
    : [];
  const venueMap = new Map(venueRows.map((v) => [v.id, v]));

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t.comedianName ?? "Tour"}
        title={
          <span className="flex items-center gap-3">
            <span>{t.name}</span>
            <StatusPill status={t.status} />
          </span>
        }
        description={
          <>
            {formatDate(t.startDate)} – {formatDate(t.endDate)}
            {t.description ? <> · {t.description}</> : null}
          </>
        }
        actions={
          <>
            <Link href={`/tours/${t.id}/edit`}>
              <Button variant="outline">Edit</Button>
            </Link>
            <a
              href={`/api/tours/${t.id}/tour-book`}
              target="_blank"
              rel="noopener"
            >
              <Button variant="outline">Tour book PDF</Button>
            </a>
            <form action={deleteTourAction}>
              <input type="hidden" name="id" value={t.id} />
              <Button type="submit" variant="destructive" formNoValidate>
                Archive
              </Button>
            </form>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-xs uppercase tracking-wider font-medium text-subtle">
              Shows
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-3xl tabular-nums">{showCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-xs uppercase tracking-wider font-medium text-subtle">
              Tickets sold
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-3xl tabular-nums">{totals.ticketsSold}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-xs uppercase tracking-wider font-medium text-subtle">
              Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-3xl tabular-nums">
              {formatPence(totals.revenuePence)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-xs uppercase tracking-wider font-medium text-subtle">
              Net P&amp;L
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`font-display text-3xl tabular-nums ${
                totals.netPence < 0 ? "text-destructive" : ""
              }`}
            >
              {formatPence(totals.netPence)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Costs: {formatPence(totals.costsPence)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Shows</CardTitle>
          <Link href={`/tours/${t.id}/shows/new`}>
            <Button size="sm">Add show</Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {perShow.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              No shows yet. Add the first one to start scheduling.
            </p>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Date</TH>
                  <TH>City / venue</TH>
                  <TH>Status</TH>
                  <TH className="text-right">Sold / cap</TH>
                  <TH className="text-right">Revenue</TH>
                  <TH className="text-right">Net</TH>
                </TR>
              </THead>
              <TBody>
                {perShow.map(({ show, fin }) => {
                  const v = show.venueId ? venueMap.get(show.venueId) : null;
                  return (
                    <TR key={show.id}>
                      <TD className="whitespace-nowrap">
                        <Link
                          href={`/tours/${t.id}/shows/${show.id}`}
                          className="font-medium hover:underline"
                        >
                          {formatDate(show.showDate)}
                        </Link>
                      </TD>
                      <TD>
                        <div className="text-sm">
                          {show.city ?? v?.city ?? "—"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {v?.name ?? "No venue"}
                        </div>
                      </TD>
                      <TD>
                        <StatusPill status={show.status} />
                      </TD>
                      <TD className="text-right tabular-nums">
                        {fin.ticketsSold}
                        {show.ticketCapacity != null
                          ? ` / ${show.ticketCapacity}`
                          : ""}
                      </TD>
                      <TD className="text-right tabular-nums">
                        {formatPence(fin.ticketRevenuePence)}
                      </TD>
                      <TD
                        className={`text-right tabular-nums ${
                          fin.netPence < 0 ? "text-destructive" : ""
                        }`}
                      >
                        {formatPence(fin.netPence)}
                      </TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {t.budgetPence != null && (
        <Card>
          <CardHeader>
            <CardTitle>Budget</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>
              Tour budget: <strong>{formatPence(t.budgetPence)}</strong>
            </p>
            <p className="text-muted-foreground">
              Spent so far: {formatPence(totals.costsPence)} ·
              Remaining: {formatPence(t.budgetPence - totals.costsPence)}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
