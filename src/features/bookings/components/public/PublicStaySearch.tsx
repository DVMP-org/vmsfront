"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { nightsBetween } from "../../public-lib";

/**
 * Screen 1: when the guest wants to come.
 *
 * Dates only — no times. A date input is what a person can answer confidently,
 * and the arrival and departure times are a property of the property, applied in
 * `stayWindow`.
 *
 * Searching is explicit rather than live: availability is a dated question and
 * asking it on every keystroke would send a request per character.
 */
export function PublicStaySearch({
  checkIn,
  checkOut,
  guests,
  onChange,
  onSearch,
  isSearching,
  error,
}: {
  checkIn: string;
  checkOut: string;
  guests: string;
  onChange: (field: "checkIn" | "checkOut" | "guests", value: string) => void;
  onSearch: () => void;
  isSearching: boolean;
  error: string | null;
}) {
  const nights = nightsBetween(checkIn, checkOut);
  const backwards = checkIn !== "" && checkOut !== "" && nights === 0;
  const canSearch = nights > 0 && Number(guests) >= 1 && !isSearching;

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (canSearch) onSearch();
      }}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Input
          label="Check-in"
          name="check_in"
          type="date"
          required
          value={checkIn}
          onChange={(event) => onChange("checkIn", event.currentTarget.value)}
        />
        <Input
          label="Check-out"
          name="check_out"
          type="date"
          required
          value={checkOut}
          onChange={(event) => onChange("checkOut", event.currentTarget.value)}
        />
        <Input
          label="Guests"
          name="guests"
          type="number"
          min={1}
          max={50}
          required
          value={guests}
          onChange={(event) => onChange("guests", event.currentTarget.value)}
        />
      </div>

      <p className="text-xs text-[var(--vms-ink-muted)]" role="status">
        {backwards
          ? "Check-out has to be after check-in."
          : nights > 0
            ? `${nights} night${nights === 1 ? "" : "s"}`
            : "Choose your dates."}
      </p>

      {error ? (
        <p role="alert" className="text-xs font-medium text-[var(--vms-danger)]">
          {error}
        </p>
      ) : null}

      <div>
        <Button type="submit" disabled={!canSearch} isLoading={isSearching}>
          Search rooms
        </Button>
      </div>
    </form>
  );
}
