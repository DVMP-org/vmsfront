"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { formatMoney } from "@/lib/currency";
import { humanize } from "@/lib/strings";
import { canBookCategory, estimatedTotal } from "../../public-lib";
import type { PublicRoomCategory } from "../../public-api-types";

const MAX_ROOMS_PER_BOOKING = 5;

/**
 * One category a guest can book.
 *
 * The room number never appears, because the hotel has not chosen it yet and a
 * guest who has never seen "Room 101" cannot be disappointed not to get it.
 *
 * The total is labelled an estimate on purpose: it is the advertised rate times
 * the nights and rooms asked for, and the figure that is actually charged comes
 * back from the server with the booking.
 */
export function PublicRoomCategoryCard({
  category,
  nights,
  onChoose,
}: {
  category: PublicRoomCategory;
  nights: number;
  onChoose: (rooms: number) => void;
}) {
  const [rooms, setRooms] = useState("1");

  const bookable = canBookCategory(category);
  const maxRooms = Math.min(category.rooms_available, MAX_ROOMS_PER_BOOKING);
  const chosen = Math.min(Math.max(1, Number(rooms) || 1), Math.max(1, maxRooms));
  const estimate = estimatedTotal(category.nightly_rate, nights, chosen);
  const shownAmenities = category.amenities.slice(0, 4);
  const extraAmenities = category.amenities.length - shownAmenities.length;

  return (
    <li className="flex flex-col gap-3 rounded-xl border border-[var(--vms-border)] bg-[var(--vms-surface)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-[var(--vms-ink)]">
            {category.name}
          </h3>
          {category.description ? (
            <p className="mt-1 text-sm text-[var(--vms-ink-muted)]">
              {category.description}
            </p>
          ) : null}
        </div>
        <div className="text-right">
          <p className="text-base font-semibold text-[var(--vms-ink)]">
            {category.nightly_rate && category.currency
              ? formatMoney(category.nightly_rate, category.currency)
              : "On request"}
            <span className="block text-xs font-normal text-[var(--vms-ink-muted)]">
              per night
            </span>
          </p>
        </div>
      </div>

      <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--vms-ink-muted)]">
        {category.capacity ? <li>Sleeps {category.capacity}</li> : null}
        {shownAmenities.map((code) => (
          <li key={code}>{humanize(code)}</li>
        ))}
        {extraAmenities > 0 ? <li>+{extraAmenities} more</li> : null}
      </ul>

      <p
        className={
          bookable
            ? "text-xs font-medium text-[var(--vms-ink)]"
            : "text-xs font-medium text-[var(--vms-danger)]"
        }
      >
        {bookable
          ? category.rooms_available === 1
            ? "Last room for these dates"
            : `${category.rooms_available} rooms left for these dates`
          : "No rooms of this type left for these dates"}
      </p>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-[var(--vms-ink)]">
          Rooms
          <select
            className="min-h-11 rounded-lg border border-[var(--vms-border)] bg-[var(--vms-surface)] px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-accent)]"
            value={String(chosen)}
            disabled={!bookable}
            onChange={(event) => setRooms(event.currentTarget.value)}
            aria-label={`Rooms of ${category.name}`}
          >
            {Array.from({ length: Math.max(1, maxRooms) }, (_, index) => index + 1).map(
              (count) => (
                <option key={count} value={String(count)}>
                  {count}
                </option>
              ),
            )}
          </select>
        </label>

        <div className="flex flex-col items-end gap-1">
          {estimate !== null ? (
            <span className="text-xs text-[var(--vms-ink-muted)]">
              Estimated{" "}
              <strong className="font-semibold text-[var(--vms-ink)]">
                {formatMoney(estimate, category.currency ?? undefined)}
              </strong>{" "}
              for {nights} {nights === 1 ? "night" : "nights"}
            </span>
          ) : null}
          <Button
            type="button"
            disabled={!bookable}
            onClick={() => onChoose(chosen)}
            aria-label={
              bookable
                ? `Select ${category.name}`
                : `${category.name} is not available`
            }
          >
            Select
          </Button>
        </div>
      </div>
    </li>
  );
}
