/**
 * Shared helpers for Next.js server actions.
 *
 * Most resources (tours, comedians, venues, shows) follow the same pattern:
 * 1. Convert FormData to a plain object
 * 2. Validate with a Zod schema
 * 3. Return field errors on failure, or persist on success.
 *
 * These helpers remove the boilerplate that was previously duplicated in each
 * `actions.ts` file.
 */

export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

/**
 * Convert FormData entries to a flat string-keyed object suitable for passing
 * to `Schema.safeParse(...)`. Multi-value fields collapse to the last value;
 * use FormData directly if you need arrays.
 */
export function formToObject(formData: FormData): Record<string, string> {
  const obj: Record<string, string> = {};
  for (const [k, v] of formData.entries()) obj[k] = String(v);
  return obj;
}
