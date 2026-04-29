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

export function Pill({
  children,
  tone = "default",
  className,
}: {
  children: React.ReactNode;
  tone?: "default" | "accent" | "success" | "warning" | "destructive";
  className?: string;
}) {
  const tones: Record<string, string> = {
    default: "bg-surface-2 text-muted-foreground",
    accent: "bg-accent-soft text-accent",
    success: "bg-[var(--status-confirmed-bg)] text-[var(--status-confirmed-fg)]",
    warning: "bg-[var(--status-contacted-bg)] text-[var(--status-contacted-fg)]",
    destructive: "bg-[var(--status-unavailable-bg)] text-[var(--status-unavailable-fg)]",
  };
  return (
    <span className={cn("pill", tones[tone], className)}>{children}</span>
  );
}
