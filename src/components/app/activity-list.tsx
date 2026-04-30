import Link from "next/link";
import { formatChange } from "@/lib/activity";
import type { ActivityAction } from "@/db/schema";

export type ActivityRow = {
  id: string;
  createdAt: Date;
  action: ActivityAction;
  resourceType: string;
  resourceId: string | null;
  summary: string;
  changes: Record<string, { from: unknown; to: unknown }> | null;
  actorEmail: string | null;
};

function relTime(d: Date): string {
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;
  return d.toISOString().slice(0, 10);
}

function linkFor(row: ActivityRow): string | null {
  if (!row.resourceId) return null;
  switch (row.resourceType) {
    case "tour":
      return `/tours/${row.resourceId}`;
    case "show":
      return null; // need tourId to link; omit
    case "comedian":
      return `/comedians/${row.resourceId}`;
    case "venue":
      return `/venues/${row.resourceId}`;
    case "org":
      return `/settings/team`;
    default:
      return null;
  }
}

export function ActivityList({ rows }: { rows: ActivityRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No activity yet.</p>;
  }
  return (
    <ul className="divide-y divide-border">
      {rows.map((r) => {
        const href = linkFor(r);
        const summary = (
          <>
            <span className="font-medium">{r.actorEmail ?? "Someone"}</span>{" "}
            {r.summary}
          </>
        );
        return (
          <li key={r.id} className="py-2.5 text-sm">
            <div className="flex items-baseline justify-between gap-3">
              <div className="min-w-0 flex-1">
                {href ? (
                  <Link href={href} className="hover:underline">
                    {summary}
                  </Link>
                ) : (
                  summary
                )}
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {relTime(r.createdAt)}
              </span>
            </div>
            {r.changes && (
              <ul className="mt-1 space-y-0.5 pl-3 text-xs text-muted-foreground">
                {Object.entries(r.changes)
                  .slice(0, 5)
                  .map(([k, v]) => (
                    <li key={k}>{formatChange(k, v)}</li>
                  ))}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}
