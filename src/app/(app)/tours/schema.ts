import { z } from "zod";
import { tourStatusOptions, tourStatusValues } from "@/lib/options";

export { tourStatusOptions };

const optionalString = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .nullable();

const optionalDate = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .nullable();

const optionalPence = z
  .string()
  .trim()
  .transform((v) => {
    if (v === "") return null;
    const n = Number(v.replace(/[£,\s]/g, ""));
    if (!Number.isFinite(n)) return null;
    return Math.round(n * 100);
  })
  .nullable();

export const tourSchema = z.object({
  name: z.string().trim().min(1, "Tour name is required").max(200),
  comedianId: z.string().uuid("Select a comedian"),
  status: z.enum(tourStatusValues),
  startDate: optionalDate,
  endDate: optionalDate,
  description: optionalString,
  marketingCopy: optionalString,
  pressRelease: optionalString,
  photoAssetsNotes: optionalString,
  socialCopyTemplate: optionalString,
  budget: optionalPence,
});
