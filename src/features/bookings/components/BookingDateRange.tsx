import { CalendarClock } from "lucide-react";

import { formatBookingWindow } from "../lib";

/**
 * Atomic check-in/check-out window.
 *
 * Renders a single machine-readable time element with the humanised range, so
 * rows, cards and the detail drawer share one formatting path.
 */
export function BookingDateRange({
  from,
  to,
}: {
  from: string;
  to: string;
}) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5 whitespace-nowrap text-xs text-[var(--vms-ink-muted)]">
      <CalendarClock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <time dateTime={`${from}/${to}`}>{formatBookingWindow(from, to)}</time>
    </span>
  );
}
