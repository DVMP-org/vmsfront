"use client";

import Link from "next/link";
import { Mail } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { PanelState } from "@/features/dashboard/DashboardPrimitives";
import { formatDate, formatDateTime } from "@/lib/datetime";
import { useHospitalityGuest, useResendGuestOnboarding } from "../queries";
import { useHospitalityAccess } from "../use-hospitality-access";
import { GuestStatusBadge } from "./GuestStatusBadge";

/**
 * The quick answer about one guest: who they are, how to reach them, and when
 * they were last here. The full page carries the whole history.
 */
export function GuestQuickViewDrawer({
    guestId,
    onClose,
}: {
    guestId: string | null;
    onClose: () => void;
}) {
    const guest = useHospitalityGuest(guestId);
    const access = useHospitalityAccess();
    const resendOnboarding = useResendGuestOnboarding(guestId ?? "");
    const data = guest.data;

    if (!guestId) {
        return null;
    }

    if (guest.isPending || !data) {
        return (
            <PanelState
                kind={guest.isError ? "error" : "loading"}
                title={guest.isError ? "Guest could not be loaded" : "Loading guest"}
                description={
                    guest.isError
                        ? "The guest record is unavailable. Close this panel and try again."
                        : "Fetching contact details and stay history."
                }
            />
        );
    }

    const recent = data.stays.slice(-5).reverse();
    // A link exists only for a stay that has not ended, and only for a guest
    // the server can actually reach.
    const canResendOnboarding =
        access.allowed("update") &&
        Boolean(data.email) &&
        (data.stay_status === "reserved" || data.stay_status === "checked_in");

    return (
        <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
                <h3 className="text-lg font-semibold text-[var(--vms-ink)]">
                    {data.display_name}
                </h3>
                <p className="text-sm text-[var(--vms-ink-muted)]">
                    {data.email || data.phone || "No contact recorded"}
                </p>
            </div>

            <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                    <dt className="text-xs text-[var(--vms-ink-muted)]">Phone</dt>
                    <dd>{data.phone || "—"}</dd>
                </div>
                <div>
                    <dt className="text-xs text-[var(--vms-ink-muted)]">Stays at this Site</dt>
                    <dd className="tabular-nums">{data.stays_count}</dd>
                </div>
                <div>
                    <dt className="text-xs text-[var(--vms-ink-muted)]">Latest stay</dt>
                    <dd>
                        <GuestStatusBadge status={data.stay_status} />
                    </dd>
                </div>
                <div>
                    <dt className="text-xs text-[var(--vms-ink-muted)]">Arrival</dt>
                    <dd>
                        {data.planned_check_in
                            ? formatDate(data.planned_check_in)
                            : "—"}
                    </dd>
                </div>
                <div>
                    <dt className="text-xs text-[var(--vms-ink-muted)]">Departure</dt>
                    <dd>
                        {data.planned_check_out
                            ? formatDate(data.planned_check_out)
                            : "—"}
                    </dd>
                </div>
                <div>
                    <dt className="text-xs text-[var(--vms-ink-muted)]">Checked in</dt>
                    <dd>
                        {data.actual_check_in
                            ? formatDateTime(data.actual_check_in)
                            : "—"}
                    </dd>
                </div>
            </dl>

            <section className="flex flex-col gap-2">
                <h4 className="text-sm font-semibold text-[var(--vms-ink)]">
                    Recent stays
                </h4>
                {recent.length === 0 ? (
                    <p className="text-sm text-[var(--vms-ink-muted)]">
                        No stays recorded at this Site.
                    </p>
                ) : (
                    <ul className="flex flex-col divide-y divide-[var(--vms-line)] rounded-lg border border-[var(--vms-line)]">
                        {recent.map((stay) => {
                            const room = stay.room_assignments.at(-1)?.room.name;
                            return (
                                <li
                                    key={stay.id}
                                    className="flex flex-col gap-1 px-3 py-2.5 text-sm"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span>
                                            {formatDate(stay.planned_check_in)} →{" "}
                                            {formatDate(stay.planned_check_out)}
                                        </span>
                                        <GuestStatusBadge status={stay.status} />
                                    </div>
                                    <span className="text-xs text-[var(--vms-ink-muted)]">
                                        {room ? `Room ${room}` : "No room assigned"}
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>

            <div className="flex flex-wrap items-center justify-end gap-2">
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
                <Button type="button" variant="ghost" onClick={onClose}>
                    Close
                </Button>
                <Button asChild>
                    <Link href={`/admin/hospitality/guests/${data.party_id}`}>
                        View full details →
                    </Link>
                </Button>
            </div>
        </div>
    );
}
