"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  FileClock,
  ShieldAlert,
  Wrench,
} from "lucide-react";

import { formatMoney } from "@/lib/currency";
import { formatDateTime } from "@/lib/datetime";
import type { AttentionCategory, AttentionItem, OperationsAttention } from "@/types";
import { PanelState, ReportPanel, SeeAllLink } from "./DashboardPrimitives";

/**
 * The interface owns the sentence an operator reads; the API only sends a
 * machine code. Adding a new code on the server means adding its copy here.
 */
const CODE_COPY: Record<string, string> = {
  "access.awaiting_approval": "Invitation awaiting approval",
  "billing.charge_overdue": "Charge past due",
  "maintenance.past_due": "Maintenance past due",
  "lease.expiring": "Lease ending soon",
};

const KIND_COPY: Record<
  string,
  { label: string; href: string; Icon: typeof ShieldAlert }
> = {
  access: {
    label: "Access",
    href: "/admin/invitations",
    Icon: ShieldAlert,
  },
  billing: {
    label: "Billing",
    href: "/admin/charges",
    Icon: CreditCard,
  },
  maintenance: {
    label: "Maintenance",
    href: "/admin/residential/maintenance",
    Icon: Wrench,
  },
  lease: {
    label: "Leases",
    href: "/admin/leases",
    Icon: FileClock,
  },
};

function maintenanceSegment(
  domain: string | null | undefined,
  fallbackUseCase: string,
) {
  for (const candidate of [domain, fallbackUseCase]) {
    if (!candidate) continue;
    const key = candidate.trim().toLowerCase().replaceAll(" ", "_");
    if (key === "mixed_use") return "mixed-use";
    if (["residential", "commercial", "hospitality"].includes(key)) return key;
  }
  return null;
}

function maintenanceHref(
  domain: string | null | undefined,
  fallbackUseCase: string,
) {
  const segment = maintenanceSegment(domain, fallbackUseCase);
  return segment ? `/admin/${segment}/maintenance` : "/admin";
}

function hrefFor(item: AttentionItem, useCase: string) {
  if (item.kind === "maintenance") return maintenanceHref(item.domain, useCase);
  return KIND_COPY[item.kind]?.href ?? "/admin";
}

function categoryHref(kind: string, useCase: string) {
  if (kind === "maintenance") return maintenanceHref(null, useCase);
  return KIND_COPY[kind]?.href ?? "/admin";
}

function titleFor(item: AttentionItem) {
  return CODE_COPY[item.code] ?? item.code.replaceAll("_", " ");
}

function contextFor(item: AttentionItem) {
  const parts = [item.place_name, item.party_name].filter(
    (part): part is string => Boolean(part),
  );
  return parts.length ? parts.join(" · ") : "Property-wide";
}

function detailFor(item: AttentionItem) {
  const details: string[] = [];
  if (item.due_at) details.push(formatDateTime(item.due_at));
  if (item.amount != null && item.currency) {
    details.push(formatMoney(item.amount, item.currency));
  }
  return details.join(" · ");
}

function CategoryBlock({
  category,
  useCase,
  propertyName,
}: {
  category: AttentionCategory;
  useCase: string;
  propertyName: string;
}) {
  const copy = KIND_COPY[category.kind];
  const Icon = copy?.Icon ?? ShieldAlert;

  return (
    <div className="border-t border-[var(--vms-line)] first:border-t-0">
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 sm:px-5">
        <span className="flex min-w-0 items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--vms-ink-muted)]">
          <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="truncate">{copy?.label ?? category.kind}</span>
        </span>
        <span className="shrink-0 rounded-full bg-[var(--vms-warning-subtle)] px-2 py-0.5 text-[11px] font-semibold text-[var(--vms-warning)]">
          {category.count}
        </span>
      </div>
      <ul className="divide-y divide-[var(--vms-line)]">
        {category.items.map((item) => (
          <li key={`${item.code}-${item.subject_id}`}>
            <Link
              href={hrefFor(item, useCase)}
              className="group flex min-h-16 items-start gap-3 px-4 py-3 transition-colors hover:bg-[var(--vms-surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--vms-focus)] sm:px-5"
            >
              <span className="min-w-0 flex-1">
                <strong className="block text-sm font-semibold leading-5 text-[var(--vms-ink)]">
                  {titleFor(item)}
                </strong>
                <span className="mt-0.5 block truncate text-xs leading-5 text-[var(--vms-ink-muted)]">
                  {contextFor(item) || propertyName}
                </span>
                {detailFor(item) ? (
                  <span className="mt-0.5 block text-[11px] text-[var(--vms-ink-muted)]">
                    {detailFor(item)}
                  </span>
                ) : null}
              </span>
              <ArrowRight
                className="mt-1 h-4 w-4 shrink-0 text-[var(--vms-ink-muted)] transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                aria-hidden
              />
            </Link>
          </li>
        ))}
      </ul>
      {category.count > category.items.length ? (
        <div className="px-4 pb-3 sm:px-5">
          <SeeAllLink href={categoryHref(category.kind, useCase)}>
            {category.count - category.items.length} more in{" "}
            {copy?.label ?? category.kind}
          </SeeAllLink>
        </div>
      ) : null}
    </div>
  );
}

export function AttentionQueue({
  queue,
  useCase,
  propertyName,
  isLoading,
  isError,
  onRetry,
  isRetrying = false,
}: {
  queue?: OperationsAttention;
  useCase: string;
  propertyName: string;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  isRetrying?: boolean;
}) {
  const categories = (queue?.categories ?? []).filter(
    (category) => category.count > 0,
  );

  return (
    <ReportPanel
      title="Attention required"
      description="Work that is overdue, unapproved or about to expire at this property."
      action={
        queue?.total ? (
          <span className="text-xs font-semibold text-[var(--vms-ink-muted)]">
            {queue.total} open
          </span>
        ) : undefined
      }
    >
      {isLoading ? (
        <PanelState
          kind="loading"
          title="Loading the work queue"
          description="Checking approvals, charges, maintenance and leases for this property."
          compact
        />
      ) : isError ? (
        <PanelState
          kind="error"
          title="The work queue could not be loaded"
          description="Nothing has been changed. Retry to read the current exceptions."
          onRetry={onRetry}
          isRetrying={isRetrying}
          compact
        />
      ) : !queue || queue.total === 0 ? (
        <div className="flex min-h-32 items-center gap-3 px-5 py-6 text-sm text-[var(--vms-ink-muted)]">
          <CheckCircle2
            className="h-5 w-5 shrink-0 text-[var(--vms-success)]"
            aria-hidden
          />
          Nothing is overdue or waiting for a decision.
        </div>
      ) : (
        <div>
          {categories.map((category) => (
            <CategoryBlock
              key={category.kind}
              category={category}
              useCase={useCase}
              propertyName={propertyName}
            />
          ))}
        </div>
      )}
    </ReportPanel>
  );
}
