import * as React from "react";
import { cn } from "@/lib/utils";

export type StatusKey =
  | "planned"
  | "contacted"
  | "booked"
  | "rider_sent"
  | "confirmed"
  | "unavailable"
  | "cancelled"
  | "planning"
  | "in_progress"
  | "completed";

const labels: Record<StatusKey, string> = {
  planned: "Planned",
  contacted: "Contacted",
  booked: "Booked",
  rider_sent: "Rider sent",
  confirmed: "Confirmed",
  unavailable: "Unavailable",
  cancelled: "Cancelled",
  planning: "Planning",
  in_progress: "In progress",
  completed: "Completed",
};

export function StatusPill({
  status,
  className,
}: {
  status: StatusKey | string;
  className?: string;
}) {
  const key = (status as StatusKey) ?? "planned";
  return (
    <span className={cn("pill", `pill-${key}`, className)}>
      <span
        aria-hidden
        className="inline-block h-1.5 w-1.5 rounded-full bg-current opacity-70"
      />
      {labels[key as StatusKey] ?? String(status).replace(/_/g, " ")}
    </span>
  );
}
