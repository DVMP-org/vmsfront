"use client";

import { CalendarClock, DoorOpen, ReceiptText } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { formatDate, formatDateTime } from "@/lib/datetime";
import { parseApiError } from "@/lib/error-utils";
import type { Stay } from "@/features/hospitality/contracts";
import { GuestStatusBadge } from "@/features/hospitality/components/GuestStatusBadge";
import { GuestStayFolio } from "./GuestStayFolio";
import { useGuestStays } from "./queries";

const STAY_RANK: Record<string, number> = {
    checked_in: 0,
    reserved: 1,
    checked_out: 2,
};

/**
 * The guest's bill, as its own page.
 *
 * The desk's folio and the guest's bill are the same record; this page only
 * chooses which stays to show and how to frame them. It never recalculates a
 * total, so the number the guest sees is the number the hotel will settle.
 */
export function GuestStayBill({ placeId }: { placeId: string }) {
    const stays = useGuestStays();
    const items = [...(stays.data?.items || [])]
        .filter((stay) =>
            stay.room_assignments.some(
                (assignment) => assignment.room.id === placeId,
            ),
        )
        .sort(
            (left, right) =>
                (STAY_RANK[left.status] ?? 3) - (STAY_RANK[right.status] ?? 3) ||
                new Date(right.planned_check_in).getTime() -
                new Date(left.planned_check_in).getTime(),
        );

    if (stays.isPending) {
        return (
            <div className="flex flex-col gap-4">
                {[0, 1].map((row) => (
                    <div
                        key={row}
                        className="h-56 animate-pulse rounded-[var(--vms-radius-surface)] bg-[var(--vms-surface-subtle)] motion-reduce:animate-none"
                    />
                ))}
            </div>
        );
    }

    if (stays.isError) {
        return (
            <section
                role="alert"
                className="rounded-[var(--vms-radius-surface)] border border-[color-mix(in_srgb,var(--vms-danger)_35%,white)] bg-[var(--vms-danger-subtle)] p-5 text-sm text-[var(--vms-danger)]"
            >
                <p className="font-semibold">Your bill could not be loaded</p>
                <p className="mt-1">{parseApiError(stays.error).message}</p>
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="mt-3"
                    onClick={() => stays.refetch()}
                >
                    Try again
                </Button>
            </section>
        );
    }

    if (!items.length) {
        return (
            <section className="rounded-[var(--vms-radius-surface)] border border-dashed border-[var(--vms-line)] px-6 py-12 text-center">
                <ReceiptText
                    aria-hidden
                    className="mx-auto h-8 w-8 text-[var(--vms-ink-muted)]"
                />
                <h2 className="mt-3 text-sm font-semibold text-[var(--vms-ink)]">
                    No stay bill yet
                </h2>
                <p className="mx-auto mt-1 max-w-md text-sm text-[var(--vms-ink-muted)]">
                    Charges and payments appear here once the hotel opens your stay
                    account.
                </p>
            </section>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {items.map((stay) => {
                const room = currentRoom(stay);
                return (
                    <section
                        key={stay.id}
                        aria-labelledby={`guest-bill-${stay.id}`}
                        className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)]"
                    >
                        <header className="flex flex-col gap-3 border-b border-[var(--vms-line)] p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <GuestStatusBadge status={stay.status} />
                                    <span className="text-xs text-[var(--vms-ink-muted)]">
                                        {stay.guests
                                            .map((guest) => guest.party.display_name)
                                            .join(", ")}
                                    </span>
                                </div>
                                <h2
                                    id={`guest-bill-${stay.id}`}
                                    className="mt-2 flex items-center gap-2 text-base font-semibold text-[var(--vms-ink)]"
                                >
                                    <DoorOpen aria-hidden className="h-4 w-4" />
                                    {room?.room.name ?? "Room not assigned"}
                                </h2>
                            </div>
                            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:text-right">
                                <div>
                                    <dt className="text-[11px] uppercase tracking-[0.08em] text-[var(--vms-ink-muted)]">
                                        Arrival
                                    </dt>
                                    <dd className="mt-0.5 font-medium">
                                        {formatDate(stay.planned_check_in)}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-[11px] uppercase tracking-[0.08em] text-[var(--vms-ink-muted)]">
                                        Departure
                                    </dt>
                                    <dd className="mt-0.5 font-medium">
                                        {formatDate(stay.planned_check_out)}
                                    </dd>
                                </div>
                                {stay.actual_check_in ? (
                                    <div className="col-span-2">
                                        <dt className="text-[11px] uppercase tracking-[0.08em] text-[var(--vms-ink-muted)]">
                                            Checked in
                                        </dt>
                                        <dd className="mt-0.5 inline-flex items-center gap-1.5 font-medium">
                                            <CalendarClock aria-hidden className="h-3.5 w-3.5" />
                                            {formatDateTime(stay.actual_check_in)}
                                        </dd>
                                    </div>
                                ) : null}
                            </dl>
                        </header>
                        <div className="p-4 sm:p-5">
                            <GuestStayFolio stayId={stay.id} />
                        </div>
                    </section>
                );
            })}
        </div>
    );
}

function currentRoom(stay: Stay) {
    const now = Date.now();
    return [...stay.room_assignments]
        .reverse()
        .find(
            (assignment) =>
                new Date(assignment.assigned_from).getTime() <= now &&
                (!assignment.assigned_to ||
                    new Date(assignment.assigned_to).getTime() > now),
        );
}
