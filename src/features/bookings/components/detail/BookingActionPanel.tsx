"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Sparkles, UserRound } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { formatMoney } from "@/lib/currency";
import { GuestQuickViewDrawer } from "@/features/hospitality/components/GuestQuickViewDrawer";
import { HousekeepingDrawer } from "@/features/hospitality/components/HousekeepingDrawer";
import { useHousekeepingAssignees } from "@/features/hospitality/queries";
import { useHospitalityAccess } from "@/features/hospitality/use-hospitality-access";
import { AddChargeDialog } from "../AddChargeDialog";
import { BookingEditDialog } from "../BookingEditDialog";
import { RecordPaymentDialog } from "../RecordPaymentDialog";
import type { BookingDetailDto } from "../../api-types";
import { bookingGuestPartyId, bookingRoomPlaceId } from "../../lib";
import { BookingDetailActions } from "./BookingDetailActions";
import { BookingStayActions } from "./BookingStayActions";

/**
 * Everything a desk may do without leaving this stay.
 *
 * A detail page is where work happens, not a summary with a link to the real
 * screen. Guest history, room housekeeping, the bill and the stay transitions
 * already exist as their own components; this panel opens them here so an
 * operator answering a call does not lose the booking they are looking at.
 *
 * Each action is the existing implementation, not a second one. Approve,
 * cancel, check-in, add a charge and record a payment all call the same hooks
 * and forms as their home screens, which is what keeps a detail page from
 * drifting into a parallel feature.
 */
export function BookingActionPanel({
    booking,
    balance,
}: {
    booking: BookingDetailDto;
    /** Payments-derived balance, used when no priced folio exists yet. */
    balance?: string | number | null;
}) {
    const access = useHospitalityAccess();
    const guestPartyId = bookingGuestPartyId(booking);
    const roomPlaceId = bookingRoomPlaceId(booking);
    const isHospitality = booking.domain === "hospitality";

    const [guestOpen, setGuestOpen] = useState(false);
    const [housekeepingRoomId, setHousekeepingRoomId] = useState<string | null>(
        null,
    );
    const [editing, setEditing] = useState(false);
    const [charging, setCharging] = useState(false);
    const [paying, setPaying] = useState(false);

    const assignees = useHousekeepingAssignees(
        access.contextKey,
        isHospitality &&
        Boolean(access.organization?.id) &&
        access.allowed("list"),
    );

    const currency = booking.financials?.currency ?? booking.currency;
    const billed = Boolean(booking.financials?.billed);
    const priced = Boolean(booking.financials?.priced);
    const hasGuestOrRoom =
        isHospitality && (Boolean(guestPartyId) || Boolean(roomPlaceId));

    return (
        <>
            <div className="flex flex-col gap-4 rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-4">
                <h2 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--vms-ink-muted)]">
                    Actions
                </h2>

                {hasGuestOrRoom ? (
                    <section
                        aria-label="Guest and room actions"
                        className="flex flex-col gap-2"
                    >
                        <h3 className="text-xs font-semibold text-[var(--vms-ink)]">
                            Guest & room
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {guestPartyId ? (
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    leftNode={<UserRound className="h-4 w-4" aria-hidden />}
                                    tooltip="Contact details and every stay this guest has had"
                                    onClick={() => setGuestOpen(true)}
                                >
                                    Guest details
                                </Button>
                            ) : null}
                            {roomPlaceId ? (
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    leftNode={<Sparkles className="h-4 w-4" aria-hidden />}
                                    tooltip="Current state, assignment and housekeeping history for this room"
                                    onClick={() => setHousekeepingRoomId(roomPlaceId)}
                                >
                                    Housekeeping
                                </Button>
                            ) : null}
                        </div>
                        {guestPartyId ? (
                            <Link
                                href={`/admin/hospitality/guests/${guestPartyId}`}
                                className="inline-flex w-fit items-center gap-1 text-xs font-medium text-[var(--vms-ink-muted)] hover:text-[var(--vms-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]"
                            >
                                Open full guest record
                                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                            </Link>
                        ) : null}
                    </section>
                ) : null}

                <section aria-label="Stay actions" className="flex flex-col gap-2">
                    <h3 className="text-xs font-semibold text-[var(--vms-ink)]">Stay</h3>
                    <BookingStayActions booking={booking} />
                    <BookingDetailActions booking={booking} />
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setEditing(true)}
                    >
                        Edit booking
                    </Button>
                </section>

                {billed || priced ? (
                    <section aria-label="Money actions" className="flex flex-col gap-2">
                        <h3 className="text-xs font-semibold text-[var(--vms-ink)]">Money</h3>
                        <div className="flex flex-wrap gap-2">
                            {billed ? (
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    tooltip="Post something bought during the stay onto the guest's bill"
                                    onClick={() => setCharging(true)}
                                >
                                    Add charge
                                </Button>
                            ) : null}
                            {priced ? (
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    tooltip="Cash, transfer or POS taken outside the online checkout"
                                    onClick={() => setPaying(true)}
                                >
                                    Record payment
                                </Button>
                            ) : null}
                        </div>
                    </section>
                ) : null}

                {booking.payment_status ? (
                    <p className="text-xs text-[var(--vms-ink-muted)]">
                        Payment marked {booking.payment_status}
                    </p>
                ) : null}

                <dl className="flex flex-col gap-2 border-t border-[var(--vms-line)] pt-3 text-sm">
                    {booking.financials ? (
                        <>
                            <div className="flex items-baseline justify-between gap-2">
                                <dt className="text-xs text-[var(--vms-ink-muted)]">
                                    Accommodation
                                </dt>
                                <dd className="tabular-nums">
                                    {formatMoney(
                                        booking.financials.accommodation,
                                        booking.financials.currency,
                                    )}
                                </dd>
                            </div>
                            <div className="flex items-baseline justify-between gap-2">
                                <dt className="text-xs text-[var(--vms-ink-muted)]">
                                    Additional charges
                                </dt>
                                <dd className="tabular-nums">
                                    {formatMoney(
                                        booking.financials.additional,
                                        booking.financials.currency,
                                    )}
                                </dd>
                            </div>
                            <div className="flex items-baseline justify-between gap-2 border-t border-[var(--vms-line)] pt-2">
                                <dt className="text-xs text-[var(--vms-ink-muted)]">
                                    Total payable
                                </dt>
                                <dd className="font-medium tabular-nums">
                                    {formatMoney(
                                        booking.financials.total,
                                        booking.financials.currency,
                                    )}
                                </dd>
                            </div>
                            <div className="flex items-baseline justify-between gap-2">
                                <dt className="text-xs text-[var(--vms-ink-muted)]">Paid</dt>
                                <dd className="tabular-nums">
                                    {formatMoney(
                                        booking.financials.paid,
                                        booking.financials.currency,
                                    )}
                                </dd>
                            </div>
                            <div className="flex items-baseline justify-between gap-2">
                                <dt className="text-xs text-[var(--vms-ink-muted)]">
                                    Outstanding
                                </dt>
                                <dd className="font-medium tabular-nums">
                                    {formatMoney(
                                        booking.financials.balance,
                                        booking.financials.currency,
                                    )}
                                </dd>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex items-baseline justify-between gap-2">
                                <dt className="text-xs text-[var(--vms-ink-muted)]">Agreed</dt>
                                <dd className="font-medium text-[var(--vms-ink)]">
                                    {booking.total === null
                                        ? "—"
                                        : formatMoney(booking.total, booking.currency)}
                                </dd>
                            </div>
                            <div className="flex items-baseline justify-between gap-2">
                                <dt className="text-xs text-[var(--vms-ink-muted)]">Balance</dt>
                                <dd className="font-medium text-[var(--vms-ink)]">
                                    {balance === null || balance === undefined
                                        ? "—"
                                        : formatMoney(balance, booking.currency)}
                                </dd>
                            </div>
                        </>
                    )}
                </dl>
            </div>

            <Drawer
                isOpen={guestOpen}
                onClose={() => setGuestOpen(false)}
                title="Guest"
                description="Contact details and stay history."
            >
                <GuestQuickViewDrawer
                    guestId={guestOpen ? guestPartyId : null}
                    onClose={() => setGuestOpen(false)}
                />
            </Drawer>

            <HousekeepingDrawer
                roomId={housekeepingRoomId}
                contextKey={access.contextKey}
                onClose={() => setHousekeepingRoomId(null)}
                canEdit={access.allowed("update")}
                assignees={assignees}
            />

            <BookingEditDialog
                isOpen={editing}
                onClose={() => setEditing(false)}
                booking={booking}
            />

            <AddChargeDialog
                isOpen={charging}
                onClose={() => setCharging(false)}
                bookingId={booking.id}
                currency={currency}
            />

            <RecordPaymentDialog
                isOpen={paying}
                onClose={() => setPaying(false)}
                bookingId={booking.id}
                currency={currency}
                balance={booking.financials?.balance ?? null}
            />
        </>
    );
}
