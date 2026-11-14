"use client";

import { formatDateTime } from "@/lib/datetime";
import { humanize } from "@/lib/strings";
import { BOOKING_DOMAIN_LABEL } from "../../api-types";
import type { BookingDetailDto } from "../../api-types";

/** A labelled fact, so the overview reads as a record rather than a paragraph. */
function Fact({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--vms-ink-muted)]">
        {label}
      </dt>
      <dd className="text-sm text-[var(--vms-ink)]">{value}</dd>
    </div>
  );
}

/**
 * Who the guest is and what they asked for.
 *
 * Everything here is read-only: the decisions belong to the header, the money to
 * Payments, and the allocation to Rooms. A booking that needs amending needs a
 * new booking, because the agreed price is a snapshot and silently rewriting it
 * is the thing this record exists to prevent.
 */
export function BookingOverviewSection({
  booking,
}: {
  booking: BookingDetailDto;
}) {
  const contact = booking.requester_email ?? booking.requester_phone;

  return (
    <section aria-label="Booking overview" className="flex flex-col gap-5">
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Fact label="Guest" value={booking.requester_name} />
        <Fact
          label="Contact"
          value={contact ?? <span className="text-[var(--vms-ink-muted)]">None left</span>}
        />
        <Fact label="Arrival" value={formatDateTime(booking.check_in_at)} />
        <Fact label="Departure" value={formatDateTime(booking.check_out_at)} />
        <Fact label="Guests" value={String(booking.guest_count)} />
        <Fact label="Channel" value={humanize(booking.source)} />
        <Fact label="Kind" value={humanize(booking.kind)} />
        <Fact label="Domain" value={BOOKING_DOMAIN_LABEL[booking.domain]} />
        <Fact
          label="Reference"
          value={
            booking.reference ? (
              <span className="font-mono text-xs">{booking.reference}</span>
            ) : (
              <span className="text-[var(--vms-ink-muted)]">Not assigned</span>
            )
          }
        />
        <Fact label="Taken" value={formatDateTime(booking.created_at)} />
      </dl>

      {booking.purpose ? (
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--vms-ink-muted)]">
            Purpose
          </span>
          <p className="text-sm text-[var(--vms-ink)]">{booking.purpose}</p>
        </div>
      ) : null}

      {booking.approved_at ? (
        <p className="text-xs text-[var(--vms-ink-muted)]">
          Approved by {humanize(booking.approved_by ?? "")} on{" "}
          {formatDateTime(booking.approved_at)}.
        </p>
      ) : null}

      {booking.decline_reason ? (
        <p
          role="note"
          className="rounded-lg border border-[var(--vms-line)] bg-[var(--vms-surface)] px-3 py-2 text-xs text-[var(--vms-danger)]"
        >
          Declined: {booking.decline_reason}
        </p>
      ) : null}
    </section>
  );
}
