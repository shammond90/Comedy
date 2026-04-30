"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { reminders, shows, showTasks, tours } from "@/db/schema";
import { requireOrg } from "@/lib/auth";
import { canDelete, canEdit, getOrgRole, getTourRole } from "@/lib/permissions";
import { diffRecords, logActivity } from "@/lib/activity";
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
  await logActivity({
    orgId,
    userId: user.id,
    resourceType: "tour",
    resourceId: row.id,
    action: "create",
    summary: `created tour "${rest.name}"`,
  });
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
  const [before] = await db.select().from(tours).where(eq(tours.id, id)).limit(1);
  await db
    .update(tours)
    .set({ ...rest, budgetPence: budget, updatedAt: new Date() })
    .where(eq(tours.id, id));
  if (before) {
    const after = { ...before, ...rest, budgetPence: budget } as Record<string, unknown>;
    const changes = diffRecords(before as Record<string, unknown>, after);
    await logActivity({
      orgId: before.orgId,
      userId: user.id,
      resourceType: "tour",
      resourceId: id,
      action: "update",
      summary: `edited tour "${rest.name}"`,
      changes,
    });
  }
  revalidatePath("/tours");
  revalidatePath(`/tours/${id}`);
  redirect(`/tours/${id}`);
}

export async function deleteTourAction(formData: FormData) {
  const id = String(formData.get("id"));
  const { user } = await requireOrg();
  const tourRole = await getTourRole(user.id, id);
  if (!canDelete(tourRole?.role ?? null)) return;
  const [t] = await db.select({ name: tours.name, orgId: tours.orgId }).from(tours).where(eq(tours.id, id)).limit(1);
  await db
    .update(tours)
    .set({ archivedAt: new Date() })
    .where(eq(tours.id, id));
  if (t) {
    await logActivity({
      orgId: t.orgId,
      userId: user.id,
      resourceType: "tour",
      resourceId: id,
      action: "delete",
      summary: `archived tour "${t.name}"`,
    });
  }
  revalidatePath("/tours");
  redirect("/tours");
}

/* -------------------------------------------------------------------------- */
/*                                 Clone tour                                 */
/* -------------------------------------------------------------------------- */

function shiftDateString(d: string | null, days: number): string | null {
  if (!d || days === 0) return d;
  const dt = new Date(d + "T00:00:00Z");
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

function shiftTimestamp(d: Date | null, days: number): Date | null {
  if (!d) return d;
  return new Date(d.getTime() + days * 86_400_000);
}

export async function cloneTourAction(formData: FormData): Promise<void> {
  const sourceTourId = String(formData.get("tourId"));
  const newName = String(formData.get("newName") ?? "").trim();
  const newStartDate = String(formData.get("newStartDate") ?? "").trim() || null;

  if (!newName) return;
  const { user } = await requireOrg();
  const tourRole = await getTourRole(user.id, sourceTourId);
  if (!tourRole) return;
  // Cloning requires editor+ on the source tour AND editor+ on the org we'll create it in.

  const [src] = await db
    .select()
    .from(tours)
    .where(eq(tours.id, sourceTourId))
    .limit(1);
  if (!src) return;

  const orgRole = await getOrgRole(user.id, src.orgId);
  if (!canEdit(orgRole?.role ?? null) && !canEdit(tourRole.role)) return;

  // Compute date offset from the source's startDate to the new startDate.
  let offsetDays = 0;
  if (newStartDate && src.startDate) {
    const s = new Date(src.startDate + "T00:00:00Z").getTime();
    const n = new Date(newStartDate + "T00:00:00Z").getTime();
    offsetDays = Math.round((n - s) / 86_400_000);
  }

  const newStart = newStartDate ?? shiftDateString(src.startDate, offsetDays);
  const newEnd = shiftDateString(src.endDate, offsetDays);

  const [newTour] = await db
    .insert(tours)
    .values({
      orgId: src.orgId,
      comedianId: src.comedianId,
      name: newName,
      status: "planning",
      startDate: newStart,
      endDate: newEnd,
      description: src.description,
      marketingCopy: src.marketingCopy,
      pressRelease: src.pressRelease,
      photoAssetsNotes: src.photoAssetsNotes,
      socialCopyTemplate: src.socialCopyTemplate,
      budgetPence: src.budgetPence,
    })
    .returning({ id: tours.id });

  // Clone shows (date-shifted, ticket sales reset, accommodation/travel skipped)
  const srcShows = await db
    .select()
    .from(shows)
    .where(eq(shows.tourId, sourceTourId));

  const idMap = new Map<string, string>();
  for (const s of srcShows) {
    if (s.archivedAt) continue;
    const newShowDate = shiftDateString(s.showDate, offsetDays);
    if (!newShowDate) continue;
    const [newShow] = await db
      .insert(shows)
      .values({
        orgId: src.orgId,
        tourId: newTour.id,
        venueId: s.venueId,
        showDate: newShowDate,
        city: s.city,
        showTime: s.showTime,
        doorsTime: s.doorsTime,
        supportAct: s.supportAct,
        contractUrl: s.contractUrl,
        notes: s.notes,
        status: "planned",
        venueHireFeePence: s.venueHireFeePence,
        venueDepositPence: s.venueDepositPence,
        venueDepositPaid: false,
        settlementType: s.settlementType,
        settlementSplitPercent: s.settlementSplitPercent,
        settlementGuaranteePence: s.settlementGuaranteePence,
        marketingBudgetPence: s.marketingBudgetPence,
        marketingCopy: s.marketingCopy,
        marketingNotes: s.marketingNotes,
        ticketPricePence: s.ticketPricePence,
        ticketCapacity: s.ticketCapacity,
      })
      .returning({ id: shows.id });
    idMap.set(s.id, newShow.id);

    // Clone show tasks (reset done state)
    const srcTasks = await db
      .select()
      .from(showTasks)
      .where(eq(showTasks.showId, s.id));
    if (srcTasks.length > 0) {
      await db.insert(showTasks).values(
        srcTasks.map((t) => ({
          orgId: src.orgId,
          showId: newShow.id,
          label: t.label,
          done: false,
          sortOrder: t.sortOrder,
        })),
      );
    }
  }

  // Clone reminders (date-shifted). Tour-level + per-show.
  const srcReminders = await db
    .select()
    .from(reminders)
    .where(eq(reminders.orgId, src.orgId));
  const tourReminders = srcReminders.filter((r) => r.tourId === sourceTourId);
  const showReminders = srcReminders.filter(
    (r) => r.showId != null && idMap.has(r.showId),
  );
  const allClonedReminders = [...tourReminders, ...showReminders];
  if (allClonedReminders.length > 0) {
    await db.insert(reminders).values(
      allClonedReminders.map((r) => ({
        orgId: src.orgId,
        tourId: r.tourId === sourceTourId ? newTour.id : null,
        showId: r.showId ? idMap.get(r.showId) ?? null : null,
        type: r.type,
        title: r.title,
        notes: r.notes,
        dueAt: shiftTimestamp(r.dueAt, offsetDays) ?? r.dueAt,
      })),
    );
  }

  await logActivity({
    orgId: src.orgId,
    userId: user.id,
    resourceType: "tour",
    resourceId: newTour.id,
    action: "create",
    summary: `cloned tour "${src.name}" → "${newName}"`,
  });

  revalidatePath("/tours");
  redirect(`/tours/${newTour.id}`);
}
