/**
 * Single source of truth for option lists shown in dropdowns and Zod enums.
 *
 * The order, values and labels here are mirrored in the corresponding pgEnums
 * in `src/db/schema.ts`. When you add a value here, also add it to the matching
 * enum (and write a migration if the DB enum needs updating).
 */

/* ----------------------------------------------------------------------- */
/* Tour status                                                              */
/* ----------------------------------------------------------------------- */

export const tourStatusValues = [
  "planning",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
] as const;
export type TourStatus = (typeof tourStatusValues)[number];

export const tourStatusOptions = [
  { value: "planning", label: "Planning" },
  { value: "confirmed", label: "Confirmed" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
] as const satisfies ReadonlyArray<{ value: TourStatus; label: string }>;

/* ----------------------------------------------------------------------- */
/* Show status                                                              */
/* ----------------------------------------------------------------------- */

export const showStatusValues = [
  "planned",
  "contacted",
  "booked",
  "rider_sent",
  "confirmed",
  "completed",
  "unavailable",
  "cancelled",
] as const;
export type ShowStatus = (typeof showStatusValues)[number];

export const showStatusOptions = [
  { value: "planned", label: "Planned" },
  { value: "contacted", label: "Contacted" },
  { value: "booked", label: "Booked" },
  { value: "rider_sent", label: "Rider sent" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "unavailable", label: "Unavailable" },
  { value: "cancelled", label: "Cancelled" },
] as const satisfies ReadonlyArray<{ value: ShowStatus; label: string }>;

/* ----------------------------------------------------------------------- */
/* Settlement type                                                          */
/* ----------------------------------------------------------------------- */

export const settlementTypeValues = [
  "guarantee",
  "flat_fee",
  "split",
  "guarantee_vs_split",
] as const;
export type SettlementType = (typeof settlementTypeValues)[number];

/** Includes a "" option for the "—" (unset) selection in forms. */
export const settlementTypeOptions = [
  { value: "", label: "—" },
  { value: "guarantee", label: "Guarantee" },
  { value: "flat_fee", label: "Flat fee" },
  { value: "split", label: "% split" },
  { value: "guarantee_vs_split", label: "Guarantee vs split" },
] as const;

/* ----------------------------------------------------------------------- */
/* Travel type                                                              */
/* ----------------------------------------------------------------------- */

export const travelTypeValues = [
  "train",
  "car",
  "flight",
  "tour_bus",
  "other",
] as const;
export type TravelType = (typeof travelTypeValues)[number];

export const travelTypeLabels: Record<TravelType, string> = {
  train: "Train",
  car: "Car",
  flight: "Flight",
  tour_bus: "Tour bus",
  other: "Other",
};

/* ----------------------------------------------------------------------- */
/* Reminder type                                                            */
/* ----------------------------------------------------------------------- */

export const reminderTypeValues = [
  "venue_followup",
  "rider_due",
  "marketing_deadline",
  "settlement_due",
  "tech_rider_confirm",
  "accommodation_booking",
  "travel_booking",
  "ticket_on_sale",
  "custom",
] as const;
export type ReminderType = (typeof reminderTypeValues)[number];

export const reminderTypeLabels: Record<ReminderType, string> = {
  venue_followup: "Venue follow-up",
  rider_due: "Rider due",
  marketing_deadline: "Marketing deadline",
  settlement_due: "Settlement due",
  tech_rider_confirm: "Tech rider confirm",
  accommodation_booking: "Accommodation",
  travel_booking: "Travel",
  ticket_on_sale: "Tickets on sale",
  custom: "Custom",
};

export const reminderTypeOptions = reminderTypeValues.map((v) => ({
  value: v,
  label: reminderTypeLabels[v],
}));

/* ----------------------------------------------------------------------- */
/* Venue type                                                               */
/* ----------------------------------------------------------------------- */

export const venueTypeValues = [
  "comedy_club",
  "theatre",
  "arena",
  "arts_centre",
  "pub",
  "other",
] as const;
export type VenueType = (typeof venueTypeValues)[number];

export const venueTypeOptions = [
  { value: "comedy_club", label: "Comedy club" },
  { value: "theatre", label: "Theatre" },
  { value: "arena", label: "Arena" },
  { value: "arts_centre", label: "Arts centre" },
  { value: "pub", label: "Pub" },
  { value: "other", label: "Other" },
] as const satisfies ReadonlyArray<{ value: VenueType; label: string }>;
