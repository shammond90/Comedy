import "server-only";
import { cache } from "react";

/**
 * Resolve a set of auth user IDs to their email addresses via the Supabase
 * admin API. Requires SUPABASE_SERVICE_ROLE_KEY. Returns an empty Map if the
 * key is missing or the call fails so callers can fall back gracefully.
 */
export const resolveUserEmails = cache(
  async (userIds: string[]): Promise<Map<string, string>> => {
    const profiles = await resolveUserProfiles(userIds);
    const out = new Map<string, string>();
    for (const [id, p] of profiles) {
      out.set(id, p.email);
    }
    return out;
  },
);

export type UserProfile = { email: string; displayName: string | null };

/**
 * Resolve user IDs to { email, displayName } via the Supabase admin API.
 */
export const resolveUserProfiles = cache(
  async (userIds: string[]): Promise<Map<string, UserProfile>> => {
    const out = new Map<string, UserProfile>();
    if (userIds.length === 0) return out;

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) return out;

    const { createClient } = await import("@supabase/supabase-js");
    const admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
    if (error || !data) return out;

    const wanted = new Set(userIds);
    for (const u of data.users) {
      if (wanted.has(u.id) && u.email) {
        out.set(u.id, {
          email: u.email,
          displayName: (u.user_metadata?.display_name as string | undefined) ?? null,
        });
      }
    }
    return out;
  },
);
