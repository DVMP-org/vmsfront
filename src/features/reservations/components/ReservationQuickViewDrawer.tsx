"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRightLeft, Banknote, XCircle } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CancelBookingDialog } from "@/features/bookings/components/detail/CancelBookingDialog";
import { RecordPaymentForm } from "@/features/bookings/components/RecordPaymentForm";
import { useBooking, useCancelBooking } from "@/features/bookings/queries";
import { useSiteAccess } from "@/features/context/use-site-access";
import { PanelState } from "@/features/dashboard/DashboardPrimitives";
import { useHospitalityRooms } from "@/features/hospitality/queries";
import { formatMoney } from "@/lib/currency";
import { formatDate, formatDateTime } from "@/lib/datetime";
import { humanize } from "@/lib/strings";
import { ConvertReservationForm } from "./ConvertReservationForm";
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

const CLOSED_STATUSES = new Set(["declined", "cancelled", "expired", "no_show"]);

function Row({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex items-baseline justify-between gap-3 py-1.5">
            <dt className="shrink-0 text-xs text-[var(--vms-ink-muted)]">{label}</dt>
            <dd className="min-w-0 text-right text-sm text-[var(--vms-ink)]">
                {children}
            </dd>
        </div>
    );
}

/**
 * The quick look at one reservation, and the two things a desk does with it.
 *
 * A reservation is capacity held against a guest's request, so the questions are
 * different from a booking's: is the room still held, what was quoted, what has
 * been paid, and can this be confirmed. Everything shown comes from the server's
 * own summary, so the drawer, the directory and the details page agree.
 */
export function ReservationQuickViewDrawer({
    bookingId,
    onClose,
}: {
    bookingId: string | null;
    onClose: () => void;
}) {
    const booking = useBooking(bookingId);
    const rooms = useHospitalityRooms(Boolean(bookingId));
    const access = useSiteAccess();
    const cancel = useCancelBooking(bookingId ?? "");

    const [panel, setPanel] = useState<"detail" | "convert" | "payment">("detail");
    const [cancelling, setCancelling] = useState(false);

    const data = booking.data;
    const roomName = data?.place_id
        ? (rooms.data ?? []).find((room) => room.id === data.place_id)?.name
        : null;
    const canManageMoney =
        access.isAdministrator || access.allowed("bookings.approve");
    const canConvert =
        canManageMoney && data !== undefined && data !== null
            ? canConvertReservation(data)
            : false;
    const canTakeMoney =
        canManageMoney && data !== undefined && data !== null
            ? !CLOSED_STATUSES.has(data.status)
            : false;
    const canCancel =
        canManageMoney && data !== undefined && data !== null
            ? data.status === "requested" || data.status === "pending_payment"
            : false;
    const holdExpiry = data?.reservations?.find((row) => row.expires_at)?.expires_at;

    return (
        <>
            <Drawer
                isOpen={Boolean(bookingId)}
                onClose={onClose}
                title={data?.reference ?? "Reservation"}
                description={data ? data.requester_name : "Loading reservation…"}
                footer={
                    <Button asChild variant={canConvert ? "primary" : "outline"}>
                        <Link href={`/admin/reservations/${bookingId}`}>
                            View full reservation →
                        </Link>
                    </Button>
                }
            >
                {booking.isPending || !data ? (
                    <PanelState
                        kind={booking.isError ? "error" : "loading"}
                        title={
                            booking.isError
                                ? "Reservation could not be loaded"
                                : "Loading reservation"
                        }
                        description={
                            booking.isError
                                ? "It may have moved, or it belongs to another Site."
                                : "Fetching the guest, the hold and what was quoted."
                        }
                        onRetry={booking.isError ? () => void booking.refetch() : undefined}
                    />
                ) : panel !== "detail" ? (
                    <div className="flex flex-col gap-4">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="w-fit"
                            onClick={() => setPanel("detail")}
                        >
                            ← Back to reservation
                        </Button>
                        {panel === "convert" ? (
                            <ConvertReservationForm
                                bookingId={data.id}
                                initialRoomIds={data.place_id ? [data.place_id] : []}
                                onDone={() => setPanel("detail")}
                                onCancel={() => setPanel("detail")}
                            />
                        ) : null}
                        {panel === "payment" ? (
                            <RecordPaymentForm
                                bookingId={data.id}
                                currency={data.financials?.currency}
                                balance={data.financials?.balance ?? null}
                                onDone={() => setPanel("detail")}
                                onCancel={() => setPanel("detail")}
                            />
                        ) : null}
                    </div>
                ) : (
                    <div className="flex flex-col gap-5">
                        <div className="flex flex-col gap-2 rounded-lg border border-[var(--vms-line)] p-2">
                            <div className="flex flex-wrap gap-2">
                                {canConvert ? (
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => setPanel("convert")}
                                    >
                                        <ArrowRightLeft className="h-4 w-4" aria-hidden="true" />
                                        Convert to booking
                                    </Button>
                                ) : null}
                                {canTakeMoney ? (
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setPanel("payment")}
                                    >
                                        <Banknote className="h-4 w-4" aria-hidden="true" />
                                        Record payment
                                    </Button>
                                ) : null}
                                {canCancel ? (
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setCancelling(true)}
                                    >
                                        <XCircle className="h-4 w-4" aria-hidden="true" />
                                        Cancel reservation
                                    </Button>
                                ) : null}
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <StatusBadge tone={reservationBookingStatusTone(data.status)}>
                                {reservationBookingStatusLabel(data.status)}
                            </StatusBadge>
                            <span className="text-xs text-[var(--vms-ink-muted)]">
                                {SOURCE_LABELS[data.source] ?? humanize(data.source)}
                            </span>
                        </div>

                        <section aria-label="Guest" className="flex flex-col gap-1">
                            <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--vms-ink-muted)]">
                                Guest
                            </h3>
                            <dl className="divide-y divide-[var(--vms-line)]">
                                <Row label="Name">{data.requester_name}</Row>
                                <Row label="Contact">
                                    {data.requester_email || data.requester_phone || "No contact"}
                                </Row>
                                <Row label="Guests">
                                    {data.guest_count} {data.guest_count === 1 ? "guest" : "guests"}
                                </Row>
                            </dl>
                        </section>

                        <section aria-label="Accommodation" className="flex flex-col gap-1">
                            <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--vms-ink-muted)]">
                                Accommodation
                            </h3>
                            <dl className="divide-y divide-[var(--vms-line)]">
                                <Row label="Room">
                                    {roomName ?? (data.place_id ? "Room assigned" : "Category hold")}
                                </Row>
                                <Row label="Arrival">{formatDate(data.check_in_at)}</Row>
                                <Row label="Departure">{formatDate(data.check_out_at)}</Row>
                                <Row label="Hold ends">
                                    {holdExpiry ? formatDateTime(holdExpiry) : "No hold recorded"}
                                </Row>
                            </dl>
                        </section>

                        <section aria-label="Financial summary" className="flex flex-col gap-1">
                            <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--vms-ink-muted)]">
                                Financial summary
                            </h3>
                            {data.financials ? (
                                <dl className="divide-y divide-[var(--vms-line)]">
                                    <Row label="Quoted amount">
                                        {formatMoney(
                                            data.financials.accommodation,
                                            data.financials.currency,
                                        )}
                                    </Row>
                                    <Row label="Reservation payment">
                                        {formatMoney(data.financials.paid, data.financials.currency)}
                                    </Row>
                                    <Row label="Total payable">
                                        <span className="font-medium">
                                            {formatMoney(data.financials.total, data.financials.currency)}
                                        </span>
                                    </Row>
                                    <Row label="Outstanding">
                                        {formatMoney(
                                            data.financials.balance,
                                            data.financials.currency,
                                        )}
                                    </Row>
                                </dl>
                            ) : (
                                <p className="text-xs text-[var(--vms-ink-muted)]">
                                    No price has been quoted for this reservation yet.
                                </p>
                            )}
                        </section>

                        <section aria-label="Status" className="flex flex-col gap-1">
                            <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--vms-ink-muted)]">
                                Status
                            </h3>
                            <dl className="divide-y divide-[var(--vms-line)]">
                                <Row label="State">
                                    {reservationBookingStatusLabel(data.status)}
                                </Row>
                                <Row label="Created">{formatDateTime(data.created_at)}</Row>
                                <Row label="Convertible">
                                    {canConvertReservation(data) ? "Yes" : "Not in this state"}
                                </Row>
                            </dl>
                        </section>
                    </div>
                )}
            </Drawer>

            {data ? (
                <CancelBookingDialog
                    isOpen={cancelling}
                    onClose={() => setCancelling(false)}
                    onConfirm={(reason) => cancel.mutateAsync(reason)}
                    pending={cancel.isPending}
                    guestName={data.requester_name}
                />
            ) : null}
        </>
    );
}
