"use client";

import { useId } from "react";

export interface BookingDetailTab {
  key: string;
  label: string;
}

/**
 * The section switcher for a booking.
 *
 * A real tablist, not styled links: the arrow keys move between tabs, only the
 * selected tab is in the tab order, and `aria-controls` ties each tab to the
 * panel it opens. A row of buttons that looks like tabs but behaves like
 * nothing is the usual way this pattern goes wrong.
 */
export function BookingDetailTabs({
  tabs,
  active,
  onChange,
  label,
}: {
  tabs: readonly BookingDetailTab[];
  active: string;
  onChange: (key: string) => void;
  label: string;
}) {
  const id = useId().replace(/:/g, "");

  return (
    <div
      role="tablist"
      aria-label={label}
      className="flex overflow-x-auto border-b border-[var(--vms-line)] bg-[var(--vms-surface)]"
    >
      {tabs.map((tab, index) => {
        const selected = tab.key === active;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            id={`${id}-tab-${tab.key}`}
            aria-controls={`${id}-panel-${tab.key}`}
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.key)}
            onKeyDown={(event) => {
              let next = index;
              if (event.key === "ArrowRight") {
                next = (index + 1) % tabs.length;
              } else if (event.key === "ArrowLeft") {
                next = (index + tabs.length - 1) % tabs.length;
              } else if (event.key === "Home") {
                next = 0;
              } else if (event.key === "End") {
                next = tabs.length - 1;
              } else {
                return;
              }
              event.preventDefault();
              onChange(tabs[next].key);
              document.getElementById(`${id}-tab-${tabs[next].key}`)?.focus();
            }}
            className={`min-h-11 shrink-0 border-b-2 px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--vms-focus)] ${
              selected
                ? "border-[var(--vms-ink)] text-[var(--vms-ink)]"
                : "border-transparent text-[var(--vms-ink-muted)] hover:text-[var(--vms-ink)]"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
