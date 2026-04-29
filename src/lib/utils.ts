import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const gbp = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
});

/** Format an integer pence value as GBP currency, e.g. 12345 -> "£123.45". */
export function formatPence(pence: number | null | undefined): string {
  if (pence == null) return "—";
  return gbp.format(pence / 100);
}

/** Parse a user-entered "£123.45" or "123.45" into integer pence. */
export function parsePence(input: string): number | null {
  const trimmed = input.replace(/[£,\s]/g, "").trim();
  if (!trimmed) return null;
  const num = Number(trimmed);
  if (!Number.isFinite(num)) return null;
  return Math.round(num * 100);
}

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  if (typeof d === "string") {
    // Plain YYYY-MM-DD strings must be parsed as local dates, not UTC, to
    // avoid the date shifting by one day in timezones east of UTC.
    const localDate = /^\d{4}-\d{2}-\d{2}$/.test(d)
      ? (() => {
          const [y, m, day] = d.split("-").map(Number);
          return new Date(y, m - 1, day);
        })()
      : new Date(d);
    return dateFmt.format(localDate);
  }
  return dateFmt.format(d);
}
