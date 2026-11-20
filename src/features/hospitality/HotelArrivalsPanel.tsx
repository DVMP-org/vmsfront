"use client";

import { ArrowRight } from "lucide-react";

import {
  PanelState,
  ReportPanel,
  SeeAllLink,
} from "@/features/dashboard/DashboardPrimitives";
import { formatDateTime } from "@/lib/datetime";

import { guestName, type Stay } from "./contracts";

export function HotelArrivalsPanel({
  siteTimezone,
  stays,
  isLoading,
  error,
  onRetry,
  onOpenStay,
  authorityMode,
  authoritativeSiteName,
}: {
  siteTimezone?: string | null;
  stays: Stay[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onOpenStay: (id: string) => void;
  authorityMode?: "local" | "inherited" | "none";
  authoritativeSiteName?: string | null;
}) {
  const arrivals = [...stays]
    .filter((stay) => stay.status === "reserved")
    .sort(
      (left, right) =>
        new Date(left.planned_check_in).getTime() -
        new Date(right.planned_check_in).getTime(),
    )
    .slice(0, 5);

  return (
    <ReportPanel
      title="Reserved stays"
      description="The next arrivals in the loaded reservation queue."
      action={<SeeAllLink href="#stays">View stays</SeeAllLink>}
      footer={
        authorityMode === "inherited" && authoritativeSiteName
          ? `Site management is inherited from ${authoritativeSiteName}.`
          : undefined
      }
    >
      {isLoading ? (
        <PanelState
          compact
          kind="loading"
          title="Loading reserved stays"
          description="Checking the current arrival queue."
        />
      ) : error ? (
        <PanelState
          compact
          kind="error"
          title="Reserved stays are unavailable"
          description={error}
          onRetry={onRetry}
        />
      ) : arrivals.length ? (
        <ul className="divide-y divide-[var(--vms-line)]">
          {arrivals.map((stay) => (
            <li key={stay.id}>
              <button
                type="button"
                onClick={() => onOpenStay(stay.id)}
                className="flex min-h-14 w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-[var(--vms-surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--vms-focus)] sm:px-5"
              >
                <span className="min-w-0">
                  <strong className="block truncate text-sm font-semibold text-[var(--vms-ink)]">
                    {guestName(stay)}
                  </strong>
                  <span className="mt-0.5 block text-xs text-[var(--vms-ink-muted)]">
                    {formatDateTime(stay.planned_check_in, siteTimezone)}
                    {" · "}
                    {stay.room_assignments.at(-1)?.room.name ||
                      "Room unassigned"}
                  </span>
                </span>
                <ArrowRight
                  className="h-4 w-4 shrink-0 text-[var(--vms-ink-muted)]"
                  aria-hidden="true"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-4 py-4 text-sm text-[var(--vms-ink-muted)] sm:px-5">
          No reserved stays are waiting for arrival review.
        </p>
      )}
    </ReportPanel>
  );
}
