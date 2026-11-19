"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  DataTable,
  type Column,
  type FilterConfig,
} from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Drawer } from "@/components/ui/Drawer";
import { PageHeader } from "@/components/ui/PageHeader";
import { BookingCreateForm } from "@/features/bookings/components/BookingCreateForm";
import { filterRange, filterValue, stayNights } from "@/features/bookings/lib";
import { useBookings } from "@/features/bookings/queries";
import { useHospitalityRooms } from "@/features/hospitality/queries";
import { formatMoney } from "@/lib/currency";
import { formatDate } from "@/lib/datetime";
import { ConvertReservationDialog } from "./ConvertReservationDialog";
import { ReservationQuickViewDrawer } from "./ReservationQuickViewDrawer";
import {
  RESERVATION_DIRECTORY_STATUSES,
  canConvertReservation,
  reservationBookingStatusLabel,
  reservationBookingStatusTone,
} from "../lib";
import type { BookingDto, BookingListParams } from "@/features/bookings/api-types";

const PAGE_SIZE = 20;

/**
 * The reservations directory: requests that hold capacity, not arrangements a
 * guest can turn up for.
 *
 * These are bookings whose room is not named yet — `kind="reservation"` — so the
 * list is the same API filtered to that kind rather than a second register that
 * could drift from it. A reservation leaves this screen the moment it is
 * converted, because conversion promotes it to a booking; that is why there is no
 * "converted" row to scroll past.
 *
 * Opening a row is a drawer: it answers the questions a desk actually asks on the
 * phone — what was quoted, what is paid, when does the hold end — and carries the
 * two actions that matter. The full record stays at its own address.
 */
export function ReservationsBoard() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<FilterConfig[]>([]);
  const [creating, setCreating] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [convertingId, setConvertingId] = useState<string | null>(null);

  const rooms = useHospitalityRooms();
  const roomNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const room of rooms.data ?? []) map.set(room.id, room.name);
    return map;
  }, [rooms.data]);

  const params: BookingListParams = useMemo(() => {
    const status = filterValue(filters, "status");
    const placeId = filterValue(filters, "place_id");
    const stay = filterRange(filters, "stay");
    return {
      page,
      page_size: PAGE_SIZE,
      // Fixed, not a filter: this directory shows reservations.
      kind: "reservation",
      ...(search.trim() ? { search: search.trim() } : {}),
      ...(status ? { status: status as BookingListParams["status"] } : {}),
      ...(placeId ? { place_id: placeId } : {}),
      ...(stay.from
        ? { overlaps_from: new Date(`${stay.from}T00:00:00`).toISOString() }
        : {}),
      ...(stay.to
        ? {
            overlaps_to: new Date(
              new Date(`${stay.to}T00:00:00`).getTime() + 86_400_000,
            ).toISOString(),
          }
        : {}),
    };
  }, [page, search, filters]);

  const list = useBookings(params);
  const rows = list.data?.items ?? [];
  const converting = rows.find((row) => row.id === convertingId) ?? null;

  const columns: Column<BookingDto>[] = [
    {
      key: "reference",
      header: "Reservation",
      minWidth: 140,
      accessor: (row) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-xs font-semibold">
            {row.reference ?? "No reference"}
          </span>
          <span className="text-[11px] text-[var(--vms-ink-muted)]">
            Taken {formatDate(row.created_at)}
          </span>
        </div>
      ),
    },
    {
      key: "guest",
      header: "Guest",
      minWidth: 190,
      accessor: (row) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium">{row.requester_name}</span>
          <span className="text-xs text-[var(--vms-ink-muted)]">
            {row.requester_email || row.requester_phone || "No contact"}
          </span>
        </div>
      ),
    },
    {
      key: "resource",
      header: "Accommodation",
      minWidth: 170,
      accessor: (row) => (
        <div className="flex flex-col gap-0.5">
          <span>
            {row.place_id
              ? (roomNames.get(row.place_id) ?? "Room assigned")
              : "Category hold"}
          </span>
          <span className="text-[11px] text-[var(--vms-ink-muted)]">
            {row.guest_count} {row.guest_count === 1 ? "guest" : "guests"}
          </span>
        </div>
      ),
    },
    {
      key: "window",
      header: "Dates",
      minWidth: 180,
      accessor: (row) => {
        const nights = stayNights(row.check_in_at, row.check_out_at);
        return (
          <div className="flex flex-col gap-0.5 text-xs">
            <span>{formatDate(row.check_in_at)}</span>
            <span className="text-[var(--vms-ink-muted)]">
              to {formatDate(row.check_out_at)}
              {nights !== null
                ? ` · ${nights} ${nights === 1 ? "night" : "nights"}`
                : ""}
            </span>
          </div>
        );
      },
    },
    {
      key: "amount",
      header: "Quoted",
      minWidth: 120,
      accessor: (row) =>
        row.financials?.priced ? (
          <span className="tabular-nums">
            {formatMoney(row.financials.total, row.financials.currency)}
          </span>
        ) : (
          <span className="text-xs text-[var(--vms-ink-muted)]">
            Not quoted
          </span>
        ),
    },
    {
      key: "deposit",
      header: "Deposit",
      minWidth: 120,
      accessor: (row) =>
        row.financials && Number(row.financials.paid) > 0 ? (
          <span className="tabular-nums text-[var(--vms-ink-muted)]">
            {formatMoney(row.financials.paid, row.financials.currency)}
          </span>
        ) : (
          <span className="text-xs text-[var(--vms-ink-muted)]">—</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      minWidth: 150,
      accessor: (row) => (
        <StatusBadge tone={reservationBookingStatusTone(row.status)}>
          {reservationBookingStatusLabel(row.status)}
        </StatusBadge>
      ),
    },
    {
      key: "actions",
      header: "",
      minWidth: 190,
      mobileHide: true,
      accessor: (row) => (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setOpenId(row.id)}
            aria-label={`Open the reservation from ${row.requester_name}`}
          >
            Open
          </Button>
          {canConvertReservation(row) ? (
            <Button
              type="button"
              size="sm"
              onClick={() => setConvertingId(row.id)}
              aria-label={`Convert ${row.requester_name}'s reservation to a booking`}
            >
              Convert
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Hospitality"
        title="Reservations"
        description="Requests that hold a room or a category, waiting to be confirmed. Confirming one turns it into a booking, which lives in its own register."
        primaryAction={
          <Button type="button" onClick={() => setCreating(true)}>
            New reservation
          </Button>
        }
        secondaryActions={
          <Button asChild size="sm" variant="outline">
            <Link href="/admin/hospitality/calendar">Check room availability</Link>
          </Button>
        }
      />

      <DataTable
        card
        data={rows}
        columns={columns}
        getRowId={(row) => row.id}
        tableLabel="Site reservations"
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
        disableClientSideFiltering
        disableClientSideSorting
        availableFilters={[
          {
            field: "status",
            label: "Status",
            type: "select",
            options: RESERVATION_DIRECTORY_STATUSES.map((status) => ({
              value: status,
              label: reservationBookingStatusLabel(status),
            })),
          },
          {
            field: "place_id",
            label: "Room",
            type: "select",
            isSearchable: true,
            options: (rooms.data ?? []).map((room) => ({
              value: room.id,
              label: room.name,
            })),
          },
          { field: "stay", label: "Stay dates", type: "date-range" },
        ]}
        onFiltersChange={(next) => {
          setFilters(next);
          setPage(1);
        }}
        isLoading={list.isPending}
        errorMessage={
          list.isError && !list.data
            ? "Reservations are unavailable right now."
            : undefined
        }
        isStale={list.isError && Boolean(list.data)}
        onRetry={() => void list.refetch()}
        emptyMessage="No reservations match this search for the selected Site."
        mobileSummary={(row) => (
          <div className="flex flex-col gap-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <strong className="block">{row.requester_name}</strong>
                <span className="text-xs text-[var(--vms-ink-muted)]">
                  {row.place_id
                    ? (roomNames.get(row.place_id) ?? "Room assigned")
                    : "Category hold"}
                  {row.reference ? ` · ${row.reference}` : ""}
                </span>
                <span className="mt-1 block text-xs text-[var(--vms-ink-muted)]">
                  {formatDate(row.check_in_at)} → {formatDate(row.check_out_at)}
                </span>
                <span className="mt-1 block text-xs text-[var(--vms-ink-muted)]">
                  {row.financials?.priced
                    ? `${formatMoney(
                      row.financials.total,
                      row.financials.currency,
                    )} quoted · ${formatMoney(
                      row.financials.balance,
                      row.financials.currency,
                    )} outstanding`
                    : "Not quoted yet"}
                </span>
              </div>
              <StatusBadge tone={reservationBookingStatusTone(row.status)}>
                {reservationBookingStatusLabel(row.status)}
              </StatusBadge>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setOpenId(row.id)}
                aria-label={`Open the reservation from ${row.requester_name}`}
              >
                Open
              </Button>
              {canConvertReservation(row) ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setConvertingId(row.id)}
                  aria-label={`Convert ${row.requester_name}'s reservation to a booking`}
                >
                  Convert
                </Button>
              ) : null}
            </div>
          </div>
        )}
      />

      <Drawer
        isOpen={creating}
        onClose={() => setCreating(false)}
        title="New reservation"
        description="A request holding a room or category until it is confirmed"
      >
        <BookingCreateForm
          initialKind="reservation"
          onCreated={() => setCreating(false)}
        />
      </Drawer>

      <ReservationQuickViewDrawer
        bookingId={openId}
        onClose={() => setOpenId(null)}
      />

      {converting ? (
        <ConvertReservationDialog
          isOpen={Boolean(convertingId)}
          onClose={() => setConvertingId(null)}
          bookingId={converting.id}
          guestName={converting.requester_name}
          initialRoomIds={converting.place_id ? [converting.place_id] : []}
        />
      ) : null}
    </div>
  );
}
