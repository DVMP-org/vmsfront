"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { GitBranch, Plus, Settings, Trash2, UserCog } from "lucide-react";
import { GateDependencyEditorModal } from "@/components/admin/gate-modals/GateDependencyEditorModal";
import { GateFormModal } from "@/components/admin/gate-modals/GateFormModal";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { useSiteAccess } from "@/features/context/use-site-access";
import { useAdminGates, useDeleteGate } from "@/hooks/use-admin";
import { parseApiError } from "@/lib/error-utils";
import { formatFiltersForAPI } from "@/lib/table-utils";
import { useAppStore } from "@/store/app-store";
import { adminGateService } from "@/services/admin-gate-service";
import type { Gate } from "@/types";
import { CheckpointAssignmentsModal } from "@/features/checkpoints/CheckpointAssignmentsModal";
import { checkpointsApi } from "@/features/checkpoints/api";

export function ResidentialCheckpoints() {
  const site = useAppStore((state) => state.selectedProperty);
  const { allowed } = useSiteAccess();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Gate | null>(null);
  const [dependency, setDependency] = useState<Gate | null>(null);
  const [assigning, setAssigning] = useState<Gate | null>(null);
  const [deleting, setDeleting] = useState<Gate | null>(null);
  const filters = formatFiltersForAPI(
    site ? [{ field: "site_id", value: site.id, operator: "eq" }] : [],
  );
  const gates = useAdminGates({
    page,
    pageSize: 10,
    search: search.trim() || undefined,
    filters,
  });
  const options = useQuery({
    queryKey: ["admin", "gates", "dependency-options", site?.id],
    queryFn: async () => {
      const items: Gate[] = [];
      let nextPage = 1;
      let total = 0;
      do {
        const response = await adminGateService.getGates({
          page: nextPage,
          pageSize: 100,
          filters,
        });
        const result = response.data;
        items.push(...result.items);
        total = result.total;
        if (!result.items.length) break;
        nextPage += 1;
      } while (items.length < total);
      return items;
    },
    enabled: !!site && canLoadDependencies(allowed),
  });
  const operators = useQuery({
    queryKey: ["checkpoint-operators", site?.id],
    queryFn: () => checkpointsApi.operators(site!.id),
    enabled: !!site,
    retry: false,
  });
  const remove = useDeleteGate();
  const canCreate = allowed(["gates.create", "places.update"]);
  const canUpdate = allowed(["gates.update", "places.update"]);
  const canDelete = allowed(["gates.delete", "places.update"]);
  const columns: Column<Gate>[] = [
    {
      key: "name",
      header: "Gate",
      accessor: (gate) => (
        <div>
          <span className="block font-semibold">{gate.name}</span>
          <span className="text-xs text-[var(--vms-ink-muted)]">
            {gate.slug}
          </span>
        </div>
      ),
    },
    {
      key: "dependency",
      header: "Parent gate",
      accessor: (gate) =>
        gate.dependency?.name ||
        (gate.dependency_id
          ? options.data?.find((item) => item.id === gate.dependency_id)
              ?.name || "Parent gate"
          : "None"),
    },
    {
      key: "direction",
      header: "Movement",
      accessor: (gate) =>
        [gate.allowed_entry && "Check-in", gate.allowed_exit && "Checkout"]
          .filter(Boolean)
          .join(" / ") || "None",
    },
    {
      key: "managers",
      header: "Assigned managers",
      accessor: (gate) =>
        operators.isPending
          ? "Loading…"
          : operators.isError
            ? "Unavailable"
            : operators.data?.assignments
                .filter((item) => item.gate_id === gate.id)
                .map((item) => item.site_admin.user.name)
                .join(", ") || "No managers assigned",
    },
    {
      key: "actions",
      header: "Actions",
      accessor: (gate) => (
        <div className="flex flex-wrap items-center gap-1">
          {allowed("checkpoint_events.record") && (
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/checkpoints/console">Open console</Link>
            </Button>
          )}
          {canUpdate && (
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Assign managers to ${gate.name}`}
              onClick={() => setAssigning(gate)}
            >
              <UserCog className="h-4 w-4" aria-hidden />
              Assign managers
            </Button>
          )}
          {canUpdate && (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Edit ${gate.name}`}
              onClick={() => setEditing(gate)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          )}
          {canUpdate && (
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={!options.data}
              aria-label={`Configure dependencies for ${gate.name}`}
              onClick={() => setDependency(gate)}
            >
              <GitBranch className="h-4 w-4" />
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Delete ${gate.name}`}
              onClick={() => setDeleting(gate)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];
  return (
    <main className="space-y-5 pb-10 text-[var(--vms-ink)]">
      <header className="flex flex-col gap-4 border-b border-[var(--vms-line)] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--vms-ink-muted)]">
            Access operations
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
            Checkpoints
          </h1>
          <p className="mt-2 text-sm text-[var(--vms-ink-muted)]">
            Manage gates and their access dependencies for this property.
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            Create gate
          </Button>
        )}
      </header>
      <DataTable
        tableLabel="Gates"
        data={gates.data?.items ?? []}
        columns={columns}
        searchPlaceholder="Search gates"
        serverSide
        total={gates.data?.total ?? 0}
        currentPage={page}
        pageSize={10}
        onPageChange={setPage}
        onSearchChange={(value) => {
          setPage(1);
          setSearch(value);
        }}
        isLoading={gates.isPending}
        errorMessage={gates.isError ? parseApiError(gates.error).message : null}
        onRetry={() => gates.refetch()}
        emptyMessage="No gates have been created for this property."
      />
      {operators.isError && (
        <p role="alert" className="text-sm text-[var(--vms-danger)]">
          Could not load assigned managers.{" "}
          {parseApiError(operators.error).message}{" "}
          <button className="underline" onClick={() => operators.refetch()}>
            Retry
          </button>
        </p>
      )}
      {options.isError && canUpdate && (
        <p role="alert" className="text-sm text-[var(--vms-danger)]">
          Could not load gates for dependency editing.{" "}
          <button className="underline" onClick={() => options.refetch()}>
            Retry
          </button>
        </p>
      )}
      {assigning && site && (
        <CheckpointAssignmentsModal
          gate={assigning}
          siteId={site.id}
          onClose={() => setAssigning(null)}
        />
      )}
      <GateFormModal
        isOpen={creating}
        onClose={() => setCreating(false)}
        presentation="drawer"
      />
      <GateFormModal
        isOpen={!!editing}
        onClose={() => setEditing(null)}
        gate={editing ?? undefined}
        presentation="drawer"
      />
      <GateDependencyEditorModal
        open={!!dependency}
        gate={dependency}
        gates={options.data ?? []}
        onClose={() => setDependency(null)}
      />
      <Modal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete gate?"
        description={`Delete ${deleting?.name ?? "this gate"}?`}
      >
        <div className="flex justify-end gap-2 p-5">
          <Button variant="outline" onClick={() => setDeleting(null)}>
            Cancel
          </Button>
          <Button
            isLoading={remove.isPending}
            onClick={() => {
              if (deleting)
                remove.mutate(deleting.id, {
                  onSuccess: () => setDeleting(null),
                });
            }}
          >
            Delete gate
          </Button>
        </div>
      </Modal>
    </main>
  );
}

function canLoadDependencies(
  allowed: (requirement: string | string[]) => boolean,
) {
  return allowed(["gates.update", "places.update"]);
}
