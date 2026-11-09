"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { PageHeader } from "@/components/ui/PageHeader";
import PageLoader from "@/components/ui/PageLoader";

import { HospitalityModuleNav } from "./HospitalityModuleNav";
import type { useHospitalityAccess } from "./use-hospitality-access";

type HospitalityAccess = ReturnType<typeof useHospitalityAccess>;

export function HospitalityAdminPage({
  access,
  title,
  description,
  primaryAction,
  secondaryActions,
  children,
}: {
  access: HospitalityAccess;
  title: string;
  description: string;
  primaryAction?: ReactNode;
  secondaryActions?: ReactNode;
  children: ReactNode;
}) {
  if (access.isLoading) {
    return (
      <main className="mx-auto w-full max-w-[1440px] pb-10 pt-3 text-[var(--vms-ink)]">
        <PageLoader message="Loading hospitality permissions…" />
      </main>
    );
  }

  if (access.profile.isError) {
    return (
      <main className="mx-auto w-full max-w-[1440px] pb-10 pt-3 text-[var(--vms-ink)]">
        <InlineAlert
          tone="danger"
          title="Could not verify hospitality access"
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => access.profile.refetch()}
            >
              Retry
            </Button>
          }
        >
          Check your connection or ask an organization administrator for access.
        </InlineAlert>
      </main>
    );
  }

  if (!access.allowed("list")) {
    return (
      <main className="mx-auto w-full max-w-[1440px] pb-10 pt-3 text-[var(--vms-ink)]">
        <InlineAlert tone="warning" title="Hospitality access required">
          You do not have permission to view hospitality operations.
        </InlineAlert>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[1440px] pb-10 pt-3 text-[var(--vms-ink)]">
      <PageHeader
        eyebrow="Operations Hub / Hospitality"
        title={title}
        description={description}
        primaryAction={primaryAction}
        secondaryActions={secondaryActions}
      />
      <div className="mt-4">
        <HospitalityModuleNav />
      </div>
      <div className="mt-5 min-w-0">{children}</div>
    </main>
  );
}

export function RoomStatus({
  status,
  housekeeping,
}: {
  status: string;
  housekeeping?: string;
}) {
  const tone =
    status === "available"
      ? "success"
      : status === "out_of_service"
        ? "danger"
        : status === "cleaning"
          ? "warning"
          : status === "occupied"
            ? "info"
            : "neutral";
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <StatusPill tone={tone}>{status.replaceAll("_", " ")}</StatusPill>
      {housekeeping ? (
        <StatusPill
          tone={
            housekeeping === "clean" || housekeeping === "inspected"
              ? "success"
              : housekeeping === "dirty"
                ? "warning"
                : "neutral"
          }
        >
          {housekeeping.replaceAll("_", " ")}
        </StatusPill>
      ) : null}
    </div>
  );
}

export function StatusPill({
  tone,
  children,
}: {
  tone: "neutral" | "info" | "success" | "warning" | "danger";
  children: ReactNode;
}) {
  return (
    <span className="inline-flex min-h-6 items-center rounded-full bg-[var(--vms-surface-subtle)] px-2.5 text-xs font-semibold capitalize text-[var(--vms-ink-muted)] ring-1 ring-inset ring-[var(--vms-line)]">
      <span
        aria-hidden="true"
        className={
          tone === "success"
            ? "mr-1.5 h-1.5 w-1.5 rounded-full bg-[var(--vms-success)]"
            : tone === "warning"
              ? "mr-1.5 h-1.5 w-1.5 rounded-full bg-[var(--vms-warning)]"
              : tone === "danger"
                ? "mr-1.5 h-1.5 w-1.5 rounded-full bg-[var(--vms-danger)]"
                : tone === "info"
                  ? "mr-1.5 h-1.5 w-1.5 rounded-full bg-[var(--vms-info)]"
                  : "mr-1.5 h-1.5 w-1.5 rounded-full bg-[var(--vms-ink-muted)]"
        }
      />
      {children}
    </span>
  );
}

export function ModuleMetrics({
  items,
}: {
  items: Array<{
    label: string;
    value: ReactNode;
    detail: string;
    icon: LucideIcon;
  }>;
}) {
  return (
    <section
      aria-label="Hospitality summary"
      className="grid overflow-hidden rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] sm:grid-cols-2 xl:grid-cols-4"
    >
      {items.map(({ label, value, detail, icon: Icon }) => (
        <div
          key={label}
          className="flex min-w-0 items-start gap-3 border-b border-[var(--vms-line)] p-4 last:border-b-0 sm:[&:nth-child(odd)]:border-r xl:border-b-0 xl:border-r xl:last:border-r-0"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--vms-radius-control)] bg-[var(--vms-surface-subtle)] text-[var(--vms-ink-muted)]">
            <Icon className="h-4 w-4" aria-hidden={true} />
          </span>
          <div className="min-w-0">
            <span className="block text-xs font-medium text-[var(--vms-ink-muted)]">
              {label}
            </span>
            <strong className="block text-xl font-semibold leading-7">
              {value}
            </strong>
            <span className="block text-xs leading-5 text-[var(--vms-ink-muted)]">
              {detail}
            </span>
          </div>
        </div>
      ))}
    </section>
  );
}

export function ModulePanel({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0 overflow-hidden rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)]">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--vms-line)] px-4 py-3 sm:px-5">
        <div>
          <h2 className="text-base font-semibold leading-6">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-sm leading-5 text-[var(--vms-ink-muted)]">
              {description}
            </p>
          ) : null}
        </div>
        {action}
      </header>
      <div className="min-w-0 p-4 sm:p-5">{children}</div>
    </section>
  );
}

export function money(value: string | number, currency: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return `${currency} ${value}`;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function displayDate(
  value: string | null | undefined,
  withTime = false,
) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}
