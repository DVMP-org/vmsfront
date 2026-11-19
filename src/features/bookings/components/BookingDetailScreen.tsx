"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";

import { PanelState } from "@/features/dashboard/DashboardPrimitives";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatMoney } from "@/lib/currency";
import { formatDate } from "@/lib/datetime";
import { BookingEditDialog } from "./BookingEditDialog";
import { BookingStatusBadge } from "./BookingStatusBadge";
import { BookingActivitySection } from "./detail/BookingActivitySection";
import { BookingDetailActions } from "./detail/BookingDetailActions";
import {
  BookingDetailTabs,
  type BookingDetailTab,
} from "./detail/BookingDetailTabs";
import { BookingFolioSection } from "./detail/BookingFolioSection";
import { BookingOverviewSection } from "./detail/BookingOverviewSection";
import { BookingPaymentsSection } from "./detail/BookingPaymentsSection";
import { BookingRoomsSection } from "./detail/BookingRoomsSection";
import { BookingStayActions } from "./detail/BookingStayActions";
import type { BookingDetailDto } from "../api-types";
import { useBooking, useBookingPayments } from "../queries";
import { outstandingBalance, paymentStatusView, stayNights } from "../lib";

const TABS: BookingDetailTab[] = [
  { key: "overview", label: "Overview" },
  { key: "rooms", label: "Rooms & charges" },
  { key: "folio", label: "Folio" },
  { key: "payments", label: "Payments" },
  { key: "activity", label: "Activity" },
];

/**
 * One booking, as the place an operator works from.
 *
 * The register answers "which bookings need me"; this answers "what is happening
 * with this one". The tabs keep the four questions apart — who they are, what is
 * held, what is owed, what happened — because a single column of everything is
 * how a desk ends up scrolling past the thing it needed.
 *
 * The aside carries the decisions and the balance. It is sticky from `xl` up and
 * stacks above the tabs below that, which is one surface rather than two.
 */
export function BookingDetailScreen({ bookingId }: { bookingId: string }) {
  const booking = useBooking(bookingId);
  const payments = useBookingPayments(bookingId);
  const [tab, setTab] = useState("overview");
  const [editing, setEditing] = useState(false);

  if (booking.isPending) {
    return (
      <PanelState
        kind="loading"
        title="Loading booking"
        description="Fetching the arrangement and its trail."
      />
    );
  }

  if (booking.isError || !booking.data) {
    return (
      <PanelState
        kind="error"
        title="Booking could not be loaded"
        description="It may have been removed, or it belongs to another Site."
        onRetry={() => void booking.refetch()}
        isRetrying={booking.isFetching}
        retryLabel="Retry booking"
      />
    );
  }

  const data: BookingDetailDto = booking.data;
  const balance = outstandingBalance(data.total, payments.data ?? []);
  const payment = paymentStatusView(data.financials);
  const nights = stayNights(data.check_in_at, data.check_out_at);
  const heading = data.reference ?? data.requester_name;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Link
          href="/admin/bookings"
          className="inline-flex w-fit items-center gap-1 text-xs font-medium text-[var(--vms-ink-muted)] hover:text-[var(--vms-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-accent)]"
        >
          <ArrowLeft aria-hidden className="h-3.5 w-3.5" />
          All bookings
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-lg font-semibold text-[var(--vms-ink)]">
            {heading}
          </h1>
          <BookingStatusBadge status={data.status} />
          <StatusBadge tone={payment.tone}>{payment.label}</StatusBadge>
        </div>
        <p className="text-xs text-[var(--vms-ink-muted)]">
          {data.requester_name} · {formatDate(data.check_in_at)} →{" "}
          {formatDate(data.check_out_at)}
          {nights !== null
            ? ` · ${nights} ${nights === 1 ? "night" : "nights"}`
            : ""}{" "}
          · {data.guest_count} {data.guest_count === 1 ? "guest" : "guests"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start">
        <div className="flex min-w-0 flex-col rounded-xl border border-[var(--vms-line)] bg-[var(--vms-surface)]">
          <BookingDetailTabs
            tabs={TABS}
            active={tab}
            onChange={setTab}
            label="Booking sections"
          />
          <div
            role="tabpanel"
            // The tab ids are generated inside the tablist, so the panel is
            // labelled by the tab's own accessible name via aria-label instead
            // of duplicating that id derivation here.
            aria-label={TABS.find((entry) => entry.key === tab)?.label}
            className="flex flex-col gap-4 p-4 sm:p-5"
          >
            {tab === "overview" ? (
              <BookingOverviewSection booking={data} />
            ) : null}
            {tab === "rooms" ? <BookingRoomsSection booking={data} /> : null}
            {tab === "folio" ? <BookingFolioSection booking={data} /> : null}
            {tab === "payments" ? (
              <BookingPaymentsSection booking={data} />
            ) : null}
            {tab === "activity" ? (
              <BookingActivitySection booking={data} />
            ) : null}
          </div>
        </div>

        <aside className="flex flex-col gap-4 xl:sticky xl:top-4">
          <div className="flex flex-col gap-3 rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-4">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setEditing(true)}
              >
                Edit booking
              </Button>
            </div>
            <BookingStayActions booking={data} />
            <BookingDetailActions booking={data} />
            {data.payment_status ? (
              <p className="text-xs text-[var(--vms-ink-muted)]">
                Payment marked {data.payment_status}
              </p>
            ) : null}
            <dl className="flex flex-col gap-2 border-t border-[var(--vms-line)] pt-3 text-sm">
              {data.financials ? (
                <>
                  <div className="flex items-baseline justify-between gap-2">
                    <dt className="text-xs text-[var(--vms-ink-muted)]">
                      Accommodation
                    </dt>
                    <dd className="tabular-nums">
                      {formatMoney(
                        data.financials.accommodation,
                        data.financials.currency,
                      )}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-2">
                    <dt className="text-xs text-[var(--vms-ink-muted)]">
                      Additional charges
                    </dt>
                    <dd className="tabular-nums">
                      {formatMoney(
                        data.financials.additional,
                        data.financials.currency,
                      )}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-2 border-t border-[var(--vms-line)] pt-2">
                    <dt className="text-xs text-[var(--vms-ink-muted)]">
                      Total payable
                    </dt>
                    <dd className="font-medium tabular-nums">
                      {formatMoney(data.financials.total, data.financials.currency)}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-2">
                    <dt className="text-xs text-[var(--vms-ink-muted)]">Paid</dt>
                    <dd className="tabular-nums">
                      {formatMoney(data.financials.paid, data.financials.currency)}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-2">
                    <dt className="text-xs text-[var(--vms-ink-muted)]">
                      Outstanding
                    </dt>
                    <dd className="font-medium tabular-nums">
                      {formatMoney(
                        data.financials.balance,
                        data.financials.currency,
                      )}
                    </dd>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-baseline justify-between gap-2">
                    <dt className="text-xs text-[var(--vms-ink-muted)]">
                      Agreed
                    </dt>
                    <dd className="font-medium text-[var(--vms-ink)]">
                      {data.total === null
                        ? "—"
                        : formatMoney(data.total, data.currency)}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-2">
                      <dt className="text-xs text-[var(--vms-ink-muted)]">
                        Balance
                      </dt>
                      <dd className="font-medium text-[var(--vms-ink)]">
                        {balance === null
                          ? "—"
                          : formatMoney(balance, data.currency)}
                      </dd>
                    </div>
                </>
              )}
            </dl>
          </div>
        </aside>
      </div>

      <BookingEditDialog
        isOpen={editing}
        onClose={() => setEditing(false)}
        booking={data}
      />
    </div>
  );
}
