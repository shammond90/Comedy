"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { venues } from "@/db/schema";
import { requireOrg } from "@/lib/auth";
import { diffRecords, logActivity } from "@/lib/activity";
import { formToObject, type ActionState } from "@/lib/actions";
import { venueSchema } from "./schema";


export async function createVenueAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { user, orgId } = await requireOrg();
  const parsed = venueSchema.safeParse(formToObject(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const [row] = await db
    .insert(venues)
    .values({ ...parsed.data, orgId })
    .returning({ id: venues.id });
  await logActivity({
    orgId,
    userId: user.id,
    resourceType: "venue",
    resourceId: row.id,
    action: "create",
    summary: `added venue "${parsed.data.name}"`,
  });
  revalidatePath("/venues");
  redirect(`/venues/${row.id}`);
}

export async function updateVenueAction(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { user, orgId } = await requireOrg();
  const parsed = venueSchema.safeParse(formToObject(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const [before] = await db
    .select()
    .from(venues)
    .where(and(eq(venues.id, id), eq(venues.orgId, orgId)))
    .limit(1);
  await db
    .update(venues)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(and(eq(venues.id, id), eq(venues.orgId, orgId)));
  if (before) {
    const after = { ...before, ...parsed.data } as Record<string, unknown>;
    const changes = diffRecords(before as Record<string, unknown>, after);
    await logActivity({
      orgId,
      userId: user.id,
      resourceType: "venue",
      resourceId: id,
      action: "update",
      summary: `edited venue "${parsed.data.name}"`,
      changes,
    });
  }
  revalidatePath("/venues");
  revalidatePath(`/venues/${id}`);
  redirect(`/venues/${id}`);
}

export async function deleteVenueAction(formData: FormData) {
  const id = String(formData.get("id"));
  const { user, orgId } = await requireOrg();
  const [before] = await db
    .select({ name: venues.name })
    .from(venues)
    .where(and(eq(venues.id, id), eq(venues.orgId, orgId)))
    .limit(1);
  // Soft-delete by archiving.
  await db
    .update(venues)
    .set({ archivedAt: new Date() })
    .where(and(eq(venues.id, id), eq(venues.orgId, orgId)));
  if (before) {
    await logActivity({
      orgId,
      userId: user.id,
      resourceType: "venue",
      resourceId: id,
      action: "delete",
      summary: `archived venue "${before.name}"`,
    });
  }
  revalidatePath("/venues");
  redirect("/venues");
}
