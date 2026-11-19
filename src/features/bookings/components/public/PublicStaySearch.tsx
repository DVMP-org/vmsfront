"use client";

import { CalendarDays, Search } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { nightsBetween } from "../../public-lib";

/** Compact, persistent search strip for the public hotel page. */
export function PublicStaySearch({
  checkIn,
  checkOut,
  rooms,
  onChange,
  onSearch,
  isSearching,
  searched,
  error,
}: {
  checkIn: string;
  checkOut: string;
  rooms: string;
  onChange: (field: "checkIn" | "checkOut" | "rooms", value: string) => void;
  onSearch: () => void;
  isSearching: boolean;
  searched: boolean;
  error: string | null;
}) {
  const nights = nightsBetween(checkIn, checkOut);
  const backwards = checkIn !== "" && checkOut !== "" && nights === 0;
  const canSearch =
    nights > 0 && Number(rooms) >= 1 && Number(rooms) <= 10 && !isSearching;

  return (
    <form
      className="rounded-xl border border-[var(--vms-line)] bg-[var(--vms-surface)] p-3 shadow-[0_8px_28px_rgb(24_32_38_/_0.12)] sm:p-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (canSearch) onSearch();
      }}
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-[1fr_1fr_0.65fr_auto] sm:items-end">
        <label className="block min-w-0 text-xs font-medium text-[var(--vms-ink)]">
          <span className="mb-1 block">Check-in</span>
          <input
            className="h-10 w-full rounded-md border border-[var(--vms-line-strong)] bg-[var(--vms-surface)] px-3 text-sm"
            name="check_in"
            type="date"
            min={new Date().toLocaleDateString("en-CA")}
            required
            value={checkIn}
            onChange={(event) => onChange("checkIn", event.currentTarget.value)}
          />
        </label>
        <label className="block min-w-0 text-xs font-medium text-[var(--vms-ink)]">
          <span className="mb-1 block">Check-out</span>
          <input
            className="h-10 w-full rounded-md border border-[var(--vms-line-strong)] bg-[var(--vms-surface)] px-3 text-sm"
            name="check_out"
            type="date"
            min={checkIn}
            required
            value={checkOut}
            onChange={(event) =>
              onChange("checkOut", event.currentTarget.value)
            }
          />
        </label>
        <label className="block min-w-0 text-xs font-medium text-[var(--vms-ink)]">
          <span className="mb-1 block">Rooms</span>
          <input
            className="h-10 w-full rounded-md border border-[var(--vms-line-strong)] bg-[var(--vms-surface)] px-3 text-sm"
            name="rooms"
            type="number"
            min={1}
            max={10}
            required
            value={rooms}
            onChange={(event) => onChange("rooms", event.currentTarget.value)}
          />
        </label>
        <Button
          type="submit"
          disabled={!canSearch}
          isLoading={isSearching}
          className="min-h-11 w-full sm:w-auto sm:min-w-44"
        >
          {isSearching
            ? "Checking rooms"
            : searched
              ? "Update search"
              : "Search availability"}
          {!isSearching ? (
            <Search aria-hidden="true" className="ml-2 size-4" />
          ) : null}
        </Button>
      </div>
      <div className="mt-3 flex min-h-5 items-center justify-between gap-3 border-t border-[var(--vms-line)] pt-3">
        <p
          className="flex items-center gap-2 text-xs text-[var(--vms-ink-muted)]"
          role="status"
        >
          <CalendarDays aria-hidden="true" className="size-4" />
          {backwards
            ? "Check-out must be after check-in."
            : nights > 0
              ? `${nights} ${nights === 1 ? "night" : "nights"} · ${rooms} ${Number(rooms) === 1 ? "room" : "rooms"}`
              : "Choose your dates to see availability."}
        </p>
        {error ? (
          <p
            role="alert"
            className="text-xs font-medium text-[var(--vms-danger)]"
          >
            {error}
          </p>
        ) : null}
      </div>
    </form>
  );
}
