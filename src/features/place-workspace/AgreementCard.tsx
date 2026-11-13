"use client";

import { BadgeCheck } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { formatDate, formatDateRange } from "@/lib/datetime";

import type { LeaseAgreement } from "./api";
import { useAcceptLease, useLeaseAgreements } from "./queries";
import { SectionCard, StatusPill, formatMoney, titleCaseStatus } from "./ui";

function cadence(value: string | null): string {
  return value ? titleCaseStatus(value) : "";
}

function LeaseTerms({ lease }: { lease: LeaseAgreement }) {
  return (
    <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
      <div className="flex items-baseline justify-between gap-3 sm:block">
        <dt className="text-xs text-[var(--vms-ink-muted)]">Term</dt>
        <dd className="text-[var(--vms-ink)]">
          {lease.ends_at
            ? formatDateRange(lease.starts_at, lease.ends_at)
            : `${formatDate(lease.starts_at)} · open ended`}
        </dd>
      </div>
      <div className="flex items-baseline justify-between gap-3 sm:block">
        <dt className="text-xs text-[var(--vms-ink-muted)]">Rent</dt>
        <dd className="text-[var(--vms-ink)]">
          {lease.rent_amount
            ? `${formatMoney(lease.rent_amount, lease.currency)} ${cadence(
                lease.rent_cadence,
              ).toLowerCase()}`
            : "Not set"}
        </dd>
      </div>
      {lease.deposit_amount ? (
        <div className="flex items-baseline justify-between gap-3 sm:block">
          <dt className="text-xs text-[var(--vms-ink-muted)]">Deposit</dt>
          <dd className="text-[var(--vms-ink)]">
            {formatMoney(lease.deposit_amount, lease.currency)}
          </dd>
        </div>
      ) : null}
      <div className="flex items-baseline justify-between gap-3 sm:block">
        <dt className="text-xs text-[var(--vms-ink-muted)]">Notice</dt>
        <dd className="text-[var(--vms-ink)]">{lease.notice_days} days</dd>
      </div>
    </dl>
  );
}

function PlanLines({ lease }: { lease: LeaseAgreement }) {
  if (lease.charge_lines.length === 0) return null;
  return (
    <ul className="mt-3 divide-y divide-[var(--vms-line)] rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)]">
      {lease.charge_lines.map((line) => (
        <li
          key={line.id}
          className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
        >
          <span className="min-w-0">
            <span className="block truncate text-[var(--vms-ink)]">
              {line.name}
            </span>
            <span className="text-xs text-[var(--vms-ink-muted)]">
              {cadence(line.recurrence)}
            </span>
          </span>
          <span className="whitespace-nowrap tabular-nums text-[var(--vms-ink)]">
            {formatMoney(line.amount, line.currency)}
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * The tenant's agreement for this Place, and their acknowledgement of it.
 *
 * Acceptance does not start or stop anything: the administrator's confirmation
 * already created the charges, which are on the My charges screen. This card
 * exists so the Party can see the terms they are paying against and say they
 * have seen them.
 */
export function AgreementCard({
  placeId,
  partyId,
}: {
  placeId: string;
  partyId: string;
}) {
  const agreements = useLeaseAgreements(placeId, partyId);
  const accept = useAcceptLease(placeId, partyId);
  const leases = agreements.data?.items ?? [];

  if (agreements.isError || leases.length === 0) return null;

  return (
    <SectionCard
      title="Your agreement"
      description="The terms you are billed against. Your charges are on My charges."
    >
      <ul className="space-y-4">
        {leases.map((lease) => {
          const acknowledged = Boolean(lease.accepted_at);
          return (
            <li
              key={lease.id}
              className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] p-3"
            >
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <StatusPill status={lease.status} />
                <span className="text-xs text-[var(--vms-ink-muted)]">
                  {lease.reference ?? titleCaseStatus(lease.kind)}
                </span>
              </div>

              <LeaseTerms lease={lease} />
              <PlanLines lease={lease} />

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                {acknowledged ? (
                  <p className="flex items-center gap-1.5 text-xs text-[var(--vms-ink-muted)]">
                    <BadgeCheck
                      aria-hidden
                      className="h-3.5 w-3.5 text-[var(--vms-success)]"
                    />
                    You accepted these terms on{" "}
                    {formatDate(lease.accepted_at!)}
                  </p>
                ) : (
                  <p className="text-xs text-[var(--vms-ink-muted)]">
                    Let the office know you have seen these terms.
                  </p>
                )}
                {!acknowledged &&
                (lease.status === "active" || lease.status === "expiring") ? (
                  <Button
                    size="sm"
                    onClick={() => accept.mutate(lease.id)}
                    disabled={accept.isPending}
                  >
                    {accept.isPending ? "Saving…" : "Accept terms"}
                  </Button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </SectionCard>
  );
}
