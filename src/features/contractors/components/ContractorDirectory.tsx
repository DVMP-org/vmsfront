"use client";

import { useMemo, useState } from "react";
import { ShieldCheck, UserRoundPlus, Users } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useConfirmAction } from "@/components/ui/useConfirmAction";
import { useSiteAccess } from "@/features/context/use-site-access";
import { parseApiError } from "@/lib/error-utils";
import { useAppStore } from "@/store/app-store";

import type { Contractor } from "../api";
import {
  contractorMeta,
  contractorNeedsAttention,
  contractorPermitState,
  contractorPermitSummary,
  contractorStatusLabel,
  contractorStatusTone,
  contractorWindow,
} from "../lib";
import { useContractors, useRevokeContractor } from "../queries";
import { CreateContractorDrawer } from "./CreateContractorDrawer";
import { EditContractorDrawer } from "./EditContractorDrawer";

/**
 * Site contractors: external people and firms invited for a bounded window.
 * They are Site records, so this screen never mixes with tenant or employee
 * directories.
 */
export function ContractorDirectory() {
  const storedSite = useAppStore((state) => state.selectedSite);
  const access = useSiteAccess();
  const selectedSite =
    access.workspace.data?.management?.selected_site ?? storedSite;
  const canManage =
    access.isAdministrator ||
    access.allowed(["contractors.create", "contractors.update"]);
  const [createOpen, setCreateOpen] = useState(false);
  const [managed, setManaged] = useState<Contractor | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | Contractor["status"]>(
    "all",
  );
  const { confirmAction, confirmationDialog } = useConfirmAction();
  const query = useContractors(selectedSite?.id);
  const revoke = useRevokeContractor(selectedSite?.id);

  const allRows = useMemo(() => query.data?.items ?? [], [query.data]);
  const rows =
    statusFilter === "all"
      ? allRows
      : allRows.filter((row) => row.status === statusFilter);
  const active = allRows.filter((row) => row.status === "active").length;
  const attention = allRows.filter(contractorNeedsAttention).length;
  const permits = allRows.filter((row) => row.requires_permit).length;

  const columns: Column<Contractor>[] = [
    {
      key: "contact_name",
      header: "Contractor",
      sortable: true,
      accessor: (row) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-[var(--vms-ink)]">
            {row.contact_name}
          </p>
          <p className="truncate text-xs text-[var(--vms-ink-muted)]">
            {contractorMeta(row) || row.email}
          </p>
        </div>
      ),
    },
    {
      key: "access_to",
      header: "Access window",
      sortable: true,
      accessor: (row) => (
        <div>
          <p className="text-sm">{contractorWindow(row)}</p>
          {contractorNeedsAttention(row) ? (
            <span className="text-xs font-medium text-[var(--vms-warning)]">
              Ending soon
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      accessor: (row) => (
        <StatusBadge tone={contractorStatusTone(row.status)}>
          {contractorStatusLabel(row.status)}
        </StatusBadge>
      ),
    },
    {
      key: "permit",
      header: "Permit",
      accessor: (row) => {
        const state = contractorPermitState(row);
        return (
          <span
            className={
              state === "expired" || state === "missing"
                ? "text-xs font-medium text-[var(--vms-danger)]"
                : "text-xs text-[var(--vms-ink-muted)]"
            }
          >
            {contractorPermitSummary(row)}
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "",
      accessor: (row) =>
        canManage && row.status !== "revoked" ? (
          <div className="flex items-center justify-end gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setManaged(row)}
            >
              Manage
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                confirmAction({
                  title: `Revoke ${row.contact_name}'s access?`,
                  description:
                    "Their window closes immediately. Revoked contractors stay on record for audit.",
                  confirmLabel: "Revoke access",
                  onConfirm: () => revoke.mutateAsync(row.id),
                })
              }
            >
              Revoke
            </Button>
          </div>
        ) : (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setManaged(row)}
            >
              View
            </Button>
          </div>
        ),
    },
  ];

  return (
    <main className="space-y-5 pb-10 text-[var(--vms-ink)]">
      <PageHeader
        eyebrow={
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--vms-coral)]" />
            Site operations
          </span>
        }
        title="Contractors"
        description="External people and firms registered for this Site. Each contractor carries a bounded access window and, when the Site requires it, a permit."
        metadata={
          selectedSite ? (
            <Badge variant="neutral">{selectedSite.name}</Badge>
          ) : (
            <Badge variant="warning">No Site selected</Badge>
          )
        }
        primaryAction={
          canManage ? (
            <Button
              type="button"
              onClick={() => setCreateOpen(true)}
              disabled={!selectedSite}
            >
              <UserRoundPlus className="h-4 w-4" aria-hidden="true" />
              Register contractor
            </Button>
          ) : undefined
        }
      />

      {!selectedSite ? (
        <section className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-6">
          <EmptyState
            icon={Users}
            title="Select a Site"
            description="Contractors are registered against one Site. Choose the Site you are operating to see its contractors."
          />
        </section>
      ) : (
        <>
          <section
            aria-label="Contractor summary"
            className="grid overflow-hidden rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] sm:grid-cols-3"
          >
            <Summary label="Registered" value={String(rows.length)} detail="This Site" />
            <Summary label="Active now" value={String(active)} detail="Inside their window" />
            <Summary
              label="Needs attention"
              value={String(attention)}
              detail={permits ? `${permits} under permit` : "No permits required"}
              attention={attention > 0}
            />
          </section>

          <section className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-3 sm:p-4">
            <div className="mb-3 flex flex-wrap gap-1.5">
              {(
                [
                  "all",
                  "invited",
                  "active",
                  "suspended",
                  "expired",
                  "revoked",
                ] as const
              ).map((value) => {
                const count =
                  value === "all"
                    ? allRows.length
                    : allRows.filter((row) => row.status === value).length;
                const isActive = statusFilter === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setStatusFilter(value)}
                    aria-pressed={isActive}
                    className={
                      isActive
                        ? "rounded-full bg-[var(--vms-action)] px-3 py-1.5 text-xs font-semibold text-[var(--vms-on-action)]"
                        : "rounded-full bg-[var(--vms-surface-subtle)] px-3 py-1.5 text-xs font-semibold text-[var(--vms-ink-muted)] hover:text-[var(--vms-ink)]"
                    }
                  >
                    {value === "all" ? "All" : contractorStatusLabel(value)}
                    <span className="ml-1.5 tabular-nums opacity-70">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
            <DataTable
              data={rows}
              columns={columns}
              searchPlaceholder="Search contractors, companies or purpose"
              isLoading={query.isPending}
              errorMessage={
                query.isError ? parseApiError(query.error).message : null
              }
              isStale={query.isError && rows.length > 0}
              onRetry={() => void query.refetch()}
              emptyMessage="No contractors registered for this Site yet."
              tableLabel="Contractors"
              mobileSummary={(row) => (
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{row.contact_name}</p>
                      <p className="truncate text-xs text-[var(--vms-ink-muted)]">
                        {contractorMeta(row) || row.email}
                      </p>
                    </div>
                    <StatusBadge tone={contractorStatusTone(row.status)}>
                      {contractorStatusLabel(row.status)}
                    </StatusBadge>
                  </div>
                  <p className="text-xs text-[var(--vms-ink-muted)]">
                    {contractorWindow(row)} · {contractorPermitSummary(row)}
                  </p>
                </div>
              )}
            />
          </section>

          {canManage ? (
            <p className="flex items-center gap-2 text-xs text-[var(--vms-ink-muted)]">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Contractors are invited by email and never appear in tenant or
              employee directories.
            </p>
          ) : null}
        </>
      )}

      <CreateContractorDrawer
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        siteId={selectedSite?.id}
      />
      <EditContractorDrawer
        contractor={managed}
        siteId={selectedSite?.id}
        onClose={() => setManaged(null)}
      />
      {confirmationDialog}
    </main>
  );
}

function Summary({
  label,
  value,
  detail,
  attention = false,
}: {
  label: string;
  value: string;
  detail: string;
  attention?: boolean;
}) {
  return (
    <div className="border-b border-[var(--vms-line)] p-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--vms-ink-muted)]">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      <p
        className={
          attention
            ? "mt-0.5 text-xs font-medium text-[var(--vms-warning)]"
            : "mt-0.5 text-xs text-[var(--vms-ink-muted)]"
        }
      >
        {detail}
      </p>
    </div>
  );
}
