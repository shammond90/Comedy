"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import {
  invitations,
  orgMembers,
  tourCollaborators,
  tours,
  type MemberRole,
} from "@/db/schema";
import { requireOrg } from "@/lib/auth";
import { canInvite, getOrgRole, getTourRole, isOwner } from "@/lib/permissions";
import { generateInviteToken, inviteExpiry, inviteUrl } from "@/lib/invites";
import { logActivity } from "@/lib/activity";
import { notify } from "@/lib/notifications";
import { formToObject, type ActionState } from "@/lib/actions";
import { createClient } from "@/lib/supabase/server";

const roleEnum = z.enum(["viewer", "editor", "admin"]);

const orgInviteSchema = z.object({
  email: z.string().email().optional().or(z.literal("")),
  role: roleEnum,
  canViewFinancials: z.coerce.boolean().optional().default(false),
});

const tourInviteSchema = orgInviteSchema.extend({
  tourId: z.string().uuid(),
});

/* -------------------------------------------------------------------------- */
/*                              Auto-attach helper                            */
/* -------------------------------------------------------------------------- */

/**
 * If the email already corresponds to an existing auth user, attach them
 * directly. Returns true if attached (caller should skip creating an invite).
 *
 * Looks up auth.users via the service-role admin API. If SUPABASE_SERVICE_ROLE_KEY
 * is missing, returns false so the caller falls back to a link.
 */
async function tryAutoAttach(opts: {
  email: string;
  orgId: string;
  tourId: string | null;
  role: MemberRole;
  canViewFinancials: boolean;
  invitedBy: string;
}): Promise<boolean> {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey || !opts.email) return false;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const { createClient: createAdmin } = await import("@supabase/supabase-js");
  const admin = createAdmin(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Supabase admin API: list users (paginated). For V1 we accept the simple
  // path: 1 page of up to 1000 users.
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (error) return false;
  const match = data.users.find(
    (u) => (u.email ?? "").toLowerCase() === opts.email.toLowerCase(),
  );
  if (!match) return false;

  if (opts.tourId) {
    await db
      .insert(tourCollaborators)
      .values({
        orgId: opts.orgId,
        tourId: opts.tourId,
        userId: match.id,
        role: opts.role,
        canViewFinancials: opts.canViewFinancials,
        invitedBy: opts.invitedBy,
      })
      .onConflictDoNothing();
    await notify({
      userId: match.id,
      orgId: opts.orgId,
      type: "tour_shared",
      title: "You were added to a tour",
      body: `Role: ${opts.role}`,
      link: `/tours/${opts.tourId}`,
    });
  } else {
    await db
      .insert(orgMembers)
      .values({
        orgId: opts.orgId,
        userId: match.id,
        role: opts.role,
        canViewFinancials: opts.canViewFinancials,
      })
      .onConflictDoNothing();
    await notify({
      userId: match.id,
      orgId: opts.orgId,
      type: "invite_received",
      title: "You were added to a workspace",
      body: `Role: ${opts.role}`,
      link: `/tours`,
    });
  }
  return true;
}

/* -------------------------------------------------------------------------- */
/*                                  Invites                                   */
/* -------------------------------------------------------------------------- */

export async function inviteToOrgAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState & { inviteUrl?: string; attached?: boolean }> {
  const { user, orgId } = await requireOrg();
  const orgRole = await getOrgRole(user.id, orgId);
  if (!canInvite(orgRole?.role ?? null)) {
    return { error: "You don't have permission to invite people." };
  }

  const parsed = orgInviteSchema.safeParse(formToObject(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const email = parsed.data.email?.trim() || null;
  const role = parsed.data.role as MemberRole;
  const canViewFinancials = !!parsed.data.canViewFinancials;

  // Try to auto-attach if email matches an existing user
  if (email) {
    const attached = await tryAutoAttach({
      email,
      orgId,
      tourId: null,
      role,
      canViewFinancials,
      invitedBy: user.id,
    });
    if (attached) {
      revalidatePath("/settings/team");
      return { attached: true };
    }
  }

  const token = generateInviteToken();
  await db.insert(invitations).values({
    orgId,
    tourId: null,
    email,
    role,
    canViewFinancials,
    token,
    invitedBy: user.id,
    expiresAt: inviteExpiry(),
  });

  await logActivity({
    orgId,
    userId: user.id,
    resourceType: "org",
    resourceId: orgId,
    action: "invite",
    summary: `invited ${email ?? "someone"} to org as ${role}`,
  });

  revalidatePath("/settings/team");
  return { inviteUrl: inviteUrl(token) };
}

export async function inviteToTourAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState & { inviteUrl?: string; attached?: boolean }> {
  const { user, orgId } = await requireOrg();

  const parsed = tourInviteSchema.safeParse(formToObject(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const { tourId } = parsed.data;

  // Verify tour belongs to this org
  const [tour] = await db
    .select({ id: tours.id, orgId: tours.orgId })
    .from(tours)
    .where(eq(tours.id, tourId))
    .limit(1);
  if (!tour || tour.orgId !== orgId) {
    return { error: "Tour not found." };
  }

  // Inviting requires admin on this tour
  const tourRole = await getTourRole(user.id, tourId);
  if (!canInvite(tourRole?.role ?? null)) {
    return { error: "You don't have permission to invite people to this tour." };
  }

  const email = parsed.data.email?.trim() || null;
  const role = parsed.data.role as MemberRole;
  const canViewFinancials = !!parsed.data.canViewFinancials;

  if (email) {
    const attached = await tryAutoAttach({
      email,
      orgId,
      tourId,
      role,
      canViewFinancials,
      invitedBy: user.id,
    });
    if (attached) {
      revalidatePath(`/tours/${tourId}/team`);
      return { attached: true };
    }
  }

  const token = generateInviteToken();
  await db.insert(invitations).values({
    orgId,
    tourId,
    email,
    role,
    canViewFinancials,
    token,
    invitedBy: user.id,
    expiresAt: inviteExpiry(),
  });

  await logActivity({
    orgId,
    userId: user.id,
    resourceType: "tour",
    resourceId: tourId,
    action: "invite",
    summary: `invited ${email ?? "someone"} to tour as ${role}`,
  });

  revalidatePath(`/tours/${tourId}/team`);
  return { inviteUrl: inviteUrl(token) };
}

/* -------------------------------------------------------------------------- */
/*                            Revoke / remove / role                          */
/* -------------------------------------------------------------------------- */

export async function revokeInviteAction(formData: FormData) {
  const id = String(formData.get("id"));
  const tourId = formData.get("tourId");
  const { user, orgId } = await requireOrg();
  const orgRole = await getOrgRole(user.id, orgId);
  if (!canInvite(orgRole?.role ?? null)) return;

  await db
    .update(invitations)
    .set({ revokedAt: new Date() })
    .where(and(eq(invitations.id, id), eq(invitations.orgId, orgId)));

  if (tourId) revalidatePath(`/tours/${tourId}/team`);
  revalidatePath("/settings/team");
}

export async function removeMemberAction(formData: FormData) {
  const userId = String(formData.get("userId"));
  const { user, orgId } = await requireOrg();
  const orgRole = await getOrgRole(user.id, orgId);
  if (!canInvite(orgRole?.role ?? null)) return;

  // Don't allow removing the owner
  const [target] = await db
    .select({ role: orgMembers.role })
    .from(orgMembers)
    .where(and(eq(orgMembers.orgId, orgId), eq(orgMembers.userId, userId)))
    .limit(1);
  if (!target || target.role === "owner") return;

  await db
    .delete(orgMembers)
    .where(and(eq(orgMembers.orgId, orgId), eq(orgMembers.userId, userId)));
  await logActivity({
    orgId,
    userId: user.id,
    resourceType: "org",
    resourceId: orgId,
    action: "delete",
    summary: `removed member from org`,
  });
  revalidatePath("/settings/team");
}

export async function removeCollaboratorAction(formData: FormData) {
  const id = String(formData.get("id"));
  const tourId = String(formData.get("tourId"));
  const { user, orgId } = await requireOrg();
  const tourRole = await getTourRole(user.id, tourId);
  if (!canInvite(tourRole?.role ?? null)) return;

  await db
    .delete(tourCollaborators)
    .where(and(eq(tourCollaborators.id, id), eq(tourCollaborators.orgId, orgId)));
  revalidatePath(`/tours/${tourId}/team`);
}

const changeRoleSchema = z.object({
  scope: z.enum(["org", "tour"]),
  id: z.string(),
  role: z.enum(["viewer", "editor", "admin"]),
  tourId: z.string().uuid().optional(),
});

const setFinancialsSchema = z.object({
  scope: z.enum(["org", "tour"]),
  id: z.string(),
  canViewFinancials: z
    .union([z.literal("true"), z.literal("false"), z.boolean()])
    .transform((v) => v === true || v === "true"),
  tourId: z.string().uuid().optional(),
});

export async function setFinancialsAction(formData: FormData) {
  const parsed = setFinancialsSchema.safeParse(formToObject(formData));
  if (!parsed.success) return;
  const { scope, id, canViewFinancials, tourId } = parsed.data;
  const { user, orgId } = await requireOrg();

  if (scope === "org") {
    const orgRole = await getOrgRole(user.id, orgId);
    if (!canInvite(orgRole?.role ?? null)) return;
    const [target] = await db
      .select({ role: orgMembers.role })
      .from(orgMembers)
      .where(and(eq(orgMembers.orgId, orgId), eq(orgMembers.userId, id)))
      .limit(1);
    if (!target || target.role === "owner") return;
    await db
      .update(orgMembers)
      .set({ canViewFinancials })
      .where(and(eq(orgMembers.orgId, orgId), eq(orgMembers.userId, id)));
    await logActivity({
      orgId,
      userId: user.id,
      resourceType: "org",
      resourceId: orgId,
      action: "update",
      summary: `${canViewFinancials ? "granted" : "revoked"} financials access for org member`,
    });
    revalidatePath("/settings/team");
  } else {
    if (!tourId) return;
    const tourRole = await getTourRole(user.id, tourId);
    if (!canInvite(tourRole?.role ?? null)) return;
    await db
      .update(tourCollaborators)
      .set({ canViewFinancials })
      .where(
        and(
          eq(tourCollaborators.id, id),
          eq(tourCollaborators.orgId, orgId),
        ),
      );
    await logActivity({
      orgId,
      userId: user.id,
      resourceType: "tour",
      resourceId: tourId,
      action: "update",
      summary: `${canViewFinancials ? "granted" : "revoked"} financials access for collaborator`,
    });
    revalidatePath(`/tours/${tourId}/team`);
  }
}

export async function changeRoleAction(formData: FormData) {
  const parsed = changeRoleSchema.safeParse(formToObject(formData));
  if (!parsed.success) return;
  const { scope, id, role, tourId } = parsed.data;
  const { user, orgId } = await requireOrg();

  if (scope === "org") {
    const orgRole = await getOrgRole(user.id, orgId);
    if (!isOwner(orgRole?.role ?? null) && !canInvite(orgRole?.role ?? null)) {
      return;
    }
    // Don't change owner's role
    const [target] = await db
      .select({ role: orgMembers.role })
      .from(orgMembers)
      .where(and(eq(orgMembers.orgId, orgId), eq(orgMembers.userId, id)))
      .limit(1);
    if (!target || target.role === "owner") return;

    await db
      .update(orgMembers)
      .set({ role: role as MemberRole })
      .where(and(eq(orgMembers.orgId, orgId), eq(orgMembers.userId, id)));
    await logActivity({
      orgId,
      userId: user.id,
      resourceType: "org",
      resourceId: orgId,
      action: "role_change",
      summary: `changed org member role to ${role}`,
      changes: { role: { from: target.role, to: role } },
    });
    await notify({
      userId: id,
      orgId,
      type: "role_changed",
      title: `Your role changed to ${role}`,
      link: `/tours`,
    });
    revalidatePath("/settings/team");
  } else {
    if (!tourId) return;
    const tourRole = await getTourRole(user.id, tourId);
    if (!canInvite(tourRole?.role ?? null)) return;
    await db
      .update(tourCollaborators)
      .set({ role: role as MemberRole })
      .where(
        and(
          eq(tourCollaborators.id, id),
          eq(tourCollaborators.orgId, orgId),
        ),
      );
    await logActivity({
      orgId,
      userId: user.id,
      resourceType: "tour",
      resourceId: tourId,
      action: "role_change",
      summary: `changed tour collaborator role to ${role}`,
    });
    const [collab] = await db
      .select({ userId: tourCollaborators.userId })
      .from(tourCollaborators)
      .where(eq(tourCollaborators.id, id))
      .limit(1);
    if (collab) {
      await notify({
        userId: collab.userId,
        orgId,
        type: "role_changed",
        title: `Your tour role changed to ${role}`,
        link: `/tours/${tourId}`,
      });
    }
    revalidatePath(`/tours/${tourId}/team`);
  }
}

/* -------------------------------------------------------------------------- */
/*                              Accept invitation                             */
/* -------------------------------------------------------------------------- */

export async function acceptInviteAction(token: string): Promise<
  | { ok: true; redirectTo: string }
  | { ok: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Please sign in or sign up to accept this invitation." };
  }

  const [inv] = await db
    .select()
    .from(invitations)
    .where(and(eq(invitations.token, token), isNull(invitations.acceptedAt), isNull(invitations.revokedAt)))
    .limit(1);

  if (!inv) return { ok: false, error: "This invitation is no longer valid." };
  if (inv.expiresAt.getTime() < Date.now()) {
    return { ok: false, error: "This invitation has expired." };
  }

  if (inv.tourId) {
    await db
      .insert(tourCollaborators)
      .values({
        orgId: inv.orgId,
        tourId: inv.tourId,
        userId: user.id,
        role: inv.role,
        canViewFinancials: inv.canViewFinancials,
        invitedBy: inv.invitedBy,
      })
      .onConflictDoNothing();
  } else {
    await db
      .insert(orgMembers)
      .values({
        orgId: inv.orgId,
        userId: user.id,
        role: inv.role,
        canViewFinancials: inv.canViewFinancials,
      })
      .onConflictDoNothing();
  }

  await db
    .update(invitations)
    .set({ acceptedAt: new Date(), acceptedBy: user.id })
    .where(eq(invitations.id, inv.id));

  await logActivity({
    orgId: inv.orgId,
    userId: user.id,
    resourceType: inv.tourId ? "tour" : "org",
    resourceId: inv.tourId ?? inv.orgId,
    action: "invite",
    summary: `joined ${inv.tourId ? "tour" : "org"} as ${inv.role}`,
  });

  return {
    ok: true,
    redirectTo: inv.tourId ? `/tours/${inv.tourId}` : "/tours",
  };
}
