"use client";

import { formatMoney } from "@/lib/currency";
import { formatDateTime } from "@/lib/datetime";
import { humanize } from "@/lib/strings";
import type { AmenityOption } from "../api";
import type { HospitalityRoom } from "../contracts";

/** One read-only fact. */
function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-[var(--vms-ink-muted)]">
        {label}
      </dt>
      <dd className="text-sm text-[var(--vms-ink)]">{value}</dd>
    </div>
  );
}

/**
 * What is known about a room, none of it editable.
 *
 * The form says what the room *is*; this says how it is *doing* — whether anyone
 * is in it, who is arriving, what is broken. Keeping that apart stops a live
 * operational state from looking like something you should type over.
 */
export function RoomDetailsPanel({
  room,
  amenityOptions,
}: {
  room: HospitalityRoom;
  amenityOptions: AmenityOption[];
}) {
  const labels = new Map(
    amenityOptions.map((option) => [option.code, option.label]),
  );

  return (
    <section
      aria-label="Room details"
      className="space-y-4 rounded-xl border border-[var(--vms-border)] bg-[var(--vms-surface-muted)] p-4"
    >
      <dl className="grid grid-cols-2 gap-4">
        <Fact
          label="Category"
          value={
            room.place_group_name ?? (
              <span className="text-[var(--vms-ink-muted)]">
                Not categorised
              </span>
            )
          }
        />
        <Fact label="Type" value={humanize(room.room_type)} />
        <Fact
          label="Floor"
          value={
            room.floor ?? <span className="text-[var(--vms-ink-muted)]">—</span>
          }
        />
        <Fact label="Sleeps" value={String(room.capacity)} />
        <Fact
          label="Nightly rate"
          value={
            Number(room.base_rate) > 0
              ? formatMoney(room.base_rate, room.currency)
              : "Not sellable yet"
          }
        />
        <Fact label="Status" value={humanize(room.status)} />
        <Fact label="Housekeeping" value={humanize(room.housekeeping_status)} />
        <Fact
          label="In the room now"
          value={
            room.current_guest_name ?? (
              <span className="text-[var(--vms-ink-muted)]">Vacant</span>
            )
          }
        />
        <Fact
          label="Next arrival"
          value={
            room.next_arrival ? (
              formatDateTime(room.next_arrival)
            ) : (
              <span className="text-[var(--vms-ink-muted)]">None booked</span>
            )
          }
        />
        <Fact
          label="Open maintenance"
          value={
            room.maintenance_open > 0 ? (
              <span className="text-[var(--vms-danger)]">
                {room.maintenance_open} open
              </span>
            ) : (
              <span className="text-[var(--vms-ink-muted)]">None</span>
            )
          }
        />
        <Fact label="Last updated" value={formatDateTime(room.updated_at)} />
      </dl>

      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--vms-ink-muted)]">
          Amenities
        </span>
        {room.amenities.length === 0 ? (
          <p className="text-sm text-[var(--vms-ink-muted)]">None recorded.</p>
        ) : (
          <ul className="flex flex-wrap gap-1.5">
            {room.amenities.map((code) => (
              <li
                key={code}
                className="rounded-full bg-[var(--vms-surface)] px-2.5 py-1 text-xs text-[var(--vms-ink)] ring-1 ring-inset ring-[var(--vms-line)]"
              >
                {labels.get(code) ?? humanize(code)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
