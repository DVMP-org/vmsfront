"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { Input } from "@/components/ui/Input";
import { SlideOver } from "@/components/ui/SlideOver";
import { DEFAULT_CURRENCY, formatMoney } from "@/lib/currency";
import { parseApiError } from "@/lib/error-utils";
import { AttachmentManager } from "@/features/files/components/AttachmentManager";
import { useAppStore } from "@/store/app-store";
import { hospitalityApi } from "../api";
import { useHospitalityAmenities, useRoomCategories } from "../queries";
import type { HospitalityRoom, RoomOperationalStatus } from "../contracts";
import { AmenityPicker } from "./AmenityPicker";
import { RoomCategoryField } from "./RoomCategoryField";
import { RoomDetailsPanel } from "./RoomDetailsPanel";

const roomStatusOptions: Array<{
  value: RoomOperationalStatus;
  label: string;
}> = [
  { value: "available", label: "Available" },
  { value: "reserved", label: "Reserved" },
  { value: "occupied", label: "Occupied" },
  { value: "cleaning", label: "Cleaning" },
  { value: "out_of_service", label: "Out of service" },
];

const CURRENCIES = ["NGN", "USD", "EUR", "GBP", "KES", "ZAR", "AED"];

const emptyRoom = {
  name: "",
  room_number: "",
  place_group_id: "",
  floor: "",
  capacity: "2",
  base_rate: "",
  currency: DEFAULT_CURRENCY,
};

type RoomValues = {
  name: string;
  room_number: string;
  place_group_id: string;
  floor: string;
  capacity: string;
  base_rate: string;
  currency: string;
  status: RoomOperationalStatus;
  amenities: string[];
};

/** A titled section, so the drawer reads as three short questions, not one list. */
function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="space-y-3 border-t border-[var(--vms-line)] pt-4 first:border-0 first:pt-0">
      <legend className="text-xs font-semibold uppercase tracking-wide text-[var(--vms-ink-muted)]">
        {title}
      </legend>
      {hint ? (
        <p className="text-xs text-[var(--vms-ink-muted)]">{hint}</p>
      ) : null}
      {children}
    </fieldset>
  );
}

/**
 * Add or edit one sellable room.
 *
 * The form asks what the room *is*. How the room is *doing* — who is in it, what
 * is broken, who is arriving — sits behind "View details" and is read-only, because
 * an operational fact is not something to type over in a form.
 *
 * **The bug this form had.** Every `onChange` read `event.currentTarget.value`
 * *inside* a `setValues` updater. React defers updater functions, and by the time
 * it ran the event's `currentTarget` had already been cleared, so the first
 * keystroke threw `Cannot read properties of null (reading 'value')` and the form
 * was unusable. Values are read from the event immediately and only then handed
 * to the updater.
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
  const [values, setValues] = useState<RoomValues>(() =>
    room
      ? {
          name: room.name,
          room_number: room.room_number,
          place_group_id: room.place_group_id ?? "",
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
  const [showDetails, setShowDetails] = useState(false);
  const amenities = useHospitalityAmenities();
  const categories = useRoomCategories(open);
  const siteId = useAppStore((state) => state.selectedSite?.id ?? "");

  const mutation = useMutation({
    mutationFn: async () => {
      const capacity = Number(values.capacity);
      const baseRate = Number(values.base_rate === "" ? "0" : values.base_rate);
      if (!values.name.trim() || !values.room_number.trim()) {
        throw new Error("Room name and room number are required.");
      }
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
        place_group_id: values.place_group_id || null,
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

  const rate = Number(values.base_rate === "" ? "0" : values.base_rate);
  const sampleTotal = Number.isFinite(rate) ? rate * 3 : 0;

  return (
    <SlideOver
      isOpen={open}
      onClose={onClose}
      title={room ? `Room ${room.room_number}` : "Add room"}
      description="These details feed reservations, availability and housekeeping."
    >
      <form onSubmit={submit} className="space-y-5">
        {!canEdit ? (
          <InlineAlert tone="warning">
            You can review this form but do not have permission to save it.
          </InlineAlert>
        ) : null}

        {room ? (
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setShowDetails((current) => !current)}
              aria-expanded={showDetails}
            >
              {showDetails ? (
                <EyeOff aria-hidden="true" className="h-3.5 w-3.5" />
              ) : (
                <Eye aria-hidden="true" className="h-3.5 w-3.5" />
              )}
              {showDetails ? "Hide details" : "View details"}
            </Button>
          </div>
        ) : null}

        {room && showDetails ? (
          <RoomDetailsPanel room={room} amenityOptions={amenities.data ?? []} />
        ) : null}

        <Section title="The room">
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
          </div>

          <RoomCategoryField
            value={values.place_group_id}
            onChange={(categoryId) =>
              setValues((current) => ({
                ...current,
                place_group_id: categoryId,
              }))
            }
            categories={categories.data ?? []}
            isLoading={categories.isPending}
            siteId={siteId}
            canEdit={canEdit}
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="Floor"
              name="floor"
              placeholder="Optional"
              description="Blank for a single-storey property."
              value={values.floor}
              onChange={onField}
            />
            <Input
              label="Sleeps"
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
                <span>Status</span>
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
        </Section>

        {room ? (
          <Section
            title="Room photos"
            hint="Shown to the desk and, when public, on the booking page."
          >
            <AttachmentManager
              entityType="hospitality_room"
              entityId={room.id}
              category="gallery"
              variant="gallery"
              title="Room images"
            />
          </Section>
        ) : null}

        <Section
          title="What it costs"
          hint="This is what the public booking page charges. Zero means the room is not sellable yet."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Nightly rate"
              name="base_rate"
              type="number"
              min={0}
              step="0.01"
              placeholder="Optional"
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
              Three nights would be{" "}
              <strong className="text-[var(--vms-ink)]">
                {formatMoney(sampleTotal, values.currency)}
              </strong>
              .
            </p>
          ) : null}
        </Section>

        <Section title="What it has">
          <AmenityPicker
            options={amenities.data ?? []}
            selected={values.amenities}
            onToggle={toggleAmenity}
            isLoading={amenities.isPending}
            isError={amenities.isError}
          />
        </Section>

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
