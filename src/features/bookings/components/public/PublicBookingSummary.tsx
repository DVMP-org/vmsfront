"use client";

import { formatMoney } from "@/lib/currency";
import { formatDate } from "@/lib/datetime";
import { estimateFromRates } from "../../public-lib";
import type { PublicRoomCategory } from "../../public-api-types";

/**
 * What the guest is about to ask for, kept visible while they fill the rest in.
 *
 * The total is an estimate and labelled as one: it is the advertised rate times
 * the nights and rooms, and the amount that gets charged is the server's answer
 * on the confirmation screen.
 */
export function PublicBookingSummary({
  siteName,
  checkInAt,
  checkOutAt,
  nights,
  category,
  rooms,
  guests,
}: {
  siteName: string;
  checkInAt: string;
  checkOutAt: string;
  nights: number;
  category: PublicRoomCategory | null;
  rooms: number;
  guests: number | null;
}) {
  const estimate = category
    ? estimateFromRates(category.rates, nights, rooms)
    : null;

  return (
    <section
      aria-label="Your selection"
      className="flex flex-col gap-2 rounded-xl border border-[var(--vms-border)] bg-[var(--vms-surface)] p-4 text-sm"
    >
      <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--vms-ink-muted)]">
        Your stay
      </h2>
      <p className="font-medium text-[var(--vms-ink)]">{siteName}</p>
      <p className="text-[var(--vms-ink)]">
        {formatDate(checkInAt)} → {formatDate(checkOutAt)}
      </p>
      <p className="text-xs text-[var(--vms-ink-muted)]">
        {nights} {nights === 1 ? "night" : "nights"} · {rooms}{" "}
        {rooms === 1 ? "room" : "rooms"}
        {guests ? ` · ${guests} ${guests === 1 ? "guest" : "guests"}` : ""}
      </p>
      {category ? (
        <>
          <p className="border-t border-[var(--vms-line)] pt-2 font-medium text-[var(--vms-ink)]">
            {category.name}
          </p>
          <p className="flex items-baseline justify-between gap-2">
            <span className="text-xs text-[var(--vms-ink-muted)]">
              {category.nightly_rate
                ? `${formatMoney(category.nightly_rate, category.currency ?? undefined)} per night`
                : "Price on request"}
            </span>
            {estimate !== null ? (
              <span className="font-semibold text-[var(--vms-ink)]">
                {formatMoney(estimate, category.currency ?? undefined)}
              </span>
            ) : null}
          </p>
          <p className="text-[10px] text-[var(--vms-ink-muted)]">
            Estimated total. The property confirms the final amount with you.
          </p>
        </>
      ) : null}
    </section>
  );
}
