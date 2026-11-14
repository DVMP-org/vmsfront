"use client";

import { PanelState } from "@/features/dashboard/DashboardPrimitives";
import { formatDateTime } from "@/lib/datetime";
import { humanize } from "@/lib/strings";
import type { BookingDetailDto } from "../../api-types";

/**
 * The append-only trail of what happened to this booking and who did it.
 *
 * Rendered newest-last so it reads as a story rather than a feed, and the event
 * type is humanised rather than shown as `room_assigned` — the machine value
 * belongs in the API, the sentence belongs on screen.
 */
export function BookingActivitySection({
  booking,
}: {
  booking: BookingDetailDto;
}) {
  if (booking.activities.length === 0) {
    return (
      <PanelState
        kind="empty"
        title="Nothing recorded yet"
        description="Decisions, cancellations and room assignments appear here as they happen."
      />
    );
  }

  return (
    <section aria-label="Activity">
      <ol className="flex flex-col gap-3">
        {booking.activities.map((activity) => (
          <li
            key={activity.id}
            className="flex flex-col gap-0.5 border-l-2 border-[var(--vms-line)] pl-3"
          >
            <span className="text-sm font-medium text-[var(--vms-ink)]">
              {humanize(activity.event_type)}
            </span>
            <span className="text-xs text-[var(--vms-ink-muted)]">
              {formatDateTime(activity.occurred_at)}
            </span>
            {activity.message ? (
              <p className="text-xs text-[var(--vms-ink)]">{activity.message}</p>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
