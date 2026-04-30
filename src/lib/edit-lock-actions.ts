"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import {
  acquireLock,
  forceReleaseLock,
  heartbeatLock,
  releaseLock,
  type LockResult,
} from "@/lib/edit-lock";
import { canForceUnlock, getOrgRole, getTourRole } from "@/lib/permissions";
import type { LockResourceType } from "@/db/schema";
import { db } from "@/db/client";
import { shows, tours } from "@/db/schema";
import { eq } from "drizzle-orm";

export type LockState = LockResult;

/**
 * Resolve the org_id and effective role for a (resourceType, resourceId).
 * Returns null if the user has no access at all.
 */
async function resolveResourceContext(
  userId: string,
  resourceType: LockResourceType,
  resourceId: string,
): Promise<{ orgId: string; isAdmin: boolean } | null> {
  // Settings is org-scoped: resourceId IS the org id.
  if (resourceType === "settings_team") {
    const role = await getOrgRole(userId, resourceId);
    if (!role) return null;
    return { orgId: resourceId, isAdmin: canForceUnlock(role.role) };
  }

  // Show sub-resources resolve to the parent show -> tour.
  if (
    resourceType === "show" ||
    resourceType === "show_tickets" ||
    resourceType === "show_accommodation" ||
    resourceType === "show_travel"
  ) {
    const [s] = await db
      .select({ orgId: shows.orgId, tourId: shows.tourId })
      .from(shows)
      .where(eq(shows.id, resourceId))
      .limit(1);
    if (!s) return null;
    const tr = await getTourRole(userId, s.tourId);
    if (!tr) return null;
    return { orgId: s.orgId, isAdmin: canForceUnlock(tr.role) };
  }

  if (resourceType === "tour") {
    const [t] = await db
      .select({ orgId: tours.orgId })
      .from(tours)
      .where(eq(tours.id, resourceId))
      .limit(1);
    if (!t) return null;
    const tr = await getTourRole(userId, resourceId);
    if (!tr) return null;
    return { orgId: t.orgId, isAdmin: canForceUnlock(tr.role) };
  }

  // comedian / venue: org-scoped. We need the row's org_id.
  // Look it up generically via a small switch.
  const orgId = await orgIdForResource(resourceType, resourceId);
  if (!orgId) return null;
  const role = await getOrgRole(userId, orgId);
  if (!role) return null;
  return { orgId, isAdmin: canForceUnlock(role.role) };
}

async function orgIdForResource(
  rt: LockResourceType,
  rid: string,
): Promise<string | null> {
  const { comedians, venues } = await import("@/db/schema");
  if (rt === "comedian") {
    const [r] = await db.select({ orgId: comedians.orgId }).from(comedians).where(eq(comedians.id, rid)).limit(1);
    return r?.orgId ?? null;
  }
  if (rt === "venue") {
    const [r] = await db.select({ orgId: venues.orgId }).from(venues).where(eq(venues.id, rid)).limit(1);
    return r?.orgId ?? null;
  }
  return null;
}

export async function heartbeatLockAction(
  resourceType: LockResourceType,
  resourceId: string,
): Promise<{ ok: boolean }> {
  const user = await requireUser();
  const ok = await heartbeatLock({ resourceType, resourceId, userId: user.id });
  return { ok };
}

export async function releaseLockAction(
  resourceType: LockResourceType,
  resourceId: string,
): Promise<void> {
  const user = await requireUser();
  await releaseLock({ resourceType, resourceId, userId: user.id });
}

export async function reacquireLockAction(
  resourceType: LockResourceType,
  resourceId: string,
): Promise<LockState | null> {
  const user = await requireUser();
  const ctx = await resolveResourceContext(user.id, resourceType, resourceId);
  if (!ctx) return null;
  return acquireLock({
    resourceType,
    resourceId,
    orgId: ctx.orgId,
    userId: user.id,
  });
}

export async function forceReleaseLockAction(
  resourceType: LockResourceType,
  resourceId: string,
  redirectPath?: string,
): Promise<{ ok: boolean }> {
  const user = await requireUser();
  const ctx = await resolveResourceContext(user.id, resourceType, resourceId);
  if (!ctx || !ctx.isAdmin) return { ok: false };
  await forceReleaseLock({
    resourceType,
    resourceId,
    orgId: ctx.orgId,
  });
  if (redirectPath) revalidatePath(redirectPath);
  return { ok: true };
}
