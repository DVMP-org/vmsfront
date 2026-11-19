"use client";

import { useState } from "react";
import Image from "next/image";

import { Button } from "@/components/ui/Button";
import { formatMoney } from "@/lib/currency";
import { humanize } from "@/lib/strings";
import { canBookCategory, estimateFromRates } from "../../public-lib";
import type { PublicRoomCategory } from "../../public-api-types";

const MAX_ROOMS_PER_BOOKING = 10;

/**
 * One category a guest can book, laid out like a search result.
 *
 * The room number never appears, because the hotel has not chosen it yet and a
 * guest who has never seen "Room 101" cannot be disappointed not to get it. What
 * the guest compares is the type, what it has, and what is left.
 *
 * There is a media panel on the left rather than a photograph: the amenity
 * vocabulary carries no images, and a stock photo of somebody else's hotel is
 * worse than an honest placeholder.
 *
 * The total is labelled an estimate on purpose — it is the advertised rate times
 * the nights and rooms asked for, and the figure actually charged comes back from
 * the server with the booking.
 */
export function PublicRoomCategoryCard({
  category,
  demoImage,
  nights,
  minimumRooms,
  onChoose,
}: {
  category: PublicRoomCategory;
  demoImage: string;
  nights: number;
  minimumRooms: number;
  onChoose: (rooms: number) => void;
}) {
  const [rooms, setRooms] = useState("1");

  const bookable =
    canBookCategory(category) && category.rooms_available >= minimumRooms;
  const maxRooms = Math.min(category.rooms_available, MAX_ROOMS_PER_BOOKING);
  const chosen = Math.min(
    Math.max(minimumRooms, Number(rooms) || minimumRooms),
    Math.max(minimumRooms, maxRooms),
  );
  const estimate = estimateFromRates(category.rates, nights, chosen);
  // More than one rate means the cheapest room is a starting price, not the
  // price of the room this guest will actually get.
  const shownAmenities = category.amenities.slice(0, 4);
  const extraAmenities = category.amenities.length - shownAmenities.length;

  return (
    <li
      className={
        "overflow-hidden rounded-xl border bg-[var(--vms-surface)] transition " +
        (bookable
          ? "border-[var(--vms-border)]"
          : "border-[var(--vms-line)] opacity-75")
      }
    >
      <div className="grid sm:grid-cols-[11rem_minmax(0,1fr)]">
        <div className="relative h-32 overflow-hidden bg-[var(--vms-surface-muted)] sm:h-44">
          <Image
            src={demoImage}
            alt="Illustrative room interior"
            fill
            unoptimized
            sizes="(max-width: 640px) 100vw, 224px"
            className="object-cover"
          />
          <span className="absolute bottom-2 left-2 rounded bg-black/70 px-2 py-1 text-[10px] font-medium text-white">
            Demo photo
          </span>
        </div>

        <div className="flex min-h-[11rem] min-w-0 flex-col gap-1 p-3">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <h3 className="line-clamp-1 text-base font-semibold text-[var(--vms-ink)]">
              {category.name}
            </h3>
            <p className="shrink-0 text-right text-sm font-semibold text-[var(--vms-ink)]">
              {category.nightly_rate && category.currency
                ? formatMoney(category.nightly_rate, category.currency)
                : "On request"}
              <span className="ml-1 text-[10px] font-normal text-[var(--vms-ink-muted)]">
                / night
              </span>
            </p>
          </div>

          {category.description ? (
            <p className="h-4 truncate text-xs leading-4 text-[var(--vms-ink-muted)]">
              {category.description}
            </p>
          ) : (
            <p className="h-4" aria-hidden="true" />
          )}

          <ul className="flex h-4 flex-nowrap items-center gap-x-3 overflow-hidden whitespace-nowrap text-ellipsis text-[11px] text-[var(--vms-ink-muted)]">
            {category.capacity ? <li>Sleeps {category.capacity}</li> : null}
            {shownAmenities.map((code) => (
              <li key={code}>{humanize(code)}</li>
            ))}
            {extraAmenities > 0 ? <li>+{extraAmenities} more</li> : null}
          </ul>

          <p
            className={
              bookable
                ? "h-4 truncate text-[11px] font-medium text-[var(--vms-ink)]"
                : "h-4 truncate text-[11px] font-medium text-[var(--vms-danger)]"
            }
          >
            {bookable
              ? category.rooms_available === 1
                ? "Last room for these dates"
                : `${category.rooms_available} rooms left for these dates`
              : category.rooms_available > 0
                ? `Only ${category.rooms_available} rooms left; your search needs ${minimumRooms}`
                : "No rooms of this type left for these dates"}
          </p>

          <div className="mt-1 flex items-end justify-between gap-2">
            <label className="flex shrink-0 items-center gap-2 text-[11px] font-medium text-[var(--vms-ink)]">
              Rooms
              <select
                className="h-8 min-w-14 rounded-md border border-[var(--vms-border)] bg-[var(--vms-surface)] px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-accent)]"
                value={String(chosen)}
                disabled={!bookable}
                onChange={(event) => setRooms(event.currentTarget.value)}
                aria-label={`Rooms of ${category.name}`}
              >
                {Array.from(
                  { length: Math.max(0, maxRooms - minimumRooms + 1) },
                  (_, index) => index + minimumRooms,
                ).map((count) => (
                  <option key={count} value={String(count)}>
                    {count}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex min-w-0 items-end justify-end gap-2">
              {estimate !== null ? (
                <span className="hidden truncate text-right text-[11px] text-[var(--vms-ink-muted)] md:block">
                  Est.{" "}
                  <strong className="font-semibold text-[var(--vms-ink)]">
                    {formatMoney(estimate, category.currency ?? undefined)}
                  </strong>{" "}
                  / {nights}n{chosen > 1 ? ` · ${chosen} rooms` : ""}
                </span>
              ) : null}
              <Button
                type="button"
                size="sm"
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
        </div>
      </div>
    </li>
  );
}
