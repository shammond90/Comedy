"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  dateFnsLocalizer,
  Views,
  type View,
} from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enGB } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";

export type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  status: string;
  url: string;
  tourName: string;
};

const locales = { "en-GB": enGB };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1 }),
  getDay,
  locales,
});

const statusColor: Record<string, string> = {
  planned: "#a1a1aa",
  contacted: "#f59e0b",
  booked: "#3b82f6",
  rider_sent: "#6366f1",
  confirmed: "#10b981",
  unavailable: "#ef4444",
  cancelled: "#71717a",
};

export function CalendarView({ events }: { events: CalendarEvent[] }) {
  const router = useRouter();
  const [view, setView] = useState<View>(Views.AGENDA);
  const [date, setDate] = useState<Date>(new Date());

  const parsed = useMemo(
    () =>
      events.map((e) => ({
        ...e,
        start: new Date(e.start),
        end: new Date(e.end),
      })),
    [events],
  );

  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <Calendar
        localizer={localizer}
        culture="en-GB"
        events={parsed}
        startAccessor="start"
        endAccessor="end"
        view={view}
        onView={setView}
        date={date}
        onNavigate={setDate}
        views={[Views.AGENDA, Views.MONTH, Views.WEEK, Views.DAY]}
        defaultView={Views.AGENDA}
        style={{ height: 700 }}
        onSelectEvent={(e) => router.push((e as unknown as CalendarEvent).url)}
        eventPropGetter={(e) => {
          const ev = e as unknown as CalendarEvent;
          return {
            style: {
              backgroundColor: statusColor[ev.status] ?? "#71717a",
              borderColor: statusColor[ev.status] ?? "#71717a",
            },
          };
        }}
        tooltipAccessor={(e) => {
          const ev = e as unknown as CalendarEvent;
          return `${ev.tourName} — ${ev.status.replace(/_/g, " ")}`;
        }}
      />
    </div>
  );
}
