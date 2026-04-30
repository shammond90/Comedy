import "server-only";
import { db } from "@/db/client";
import { activityLog, type ActivityAction } from "@/db/schema";

/* -------------------------------------------------------------------------- */
/*                                  Diff util                                 */
/* -------------------------------------------------------------------------- */

/**
 * Compute a shallow `{ field: { from, to } }` diff between two records.
 * Skips fields where both values are equal (after coarse normalisation).
 * `null` and `undefined` are treated as equal.
 */
export function diffRecords<T extends Record<string, unknown>>(
  before: T,
  after: T,
  ignore: string[] = ["updatedAt", "createdAt"],
): Record<string, { from: unknown; to: unknown }> | null {
  const out: Record<string, { from: unknown; to: unknown }> = {};
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const k of keys) {
    if (ignore.includes(k)) continue;
    const a = before[k];
    const b = after[k];
    if (eq(a, b)) continue;
    out[k] = { from: a, to: b };
  }
  return Object.keys(out).length > 0 ? out : null;
}

function eq(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null && b == null) return true;
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  if (typeof a === "number" && typeof b === "number") return a === b;
  return false;
}

/* -------------------------------------------------------------------------- */
/*                                  logActivity                                */
/* -------------------------------------------------------------------------- */

export async function logActivity(opts: {
  orgId: string;
  userId: string;
  resourceType: string;
  resourceId: string | null;
  action: ActivityAction;
  summary: string;
  changes?: Record<string, { from: unknown; to: unknown }> | null;
}): Promise<void> {
  await db.insert(activityLog).values({
    orgId: opts.orgId,
    userId: opts.userId,
    resourceType: opts.resourceType,
    resourceId: opts.resourceId,
    action: opts.action,
    summary: opts.summary,
    changes: opts.changes ?? null,
  });
}

/**
 * Render a single change entry as a string for compact UIs.
 * "showTime: 19:00 → 19:30"
 */
export function formatChange(field: string, change: { from: unknown; to: unknown }): string {
  const f = formatVal(change.from);
  const t = formatVal(change.to);
  return `${field}: ${f} → ${t}`;
}

function formatVal(v: unknown): string {
  if (v == null || v === "") return "—";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "yes" : "no";
  return String(v);
}
