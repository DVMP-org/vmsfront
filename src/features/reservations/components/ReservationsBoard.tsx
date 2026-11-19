"use client";

import { useMemo, useState } from "react";

import {
  DataTable,
  type Column,
  type FilterConfig,
} from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { useHospitalityRooms } from "@/features/hospitality/queries";
import { formatDateTime } from "@/lib/datetime";
import { ReservationActions } from "./ReservationActions";
import { ReservationStatusBadge } from "./ReservationStatusBadge";
import {
  holdsReason,
  reservationResourceLabel,
  reservationStatusLabel,
} from "../lib";
import { filterValue } from "@/features/bookings/lib";
import type { ReservationDto, ReservationListParams } from "../api-types";
import { RESERVATION_STATUSES } from "../api-types";
import { useReservations } from "../queries";

const PAGE_SIZE = 50;

/**
 * The reservations register: capacity held, not sales made.
 *
 * Kept apart from the bookings page because it answers a different question. A
 * desk asking "what is holding a room this weekend" should not have to read a
 * register of what guests bought.
 *
 * `is_holding` is taken from the server rather than derived here. A `held` row
 * past its expiry blocks nothing, and a board that drew it as occupied would be
 * confidently wrong about the only thing it exists to show.
 *
 * The window is narrowed by the two date inputs rather than by a calendar grid:
 * the question is nearly always a range ("this weekend"), and a date is the
 * honest form of that question without inventing drag-and-drop semantics.
 */
export function ReservationsBoard() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<FilterConfig[]>([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const rooms = useHospitalityRooms();
  const roomNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const room of rooms.data ?? []) map.set(room.id, room.name);
    return map;
  }, [rooms.data]);

  const params: ReservationListParams = useMemo(() => {
    const status = filterValue(filters, "status");
    const placeId = filterValue(filters, "place_id");
    return {
      page,
      page_size: PAGE_SIZE,
      ...(status ? { status: status as ReservationListParams["status"] } : {}),
      ...(placeId ? { place_id: placeId } : {}),
      // A date input is a day; the window it means starts at the beginning of
      // that day and ends at the beginning of the next. These are overlap
      // filters on the allocation interval, so an allocation that began before
      // the window still appears.
      ...(fromDate
        ? { overlaps_from: new Date(`${fromDate}T00:00:00`).toISOString() }
        : {}),
      ...(toDate
        ? {
            overlaps_to: new Date(
              new Date(`${toDate}T00:00:00`).getTime() + 86_400_000,
            ).toISOString(),
          }
        : {}),
    };
  }, [page, filters, fromDate, toDate]);

  const list = useReservations(params);
  const rows = list.data?.items ?? [];

  const columns: Column<ReservationDto>[] = [
    {
      key: "resource",
      header: "Held",
      minWidth: 200,
      accessor: (row) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium">
            {reservationResourceLabel(
              row,
              row.place_id ? roomNames.get(row.place_id) : null,
            )}
          </span>
          <span className="text-xs text-[var(--vms-ink-muted)]">
            {row.place_id ? "Room assigned" : "Inventory only"}
          </span>
        </div>
      ),
    },
    {
      key: "window",
      header: "Period",
      minWidth: 220,
      accessor: (row) => (
        <div className="flex flex-col gap-0.5 text-xs">
          <span>{formatDateTime(row.start_at)}</span>
          <span className="text-[var(--vms-ink-muted)]">
            to {formatDateTime(row.end_at)}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      minWidth: 150,
      accessor: (row) => (
        <div className="flex flex-col items-start gap-1">
          <ReservationStatusBadge status={row.status} />
          {/* The most important column: a row can read "Held" and still be
              blocking nothing. */}
          {holdsReason(row) ? (
            <span className="text-[10px] uppercase tracking-wide text-[var(--vms-ink-muted)]">
              {holdsReason(row)}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: "expires",
      header: "Hold ends",
      minWidth: 150,
      hiddenByDefault: true,
      accessor: (row) =>
        row.expires_at ? formatDateTime(row.expires_at) : "—",
    },
    {
      key: "actions",
      header: "",
      minWidth: 260,
      mobileHide: true,
      accessor: (row) => <ReservationActions reservation={row} />,
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Hospitality"
        title="Reservations"
        description="Capacity held at this Site, whether or not it has been sold yet."
      />

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-[var(--vms-ink-muted)]">
          <span>From</span>
          <Input
            type="date"
            value={fromDate}
            onChange={(event) => {
              setFromDate(event.currentTarget.value);
              setPage(1);
            }}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-[var(--vms-ink-muted)]">
          <span>To</span>
          <Input
            type="date"
            value={toDate}
            onChange={(event) => {
              setToDate(event.currentTarget.value);
              setPage(1);
            }}
          />
        </label>
        {fromDate || toDate ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              setFromDate("");
              setToDate("");
              setPage(1);
            }}
          >
            Clear dates
          </Button>
        ) : null}
      </div>

      <DataTable
        data={rows}
        columns={columns}
        getRowId={(row) => row.id}
        tableLabel="Site reservations"
        searchable={false}
        serverSide
        total={list.data?.total ?? 0}
        currentPage={page}
        onPageChange={setPage}
        pageSize={PAGE_SIZE}
        pageSizeOptions={[PAGE_SIZE]}
        disableClientSideFiltering
        disableClientSideSorting
        availableFilters={[
          {
            field: "status",
            label: "Status",
            type: "select",
            options: RESERVATION_STATUSES.map((status) => ({
              value: status,
              label: reservationStatusLabel(status),
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
        emptyMessage="Nothing is holding capacity for this window."
        mobileSummary={(row) => (
          <div className="flex flex-col gap-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <strong className="block">
                  {reservationResourceLabel(
                    row,
                    row.place_id ? roomNames.get(row.place_id) : null,
                  )}
                </strong>
                <span className="text-xs text-[var(--vms-ink-muted)]">
                  {formatDateTime(row.start_at)} → {formatDateTime(row.end_at)}
                </span>
              </div>
              <ReservationStatusBadge status={row.status} />
            </div>
            <ReservationActions reservation={row} />
          </div>
        )}
      />
    </div>
  );
}
