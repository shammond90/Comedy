"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { comedians } from "@/db/schema";
import { requireOrg } from "@/lib/auth";
import { diffRecords, logActivity } from "@/lib/activity";
import { formToObject, type ActionState } from "@/lib/actions";
import { comedianSchema } from "./schema";


export async function createComedianAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { user, orgId } = await requireOrg();
  const parsed = comedianSchema.safeParse(formToObject(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const [row] = await db
    .insert(comedians)
    .values({ ...parsed.data, orgId })
    .returning({ id: comedians.id });
  await logActivity({
    orgId,
    userId: user.id,
    resourceType: "comedian",
    resourceId: row.id,
    action: "create",
    summary: `added comedian "${parsed.data.stageName}"`,
  });
  revalidatePath("/comedians");
  redirect(`/comedians/${row.id}`);
}

export async function updateComedianAction(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { user, orgId } = await requireOrg();
  const parsed = comedianSchema.safeParse(formToObject(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const [before] = await db
    .select()
    .from(comedians)
    .where(and(eq(comedians.id, id), eq(comedians.orgId, orgId)))
    .limit(1);
  await db
    .update(comedians)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(and(eq(comedians.id, id), eq(comedians.orgId, orgId)));
  if (before) {
    const after = { ...before, ...parsed.data } as Record<string, unknown>;
    const changes = diffRecords(before as Record<string, unknown>, after);
    await logActivity({
      orgId,
      userId: user.id,
      resourceType: "comedian",
      resourceId: id,
      action: "update",
      summary: `edited comedian "${parsed.data.stageName}"`,
      changes,
    });
  }
  revalidatePath("/comedians");
  revalidatePath(`/comedians/${id}`);
  redirect(`/comedians/${id}`);
}

export async function deleteComedianAction(formData: FormData) {
  const id = String(formData.get("id"));
  const { user, orgId } = await requireOrg();
  const [before] = await db
    .select({ stageName: comedians.stageName })
    .from(comedians)
    .where(and(eq(comedians.id, id), eq(comedians.orgId, orgId)))
    .limit(1);
  await db
    .update(comedians)
    .set({ archivedAt: new Date() })
    .where(and(eq(comedians.id, id), eq(comedians.orgId, orgId)));
  if (before) {
    await logActivity({
      orgId,
      userId: user.id,
      resourceType: "comedian",
      resourceId: id,
      action: "delete",
      summary: `archived comedian "${before.stageName}"`,
    });
  }
  revalidatePath("/comedians");
  redirect("/comedians");
}
