"use server";

import { revalidatePath } from "next/cache";
import { and, eq, max } from "drizzle-orm";
import { db } from "@/db/client";
import { showTasks, shows } from "@/db/schema";
import { requireOrg } from "@/lib/auth";
import { canEdit, getTourRole } from "@/lib/permissions";

async function ensureCanEdit(userId: string, showId: string): Promise<{
  orgId: string;
  tourId: string;
} | null> {
  const [s] = await db
    .select({ orgId: shows.orgId, tourId: shows.tourId })
    .from(shows)
    .where(eq(shows.id, showId))
    .limit(1);
  if (!s) return null;
  const role = await getTourRole(userId, s.tourId);
  if (!canEdit(role?.role ?? null)) return null;
  return s;
}

export async function addShowTaskAction(formData: FormData): Promise<void> {
  const showId = String(formData.get("showId"));
  const label = String(formData.get("label") ?? "").trim();
  if (!label) return;
  const { user } = await requireOrg();
  const ctx = await ensureCanEdit(user.id, showId);
  if (!ctx) return;

  const [m] = await db
    .select({ next: max(showTasks.sortOrder) })
    .from(showTasks)
    .where(eq(showTasks.showId, showId));
  const nextOrder = (m?.next ?? -1) + 1;

  await db.insert(showTasks).values({
    orgId: ctx.orgId,
    showId,
    label: label.slice(0, 200),
    sortOrder: nextOrder,
  });
  revalidatePath(`/tours/${ctx.tourId}/shows/${showId}`);
  revalidatePath(`/tours/${ctx.tourId}`);
}

export async function toggleShowTaskAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id"));
  const showId = String(formData.get("showId"));
  const done = formData.get("done") === "true";
  const { user } = await requireOrg();
  const ctx = await ensureCanEdit(user.id, showId);
  if (!ctx) return;

  await db
    .update(showTasks)
    .set({
      done,
      doneAt: done ? new Date() : null,
      doneByUserId: done ? user.id : null,
      updatedAt: new Date(),
    })
    .where(and(eq(showTasks.id, id), eq(showTasks.showId, showId)));
  revalidatePath(`/tours/${ctx.tourId}/shows/${showId}`);
  revalidatePath(`/tours/${ctx.tourId}`);
}

export async function deleteShowTaskAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id"));
  const showId = String(formData.get("showId"));
  const { user } = await requireOrg();
  const ctx = await ensureCanEdit(user.id, showId);
  if (!ctx) return;

  await db
    .delete(showTasks)
    .where(and(eq(showTasks.id, id), eq(showTasks.showId, showId)));
  revalidatePath(`/tours/${ctx.tourId}/shows/${showId}`);
  revalidatePath(`/tours/${ctx.tourId}`);
}

export async function moveShowTaskAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id"));
  const showId = String(formData.get("showId"));
  const direction = String(formData.get("direction"));
  const { user } = await requireOrg();
  const ctx = await ensureCanEdit(user.id, showId);
  if (!ctx) return;

  const rows = await db
    .select({ id: showTasks.id, sortOrder: showTasks.sortOrder })
    .from(showTasks)
    .where(eq(showTasks.showId, showId))
    .orderBy(showTasks.sortOrder);

  const idx = rows.findIndex((r) => r.id === id);
  if (idx === -1) return;
  const swapWith =
    direction === "up" ? rows[idx - 1] : direction === "down" ? rows[idx + 1] : null;
  if (!swapWith) return;
  const me = rows[idx];

  await db
    .update(showTasks)
    .set({ sortOrder: swapWith.sortOrder, updatedAt: new Date() })
    .where(eq(showTasks.id, me.id));
  await db
    .update(showTasks)
    .set({ sortOrder: me.sortOrder, updatedAt: new Date() })
    .where(eq(showTasks.id, swapWith.id));

  revalidatePath(`/tours/${ctx.tourId}/shows/${showId}`);
}
