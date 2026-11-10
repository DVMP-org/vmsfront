"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowLeftRight,
  CalendarClock,
  Clock3,
  MapPin,
  Route,
  ShieldCheck,
} from "lucide-react";

import { Avatar } from "@/components/ui/Avatar";
import { StatusBadge, type StatusTone } from "@/components/ui/StatusBadge";
import { formatDate, formatDateTime, formatTime } from "@/lib/datetime";
import { parseApiError } from "@/lib/error-utils";
import { cn } from "@/lib/utils";
import { placeWorkspaceApi, type Movement } from "./api";
import { usePlaceWorkspace } from "./PlaceWorkspaceShell";
import { EmptyRow } from "./ui";

function movementStatus(movement: Movement) {
  if (movement.outcome !== "allowed")
    return { label: "Denied", tone: "danger" as StatusTone };
  return movement.direction === "entry"
    ? { label: "Checked in", tone: "success" as StatusTone }
    : { label: "Checked out", tone: "success" as StatusTone };
}

/** The full journey of one visitor, opened from the movement log. */
export function MovementJourneyPage({ visitorKey }: { visitorKey: string }) {
  const { place } = usePlaceWorkspace();
  const query = useQuery({
    queryKey: ["place-movement-journey", place.id, visitorKey],
    queryFn: () => placeWorkspaceApi.movements(place.id, 1, visitorKey, 100),
    retry: false,
  });
  const movements = (query.data?.items ?? [])
    .slice()
    .sort(
      (left, right) =>
        new Date(left.occurred_at).getTime() -
        new Date(right.occurred_at).getTime(),
    );
  const latest = movements[movements.length - 1];
  const first = movements[0];
  const minutes =
    first && latest
      ? Math.max(
          0,
          Math.round(
            (new Date(latest.occurred_at).getTime() -
              new Date(first.occurred_at).getTime()) /
              60_000,
          ),
        )
      : 0;
  const personName = latest?.person_name || "Visitor";
  const reference =
    latest?.invitation_code && latest.guest_suffix
      ? `${latest.invitation_code}-${latest.guest_suffix}`
      : latest?.credential_reference ?? "";
  const gatePath = Array.from(
    new Set(movements.map((movement) => movement.gate_name)),
  );

  return (
    <div className="space-y-4">
      <div>
        <Link
          href={`/workspace/${place.id}/movements`}
          className="mb-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-[var(--vms-ink-muted)] hover:text-[var(--vms-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Movement log
        </Link>
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--vms-ink-muted)]">
          Visitor journey
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-[-0.02em]">
          {personName}
        </h1>
        {reference ? (
          <p className="mt-1 font-mono text-xs text-[var(--vms-ink-muted)]">
            {reference}
          </p>
        ) : null}
      </div>

      {query.isError ? (
        <div
          role="alert"
          className="rounded-xl border border-[var(--vms-danger)] bg-[var(--vms-danger-subtle)] p-4 text-sm text-[var(--vms-danger)]"
        >
          {parseApiError(query.error).message}
        </div>
      ) : query.isPending ? (
        <div className="space-y-3" role="status" aria-label="Loading journey">
          <div className="h-24 w-full animate-pulse rounded-xl bg-[var(--vms-surface-subtle)]" />
          <div className="h-64 w-full animate-pulse rounded-xl bg-[var(--vms-surface-subtle)]" />
        </div>
      ) : movements.length === 0 ? (
        <div className="rounded-xl border border-[var(--vms-line)] bg-[var(--vms-surface)] p-4">
          <EmptyRow
            icon={Clock3}
            title="No scans found"
            description="This visitor has no checkpoint activity at this property yet."
          />
        </div>
      ) : (
        <>
          <section className="rounded-xl border border-[var(--vms-line)] bg-[var(--vms-surface)] p-4">
            <div className="flex items-center gap-3">
              <Avatar name={personName} size="lg" tone="ink" decorative />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{personName}</p>
                <p className="mt-0.5 text-xs text-[var(--vms-ink-muted)]">
                  {movements.length} scan{movements.length === 1 ? "" : "s"} ·{" "}
                  {latest.place_name || place.name}
                </p>
              </div>
              <StatusBadge tone={movementStatus(latest).tone}>
                {movementStatus(latest).label}
              </StatusBadge>
            </div>
            <dl className="mt-4 grid gap-3 border-t border-[var(--vms-line)] pt-4 text-sm sm:grid-cols-2">
              <Detail
                icon={Route}
                label="Route"
                value={gatePath.join(" → ")}
              />
              <Detail
                icon={MapPin}
                label="Latest checkpoint"
                value={`${latest.gate_name} · ${
                  latest.direction === "entry" ? "Entry" : "Exit"
                }`}
              />
              <Detail
                icon={CalendarClock}
                label="Started"
                value={formatDateTime(first.occurred_at)}
              />
              <Detail
                icon={Clock3}
                label="Journey duration"
                value={
                  minutes > 0
                    ? `${Math.floor(minutes / 60)} h ${minutes % 60} min`
                    : "—"
                }
              />
              <Detail
                icon={ArrowLeftRight}
                label="Scans"
                value={String(movements.length)}
              />
              <Detail
                icon={ShieldCheck}
                label="Result"
                value={movementStatus(latest).label}
              />
            </dl>
          </section>

          <section className="rounded-xl border border-[var(--vms-line)] bg-[var(--vms-surface)]">
            <h2 className="border-b border-[var(--vms-line)] px-4 py-3 text-sm font-semibold">
              Every scan
            </h2>
            <ol className="divide-y divide-[var(--vms-line)] px-4">
              {movements.map((event) => {
                const status = movementStatus(event);
                return (
                  <li
                    key={event.id}
                    className="flex items-start gap-3 py-3"
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full",
                        status.tone === "success"
                          ? "bg-[var(--vms-success)]"
                          : "bg-[var(--vms-danger)]",
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        {event.gate_name} ·{" "}
                        {event.direction === "entry" ? "Entry" : "Exit"}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--vms-ink-muted)]">
                        {formatDate(event.occurred_at)} ·{" "}
                        {formatTime(event.occurred_at)} · {event.reason_code}
                      </p>
                    </div>
                    <StatusBadge tone={status.tone}>
                      {status.label}
                    </StatusBadge>
                  </li>
                );
              })}
            </ol>
          </section>
        </>
      )}
    </div>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg bg-[var(--vms-surface-subtle)] px-3 py-2">
      <dt className="inline-flex items-center gap-1.5 text-[var(--vms-ink-muted)]">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
