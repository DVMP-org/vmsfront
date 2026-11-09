"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BedDouble,
  CalendarCheck2,
  CircleSlash2,
  UsersRound,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { parseApiError } from "@/lib/error-utils";
import { hospitalityApi } from "@/features/hospitality/api";
import {
  HospitalityAdminPage,
  ModuleMetrics,
  ModulePanel,
  StatusPill,
} from "@/features/hospitality/HospitalityAdminPage";
import type { AvailabilityCell } from "@/features/hospitality/contracts";
import { useHospitalityAccess } from "@/features/hospitality/use-hospitality-access";

function dateInput(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function validRange(from: string, to: string) {
  if (!from || !to) return false;
  const first = new Date(`${from}T12:00:00`);
  const last = new Date(`${to}T12:00:00`);
  return (
    Number.isFinite(first.getTime()) &&
    Number.isFinite(last.getTime()) &&
    last >= first
  );
}

function cellLabel(cell: AvailabilityCell) {
  if (cell.status === "occupied") return cell.guest_name || "In house";
  if (cell.status === "reserved") return cell.guest_name || "Reserved";
  if (cell.status === "blocked") return "Blocked";
  return "Open";
}

export default function HospitalityAvailabilityPage() {
  const access = useHospitalityAccess();
  const today = useMemo(() => new Date(), []);
  const [from, setFrom] = useState(dateInput(today));
  const [to, setTo] = useState(dateInput(addDays(today, 13)));
  const [roomSearch, setRoomSearch] = useState("");
  const [status, setStatus] = useState("");
  const rangeValid = validRange(from, to);
  const availability = useQuery({
    queryKey: ["hospitality-availability", access.contextKey, from, to],
    queryFn: () => hospitalityApi.availability(from, to),
    enabled: !!access.organization?.id && access.allowed("list") && rangeValid,
    retry: false,
  });
  const rooms = useMemo(() => {
    const needle = roomSearch.trim().toLowerCase();
    return (availability.data ?? []).filter(({ room }) => {
      const matchesSearch =
        !needle ||
        room.name.toLowerCase().includes(needle) ||
        room.room_number.toLowerCase().includes(needle) ||
        room.room_type.toLowerCase().includes(needle);
      const matchesStatus = !status || room.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [availability.data, roomSearch, status]);
  const dates = useMemo(() => {
    if (!rangeValid) return [];
    const values: string[] = [];
    let cursor = new Date(`${from}T12:00:00`);
    const end = new Date(`${to}T12:00:00`);
    while (cursor <= end && values.length < 45) {
      values.push(dateInput(cursor));
      cursor = addDays(cursor, 1);
    }
    return values;
  }, [from, rangeValid, to]);
  const totals = useMemo(() => {
    const cells = (availability.data ?? []).flatMap((row) => row.days);
    return {
      open: cells.filter((cell) => cell.status === "available").length,
      occupied: cells.filter((cell) => cell.status === "occupied").length,
      reserved: cells.filter((cell) => cell.status === "reserved").length,
      blocked: cells.filter((cell) => cell.status === "blocked").length,
    };
  }, [availability.data]);
  return (
    <HospitalityAdminPage
      access={access}
      title="Availability"
      description="Compare room inventory across arrival dates and open a guest folio without losing the operating context."
      secondaryActions={
        <Button
          variant="outline"
          onClick={() =>
            availability.refetch().then(() => {
              setStatus("");
              setRoomSearch("");
            })
          }
          isLoading={availability.isFetching}
        >
          Refresh
        </Button>
      }
    >
      <div className="space-y-5">
        <ModuleMetrics
          items={[
            {
              label: "Rooms in view",
              value: rooms.length,
              detail: `${availability.data?.length ?? 0} in inventory`,
              icon: BedDouble,
            },
            {
              label: "Open room-nights",
              value: totals.open,
              detail: "Available to sell",
              icon: CalendarCheck2,
            },
            {
              label: "Occupied",
              value: totals.occupied,
              detail: `${totals.reserved} reserved`,
              icon: UsersRound,
            },
            {
              label: "Blocked",
              value: totals.blocked,
              detail: "Unavailable room-nights",
              icon: CircleSlash2,
            },
          ]}
        />
        <ModulePanel
          title="Room calendar"
          description="A 45-day maximum keeps the operating view readable on mobile and desktop."
        >
          <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-1.5 text-sm font-medium">
              <span>From</span>
              <input
                type="date"
                value={from}
                max={to}
                onChange={(event) => setFrom(event.currentTarget.value)}
                className="h-[var(--vms-control-height)] w-full rounded-[var(--vms-radius-control)] border border-[var(--vms-line-strong)] bg-[var(--vms-surface)] px-3 text-base sm:text-sm"
              />
            </label>
            <label className="space-y-1.5 text-sm font-medium">
              <span>Through</span>
              <input
                type="date"
                value={to}
                min={from}
                onChange={(event) => setTo(event.currentTarget.value)}
                className="h-[var(--vms-control-height)] w-full rounded-[var(--vms-radius-control)] border border-[var(--vms-line-strong)] bg-[var(--vms-surface)] px-3 text-base sm:text-sm"
              />
            </label>
            <label className="space-y-1.5 text-sm font-medium">
              <span>Search rooms</span>
              <input
                type="search"
                value={roomSearch}
                placeholder="Number, name or type"
                onChange={(event) => setRoomSearch(event.currentTarget.value)}
                className="h-[var(--vms-control-height)] w-full rounded-[var(--vms-radius-control)] border border-[var(--vms-line-strong)] bg-[var(--vms-surface)] px-3 text-base sm:text-sm"
              />
            </label>
            <label className="space-y-1.5 text-sm font-medium">
              <span>Room status</span>
              <select
                value={status}
                onChange={(event) => setStatus(event.currentTarget.value)}
                className="h-[var(--vms-control-height)] w-full rounded-[var(--vms-radius-control)] border border-[var(--vms-line-strong)] bg-[var(--vms-surface)] px-3 text-base sm:text-sm"
              >
                <option value="">All statuses</option>
                <option value="available">Available</option>
                <option value="reserved">Reserved</option>
                <option value="occupied">Occupied</option>
                <option value="cleaning">Cleaning</option>
                <option value="out_of_service">Out of service</option>
              </select>
            </label>
          </div>
          {!rangeValid ? (
            <InlineAlert tone="danger">
              Choose an end date on or after the start date.
            </InlineAlert>
          ) : availability.isError ? (
            <InlineAlert
              tone="danger"
              title="Availability could not be loaded"
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => availability.refetch()}
                >
                  Retry
                </Button>
              }
            >
              {parseApiError(availability.error).message}
            </InlineAlert>
          ) : (
            <div
              className="max-w-full overflow-auto rounded-[var(--vms-radius-control)] border border-[var(--vms-line)]"
              tabIndex={0}
              role="region"
              aria-label="Room availability calendar"
            >
              <table className="w-max min-w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-[var(--vms-surface-subtle)]">
                    <th className="sticky left-0 z-10 min-w-48 border-b border-r border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] px-3 py-2 font-semibold">
                      Room
                    </th>
                    {dates.map((date) => (
                      <th
                        key={date}
                        className="min-w-28 border-b border-r border-[var(--vms-line)] px-2 py-2 text-center text-xs font-semibold"
                      >
                        <span className="block">
                          {new Date(`${date}T12:00:00`).toLocaleDateString(
                            undefined,
                            { weekday: "short" },
                          )}
                        </span>
                        <span className="font-normal text-[var(--vms-ink-muted)]">
                          {new Date(`${date}T12:00:00`).toLocaleDateString(
                            undefined,
                            { month: "short", day: "numeric" },
                          )}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {availability.isPending ? (
                    <tr>
                      <td
                        colSpan={dates.length + 1}
                        className="px-4 py-10 text-center text-[var(--vms-ink-muted)]"
                      >
                        Loading availability…
                      </td>
                    </tr>
                  ) : rooms.length ? (
                    rooms.map(({ room, days }) => (
                      <tr key={room.id}>
                        <th className="sticky left-0 z-[1] border-b border-r border-[var(--vms-line)] bg-[var(--vms-surface)] px-3 py-2 font-medium">
                          <span className="block">{room.name}</span>
                          <span className="text-xs font-normal text-[var(--vms-ink-muted)]">
                            {room.room_number} · {room.room_type}
                          </span>
                        </th>
                        {dates.map((date) => {
                          const cell = days.find((day) => day.date === date);
                          return (
                            <td
                              key={date}
                              className="border-b border-r border-[var(--vms-line)] p-1"
                            >
                              <AvailabilityCellView cell={cell} />
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={dates.length + 1}
                        className="px-4 py-10 text-center text-[var(--vms-ink-muted)]"
                      >
                        No rooms match this view.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--vms-ink-muted)]">
            <Legend tone="success" label="Open" />
            <Legend tone="warning" label="Reserved" />
            <Legend tone="info" label="Occupied" />
            <Legend tone="danger" label="Blocked" />
          </div>
        </ModulePanel>
      </div>
    </HospitalityAdminPage>
  );
}

function AvailabilityCellView({ cell }: { cell?: AvailabilityCell }) {
  if (!cell) {
    return (
      <span className="grid min-h-14 place-items-center rounded bg-[var(--vms-surface-subtle)] text-xs text-[var(--vms-ink-muted)]">
        Not reported
      </span>
    );
  }
  const tone =
    cell.status === "available"
      ? "success"
      : cell.status === "reserved"
        ? "warning"
        : cell.status === "occupied"
          ? "info"
          : "danger";
  return (
    <div
      className="min-h-14 min-w-24 rounded bg-[var(--vms-surface-subtle)] px-2 py-1.5"
      title={`${cell.status}${cell.guest_name ? `: ${cell.guest_name}` : ""}`}
    >
      <StatusPill tone={tone}>{cellLabel(cell)}</StatusPill>
      {cell.stay_id ? (
        <Link
          href={`/admin/hospitality/billing?stay=${cell.stay_id}`}
          className="mt-1 block truncate text-[11px] font-semibold text-[var(--vms-ink)] underline decoration-[var(--vms-line-strong)] underline-offset-2"
        >
          Open folio
        </Link>
      ) : null}
    </div>
  );
}

function Legend({
  tone,
  label,
}: {
  tone: "success" | "warning" | "info" | "danger";
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={
          tone === "success"
            ? "h-2 w-2 rounded-full bg-[var(--vms-success)]"
            : tone === "warning"
              ? "h-2 w-2 rounded-full bg-[var(--vms-warning)]"
              : tone === "info"
                ? "h-2 w-2 rounded-full bg-[var(--vms-info)]"
                : "h-2 w-2 rounded-full bg-[var(--vms-danger)]"
        }
      />
      {label}
    </span>
  );
}
