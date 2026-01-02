"use client";

import { useRef, useState, useMemo, useEffect } from "react";
import {
  useAdminHouses,
  useCreateHouse,
  useUpdateHouse,
  useDeleteHouse,
  useBulkDeleteHouses,
  useBulkToggleHouseActive,
  useImportHouses,
  useAdminHouseGroups
} from "@/hooks/use-admin";
import { useUrlQuerySync } from "@/hooks/use-url-query-sync";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { DataTable, Column, FilterableField, BulkAction } from "@/components/ui/DataTable";
import { Plus, Building2, Trash2, Edit, CheckCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { formatFiltersForAPI } from "@/lib/table-utils";
import { toast } from "sonner";
import { ImportResponse, House } from "@/types";

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100];
const PAGE_SIZE = 10;

export default function HousesPage() {
  // URL query sync
  const { initializeFromUrl, syncToUrl } = useUrlQuerySync({
    config: {
      page: { defaultValue: 1 },
      pageSize: { defaultValue: PAGE_SIZE },
      search: { defaultValue: "" },
      status: { defaultValue: undefined },
      houseGroupId: { defaultValue: undefined },
      sort: { defaultValue: null },
    },
    skipInitialSync: true,
  });

  // Initialize state from URL
  const [page, setPage] = useState(() => initializeFromUrl("page"));
  const [pageSize, setPageSize] = useState(() => initializeFromUrl("pageSize"));
  const [search, setSearch] = useState(() => initializeFromUrl("search"));
  const [status, setStatus] = useState<string | undefined>(() => initializeFromUrl("status"));
  const [houseGroupId, setHouseGroupId] = useState<string | undefined>(() => initializeFromUrl("houseGroupId"));
  const [sort, setSort] = useState<string | null>(() => initializeFromUrl("sort"));

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedHouse, setSelectedHouse] = useState<House | null>(null);
  const [houseToDelete, setHouseToDelete] = useState<House | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importSummary, setImportSummary] = useState<ImportResponse | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    house_group_ids: [] as string[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedHouses, setSelectedHouses] = useState<Set<string>>(new Set());
  const importFormRef = useRef<HTMLFormElement>(null);

  // Mutations
  const createHouseMutation = useCreateHouse();
  const updateHouseMutation = useUpdateHouse();
  const deleteHouseMutation = useDeleteHouse();
  const bulkDeleteMutation = useBulkDeleteHouses();
  const bulkToggleActiveMutation = useBulkToggleHouseActive();
  const importHousesMutation = useImportHouses();

  // Sync state to URL
  useEffect(() => {
    syncToUrl({ page, pageSize, search, status, houseGroupId, sort });
  }, [page, pageSize, search, status, houseGroupId, sort, syncToUrl]);

  // Build filterable fields from payload
  const filterableFields = useMemo(() => {
    const fields: Array<{ field: string; operator?: "eq"; value?: string | boolean }> = [];
    if (status) {
      fields.push({
        field: "is_active",
        operator: "eq",
        value: status === "true"
      });
    }
    if (houseGroupId) {
      fields.push({
        field: "house_group_id",
        operator: "eq",
        value: houseGroupId
      });
    }
    return fields;
  }, [status, houseGroupId]);

  const { data, isLoading, isFetching } = useAdminHouses({
    page,
    pageSize,
    search: search.trim() || undefined,
    filters: formatFiltersForAPI(
      filterableFields.map((f) => ({
        field: f.field,
        operator: f.operator || "eq",
        value: f.value!,
      }))
    ),
    sort: sort || undefined,
  });

  // Fetch house groups for filter
  const { data: houseGroupsData } = useAdminHouseGroups({
    page: 1,
    pageSize: 100,
  });

  const houses = data?.items ?? [];
  const totalPages = data?.total_pages ?? 1;
  const total = data?.total ?? 0;
  const houseGroups = houseGroupsData?.items ?? [];

  const handleCloseImportModal = () => {
    setIsImportModalOpen(false);
    setImportFile(null);
    importFormRef.current?.reset();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.address) {
      setErrors({
        name: !formData.name ? "Name is required" : "",
        address: !formData.address ? "Address is required" : "",
      });
      return;
    }

    createHouseMutation.mutate(
      {
        name: formData.name,
        description: formData.description,
        address: formData.address,
        house_group_ids: formData.house_group_ids,
      } as any,
      {
        onSuccess: () => {
          setFormData({ name: "", description: "", address: "", house_group_ids: [] });
          setIsCreateModalOpen(false);
          setErrors({});
        },
      }
    );
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedHouse || !formData.name || !formData.address) {
      setErrors({
        name: !formData.name ? "Name is required" : "",
        address: !formData.address ? "Address is required" : "",
      });
      return;
    }

    updateHouseMutation.mutate(
      {
        houseId: selectedHouse.id,
        data: {
          name: formData.name,
          description: formData.description,
          address: formData.address,
          house_group_ids: formData.house_group_ids,
        } as any,
      },
      {
        onSuccess: () => {
          setFormData({ name: "", description: "", address: "", house_group_ids: [] });
          setIsEditModalOpen(false);
          setSelectedHouse(null);
          setErrors({});
        },
      }
    );
  };

  const handleEdit = (house: House) => {
    setSelectedHouse(house);
    const houseGroupIds = (house as any).house_group_ids || [];
    setFormData({
      name: house.name,
      description: house.description || "",
      address: house.address || "",
      house_group_ids: Array.isArray(houseGroupIds) ? houseGroupIds : [],
    });
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

  const toggleHouseGroupSelection = (groupId: string) => {
    setFormData(prev => ({
      ...prev,
      house_group_ids: prev.house_group_ids.includes(groupId)
        ? prev.house_group_ids.filter(id => id !== groupId)
        : [...prev.house_group_ids, groupId]
    }));
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
      accessor: (row) => row.name,
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
      key: "house_group",
      header: "House Group",
      sortable: false,
      filterable: true,
      filterType: "select",
      filterOptions: houseGroups.map((group) => ({
        value: group.id,
        label: group.name,
      })),
      accessor: (row) => {
        const houseGroupIds = (row as any).house_group_ids || [];
        if (!Array.isArray(houseGroupIds) || houseGroupIds.length === 0) return "-";
        const groupNames = houseGroupIds
          .map((id: string) => houseGroups.find(g => g.id === id)?.name)
          .filter(Boolean);
        return groupNames.length > 0 ? groupNames.join(", ") : "-";
      },
    },
    {
      key: "is_active",
      header: "Status",
      sortable: true,
      filterable: true,
      filterType: "select",
      filterOptions: [
        { value: "true", label: "Active" },
        { value: "false", label: "Inactive" },
      ],
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
            onClick={() => handleEdit(row)}
          >
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
    <DashboardLayout type="admin">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Houses</h1>
            <p className="text-muted-foreground">
              Manage houses in the system
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsImportModalOpen(true)}
            >
              Import Houses
            </Button>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add House
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            {isLoading ? (
              <TableSkeleton />
            ) : !houses || houses.length === 0 && !search && !status && !houseGroupId ? (
              <EmptyState
                icon={Building2}
                title="No houses yet"
                description="Get started by adding your first house"
                action={{
                  label: "Add House",
                  onClick: () => setIsCreateModalOpen(true),
                }}
              />
            ) : (
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
                externalSearch={search}
                onSearchChange={(value) => {
                  setPage(1);
                  setSearch(value);
                }}
                filterableFields={filterableFields}
                onFiltersChange={(filters) => {
                  setPage(1);
                  // Extract filter values from filters and explicitly clear if not found
                  const isActiveFilter = filters.find(f => f.field === "is_active");
                  const houseGroupFilter = filters.find(f => f.field === "house_group_id");

                  // Always set state (undefined if filter not found) to ensure URL clearing
                  setStatus(isActiveFilter?.value as string | undefined || undefined);
                  setHouseGroupId(houseGroupFilter?.value as string | undefined || undefined);
                }}
                onSortChange={(newSort) => {
                  setPage(1);
                  setSort(newSort);
                }}
                disableClientSideFiltering={true}
                disableClientSideSorting={true}
                selectable={true}
                selectedRows={selectedHouses}
                onSelectionChange={setSelectedHouses}
                bulkActions={bulkActions}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setFormData({ name: "", description: "", address: "", house_group_ids: [] });
          setErrors({});
        }}
        title="Add New House"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={errors.name}
            required
          />
          <Input
            label="Address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            error={errors.address}
            required
          />
          <Input
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium mb-2">House Groups (Optional)</label>
            <div className="max-h-48 overflow-y-auto border border-input rounded-md p-3 space-y-2">
              {houseGroups.length === 0 ? (
                <p className="text-sm text-muted-foreground">No house groups available</p>
              ) : (
                houseGroups.map((group) => (
                  <label key={group.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={formData.house_group_ids.includes(group.id)}
                      onChange={() => toggleHouseGroupSelection(group.id)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span className="text-sm">{group.name}</span>
                  </label>
                ))
              )}
            </div>
          </div>
          <div className="flex gap-4 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsCreateModalOpen(false);
                setFormData({ name: "", description: "", address: "", house_group_ids: [] });
                setErrors({});
              }}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={createHouseMutation.isPending}>
              Create House
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedHouse(null);
          setFormData({ name: "", description: "", address: "", house_group_ids: [] });
          setErrors({});
        }}
        title="Edit House"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={errors.name}
            required
          />
          <Input
            label="Address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            error={errors.address}
            required
          />
          <Input
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium mb-2">House Groups (Optional)</label>
            <div className="max-h-48 overflow-y-auto border border-input rounded-md p-3 space-y-2">
              {houseGroups.length === 0 ? (
                <p className="text-sm text-muted-foreground">No house groups available</p>
              ) : (
                houseGroups.map((group) => (
                  <label key={group.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={formData.house_group_ids.includes(group.id)}
                      onChange={() => toggleHouseGroupSelection(group.id)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span className="text-sm">{group.name}</span>
                  </label>
                ))
              )}
            </div>
          </div>
          <div className="flex gap-4 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedHouse(null);
                setFormData({ name: "", description: "", address: "", house_group_ids: [] });
                setErrors({});
              }}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={updateHouseMutation.isPending}>
              Update House
            </Button>
          </div>
        </form>
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
            Are you sure you want to delete <strong>{houseToDelete?.name}</strong>?
            This action cannot be undone.
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
              isLoading={importHousesMutation.isPending}
              disabled={!importFile}
            >
              Import
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
