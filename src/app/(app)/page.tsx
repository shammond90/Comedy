import Link from "next/link";
import { requireOrg } from "@/lib/auth";
import { db } from "@/db/client";
import {
  venues,
  comedians,
  tours,
  shows,
  reminders,
} from "@/db/schema";
import { and, asc, eq, gte, isNull, count, lte } from "drizzle-orm";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/page-header";
import { formatDate } from "@/lib/utils";
import {
  completeReminder,
  deleteReminder,
} from "./tours/[id]/shows/[showId]/sub-actions";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { orgId } = await requireOrg();
  const today = new Date().toISOString().slice(0, 10);
  const horizon = new Date();
  horizon.setDate(horizon.getDate() + 14);

  const [venueCount, comedianCount, tourCount, upcomingShowCount] =
    await Promise.all([
      db
        .select({ value: count() })
        .from(venues)
        .where(and(eq(venues.orgId, orgId), isNull(venues.archivedAt))),
      db
        .select({ value: count() })
        .from(comedians)
        .where(and(eq(comedians.orgId, orgId), isNull(comedians.archivedAt))),
      db
        .select({ value: count() })
        .from(tours)
        .where(and(eq(tours.orgId, orgId), isNull(tours.archivedAt))),
      db
        .select({ value: count() })
        .from(shows)
        .where(
          and(
            eq(shows.orgId, orgId),
            gte(shows.showDate, today),
            isNull(shows.archivedAt),
          ),
        ),
    ]);

  const upcomingReminders = await db
    .select({
      id: reminders.id,
      title: reminders.title,
      type: reminders.type,
      dueAt: reminders.dueAt,
      tourId: reminders.tourId,
      showId: reminders.showId,
    })
    .from(reminders)
    .where(
      and(
        eq(reminders.orgId, orgId),
        isNull(reminders.completedAt),
        lte(reminders.dueAt, horizon),
      ),
    )
    .orderBy(asc(reminders.dueAt))
    .limit(10);

  const nextShows = await db
    .select({
      id: shows.id,
      tourId: shows.tourId,
      showDate: shows.showDate,
      city: shows.city,
      status: shows.status,
      tourName: tours.name,
      venueName: venues.name,
    })
    .from(shows)
    .leftJoin(tours, eq(tours.id, shows.tourId))
    .leftJoin(venues, eq(venues.id, shows.venueId))
    .where(
      and(
        eq(shows.orgId, orgId),
        gte(shows.showDate, today),
        isNull(shows.archivedAt),
      ),
    )
    .orderBy(asc(shows.showDate))
    .limit(5);

  const stats = [
    { label: "Tours", value: tourCount[0].value, href: "/tours" },
    {
      label: "Upcoming shows",
      value: upcomingShowCount[0].value,
      href: "/calendar",
    },
    { label: "Venues", value: venueCount[0].value, href: "/venues" },
    { label: "Comedians", value: comedianCount[0].value, href: "/comedians" },
  ];

  const nowMs = new Date().getTime();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Welcome back"
        title="Dashboard"
        description="Overview of your tours and production data."
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="hover:border-border-strong transition-colors">
              <CardHeader>
                <CardTitle className="text-xs uppercase tracking-wider font-medium text-subtle">
                  {s.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-display text-3xl tabular-nums">{s.value}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Reminders</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingReminders.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No reminders due in the next 14 days.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {upcomingReminders.map((r) => {
                  const overdue = r.dueAt.getTime() < nowMs;
                  const href =
                    r.tourId && r.showId
                      ? `/tours/${r.tourId}/shows/${r.showId}`
                      : r.tourId
                        ? `/tours/${r.tourId}`
                        : "/";
                  return (
                    <li
                      key={r.id}
                      className="flex items-center justify-between gap-3 py-2"
                    >
                      <div className="min-w-0">
                        <Link
                          href={href}
                          className="text-sm font-medium hover:underline truncate block"
                        >
                          {r.title}
                        </Link>
                        <p
                          className={`text-xs ${overdue ? "text-destructive" : "text-muted-foreground"}`}
                        >
                          {overdue ? "Overdue · " : ""}
                          {formatDate(r.dueAt.toISOString().slice(0, 10))}
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <form action={completeReminder}>
                          <input type="hidden" name="id" value={r.id} />
                          {r.tourId && (
                            <input type="hidden" name="tourId" value={r.tourId} />
                          )}
                          {r.showId && (
                            <input type="hidden" name="showId" value={r.showId} />
                          )}
                          <Button type="submit" size="sm" variant="ghost" formNoValidate>
                            Done
                          </Button>
                        </form>
                        <form action={deleteReminder}>
                          <input type="hidden" name="id" value={r.id} />
                          {r.tourId && (
                            <input type="hidden" name="tourId" value={r.tourId} />
                          )}
                          {r.showId && (
                            <input type="hidden" name="showId" value={r.showId} />
                          )}
                          <Button type="submit" size="sm" variant="ghost" formNoValidate>
                            ✕
                          </Button>
                        </form>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Next shows</CardTitle>
          </CardHeader>
          <CardContent>
            {nextShows.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No upcoming shows.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {nextShows.map((s) => (
                  <li key={s.id} className="py-2">
                    <Link
                      href={`/tours/${s.tourId}/shows/${s.id}`}
                      className="block hover:underline"
                    >
                      <p className="text-sm font-medium">
                        {formatDate(s.showDate)} ·{" "}
                        {[s.venueName, s.city].filter(Boolean).join(", ") ||
                          "Venue TBC"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {s.tourName} · {s.status.replace(/_/g, " ")}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
