"use client";

import { useState } from "react";
import { BadgeCheck, FileSignature, Receipt, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { SlideOver } from "@/components/ui/SlideOver";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatMoney } from "@/lib/currency";
import { formatDate } from "@/lib/datetime";

import type { Lease } from "../api";
import {
  cadenceLabel,
  leaseAttentionReasons,
  leaseExpiryCopy,
  leaseKindLabel,
  leaseStatusLabel,
  leaseStatusTone,
  leaseTermLabel,
} from "../lib";
import { useActivateLease, useLeasePlan } from "../queries";
import { LeasePlanSummary } from "./LeasePlanSummary";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <dt className="text-xs font-medium text-[var(--vms-ink-muted)]">{label}</dt>
      <dd className="text-right text-sm text-[var(--vms-ink)]">{value}</dd>
    </div>
  );
}

/**
 * One lease in full, including what confirming it will do.
 *
 * The confirmation panel is the point of this screen: it names every charge
 * that will be created, says whether each one reuses a Site definition or
 * creates a new one, and shows the installment window. Nothing is written until
 * the operator presses confirm.
 */
export function LeaseDetailDrawer({
  isOpen,
  onClose,
  siteId,
  lease,
  onEdit,
  onTerminate,
}: {
  isOpen: boolean;
  onClose: () => void;
  siteId?: string | null;
  lease: Lease | null;
  onEdit: (lease: Lease) => void;
  onTerminate: (lease: Lease) => void;
}) {
  const [reviewing, setReviewing] = useState(false);
  const activate = useActivateLease(siteId);
  const plan = useLeasePlan(siteId, lease?.id, isOpen && reviewing);

  if (!lease) return null;

  const confirmable =
    lease.status === "draft" || lease.status === "pending_signature";
  const expiry = leaseExpiryCopy(lease);
  const attention = leaseAttentionReasons(lease);

  function close() {
    setReviewing(false);
    activate.reset();
    onClose();
  }

  return (
    <SlideOver
      isOpen={isOpen}
      onClose={close}
      title={lease.party_name ?? "Lease"}
      description={`${lease.place_name ?? "Space"} · ${leaseKindLabel(lease.kind)}`}
      size="lg"
      footer={
        <div className="flex flex-wrap items-center justify-end gap-2">
          {confirmable ? (
            <>
              <Button variant="secondary" onClick={() => onEdit(lease)}>
                Edit draft
              </Button>
              <Button variant="destructive-outlined" onClick={() => onTerminate(lease)}>
                Cancel draft
              </Button>
              {reviewing ? (
                <Button
                  onClick={() => activate.mutate(lease.id, { onSuccess: close })}
                  disabled={activate.isPending || !plan.data?.creates_assignments}
                >
                  <BadgeCheck className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  {activate.isPending ? "Confirming…" : "Confirm and create charges"}
                </Button>
              ) : (
                <Button onClick={() => setReviewing(true)}>
                  <FileSignature className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  Review and confirm
                </Button>
              )}
            </>
          ) : (
            <Button variant="secondary" onClick={close}>
              Close
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6 pb-6">
        <section className="flex flex-wrap items-center gap-2">
          <StatusBadge tone={leaseStatusTone(lease.status)}>
            {leaseStatusLabel(lease.status)}
          </StatusBadge>
          <StatusBadge tone={expiry.tone}>{expiry.label}</StatusBadge>
          {lease.reference ? (
            <span className="text-xs text-[var(--vms-ink-muted)]">
              {lease.reference}
            </span>
          ) : null}
        </section>

        {attention.length > 0 ? (
          <ul className="space-y-1.5">
            {attention.map((reason) => (
              <li
                key={reason.id}
                className="flex items-start gap-2 text-xs text-[var(--vms-ink-muted)]"
              >
                <ShieldAlert
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--vms-warning)]"
                  aria-hidden="true"
                />
                {reason.label}
              </li>
            ))}
          </ul>
        ) : null}

        <section>
          <h3 className="mb-1 text-sm font-semibold text-[var(--vms-ink)]">
            Agreement
          </h3>
          <dl className="divide-y divide-[var(--vms-border)]">
            <Row label="Term" value={leaseTermLabel(lease)} />
            <Row
              label="Rent"
              value={
                lease.rent_amount
                  ? `${formatMoney(lease.rent_amount, lease.currency)}${
                      lease.rent_cadence
                        ? ` ${cadenceLabel(lease.rent_cadence).toLowerCase()}`
                        : ""
                    }`
                  : "Not set"
              }
            />
            <Row
              label="Deposit"
              value={
                lease.deposit_amount
                  ? formatMoney(lease.deposit_amount, lease.currency)
                  : "None"
              }
            />
            <Row label="Notice" value={`${lease.notice_days} days`} />
            <Row
              label="Signed"
              value={lease.signed_at ? formatDate(lease.signed_at) : "Not signed"}
            />
            {lease.terminated_on ? (
              <Row
                label="Ended"
                value={`${formatDate(lease.terminated_on)}${
                  lease.termination_reason ? ` · ${lease.termination_reason}` : ""
                }`}
              />
            ) : null}
          </dl>
        </section>

        <section>
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-[var(--vms-ink)]">
            <Receipt className="h-4 w-4" aria-hidden="true" />
            Charges
          </h3>
          <LeasePlanSummary lines={lease.charge_lines} currency={lease.currency} />
        </section>

        {reviewing ? (
          <section
            aria-live="polite"
            className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-action)] bg-[var(--vms-surface-subtle)] p-4"
          >
            <h3 className="text-sm font-semibold text-[var(--vms-ink)]">
              Confirming will create
            </h3>
            {plan.isLoading ? (
              <p className="mt-2 text-sm text-[var(--vms-ink-muted)]">
                Working out the plan…
              </p>
            ) : plan.isError ? (
              <p role="alert" className="mt-2 text-sm text-[var(--vms-danger)]">
                The plan could not be checked. Close this panel and try again.
              </p>
            ) : plan.data ? (
              <>
                <ul className="mt-3 space-y-2">
                  {plan.data.lines.map((line) => (
                    <li
                      key={line.name}
                      className="flex items-start justify-between gap-3 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-[var(--vms-ink)]">
                          {line.name}
                        </p>
                        <p className="text-xs text-[var(--vms-ink-muted)]">
                          {line.creates_definition
                            ? "Creates a new charge definition"
                            : "Reuses the Site definition"}{" "}
                          · {line.schedule_count}{" "}
                          {line.schedule_count === 1 ? "installment" : "installments"}{" "}
                          · {formatDate(line.first_due_date)} to{" "}
                          {formatDate(line.last_due_date)}
                        </p>
                      </div>
                      <span className="whitespace-nowrap tabular-nums">
                        {formatMoney(line.amount, line.currency)}
                      </span>
                    </li>
                  ))}
                </ul>
                {!plan.data.creates_assignments ? (
                  <p className="mt-3 text-xs text-[var(--vms-warning)]">
                    There is nothing to bill, so this lease cannot be confirmed
                    until it has at least one charge that is not cancelled.
                  </p>
                ) : null}
              </>
            ) : null}

            {activate.isError ? (
              <p role="alert" className="mt-3 text-sm text-[var(--vms-danger)]">
                The lease could not be confirmed. Nothing was created.
              </p>
            ) : null}
          </section>
        ) : null}
      </div>
    </SlideOver>
  );
}
