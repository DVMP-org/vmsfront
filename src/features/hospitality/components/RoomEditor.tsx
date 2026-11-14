"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";

import { Button } from "@/components/ui/Button";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { Input } from "@/components/ui/Input";
import { SlideOver } from "@/components/ui/SlideOver";
import { formatMoney } from "@/lib/currency";
import { parseApiError } from "@/lib/error-utils";
import { hospitalityApi } from "../api";
import { useHospitalityAmenities } from "../queries";
import type { HospitalityRoom, RoomOperationalStatus } from "../contracts";

const roomStatusOptions: Array<{ value: RoomOperationalStatus; label: string }> =
  [
    { value: "available", label: "Available" },
    { value: "reserved", label: "Reserved" },
    { value: "occupied", label: "Occupied" },
    { value: "cleaning", label: "Cleaning" },
    { value: "out_of_service", label: "Out of service" },
  ];

const CURRENCIES = ["USD", "EUR", "GBP", "NGN", "KES", "ZAR", "AED"];

const emptyRoom = {
  name: "",
  room_number: "",
  room_type: "",
  floor: "",
  capacity: "2",
  base_rate: "",
  currency: "USD",
};

/**
 * Add or edit one sellable room.
 *
 * **The bug this form had.** Every `onChange` read `event.currentTarget.value`
 * *inside* a `setValues` updater. React defers updater functions, and by the time
 * it ran the event's `currentTarget` had already been cleared, so the first
 * keystroke threw `Cannot read properties of null (reading 'value')` and the form
 * was unusable. Values are now read from the event immediately and only then
 * handed to the updater — the DOM node is never touched after dispatch.
 *
 * Three things the form makes explicit, because the room is the thing that gets
 * sold:
 * - the nightly rate is what the public page charges, so it is shown with a
 *   sample total rather than as a bare number;
 * - amenities are chosen from the server's vocabulary, which is the same list the
 *   server validates against;
 * - a room with no rate is legitimate (it is just not sellable yet), so zero is
 *   allowed and does not read as free.
 */
export function RoomEditor({
  open,
  room,
  canEdit,
  onClose,
  onSaved,
}: {
  open: boolean;
  room: HospitalityRoom | null;
  canEdit: boolean;
  onClose: () => void;
  onSaved: (message: string) => Promise<void>;
}) {
type RoomValues = {
  name: string;
  room_number: string;
  room_type: string;
  floor: string;
  capacity: string;
  base_rate: string;
  currency: string;
  status: RoomOperationalStatus;
  amenities: string[];
};

  const [values, setValues] = useState<RoomValues>(() =>
    room
      ? {
          name: room.name,
          room_number: room.room_number,
          room_type: room.room_type,
          floor: room.floor || "",
          capacity: String(room.capacity),
          base_rate: room.base_rate,
          currency: room.currency,
          status: room.status,
          amenities: room.amenities ?? [],
        }
      : {
          ...emptyRoom,
          status: "available" as RoomOperationalStatus,
          amenities: [] as string[],
        },
  );
  const amenities = useHospitalityAmenities();

  const mutation = useMutation({
    mutationFn: async () => {
      const capacity = Number(values.capacity);
      const baseRate = Number(values.base_rate === "" ? "0" : values.base_rate);
      if (!values.name.trim() || !values.room_number.trim()) {
        throw new Error("Room name and room number are required.");
      }
      if (!values.room_type.trim()) throw new Error("Room type is required.");
      if (!Number.isInteger(capacity) || capacity < 1) {
        throw new Error("Capacity must be a whole number of at least 1.");
      }
      if (!Number.isFinite(baseRate) || baseRate < 0) {
        throw new Error("Nightly rate must be zero or greater.");
      }
      if (!/^[A-Z]{3}$/.test(values.currency)) {
        throw new Error("Use a three-letter ISO currency code.");
      }
      const body = {
        name: values.name.trim(),
        room_number: values.room_number.trim(),
        room_type: values.room_type.trim(),
        floor: values.floor.trim() || null,
        capacity,
        base_rate: baseRate.toFixed(2),
        currency: values.currency,
        amenities: values.amenities,
      };
      return room
        ? hospitalityApi.rooms.update(room.id, {
            ...body,
            status: values.status,
          })
        : hospitalityApi.rooms.create(body);
    },
    onSuccess: () => void onSaved(room ? "Room updated." : "Room added."),
  });

  /** Read the value before React defers anything — this is the whole fix. */
  function onField(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = event.currentTarget;
    const next = name === "currency" ? value.toUpperCase() : value;
    setValues((current) => ({ ...current, [name]: next }) as RoomValues);
  }

  function toggleAmenity(code: string) {
    setValues((current) => ({
      ...current,
      amenities: current.amenities.includes(code)
        ? current.amenities.filter((item) => item !== code)
        : [...current.amenities, code],
    }));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate();
  }

  const grouped = useMemo(() => {
    const options = amenities.data ?? [];
    const groups = new Map<string, { label: string; items: typeof options }>();
    for (const option of options) {
      const entry = groups.get(option.group) ?? {
        label: option.group_label,
        items: [] as typeof options,
      };
      entry.items.push(option);
      groups.set(option.group, entry);
    }
    return [...groups.values()];
  }, [amenities.data]);

  const rate = Number(values.base_rate === "" ? "0" : values.base_rate);
  const sampleTotal = Number.isFinite(rate) ? rate * 3 : 0;

  return (
    <SlideOver
      isOpen={open}
      onClose={onClose}
      title={room ? "Edit room" : "Add room"}
      description="These details feed reservations, availability and housekeeping."
    >
      <form onSubmit={submit} className="space-y-6">
        {!canEdit ? (
          <InlineAlert tone="warning">
            You can review this form but do not have permission to save it.
          </InlineAlert>
        ) : null}

        <fieldset className="space-y-4">
          <legend className="text-xs font-semibold uppercase tracking-wide text-[var(--vms-ink-muted)]">
            The room
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Room name"
              name="name"
              required
              value={values.name}
              onChange={onField}
            />
            <Input
              label="Room number"
              name="room_number"
              required
              value={values.room_number}
              onChange={onField}
            />
            <Input
              label="Room type"
              name="room_type"
              required
              placeholder="Suite, king, twin…"
              description="The category guests are sold before a room is assigned."
              value={values.room_type}
              onChange={onField}
            />
            <Input
              label="Floor"
              name="floor"
              value={values.floor}
              onChange={onField}
            />
            <Input
              label="Capacity"
              name="capacity"
              type="number"
              min={1}
              max={50}
              required
              value={values.capacity}
              onChange={onField}
            />
            {room ? (
              <label className="space-y-1.5 text-sm font-medium">
                <span>Operational status</span>
                <select
                  name="status"
                  className="h-[var(--vms-control-height)] w-full rounded-[var(--vms-radius-control)] border border-[var(--vms-line-strong)] bg-[var(--vms-surface)] px-3 text-base capitalize sm:text-sm"
                  value={values.status}
                  onChange={onField}
                >
                  {roomStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-xs font-semibold uppercase tracking-wide text-[var(--vms-ink-muted)]">
            What it costs
          </legend>
          <p className="text-xs text-[var(--vms-ink-muted)]">
            The nightly rate is what the public booking page charges. A rate of
            zero means the room is not sellable yet.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Nightly rate"
              name="base_rate"
              type="number"
              min={0}
              step="0.01"
              required
              value={values.base_rate}
              onChange={onField}
            />
            <label className="space-y-1.5 text-sm font-medium">
              <span>Currency</span>
              <select
                name="currency"
                className="h-[var(--vms-control-height)] w-full rounded-[var(--vms-radius-control)] border border-[var(--vms-line-strong)] bg-[var(--vms-surface)] px-3 text-base sm:text-sm"
                value={values.currency}
                onChange={onField}
              >
                {CURRENCIES.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {rate > 0 ? (
            <p className="text-xs text-[var(--vms-ink-muted)]">
              A three-night stay would be{" "}
              <strong className="text-[var(--vms-ink)]">
                {formatMoney(sampleTotal, values.currency)}
              </strong>
              .
            </p>
          ) : null}
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-xs font-semibold uppercase tracking-wide text-[var(--vms-ink-muted)]">
            What it has
          </legend>
          {amenities.isPending ? (
            <p className="text-xs text-[var(--vms-ink-muted)]">
              Loading amenities…
            </p>
          ) : amenities.isError ? (
            <InlineAlert tone="warning">
              Amenities could not be loaded. You can still save the room.
            </InlineAlert>
          ) : (
            <div className="space-y-3">
              {grouped.map((group) => (
                <div key={group.label} className="space-y-1">
                  <p className="text-[10px] uppercase tracking-wide text-[var(--vms-ink-muted)]">
                    {group.label}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {group.items.map((option) => {
                      const active = values.amenities.includes(option.code);
                      return (
                        <button
                          key={option.code}
                          type="button"
                          aria-pressed={active}
                          onClick={() => toggleAmenity(option.code)}
                          className={
                            "min-h-11 rounded-lg border px-3 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-accent)] " +
                            (active
                              ? "border-[var(--vms-accent)] bg-[var(--vms-surface-muted)] text-[var(--vms-ink)]"
                              : "border-[var(--vms-border)] text-[var(--vms-ink-muted)] hover:bg-[var(--vms-surface-muted)]")
                          }
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </fieldset>

        {mutation.isError ? (
          <InlineAlert tone="danger" title="Room was not saved">
            {parseApiError(mutation.error).message}
          </InlineAlert>
        ) : null}

        <div className="flex flex-col-reverse gap-2 border-t border-[var(--vms-line)] pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!canEdit}
            isLoading={mutation.isPending}
          >
            {room ? "Save room" : "Add room"}
          </Button>
        </div>
      </form>
    </SlideOver>
  );
}
