/**
 * Pure helpers for the public booking flow.
 *
 * Kept out of the components so the date arithmetic can be tested without
 * rendering, and so the one place that decides when a stay starts and ends is a
 * function rather than four inline `new Date` calls.
 */

/** Check-in from 15:00, check-out by 11:00 — the times a hotel actually runs on. */
const CHECK_IN_HOUR = 15;
const CHECK_OUT_HOUR = 11;

function toLocalInput(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

/** A sensible default window: tomorrow for one night. */
export function defaultStayDates(now: Date = new Date()) {
  const start = new Date(now);
  start.setDate(start.getDate() + 1);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { checkIn: toLocalInput(start), checkOut: toLocalInput(end) };
}

/**
 * Turn two date-picker values into the timestamps the API takes.
 *
 * A date input carries no time, and a booking needs one: "1st June" is an
 * arrival at 15:00 and a departure at 11:00, not midnight to midnight. Doing it
 * here means a guest is never asked to reason about times.
 */
export function stayWindow(checkIn: string, checkOut: string) {
  const build = (value: string, hour: number) => {
    if (!value) return null;
    const parsed = new Date(`${value}T${String(hour).padStart(2, "0")}:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  };
  const checkInAt = build(checkIn, CHECK_IN_HOUR);
  const checkOutAt = build(checkOut, CHECK_OUT_HOUR);
  // A window is a pair. Half of one is not a short stay, it is an unanswerable
  // question, so neither half is offered on its own.
  if (checkInAt === null || checkOutAt === null) {
    return { checkInAt: null, checkOutAt: null };
  }
  return { checkInAt, checkOutAt };
}

/**
 * Nights between two date-picker values.
 *
 * Counted on the calendar dates, not the timestamps: a 15:00 arrival and an
 * 11:00 departure are one night, and subtracting the instants would say zero.
 */
export function nightsBetween(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  const start = Date.parse(`${checkIn}T00:00:00Z`);
  const end = Date.parse(`${checkOut}T00:00:00Z`);
  if (Number.isNaN(start) || Number.isNaN(end)) return 0;
  const nights = Math.round((end - start) / 86_400_000);
  return nights > 0 ? nights : 0;
}

/**
 * What a chosen category would cost, for display before the guest commits.
 *
 * This is an estimate and the screen says so. It is advertised rate against the
 * nights and rooms the guest just asked for; the figure that is charged comes
 * back from the server with the booking, because the server is the only place
 * that knows what the rooms actually cost.
 */
export function estimatedTotal(
  nightlyRate: string | null,
  nights: number,
  rooms: number,
): number | null {
  if (nightlyRate === null) return null;
  const rate = Number(nightlyRate);
  if (!Number.isFinite(rate) || nights <= 0 || rooms <= 0) return null;
  return rate * nights * rooms;
}

/** Whether a room category can be booked at all for the window. */
export function canBookCategory(category: {
  rooms_available: number;
  nightly_rate: string | null;
}): boolean {
  return category.rooms_available > 0 && category.nightly_rate !== null;
}
