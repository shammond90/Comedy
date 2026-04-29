import { z } from "zod";

const optionalString = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .nullable();

export const comedianSchema = z.object({
  stageName: z.string().trim().min(1, "Stage name is required").max(200),
  legalName: optionalString,
  phone: optionalString,
  email: optionalString,
  addressLine1: optionalString,
  addressLine2: optionalString,
  city: optionalString,
  postcode: optionalString,
  country: optionalString,
  agentName: optionalString,
  agentCompany: optionalString,
  agentPhone: optionalString,
  agentEmail: optionalString,
  managerName: optionalString,
  managerCompany: optionalString,
  managerPhone: optionalString,
  managerEmail: optionalString,
  hospitalityRider: optionalString,
  technicalRider: optionalString,
  dressingRoomRequirements: optionalString,
  accessibilityRequirements: optionalString,
  socialInstagram: optionalString,
  socialTwitter: optionalString,
  socialTikTok: optionalString,
  socialOther: optionalString,
  notes: optionalString,
});
