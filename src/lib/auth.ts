import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db/client";
import {
  organisations,
  orgMembers,
  tourCollaborators,
} from "@/db/schema";

/**
 * Returns the authenticated user, or redirects to /login. Cached per request.
 */
export const requireUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return user;
});

/**
 * Returns the current user's active organisation.
 *
 * Resolution order:
 *   1. First org_members row for this user.
 *   2. First org reachable via tour_collaborators (collab-only users).
 *   3. Auto-provision a personal org (very first login).
 */
export const requireOrg = cache(async () => {
  const user = await requireUser();

  const memberRows = await db
    .select({ orgId: orgMembers.orgId })
    .from(orgMembers)
    .where(eq(orgMembers.userId, user.id))
    .limit(1);

  if (memberRows.length > 0) {
    return { user, orgId: memberRows[0].orgId };
  }

  // Collab-only user: surface the first org they have a collab on.
  const collabRows = await db
    .select({ orgId: tourCollaborators.orgId })
    .from(tourCollaborators)
    .where(eq(tourCollaborators.userId, user.id))
    .limit(1);

  if (collabRows.length > 0) {
    return { user, orgId: collabRows[0].orgId };
  }

  // First-time login with no shares: create a personal org.
  const [org] = await db
    .insert(organisations)
    .values({
      name:
        (user.user_metadata?.full_name as string | undefined) ??
        user.email ??
        "My Organisation",
    })
    .returning({ id: organisations.id });

  await db.insert(orgMembers).values({
    orgId: org.id,
    userId: user.id,
    role: "owner",
    canViewFinancials: true,
  });

  return { user, orgId: org.id };
});

/**
 * Variant of requireOrg() that also returns whether the user is an actual
 * member of the active org (vs a per-tour collaborator only).
 */
export const requireOrgWithMembership = cache(async () => {
  const { user, orgId } = await requireOrg();
  const [m] = await db
    .select({ role: orgMembers.role })
    .from(orgMembers)
    .where(and(eq(orgMembers.orgId, orgId), eq(orgMembers.userId, user.id)))
    .limit(1);
  return {
    user,
    orgId,
    isMember: !!m,
    orgRole: m?.role ?? null,
  };
});
