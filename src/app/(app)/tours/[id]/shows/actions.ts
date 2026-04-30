"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { shows, venues } from "@/db/schema";
import { requireOrg } from "@/lib/auth";
import { showSchema } from "./schema";

function formToObject(formData: FormData): Record<string, string> {
  const obj: Record<string, string> = {};
  for (const [k, v] of formData.entries()) obj[k] = String(v);
  return obj;
}

export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

async function resolveVenueId(
  orgId: string,
  data: { venueId: string | null; newVenueName: string | null; newVenueCity: string | null; newVenueCapacity?: number | null },
): Promise<string | null> {
  if (data.venueId) return data.venueId;
  if (data.newVenueName) {
    const [v] = await db
      .insert(venues)
      .values({
        orgId,
        name: data.newVenueName,
        city: data.newVenueCity,
        capacity: data.newVenueCapacity ?? null,
        venueType: "comedy_club",
      })
      .returning({ id: venues.id });
    return v.id;
  }
  return null;
}

function mapToColumns(
  data: ReturnType<typeof showSchema.parse>,
  venueId: string | null,
) {
  return {
    venueId,
    showDate: data.showDate,
    city: data.city,
    showTime: data.showTime,
    doorsTime: data.doorsTime,
    supportAct: data.supportAct,
    contractUrl: data.contractUrl,
    notes: data.notes,
    status: data.status,
    venueHireFeePence: data.venueHireFee,
    venueDepositPence: data.venueDeposit,
    venueDepositPaid: data.venueDepositPaid,
    settlementType: data.settlementType,
    settlementSplitPercent: data.settlementSplitPercent,
    settlementGuaranteePence: data.settlementGuarantee,
    ticketCapacity: data.ticketCapacity,
    marketingBudgetPence: data.marketingBudget,
    marketingCopy: data.marketingCopy,
    marketingNotes: data.marketingNotes,
  };
}

export async function createShowAction(
  tourId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { orgId } = await requireOrg();
  const parsed = showSchema.safeParse(formToObject(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const venueId = await resolveVenueId(orgId, parsed.data);
  try {
    const [row] = await db
      .insert(shows)
      .values({ ...mapToColumns(parsed.data, venueId), orgId, tourId })
      .returning({ id: shows.id });
    revalidatePath(`/tours/${tourId}`);
    redirect(`/tours/${tourId}/shows/${row.id}`);
  } catch (err) {
    if (err instanceof Error && /shows_comedian_date_unique/.test(err.message)) {
      return {
        error:
          "This comedian already has a show on that date. Cancel or change the date first.",
      };
    }
    throw err;
  }
}

export async function updateShowAction(
  tourId: string,
  showId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { orgId } = await requireOrg();
  const parsed = showSchema.safeParse(formToObject(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const venueId = await resolveVenueId(orgId, parsed.data);
  try {
    await db
      .update(shows)
      .set({ ...mapToColumns(parsed.data, venueId), updatedAt: new Date() })
      .where(and(eq(shows.id, showId), eq(shows.orgId, orgId)));
    revalidatePath(`/tours/${tourId}`);
    revalidatePath(`/tours/${tourId}/shows/${showId}`);
    redirect(`/tours/${tourId}/shows/${showId}`);
  } catch (err) {
    if (err instanceof Error && /shows_comedian_date_unique/.test(err.message)) {
      return {
        error:
          "This comedian already has another show on that date.",
      };
    }
    throw err;
  }
}

export async function deleteShowAction(formData: FormData) {
  const id = String(formData.get("id"));
  const tourId = String(formData.get("tourId"));
  const { orgId } = await requireOrg();
  await db
    .update(shows)
    .set({ archivedAt: new Date() })
    .where(and(eq(shows.id, id), eq(shows.orgId, orgId)));
  revalidatePath(`/tours/${tourId}`);
  redirect(`/tours/${tourId}`);
}

export async function quickUpdateStatusAction(formData: FormData) {
  const id = String(formData.get("id"));
  const tourId = String(formData.get("tourId"));
  const status = String(formData.get("status")) as
    | "planned"
    | "contacted"
    | "booked"
    | "rider_sent"
    | "confirmed"
    | "unavailable"
    | "cancelled";
  const { orgId } = await requireOrg();

  const updates: Record<string, unknown> = { status, updatedAt: new Date() };
  const now = new Date();
  if (status === "contacted") updates.contactedAt = now;
  if (status === "confirmed") updates.confirmedAt = now;

  await db
    .update(shows)
    .set(updates)
    .where(and(eq(shows.id, id), eq(shows.orgId, orgId)));
  revalidatePath(`/tours/${tourId}`);
  revalidatePath(`/tours/${tourId}/shows/${id}`);
}

/**
 * Duplicate a show into the same tour. Copies everything except the date,
 * which is reset so the user must pick a new one. Cost rows (accommodation,
 * travel, reminders) are NOT copied.
 *
 * Strategy: insert a placeholder row using the same values minus the date,
 * but we can't insert without a date (NOT NULL). So instead we redirect to
 * the new-show page with all duplicated values pre-filled via search params.
 */
export async function duplicateShowAction(formData: FormData) {
  const id = String(formData.get("id"));
  const tourId = String(formData.get("tourId"));
  const { orgId } = await requireOrg();

  const [src] = await db
    .select()
    .from(shows)
    .where(and(eq(shows.id, id), eq(shows.orgId, orgId)))
    .limit(1);
  if (!src) {
    redirect(`/tours/${tourId}`);
  }

  const params = new URLSearchParams();
  if (src.venueId) params.set("venueId", src.venueId);
  if (src.city) params.set("city", src.city);
  if (src.showTime) params.set("showTime", src.showTime);
  if (src.doorsTime) params.set("doorsTime", src.doorsTime);
  if (src.supportAct) params.set("supportAct", src.supportAct);
  if (src.contractUrl) params.set("contractUrl", src.contractUrl);
  if (src.notes) params.set("notes", src.notes);
  params.set("status", "planned");
  if (src.venueHireFeePence != null)
    params.set("venueHireFee", (src.venueHireFeePence / 100).toFixed(2));
  if (src.venueDepositPence != null)
    params.set("venueDeposit", (src.venueDepositPence / 100).toFixed(2));
  if (src.settlementType) params.set("settlementType", src.settlementType);
  if (src.settlementSplitPercent)
    params.set("settlementSplitPercent", src.settlementSplitPercent);
  if (src.settlementGuaranteePence != null)
    params.set(
      "settlementGuarantee",
      (src.settlementGuaranteePence / 100).toFixed(2),
    );
  if (src.ticketPricePence != null)
    params.set("ticketPrice", (src.ticketPricePence / 100).toFixed(2));
  if (src.ticketCapacity != null)
    params.set("ticketCapacity", String(src.ticketCapacity));
  if (src.marketingBudgetPence != null)
    params.set(
      "marketingBudget",
      (src.marketingBudgetPence / 100).toFixed(2),
    );
  if (src.marketingCopy) params.set("marketingCopy", src.marketingCopy);
  if (src.marketingNotes) params.set("marketingNotes", src.marketingNotes);

  redirect(`/tours/${tourId}/shows/new?${params.toString()}`);
}
