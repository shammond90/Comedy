import "server-only";
import { cache } from "react";
import { and, eq, inArray, or } from "drizzle-orm";
import { db } from "@/db/client";
import {
  orgMembers,
  tourCollaborators,
  tours,
  shows,
} from "@/db/schema";
import type { MemberRole } from "@/db/schema";

/* -------------------------------------------------------------------------- */
/*                              Role precedence                               */
/* -------------------------------------------------------------------------- */

const roleRank: Record<MemberRole, number> = {
  viewer: 0,
  editor: 1,
  admin: 2,
  owner: 3,
};

export function maxRole(a: MemberRole | null, b: MemberRole | null): MemberRole | null {
  if (!a) return b;
  if (!b) return a;
  return roleRank[a] >= roleRank[b] ? a : b;
}

export function roleAtLeast(role: MemberRole | null, min: MemberRole): boolean {
  if (!role) return false;
  return roleRank[role] >= roleRank[min];
}

/* -------------------------------------------------------------------------- */
/*                              Lookup helpers                                */
/* -------------------------------------------------------------------------- */

/** Org-level role for the user, or null if not a member. */
export const getOrgRole = cache(
  async (
    userId: string,
    orgId: string,
  ): Promise<{ role: MemberRole; canViewFinancials: boolean } | null> => {
    const [m] = await db
      .select({
        role: orgMembers.role,
        canViewFinancials: orgMembers.canViewFinancials,
      })
      .from(orgMembers)
      .where(and(eq(orgMembers.orgId, orgId), eq(orgMembers.userId, userId)))
      .limit(1);
    return m ?? null;
  },
);

/** Per-tour collaborator role for the user, or null. */
export const getTourCollabRole = cache(
  async (
    userId: string,
    tourId: string,
  ): Promise<{ role: MemberRole; canViewFinancials: boolean } | null> => {
    const [c] = await db
      .select({
        role: tourCollaborators.role,
        canViewFinancials: tourCollaborators.canViewFinancials,
      })
      .from(tourCollaborators)
      .where(
        and(
          eq(tourCollaborators.tourId, tourId),
          eq(tourCollaborators.userId, userId),
        ),
      )
      .limit(1);
    return c ?? null;
  },
);

/**
 * Effective role on a tour (max of org role and per-tour role) plus an
 * effective `canViewFinancials` (true if any source grants it).
 * Returns null if the user has no access at all.
 */
export const getTourRole = cache(
  async (
    userId: string,
    tourId: string,
  ): Promise<{ role: MemberRole; canViewFinancials: boolean } | null> => {
    // Need the tour's org_id to look up org-level role.
    const [tour] = await db
      .select({ id: tours.id, orgId: tours.orgId })
      .from(tours)
      .where(eq(tours.id, tourId))
      .limit(1);
    if (!tour) return null;

    const [orgRole, collabRole] = await Promise.all([
      getOrgRole(userId, tour.orgId),
      getTourCollabRole(userId, tourId),
    ]);

    const role = maxRole(orgRole?.role ?? null, collabRole?.role ?? null);
    if (!role) return null;
    const canViewFinancials =
      (orgRole?.canViewFinancials ?? false) ||
      (collabRole?.canViewFinancials ?? false);
    return { role, canViewFinancials };
  },
);

/** Effective tour role from a show id. */
export async function getShowRole(
  userId: string,
  showId: string,
): Promise<{ role: MemberRole; canViewFinancials: boolean; tourId: string } | null> {
  const [s] = await db
    .select({ tourId: shows.tourId })
    .from(shows)
    .where(eq(shows.id, showId))
    .limit(1);
  if (!s) return null;
  const r = await getTourRole(userId, s.tourId);
  if (!r) return null;
  return { ...r, tourId: s.tourId };
}

/* -------------------------------------------------------------------------- */
/*                            Capability predicates                           */
/* -------------------------------------------------------------------------- */

export function canEdit(role: MemberRole | null): boolean {
  return roleAtLeast(role, "editor");
}

export function canDelete(role: MemberRole | null): boolean {
  return roleAtLeast(role, "admin");
}

export function canInvite(role: MemberRole | null): boolean {
  return roleAtLeast(role, "admin");
}

export function canForceUnlock(role: MemberRole | null): boolean {
  return roleAtLeast(role, "admin");
}

export function isOwner(role: MemberRole | null): boolean {
  return role === "owner";
}

/* -------------------------------------------------------------------------- */
/*                              Bulk org listing                              */
/* -------------------------------------------------------------------------- */

/** All orgs the user has access to (member OR per-tour collaborator). */
export const listAccessibleOrgIds = cache(async (userId: string): Promise<string[]> => {
  const memberOrgs = await db
    .select({ orgId: orgMembers.orgId })
    .from(orgMembers)
    .where(eq(orgMembers.userId, userId));
  const collabOrgs = await db
    .select({ orgId: tourCollaborators.orgId })
    .from(tourCollaborators)
    .where(eq(tourCollaborators.userId, userId));
  const set = new Set<string>([
    ...memberOrgs.map((r) => r.orgId),
    ...collabOrgs.map((r) => r.orgId),
  ]);
  return Array.from(set);
});

/** Orgs the user is an actual member of (NOT including collab-only orgs). */
export const listMemberOrgIds = cache(async (userId: string): Promise<string[]> => {
  const rows = await db
    .select({ orgId: orgMembers.orgId })
    .from(orgMembers)
    .where(eq(orgMembers.userId, userId));
  return rows.map((r) => r.orgId);
});

/** Tours visible to user via per-tour collaboration only (not org membership). */
export const listCollabTourIds = cache(async (userId: string): Promise<string[]> => {
  const rows = await db
    .select({ tourId: tourCollaborators.tourId })
    .from(tourCollaborators)
    .where(eq(tourCollaborators.userId, userId));
  return rows.map((r) => r.tourId);
});

/** Tour IDs the user collaborates on within a specific org. */
export const listCollabTourIdsForOrg = cache(
  async (userId: string, orgId: string): Promise<string[]> => {
    const rows = await db
      .select({ tourId: tourCollaborators.tourId })
      .from(tourCollaborators)
      .where(
        and(
          eq(tourCollaborators.userId, userId),
          eq(tourCollaborators.orgId, orgId),
        ),
      );
    return rows.map((r) => r.tourId);
  },
);

/** True if the user is a member of the given org (not just a tour collaborator). */
export const isOrgMember = cache(
  async (userId: string, orgId: string): Promise<boolean> => {
    const r = await getOrgRole(userId, orgId);
    return r !== null;
  },
);

/**
 * Returns a SQL condition expressing "this row is visible to userId on the
 * tours table" — matches tours where they're a full org member (broad) OR
 * tours where they're an explicit per-tour collaborator. Collab-only orgs
 * do NOT grant blanket visibility to all tours in that org.
 */
export async function visibleTourCondition(userId: string) {
  const [orgIds, tourIds] = await Promise.all([
    listMemberOrgIds(userId),
    listCollabTourIds(userId),
  ]);
  if (orgIds.length === 0 && tourIds.length === 0) return null;
  const parts = [];
  if (orgIds.length > 0) parts.push(inArray(tours.orgId, orgIds));
  if (tourIds.length > 0) parts.push(inArray(tours.id, tourIds));
  return parts.length === 1 ? parts[0] : or(...parts);
}

/**
 * For collab-only users on a given org, returns the set of venue IDs reachable
 * through shows on the tours they collaborate on. Returns null when the user
 * is a full org member (no extra filtering needed).
 */
export const accessibleVenueIdsForOrg = cache(
  async (userId: string, orgId: string): Promise<string[] | null> => {
    if (await isOrgMember(userId, orgId)) return null;
    const tourIds = await listCollabTourIdsForOrg(userId, orgId);
    if (tourIds.length === 0) return [];
    const rows = await db
      .selectDistinct({ venueId: shows.venueId })
      .from(shows)
      .where(and(eq(shows.orgId, orgId), inArray(shows.tourId, tourIds)));
    return rows.map((r) => r.venueId).filter((v): v is string => v != null);
  },
);

/**
 * For collab-only users, returns comedian IDs linked to the tours they collab on.
 * Returns null for full org members.
 */
export const accessibleComedianIdsForOrg = cache(
  async (userId: string, orgId: string): Promise<string[] | null> => {
    if (await isOrgMember(userId, orgId)) return null;
    const tourIds = await listCollabTourIdsForOrg(userId, orgId);
    if (tourIds.length === 0) return [];
    const rows = await db
      .selectDistinct({ comedianId: tours.comedianId })
      .from(tours)
      .where(inArray(tours.id, tourIds));
    return rows.map((r) => r.comedianId).filter((v): v is string => v != null);
  },
);
