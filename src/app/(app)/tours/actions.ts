"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { tours } from "@/db/schema";
import { requireOrg } from "@/lib/auth";
import { canDelete, canEdit, getOrgRole, getTourRole } from "@/lib/permissions";
import { formToObject, type ActionState } from "@/lib/actions";
import { tourSchema } from "./schema";

export async function createTourAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { user, orgId } = await requireOrg();
  const orgRole = await getOrgRole(user.id, orgId);
  if (!canEdit(orgRole?.role ?? null)) {
    return { error: "You don't have permission to create tours." };
  }
  const parsed = tourSchema.safeParse(formToObject(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const { budget, ...rest } = parsed.data;
  const [row] = await db
    .insert(tours)
    .values({ ...rest, budgetPence: budget, orgId })
    .returning({ id: tours.id });
  revalidatePath("/tours");
  redirect(`/tours/${row.id}`);
}

export async function updateTourAction(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { user } = await requireOrg();
  const tourRole = await getTourRole(user.id, id);
  if (!canEdit(tourRole?.role ?? null)) {
    return { error: "You don't have permission to edit this tour." };
  }
  const parsed = tourSchema.safeParse(formToObject(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const { budget, ...rest } = parsed.data;
  await db
    .update(tours)
    .set({ ...rest, budgetPence: budget, updatedAt: new Date() })
    .where(eq(tours.id, id));
  revalidatePath("/tours");
  revalidatePath(`/tours/${id}`);
  redirect(`/tours/${id}`);
}

export async function deleteTourAction(formData: FormData) {
  const id = String(formData.get("id"));
  const { user } = await requireOrg();
  const tourRole = await getTourRole(user.id, id);
  if (!canDelete(tourRole?.role ?? null)) return;
  await db
    .update(tours)
    .set({ archivedAt: new Date() })
    .where(eq(tours.id, id));
  revalidatePath("/tours");
  redirect("/tours");
}
