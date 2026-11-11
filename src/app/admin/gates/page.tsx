"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  DataTable,
  Column,
  FilterConfig,
  FilterDefinition,
} from "@/components/ui/DataTable";
import {
  GitBranch,
  GitGraph,
  Plus,
  Settings,
  Trash2,
  UserPlus,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Gate } from "@/types";
import { useAdminGates, useDeleteGate } from "@/hooks/use-admin";
import { useUrlQuerySync } from "@/hooks/use-url-query-sync";
import { GateFormModal } from "@/components/admin/gate-modals/GateFormModal";
import { GateConfigureDrawer } from "@/components/admin/gate-modals/GateConfigureDrawer";
import { CheckpointAssignmentsModal } from "@/features/checkpoints/CheckpointAssignmentsModal";
import { GateDependencyEditorModal } from "@/components/admin/gate-modals/GateDependencyEditorModal";
import { GateDependencyModal } from "@/components/admin/gate-modals/GateDependencyModal";
import { formatFiltersForAPI } from "@/lib/table-utils";
import { useAppStore } from "@/store/app-store";
import { checkpointsApi } from "@/features/checkpoints/api";
import { useQuery } from "@tanstack/react-query";

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100];
const PAGE_SIZE = 10;

export default function AdminGatesPage() {
  const selectedProperty = useAppStore((state) => state.selectedProperty);
  const config = useMemo(
    () => ({
      page: { defaultValue: 1 },
      pageSize: { defaultValue: PAGE_SIZE },
      search: { defaultValue: "" },
      sort: { defaultValue: undefined },
      dependency_id: { defaultValue: undefined },
    }),
    [],
  );

  const { initializeFromUrl, syncToUrl } = useUrlQuerySync({
    config,
    skipInitialSync: true,
  });
  const isInitialMount = useRef(true);

  const [page, setPage] = useState(() => initializeFromUrl("page"));
  const [pageSize, setPageSize] = useState(() => initializeFromUrl("pageSize"));
  const [search, setSearch] = useState(() => initializeFromUrl("search") || "");
  const [sort, setSort] = useState<string | null>(() =>
    initializeFromUrl("sort"),
  );
  const [dependency_id, setDependencyId] = useState(() =>
    initializeFromUrl("dependency_id"),
  );

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedGate, setSelectedGate] = useState<Gate | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConfigureOpen, setIsConfigureOpen] = useState(false);
  const [isDependencyEditorOpen, setIsDependencyEditorOpen] = useState(false);
  const [isDependencyModalOpen, setIsDependencyModalOpen] = useState(false);
  const [assigningGate, setAssigningGate] = useState<Gate | null>(null)
  const [gatePendingDelete, setGatePendingDelete] = useState<Gate | null>(null);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    syncToUrl({
      page,
      pageSize,
      search,
      sort,
      dependency_id,
    });
  }, [page, pageSize, search, sort, dependency_id, syncToUrl]);

  const activeFilters = useMemo(() => {
    const filters: FilterConfig[] = [];

    if (dependency_id) {
      filters.push({
        field: "dependency_id",
        value: dependency_id,
        operator: "eq",
      });
    }
    if (selectedProperty?.id) {
      filters.push({
        field: "site_id",
        value: selectedProperty.id,
        operator: "eq",
      });
    }

    return filters;
  }, [dependency_id, selectedProperty?.id]);

  const { data: filterOptionsData } = useAdminGates({
    page: 1,
    pageSize: 100,
  });

  const { data, isLoading, isFetching } = useAdminGates({
    page,
    pageSize,
    search: search.trim() || undefined,
    sort: sort || undefined,
    filters: formatFiltersForAPI(activeFilters),
  });
  const operators = useQuery({
    queryKey: ["checkpoint-operators", selectedProperty?.id],
    queryFn: () => checkpointsApi.operators(selectedProperty?.id),
    retry: false,
  });
  const operatorsByGate = useMemo(() => {
    const assignments = operators.data?.assignments ?? [];
    const grouped = new Map<string, typeof assignments>();
    for (const assignment of assignments) {
      const current = grouped.get(assignment.gate_id) ?? [];
      current.push(assignment);
      grouped.set(assignment.gate_id, current);
    }
    return grouped;
  }, [operators.data?.assignments]);

  const deleteGateMutation = useDeleteGate();

  const gates = useMemo(() => data?.items ?? [], [data?.items]);
  const total = data?.total ?? 0;

  const availableFilters = useMemo(() => {
    const filters: FilterDefinition[] = [];
    const gatesForFilters = filterOptionsData?.items || [];

    if (gatesForFilters.length > 0) {
      filters.push({
        field: "dependency_id",
        label: "Dependency",
        type: "select",
        isSearchable: true,
        options: gatesForFilters.map((gate) => ({
          value: gate.id,
          label: gate.name,
        })),
      });
    }
    return filters;
  }, [filterOptionsData]);
  const handleEdit = (gate: Gate) => {
    setSelectedGate(gate);
    setIsConfigureOpen(false);
    setIsEditModalOpen(true);
  };

  const handleConfigure = (gate: Gate) => {
    setSelectedGate(gate);
    setIsConfigureOpen(true);
  };

  const handleDependency = (gate: Gate) => {
    setSelectedGate(gate);
    setIsConfigureOpen(false);
    setIsDependencyEditorOpen(true);
  };

  const handleDelete = async (gate: Gate) => {
    try {
      await deleteGateMutation.mutateAsync(gate.id);
      setGatePendingDelete(null);
    } catch {
      // Error toast is handled in the hook.
    }
  };

  const columns: Column<Gate>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      accessor: (row) => (
        <div className="min-w-0">
          <span className="block truncate text-sm font-semibold text-[var(--vms-ink)]">
            {row.name}
          </span>
          <span className="mt-0.5 block truncate text-xs text-[var(--vms-ink-muted)]">
            {row.slug}
          </span>
        </div>
      ),
    },
    {
      key: "is_default",
      header: "Default",
      sortable: true,
      accessor: (row) => (
        <Badge variant={row.is_default ? "success" : "secondary"}>
          {row.is_default ? "Yes" : "No"}
        </Badge>
      ),
    },
    {
      key: "operator",
      header: "Checkpoint operator",
      sortable: false,
      accessor: (row) => {
        const assigned = operatorsByGate.get(row.id) ?? [];
        if (!assigned.length) {
          return (
            <span className="text-xs italic text-[var(--vms-warning)]">
              Unassigned
            </span>
          );
        }
        return (
          <div>
            <span className="block text-sm font-semibold text-[var(--vms-ink)]">
              {assigned.map((item) => item.site_admin.user.name).join(", ")}
            </span>
            <span className="text-xs text-[var(--vms-ink-muted)]">
              {assigned.length} manager{assigned.length === 1 ? "" : "s"}
            </span>
          </div>
        );
      },
    },
    {
      key: "dependency",
      header: "Dependency",
      sortable: false,
      accessor: (row) =>
        row.dependency?.name ||
        row.dependency_id || (
          <span className="italic text-[var(--vms-ink-muted)]">—</span>
        ),
    },
    {
      key: "created_at",
      header: "Created",
      sortable: true,
      accessor: (row) => (
        <span className="text-sm text-[var(--vms-ink-muted)]">
          {formatDistanceToNow(new Date(row.created_at), { addSuffix: true })}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => handleConfigure(row)}
            aria-label={`Configure ${row.name}`}
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setAssigningGate(row)}
            aria-label={`Assign checkpoint operators to ${row.name}`}
          >
            <UserPlus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => handleDependency(row)}
            aria-label={`Configure dependencies for ${row.name}`}
          >
            <GitBranch className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setGatePendingDelete(row)}
            className="text-[var(--vms-danger)] hover:bg-[var(--vms-danger-subtle)] hover:text-[var(--vms-danger)]"
            aria-label={`Delete ${row.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
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
            Gates
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--vms-ink-muted)]">
            Configure logical checkpoints, dependencies and the administrators
            who operate them.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsDependencyModalOpen(true)}
          >
            <GitGraph className="h-4 w-4" aria-hidden="true" />
            Dependency map
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Create gate
          </Button>
        </div>
      </header>

      <section className="overflow-hidden rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)]">
        <div className="border-b border-[var(--vms-line)] px-4 py-3">
          <h2 className="text-base font-semibold">Gate register</h2>
          <p className="mt-0.5 text-xs text-[var(--vms-ink-muted)]">
            {total} gate{total !== 1 ? "s" : ""} configured
          </p>
        </div>
        <DataTable
          data={gates}
          columns={columns}
          searchable={true}
          searchPlaceholder="Search gates..."
          pageSize={pageSize}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          onPageSizeChange={(newPageSize) => {
            setPage(1);
            setPageSize(newPageSize);
          }}
          showPagination={true}
          serverSide={true}
          total={total}
          currentPage={page}
          onPageChange={setPage}
          initialSearch={search}
          availableFilters={availableFilters}
          initialFilters={activeFilters}
          onFiltersChange={(filters) => {
            setPage(1);
            const dependencyFilter = filters.find(
              (filter) =>
                filter.field === "dependency_id" && filter.operator === "eq",
            );
            setDependencyId(dependencyFilter?.value);
          }}
          onSearchChange={(value) => {
            setPage(1);
            setSearch(value);
          }}
          onSortChange={(newSort) => {
            setPage(1);
            setSort(newSort);
          }}
          isLoading={isLoading || isFetching}
        />
      </section>

      <GateFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <GateFormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedGate(null);
        }}
        gate={selectedGate || undefined}
      />

      <GateConfigureDrawer
        open={isConfigureOpen}
        gate={selectedGate}
        onClose={() => {
          setIsConfigureOpen(false);
          setSelectedGate(null);
        }}
        onEdit={handleEdit}
        onEditDependency={handleDependency}
      />

      {assigningGate ? (
        <CheckpointAssignmentsModal
          gate={assigningGate}
          siteId={assigningGate.site_id}
          onClose={() => setAssigningGate(null)}
        />
      ) : null}

      <GateDependencyEditorModal
        open={isDependencyEditorOpen}
        gates={filterOptionsData?.items ?? gates}
        gate={selectedGate}
        onClose={() => {
          setIsDependencyEditorOpen(false);
          setSelectedGate(null);
        }}
      />

      <GateDependencyModal
        isOpen={isDependencyModalOpen}
        onClose={() => setIsDependencyModalOpen(false)}
      />

      <Modal
        isOpen={!!gatePendingDelete}
        onClose={() => {
          if (!deleteGateMutation.isPending) setGatePendingDelete(null);
        }}
        title="Delete gate?"
        description="This removes the logical checkpoint. Existing passage history remains auditable."
      >
        <div className="space-y-5 p-5">
          <p className="text-sm text-[var(--vms-ink-muted)]">
            Delete{" "}
            <strong className="text-[var(--vms-ink)]">
              {gatePendingDelete?.name}
            </strong>
            ? Check the dependency map before continuing.
          </p>
          <div className="flex flex-col-reverse gap-2 border-t border-[var(--vms-line)] pt-4 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              disabled={deleteGateMutation.isPending}
              onClick={() => setGatePendingDelete(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              isLoading={deleteGateMutation.isPending}
              onClick={() =>
                gatePendingDelete && handleDelete(gatePendingDelete)
              }
            >
              Delete gate
            </Button>
          </div>
        </div>
      </Modal>
    </main>
  );
}
