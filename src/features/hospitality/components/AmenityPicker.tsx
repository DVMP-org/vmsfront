"use client";

import {
  Accessibility,
  Bath,
  BedDouble,
  ChefHat,
  ConciergeBell,
  ShieldCheck,
  Sparkles,
  Trees,
  Wifi,
  type LucideIcon,
} from "lucide-react";

import type { AmenityOption } from "../api";

/**
 * A pictogram per amenity group, so the list reads as "what kind of thing" at a
 * glance instead of eight identical rows of chips.
 *
 * Keyed by the server's group code, with a fallback: a group added to the
 * vocabulary on a deploy must still render here, just without its own icon.
 */
const GROUP_ICONS: Record<string, LucideIcon> = {
  comfort: BedDouble,
  connectivity: Wifi,
  kitchen: ChefHat,
  bathroom: Bath,
  outdoor: Trees,
  access: Accessibility,
  safety: ShieldCheck,
  services: ConciergeBell,
};

/**
 * The amenities a room has, chosen from the server's vocabulary.
 *
 * Chips rather than a multi-select: the whole catalogue is visible at once, so
 * nobody has to know what to search for, and the selected set reads back as a
 * summary the desk can scan.
 */
export function AmenityPicker({
  options,
  selected,
  onToggle,
  isLoading,
  isError,
}: {
  options: AmenityOption[];
  selected: string[];
  onToggle: (code: string) => void;
  isLoading: boolean;
  isError: boolean;
}) {
  if (isLoading) {
    return (
      <p className="text-xs text-[var(--vms-ink-muted)]">Loading amenities…</p>
    );
  }

  if (isError) {
    return (
      <p className="text-xs text-[var(--vms-danger)]">
        Amenities could not be loaded. The room can still be saved.
      </p>
    );
  }

  const groups = new Map<string, { label: string; items: AmenityOption[] }>();
  for (const option of options) {
    const entry = groups.get(option.group) ?? {
      label: option.group_label,
      items: [],
    };
    entry.items.push(option);
    groups.set(option.group, entry);
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-[var(--vms-ink-muted)]">
        {selected.length === 0
          ? "None chosen yet."
          : `${selected.length} chosen.`}
      </p>
      {[...groups.entries()].map(([key, group]) => {
        const Icon = GROUP_ICONS[key] ?? Sparkles;
        return (
          <div key={key} className="space-y-1.5">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--vms-ink-muted)]">
              <Icon aria-hidden="true" className="h-3.5 w-3.5" />
              {group.label}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {group.items.map((option) => {
                const active = selected.includes(option.code);
                return (
                  <button
                    key={option.code}
                    type="button"
                    aria-pressed={active}
                    onClick={() => onToggle(option.code)}
                    className={
                      "inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-accent)] " +
                      (active
                        ? "border-[var(--vms-accent)] bg-[var(--vms-accent)] text-white"
                        : "border-[var(--vms-border)] text-[var(--vms-ink-muted)] hover:border-[var(--vms-line-strong)] hover:text-[var(--vms-ink)]")
                    }
                  >
                    {active ? (
                      <span aria-hidden="true" className="text-[10px]">
                        ✓
                      </span>
                    ) : null}
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
