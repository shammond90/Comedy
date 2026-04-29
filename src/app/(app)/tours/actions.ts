"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { tours } from "@/db/schema";
import { requireOrg } from "@/lib/auth";
import { tourSchema } from "./schema";

function formToObject(formData: FormData): Record<string, string> {
  const obj: Record<string, string> = {};
  for (const [k, v] of formData.entries()) obj[k] = String(v);
  return obj;
}

export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function createTourAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { orgId } = await requireOrg();
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
  const { orgId } = await requireOrg();
  const parsed = tourSchema.safeParse(formToObject(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const { budget, ...rest } = parsed.data;
  await db
    .update(tours)
    .set({ ...rest, budgetPence: budget, updatedAt: new Date() })
    .where(and(eq(tours.id, id), eq(tours.orgId, orgId)));
  revalidatePath("/tours");
  revalidatePath(`/tours/${id}`);
  redirect(`/tours/${id}`);
}

export async function deleteTourAction(formData: FormData) {
  const id = String(formData.get("id"));
  const { orgId } = await requireOrg();
  await db
    .update(tours)
    .set({ archivedAt: new Date() })
    .where(and(eq(tours.id, id), eq(tours.orgId, orgId)));
  revalidatePath("/tours");
  redirect("/tours");
}
