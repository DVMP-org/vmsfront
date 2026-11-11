"use client";

import { useQuery } from "@tanstack/react-query";
import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  DoorOpen,
  RefreshCw,
} from "lucide-react";
import { parseApiError } from "@/lib/error-utils";
import {
  guestName,
  statusLabel,
  type Stay,
} from "@/features/hospitality/contracts";
import { guestStayApi } from "./api";

export function GuestStayDashboard({ placeId }: { placeId?: string } = {}) {
  const stays = useQuery({
    queryKey: ["workspace", "guest-stays"],
    queryFn: guestStayApi.list,
    retry: false,
  });
  const items = [...(stays.data?.items || [])]
    .filter(
      (stay) =>
        !placeId ||
        stay.room_assignments.some(
          (assignment) => assignment.room.id === placeId,
        ),
    )
    .sort(
      (left, right) =>
        new Date(left.planned_check_in).getTime() -
        new Date(right.planned_check_in).getTime(),
    );

  return (
    <section
      aria-labelledby="guest-stays-title"
      className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)]"
    >
      <div className="flex items-start justify-between gap-4 border-b border-[var(--vms-line)] p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--vms-ink-muted)]">
            Your stay
          </p>
          <h2 id="guest-stays-title" className="mt-1 text-lg font-semibold">
            Stay details and arrival
          </h2>
          <p className="mt-1 text-sm text-[var(--vms-ink-muted)]">
            Hotel staff manage reservations and rooms. This view only shows your
            guest stay.
          </p>
        </div>
        <button
          type="button"
          onClick={() => stays.refetch()}
          disabled={stays.isFetching}
          className="inline-flex min-h-11 items-center gap-2 rounded-[var(--vms-radius-control)] border border-[var(--vms-line-strong)] bg-[var(--vms-surface)] px-3 py-2 text-xs font-semibold text-[var(--vms-ink)] hover:bg-[var(--vms-surface-subtle)] disabled:opacity-50"
        >
          <RefreshCw
            className={
              stays.isFetching ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"
            }
          />
          Refresh
        </button>
      </div>

      {stays.isPending ? (
        <div className="grid gap-3 p-5">
          {[0, 1].map((item) => (
            <div
              key={item}
              className="h-32 animate-pulse rounded-[var(--vms-radius-control)] bg-[var(--vms-surface-subtle)] motion-reduce:animate-none"
            />
          ))}
        </div>
      ) : stays.isError ? (
        <div
          role="alert"
          className="m-5 rounded-[var(--vms-radius-control)] border border-[color-mix(in_srgb,var(--vms-danger)_35%,white)] bg-[var(--vms-danger-subtle)] p-4 text-sm text-[var(--vms-danger)]"
        >
          <p className="font-semibold">Stay details unavailable</p>
          <p className="mt-1">{parseApiError(stays.error).message}</p>
          <button
            type="button"
            onClick={() => stays.refetch()}
            className="mt-3 font-semibold underline"
          >
            Retry
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="p-8 text-center">
          <CalendarClock className="mx-auto h-8 w-8 text-slate-400" />
          <h3 className="mt-3 text-sm font-semibold">No stay assigned</h3>
          <p className="mt-1 text-sm text-[var(--vms-ink-muted)]">
            Hotel reservations linked to your account will appear here.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[var(--vms-line)]">
          {items.map((stay) => (
            <StayCard key={stay.id} stay={stay} />
          ))}
        </div>
      )}
    </section>
  );
}

function StayCard({ stay }: { stay: Stay }) {
  const room = currentRoom(stay);
  const phase =
    stay.status === "checked_in"
      ? "Currently checked in"
      : stay.status === "reserved"
        ? "Arrival scheduled"
        : stay.status === "checked_out"
          ? "Stay completed"
          : statusLabel(stay.status);
  return (
    <article className="grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_auto]">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[color-mix(in_srgb,var(--vms-success)_35%,white)] bg-[var(--vms-success-subtle)] px-2.5 py-1 text-[11px] font-semibold capitalize text-[var(--vms-success)]">
            {phase}
          </span>
          <span className="text-xs text-[var(--vms-ink-muted)]">
            {guestName(stay)}
          </span>
        </div>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="flex items-start gap-3">
            <CalendarClock className="mt-0.5 h-4 w-4 text-slate-400" />
            <div>
              <dt className="text-xs text-[var(--vms-ink-muted)]">Arrival</dt>
              <dd className="mt-0.5 text-sm font-medium">
                {formatDate(stay.planned_check_in)}
              </dd>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock3 className="mt-0.5 h-4 w-4 text-slate-400" />
            <div>
              <dt className="text-xs text-[var(--vms-ink-muted)]">Departure</dt>
              <dd className="mt-0.5 text-sm font-medium">
                {formatDate(stay.planned_check_out)}
              </dd>
            </div>
          </div>
        </dl>
      </div>
      <div className="min-w-44 rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] p-3">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--vms-ink-muted)]">
          {room ? (
            <DoorOpen className="h-4 w-4" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          Assigned room
        </p>
        <p className="mt-2 text-sm font-semibold">
          {room?.room.name || "Not assigned yet"}
        </p>
        <p className="mt-1 text-xs text-[var(--vms-ink-muted)]">
          {stay.actual_check_in
            ? `Checked in ${formatDate(stay.actual_check_in)}`
            : "Check in at the hotel reception"}
        </p>
      </div>
    </article>
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
