"use client";

import Link from "next/link";
import { useState } from "react";
import {
    Ban,
    Banknote,
    LogIn,
    LogOut,
    Mail,
    Pencil,
    PlusCircle,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { Input } from "@/components/ui/Input";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useSiteAccess } from "@/features/context/use-site-access";
import { useWorkspaceContext } from "@/features/context/use-workspace-context";
import { PanelState } from "@/features/dashboard/DashboardPrimitives";
import {
    useCheckInStay,
    useCheckOutStay,
    useHospitalityRooms,
} from "@/features/hospitality/queries";
import { formatMoney } from "@/lib/currency";
import { formatDate, formatDateTime } from "@/lib/datetime";
import { parseApiError } from "@/lib/error-utils";
import { humanize } from "@/lib/strings";
import { AddChargeForm } from "./AddChargeForm";
import { BookingEditForm } from "./BookingEditForm";
import { BookingPageLink } from "./BookingPageLink";
import { BookingStatusBadge } from "./BookingStatusBadge";
import { RecordPaymentForm } from "./RecordPaymentForm";
import { paymentStatusView, stayNights } from "../lib";
import { canCancel } from "../api-types";
import {
    useBooking,
    useCancelBooking,
    useResendBookingOnboarding,
} from "../queries";

const SOURCE_LABELS: Record<string, string> = {
    public: "Public page",
    phone: "Phone",
    walk_in: "Walk-in",
    staff: "Staff",
};

/** Nothing can be charged or collected on a booking that was called off. */
const CLOSED_STATUSES = new Set(["declined", "cancelled", "expired", "no_show"]);

function Field({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
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
 * The quick look at one booking, and the things a desk does from it.
 *
 * It fetches the booking only when it is open, so a register of twenty rows does
 * not download twenty records, and it reads the server's financial summary rather
 * than recalculating money here — the drawer, the directory and the details page
 * must not be able to disagree about a balance.
 *
 * The actions sit at the top of the panel, where they can be seen, and each one
 * opens *in* the panel rather than in a second overlay on top of the first: one
 * focus trap, one scrim, and no chance of closing the wrong layer.
 *
 * Every action offered is one the server will accept: a checked-in guest is not
 * offered check-in again, and a closed booking is not offered payment at all.
 * Refusals arrive as errors, which is a worse way to learn a rule.
 */
export function BookingQuickViewDrawer({
    bookingId,
    onClose,
}: {
    bookingId: string | null;
    onClose: () => void;
}) {
    const booking = useBooking(bookingId);
    const rooms = useHospitalityRooms(Boolean(bookingId));
    const access = useSiteAccess();
    const context = useWorkspaceContext();
    const siteSlug = context.data?.site_slug ?? null;
    const checkIn = useCheckInStay();
    const checkOut = useCheckOutStay();
    const resendOnboarding = useResendBookingOnboarding(bookingId ?? "");
    const cancelBooking = useCancelBooking(bookingId ?? "");

    const [panel, setPanel] = useState<
        "detail" | "payment" | "charge" | "edit" | "cancel"
    >("detail");
    const [actionError, setActionError] = useState<string | null>(null);
    const [cancelReason, setCancelReason] = useState("");

    const data = booking.data;
    const stayId = data?.hospitality_stay_id ?? null;
    const roomName = data?.place_id
        ? (rooms.data ?? []).find((room) => room.id === data.place_id)?.name
        : null;
    const nights = data ? stayNights(data.check_in_at, data.check_out_at) : null;
    const payment = paymentStatusView(data?.financials ?? null);
    const canManageMoney =
        access.isAdministrator || access.allowed("bookings.approve");
    const closed = data ? CLOSED_STATUSES.has(data.status) : false;
    const cancellable = data ? canCancel(data) : false;
    const canCheckIn =
        Boolean(stayId) &&
        data?.hospitality_stay_status === "reserved" &&
        data?.status === "confirmed" &&
        access.allowed("hospitality_stays.checkin");
    const canCheckOut =
        Boolean(stayId) &&
        data?.hospitality_stay_status === "checked_in" &&
        access.allowed("hospitality_stays.checkout");
    // Acceptance sends the first magic link. Offering the resend only after that
    // keeps it honest: there is no identity to link to before a decision.
    const canResendOnboarding =
        Boolean(data) &&
        (data?.status === "confirmed" || data?.status === "checked_in");

    async function runStay(action: () => Promise<unknown>) {
        setActionError(null);
        try {
            await action();
        } catch (cause) {
            setActionError(parseApiError(cause).message);
        }
    }

    async function confirmCancel() {
        setActionError(null);
        try {
            await cancelBooking.mutateAsync(cancelReason.trim());
            setCancelReason("");
            onClose();
        } catch (cause) {
            setActionError(parseApiError(cause).message);
        }
    }

    return (
        <>
            <Drawer
                isOpen={Boolean(bookingId)}
                onClose={onClose}
                title={data?.reference ?? "Booking"}
                description={data ? data.requester_name : "Loading booking…"}
                footer={
                    <Button asChild>
                        <Link href={`/admin/bookings/${bookingId}`}>
                            View full booking →
                        </Link>
                    </Button>
                }
            >
                {booking.isPending || !data ? (
                    <PanelState
                        kind={booking.isError ? "error" : "loading"}
                        title={booking.isError ? "Booking could not be loaded" : "Loading booking"}
                        description={
                            booking.isError
                                ? "It may have moved, or it belongs to another Site."
                                : "Fetching the guest, the stay and the bill."
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
                            ← Back to booking
                        </Button>
                        {panel === "payment" ? (
                            <RecordPaymentForm
                                bookingId={data.id}
                                currency={data.financials?.currency}
                                balance={data.financials?.balance ?? null}
                                onDone={() => setPanel("detail")}
                                onCancel={() => setPanel("detail")}
                            />
                        ) : null}
                        {panel === "charge" ? (
                            <AddChargeForm
                                bookingId={data.id}
                                currency={data.financials?.currency}
                                onDone={() => setPanel("detail")}
                                onCancel={() => setPanel("detail")}
                            />
                        ) : null}
                        {panel === "edit" ? (
                            <BookingEditForm
                                booking={data}
                                onDone={() => setPanel("detail")}
                                onCancel={() => setPanel("detail")}
                            />
                        ) : null}
                            {panel === "cancel" ? (
                                <div className="flex flex-col gap-3 rounded-lg border border-[var(--vms-line)] p-3">
                                    <div>
                                        <h3 className="text-sm font-semibold text-[var(--vms-ink)]">
                                            Cancel this booking?
                                        </h3>
                                        <p className="mt-1 text-xs text-[var(--vms-ink-muted)]">
                                            {data.requester_name}&apos;s booking will be cancelled,
                                            its rooms released and any guest badge revoked. This
                                            cannot be undone.
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label
                                            htmlFor="drawer-cancel-reason"
                                            className="text-xs font-medium text-[var(--vms-ink)]"
                                        >
                                            Why is it being cancelled?
                                        </label>
                                        <Input
                                            id="drawer-cancel-reason"
                                            value={cancelReason}
                                            onChange={(event) =>
                                                setCancelReason(event.currentTarget.value)
                                            }
                                            placeholder="Guest's flight was cancelled"
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setPanel("detail")}
                                        >
                                            Keep it
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            disabled={
                                                cancelReason.trim().length < 3 ||
                                                cancelBooking.isPending
                                            }
                                            isLoading={cancelBooking.isPending}
                                            onClick={() => void confirmCancel()}
                                        >
                                            Confirm cancellation
                                        </Button>
                                    </div>
                                    {actionError ? (
                                        <p
                                            role="alert"
                                            className="text-xs font-medium text-[var(--vms-danger)]"
                                        >
                                            {actionError}
                                        </p>
                                    ) : null}
                                </div>
                            ) : null}
                    </div>
                ) : (
                    <div className="flex flex-col gap-5">
                        {/* The actions a desk actually reaches for, where they can be seen
                before any scrolling. */}
                        <div className="flex flex-col gap-2 rounded-lg border border-[var(--vms-line)] p-2">
                            <div className="flex flex-wrap gap-2">
                                {canCheckIn && stayId ? (
                                    <Button
                                        type="button"
                                        size="sm"
                                        isLoading={checkIn.isPending}
                                        onClick={() => void runStay(() => checkIn.mutateAsync(stayId))}
                                    >
                                        <LogIn className="h-4 w-4" aria-hidden="true" />
                                        Check in guest
                                    </Button>
                                ) : null}
                                {canCheckOut && stayId ? (
                                    <Button
                                        type="button"
                                        size="sm"
                                        isLoading={checkOut.isPending}
                                        onClick={() => void runStay(() => checkOut.mutateAsync(stayId))}
                                    >
                                        <LogOut className="h-4 w-4" aria-hidden="true" />
                                        Check out guest
                                    </Button>
                                ) : null}
                                {canManageMoney && !closed ? (
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
                                {canManageMoney && !closed ? (
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        disabled={!data.financials?.billed}
                                        onClick={() => setPanel("charge")}
                                    >
                                        <PlusCircle className="h-4 w-4" aria-hidden="true" />
                                        Add charge
                                    </Button>
                                ) : null}
                                {canManageMoney && !closed ? (
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setPanel("edit")}
                                    >
                                        <Pencil className="h-4 w-4" aria-hidden="true" />
                                        Edit booking
                                    </Button>
                                ) : null}
                                        {canManageMoney && canResendOnboarding ? (
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                isLoading={resendOnboarding.isPending}
                                                onClick={() => resendOnboarding.mutate()}
                                            >
                                                <Mail className="h-4 w-4" aria-hidden="true" />
                                                Resend magic link
                                            </Button>
                                        ) : null}
                                        {canManageMoney && cancellable ? (
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => {
                                                    setActionError(null);
                                                    setPanel("cancel");
                                                }}
                                            >
                                                <Ban className="h-4 w-4" aria-hidden="true" />
                                                Cancel booking
                                            </Button>
                                        ) : null}
                            </div>
                            {canManageMoney && !closed && !data.financials?.billed ? (
                                <p className="text-[11px] text-[var(--vms-ink-muted)]">
                                    The guest&apos;s bill opens when the booking is confirmed.
                                </p>
                            ) : null}
                            {actionError ? (
                                <p
                                    role="alert"
                                    className="text-xs font-medium text-[var(--vms-danger)]"
                                >
                                    {actionError}
                                </p>
                            ) : null}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <BookingStatusBadge status={data.status} />
                            <StatusBadge tone={payment.tone}>{payment.label}</StatusBadge>
                            <span className="text-xs text-[var(--vms-ink-muted)]">
                                {SOURCE_LABELS[data.source] ?? humanize(data.source)}
                            </span>
                        </div>

                                {/* The page the guest books through belongs with the
                            booking it produced, not in the register's chrome. */}
                                <section aria-label="Booking page">
                                    <BookingPageLink siteSlug={siteSlug} />
                                </section>

                        <section aria-label="Guest" className="flex flex-col gap-1">
                            <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--vms-ink-muted)]">
                                Guest
                            </h3>
                            <dl className="divide-y divide-[var(--vms-line)]">
                                <Field label="Name">{data.requester_name}</Field>
                                <Field label="Contact">
                                    {data.requester_email || data.requester_phone || "No contact"}
                                </Field>
                                <Field label="Guests">
                                    {data.guest_count}{" "}
                                    {data.guest_count === 1 ? "guest" : "guests"}
                                </Field>
                            </dl>
                        </section>

                        <section aria-label="Accommodation" className="flex flex-col gap-1">
                            <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--vms-ink-muted)]">
                                Accommodation
                            </h3>
                            <dl className="divide-y divide-[var(--vms-line)]">
                                <Field label="Room">
                                    {roomName ?? (data.place_id ? "Room assigned" : "Not assigned")}
                                </Field>
                                <Field label="Check-in">{formatDate(data.check_in_at)}</Field>
                                <Field label="Check-out">{formatDate(data.check_out_at)}</Field>
                                <Field label="Nights">
                                    {nights === null ? "—" : `${nights}`}
                                </Field>
                            </dl>
                        </section>

                        <section aria-label="Financial summary" className="flex flex-col gap-1">
                            <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--vms-ink-muted)]">
                                Financial summary
                            </h3>
                            {data.financials ? (
                                <dl className="divide-y divide-[var(--vms-line)]">
                                    <Field label="Accommodation">
                                        {formatMoney(
                                            data.financials.accommodation,
                                            data.financials.currency,
                                        )}
                                    </Field>
                                    <Field label="Additional charges">
                                        {formatMoney(
                                            data.financials.additional,
                                            data.financials.currency,
                                        )}
                                    </Field>
                                    <Field label="Total payable">
                                        <span className="font-medium">
                                            {formatMoney(data.financials.total, data.financials.currency)}
                                        </span>
                                    </Field>
                                    <Field label="Paid">
                                        {formatMoney(data.financials.paid, data.financials.currency)}
                                    </Field>
                                    <Field label="Outstanding">
                                        {formatMoney(
                                            data.financials.balance,
                                            data.financials.currency,
                                        )}
                                    </Field>
                                </dl>
                            ) : (
                                <p className="text-xs text-[var(--vms-ink-muted)]">
                                    No price has been recorded for this booking.
                                </p>
                            )}
                        </section>

                        <section aria-label="Operational information" className="flex flex-col gap-1">
                            <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--vms-ink-muted)]">
                                Operations
                            </h3>
                            <dl className="divide-y divide-[var(--vms-line)]">
                                <Field label="Channel">
                                    {SOURCE_LABELS[data.source] ?? humanize(data.source)}
                                </Field>
                                <Field label="Created">{formatDateTime(data.created_at)}</Field>
                                <Field label="Stay status">
                                    {data.hospitality_stay_status
                                        ? humanize(data.hospitality_stay_status)
                                        : "Not started"}
                                </Field>
                            </dl>
                        </section>
                    </div>
                )}
            </Drawer>
        </>
    );
}
