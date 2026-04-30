"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { accommodations, travel, reminders, shows } from "@/db/schema";
import { requireOrg } from "@/lib/auth";
import { parsePence } from "@/lib/utils";
import {
  reminderTypeValues,
  travelTypeValues,
  type ReminderType,
  type TravelType,
} from "@/lib/options";

function parseFormPence(v: FormDataEntryValue | null): number | null {
  if (v == null) return null;
  return parsePence(String(v));
}
function strOrNull(v: FormDataEntryValue | null): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}
function dateOrNull(v: FormDataEntryValue | null): string | null {
  return strOrNull(v);
}

function pathsToRevalidate(tourId: string, showId: string) {
  return [`/tours/${tourId}/shows/${showId}`, `/tours/${tourId}`];
}

/* ----------------------------- Accommodations ---------------------------- */

export async function addAccommodation(formData: FormData) {
  const { orgId } = await requireOrg();
  const tourId = String(formData.get("tourId"));
  const showId = String(formData.get("showId"));
  await db.insert(accommodations).values({
    orgId,
    showId,
    hotelName: strOrNull(formData.get("hotelName")),
    address: strOrNull(formData.get("address")),
    checkIn: dateOrNull(formData.get("checkIn")),
    checkInTime: strOrNull(formData.get("checkInTime")),
    checkOut: dateOrNull(formData.get("checkOut")),
    checkOutTime: strOrNull(formData.get("checkOutTime")),
    bookingReference: strOrNull(formData.get("bookingReference")),
    contactPhone: strOrNull(formData.get("contactPhone")),
    costPence: parseFormPence(formData.get("cost")),
    notes: strOrNull(formData.get("notes")),
  });
  for (const p of pathsToRevalidate(tourId, showId)) revalidatePath(p);
  redirect(`/tours/${tourId}/shows/${showId}`);
}

export async function updateAccommodation(formData: FormData) {
  const { orgId } = await requireOrg();
  const id = String(formData.get("id"));
  const tourId = String(formData.get("tourId"));
  const showId = String(formData.get("showId"));
  await db
    .update(accommodations)
    .set({
      hotelName: strOrNull(formData.get("hotelName")),
      address: strOrNull(formData.get("address")),
      checkIn: dateOrNull(formData.get("checkIn")),
      checkInTime: strOrNull(formData.get("checkInTime")),
      checkOut: dateOrNull(formData.get("checkOut")),
      checkOutTime: strOrNull(formData.get("checkOutTime")),
      bookingReference: strOrNull(formData.get("bookingReference")),
      contactPhone: strOrNull(formData.get("contactPhone")),
      costPence: parseFormPence(formData.get("cost")),
      notes: strOrNull(formData.get("notes")),
    })
    .where(and(eq(accommodations.id, id), eq(accommodations.orgId, orgId)));
  for (const p of pathsToRevalidate(tourId, showId)) revalidatePath(p);
  redirect(`/tours/${tourId}/shows/${showId}`);
}

export async function deleteAccommodation(formData: FormData) {
  const { orgId } = await requireOrg();
  const id = String(formData.get("id"));
  const tourId = String(formData.get("tourId"));
  const showId = String(formData.get("showId"));
  await db
    .delete(accommodations)
    .where(and(eq(accommodations.id, id), eq(accommodations.orgId, orgId)));
  for (const p of pathsToRevalidate(tourId, showId)) revalidatePath(p);
}

/* --------------------------------- Travel -------------------------------- */

export async function addTravel(formData: FormData) {
  const { orgId } = await requireOrg();
  const tourId = String(formData.get("tourId"));
  const showId = String(formData.get("showId"));
  const tt = String(formData.get("travelType")) as TravelType;
  await db.insert(travel).values({
    orgId,
    showId,
    travelType: (travelTypeValues as readonly string[]).includes(tt)
      ? tt
      : "train",
    departureLocation: strOrNull(formData.get("departureLocation")),
    departureAt: strOrNull(formData.get("departureAt"))
      ? new Date(String(formData.get("departureAt")))
      : null,
    arrivalLocation: strOrNull(formData.get("arrivalLocation")),
    arrivalAt: strOrNull(formData.get("arrivalAt"))
      ? new Date(String(formData.get("arrivalAt")))
      : null,
    bookingReference: strOrNull(formData.get("bookingReference")),
    costPence: parseFormPence(formData.get("cost")),
    notes: strOrNull(formData.get("notes")),
  });
  for (const p of pathsToRevalidate(tourId, showId)) revalidatePath(p);
  redirect(`/tours/${tourId}/shows/${showId}`);
}

export async function updateTravel(formData: FormData) {
  const { orgId } = await requireOrg();
  const id = String(formData.get("id"));
  const tourId = String(formData.get("tourId"));
  const showId = String(formData.get("showId"));
  const tt = String(formData.get("travelType")) as TravelType;
  await db
    .update(travel)
    .set({
      travelType: (travelTypeValues as readonly string[]).includes(tt)
        ? tt
        : "train",
      departureLocation: strOrNull(formData.get("departureLocation")),
      departureAt: strOrNull(formData.get("departureAt"))
        ? new Date(String(formData.get("departureAt")))
        : null,
      arrivalLocation: strOrNull(formData.get("arrivalLocation")),
      arrivalAt: strOrNull(formData.get("arrivalAt"))
        ? new Date(String(formData.get("arrivalAt")))
        : null,
      bookingReference: strOrNull(formData.get("bookingReference")),
      costPence: parseFormPence(formData.get("cost")),
      notes: strOrNull(formData.get("notes")),
    })
    .where(and(eq(travel.id, id), eq(travel.orgId, orgId)));
  for (const p of pathsToRevalidate(tourId, showId)) revalidatePath(p);
  redirect(`/tours/${tourId}/shows/${showId}`);
}

export async function deleteTravel(formData: FormData) {
  const { orgId } = await requireOrg();
  const id = String(formData.get("id"));
  const tourId = String(formData.get("tourId"));
  const showId = String(formData.get("showId"));
  await db
    .delete(travel)
    .where(and(eq(travel.id, id), eq(travel.orgId, orgId)));
  for (const p of pathsToRevalidate(tourId, showId)) revalidatePath(p);
}

/* ------------------------------- Tickets --------------------------------- */

export async function updateTickets(formData: FormData) {
  const { orgId } = await requireOrg();
  const tourId = String(formData.get("tourId"));
  const showId = String(formData.get("showId"));

  function intOrNull(v: FormDataEntryValue | null): number | null {
    if (v == null) return null;
    const s = String(v).trim();
    if (!s) return null;
    const n = parseInt(s, 10);
    return Number.isFinite(n) ? n : null;
  }
  function pctOrNull(v: FormDataEntryValue | null): string | null {
    if (v == null) return null;
    const s = String(v).trim();
    if (!s) return null;
    const n = parseFloat(s);
    return Number.isFinite(n) ? n.toFixed(2) : null;
  }

  await db
    .update(shows)
    .set({
      ticketPricePence: parseFormPence(formData.get("ticketPrice")),
      estTicketsSold: intOrNull(formData.get("estTicketsSold")),
      estTicketsSoldPct: pctOrNull(formData.get("estTicketsSoldPct")),
      ticketsSold: intOrNull(formData.get("ticketsSold")) ?? 0,
      ticketsComped: intOrNull(formData.get("ticketsComped")) ?? 0,
      actualRevenuePence: parseFormPence(formData.get("actualRevenue")),
      actualTicketPricePence: parseFormPence(formData.get("actualTicketPrice")),
      updatedAt: new Date(),
    })
    .where(and(eq(shows.id, showId), eq(shows.orgId, orgId)));

  for (const p of pathsToRevalidate(tourId, showId)) revalidatePath(p);
}

/* ------------------------------- Reminders ------------------------------- */

export async function addReminder(formData: FormData) {
  const { orgId } = await requireOrg();
  const tourId = String(formData.get("tourId"));
  const showId = strOrNull(formData.get("showId"));
  const type = String(formData.get("type")) as ReminderType;
  const title = String(formData.get("title")).trim();
  const dueAtRaw = String(formData.get("dueAt")).trim();
  if (!title || !dueAtRaw) return;
  await db.insert(reminders).values({
    orgId,
    tourId: tourId || null,
    showId,
    type: (reminderTypeValues as readonly string[]).includes(type) ? type : "custom",
    title,
    notes: strOrNull(formData.get("notes")),
    dueAt: new Date(dueAtRaw),
  });
  if (showId && tourId) {
    for (const p of pathsToRevalidate(tourId, showId)) revalidatePath(p);
  } else if (tourId) {
    revalidatePath(`/tours/${tourId}`);
  }
  revalidatePath("/");
}

export async function completeReminder(formData: FormData) {
  const { orgId } = await requireOrg();
  const id = String(formData.get("id"));
  await db
    .update(reminders)
    .set({ completedAt: new Date() })
    .where(and(eq(reminders.id, id), eq(reminders.orgId, orgId)));
  revalidatePath("/");
  const tourId = strOrNull(formData.get("tourId"));
  const showId = strOrNull(formData.get("showId"));
  if (tourId) revalidatePath(`/tours/${tourId}`);
  if (tourId && showId) revalidatePath(`/tours/${tourId}/shows/${showId}`);
}

export async function deleteReminder(formData: FormData) {
  const { orgId } = await requireOrg();
  const id = String(formData.get("id"));
  await db
    .delete(reminders)
    .where(and(eq(reminders.id, id), eq(reminders.orgId, orgId)));
  revalidatePath("/");
  const tourId = strOrNull(formData.get("tourId"));
  const showId = strOrNull(formData.get("showId"));
  if (tourId) revalidatePath(`/tours/${tourId}`);
  if (tourId && showId) revalidatePath(`/tours/${tourId}/shows/${showId}`);
}
