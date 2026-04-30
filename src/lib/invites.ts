import "server-only";
import { randomBytes } from "node:crypto";

/**
 * Generate a URL-safe random invite token.
 *
 * Uses 32 bytes (256 bits) of entropy → ~43 chars in base64url.
 * This is a bearer credential; treat the resulting URL as secret.
 */
export function generateInviteToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Default invitation lifetime — 14 days. */
export const INVITE_TTL_DAYS = 14;

export function inviteExpiry(now: Date = new Date()): Date {
  const d = new Date(now);
  d.setUTCDate(d.getUTCDate() + INVITE_TTL_DAYS);
  return d;
}

/**
 * Build the absolute invite acceptance URL.
 *
 * Resolution order:
 *   1. NEXT_PUBLIC_SITE_URL (preferred, set per-environment)
 *   2. VERCEL_PROJECT_PRODUCTION_URL (Vercel's stable production alias —
 *      e.g. `comedy-zeta.vercel.app`, NOT the per-deployment URL which
 *      sits behind deployment protection)
 *   3. VERCEL_URL (auto-set on Vercel deployments — per-deployment, no scheme;
 *      OK for previews where the recipient already has Vercel access)
 *   4. http://localhost:3000 (dev fallback)
 */
export function inviteUrl(token: string): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  const prodAlias = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const vercel = process.env.VERCEL_URL;
  const base = explicit
    ? explicit.replace(/\/$/, "")
    : prodAlias
      ? `https://${prodAlias}`
      : vercel
        ? `https://${vercel}`
        : "http://localhost:3000";
  return `${base}/invite/${token}`;
}
