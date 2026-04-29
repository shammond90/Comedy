import { and, asc, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { shows, tours, venues, comedians } from "@/db/schema";
import { requireOrg } from "@/lib/auth";
import { CalendarView, type CalendarEvent } from "./calendar-view";
import { PageHeader } from "@/components/app/page-header";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const { orgId } = await requireOrg();

  const rows = await db
    .select({
      id: shows.id,
      tourId: shows.tourId,
      tourName: tours.name,
      comedianName: comedians.stageName,
      showDate: shows.showDate,
      showTime: shows.showTime,
      status: shows.status,
      venueName: venues.name,
      city: shows.city,
    })
    .from(shows)
    .leftJoin(tours, eq(tours.id, shows.tourId))
    .leftJoin(venues, eq(venues.id, shows.venueId))
    .leftJoin(comedians, eq(comedians.id, tours.comedianId))
    .where(and(eq(shows.orgId, orgId), isNull(shows.archivedAt)))
    .orderBy(asc(shows.showDate));

  const events: CalendarEvent[] = rows.map((r) => {
    const baseDate = r.showDate; // YYYY-MM-DD
    const time = r.showTime ?? "20:00:00";
    const start = new Date(`${baseDate}T${time}`);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    const title = [
      r.comedianName,
      [r.venueName, r.city].filter(Boolean).join(", "),
    ]
      .filter(Boolean)
      .join(" — ");
    return {
      id: r.id,
      title: title || "Show",
      start: start.toISOString(),
      end: end.toISOString(),
      status: r.status,
      url: `/tours/${r.tourId}/shows/${r.id}`,
      tourName: r.tourName ?? "",
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Schedule"
        title="Calendar"
        description={`${events.length} shows scheduled`}
      />
      <CalendarView events={events} />
    </div>
  );
}
