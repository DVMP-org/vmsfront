"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DEFAULT_CURRENCY, formatMoney, toAmount } from "@/lib/currency";
import type { BookingChargeInput } from "../api-types";
import { useAddBookingCharge } from "../queries";

/** The things a property bills for most often, offered as one tap. */
const QUICK_ITEMS: Array<{
    label: string;
    category: NonNullable<BookingChargeInput["category"]>;
}> = [
        { label: "Restaurant", category: "service" },
        { label: "Laundry", category: "service" },
        { label: "Room service", category: "service" },
        { label: "Extra bedding", category: "service" },
        { label: "Damage charge", category: "charge" },
    ];

/**
 * Putting something the guest bought on their bill.
 *
 * This posts a folio line, so it needs a stay: the bill opens when a booking is
 * confirmed, and until then there is nothing to charge against. The total is
 * derived from quantity and unit price — the desk types what the receipt says
 * instead of doing arithmetic that later has to be explained.
 *
 * Shared by the drawer and the details page, so it owns no chrome.
 */
export function AddChargeForm({
    bookingId,
    currency,
    onDone,
    onCancel,
}: {
    bookingId: string;
    currency?: string;
    onDone?: () => void;
    onCancel?: () => void;
}) {
    const addCharge = useAddBookingCharge(bookingId);
    const [description, setDescription] = useState("");
    const [category, setCategory] =
        useState<NonNullable<BookingChargeInput["category"]>>("service");
    const [quantity, setQuantity] = useState("1");
    const [unitPrice, setUnitPrice] = useState("");
    const [error, setError] = useState<string | null>(null);

    const code = currency ?? DEFAULT_CURRENCY;
    const count = toAmount(quantity);
    const price = toAmount(unitPrice);
    const total = count !== null && price !== null ? count * price : null;
    const valid =
        description.trim().length > 0 &&
        count !== null &&
        count > 0 &&
        price !== null &&
        price >= 0 &&
        total !== null &&
        total > 0;

    async function submit() {
        setError(null);
        try {
            await addCharge.mutateAsync({
                description: description.trim(),
                category,
                quantity: quantity.trim(),
                unit_price: unitPrice.trim(),
            });
            onDone?.();
        } catch (cause) {
            setError(
                cause instanceof Error
                    ? cause.message
                    : "That charge could not be added.",
            );
        }
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-1.5">
                {QUICK_ITEMS.map((item) => (
                    <Button
                        key={item.label}
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                            setDescription(item.label);
                            setCategory(item.category);
                        }}
                    >
                        {item.label}
                    </Button>
                ))}
            </div>

            <div className="flex flex-col gap-1">
                <label
                    htmlFor="charge-description"
                    className="text-xs font-medium text-[var(--vms-ink)]"
                >
                    Item or service
                </label>
                <Input
                    id="charge-description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Restaurant — dinner for two"
                />
            </div>

            <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                    <label
                        htmlFor="charge-quantity"
                        className="text-xs font-medium text-[var(--vms-ink)]"
                    >
                        Quantity
                    </label>
                    <Input
                        id="charge-quantity"
                        inputMode="decimal"
                        value={quantity}
                        onChange={(event) => setQuantity(event.target.value)}
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <label
                        htmlFor="charge-unit-price"
                        className="text-xs font-medium text-[var(--vms-ink)]"
                    >
                        Unit price
                    </label>
                    <Input
                        id="charge-unit-price"
                        inputMode="decimal"
                        value={unitPrice}
                        onChange={(event) => setUnitPrice(event.target.value)}
                        placeholder="0.00"
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <label
                        htmlFor="charge-category"
                        className="text-xs font-medium text-[var(--vms-ink)]"
                    >
                        Category
                    </label>
                    <select
                        id="charge-category"
                        value={category}
                        onChange={(event) =>
                            setCategory(
                                event.target
                                    .value as NonNullable<BookingChargeInput["category"]>,
                            )
                        }
                        className="min-h-11 rounded-lg border border-[var(--vms-border)] bg-[var(--vms-surface)] px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-accent)]"
                    >
                        <option value="service">Service</option>
                        <option value="charge">Charge</option>
                        <option value="room">Room</option>
                    </select>
                </div>
            </div>

            <p className="text-[11px] text-[var(--vms-ink-muted)]">
                {code} · charged at the moment you save, against the stay this booking
                opened. It appears in the guest&apos;s folio immediately.
            </p>

            {error ? (
                <p role="alert" className="text-xs font-medium text-[var(--vms-danger)]">
                    {error}
                </p>
            ) : null}

            <div className="flex items-center justify-between gap-2">
                <span className="text-sm">
                    <span className="text-xs text-[var(--vms-ink-muted)]">Total </span>
                    <strong className="tabular-nums">
                        {total === null ? "—" : formatMoney(total, code)}
                    </strong>
                </span>
                <div className="flex items-center gap-2">
                    {onCancel ? (
                        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
                            Back
                        </Button>
                    ) : null}
                    <Button
                        type="button"
                        size="sm"
                        disabled={!valid || addCharge.isPending}
                        isLoading={addCharge.isPending}
                        onClick={() => void submit()}
                    >
                        Add to bill
                    </Button>
                </div>
            </div>
        </div>
    );
}
