"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useSiteAccess } from "@/features/context/use-site-access";
import { formatMoney } from "@/lib/currency";
import { formatDate } from "@/lib/datetime";
import { parseApiError } from "@/lib/error-utils";
import { useAppStore } from "@/store/app-store";
import { chargesApi, type Schedule } from "./api";

const scheduleStates = [
  { value: "", label: "All statuses" },
  { value: "scheduled", label: "Scheduled" },
  { value: "paid", label: "Paid" },
  { value: "void", label: "Void" },
];

function scheduleTone(status: string) {
  return status === "paid"
    ? "success"
    : status === "void"
      ? "neutral"
      : "warning";
}

export function ChargeRegister() {
  const site = useAppStore((state) => state.selectedSite);
  const access = useSiteAccess();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const canRead = access.allowed("charges.list");
  const query = useQuery({
    queryKey: ["charge-register", access.contextKey, page, status],
    queryFn: () => chargesApi.allSchedules(page, status || undefined),
    enabled: !!site?.id && !access.workspace.isError && canRead,
    retry: false,
  });
  const columns: Column<Schedule>[] = [
    {
      key: "charge",
      header: "Charge",
      accessor: (schedule) => (
        <Link
          href={`/admin/charges/definitions/${schedule.charge_definition.id}`}
          className="font-semibold underline-offset-4 hover:underline"
        >
          {schedule.charge_definition.name}
        </Link>
      ),
    },
    {
      key: "place",
      header: "Place",
      accessor: (schedule) => (
        <Link
          href={`/admin/places/${schedule.target_place.id}`}
          className="underline-offset-4 hover:underline"
        >
          {schedule.target_place.name}
        </Link>
      ),
    },
    {
      key: "payer",
      header: "Responsible Party",
      accessor: (schedule) =>
        schedule.current_responsibility?.responsible_party.display_name ??
        "Unassigned",
    },
    {
      key: "due_date",
      header: "Due",
      accessor: (schedule) => (
        <span className="whitespace-nowrap">
          {formatDate(schedule.due_date)}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Billed",
      className: "text-right",
      accessor: (schedule) => (
        <span className="whitespace-nowrap tabular-nums">
          {formatMoney(schedule.amount, schedule.currency)}
        </span>
      ),
    },
    {
      key: "amount_paid",
      header: "Paid",
      className: "text-right",
      accessor: (schedule) => (
        <span className="whitespace-nowrap tabular-nums">
          {formatMoney(schedule.amount_paid, schedule.currency)}
        </span>
      ),
    },
    {
      key: "balance",
      header: "Balance",
      className: "text-right",
      accessor: (schedule) => (
        <span className="whitespace-nowrap font-semibold tabular-nums">
          {formatMoney(schedule.balance, schedule.currency)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      accessor: (schedule) => (
        <StatusBadge tone={scheduleTone(schedule.status)}>
          {schedule.status === "void"
            ? "Void"
            : schedule.status === "paid"
              ? "Paid"
              : "Scheduled"}
        </StatusBadge>
      ),
    },
    {
      key: "open",
      header: "Action",
      mobileHide: true,
      className: "text-right",
      accessor: (schedule) => (
        <Button asChild size="sm" variant="ghost">
          <Link
            href={`/admin/charges/assignments/${schedule.charge_assignment_id}`}
          >
            Open
          </Link>
        </Button>
      ),
    },
  ];

  return (
    <main className="space-y-5 pb-10 text-[var(--vms-ink)]">
      <PageHeader
        eyebrow="Finance"
        title="Charge register"
        description="Review each billed schedule, its Place, responsible Party, due date, payments and remaining balance."
        metadata={
          site ? <span className="text-xs">Site · {site.name}</span> : null
        }
      />

      {access.workspace.isError ? (
        <InlineAlert tone="danger" title="Charge access could not be checked">
          {parseApiError(access.workspace.error).message}
        </InlineAlert>
      ) : !access.workspace.isPending && !canRead ? (
        <InlineAlert tone="warning" title="Charge register is restricted">
          Your Site role does not include charge read access.
        </InlineAlert>
      ) : !site ? (
        <InlineAlert tone="warning" title="Select a Site">
          Choose a Site before opening its charge register.
        </InlineAlert>
      ) : (
        <section className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-3 sm:p-4">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3 border-b border-[var(--vms-line)] pb-4">
            <div>
              <h2 className="text-base font-semibold">Billed schedules</h2>
              <p className="mt-1 text-sm text-[var(--vms-ink-muted)]">
                {query.data
                  ? `${query.data.total} schedule${query.data.total === 1 ? "" : "s"} in this Site${status ? ` with status ${status}` : ""}.`
                  : "Schedules in the selected Site."}
              </p>
            </div>
            <label className="space-y-1 text-xs font-medium">
              <span className="block">Status</span>
              <select
                value={status}
                onChange={(event) => {
                  setStatus(event.currentTarget.value);
                  setPage(1);
                }}
                className="min-h-10 rounded-[var(--vms-radius-control)] border border-[var(--vms-line-strong)] bg-[var(--vms-surface)] px-3 text-sm outline-none focus:border-[var(--vms-ink)] focus:ring-2 focus:ring-[var(--vms-focus)]"
              >
                {scheduleStates.map((state) => (
                  <option key={state.value} value={state.value}>
                    {state.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <DataTable
            data={query.data?.items ?? []}
            columns={columns}
            serverSide
            searchable={false}
            pageSize={20}
            currentPage={page}
            total={query.data?.total ?? 0}
            onPageChange={setPage}
            isLoading={query.isPending || access.workspace.isPending}
            errorMessage={
              query.isError ? parseApiError(query.error).message : null
            }
            isStale={query.isError && !!query.data}
            onRetry={() => query.refetch()}
            emptyMessage="No charge schedules match this status in the selected Site."
            tableLabel="Charge schedules"
            scrollHint="Scroll horizontally to compare billed amounts, payments and balances."
            mobileSummary={(schedule) => (
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <strong>{schedule.charge_definition.name}</strong>
                    <p className="mt-1 text-xs text-[var(--vms-ink-muted)]">
                      {schedule.target_place.name} · Due{" "}
                      {formatDate(schedule.due_date)}
                    </p>
                  </div>
                  <StatusBadge tone={scheduleTone(schedule.status)}>
                    {schedule.status}
                  </StatusBadge>
                </div>
                <p className="text-sm text-[var(--vms-ink-muted)]">
                  {schedule.current_responsibility?.responsible_party
                    .display_name ?? "Unassigned payer"}
                </p>
                <p className="text-sm font-semibold tabular-nums">
                  Balance {formatMoney(schedule.balance, schedule.currency)}
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link
                    href={`/admin/charges/assignments/${schedule.charge_assignment_id}`}
                  >
                    Open assignment
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            )}
          />
        </section>
      )}
    </main>
  );
}
