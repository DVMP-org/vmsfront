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

export function GuestStayDashboard() {
  const stays = useQuery({
    queryKey: ["workspace", "guest-stays"],
    queryFn: guestStayApi.list,
    retry: false,
  });
  const items = [...(stays.data?.items || [])].sort(
    (left, right) =>
      new Date(left.planned_check_in).getTime() -
      new Date(right.planned_check_in).getTime(),
  );

  return (
    <section
      aria-labelledby="guest-stays-title"
      className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 dark:border-slate-800">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[rgb(var(--brand-primary,#213928))] dark:text-emerald-300">
            Your stay
          </p>
          <h2 id="guest-stays-title" className="mt-1 text-lg font-semibold">
            Stay details and arrival
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Hotel staff manage reservations and rooms. This view only shows your
            guest stay.
          </p>
        </div>
        <button
          type="button"
          onClick={() => stays.refetch()}
          disabled={stays.isFetching}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
        >
          <RefreshCw
            className={stays.isFetching ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"}
          />
          Refresh
        </button>
      </div>

      {stays.isPending ? (
        <div className="grid gap-3 p-5">
          {[0, 1].map((item) => (
            <div
              key={item}
              className="h-32 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800"
            />
          ))}
        </div>
      ) : stays.isError ? (
        <div
          role="alert"
          className="m-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
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
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Hotel reservations linked to your account will appear here.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-200 dark:divide-slate-800">
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
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold capitalize text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
            {phase}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {guestName(stay)}
          </span>
        </div>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="flex items-start gap-3">
            <CalendarClock className="mt-0.5 h-4 w-4 text-slate-400" />
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400">
                Arrival
              </dt>
              <dd className="mt-0.5 text-sm font-medium">
                {formatDate(stay.planned_check_in)}
              </dd>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock3 className="mt-0.5 h-4 w-4 text-slate-400" />
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400">
                Departure
              </dt>
              <dd className="mt-0.5 text-sm font-medium">
                {formatDate(stay.planned_check_out)}
              </dd>
            </div>
          </div>
        </dl>
      </div>
      <div className="min-w-44 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
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
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
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
