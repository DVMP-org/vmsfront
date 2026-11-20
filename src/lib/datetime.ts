/**
 * Date and time helpers.
 *
 * Formatting lives here so every screen renders dates the same way and the
 * locale is changed in one place. Functions accept strings, numbers or `Date`
 * and return an em dash for empty or unparseable input instead of "Invalid
 * Date", which is what operators were seeing in tables.
 */

export type DateInput = string | number | Date | null | undefined;

const EMPTY = "—";

function toDate(value: DateInput): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** `4 Nov 2026` */
export function formatDate(value: DateInput, timeZone?: string | null): string {
  const date = toDate(value);
  if (!date) return EMPTY;
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: timeZone || undefined,
  });
}

/** `November 2026` */
export function formatMonthYear(value: DateInput): string {
  const date = toDate(value);
  if (!date) return EMPTY;
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

/** `Wed` */
export function formatWeekday(value: DateInput): string {
  const date = toDate(value);
  if (!date) return EMPTY;
  return date.toLocaleDateString(undefined, { weekday: "short" });
}

/** `4 Nov` */
export function formatShortDate(value: DateInput): string {
  const date = toDate(value);
  if (!date) return EMPTY;
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

/** `4 Nov 2026, 14:30` */
export function formatDateTime(value: DateInput, timeZone?: string | null): string {
  const date = toDate(value);
  if (!date) return EMPTY;
  return date.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timeZone || undefined,
    ...(timeZone ? { timeZoneName: "short" as const } : {}),
  });
}

/** `14:30` */
export function formatTime(value: DateInput): string {
  const date = toDate(value);
  if (!date) return EMPTY;
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** `4 Nov, 09:00 – 6 Nov, 18:00` */
export function formatDateRange(from: DateInput, to: DateInput): string {
  const start = toDate(from);
  const end = toDate(to);
  if (!start || !end) return EMPTY;
  const sameDay = start.toDateString() === end.toDateString();
  const short = (date: Date) =>
    date.toLocaleString(undefined, {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  if (sameDay) {
    return `${start.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
    })}, ${formatTime(start)} – ${formatTime(end)}`;
  }
  return `${short(start)} – ${short(end)}`;
}

/** `in 3 hours`, `2 days ago` */
export function relativeTime(value: DateInput, now: DateInput = new Date()) {
  const date = toDate(value);
  const base = toDate(now) ?? new Date();
  if (!date) return EMPTY;
  const minutes = Math.round((date.getTime() - base.getTime()) / 60000);
  const relative = new Intl.RelativeTimeFormat(undefined, {
    numeric: "auto",
  });
  const steps: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["minute", 60],
    ["hour", 24],
    ["day", 7],
    ["week", 4.348],
    ["month", 12],
    ["year", Number.POSITIVE_INFINITY],
  ];
  let duration = minutes;
  for (const [unit, size] of steps) {
    if (Math.abs(duration) < size)
      return relative.format(Math.round(duration), unit);
    duration /= size;
  }
  return EMPTY;
}

/** `2026-11-04` for `<input type="date">`. */
export function toDateInputValue(value: DateInput): string {
  const date = toDate(value);
  if (!date) return "";
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

/** `2026-11-04T09:00` for `<input type="datetime-local">`. */
export function toDateTimeInputValue(value: DateInput): string {
  const date = toDate(value);
  if (!date) return "";
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function zonedParts(value: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(value);
  const number = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return {
    year: number("year"),
    month: number("month"),
    day: number("day"),
    hour: number("hour"),
    minute: number("minute"),
  };
}

/** An instant expressed as a Site-local `datetime-local` input value. */
export function toZonedDateTimeInputValue(value: DateInput, timeZone: string): string {
  const date = toDate(value);
  if (!date) return "";
  const parts = zonedParts(date, timeZone);
  const pad = (number: number) => String(number).padStart(2, "0");
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}`;
}

/** Resolve Site-local civil time to one UTC instant; reject DST gaps and overlaps. */
export function fromZonedDateTimeInputValue(value: string, timeZone: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) throw new Error("Enter a valid date and time.");
  const [, year, month, day, hour, minute] = match.map(Number);
  const civil = Date.UTC(year, month - 1, day, hour, minute);
  const valid = new Date(civil);
  if (
    valid.getUTCFullYear() !== year ||
    valid.getUTCMonth() + 1 !== month ||
    valid.getUTCDate() !== day ||
    valid.getUTCHours() !== hour ||
    valid.getUTCMinutes() !== minute
  ) throw new Error("Enter a valid date and time.");

  const offsetAt = (instant: number) => {
    const parts = zonedParts(new Date(instant), timeZone);
    return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute) - instant;
  };
  const offsets = new Set([
    offsetAt(civil - 36 * 60 * 60 * 1000),
    offsetAt(civil),
    offsetAt(civil + 36 * 60 * 60 * 1000),
  ]);
  const matches = [...offsets]
    .map((offset) => new Date(civil - offset))
    .filter((candidate) => {
      const parts = zonedParts(candidate, timeZone);
      return parts.year === year && parts.month === month && parts.day === day &&
        parts.hour === hour && parts.minute === minute;
    });
  if (matches.length === 0) throw new Error("This time does not exist in the Site time zone.");
  if (matches.length > 1) throw new Error("This time occurs twice in the Site time zone. Choose another time.");
  return matches[0];
}

/**
 * Parse a `date` input into an instant.
 *
 * A bare `YYYY-MM-DD` is read as UTC midnight so the API receives an
 * unambiguous instant; anything else is parsed as-is.
 */
export function fromDateInputValue(
  value: string | null | undefined,
): Date | null {
  if (!value) return null;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00Z`)
    : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** True when the instant has already passed. */
export function isPast(value: DateInput, now: DateInput = new Date()): boolean {
  const date = toDate(value);
  const base = toDate(now);
  if (!date || !base) return false;
  return date.getTime() < base.getTime();
}

export { toDate };
