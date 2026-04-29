import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db/client";
import { organisations, orgMembers } from "@/db/schema";
import { eq } from "drizzle-orm";

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
 * Returns the current user's organisation. Auto-provisions one on first call
 * (V1: each user has exactly one personal org).
 */
export const requireOrg = cache(async () => {
  const user = await requireUser();

  const existing = await db
    .select({ orgId: orgMembers.orgId })
    .from(orgMembers)
    .where(eq(orgMembers.userId, user.id))
    .limit(1);

  if (existing.length > 0) {
    return { user, orgId: existing[0].orgId };
  }

  // First-time login: create a personal org and membership.
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
  });

  return { user, orgId: org.id };
});
