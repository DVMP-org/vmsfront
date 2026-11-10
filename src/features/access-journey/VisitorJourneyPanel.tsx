"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, CircleDashed, LogIn, LogOut } from "lucide-react";

import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDateTime, formatTime } from "@/lib/datetime";
import { humanize } from "@/lib/strings";
import { cn } from "@/lib/utils";
import type { CheckpointEvent } from "./api";

export interface JourneyGate {
  id: string;
  name: string;
  dependency_id?: string | null;
}

export interface JourneyGuest {
  id: string;
  display_name_snapshot: string;
  suffix: string;
  state?: string;
}

interface JourneyStep {
  key: string;
  gateId: string;
  gateName: string;
  direction: "entry" | "exit";
  done: boolean;
  current: boolean;
  at?: string;
}

/**
 * One visitor's journey: the full checkpoint route with unreached gates
 * greyed out, followed by every scan recorded for that visitor.
 *
 * Used by the admin invitation detail/drawer and the party workspace so both
 * audiences read the same truth. When the route map is not available (the
 * party workspace cannot list site gates) the recorded scans still tell the
 * visitor's story on their own.
 */
export function VisitorJourneyPanel({
  guests,
  events,
  gates = [],
  loading = false,
  error = null,
  onRetry,
  initialGuestId = null,
  showRoute = true,
}: {
  guests: JourneyGuest[];
  events: CheckpointEvent[];
  gates?: JourneyGate[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  initialGuestId?: string | null;
  showRoute?: boolean;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(
    initialGuestId ?? guests[0]?.id ?? null,
  );
  // Only follow the caller's focus request when it changes, so the visitor can
  // still switch tabs inside the panel afterwards.
  const lastFocus = useRef<string | null>(null);

  useEffect(() => {
    if (initialGuestId && initialGuestId !== lastFocus.current) {
      lastFocus.current = initialGuestId;
      setSelectedId(initialGuestId);
    }
  }, [initialGuestId]);

  useEffect(() => {
    if (selectedId && guests.some((guest) => guest.id === selectedId)) return;
    setSelectedId(guests[0]?.id ?? null);
  }, [guests, selectedId]);

  const selected = guests.find((guest) => guest.id === selectedId) ?? null;
  const guestEvents = useMemo(
    () =>
      events
        .filter(
          (event) => !selectedId || event.visit_guest_id === selectedId,
        )
        .slice()
        .sort(
          (left, right) =>
            new Date(left.occurred_at).getTime() -
            new Date(right.occurred_at).getTime(),
        ),
    [events, selectedId],
  );

  const steps = useMemo<JourneyStep[]>(() => {
    if (!showRoute || !gates.length) return [];
    const byId = new Map(gates.map((gate) => [gate.id, gate]));
    const depth = (gateId: string) => {
      let level = 0;
      let current = byId.get(gateId);
      const seen = new Set<string>();
      while (current?.dependency_id && !seen.has(current.id)) {
        seen.add(current.id);
        current = byId.get(current.dependency_id);
        level += 1;
      }
      return level;
    };
    const ordered = [...gates].sort(
      (left, right) =>
        depth(left.id) - depth(right.id) || left.name.localeCompare(right.name),
    );
    const route: JourneyStep[] = [
      ...ordered.map((gate) => ({
        key: `${gate.id}:entry`,
        gateId: gate.id,
        gateName: gate.name,
        direction: "entry" as const,
        done: false,
        current: false,
      })),
      ...[...ordered].reverse().map((gate) => ({
        key: `${gate.id}:exit`,
        gateId: gate.id,
        gateName: gate.name,
        direction: "exit" as const,
        done: false,
        current: false,
      })),
    ];
    let pointer = 0;
    for (const event of guestEvents) {
      if (event.outcome !== "allowed") continue;
      for (let index = pointer; index < route.length; index += 1) {
        const step = route[index];
        if (
          step.gateId === event.gate_id &&
          step.direction === event.direction
        ) {
          step.done = true;
          step.at = event.occurred_at;
          pointer = index + 1;
          break;
        }
      }
    }
    const next = route.findIndex((step) => !step.done);
    if (next !== -1) route[next].current = true;
    else if (route.length) route[route.length - 1].current = true;
    return route;
  }, [gates, guestEvents, showRoute]);

  if (loading) {
    return (
      <div className="space-y-2" role="status" aria-label="Loading visitor journey">
        <div className="h-8 w-full animate-pulse rounded bg-[var(--vms-surface-subtle)]" />
        <div className="h-8 w-full animate-pulse rounded bg-[var(--vms-surface-subtle)]" />
        <div className="h-8 w-full animate-pulse rounded bg-[var(--vms-surface-subtle)]" />
      </div>
    );
  }
  if (error) {
    return (
      <div
        role="alert"
        className="flex items-center justify-between gap-3 rounded-lg border border-[var(--vms-line)] p-3 text-sm text-[var(--vms-danger)]"
      >
        <span>{error}</span>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="shrink-0 text-xs font-semibold underline"
          >
            Retry
          </button>
        ) : null}
      </div>
    );
  }
  if (!guests.length) {
    return (
      <p className="text-xs text-[var(--vms-ink-muted)]">
        No visitors are attached to this invitation.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {guests.length > 1 ? (
        <div
          role="tablist"
          aria-label="Choose a visitor"
          className="flex flex-wrap gap-1.5"
        >
          {guests.map((guest) => {
            const active = guest.id === selectedId;
            return (
              <button
                key={guest.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSelectedId(guest.id)}
                className={cn(
                  "inline-flex min-h-8 items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]",
                  active
                    ? "border-[var(--vms-action)] bg-[var(--vms-action)] text-[var(--vms-on-action)]"
                    : "border-[var(--vms-line)] bg-[var(--vms-surface)] text-[var(--vms-ink-muted)] hover:text-[var(--vms-ink)]",
                )}
              >
                {guest.display_name_snapshot}
                <span className={active ? "opacity-80" : "opacity-60"}>
                  · {guest.suffix}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      {selected ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {selected.display_name_snapshot}
            </p>
            <p className="font-mono text-[11px] text-[var(--vms-ink-muted)]">
              Suffix {selected.suffix}
            </p>
          </div>
          <StatusBadge
            tone={selected.state === "checked_in" ? "success" : "neutral"}
          >
            {selected.state === "checked_in" ? "Checked in" : "Not checked in"}
          </StatusBadge>
        </div>
      ) : null}

      {steps.length ? (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--vms-ink-muted)]">
            Route
          </h4>
          <ol className="mt-2 space-y-0">
            {steps.map((step, index) => {
              const entry = step.direction === "entry";
              return (
                <li key={step.key} className="relative flex gap-3 pb-4 last:pb-0">
                  {index < steps.length - 1 ? (
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute left-[11px] top-6 h-full w-0.5",
                        step.done
                          ? "bg-[var(--vms-success)]"
                          : "bg-[var(--vms-line)]",
                      )}
                    />
                  ) : null}
                  <span
                    className={cn(
                      "relative z-10 mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border-2",
                      step.current
                        ? "border-[var(--vms-info)] bg-[var(--vms-info)] text-white"
                        : step.done
                          ? "border-[var(--vms-success)] bg-[var(--vms-success)] text-white"
                          : "border-dashed border-[var(--vms-line-strong)] bg-[var(--vms-surface)] text-[var(--vms-ink-muted)]",
                    )}
                  >
                    {step.done ? (
                      <Check className="h-3 w-3" aria-hidden="true" />
                    ) : step.current ? (
                      entry ? (
                        <LogIn className="h-3 w-3" aria-hidden="true" />
                      ) : (
                        <LogOut className="h-3 w-3" aria-hidden="true" />
                      )
                    ) : (
                      <CircleDashed className="h-3 w-3" aria-hidden="true" />
                    )}
                  </span>
                  <div
                    className={cn(
                      "min-w-0 flex-1",
                      !step.done && !step.current && "opacity-50",
                    )}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm">
                        {entry ? "Check in" : "Check out"} · {step.gateName}
                      </span>
                      {step.at ? (
                        <time
                          dateTime={step.at}
                          className="shrink-0 text-[11px] text-[var(--vms-ink-muted)]"
                        >
                          {formatTime(step.at)}
                        </time>
                      ) : null}
                    </div>
                    <span className="text-[11px] text-[var(--vms-ink-muted)]">
                      {step.done
                        ? entry
                          ? "Checked in"
                          : "Checked out"
                        : step.current
                          ? entry
                            ? "Waiting to check in here"
                            : "Waiting to check out here"
                          : "Not reached yet"}
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      ) : null}

      <div>
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--vms-ink-muted)]">
            Scans
          </h4>
          <span className="rounded-full border border-[var(--vms-line)] px-2 py-0.5 text-[10px] font-semibold text-[var(--vms-ink-muted)]">
            {guestEvents.length}
          </span>
        </div>
        {guestEvents.length ? (
          <ol className="mt-2 divide-y divide-[var(--vms-line)]">
            {guestEvents.map((event) => {
              const allowed = event.outcome === "allowed";
              return (
                <li
                  key={event.id}
                  className="flex items-start justify-between gap-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm">
                      {event.gate_name ||
                        `Gate ${event.gate_id.slice(0, 8)}`}{" "}
                      ·{" "}
                      {event.direction === "entry" ? "Checked in" : "Checked out"}
                    </p>
                    <p className="text-[11px] text-[var(--vms-ink-muted)]">
                      {allowed ? humanize(event.reason_code) : "Denied"} ·{" "}
                      {event.reason_code}
                    </p>
                  </div>
                  <time
                    dateTime={event.occurred_at}
                    className="shrink-0 text-right text-[11px] text-[var(--vms-ink-muted)]"
                  >
                    {formatDateTime(event.occurred_at)}
                  </time>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="mt-2 rounded-lg border border-dashed border-[var(--vms-line)] p-3 text-xs text-[var(--vms-ink-muted)]">
            No checkpoint scans have been recorded for this visitor.
          </p>
        )}
      </div>
    </div>
  );
}
