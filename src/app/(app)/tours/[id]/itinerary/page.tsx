import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { tours } from "@/db/schema";
import { requireOrg } from "@/lib/auth";
import { getTourRole } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/page-header";
import {
  buildDayBuckets,
  formatDayName,
  formatDayNumber,
  formatLongDate,
  formatMonthShort,
  formatTimeFromString,
  loadItineraryData,
  type DayBucket,
  type ShowBundle,
  type TimelineEvent,
  type TimelineEventKind,
} from "@/lib/itinerary";

export const dynamic = "force-dynamic";

export default async function TourItineraryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user } = await requireOrg();

  const tourRole = await getTourRole(user.id, id);
  if (!tourRole) notFound();

  const [tourRow] = await db
    .select({ orgId: tours.orgId })
    .from(tours)
    .where(eq(tours.id, id))
    .limit(1);
  if (!tourRow) notFound();

  const data = await loadItineraryData(tourRow.orgId, id);
  if (!data) notFound();

  const days = buildDayBuckets(data);

  return (
    <div className="space-y-6 print:space-y-3">
      <div className="print:hidden">
        <PageHeader
          eyebrow={data.comedian ? data.comedian.stageName : "Tour"}
          title={`${data.tour.name} — Itinerary`}
          description={`${days.length} day${days.length === 1 ? "" : "s"} of activity`}
          actions={
            <>
              <Link href={`/tours/${data.tour.id}`}>
                <Button variant="outline">Back to tour</Button>
              </Link>
              <a href={`/api/tours/${data.tour.id}/itinerary`} target="_blank" rel="noopener">
                <Button>Download PDF</Button>
              </a>
            </>
          }
        />
      </div>

      {/* Print-only header */}
      <div className="hidden print:block">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          {data.comedian?.stageName ?? "Tour"}
        </p>
        <h1 className="font-display text-2xl">{data.tour.name} — Itinerary</h1>
      </div>

      {days.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No itinerary data yet. Add shows, travel and accommodation to populate
          the day-by-day plan.
        </p>
      ) : (
        <div className="space-y-6 print:space-y-4">
          {days.map((day) => (
            <DayCard key={day.key} day={day} />
          ))}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  Day card                                  */
/* -------------------------------------------------------------------------- */

function DayCard({ day }: { day: DayBucket }) {
  const sb = day.show;
  const venue = sb?.venue ?? null;
  const accom = sb?.accommodations ?? [];
  const travelLegs = sb?.travel ?? [];

  return (
    <section
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm print:break-after-page print:shadow-none print:rounded-none print:border-0"
    >
      {/* Header strip */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-surface-2/60 px-6 py-4 print:bg-transparent">
        <div className="flex items-center gap-4">
          <DateBlock dateKey={day.key} />
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {formatDayName(day.key)}
            </p>
            <p className="font-display text-xl">{formatLongDate(day.key)}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          {day.hasShow && <Tag color="accent">Show</Tag>}
          {day.hasTravel && <Tag color="travel">Travel</Tag>}
          {day.hasAccom && <Tag color="accom">Hotel</Tag>}
        </div>
      </header>

      <div className="grid gap-6 p-6 lg:grid-cols-[1fr_320px] print:grid-cols-[1fr_280px] print:gap-4 print:p-4">
        {/* Timeline */}
        <Timeline events={day.events} />

        {/* Side info: venue + hotels + travel */}
        <aside className="space-y-4">
          {sb && <ShowBlock sb={sb} venue={venue} />}
          {accom.length > 0 && <HotelBlock accommodations={accom} />}
          {travelLegs.length > 0 && <TravelBlock travelLegs={travelLegs} />}
          {!sb && accom.length === 0 && travelLegs.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Day-only events (reminders or single-leg travel/hotel).
            </p>
          )}
        </aside>
      </div>
    </section>
  );
}

function DateBlock({ dateKey }: { dateKey: string }) {
  return (
    <div className="flex h-16 w-16 flex-col items-center justify-center rounded-xl border border-border bg-background text-center">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {formatMonthShort(dateKey)}
      </span>
      <span className="font-display text-2xl leading-none">
        {formatDayNumber(dateKey)}
      </span>
    </div>
  );
}

function Tag({
  color,
  children,
}: {
  color: "accent" | "travel" | "accom";
  children: React.ReactNode;
}) {
  const palette: Record<typeof color, string> = {
    accent: "bg-accent/10 text-accent border-accent/30",
    travel: "bg-blue-500/10 text-blue-600 border-blue-500/30 dark:text-blue-400",
    accom: "bg-purple-500/10 text-purple-600 border-purple-500/30 dark:text-purple-400",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 font-medium uppercase tracking-wider ${palette[color]}`}
    >
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  Timeline                                  */
/* -------------------------------------------------------------------------- */

const eventMeta: Record<
  TimelineEventKind,
  { dotClass: string; label: string }
> = {
  "travel-depart": { dotClass: "bg-blue-500", label: "Depart" },
  "travel-arrive": { dotClass: "bg-blue-500", label: "Arrive" },
  "check-in": { dotClass: "bg-purple-500", label: "Check-in" },
  "check-out": { dotClass: "bg-purple-500", label: "Check-out" },
  doors: { dotClass: "bg-amber-500", label: "Doors" },
  show: { dotClass: "bg-accent", label: "Show" },
  reminder: { dotClass: "bg-foreground", label: "Reminder" },
};

function Timeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No timed events for this day.
      </div>
    );
  }
  return (
    <ol className="relative space-y-4 border-l border-border pl-6">
      {events.map((ev, i) => (
        <li key={i} className="relative">
          <span
            className={`absolute -left-[31px] top-1.5 h-3 w-3 rounded-full ring-4 ring-card ${eventMeta[ev.kind].dotClass}`}
          />
          <div className="flex flex-wrap items-baseline gap-x-3">
            <span className="font-mono text-sm tabular-nums text-muted-foreground">
              {ev.time ?? "--:--"}
            </span>
            <span className="font-medium">{ev.title}</span>
            {ev.subtitle && (
              <span className="text-sm text-muted-foreground">
                {ev.subtitle}
              </span>
            )}
          </div>
          {ev.details.length > 0 && (
            <ul className="mt-1 space-y-0.5 text-sm text-muted-foreground">
              {ev.details.map((d, j) => (
                <li key={j}>{d}</li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ol>
  );
}

/* -------------------------------------------------------------------------- */
/*                                Side blocks                                 */
/* -------------------------------------------------------------------------- */

function ShowBlock({
  sb,
  venue,
}: {
  sb: ShowBundle;
  venue: ShowBundle["venue"];
}) {
  const showTime = formatTimeFromString(sb.show.showTime);
  const doorsTime = formatTimeFromString(sb.show.doorsTime);

  const venueLines = [
    venue?.addressLine1,
    venue?.addressLine2,
    [venue?.city, venue?.postcode].filter(Boolean).join(" "),
    venue?.country,
  ].filter((l) => l && l.length > 0) as string[];

  return (
    <section className="rounded-xl border border-accent/30 bg-accent/5 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-accent">
        Tonight&apos;s show
      </p>
      <p className="mt-1 font-display text-lg leading-tight">
        {venue?.name ?? sb.show.city ?? "Venue TBC"}
      </p>
      <dl className="mt-3 space-y-1 text-sm">
        <DT label="Doors">{doorsTime ?? "—"}</DT>
        <DT label="Show">{showTime ?? "—"}</DT>
        {sb.show.supportAct && <DT label="Support">{sb.show.supportAct}</DT>}
      </dl>

      {venueLines.length > 0 && (
        <div className="mt-3 border-t border-accent/20 pt-3 text-sm">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Address
          </p>
          {venueLines.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      )}

      {(venue?.primaryContactName ||
        venue?.primaryContactPhone ||
        venue?.primaryContactEmail) && (
        <div className="mt-3 border-t border-accent/20 pt-3 text-sm">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Venue contact
          </p>
          {venue.primaryContactName && (
            <p>
              {venue.primaryContactName}
              {venue.primaryContactRole && (
                <span className="text-muted-foreground"> · {venue.primaryContactRole}</span>
              )}
            </p>
          )}
          {venue.primaryContactPhone && <p>{venue.primaryContactPhone}</p>}
          {venue.primaryContactEmail && <p>{venue.primaryContactEmail}</p>}
        </div>
      )}

      {(venue?.technicalContactName ||
        venue?.technicalContactPhone ||
        venue?.technicalContactEmail) && (
        <div className="mt-3 border-t border-accent/20 pt-3 text-sm">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Technical contact
          </p>
          {venue.technicalContactName && <p>{venue.technicalContactName}</p>}
          {venue.technicalContactPhone && <p>{venue.technicalContactPhone}</p>}
          {venue.technicalContactEmail && <p>{venue.technicalContactEmail}</p>}
        </div>
      )}

      {(venue?.loadInDetails || venue?.parkingInfo) && (
        <div className="mt-3 border-t border-accent/20 pt-3 text-sm">
          {venue.loadInDetails && (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Load-in
              </p>
              <p className="whitespace-pre-wrap">{venue.loadInDetails}</p>
            </>
          )}
          {venue.parkingInfo && (
            <>
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Parking
              </p>
              <p className="whitespace-pre-wrap">{venue.parkingInfo}</p>
            </>
          )}
        </div>
      )}
    </section>
  );
}

function HotelBlock({
  accommodations,
}: {
  accommodations: ShowBundle["accommodations"];
}) {
  return (
    <section className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
        Accommodation
      </p>
      <div className="mt-2 space-y-3 text-sm">
        {accommodations.map((a) => (
          <div key={a.id}>
            <p className="font-medium">{a.hotelName ?? "Hotel"}</p>
            {a.address && (
              <p className="whitespace-pre-wrap text-muted-foreground">
                {a.address}
              </p>
            )}
            {a.contactPhone && <p>Tel: {a.contactPhone}</p>}
            {a.bookingReference && (
              <p className="text-xs text-muted-foreground">
                Ref: {a.bookingReference}
              </p>
            )}
            {(a.checkIn || a.checkOut) && (
              <p className="text-xs text-muted-foreground">
                {a.checkIn ? `In: ${a.checkIn}` : ""}
                {a.checkIn && a.checkOut ? " · " : ""}
                {a.checkOut ? `Out: ${a.checkOut}` : ""}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function TravelBlock({
  travelLegs,
}: {
  travelLegs: ShowBundle["travel"];
}) {
  return (
    <section className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
        Travel
      </p>
      <ul className="mt-2 space-y-2 text-sm">
        {travelLegs.map((t) => (
          <li key={t.id}>
            <p className="font-medium">
              {t.departureLocation ?? "?"} → {t.arrivalLocation ?? "?"}
            </p>
            {t.bookingReference && (
              <p className="text-xs text-muted-foreground">
                Ref: {t.bookingReference}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function DT({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="font-medium tabular-nums">{children}</dd>
    </div>
  );
}
