import { z } from "zod";
import { venueTypeOptions, venueTypeValues } from "@/lib/options";

export { venueTypeOptions };

const optionalString = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .nullable();

export const venueSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  venueType: z.enum(venueTypeValues),
  addressLine1: optionalString,
  addressLine2: optionalString,
  city: z.string().trim().min(1, "City is required"),
  postcode: optionalString,
  country: z.string().trim().min(1, "Country is required"),
  capacity: z
    .union([z.literal(""), z.coerce.number().int().min(0).max(1_000_000)])
    .transform((v) => (v === "" ? null : v))
    .nullable(),
  capacityNotes: optionalString,
  primaryContactName: optionalString,
  primaryContactRole: optionalString,
  primaryContactPhone: optionalString,
  primaryContactEmail: optionalString,
  secondaryContactName: optionalString,
  secondaryContactRole: optionalString,
  secondaryContactPhone: optionalString,
  secondaryContactEmail: optionalString,
  technicalContactName: optionalString,
  technicalContactPhone: optionalString,
  technicalContactEmail: optionalString,
  stageDimensions: optionalString,
  loadInDetails: optionalString,
  parkingInfo: optionalString,
  notes: optionalString,
});

export type VenueInput = z.input<typeof venueSchema>;
export type VenueData = z.output<typeof venueSchema>;
