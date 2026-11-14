"use client";

const STEPS = ["Dates", "Room", "Details", "Review"] as const;

/**
 * Where the guest is in the booking flow.
 *
 * A numbered list rather than bare text, so the position is announced: "Dates,
 * step 1 of 4". The completed steps are marked so a guest who has been sent back
 * to change something can see they are not starting over.
 */
export function PublicBookingSteps({ current }: { current: number }) {
  return (
    <ol
      aria-label="Booking steps"
      className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs"
    >
      {STEPS.map((label, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li key={label} className="flex items-center gap-2">
            <span
              aria-current={active ? "step" : undefined}
              className={
                active
                  ? "font-semibold text-[var(--vms-ink)]"
                  : done
                    ? "text-[var(--vms-ink-muted)]"
                    : "text-[var(--vms-ink-muted)] opacity-70"
              }
            >
              <span className="tabular-nums">{index + 1}.</span> {label}
            </span>
            {index < STEPS.length - 1 ? (
              <span aria-hidden="true" className="text-[var(--vms-ink-muted)]">
                ·
              </span>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
