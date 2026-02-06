"use client";

import { useRef, useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useAdminHouses,
  useCreateHouse,
  useUpdateHouse,
  useDeleteHouse,
  useBulkDeleteHouses,
  useBulkToggleHouseActive,
  useImportHouses,
  useAdminHouseGroups,
  usePrefetchHouse,
} from "@/hooks/use-admin";
import { useUrlQuerySync } from "@/hooks/use-url-query-sync";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import {
  DataTable,
  Column,
  BulkAction,
  FilterConfig,
  FilterDefinition,
} from "@/components/ui/DataTable";
import {
  Plus,
  Building2,
  Trash2,
  Edit,
  CheckCircle,
  Eye,
  Upload,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { formatFiltersForAPI } from "@/lib/table-utils";
import { toast } from "sonner";
import { ImportResponse, House } from "@/types";
import { HouseForm, HouseFormData } from "./components/HouseForm";

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100];
const PAGE_SIZE = 10;

export default function HousesPage() {
  const router = useRouter();
  const isInitialMount = useRef(true);
  // URL query sync
  const config = useMemo(
    () => ({
      page: { defaultValue: 1 },
      pageSize: { defaultValue: PAGE_SIZE },
      search: { defaultValue: "" },
      is_active: { defaultValue: undefined },
      house_group_id: { defaultValue: undefined },
      sort: { defaultValue: null },
    }),
    [],
  );

  const { initializeFromUrl, syncToUrl } = useUrlQuerySync({
    config,
    skipInitialSync: true,
  });

  // Initialize state from URL
  const [page, setPage] = useState(() => initializeFromUrl("page"));
  const [pageSize, setPageSize] = useState(() => initializeFromUrl("pageSize"));
  const [search, setSearch] = useState(() => initializeFromUrl("search"));
  const [status, setStatus] = useState<string | undefined>(() =>
    initializeFromUrl("is_active"),
  );
  const [houseGroupId, setHouseGroupId] = useState<string | undefined>(() =>
    initializeFromUrl("house_group_id"),
  );
  const [sort, setSort] = useState<string | null>(() =>
    initializeFromUrl("sort"),
  );
  const [startDate, setStartDate] = useState<string | undefined>(() =>
    initializeFromUrl("startDate"),
  );
  const [endDate, setEndDate] = useState<string | undefined>(() =>
    initializeFromUrl("endDate"),
  );

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedHouse, setSelectedHouse] = useState<House | null>(null);
  const [houseToDelete, setHouseToDelete] = useState<House | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importSummary, setImportSummary] = useState<ImportResponse | null>(
    null,
  );
  const [selectedHouses, setSelectedHouses] = useState<Set<string>>(new Set());
  const importFormRef = useRef<HTMLFormElement>(null);

  // Mutations
  const createHouseMutation = useCreateHouse();
  const updateHouseMutation = useUpdateHouse();
  const deleteHouseMutation = useDeleteHouse();
  const bulkDeleteMutation = useBulkDeleteHouses();
  const bulkToggleActiveMutation = useBulkToggleHouseActive();
  const importHousesMutation = useImportHouses();
  const prefetchHouse = usePrefetchHouse();

  // Sync state to URL
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    syncToUrl({
      page,
      pageSize,
      search,
      status,
      houseGroupId,
      sort,
      startDate,
      endDate,
    });
  }, [
    page,
    pageSize,
    search,
    status,
    houseGroupId,
    sort,
    startDate,
    endDate,
    syncToUrl,
  ]);

  // Fetch house groups for filter
  const { data: houseGroupsData } = useAdminHouseGroups({
    page: 1,
    pageSize: 100,
  });
  const houseGroups = useMemo(
    () => houseGroupsData?.items ?? [],
    [houseGroupsData],
  );

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
        ],
      },
    ];

    if (houseGroups.length > 0) {
      filters.push({
        field: "house_group_id",
        label: "House Group",
        type: "select",
        isSearchable: true,
        options: [
          ...houseGroups.map((house) => ({
            value: house.id,
            label: house.name,
          })),
        ],
        operator: "eq",
      });
    }

    filters.push({
      field: "created_at",
      label: "Date",
      type: "date-range",
    });
    return filters;
  }, [houseGroups]);

  const activeFilters = useMemo(() => {
    const filters: FilterConfig[] = [];

    if (status) {
      filters.push({ field: "is_active", operator: "eq", value: status });
    }
    if (houseGroupId) {
      filters.push({
        field: "house_group_id",
        operator: "eq",
        value: houseGroupId,
      });
    }
    if (startDate) {
      filters.push({ field: "created_at", operator: "gte", value: startDate });
    }
    if (endDate) {
      filters.push({ field: "created_at", operator: "lte", value: endDate });
    }
    return filters;
  }, [status, houseGroupId, startDate, endDate]);

  const { data, isLoading, isFetching } = useAdminHouses({
    page,
    pageSize,
    search: search.trim() || undefined,
    filters: formatFiltersForAPI(activeFilters),
    sort: sort || undefined,
  });

  const houses = useMemo(() => data?.items ?? [], [data]);
  const total = data?.total ?? 0;

  const handleCloseImportModal = () => {
    setIsImportModalOpen(false);
    setImportFile(null);
    importFormRef.current?.reset();
  };

  const handleCreateSubmit = (data: HouseFormData) => {
    createHouseMutation.mutate(data as any, {
      onSuccess: () => {
        setIsCreateModalOpen(false);
      },
    });
  };

  const handleEditSubmit = (data: HouseFormData) => {
    if (!selectedHouse) return;

    updateHouseMutation.mutate(
      {
        houseId: selectedHouse.id,
        data: data as any,
      },
      {
        onSuccess: () => {
          setIsEditModalOpen(false);
          setSelectedHouse(null);
        },
      },
    );
  };

  const handleEdit = (house: House) => {
    setSelectedHouse(house);
    setIsEditModalOpen(true);
  };

  const handleDelete = (house: House) => {
    setHouseToDelete(house);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (houseToDelete) {
      deleteHouseMutation.mutate(houseToDelete.id, {
        onSuccess: () => {
          setIsDeleteModalOpen(false);
          setHouseToDelete(null);
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

    importHousesMutation.mutate(formData, {
      onSuccess: (response) => {
        setImportSummary(response.data);
        toast.success("Houses imported successfully!");
      },
    });
  };

  // Bulk actions
  const handleBulkDelete = (selectedIds: string[]) => {
    bulkDeleteMutation.mutate(selectedIds, {
      onSuccess: () => {
        setSelectedHouses(new Set());
      },
    });
  };

  const handleBulkToggleActive = (selectedIds: string[]) => {
    bulkToggleActiveMutation.mutate(selectedIds, {
      onSuccess: () => {
        setSelectedHouses(new Set());
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

  const columns: Column<House>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      accessor: (row) => (
        <button
          onClick={() => router.push(`/admin/houses/${row.id}`)}
          onMouseEnter={() => prefetchHouse(row.id)}
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
      key: "house_groups",
      header: "Groups",
      sortable: false,
      accessor: (row) => {
        const count = row.house_groups?.length || 0;
        return (
          <span className="text-sm">
            {count} groups{count !== 1 ? "s" : ""}
          </span>
        );
      },
    },
    {
      key: "is_active",
      header: "Status",
      sortable: true,
      accessor: (row) => (
        <span
          className={`text-sm ${(row as any).is_active ? "text-green-600" : "text-muted-foreground"}`}
        >
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
            onClick={() => router.push(`/admin/houses/${row.id}`)}
            onMouseEnter={() => prefetchHouse(row.id)}
            className="text-muted-foreground hover:text-primary"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleEdit(row)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(row)}
            disabled={deleteHouseMutation.isPending}
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
            <h1 className="text-2xl font-bold">Houses</h1>
            <p className="text-muted-foreground">Manage houses in the system</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsImportModalOpen(true)}
            >
              <Upload className="mr-2 h-4 w-4" />
              Import Houses
            </Button>
            <Button
              id="add_house_button"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add House
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <DataTable
              data={houses}
              columns={columns}
              searchable={true}
              searchPlaceholder="Search houses..."
              pageSize={pageSize}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              onPageSizeChange={setPageSize}
              showPagination={true}
              emptyMessage="No houses found"
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
                const statusFilter = filters.find(
                  (f) => f.field === "is_active",
                );
                const houseGroupFilter = filters.find(
                  (f) => f.field === "house_group_id",
                );
                const startDate = filters.find(
                  (f) => f.field === "created_at" && f.operator === "gte",
                );
                const endDate = filters.find(
                  (f) => f.field === "created_at" && f.operator === "lte",
                );

                // Always set state (undefined if filter not found) to ensure URL clearing
                setStatus(
                  (statusFilter?.value as string | undefined) || undefined,
                );
                setHouseGroupId(
                  (houseGroupFilter?.value as string | undefined) || undefined,
                );
                setStartDate(
                  (startDate?.value as string | undefined) || undefined,
                );
                setEndDate((endDate?.value as string | undefined) || undefined);
              }}
              onSortChange={(newSort) => {
                setPage(1);
                setSort(newSort);
              }}
              getRowId={(row) => row.id}
              disableClientSideFiltering={true}
              disableClientSideSorting={true}
              selectable={true}
              selectedRows={selectedHouses}
              onSelectionChange={setSelectedHouses}
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
        title="Add New House"
      >
        <HouseForm
          onSubmit={handleCreateSubmit}
          onCancel={() => setIsCreateModalOpen(false)}
          isLoading={createHouseMutation.isPending}
          houseGroups={houseGroups}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedHouse(null);
        }}
        title="Edit House"
      >
        {selectedHouse && (
          <HouseForm
            initialData={{
              name: selectedHouse.name,
              address: selectedHouse.address || "",
              description: selectedHouse.description || "",
              house_group_ids: Array.isArray(
                (selectedHouse as any).house_group_ids,
              )
                ? (selectedHouse as any).house_group_ids
                : [],
            }}
            onSubmit={handleEditSubmit}
            onCancel={() => {
              setIsEditModalOpen(false);
              setSelectedHouse(null);
            }}
            isLoading={updateHouseMutation.isPending}
            houseGroups={houseGroups}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setHouseToDelete(null);
        }}
        title="Delete House"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <strong>{houseToDelete?.name}</strong>? This action cannot be
            undone.
          </p>
          <div className="flex gap-4 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setHouseToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              isLoading={deleteHouseMutation.isPending}
            >
              Delete House
            </Button>
          </div>
        </div>
      </Modal>

      {/* Import Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={handleCloseImportModal}
        title="Import Houses"
      >
        <form
          ref={importFormRef}
          onSubmit={handleImportSubmit}
          className="space-y-4"
        >
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
              isLoading={importHousesMutation.isPending}
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
