"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";

import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { PanelState } from "@/features/dashboard/DashboardPrimitives";
import {
  formatDateTime,
  fromZonedDateTimeInputValue,
  toZonedDateTimeInputValue,
} from "@/lib/datetime";
import { parseApiError } from "@/lib/error-utils";

import { hospitalityApi } from "./api";
import { guestName, type Stay } from "./contracts";
import { StayStatusBadge } from "./components/StayStatusBadge";

type StayAction = "check-in" | "check-out";

export function StayReviewDrawer({
  siteTimezone,
  isOpen,
  onClose,
  stay,
  isLoading,
  error,
  onRetry,
  canCheckIn,
  canCheckOut,
  canUpdate,
  onChanged,
}: {
  siteTimezone?: string | null;
  isOpen: boolean;
  onClose: () => void;
  stay?: Stay;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  canCheckIn: boolean;
  canCheckOut: boolean;
  canUpdate: boolean;
  onChanged: (stay: Stay, message: string) => Promise<void>;
}) {
  const [pendingAction, setPendingAction] = useState<StayAction | null>(null);
  const [editing, setEditing] = useState(false);
  const [arrival, setArrival] = useState("");
  const [departure, setDeparture] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!stay || !siteTimezone) return;
    setArrival(toZonedDateTimeInputValue(stay.planned_check_in, siteTimezone));
    setDeparture(toZonedDateTimeInputValue(stay.planned_check_out, siteTimezone));
    setNotes(stay.notes || "");
    setPendingAction(null);
    setEditing(false);
    setFormError("");
  }, [stay, siteTimezone]);

  const transition = useMutation({
    mutationFn: (action: StayAction) => hospitalityApi.action(stay!.id, action),
    onSuccess: async (updated, action) => {
      setPendingAction(null);
      setFormError("");
      await onChanged(
        updated,
        action === "check-in" ? "Guest checked in." : "Guest checked out.",
      );
    },
    onError: (cause) => setFormError(parseApiError(cause).message),
  });
  const update = useMutation({
    mutationFn: (body: {
      planned_check_in: string;
      planned_check_out: string;
      notes: string | null;
    }) => hospitalityApi.update(stay!.id, body),
    onSuccess: async (updated) => {
      setEditing(false);
      setFormError("");
      await onChanged(updated, "Stay updated.");
    },
    onError: (cause) => setFormError(parseApiError(cause).message),
  });

  const close = () => {
    setPendingAction(null);
    setEditing(false);
    setFormError("");
    onClose();
  };
  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      if (!siteTimezone || !stay)
        throw new Error("Site time zone is unavailable.");
      const start =
        arrival === toZonedDateTimeInputValue(stay.planned_check_in, siteTimezone)
          ? new Date(stay.planned_check_in)
          : fromZonedDateTimeInputValue(arrival, siteTimezone);
      const end =
        departure === toZonedDateTimeInputValue(stay.planned_check_out, siteTimezone)
          ? new Date(stay.planned_check_out)
          : fromZonedDateTimeInputValue(departure, siteTimezone);
      if (end <= start) throw new Error("Departure must be after arrival.");
      setFormError("");
      update.mutate({
        planned_check_in: start.toISOString(),
        planned_check_out: end.toISOString(),
        notes: notes.trim() || null,
      });
    } catch (cause) {
      setFormError(
        cause instanceof Error ? cause.message : "Invalid stay dates.",
      );
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={close}
      title={stay ? guestName(stay) : "Review stay"}
      description={
        stay
          ? `Stay at ${stay.room_assignments.at(-1)?.room.name || "an unassigned room"}`
          : undefined
      }
      eyebrow="Hospitality stay"
    >
      {isLoading ? (
        <PanelState
          compact
          kind="loading"
          title="Loading stay"
          description="Fetching the guest and room details."
        />
      ) : error || !stay ? (
        <PanelState
          compact
          kind="error"
          title="Stay could not be loaded"
          description={error || "The stay is unavailable."}
          onRetry={onRetry}
        />
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <StayStatusBadge status={stay.status} />
            <span className="text-xs text-[var(--vms-ink-muted)]">
              {stay.guests.length} guest{stay.guests.length === 1 ? "" : "s"}
            </span>
          </div>

          <dl className="grid grid-cols-2 gap-x-5 gap-y-4 border-y border-[var(--vms-line)] py-4 text-sm">
            <Fact
              label="Planned arrival"
              value={formatDateTime(stay.planned_check_in, siteTimezone)}
            />
            <Fact
              label="Planned departure"
              value={formatDateTime(stay.planned_check_out, siteTimezone)}
            />
            <Fact
              label="Checked in"
              value={
                stay.actual_check_in
                  ? formatDateTime(stay.actual_check_in, siteTimezone)
                  : "—"
              }
            />
            <Fact
              label="Checked out"
              value={
                stay.actual_check_out
                  ? formatDateTime(stay.actual_check_out, siteTimezone)
                  : "—"
              }
            />
            <Fact
              label="Room"
              value={stay.room_assignments.at(-1)?.room.name || "Unassigned"}
            />
            <Fact label="Notes" value={stay.notes || "—"} />
          </dl>

          <div className="flex flex-wrap gap-2">
            {stay.guests.find((guest) => guest.role === "primary")?.party
              .id && (
              <Button asChild variant="outline" size="sm">
                <Link
                  href={`/admin/hospitality/guests/${stay.guests.find((guest) => guest.role === "primary")!.party.id}`}
                >
                  Guest profile
                </Link>
              </Button>
            )}
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/hospitality/billing?stay=${stay.id}`}>
                View folio
              </Link>
            </Button>
          </div>

          {formError && (
            <p
              role="alert"
              className="rounded-lg border border-[var(--vms-danger)] bg-[var(--vms-danger-subtle)] px-3 py-2 text-sm text-[var(--vms-danger)]"
            >
              {formError}
            </p>
          )}

          {pendingAction ? (
            <section className="rounded-lg border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] p-4">
              <h3 className="text-sm font-semibold">
                Confirm{" "}
                {pendingAction === "check-in" ? "check in" : "check out"}
              </h3>
              <p className="mt-1 text-sm text-[var(--vms-ink-muted)]">
                This changes the stay and room status.
              </p>
              <div className="mt-4 flex gap-2">
                <Button
                  size="sm"
                  isLoading={transition.isPending}
                  onClick={() => transition.mutate(pendingAction)}
                >
                  Confirm action
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPendingAction(null)}
                >
                  Cancel
                </Button>
              </div>
            </section>
          ) : editing ? (
            <form
              onSubmit={save}
              className="space-y-4 border-t border-[var(--vms-line)] pt-4"
            >
              <h3 className="text-sm font-semibold">Reschedule stay</h3>
              <p className="text-xs text-[var(--vms-ink-muted)]">
                Enter arrival and departure in the Site time zone ({siteTimezone}).
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm font-medium">
                  Planned arrival
                  <input
                    type="datetime-local"
                    required
                    value={arrival}
                    onChange={(event) => setArrival(event.target.value)}
                    className="h-10 rounded-lg border border-[var(--vms-line)] bg-[var(--vms-surface)] px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium">
                  Planned departure
                  <input
                    type="datetime-local"
                    required
                    value={departure}
                    onChange={(event) => setDeparture(event.target.value)}
                    className="h-10 rounded-lg border border-[var(--vms-line)] bg-[var(--vms-surface)] px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]"
                  />
                </label>
              </div>
              <label className="flex flex-col gap-1 text-sm font-medium">
                Notes
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className="rounded-lg border border-[var(--vms-line)] bg-[var(--vms-surface)] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]"
                />
              </label>
              <div className="flex gap-2">
                <Button type="submit" size="sm" isLoading={update.isPending}>
                  Save dates and notes
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex flex-wrap gap-2 border-t border-[var(--vms-line)] pt-4">
              {stay.status === "reserved" && canCheckIn && (
                <Button size="sm" onClick={() => setPendingAction("check-in")}>
                  Check in
                </Button>
              )}
              {stay.status === "checked_in" && canCheckOut && (
                <Button size="sm" onClick={() => setPendingAction("check-out")}>
                  Check out
                </Button>
              )}
              {stay.status === "reserved" && canUpdate && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!siteTimezone}
                  onClick={() => setEditing(true)}
                >
                  Reschedule / edit
                </Button>
              )}
              {stay.status === "reserved" && canUpdate && !siteTimezone && (
                <p className="text-xs text-[var(--vms-ink-muted)]">
                  Loading the Site time zone before rescheduling.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-[var(--vms-ink-muted)]">
        {label}
      </dt>
      <dd className="mt-1 break-words font-medium text-[var(--vms-ink)]">
        {value}
      </dd>
    </div>
  );
}
