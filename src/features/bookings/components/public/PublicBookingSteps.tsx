"use client";

const STEPS = [
  "Search",
  "Choose room",
  "Guest details",
  "Review",
  "Pay",
] as const;

/**
 * Where the guest is in the booking flow.
 *
 * Numbered circles rather than a breadcrumb: the flow is short and sequential, so
 * the position should be readable at a glance rather than parsed. Completed steps
 * stay visible so a guest sent back to change something can see they are not
 * starting over.
 */
export function PublicBookingSteps({ current }: { current: number }) {
  return (
    <ol
      aria-label="Booking steps"
      className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs"
    >
      {STEPS.map((label, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li key={label} className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className={
                "grid h-6 w-6 place-items-center rounded-full text-[11px] font-semibold tabular-nums " +
                (active
                  ? "bg-[var(--vms-accent)] text-white"
                  : done
                    ? "bg-[var(--vms-success)] text-white"
                    : "bg-[var(--vms-surface-muted)] text-[var(--vms-ink-muted)] ring-1 ring-inset ring-[var(--vms-line)]")
              }
            >
              {done ? "✓" : index + 1}
            </span>
            <span
              aria-current={active ? "step" : undefined}
              className={
                active
                  ? "font-semibold text-[var(--vms-ink)]"
                  : "text-[var(--vms-ink-muted)]"
              }
            >
              {label}
            </span>
            {index < STEPS.length - 1 ? (
              <span aria-hidden="true" className="text-[var(--vms-line-strong)]">
                —
              </span>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
