"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { calendarTokens, tours, type CalendarScope } from "@/db/schema";
import { requireOrg } from "@/lib/auth";
import { getTourRole } from "@/lib/permissions";

function newToken(): string {
  return randomBytes(24).toString("base64url");
}

export async function createCalendarTokenAction(formData: FormData): Promise<void> {
  const scope = String(formData.get("scope")) as CalendarScope;
  const scopeId = (formData.get("scopeId") as string) || null;
  const label = (formData.get("label") as string) || null;
  if (!["org", "tour", "comedian"].includes(scope)) return;

  const { user, orgId } = await requireOrg();

  // The org_id stored on the token is the org that owns the data the feed
  // returns — for a tour-scoped feed on a shared tour, that's the tour's
  // owning org, NOT the subscriber's primary org.
  let tokenOrgId = orgId;

  if (scope === "tour") {
    if (!scopeId) return;
    // Anyone with viewer+ on the tour may subscribe.
    const role = await getTourRole(user.id, scopeId);
    if (!role) return;
    const [t] = await db
      .select({ orgId: tours.orgId })
      .from(tours)
      .where(eq(tours.id, scopeId))
      .limit(1);
    if (!t) return;
    tokenOrgId = t.orgId;
  }

  await db.insert(calendarTokens).values({
    userId: user.id,
    orgId: tokenOrgId,
    scope,
    scopeId: scope === "org" ? null : scopeId,
    label: label?.trim() || null,
    token: newToken(),
  });

  revalidatePath("/settings/calendars");
}

export async function revokeCalendarTokenAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id"));
  const { user } = await requireOrg();
  await db
    .update(calendarTokens)
    .set({ revokedAt: new Date() })
    .where(and(eq(calendarTokens.id, id), eq(calendarTokens.userId, user.id)));
  revalidatePath("/settings/calendars");
}
