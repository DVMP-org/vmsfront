"use client";

import { useMemo, useState } from "react";
import { Settings2 } from "lucide-react";

import {
  DataTable,
  type Column,
  type FilterConfig,
} from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { PageHeader } from "@/components/ui/PageHeader";
import { useHospitalityRooms } from "@/features/hospitality/queries";
import { BookingPageSettings } from "@/features/hospitality/components/BookingPageSettings";
import { GuestStatusBadge } from "@/features/hospitality/components/GuestStatusBadge";
import { formatMoney } from "@/lib/currency";
import { formatDate } from "@/lib/datetime";
import { BookingCreateForm } from "./BookingCreateForm";
import { BookingQuickViewDrawer } from "./BookingQuickViewDrawer";
import { BookingStatusBadge } from "./BookingStatusBadge";
import { RequesterCell } from "./RequesterCell";
import {
  filterRange,
  filterValue,
  paymentStatusView,
  stayNights,
} from "../lib";
import type { BookingDto, BookingListParams } from "../api-types";
import { useBookings } from "../queries";

const PAGE_SIZE = 20;

const STATUS_OPTIONS: Array<{
  value: NonNullable<BookingListParams["status"]>;
  label: string;
}> = [
  { value: "pending_payment", label: "Awaiting payment" },
  { value: "requested", label: "To decide" },
  { value: "confirmed", label: "Confirmed" },
  { value: "checked_in", label: "Checked in" },
  { value: "checked_out", label: "Checked out" },
  { value: "declined", label: "Declined" },
  { value: "cancelled", label: "Cancelled" },
  { value: "no_show", label: "No show" },
];

/**
 * The Site's bookings directory — confirmed arrangements, and nothing else.
 *
 * Reservations are deliberately absent. They hold capacity without naming a room
 * and without a bill, so they are a different question with their own screen.
 * `kind` is fixed here rather than offered as a control: a directory that can
 * show both is a directory nobody can trust to show one.
 *
 * Search, filters and pagination run on the server — filtering the twenty rows
 * on screen would quietly hide a match on page two. The money columns come from
 * the server's derived summary, so a row, its drawer and its details page cannot
 * disagree about a balance.
 *
 * Opening a row is a drawer, not a navigation: the drawer answers the common
 * questions and carries the actions, while the full record keeps its own address
 * for the work that needs it.
 */
export function BookingsRegister() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<FilterConfig[]>([]);
  const [creating, setCreating] = useState(false);
  const [createFormState, setCreateFormState] = useState({
    canSubmit: false,
    isSubmitting: false,
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [openBookingId, setOpenBookingId] = useState<string | null>(null);

  const rooms = useHospitalityRooms();
  const roomNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const room of rooms.data ?? []) map.set(room.id, room.name);
    return map;
  }, [rooms.data]);

  const params: BookingListParams = useMemo(() => {
    const status = filterValue(filters, "status");
    const source = filterValue(filters, "source");
    const placeId = filterValue(filters, "place_id");
    const stay = filterRange(filters, "stay");
    return {
      page,
      page_size: PAGE_SIZE,
      // Fixed, not a filter: this directory shows bookings.
      kind: "booking",
      ...(search.trim() ? { search: search.trim() } : {}),
      ...(status ? { status: status as BookingListParams["status"] } : {}),
      ...(source ? { source: source as BookingListParams["source"] } : {}),
      ...(placeId ? { place_id: placeId } : {}),
      // A date input is a day. The window it means starts at the beginning of
      // that day and ends at the beginning of the next; these are overlap
      // filters, so a stay that began before the window still matches.
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
  const bookings = list.data?.items ?? [];

  const columns: Column<BookingDto>[] = [
    {
      key: "reference",
      header: "Booking",
      minWidth: 140,
      accessor: (booking) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-xs font-semibold">
            {booking.reference ?? "No reference"}
          </span>
          <span className="text-[11px] text-[var(--vms-ink-muted)]">
            Booked {formatDate(booking.created_at)}
          </span>
        </div>
      ),
    },
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
      key: "guest_status",
      header: "Guest status",
      minWidth: 130,
      accessor: (booking) => (
        <GuestStatusBadge status={booking.hospitality_stay_status} />
      ),
    },
    {
      key: "accommodation",
      header: "Accommodation",
      minWidth: 160,
      accessor: (booking) => (
        <div className="flex flex-col gap-0.5">
          <span>
            {booking.place_id
              ? (roomNames.get(booking.place_id) ?? "Room assigned")
              : "Room not assigned"}
          </span>
          <span className="text-[11px] text-[var(--vms-ink-muted)]">
            {booking.guest_count}{" "}
            {booking.guest_count === 1 ? "guest" : "guests"}
          </span>
        </div>
      ),
    },
    {
      key: "window",
      header: "Stay",
      minWidth: 180,
      accessor: (booking) => {
        const nights = stayNights(booking.check_in_at, booking.check_out_at);
        return (
          <div className="flex flex-col gap-0.5 text-xs">
            <span>{formatDate(booking.check_in_at)}</span>
            <span className="text-[var(--vms-ink-muted)]">
              to {formatDate(booking.check_out_at)}
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
      header: "Amount",
      minWidth: 120,
      accessor: (booking) =>
        booking.financials?.priced ? (
          <span className="tabular-nums">
            {formatMoney(booking.financials.total, booking.financials.currency)}
          </span>
        ) : (
          <span className="text-xs text-[var(--vms-ink-muted)]">
            Not priced
          </span>
        ),
    },
    {
      key: "paid",
      header: "Paid",
      minWidth: 120,
      accessor: (booking) =>
        booking.financials && Number(booking.financials.paid) > 0 ? (
          <span className="tabular-nums text-[var(--vms-ink-muted)]">
            {formatMoney(booking.financials.paid, booking.financials.currency)}
          </span>
        ) : (
          <span className="text-xs text-[var(--vms-ink-muted)]">—</span>
        ),
    },
    {
      key: "balance",
      header: "Balance",
      minWidth: 130,
      accessor: (booking) => {
        if (!booking.financials?.priced) {
          return (
            <span className="text-xs text-[var(--vms-ink-muted)]">
              {paymentStatusView(booking.financials).label}
            </span>
          );
        }
        return (
          <span className="tabular-nums text-[var(--vms-ink)]">
            {formatMoney(
              booking.financials.balance,
              booking.financials.currency,
            )}
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      minWidth: 150,
      accessor: (booking) => {
        const payment = paymentStatusView(booking.financials);
        return (
          <div className="flex flex-col items-start gap-1">
            <BookingStatusBadge status={booking.status} />
            <StatusBadge tone={payment.tone}>{payment.label}</StatusBadge>
          </div>
        );
      },
    },
    {
      key: "open",
      header: "",
      minWidth: 90,
      mobileHide: true,
      accessor: (booking) => (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setOpenBookingId(booking.id)}
          aria-label={`Open the booking from ${booking.requester_name}`}
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
        title="Bookings"
        description="Confirmed arrangements at this Site: who is staying, what they are paying, and what is still owed. Holds without a room live under Reservations."
        primaryAction={
          <Button type="button" onClick={() => setCreating(true)}>
            New booking
          </Button>
        }
        secondaryActions={
          <Button
            type="button"
            variant="outline"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings2 aria-hidden className="size-4" />
            Booking page
          </Button>
        }
      />

      <DataTable
        card
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
            field: "status",
            label: "Status",
            type: "select",
            options: STATUS_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
            })),
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
            ? "The bookings register is unavailable right now."
            : undefined
        }
        isStale={list.isError && Boolean(list.data)}
        onRetry={() => void list.refetch()}
        emptyMessage="No bookings have been recorded at this Site yet."
        emptyAction={
          search.trim() || filters.length > 0 ? undefined : (
            <Button type="button" size="sm" onClick={() => setCreating(true)}>
              New booking
            </Button>
          )
        }
        mobileSummary={(booking) => {
          const payment = paymentStatusView(booking.financials);
          const nights = stayNights(booking.check_in_at, booking.check_out_at);
          return (
            <div className="flex flex-col gap-2">
              <RequesterCell
                requester={{
                  name: booking.requester_name,
                  email: booking.requester_email,
                  phone: booking.requester_phone,
                }}
              />
              <span className="flex flex-wrap items-center gap-2 text-xs text-[var(--vms-ink-muted)]">
                <BookingStatusBadge status={booking.status} />
                <StatusBadge tone={payment.tone}>{payment.label}</StatusBadge>
                {booking.reference ? (
                  <span className="font-mono">{booking.reference}</span>
                ) : null}
              </span>
              <span className="text-xs text-[var(--vms-ink-muted)]">
                {formatDate(booking.check_in_at)} →{" "}
                {formatDate(booking.check_out_at)}
                {nights !== null
                  ? ` · ${nights} ${nights === 1 ? "night" : "nights"}`
                  : ""}
              </span>
              <span className="text-xs text-[var(--vms-ink-muted)]">
                {booking.place_id
                  ? (roomNames.get(booking.place_id) ?? "Room assigned")
                  : "Room not assigned"}
                {booking.financials?.priced
                  ? ` · ${formatMoney(
                      booking.financials.balance,
                      booking.financials.currency,
                    )} outstanding`
                  : ""}
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setOpenBookingId(booking.id)}
                aria-label={`Open the booking from ${booking.requester_name}`}
              >
                Open
              </Button>
            </div>
          );
        }}
      />

      <Drawer
        isOpen={creating}
        onClose={() => setCreating(false)}
        title="New booking"
        description="Taken on a call, or at the desk"
        footer={
          <div className="flex justify-end">
            <Button
              type="submit"
              form="admin-booking-create-form"
              disabled={!createFormState.canSubmit}
              isLoading={createFormState.isSubmitting}
              loadingLabel="Taking booking"
            >
              Take booking
            </Button>
          </div>
        }
      >
        <BookingCreateForm
          formId="admin-booking-create-form"
          onSubmitStateChange={setCreateFormState}
          onCreated={() => setCreating(false)}
        />
      </Drawer>

      <BookingQuickViewDrawer
        bookingId={openBookingId}
        onClose={() => setOpenBookingId(null)}
      />

      <Drawer
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Booking page"
        description="The images, copy, contact details and sections guests see when they book direct."
        className="max-w-3xl"
      >
        <BookingPageSettings />
      </Drawer>
    </div>
  );
}
