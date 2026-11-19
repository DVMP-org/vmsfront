"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import {
    DataTable,
    type Column,
    type FilterConfig,
} from "@/components/ui/DataTable";
import { Drawer } from "@/components/ui/Drawer";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatDate } from "@/lib/datetime";
import type { GuestSummary, StayStatus } from "../contracts";
import { useHospitalityGuests } from "../queries";
import { GuestQuickViewDrawer } from "./GuestQuickViewDrawer";
import { GuestStatusBadge } from "./GuestStatusBadge";

const PAGE_SIZE = 20;

const STATUS_OPTIONS: Array<{ value: StayStatus; label: string }> = [
    { value: "reserved", label: "Reserved" },
    { value: "checked_in", label: "Checked in" },
    { value: "checked_out", label: "Checked out" },
    { value: "cancelled", label: "Cancelled" },
    { value: "no_show", label: "No show" },
];

/**
 * Everyone who has stayed, or is due to stay, at this Site.
 *
 * One row per person, not per stay: a returning guest is the same person, and
 * the directory's job is to answer "who is this and when were they here?".
 * Opening a row is a drawer for the common questions; the guest keeps a full
 * address for the work that needs the whole history.
 */
export function GuestsDirectory() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [openGuestId, setOpenGuestId] = useState<string | null>(null);

    const list = useHospitalityGuests({
        page,
        page_size: PAGE_SIZE,
        ...(search.trim() ? { search: search.trim() } : {}),
        ...(status ? { status } : {}),
    });
    const guests = list.data?.items ?? [];

    const filters: FilterConfig[] = status
        ? [{ field: "status", operator: "eq", value: status }]
        : [];

    const columns: Column<GuestSummary>[] = [
        {
            key: "guest",
            header: "Guest",
            minWidth: 200,
            accessor: (guest) => (
                <div className="flex flex-col gap-0.5">
                    <Link
                        href={`/admin/hospitality/guests/${guest.party_id}`}
                        className="font-medium text-[var(--vms-ink)] underline-offset-2 hover:underline"
                    >
                        {guest.display_name}
                    </Link>
                    <span className="text-xs text-[var(--vms-ink-muted)]">
                        {guest.email || "No email recorded"}
                    </span>
                </div>
            ),
        },
        {
            key: "phone",
            header: "Phone",
            minWidth: 140,
            accessor: (guest) => (
                <span className="text-sm">
                    {guest.phone || (
                        <span className="text-[var(--vms-ink-muted)]">—</span>
                    )}
                </span>
            ),
        },
        {
            key: "stays",
            header: "Stays",
            minWidth: 90,
            accessor: (guest) => (
                <span className="tabular-nums">{guest.stays_count}</span>
            ),
        },
        {
            key: "latest",
            header: "Latest stay",
            minWidth: 190,
            accessor: (guest) => (
                <div className="flex flex-col items-start gap-1">
                    <GuestStatusBadge status={guest.stay_status} />
                    {guest.planned_check_in ? (
                        <span className="text-[11px] text-[var(--vms-ink-muted)]">
                            {formatDate(guest.planned_check_in)}
                            {guest.planned_check_out
                                ? ` → ${formatDate(guest.planned_check_out)}`
                                : ""}
                        </span>
                    ) : null}
                </div>
            ),
        },
        {
            key: "open",
            header: "",
            minWidth: 90,
            mobileHide: true,
            accessor: (guest) => (
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setOpenGuestId(guest.party_id)}
                    aria-label={`Open the guest record for ${guest.display_name}`}
                >
                    Open
                </Button>
            ),
        },
    ];

    return (
        <div className="flex flex-col gap-4">
            <PageHeader
                eyebrow="Hospitality"
                title="Guests"
                description="People who have stayed, or are due to stay, at this Site. Open a guest for contact details and every stay on record."
            />

            <DataTable
                card
                data={guests}
                columns={columns}
                getRowId={(guest) => guest.party_id}
                tableLabel="Site guests"
                searchPlaceholder="Search by name, email or phone"
                serverSide
                total={list.data?.total ?? 0}
                currentPage={page}
                onPageChange={setPage}
                pageSize={PAGE_SIZE}
                pageSizeOptions={[PAGE_SIZE]}
                onSearchChange={(value) => {
                    setSearch(value);
                    setPage(1);
                }}
                disableClientSideFiltering
                disableClientSideSorting
                availableFilters={[
                    {
                        field: "status",
                        label: "Latest stay",
                        type: "select",
                        options: STATUS_OPTIONS,
                    },
                ]}
                initialFilters={filters}
                onFiltersChange={(next) => {
                    const selected = next.find((filter) => filter.field === "status");
                    setStatus(
                        typeof selected?.value === "string" ? selected.value : "",
                    );
                    setPage(1);
                }}
                isLoading={list.isPending}
                isStale={list.isError && guests.length > 0}
                errorMessage={
                    list.isError && guests.length === 0
                        ? "Guests could not be loaded."
                        : null
                }
                onRetry={() => void list.refetch()}
                emptyMessage="No guests match this view yet."
                mobileSummary={(guest) => (
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-3">
                            <span className="font-medium">{guest.display_name}</span>
                            <GuestStatusBadge status={guest.stay_status} />
                        </div>
                        <span className="text-xs text-[var(--vms-ink-muted)]">
                            {guest.email || guest.phone || "No contact recorded"}
                        </span>
                        <span className="text-xs text-[var(--vms-ink-muted)]">
                            {guest.stays_count} {guest.stays_count === 1 ? "stay" : "stays"}
                        </span>
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setOpenGuestId(guest.party_id)}
                        >
                            Open guest
                        </Button>
                    </div>
                )}
            />

            <Drawer
                isOpen={Boolean(openGuestId)}
                onClose={() => setOpenGuestId(null)}
                title="Guest"
                description="Contact details and stay history."
            >
                <GuestQuickViewDrawer
                    guestId={openGuestId}
                    onClose={() => setOpenGuestId(null)}
                />
            </Drawer>
        </div>
    );
}
