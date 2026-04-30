/**
 * Minimal RFC 5545 (iCalendar) generator. Hand-rolled to avoid a dep.
 */

export type IcsEvent = {
  uid: string;
  summary: string;
  description?: string | null;
  location?: string | null;
  /** UTC datetime for DTSTART. For all-day, use dateOnly. */
  start: Date;
  end: Date;
  url?: string | null;
};

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function fmtUtc(d: Date): string {
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

function escapeText(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

/**
 * Fold a long content line per RFC 5545 (75 octets, CRLF + space continuation).
 * We approximate with chars; ASCII-heavy inputs will be safe.
 */
function fold(line: string): string {
  if (line.length <= 75) return line;
  const parts: string[] = [];
  let i = 0;
  parts.push(line.slice(0, 75));
  i = 75;
  while (i < line.length) {
    parts.push(" " + line.slice(i, i + 74));
    i += 74;
  }
  return parts.join("\r\n");
}

export function buildIcs(opts: {
  calendarName: string;
  events: IcsEvent[];
  /** PRODID — opaque app identifier. */
  prodId?: string;
}): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${opts.prodId ?? "Comedy Tour Manager"}//EN`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(opts.calendarName)}`,
  ];
  const dtstamp = fmtUtc(new Date());
  for (const e of opts.events) {
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${e.uid}`);
    lines.push(`DTSTAMP:${dtstamp}`);
    lines.push(`DTSTART:${fmtUtc(e.start)}`);
    lines.push(`DTEND:${fmtUtc(e.end)}`);
    lines.push(fold(`SUMMARY:${escapeText(e.summary)}`));
    if (e.location) lines.push(fold(`LOCATION:${escapeText(e.location)}`));
    if (e.description) lines.push(fold(`DESCRIPTION:${escapeText(e.description)}`));
    if (e.url) lines.push(fold(`URL:${e.url}`));
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}

/**
 * Combine a YYYY-MM-DD show date and HH:MM:SS time into a UTC Date.
 * If time is null, defaults to 19:00 local-naïve (treated as UTC for V1).
 */
export function combineShowDateTime(
  showDate: string,
  showTime: string | null,
  durationMinutes = 90,
): { start: Date; end: Date } {
  const t = showTime ?? "19:00:00";
  const start = new Date(`${showDate}T${t}Z`);
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  return { start, end };
}
