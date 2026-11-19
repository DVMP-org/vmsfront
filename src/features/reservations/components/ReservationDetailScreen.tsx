"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { BookingActivitySection } from "@/features/bookings/components/detail/BookingActivitySection";
import { CancelBookingDialog } from "@/features/bookings/components/detail/CancelBookingDialog";
import { BookingEditDialog } from "@/features/bookings/components/BookingEditDialog";
import { RecordPaymentDialog } from "@/features/bookings/components/RecordPaymentDialog";
import { useBooking, useBookingPayments, useCancelBooking } from "@/features/bookings/queries";
import { useSiteAccess } from "@/features/context/use-site-access";
import { PanelState } from "@/features/dashboard/DashboardPrimitives";
import { ReservationStatusBadge } from "@/features/reservations/components/ReservationStatusBadge";
import { ReservationActions } from "@/features/reservations/components/ReservationActions";
import {
    holdsReason,
    reservationResourceLabel,
    reservationWindow,
} from "@/features/reservations/lib";
import { formatMoney } from "@/lib/currency";
import { formatDate, formatDateTime } from "@/lib/datetime";
import { humanize } from "@/lib/strings";
import { ConvertReservationDialog } from "./ConvertReservationDialog";
import {
    canConvertReservation,
    reservationBookingStatusLabel,
    reservationBookingStatusTone,
} from "../lib";

const SOURCE_LABELS: Record<string, string> = {
    public: "Public page",
    phone: "Phone",
    walk_in: "Walk-in",
    staff: "Staff",
};

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-0.5">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--vms-ink-muted)]">
                {label}
            </dt>
            <dd className="text-sm font-medium text-[var(--vms-ink)]">{value}</dd>
        </div>
    );
}

/**
 * One reservation, as the place an operator works from.
 *
 * A reservation is a request that holds capacity, so this page answers what the
 * drawer summarizes: what was asked for, what it was quoted at, what has been
 * paid, whether the hold still stands, and what can be done with it. Converting
 * is the point of the page — it confirms the arrangement and hands the guest over
 * to the booking screen, where check-in and the bill live.
 */
export function ReservationDetailScreen({ bookingId }: { bookingId: string }) {
    const booking = useBooking(bookingId);
    const payments = useBookingPayments(bookingId);
    const cancel = useCancelBooking(bookingId);
    const access = useSiteAccess();

    const [converting, setConverting] = useState(false);
    const [recording, setRecording] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [editing, setEditing] = useState(false);

    if (booking.isPending) {
        return (
            <PanelState
                kind="loading"
                title="Loading reservation"
                description="Fetching the request, the hold and the quote."
            />
        );
    }

    if (booking.isError || !booking.data) {
        return (
            <PanelState
                kind="error"
                title="Reservation could not be loaded"
                description="It may have been converted, or it belongs to another Site."
                onRetry={() => void booking.refetch()}
                isRetrying={booking.isFetching}
                retryLabel="Retry reservation"
            />
        );
    }

    const data = booking.data;
    const canManage =
        access.isAdministrator || access.allowed("bookings.approve");
    const convertible = canManage && canConvertReservation(data);
    const cancellable =
        canManage && (data.status === "requested" || data.status === "pending_payment");
    const canTakeMoney =
        canManage && !["declined", "cancelled", "expired", "no_show"].includes(data.status);
    const paymentRows = payments.data ?? [];

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
                <Link
                    href="/admin/reservations"
                    className="inline-flex w-fit items-center gap-1 text-xs font-medium text-[var(--vms-ink-muted)] hover:text-[var(--vms-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-accent)]"
                >
                    <ArrowLeft aria-hidden className="h-3.5 w-3.5" />
                    All reservations
                </Link>
                <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-lg font-semibold text-[var(--vms-ink)]">
                        {data.reference ?? data.requester_name}
                    </h1>
                    <StatusBadge tone={reservationBookingStatusTone(data.status)}>
                        {reservationBookingStatusLabel(data.status)}
                    </StatusBadge>
                    {data.place_id ? null : (
                        <StatusBadge tone="warning">No room yet</StatusBadge>
                    )}
                </div>
                <p className="text-xs text-[var(--vms-ink-muted)]">
                    {data.requester_name} · {formatDate(data.check_in_at)} →{" "}
                    {formatDate(data.check_out_at)} · {data.guest_count}{" "}
                    {data.guest_count === 1 ? "guest" : "guests"}
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start">
                <div className="flex min-w-0 flex-col gap-4">
                    <section
                        aria-label="Overview"
                        className="flex flex-col gap-3 rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-4"
                    >
                        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--vms-ink-muted)]">
                            Overview
                        </h2>
                        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                            <Stat label="Guest" value={data.requester_name} />
                            <Stat
                                label="Contact"
                                value={
                                    data.requester_email || data.requester_phone || "No contact"
                                }
                            />
                            <Stat label="Channel" value={SOURCE_LABELS[data.source] ?? humanize(data.source)} />
                            <Stat
                                label="Accommodation"
                                value={data.place_id ? "Room assigned" : "Category hold"}
                            />
                            <Stat label="Arrival" value={formatDate(data.check_in_at)} />
                            <Stat label="Departure" value={formatDate(data.check_out_at)} />
                            <Stat label="Created" value={formatDateTime(data.created_at)} />
                            <Stat
                                label="Convertible"
                                value={canConvertReservation(data) ? "Yes" : "Not in this state"}
                            />
                        </dl>
                    </section>

                    <section
                        aria-label="Financial information"
                        className="flex flex-col gap-3 rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-4"
                    >
                        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--vms-ink-muted)]">
                            Financial information
                        </h2>
                        {data.financials ? (
                            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                                <Stat
                                    label="Quoted amount"
                                    value={formatMoney(
                                        data.financials.accommodation,
                                        data.financials.currency,
                                    )}
                                />
                                <Stat
                                    label="Deposit paid"
                                    value={formatMoney(
                                        data.financials.paid,
                                        data.financials.currency,
                                    )}
                                />
                                <Stat
                                    label="Total payable"
                                    value={formatMoney(
                                        data.financials.total,
                                        data.financials.currency,
                                    )}
                                />
                                <Stat
                                    label="Outstanding"
                                    value={formatMoney(
                                        data.financials.balance,
                                        data.financials.currency,
                                    )}
                                />
                            </dl>
                        ) : (
                            <p className="text-xs text-[var(--vms-ink-muted)]">
                                No price has been quoted for this reservation yet.
                            </p>
                        )}

                        <h3 className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--vms-ink-muted)]">
                            Payment records
                        </h3>
                        {payments.isPending ? (
                            <p className="text-xs text-[var(--vms-ink-muted)]">
                                Loading payments…
                            </p>
                        ) : paymentRows.length === 0 ? (
                            <p className="text-xs text-[var(--vms-ink-muted)]">
                                No payments have been recorded against this reservation.
                            </p>
                        ) : (
                            <ul className="flex flex-col divide-y divide-[var(--vms-line)]">
                                {paymentRows.map((payment) => (
                                    <li
                                        key={payment.id}
                                        className="flex flex-wrap items-baseline justify-between gap-2 py-2 text-sm"
                                    >
                                        <span className="min-w-0">
                                            <span className="font-medium tabular-nums">
                                                {formatMoney(payment.amount, payment.currency)}
                                            </span>
                                            <span className="block text-xs text-[var(--vms-ink-muted)]">
                                                {humanize(payment.method ?? "payment")}
                                                {payment.reference ? ` · ${payment.reference}` : ""}
                                                {payment.note ? ` · ${payment.note}` : ""} ·{" "}
                                                {formatDateTime(payment.paid_at ?? payment.created_at)}
                                            </span>
                                        </span>
                                        <StatusBadge tone={payment.status === "captured" ? "success" : "neutral"}>
                                            {humanize(payment.status)}
                                        </StatusBadge>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    <section
                        aria-label="Availability and allocation"
                        className="flex flex-col gap-3 rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-4"
                    >
                        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--vms-ink-muted)]">
                            Availability and allocation
                        </h2>
                        {data.reservations.length === 0 ? (
                            <p className="text-xs text-[var(--vms-ink-muted)]">
                                This request holds no capacity. Conversion allocates the room it
                                will occupy.
                            </p>
                        ) : (
                            <ul className="flex flex-col gap-2">
                                {data.reservations.map((hold) => (
                                    <li
                                        key={hold.id}
                                        className="flex flex-col gap-1 rounded-lg border border-[var(--vms-line)] px-3 py-2"
                                    >
                                        <span className="flex flex-wrap items-center gap-2">
                                            <ReservationStatusBadge status={hold.status} />
                                            {holdsReason(hold) ? (
                                                <span className="text-[10px] uppercase tracking-wide text-[var(--vms-ink-muted)]">
                                                    {holdsReason(hold)}
                                                </span>
                                            ) : null}
                                        </span>
                                        <span className="text-xs text-[var(--vms-ink-muted)]">
                                            {reservationWindow(hold)}
                                        </span>
                                        <span className="text-xs text-[var(--vms-ink-muted)]">
                                            {hold.place_id
                                                ? "A specific room is held"
                                                : humanize(hold.place_type ?? "no room type")}
                                            {hold.expires_at
                                                ? ` · hold ends ${formatDateTime(hold.expires_at)}`
                                                : ""}
                                        </span>
                                        {/* Name the room behind a category hold, or release it, from
                        the place that shows what is actually blocked. */}
                                        <ReservationActions
                                            reservation={hold}
                                            resourceLabel={reservationResourceLabel(
                                                hold,
                                                data.place_id ? "This reservation's room" : null,
                                            )}
                                        />
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    <section
                        aria-label="Activity"
                        className="flex flex-col gap-3 rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-4"
                    >
                        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--vms-ink-muted)]">
                            Activity
                        </h2>
                        <BookingActivitySection booking={data} />
                    </section>
                </div>

                <aside className="flex flex-col gap-4 xl:sticky xl:top-4">
                    <div className="flex flex-col gap-3 rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-4">
                        <div className="flex flex-wrap gap-2">
                            {convertible ? (
                                <Button type="button" size="sm" onClick={() => setConverting(true)}>
                                    Convert to booking
                                </Button>
                            ) : null}
                            {canTakeMoney ? (
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setRecording(true)}
                                >
                                    Record payment
                                </Button>
                            ) : null}
                            {canManage ? (
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setEditing(true)}
                                >
                                    Modify reservation
                                </Button>
                            ) : null}
                            {cancellable ? (
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setCancelling(true)}
                                >
                                    Cancel reservation
                                </Button>
                            ) : null}
                        </div>
                        {!convertible ? (
                            <p className="text-xs text-[var(--vms-ink-muted)]">
                                A reservation can be converted while it is still pending. Expired
                                or cancelled requests need a new booking.
                            </p>
                        ) : null}
                        {data.financials ? (
                            <dl className="flex flex-col gap-2 border-t border-[var(--vms-line)] pt-3 text-sm">
                                <div className="flex items-baseline justify-between gap-2">
                                    <dt className="text-xs text-[var(--vms-ink-muted)]">
                                        Total payable
                                    </dt>
                                    <dd className="font-semibold tabular-nums">
                                        {formatMoney(data.financials.total, data.financials.currency)}
                                    </dd>
                                </div>
                                <div className="flex items-baseline justify-between gap-2">
                                    <dt className="text-xs text-[var(--vms-ink-muted)]">
                                        Outstanding
                                    </dt>
                                    <dd className="tabular-nums">
                                        {formatMoney(
                                            data.financials.balance,
                                            data.financials.currency,
                                        )}
                                    </dd>
                                </div>
                            </dl>
                        ) : null}
                    </div>
                </aside>
            </div>

            <ConvertReservationDialog
                isOpen={converting}
                onClose={() => setConverting(false)}
                bookingId={data.id}
                guestName={data.requester_name}
                initialRoomIds={data.place_id ? [data.place_id] : []}
            />
            <BookingEditDialog
                isOpen={editing}
                onClose={() => setEditing(false)}
                booking={data}
            />
            <RecordPaymentDialog
                isOpen={recording}
                onClose={() => setRecording(false)}
                bookingId={data.id}
                currency={data.financials?.currency}
                balance={data.financials?.balance ?? null}
            />
            <CancelBookingDialog
                isOpen={cancelling}
                onClose={() => setCancelling(false)}
                onConfirm={(reason) => cancel.mutateAsync(reason)}
                pending={cancel.isPending}
                guestName={data.requester_name}
            />
        </div>
    );
}
