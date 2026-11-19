"use client";

import { Button } from "@/components/ui/Button";
import { PanelState } from "@/features/dashboard/DashboardPrimitives";
import { PublicRoomCategoryCard } from "./PublicRoomCategoryCard";
import type { PublicRoomCategory } from "../../public-api-types";

/**
 * Screen 2: what the Site can sell for the dates the guest chose.
 *
 * Categories, not rooms. An empty result is a real answer — the property is full
 * — so it is said plainly rather than dressed up as a loading state.
 */
export function PublicCategoryChooser({
  categories,
  nights,
  isLoading,
  error,
  onChoose,
  minimumRooms,
  onRetry,
}: {
  categories: PublicRoomCategory[];
  nights: number;
  isLoading: boolean;
  error: string | null;
  onChoose: (category: PublicRoomCategory, rooms: number) => void;
  minimumRooms: number;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="font-serif text-2xl text-[var(--vms-ink)]">
          Choose your room
        </h3>
        <p className="mt-1 text-sm text-[var(--vms-ink-muted)]">
          Available categories for your dates. The property assigns the
          individual room.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-[var(--vms-ink-muted)]">
          {nights} {nights === 1 ? "night" : "nights"} · Rooms are assigned by
          the property after booking.
        </p>
        {categories.length > 0 && !isLoading && !error ? (
          <p className="text-xs text-[var(--vms-ink-muted)]">
            {categories.length}{" "}
            {categories.length === 1 ? "category" : "categories"} available
          </p>
        ) : null}
      </div>

      {isLoading ? (
        <div
          role="status"
          aria-live="polite"
          aria-label="Checking room availability"
          className="flex flex-col gap-3"
        >
          <p className="flex items-center gap-2 text-sm font-medium text-[var(--vms-ink-muted)]">
            <span className="size-2 animate-pulse rounded-full bg-[var(--vms-accent)] motion-reduce:animate-none" />
            Checking availability for your dates
          </p>
          {[0, 1].map((item) => (
            <div
              key={item}
              className="grid animate-pulse grid-cols-1 overflow-hidden rounded-lg border border-[var(--vms-line)] bg-[var(--vms-surface)] sm:grid-cols-[11rem_1fr] motion-reduce:animate-none"
            >
              <div className="h-32 bg-[var(--vms-surface-muted)] sm:h-44" />
              <div className="flex min-h-[11rem] flex-col justify-between space-y-2 p-3">
                <div className="h-5 w-2/5 rounded bg-[var(--vms-surface-muted)]" />
                <div className="h-3 w-4/5 rounded bg-[var(--vms-surface-muted)]" />
                <div className="h-3 w-2/3 rounded bg-[var(--vms-surface-muted)]" />
                <div className="flex justify-between pt-2">
                  <div className="h-8 w-20 rounded bg-[var(--vms-surface-muted)]" />
                  <div className="h-10 w-28 rounded bg-[var(--vms-surface-muted)]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div
          role="alert"
          className="rounded-lg border border-[var(--vms-danger)] bg-[var(--vms-surface)] p-5"
        >
          <h4 className="font-semibold">Availability could not be checked</h4>
          <p className="mt-1 text-sm text-[var(--vms-ink-muted)]">{error}</p>
          <Button type="button" className="mt-4" onClick={onRetry}>
            Try again
          </Button>
        </div>
      ) : categories.length === 0 ? (
        <PanelState
          kind="empty"
          title="Nothing available for those dates"
          description="Try a different window, or shorter stay."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {categories.map((category, index) => (
            <PublicRoomCategoryCard
              key={category.id}
              category={category}
              demoImage={
                index % 2 === 0
                  ? "/images/hospitality/room-demo.webp"
                  : "/images/hospitality/suite-demo.webp"
              }
              nights={nights}
              minimumRooms={minimumRooms}
              onChoose={(rooms) => onChoose(category, rooms)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
