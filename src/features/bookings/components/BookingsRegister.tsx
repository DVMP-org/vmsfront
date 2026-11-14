"use client";

import { useState } from "react";

import { DetailPanel } from "@/components/ui/DetailPanel";
import { Drawer } from "@/components/ui/Drawer";
import { PanelState } from "@/features/dashboard/DashboardPrimitives";
import { useMediaQuery } from "@/hooks/use-media-query";
import { BookingDetailPanel } from "./BookingDetailPanel";
import { BookingRegisterRow } from "./BookingRegisterRow";
import type { BookingStatus } from "../types";
import { useBooking, useBookings } from "../queries";

const STATUS_FILTERS: Array<{ value: BookingStatus | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "pending_payment", label: "Awaiting payment" },
  { value: "requested", label: "To decide" },
  { value: "confirmed", label: "Confirmed" },
  { value: "declined", label: "Declined" },
];

/**
 * One Site's booking register.
 *
 * The Site comes from the API client's selected Site, so this page can never
 * show another Site's bookings even by accident. The detail is a sticky sidebar
 * from `xl` up and a drawer below it — never both, which is why the sidebar is
 * rendered conditionally rather than hidden with CSS.
 */
export function BookingsRegister() {
  const [status, setStatus] = useState<BookingStatus | "all">("requested");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const isWide = useMediaQuery("(min-width: 1280px)", true);

  const list = useBookings(
    status === "all" ? {} : { status, page_size: 50 },
  );
  const detail = useBooking(selectedId);

  const bookings = list.data?.items ?? [];
  const close = () => setSelectedId(null);

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <header className="flex flex-col gap-2">
          <h1 className="text-lg font-semibold text-[var(--vms-ink)]">Bookings</h1>
          <p className="text-xs text-[var(--vms-ink-muted)]">
            Every booking at this Site, with who asked and what was decided.
          </p>
        </header>

        <div
          role="group"
          aria-label="Filter bookings by status"
          className="flex flex-wrap gap-2"
        >
          {STATUS_FILTERS.map((filter) => {
            const active = status === filter.value;
            return (
              <button
                key={filter.value}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setStatus(filter.value);
                  setSelectedId(null);
                }}
                className={
                  "min-h-11 rounded-lg border px-3 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-accent)] " +
                  (active
                    ? "border-[var(--vms-accent)] bg-[var(--vms-surface-muted)] text-[var(--vms-ink)]"
                    : "border-[var(--vms-border)] text-[var(--vms-ink-muted)] hover:bg-[var(--vms-surface-muted)]")
                }
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        {list.isPending ? (
          <PanelState
            kind="loading"
            title="Loading bookings"
            description="Fetching this Site's register."
          />
        ) : list.isError ? (
          <PanelState
            kind="error"
            title="Bookings could not be loaded"
            description="The register is unavailable right now."
            onRetry={() => void list.refetch()}
            isRetrying={list.isFetching}
            retryLabel="Retry bookings"
          />
        ) : bookings.length === 0 ? (
          <PanelState
            kind="empty"
            title="No bookings here"
            description="Nothing matches this filter for the selected Site."
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {bookings.map((booking) => (
              <li key={booking.id}>
                <BookingRegisterRow
                  booking={booking}
                  selected={booking.id === selectedId}
                  onSelect={setSelectedId}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      {isWide ? (
        selectedId ? (
          <aside className="sticky top-4 w-96 shrink-0">
            <DetailPanel
              title="Booking"
              description="Decision, trail and payments"
              onClose={close}
            >
              {detail.isPending ? (
                <PanelState
                  kind="loading"
                  compact
                  title="Loading booking"
                  description="Fetching the decision trail."
                />
              ) : detail.isError || !detail.data ? (
                <PanelState
                  kind="error"
                  compact
                  title="Booking could not be loaded"
                  description="Try selecting it again."
                  onRetry={() => void detail.refetch()}
                  isRetrying={detail.isFetching}
                  retryLabel="Retry booking"
                />
              ) : (
                <BookingDetailPanel booking={detail.data} />
              )}
            </DetailPanel>
          </aside>
        ) : null
      ) : (
        <Drawer
          isOpen={Boolean(selectedId)}
          onClose={close}
          title="Booking"
          description="Decision, trail and payments"
        >
          {detail.data ? <BookingDetailPanel booking={detail.data} /> : null}
        </Drawer>
      )}
    </div>
  );
}
