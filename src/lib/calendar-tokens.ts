import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { calendarTokens } from "@/db/schema";

/**
 * Soft-revoke any active calendar tokens whose access has been withdrawn.
 *
 * - Tour scope: revokes tokens for this user pointing at this specific tour.
 * - Org scope: revokes the user's org-wide tokens for this org AND any
 *   comedian-scoped tokens (comedians belong to an org), AND any tour-scoped
 *   tokens that fell under this org. Use when removing the user from an org.
 */
export async function revokeUserCalendarTokensForTour(
  userId: string,
  tourId: string,
): Promise<void> {
  await db
    .update(calendarTokens)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(calendarTokens.userId, userId),
        eq(calendarTokens.scope, "tour"),
        eq(calendarTokens.scopeId, tourId),
        isNull(calendarTokens.revokedAt),
      ),
    );
}

export async function revokeUserCalendarTokensForOrg(
  userId: string,
  orgId: string,
): Promise<void> {
  await db
    .update(calendarTokens)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(calendarTokens.userId, userId),
        eq(calendarTokens.orgId, orgId),
        isNull(calendarTokens.revokedAt),
      ),
    );
}
