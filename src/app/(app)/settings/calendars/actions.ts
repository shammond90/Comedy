"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { calendarTokens, tours, type CalendarScope } from "@/db/schema";
import { requireOrg } from "@/lib/auth";

function newToken(): string {
  return randomBytes(24).toString("base64url");
}

export async function createCalendarTokenAction(formData: FormData): Promise<void> {
  const scope = String(formData.get("scope")) as CalendarScope;
  const scopeId = (formData.get("scopeId") as string) || null;
  const label = (formData.get("label") as string) || null;
  if (!["org", "tour", "comedian"].includes(scope)) return;

  const { user, orgId } = await requireOrg();

  // For tour scope, ensure the tour belongs to this org
  if (scope === "tour") {
    if (!scopeId) return;
    const [t] = await db
      .select({ orgId: tours.orgId })
      .from(tours)
      .where(eq(tours.id, scopeId))
      .limit(1);
    if (!t || t.orgId !== orgId) return;
  }

  await db.insert(calendarTokens).values({
    userId: user.id,
    orgId,
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
