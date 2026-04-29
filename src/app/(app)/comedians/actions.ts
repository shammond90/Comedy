"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { comedians } from "@/db/schema";
import { requireOrg } from "@/lib/auth";
import { comedianSchema } from "./schema";

function formToObject(formData: FormData): Record<string, string> {
  const obj: Record<string, string> = {};
  for (const [k, v] of formData.entries()) obj[k] = String(v);
  return obj;
}

export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function createComedianAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { orgId } = await requireOrg();
  const parsed = comedianSchema.safeParse(formToObject(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const [row] = await db
    .insert(comedians)
    .values({ ...parsed.data, orgId })
    .returning({ id: comedians.id });
  revalidatePath("/comedians");
  redirect(`/comedians/${row.id}`);
}

export async function updateComedianAction(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { orgId } = await requireOrg();
  const parsed = comedianSchema.safeParse(formToObject(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  await db
    .update(comedians)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(and(eq(comedians.id, id), eq(comedians.orgId, orgId)));
  revalidatePath("/comedians");
  revalidatePath(`/comedians/${id}`);
  redirect(`/comedians/${id}`);
}

export async function deleteComedianAction(formData: FormData) {
  const id = String(formData.get("id"));
  const { orgId } = await requireOrg();
  await db
    .update(comedians)
    .set({ archivedAt: new Date() })
    .where(and(eq(comedians.id, id), eq(comedians.orgId, orgId)));
  revalidatePath("/comedians");
  redirect("/comedians");
}
