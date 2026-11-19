"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { PanelState } from "@/features/dashboard/DashboardPrimitives";
import { formatMoney } from "@/lib/currency";
import { formatDateTime } from "@/lib/datetime";
import { humanize } from "@/lib/strings";
import { AddChargeDialog } from "../AddChargeDialog";
import type { BookingDetailDto } from "../../api-types";
import { useBookingFolio } from "../../queries";

const CATEGORY_LABEL: Record<string, string> = {
    room: "Accommodation",
    service: "Service",
    charge: "Charge",
    payment: "Payment",
};

/**
 * The guest's bill, line by line.
 *
 * The folio is the single record of what a stay costs and what has been paid —
 * the accommodation the booking agreed, everything bought since, and every
 * payment taken — so this tab shows it rather than a second summary that could
 * drift from it. Additional charges are added here, straight onto the same bill.
 *
 * Loaded when the tab is opened: a register of bookings must not download every
 * guest's line items to draw a table.
 */
export function BookingFolioSection({
    booking,
}: {
    booking: BookingDetailDto;
}) {
    const folio = useBookingFolio(booking.id);
    const [charging, setCharging] = useState(false);

    const currency = folio.data?.currency ?? booking.financials?.currency;

    return (
        <section aria-label="Guest folio" className="flex flex-col gap-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--vms-ink-muted)]">
                        Guest bill
                    </h3>
                    <p className="text-xs text-[var(--vms-ink-muted)]">
                        What the stay costs, what was bought on top, and what has been paid.
                    </p>
                </div>
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={!booking.financials?.billed}
                    onClick={() => setCharging(true)}
                >
                    Add charge
                </Button>
            </div>

            {!booking.financials?.billed ? (
                <PanelState
                    kind="empty"
                    compact
                    title="The bill opens when the booking is confirmed"
                    description="Confirmation creates the stay, and the stay owns the guest's folio."
                />
            ) : folio.isPending ? (
                <PanelState
                    kind="loading"
                    compact
                    title="Loading the bill"
                    description="Fetching the folio lines."
                />
            ) : folio.isError || !folio.data ? (
                <PanelState
                    kind="error"
                    compact
                    title="The bill could not be loaded"
                    description="Try again — the booking itself is unaffected."
                    onRetry={() => void folio.refetch()}
                />
            ) : (
                <>
                    <dl className="grid grid-cols-2 gap-3 rounded-lg border border-[var(--vms-line)] px-3 py-2 text-sm sm:grid-cols-4">
                        <div className="flex flex-col">
                            <dt className="text-[11px] uppercase tracking-wide text-[var(--vms-ink-muted)]">
                                Charged
                            </dt>
                            <dd className="tabular-nums">
                                {formatMoney(folio.data.total, folio.data.currency)}
                            </dd>
                        </div>
                        <div className="flex flex-col">
                            <dt className="text-[11px] uppercase tracking-wide text-[var(--vms-ink-muted)]">
                                Paid
                            </dt>
                            <dd className="tabular-nums">
                                {formatMoney(folio.data.paid, folio.data.currency)}
                            </dd>
                        </div>
                        <div className="flex flex-col">
                            <dt className="text-[11px] uppercase tracking-wide text-[var(--vms-ink-muted)]">
                                Balance
                            </dt>
                            <dd className="font-medium tabular-nums">
                                {formatMoney(folio.data.balance, folio.data.currency)}
                            </dd>
                        </div>
                        <div className="flex flex-col">
                            <dt className="text-[11px] uppercase tracking-wide text-[var(--vms-ink-muted)]">
                                Status
                            </dt>
                            <dd className="capitalize">{humanize(folio.data.status)}</dd>
                        </div>
                    </dl>

                    {folio.data.lines.length === 0 ? (
                        <PanelState
                            kind="empty"
                            compact
                            title="Nothing on the bill yet"
                            description="Charges and payments appear here as they are posted."
                        />
                    ) : (
                        <ul className="flex flex-col divide-y divide-[var(--vms-line)]">
                            {folio.data.lines.map((line) => (
                                <li
                                    key={line.id}
                                    className="flex items-baseline justify-between gap-3 py-2 text-sm"
                                >
                                    <span className="min-w-0">
                                        <span className="font-medium text-[var(--vms-ink)]">
                                            {line.description}
                                        </span>
                                        <span className="block text-xs text-[var(--vms-ink-muted)]">
                                            {CATEGORY_LABEL[line.category] ?? humanize(line.category)} ·{" "}
                                            {formatDateTime(line.created_at)}
                                        </span>
                                    </span>
                                    <span
                                        className={
                                            line.category === "payment"
                                                ? "shrink-0 tabular-nums text-[var(--vms-success)]"
                                                : "shrink-0 tabular-nums text-[var(--vms-ink)]"
                                        }
                                    >
                                        {line.category === "payment" ? "−" : ""}
                                        {formatMoney(line.amount, line.currency)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </>
            )}

            <AddChargeDialog
                isOpen={charging}
                onClose={() => setCharging(false)}
                bookingId={booking.id}
                currency={currency}
            />
        </section>
    );
}
