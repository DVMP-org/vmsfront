"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  DataTable,
  type Column,
  type FilterConfig,
} from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { useWorkspaceContext } from "@/features/context/use-workspace-context";
import { formatDateTime } from "@/lib/datetime";
import { BookingCreateForm } from "./BookingCreateForm";
import { BookingPageLink } from "./BookingPageLink";
import { BookingStatusBadge } from "./BookingStatusBadge";
import { RequesterCell } from "./RequesterCell";
import { filterValue } from "../lib";
import type { BookingDto, BookingListParams } from "../api-types";
import { useBookings } from "../queries";

const PAGE_SIZE = 20;

const KIND_LABELS: Record<string, string> = {
  booking: "Booking",
  reservation: "Reservation",
};

const SOURCE_LABELS: Record<string, string> = {
  public: "Public page",
  phone: "Phone",
  walk_in: "Walk-in",
  staff: "Staff",
};

/**
 * One Site's booking register.
 *
 * The Site comes from the API client's selected Site, so this page can never
 * show another Site's bookings even by accident.
 *
 * Both bookings and reservations live here. A reservation is not a different
 * entity — it is a booking whose room is not named yet — so the register shows
 * one list and the Kind filter is what narrows it. Two screens would have made a
 * desk check two places to answer one question.
 *
 * Search and filters run on the server, because the list is paged: filtering
 * only the twenty rows on screen would quietly hide a match on page two. The
 * table is told not to filter client-side for exactly that reason.
 *
 * The detail lives on its own route, so opening a booking is a navigation rather
 * than a panel: an address can be shared, reloaded and linked to from a call.
 */
export function BookingsRegister() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<FilterConfig[]>([]);
  const [creating, setCreating] = useState(false);

  const context = useWorkspaceContext();
  const siteSlug = context.data?.site_slug ?? null;

  const params: BookingListParams = useMemo(() => {
    const kind = filterValue(filters, "kind");
    const status = filterValue(filters, "status");
    const source = filterValue(filters, "source");
    return {
      page,
      page_size: PAGE_SIZE,
      ...(search.trim() ? { search: search.trim() } : {}),
      ...(kind ? { kind: kind as BookingListParams["kind"] } : {}),
      ...(status ? { status: status as BookingListParams["status"] } : {}),
      ...(source ? { source: source as BookingListParams["source"] } : {}),
    };
  }, [page, search, filters]);

  const list = useBookings(params);
  const bookings = list.data?.items ?? [];

  const columns: Column<BookingDto>[] = [
    {
      key: "requester",
      header: "Guest",
      minWidth: 200,
      accessor: (booking) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium">{booking.requester_name}</span>
          <span className="text-xs text-[var(--vms-ink-muted)]">
            {booking.requester_email || booking.requester_phone || "No contact"}
          </span>
        </div>
      ),
    },
    {
      key: "kind",
      header: "Kind",
      minWidth: 110,
      accessor: (booking) => KIND_LABELS[booking.kind] ?? booking.kind,
    },
    {
      key: "window",
      header: "Stay",
      minWidth: 190,
      accessor: (booking) => (
        <div className="flex flex-col gap-0.5 text-xs">
          <span>{formatDateTime(booking.check_in_at)}</span>
          <span className="text-[var(--vms-ink-muted)]">
            to {formatDateTime(booking.check_out_at)}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      minWidth: 140,
      accessor: (booking) => <BookingStatusBadge status={booking.status} />,
    },
    {
      key: "source",
      header: "Channel",
      minWidth: 110,
      hiddenByDefault: true,
      accessor: (booking) => SOURCE_LABELS[booking.source] ?? booking.source,
    },
    {
      key: "guest_count",
      header: "Guests",
      minWidth: 80,
      accessor: (booking) => String(booking.guest_count),
    },
    {
      key: "open",
      header: "",
      minWidth: 90,
      mobileHide: true,
      accessor: (booking) => (
        <Link
          href={`/admin/bookings/${booking.id}`}
          className="inline-flex min-h-9 items-center rounded-lg border border-[var(--vms-border)] px-3 text-xs font-semibold text-[var(--vms-ink)] hover:bg-[var(--vms-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-accent)]"
          aria-label={`Open the booking from ${booking.requester_name}`}
        >
          Open
        </Link>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <header className="flex flex-col gap-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-lg font-semibold text-[var(--vms-ink)]">
                Bookings
              </h1>
              <p className="text-xs text-[var(--vms-ink-muted)]">
                Every booking and reservation at this Site, with who asked and
                what was decided.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setCreating(true)}
            >
              New booking
            </Button>
          </div>
          <BookingPageLink siteSlug={siteSlug} />
        </header>

        <DataTable
          data={bookings}
          columns={columns}
          getRowId={(booking) => booking.id}
          tableLabel="Site bookings"
          searchPlaceholder="Search by guest name, email or phone"
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
          /* The server applies the filters, so the table must not apply them a
             second time to the twenty rows it was given. */
          disableClientSideFiltering
          disableClientSideSorting
          availableFilters={[
            {
              field: "kind",
              label: "Kind",
              type: "select",
              options: [
                { value: "booking", label: "Booking" },
                { value: "reservation", label: "Reservation" },
              ],
            },
            {
              field: "status",
              label: "Status",
              type: "select",
              options: [
                { value: "pending_payment", label: "Awaiting payment" },
                { value: "requested", label: "To decide" },
                { value: "confirmed", label: "Confirmed" },
                { value: "declined", label: "Declined" },
              ],
            },
            {
              field: "source",
              label: "Channel",
              type: "select",
              options: [
                { value: "public", label: "Public page" },
                { value: "phone", label: "Phone" },
                { value: "walk_in", label: "Walk-in" },
                { value: "staff", label: "Staff" },
              ],
            },
          ]}
          onFiltersChange={(next) => {
            setFilters(next);
            setPage(1);
          }}
          isLoading={list.isPending}
          errorMessage={
            list.isError && !list.data
              ? "The register is unavailable right now."
              : undefined
          }
          isStale={list.isError && Boolean(list.data)}
          onRetry={() => void list.refetch()}
          emptyMessage="No bookings match this search for the selected Site."
          mobileSummary={(booking) => (
            <Link
              href={`/admin/bookings/${booking.id}`}
              className="flex min-h-11 w-full flex-col gap-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-accent)]"
              aria-label={`Open the booking from ${booking.requester_name}`}
            >
              <RequesterCell
                requester={{
                  name: booking.requester_name,
                  email: booking.requester_email,
                  phone: booking.requester_phone,
                }}
              />
              <span className="flex flex-wrap items-center gap-2 text-xs text-[var(--vms-ink-muted)]">
                <BookingStatusBadge status={booking.status} />
                <span>{KIND_LABELS[booking.kind] ?? booking.kind}</span>
                <span>{formatDateTime(booking.check_in_at)}</span>
              </span>
            </Link>
          )}
        />
      </div>

      <Drawer
        isOpen={creating}
        onClose={() => setCreating(false)}
        title="New booking"
        description="Taken on a call, or at the desk"
      >
        <BookingCreateForm onCreated={() => setCreating(false)} />
      </Drawer>
    </div>
  );
}
