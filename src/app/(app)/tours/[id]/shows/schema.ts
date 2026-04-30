import { z } from "zod";
import {
  showStatusOptions,
  showStatusValues,
  settlementTypeOptions,
  settlementTypeValues,
  type ShowStatus,
} from "@/lib/options";

export { showStatusOptions, settlementTypeOptions, showStatusValues };
export type { ShowStatus };

const optionalString = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .nullable();

const optionalUuid = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .refine(
    (v) => v === null || /^[0-9a-f-]{36}$/i.test(v),
    "Invalid id",
  );

const optionalInt = z
  .string()
  .trim()
  .transform((v) => {
    if (v === "") return null;
    const n = Number(v);
    if (!Number.isFinite(n)) return null;
    return Math.trunc(n);
  })
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

const optionalPercent = z
  .string()
  .trim()
  .transform((v) => {
    if (v === "") return null;
    const n = Number(v.replace(/%/g, ""));
    if (!Number.isFinite(n)) return null;
    return n.toFixed(2);
  })
  .nullable();

const optionalUrl = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .refine(
    (v) =>
      v === null ||
      /^(https?:\/\/|\/)/i.test(v),
    "Must be a URL starting with http:// or https://",
  );

export const showSchema = z.object({
  venueId: optionalUuid,
  showDate: z.string().min(1, "Date is required"),
  country: optionalString,
  city: optionalString,
  showTime: optionalString,
  doorsTime: optionalString,
  supportAct: optionalString,
  contractUrl: optionalUrl,
  notes: optionalString,
  status: z.enum(showStatusValues),

  venueHireFee: optionalPence,
  venueDeposit: optionalPence,
  venueDepositPaid: z
    .string()
    .optional()
    .transform((v) => v === "on" || v === "true"),

  settlementType: z
    .union([
      z.enum(settlementTypeValues),
      z.literal(""),
    ])
    .transform((v) => (v === "" ? null : v))
    .nullable(),
  settlementSplitPercent: optionalPercent,
  settlementGuarantee: optionalPence,

  ticketCapacity: optionalInt,

  marketingBudget: optionalPence,
  marketingCopy: optionalString,
  marketingNotes: optionalString,

  // Quick-add venue fields (used only when venueId is empty)
  // These inputs may be absent from the DOM when the panel is hidden,
  // so FormData sends undefined — accept that alongside empty string.
  newVenueName: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional()
    .transform((v) => v ?? null),
  newVenueCountry: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional()
    .transform((v) => v ?? null),
  newVenueCity: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional()
    .transform((v) => v ?? null),
  newVenueCapacity: z
    .string()
    .trim()
    .transform((v) => {
      if (v === "") return null;
      const n = Number(v);
      if (!Number.isFinite(n)) return null;
      return Math.trunc(n);
    })
    .nullable()
    .optional()
    .transform((v) => v ?? null),
});
