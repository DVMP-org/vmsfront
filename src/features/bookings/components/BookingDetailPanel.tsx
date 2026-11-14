"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PanelState } from "@/features/dashboard/DashboardPrimitives";
import { useHospitalityRooms } from "@/features/hospitality/queries";
import { formatDateTime } from "@/lib/datetime";
import { formatMoney } from "@/lib/currency";
import { BookingApprovalActions } from "./BookingApprovalActions";
import { BookingStatusBadge } from "./BookingStatusBadge";
import { canDecide } from "../api-types";
import type { BookingDetailDto } from "../api-types";
import {
  useApproveBooking,
  useAssignBookingRoom,
  useBookingPayments,
  useDeclineBooking,
  useRecordBookingPayment,
} from "../queries";

/**
 * One booking, everything an operator may do to it, and the trail that explains
 * how it got here.
 *
 * The actions are gated by what the booking *is*, not by what the page hopes:
 * a booking awaiting payment cannot be approved, and a commercial one cannot be
 * decided at all because its workflow is unspecified.
 */
export function BookingDetailPanel({ booking }: { booking: BookingDetailDto }) {
  const approve = useApproveBooking(booking.id);
  const decline = useDeclineBooking(booking.id);
  const assignRoom = useAssignBookingRoom(booking.id);
  const recordPayment = useRecordBookingPayment(booking.id);
  const payments = useBookingPayments(booking.id);
  const { data: rooms = [] } = useHospitalityRooms(booking.domain === "hospitality");

  const [reason, setReason] = useState("");
  const [declining, setDeclining] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [amount, setAmount] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const needsRoom = canDecide(booking) && booking.kind === "reservation";
  const decidable = canDecide(booking) && !needsRoom;
  const canPay =
    booking.domain === "hospitality" &&
    (booking.status === "pending_payment" || booking.status === "requested");

  async function run(action: () => Promise<unknown>) {
    setActionError(null);
    try {
      await action();
      setDeclining(false);
      setReason("");
      setAmount("");
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "That action did not go through.",
      );
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <BookingStatusBadge status={booking.status} />
          {booking.approved_by ? (
            <span className="text-xs text-[var(--vms-ink-muted)]">
              Approved by {booking.approved_by.replace("_", " ")}
            </span>
          ) : null}
        </div>
        <p className="text-sm text-[var(--vms-ink)]">{booking.requester_name}</p>
        <p className="text-xs text-[var(--vms-ink-muted)]">
          {booking.requester_email ?? booking.requester_phone ?? "No contact left"}
        </p>
        <p className="text-xs text-[var(--vms-ink-muted)]">
          {formatDateTime(booking.check_in_at)} → {formatDateTime(booking.check_out_at)}
        </p>
        {booking.purpose ? (
          <p className="text-xs text-[var(--vms-ink-muted)]">{booking.purpose}</p>
        ) : null}
        {booking.decline_reason ? (
          <p className="text-xs text-[var(--vms-danger)]">
            Declined: {booking.decline_reason}
          </p>
        ) : null}
      </section>

      {actionError ? (
        <p role="alert" className="text-xs font-medium text-[var(--vms-danger)]">
          {actionError}
        </p>
      ) : null}

      {booking.kind === "reservation" && booking.status === "requested" ? (
        <section className="flex flex-col gap-2">
          <label
            htmlFor="booking-room"
            className="text-xs font-semibold text-[var(--vms-ink)]"
          >
            Assign a room
          </label>
          <select
            id="booking-room"
            value={roomId}
            onChange={(event) => setRoomId(event.target.value)}
            className="min-h-11 rounded-lg border border-[var(--vms-border)] bg-[var(--vms-surface)] px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-accent)]"
          >
            <option value="">Choose a room…</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.room_number || room.name}
              </option>
            ))}
          </select>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!roomId || assignRoom.isPending}
            isLoading={assignRoom.isPending}
            onClick={() => run(() => assignRoom.mutateAsync(roomId))}
          >
            Assign room
          </Button>
        </section>
      ) : null}

      {decidable ? (
        <section className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-[var(--vms-ink)]">
            Decision
          </span>
          <BookingApprovalActions
            pending={approve.isPending || decline.isPending}
            onApprove={() => run(() => approve.mutateAsync(undefined))}
            onDecline={() => setDeclining(true)}
          />
          {declining ? (
            <div className="flex flex-col gap-2">
              <label
                htmlFor="booking-decline-reason"
                className="text-xs font-medium text-[var(--vms-ink)]"
              >
                Why is this declined?
              </label>
              <Input
                id="booking-decline-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Away that week"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={reason.trim().length < 3 || decline.isPending}
                isLoading={decline.isPending}
                onClick={() => run(() => decline.mutateAsync(reason.trim()))}
              >
                Confirm decline
              </Button>
            </div>
          ) : null}
        </section>
      ) : null}

      {needsRoom ? (
        <p className="rounded-lg border border-[var(--vms-border)] px-3 py-2 text-xs text-[var(--vms-ink-muted)]">
          A reservation has to name a room before it can be approved.
        </p>
      ) : null}

      {!canDecide(booking) &&
      booking.status !== "confirmed" &&
      booking.status !== "declined" ? (
        <p className="rounded-lg border border-[var(--vms-border)] px-3 py-2 text-xs text-[var(--vms-ink-muted)]">
          {booking.domain === "commercial" || booking.domain === "mixed_use"
            ? "Commercial and mixed-use decisions are not specified yet."
            : "This booking cannot be decided from here."}
        </p>
      ) : null}

      {canPay ? (
        <section className="flex flex-col gap-2">
          <label
            htmlFor="booking-payment"
            className="text-xs font-semibold text-[var(--vms-ink)]"
          >
            Record a payment
          </label>
          <div className="flex items-end gap-2">
            <Input
              id="booking-payment"
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="150.00"
            />
            <Button
              type="button"
              size="sm"
              disabled={!amount.trim() || recordPayment.isPending}
              isLoading={recordPayment.isPending}
              onClick={() =>
                run(() =>
                  recordPayment.mutateAsync({ amount: amount.trim() }),
                )
              }
            >
              Record
            </Button>
          </div>
          {payments.data?.length ? (
            <ul className="flex flex-col gap-1">
              {payments.data.map((payment) => (
                <li
                  key={payment.id}
                  className="flex items-center justify-between text-xs text-[var(--vms-ink-muted)]"
                >
                  <span>
                    {formatMoney(payment.amount, payment.currency)}
                    {payment.folio_line_id ? " · on the folio" : " · not yet posted"}
                  </span>
                  <span>{formatDateTime(payment.created_at)}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      <section className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-[var(--vms-ink)]">Trail</span>
        {booking.activities.length === 0 ? (
          <PanelState
            kind="empty"
            compact
            title="Nothing recorded yet"
            description="Decisions and room assignments appear here as they happen."
          />
        ) : (
          <ol className="flex flex-col gap-2">
            {booking.activities.map((activity) => (
              <li key={activity.id} className="text-xs">
                <span className="font-medium text-[var(--vms-ink)]">
                  {activity.event_type.replace(/_/g, " ")}
                </span>
                <span className="text-[var(--vms-ink-muted)]">
                  {" · "}
                  {formatDateTime(activity.occurred_at)}
                </span>
                {activity.message ? (
                  <p className="text-[var(--vms-ink-muted)]">{activity.message}</p>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
