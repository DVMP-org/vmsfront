"use client";

import { useRef, useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useAdminResidencies,
  useCreateResidency,
  useUpdateResidency,
  useDeleteResidency,
  useBulkDeleteResidencies,
  useBulkToggleResidencyActive,
  useImportResidencies,
  useAdminResidencyGroups,
  usePrefetchResidency,
  useAdminResidencyType,
  useAdminResidencyTypes
} from "@/hooks/use-admin";
import { useUrlQuerySync } from "@/hooks/use-url-query-sync";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { DataTable, Column, BulkAction, FilterConfig, FilterDefinition } from "@/components/ui/DataTable";
import { Plus, Building2, Trash2, Edit, CheckCircle, Eye, Upload } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { formatFiltersForAPI } from "@/lib/table-utils";
import { toast } from "sonner";
import { ImportResponse, Residency } from "@/types";
import { ResidencyForm, ResidencyFormData } from "@/app/admin/residencies/components/ResidencyForm";
import { set } from "date-fns";

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100];
const PAGE_SIZE = 10;

export default function ResidenciesPage() {
  const router = useRouter();
  const isInitialMount = useRef(true);
  // URL query sync
  const config = useMemo(() => ({
    page: { defaultValue: 1 },
    pageSize: { defaultValue: PAGE_SIZE },
    search: { defaultValue: "" },
    is_active: { defaultValue: undefined },
    residency_group_id: { defaultValue: undefined },
    type_id: { defaultValue: undefined },
    sort: { defaultValue: null },
  }), []);

  const { initializeFromUrl, syncToUrl } = useUrlQuerySync({
    config,
    skipInitialSync: true,
  });

  // Initialize state from URL
  const [page, setPage] = useState(() => initializeFromUrl("page"));
  const [pageSize, setPageSize] = useState(() => initializeFromUrl("pageSize"));
  const [search, setSearch] = useState(() => initializeFromUrl("search"));
  const [status, setStatus] = useState<string | undefined>(() => initializeFromUrl("is_active"));
  const [residencyGroupId, setResidencyGroupId] = useState<string | undefined>(() => initializeFromUrl("residency_group_id"));
  const [residencyTypeId, setResidencyTypeId] = useState<string | undefined>(() => initializeFromUrl("type_id"));
  const [sort, setSort] = useState<string | null>(() => initializeFromUrl("sort"));
  const [startDate, setStartDate] = useState<string | undefined>(() => initializeFromUrl("startDate"));
  const [endDate, setEndDate] = useState<string | undefined>(() => initializeFromUrl("endDate"));



  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedResidency, setSelectedResidency] = useState<Residency | null>(null);
  const [residencyToDelete, setResidencyToDelete] = useState<Residency | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importSummary, setImportSummary] = useState<ImportResponse | null>(null);
  const [selectedResidencies, setSelectedResidencies] = useState<Set<string>>(new Set());
  const importFormRef = useRef<HTMLFormElement>(null);

  // Mutations
  const createResidencyMutation = useCreateResidency();
  const updateResidencyMutation = useUpdateResidency();
  const deleteResidencyMutation = useDeleteResidency();
  const bulkDeleteMutation = useBulkDeleteResidencies();
  const bulkToggleActiveMutation = useBulkToggleResidencyActive();
  const importResidenciesMutation = useImportResidencies();
  const prefetchResidency = usePrefetchResidency();

  // Sync state to URL
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    syncToUrl({ page, pageSize, search, status, residencyGroupId, residencyTypeId, sort, startDate, endDate });
  }, [page, pageSize, search, status, residencyGroupId, residencyTypeId, sort, startDate, endDate, syncToUrl]);

  // Fetch residency groups for filter
  const { data: residencyGroupsData } = useAdminResidencyGroups({
    page: 1,
    pageSize: 100,
    sort: "created_at:desc",
  });
  const residencyGroups = useMemo(() => residencyGroupsData?.items ?? [], [residencyGroupsData]);

  // Fetch Residency Types

  const residencyTypesData = useAdminResidencyTypes({
    page: 1,
    pageSize: 100,
    sort: "created_at:desc",
  });

  const residencyTypes = useMemo(() => residencyTypesData?.data?.items ?? [], [residencyTypesData]);

  const availableFilters = useMemo(() => {
    const filters: FilterDefinition[] = [
      {
        field: "is_active",
        label: "Status",
        operator: "eq",
        type: "select",
        options: [
          { label: "Active", value: "True" },
          { label: "Inactive", value: "False" },
        ]
      }
    ];

    if (residencyGroups.length > 0) {
      filters.push({
        field: "residency_group_id",
        label: "Residency Group",
        type: "select",
        isSearchable: true,
        options: [
          ...residencyGroups.map((residency) => ({
            value: residency.id,
            label: residency.name,
          })),
        ],
        operator: "eq",
      });
    }

    if (residencyTypes.length > 0) {
      filters.push({
        field: "type_id",
        label: "Residency Type",
        type: "select",
        isSearchable: true,
        options: [
          ...residencyTypes.map((type) => ({
            value: type.id,
            label: type.name,
          })),
        ],
        operator: "eq",
      });
    }

    filters.push({
      field: "created_at",
      label: "Date",
      type: "date-range"
    })
    return filters;
  }, [residencyGroups, residencyTypes]);

  const activeFilters = useMemo(() => {
    const filters: FilterConfig[] = [];

    if (status) {
      filters.push({ field: "is_active", operator: "eq", value: status });
    }
    if (residencyGroupId) {
      filters.push({ field: "residency_group_id", operator: "eq", value: residencyGroupId });
    }
    if (residencyTypeId) {
      filters.push({ field: "type_id", operator: "eq", value: residencyTypeId });
    }
    if (startDate) {
      filters.push({ field: "created_at", operator: "gte", value: startDate });
    }
    if (endDate) {
      filters.push({ field: "created_at", operator: "lte", value: endDate });
    }
    return filters;
  }, [status, residencyGroupId, residencyTypeId, startDate, endDate]);

  const { data, isLoading, isFetching } = useAdminResidencies({
    page,
    pageSize,
    search: search.trim() || undefined,
    filters: formatFiltersForAPI(activeFilters),
    sort: sort || undefined,
  });



  const residencies = useMemo(() => data?.items ?? [], [data]);
  const total = data?.total ?? 0;


  const handleCloseImportModal = () => {
    setIsImportModalOpen(false);
    setImportFile(null);
    importFormRef.current?.reset();
  };

  const handleCreateSubmit = (data: ResidencyFormData) => {
    createResidencyMutation.mutate(
      data as any,
      {
        onSuccess: () => {
          setIsCreateModalOpen(false);
        },
      }
    );
  };

  const handleEditSubmit = (data: ResidencyFormData) => {
    if (!selectedResidency) return;

    updateResidencyMutation.mutate(
      {
        residencyId: selectedResidency.id,
        data: data as any,
      },
      {
        onSuccess: () => {
          setIsEditModalOpen(false);
          setSelectedResidency(null);
        },
      }
    );
  };

  const handleEdit = (residency: Residency) => {
    setSelectedResidency(residency);
    setIsEditModalOpen(true);
  };

  const handleDelete = (residency: Residency) => {
    setResidencyToDelete(residency);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (residencyToDelete) {
      deleteResidencyMutation.mutate(residencyToDelete.id, {
        onSuccess: () => {
          setIsDeleteModalOpen(false);
          setResidencyToDelete(null);
        },
      });
    }
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) {
      toast.error("Please select a file to import");
      return;
    }

    const formData = new FormData();
    formData.append("file", importFile);

    importResidenciesMutation.mutate(formData, {
      onSuccess: (response) => {
        setImportSummary(response.data);
        toast.success("Residencies imported successfully!");
      },
    });
  };

  // Bulk actions
  const handleBulkDelete = (selectedIds: string[]) => {
    bulkDeleteMutation.mutate(selectedIds, {
      onSuccess: () => {
        setSelectedResidencies(new Set());
      },
    });
  };

  const handleBulkToggleActive = (selectedIds: string[]) => {
    bulkToggleActiveMutation.mutate(selectedIds, {
      onSuccess: () => {
        setSelectedResidencies(new Set());
      },
    });
  };

  const bulkActions: BulkAction[] = [
    {
      label: "Toggle Active",
      icon: CheckCircle,
      onClick: handleBulkToggleActive,
      variant: "outline",
    },
    {
      label: "Delete",
      icon: Trash2,
      onClick: handleBulkDelete,
      variant: "destructive",
      requiresConfirmation: true,
    },
  ];

  const columns: Column<Residency>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      accessor: (row) => (
        <button
          onClick={() => router.push(`/admin/residencies/${row.id}`)}
          onMouseEnter={() => prefetchResidency(row.id)}
          className="font-medium text-primary hover:underline text-left"
        >
          {row.name}
        </button>
      ),
    },
    {
      key: "address",
      header: "Address",
      sortable: true,
      accessor: (row) => row.address || "-",
    },
    {
      key: "description",
      header: "Description",
      sortable: false,
      accessor: (row) => row.description || "-",
    },
    {
      key: "residency_groups",
      header: "Groups",
      sortable: false,
      accessor: (row) => {
        const count = row.residency_groups?.length || 0;
        return (
          <span className="text-sm">
            {count} group{count !== 1 ? "s" : ""}
          </span>
        )
      },
    },
    {
      key: "type",
      header: "Type",
      sortable: true,
      accessor: (row) => (
        <span className={`text-sm ${(row as any).type?.is_active ? "text-green-600" : "text-muted-foreground"}`}>
          {(row as any).type?.name}
        </span>
      ),
    },
    {
      key: "is_active",
      header: "Status",
      sortable: true,
      accessor: (row) => (
        <span className={`text-sm ${(row as any).is_active ? "text-green-600" : "text-muted-foreground"}`}>
          {(row as any).is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Created",
      sortable: true,
      accessor: (row) => formatDate(row.created_at),
    },
    {
      key: "actions",
      header: "Actions",
      sortable: false,
      accessor: (row) => (
        <div className="flex gap-2 justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/admin/residencies/${row.id}`)}
            onMouseEnter={() => prefetchResidency(row.id)}
            className="text-muted-foreground hover:text-primary"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(row)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(row)}
            disabled={deleteResidencyMutation.isPending}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Residencies</h1>
            <p className="text-muted-foreground">
              Manage residencies in the system
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsImportModalOpen(true)}
            >
              <Upload className="mr-2 h-4 w-4" />
              Import Residencies
            </Button>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Residency
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">

            <DataTable
              data={residencies}
              columns={columns}
              searchable={true}
              searchPlaceholder="Search residencies..."
              pageSize={pageSize}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              onPageSizeChange={setPageSize}
              showPagination={true}
              emptyMessage="No residencies found"
              serverSide={true}
              total={total}
              currentPage={page}
              onPageChange={setPage}
              initialSearch={search}
              onSearchChange={(value) => {
                setPage(1);
                setSearch(value);
              }}
              availableFilters={availableFilters}
              initialFilters={activeFilters}
              onFiltersChange={(filters) => {
                setPage(1);
                // Extract filter values from filters and explicitly clear if not found
                const statusFilter = filters.find(f => f.field === "is_active");
                const residencyGroupFilter = filters.find(f => f.field === "residency_group_id");
                const residenciesTypeFilter = filters.find(f => f.field === "type_id");
                const startDate = filters.find((f) => f.field === "created_at" && f.operator === "gte");
                const endDate = filters.find((f) => f.field === "created_at" && f.operator === "lte");

                // Always set state (undefined if filter not found) to ensure URL clearing
                setStatus(statusFilter?.value as string | undefined || undefined);
                setResidencyGroupId(residencyGroupFilter?.value as string | undefined || undefined);
                setResidencyTypeId(residenciesTypeFilter?.value as string | undefined || undefined);
                setStartDate(startDate?.value as string | undefined || undefined);
                setEndDate(endDate?.value as string | undefined || undefined);
              }}
              onSortChange={(newSort) => {
                setPage(1);
                setSort(newSort);
              }}
              getRowId={(row) => row.id}
              disableClientSideFiltering={true}
              disableClientSideSorting={true}
              selectable={true}
              selectedRows={selectedResidencies}
              onSelectionChange={setSelectedResidencies}
              bulkActions={bulkActions}
              isLoading={isLoading || isFetching}
            />

          </CardContent>
        </Card>
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
        }}
        title="Add New Residency"
      >
        <ResidencyForm
          onSubmit={handleCreateSubmit}
          onCancel={() => setIsCreateModalOpen(false)}
          isLoading={createResidencyMutation.isPending}
          residencyGroups={residencyGroups}
          residencyTypes={residencyTypes}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedResidency(null);
        }}
        title="Edit Residency"
      >
        {selectedResidency && (
          <ResidencyForm
            initialData={{
              name: selectedResidency.name,
              address: selectedResidency.address || "",
              description: selectedResidency.description || "",
              residency_group_ids: selectedResidency.residency_groups?.map(g => g.id) || [],
              type_id: selectedResidency.type?.id || "",
            }}
            onSubmit={handleEditSubmit}
            onCancel={() => {
              setIsEditModalOpen(false);
              setSelectedResidency(null);
            }}
            isLoading={updateResidencyMutation.isPending}
            residencyGroups={residencyGroups}
            residencyTypes={residencyTypes}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setResidencyToDelete(null);
        }}
        title="Delete Residency"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <strong>{residencyToDelete?.name}</strong>?
            This action cannot be undone.
          </p>
          <div className="flex gap-4 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setResidencyToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              isLoading={deleteResidencyMutation.isPending}
            >
              Delete Residency
            </Button>
          </div>
        </div>
      </Modal>

      {/* Import Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={handleCloseImportModal}
        title="Import Residencies"
      >
        <form ref={importFormRef} onSubmit={handleImportSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Upload CSV File
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              className="w-full"
            />
          </div>

          {importSummary && (
            <div className="p-4 bg-muted rounded-md">
              <p className="text-sm">
                <strong>Import Summary:</strong>
              </p>
              <p className="text-sm">Total: {importSummary.total}</p>
              <p className="text-sm text-green-600">
                Success: {importSummary.successful}
              </p>
              {importSummary.failed > 0 && (
                <p className="text-sm text-destructive">
                  Failed: {importSummary.failed}
                </p>
              )}
            </div>
          )}

          <div className="flex gap-4 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseImportModal}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={importResidenciesMutation.isPending}
              disabled={!importFile}
            >
              Import
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}