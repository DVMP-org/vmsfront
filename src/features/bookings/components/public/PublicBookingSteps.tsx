"use client";

const STEPS = [
  "Search",
  "Choose room",
  "Guest details",
  "Review",
  "Payment",
  "Confirmation",
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
    <>
      <div
        role="progressbar"
        aria-label="Booking progress"
        aria-valuemin={1}
        aria-valuemax={STEPS.length}
        aria-valuenow={current + 1}
        aria-valuetext={`Step ${current + 1} of ${STEPS.length}: ${STEPS[current]}`}
        className="flex flex-col gap-2 lg:hidden"
      >
        <div className="flex items-baseline justify-between gap-3 text-xs">
          <span className="text-[var(--vms-ink-muted)]">
            Step {current + 1} of {STEPS.length}
          </span>
          <span className="font-semibold text-[var(--vms-ink)]">
            {STEPS[current]}
          </span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-[var(--vms-line)]">
          <div
            className="h-full rounded-full bg-[var(--vms-accent)] transition-[width] duration-300 motion-reduce:transition-none"
            style={{ width: `${((current + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>
      <ol
        aria-label="Booking steps"
        className="hidden w-full grid-cols-6 lg:grid"
      >
        {STEPS.map((label, index) => {
          const done = index < current;
          const active = index === current;
          return (
            <li
              key={label}
              className="relative flex min-w-0 flex-col items-center gap-2 text-center"
            >
              {index < STEPS.length - 1 ? (
                <span
                  aria-hidden="true"
                  className="absolute left-1/2 top-3 h-px w-full bg-[var(--vms-line)]"
                >
                  <span
                    className={
                      "block h-full transition-[width] duration-300 motion-reduce:transition-none " +
                      (done
                        ? "w-full bg-[var(--vms-accent)]"
                        : "w-0 bg-[var(--vms-accent)]")
                    }
                  />
                </span>
              ) : null}
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
                <span
                  aria-hidden="true"
                  className="text-[var(--vms-line-strong)]"
                >
                  —
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </>
  );
}
