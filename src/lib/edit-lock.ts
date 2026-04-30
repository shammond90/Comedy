import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { editLocks, type LockResourceType } from "@/db/schema";

export const LOCK_TTL_SECONDS = 300; // 5 minutes idle

export type LockResult = {
  /** True if THIS call now owns the lock. */
  acquired: boolean;
  /** Current holder (yourself if acquired, someone else otherwise). */
  userId: string;
  acquiredAt: Date;
  lastActivityAt: Date;
  expiresAt: Date;
};

/**
 * Atomically acquire (or reclaim) the edit lock for a resource.
 *
 * Logic:
 *   - If no current lock OR existing lock is held by the same user OR existing
 *     lock has expired → INSERT or UPDATE so caller becomes holder.
 *   - Otherwise the row is left untouched and the existing holder wins.
 *
 * Caller checks `acquired` to decide what to render.
 */
export async function acquireLock(opts: {
  resourceType: LockResourceType;
  resourceId: string;
  orgId: string;
  userId: string;
  ttlSeconds?: number;
}): Promise<LockResult> {
  const ttl = opts.ttlSeconds ?? LOCK_TTL_SECONDS;
  const expr = sql`now() + (${ttl} || ' seconds')::interval`;

  await db
    .insert(editLocks)
    .values({
      resourceType: opts.resourceType,
      resourceId: opts.resourceId,
      orgId: opts.orgId,
      userId: opts.userId,
      acquiredAt: sql`now()` as unknown as Date,
      lastActivityAt: sql`now()` as unknown as Date,
      expiresAt: expr as unknown as Date,
    })
    .onConflictDoUpdate({
      target: [editLocks.resourceType, editLocks.resourceId],
      set: {
        userId: opts.userId,
        orgId: opts.orgId,
        acquiredAt: sql`now()` as unknown as Date,
        lastActivityAt: sql`now()` as unknown as Date,
        expiresAt: expr as unknown as Date,
      },
      // Only steal if you already hold it OR the existing lock has expired.
      setWhere: sql`${editLocks.userId} = ${opts.userId} OR ${editLocks.expiresAt} < now()`,
    });

  const [row] = await db
    .select()
    .from(editLocks)
    .where(
      and(
        eq(editLocks.resourceType, opts.resourceType),
        eq(editLocks.resourceId, opts.resourceId),
      ),
    )
    .limit(1);

  if (!row) {
    // Shouldn't happen — the upsert should always leave a row.
    throw new Error("acquireLock: lock row missing after upsert");
  }

  return {
    acquired: row.userId === opts.userId,
    userId: row.userId,
    acquiredAt: row.acquiredAt,
    lastActivityAt: row.lastActivityAt,
    expiresAt: row.expiresAt,
  };
}

/**
 * Refresh the lock's expiry. Returns true if the lock is still owned by this
 * user. False means it was lost (expired or stolen) — caller should redirect.
 */
export async function heartbeatLock(opts: {
  resourceType: LockResourceType;
  resourceId: string;
  userId: string;
  ttlSeconds?: number;
}): Promise<boolean> {
  const ttl = opts.ttlSeconds ?? LOCK_TTL_SECONDS;
  const expr = sql`now() + (${ttl} || ' seconds')::interval`;

  const result = await db
    .update(editLocks)
    .set({
      lastActivityAt: sql`now()` as unknown as Date,
      expiresAt: expr as unknown as Date,
    })
    .where(
      and(
        eq(editLocks.resourceType, opts.resourceType),
        eq(editLocks.resourceId, opts.resourceId),
        eq(editLocks.userId, opts.userId),
        sql`${editLocks.expiresAt} > now()`,
      ),
    )
    .returning({ userId: editLocks.userId });

  return result.length > 0;
}

/** Release the lock IFF this user holds it. No-op otherwise. */
export async function releaseLock(opts: {
  resourceType: LockResourceType;
  resourceId: string;
  userId: string;
}): Promise<void> {
  await db
    .delete(editLocks)
    .where(
      and(
        eq(editLocks.resourceType, opts.resourceType),
        eq(editLocks.resourceId, opts.resourceId),
        eq(editLocks.userId, opts.userId),
      ),
    );
}

/**
 * Force-release any lock on this resource. Caller must verify capability
 * (admin/owner) before invoking.
 */
export async function forceReleaseLock(opts: {
  resourceType: LockResourceType;
  resourceId: string;
  orgId: string;
}): Promise<void> {
  await db
    .delete(editLocks)
    .where(
      and(
        eq(editLocks.resourceType, opts.resourceType),
        eq(editLocks.resourceId, opts.resourceId),
        eq(editLocks.orgId, opts.orgId),
      ),
    );
}
