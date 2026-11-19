"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Mail } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { PanelState } from "@/features/dashboard/DashboardPrimitives";
import { formatDate, formatDateTime } from "@/lib/datetime";
import { useHospitalityGuest, useResendGuestOnboarding } from "../queries";
import { useHospitalityAccess } from "../use-hospitality-access";
import { GuestStatusBadge } from "./GuestStatusBadge";

/**
 * One guest, at their own address.
 *
 * A return guest is a relationship with a history, not a row on the last stay.
 * The page keeps the contact details and every stay this Site has recorded, so
 * the desk does not have to reconstruct it from the bookings register.
 */
export function GuestDetailsScreen({ guestId }: { guestId: string }) {
    const guest = useHospitalityGuest(guestId);
    const access = useHospitalityAccess();
    const resendOnboarding = useResendGuestOnboarding(guestId);
    const data = guest.data;

    if (guest.isPending || !data) {
        return (
            <PanelState
                kind={guest.isError ? "error" : "loading"}
                title={guest.isError ? "Guest could not be loaded" : "Loading guest"}
                description={
                    guest.isError
                        ? "The guest record is unavailable. Retry, or return to the directory."
                        : "Fetching contact details and stay history."
                }
            />
        );
    }

    const stays = [...data.stays].reverse();
    const canResendOnboarding =
        access.allowed("update") &&
        Boolean(data.email) &&
        (data.stay_status === "reserved" || data.stay_status === "checked_in");

    return (
        <div className="flex flex-col gap-5">
            <PageHeader
                eyebrow="Hospitality guest"
                title={data.display_name}
                description={
                    data.email || data.phone
                        ? [data.email, data.phone].filter(Boolean).join(" · ")
                        : "No contact details recorded."
                }
                secondaryActions={
                    <div className="flex flex-wrap items-center gap-2">
                        {canResendOnboarding ? (
                            <Button
                                type="button"
                                variant="outline"
                                isLoading={resendOnboarding.isPending}
                                onClick={() => resendOnboarding.mutate()}
                            >
                                <Mail className="size-4" aria-hidden />
                                Resend magic link
                            </Button>
                        ) : null}
                        <Button asChild variant="outline">
                            <Link href="/admin/hospitality/guests">
                                Back to guests
                            </Link>
                        </Button>
                    </div>
                }
            />

            <section
                aria-label="Guest details"
                className="grid gap-3 rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-4 sm:grid-cols-2 xl:grid-cols-4"
            >
                <Fact label="Email" value={data.email || "—"} />
                <Fact label="Phone" value={data.phone || "—"} />
                <Fact
                    label="Stays at this Site"
                    value={String(data.stays_count)}
                />
                <Fact
                    label="Account"
                    value={data.is_active ? "Active" : "Inactive"}
                />
                <Fact
                    label="Latest stay"
                    value={<GuestStatusBadge status={data.stay_status} />}
                />
                <Fact
                    label="Arrival"
                    value={
                        data.planned_check_in
                            ? formatDate(data.planned_check_in)
                            : "—"
                    }
                />
                <Fact
                    label="Departure"
                    value={
                        data.planned_check_out
                            ? formatDate(data.planned_check_out)
                            : "—"
                    }
                />
                <Fact
                    label="Checked in"
                    value={
                        data.actual_check_in
                            ? formatDateTime(data.actual_check_in)
                            : "—"
                    }
                />
            </section>

            <section aria-label="Stay history" className="flex flex-col gap-3">
                <div className="flex flex-wrap items-end justify-between gap-2">
                    <div>
                        <h2 className="text-lg font-semibold text-[var(--vms-ink)]">
                            Stay history
                        </h2>
                        <p className="text-sm text-[var(--vms-ink-muted)]">
                            Every stay this Site has recorded for this guest.
                        </p>
                    </div>
                    <span className="text-sm text-[var(--vms-ink-muted)]">
                        {data.stays_count}{" "}
                        {data.stays_count === 1 ? "stay" : "stays"}
                    </span>
                </div>

                {stays.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-[var(--vms-line)] px-4 py-8 text-center text-sm text-[var(--vms-ink-muted)]">
                        No stays recorded at this Site yet.
                    </p>
                ) : (
                    <ul className="flex flex-col divide-y divide-[var(--vms-line)] overflow-hidden rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)]">
                        {stays.map((stay) => {
                            const room = stay.room_assignments.at(-1)?.room.name;
                            return (
                                <li
                                    key={stay.id}
                                    className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-sm font-medium text-[var(--vms-ink)]">
                                            {formatDate(stay.planned_check_in)} →{" "}
                                            {formatDate(stay.planned_check_out)}
                                        </span>
                                        <span className="text-xs text-[var(--vms-ink-muted)]">
                                            {room ? `Room ${room}` : "No room assigned"}
                                            {stay.actual_check_in
                                                ? ` · checked in ${formatDateTime(stay.actual_check_in)}`
                                                : ""}
                                            {stay.actual_check_out
                                                ? ` · checked out ${formatDateTime(stay.actual_check_out)}`
                                                : ""}
                                        </span>
                                    </div>
                                    <GuestStatusBadge status={stay.status} />
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>
        </div>
    );
}

function Fact({
    label,
    value,
}: {
    label: string;
    value: ReactNode;
}) {
    return (
        <div className="flex flex-col gap-0.5">
            <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--vms-ink-muted)]">
                {label}
            </dt>
            <dd className="text-sm text-[var(--vms-ink)]">{value}</dd>
        </div>
    );
}
