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
export function formatDate(value: DateInput): string {
  const date = toDate(value);
  if (!date) return EMPTY;
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** `November 2026` */
export function formatMonthYear(value: DateInput): string {
  const date = toDate(value);
  if (!date) return EMPTY;
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

/** `4 Nov 2026, 14:30` */
export function formatDateTime(value: DateInput): string {
  const date = toDate(value);
  if (!date) return EMPTY;
  return date.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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
    if (Math.abs(duration) < size) return relative.format(Math.round(duration), unit);
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

/**
 * Parse a `date` input into an instant.
 *
 * A bare `YYYY-MM-DD` is read as UTC midnight so the API receives an
 * unambiguous instant; anything else is parsed as-is.
 */
export function fromDateInputValue(value: string | null | undefined): Date | null {
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
