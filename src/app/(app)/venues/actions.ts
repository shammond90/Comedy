"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { venues } from "@/db/schema";
import { requireOrg } from "@/lib/auth";
import { venueSchema } from "./schema";

function formToObject(formData: FormData): Record<string, string> {
  const obj: Record<string, string> = {};
  for (const [k, v] of formData.entries()) obj[k] = String(v);
  return obj;
}

export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function createVenueAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { orgId } = await requireOrg();
  const parsed = venueSchema.safeParse(formToObject(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const [row] = await db
    .insert(venues)
    .values({ ...parsed.data, orgId })
    .returning({ id: venues.id });
  revalidatePath("/venues");
  redirect(`/venues/${row.id}`);
}

export async function updateVenueAction(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { orgId } = await requireOrg();
  const parsed = venueSchema.safeParse(formToObject(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  await db
    .update(venues)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(and(eq(venues.id, id), eq(venues.orgId, orgId)));
  revalidatePath("/venues");
  revalidatePath(`/venues/${id}`);
  redirect(`/venues/${id}`);
}

export async function deleteVenueAction(formData: FormData) {
  const id = String(formData.get("id"));
  const { orgId } = await requireOrg();
  // Soft-delete by archiving.
  await db
    .update(venues)
    .set({ archivedAt: new Date() })
    .where(and(eq(venues.id, id), eq(venues.orgId, orgId)));
  revalidatePath("/venues");
  redirect("/venues");
}
