"use client";

import { useState, useMemo, useEffect } from "react";
import { useAdminHouseGroups, useCreateHouseGroup, useUpdateHouseGroup, useDeleteHouseGroup, useAdminHouses, useBulkDeleteHouseGroups, useBulkToggleHouseGroupActive } from "@/hooks/use-admin";
import { useUrlQuerySync } from "@/hooks/use-url-query-sync";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { DataTable, Column, BulkAction } from "@/components/ui/DataTable";
import { Plus, Building2, Edit, Trash2, CheckCircle, XCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { formatFiltersForAPI } from "@/lib/table-utils";
import { toast } from "sonner";
import { HouseGroup, House } from "@/types";

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100];
const PAGE_SIZE = 10;
const STATUS_FILTERS: Array<{ value: string, label: string }> = [
    { value: "all", label: "All" },
    { value: "true", label: "Active" },
    { value: "false", label: "Inactive" },
]
export default function HouseGroupsPage() {
    // URL query sync
    const { initializeFromUrl, syncToUrl } = useUrlQuerySync({
        config: {
            page: { defaultValue: 1 },
            pageSize: { defaultValue: PAGE_SIZE },
            search: { defaultValue: "" },
            status: { defaultValue: undefined },
            sort: { defaultValue: null },
        },
        skipInitialSync: true,
    });

    // Initialize state from URL
    const [page, setPage] = useState(() => initializeFromUrl("page"));
    const [pageSize, setPageSize] = useState(() => initializeFromUrl("pageSize"));
    const [search, setSearch] = useState(() => initializeFromUrl("search"));
    const [status, setStatus] = useState<string | undefined>(() => initializeFromUrl("is_active"));
    const [sort, setSort] = useState<string | null>(() => initializeFromUrl("sort"));

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<HouseGroup | null>(null);
    const [selectedHouses, setSelectedHouses] = useState<Set<string>>(new Set());
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        house_ids: [] as string[],
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());

    // Mutations
    const createMutation = useCreateHouseGroup();
    const updateMutation = useUpdateHouseGroup();
    const deleteMutation = useDeleteHouseGroup();
    const bulkDeleteMutation = useBulkDeleteHouseGroups();
    const bulkToggleActiveMutation = useBulkToggleHouseGroupActive();

    // Sync state to URL
    useEffect(() => {
        syncToUrl({ page, pageSize, search, status, sort });
    }, [page, pageSize, search, status, sort, syncToUrl]);

    // Build filters
    const filterableFields = useMemo(() => {
        const fields: Array<{ field: string; operator?: "eq"; value?: string | boolean }> = [];
        if (status) {
            fields.push({
                field: "is_active",
                operator: "eq",
                value: status === "true"
            });
        }
        return fields;
    }, [status]);

    // Fetch house groups
    const { data, isLoading, isFetching } = useAdminHouseGroups({
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

    // Fetch all houses for selection
    const { data: housesData } = useAdminHouses({
        page: 1,
        pageSize: 100,
    });


    // Bulk actions
    const handleBulkDelete = (selectedIds: string[]) => {
        bulkDeleteMutation.mutate(selectedIds, {
            onSuccess: () => {
                setSelectedGroups(new Set());
            },
        });
    };

    const handleBulkToggleActive = (selectedIds: string[]) => {
        bulkToggleActiveMutation.mutate(selectedIds, {
            onSuccess: () => {
                setSelectedGroups(new Set());
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

    const houseGroups = data?.items ?? [];
    const totalPages = data?.total_pages ?? 1;
    const total = data?.total ?? 0;
    const allHouses = housesData?.items ?? [];



    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const newErrors: Record<string, string> = {};
        if (!formData.name.trim()) newErrors.name = "Name is required";
        if (formData.house_ids.length === 0) {
            newErrors.house_ids = "At least one house must be selected";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        createMutation.mutate(
            {
                name: formData.name.trim(),
                description: formData.description.trim() || null,
                house_ids: formData.house_ids,
            },
            {
                onSuccess: () => {
                    setIsCreateModalOpen(false);
                    setFormData({ name: "", description: "", house_ids: [] });
                    setSelectedHouses(new Set());
                    setErrors({});
                },
            }
        );
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedGroup) return;

        const newErrors: Record<string, string> = {};
        if (!formData.name.trim()) newErrors.name = "Name is required";
        if (formData.house_ids.length === 0) {
            newErrors.house_ids = "At least one house must be selected";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        updateMutation.mutate(
            {
                groupId: selectedGroup.id,
                data: {
                    name: formData.name.trim(),
                    description: formData.description.trim() || null,
                    house_ids: formData.house_ids,
                },
            },
            {
                onSuccess: () => {
                    setIsEditModalOpen(false);
                    setSelectedGroup(null);
                    setFormData({ name: "", description: "", house_ids: [] });
                    setSelectedHouses(new Set());
                    setErrors({});
                },
            }
        );
    };

    const handleDelete = () => {
        if (!selectedGroup) return;
        deleteMutation.mutate(selectedGroup.id, {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                setSelectedGroup(null);
            },
        });
    };

    const openEditModal = (group: HouseGroup) => {
        setSelectedGroup(group);
        const houseIds = group.house_ids || [];
        setFormData({
            name: group.name,
            description: group.description || "",
            house_ids: houseIds,
        });
        setSelectedHouses(new Set(houseIds));
        setErrors({});
        setIsEditModalOpen(true);
    };

    const openDeleteModal = (group: HouseGroup) => {
        setSelectedGroup(group);
        setIsDeleteModalOpen(true);
    };

    const toggleHouseSelection = (houseId: string) => {
        const newSelected = new Set(selectedHouses);
        if (newSelected.has(houseId)) {
            newSelected.delete(houseId);
        } else {
            newSelected.add(houseId);
        }
        setSelectedHouses(newSelected);
        setFormData({
            ...formData,
            house_ids: Array.from(newSelected),
        });
        if (errors.house_ids) {
            setErrors({ ...errors, house_ids: "" });
        }
    };

    const toggleAllHouses = () => {
        if (selectedHouses.size === allHouses.length) {
            setSelectedHouses(new Set());
            setFormData({ ...formData, house_ids: [] });
        } else {
            const allIds = new Set(allHouses.map((h) => h.id));
            setSelectedHouses(allIds);
            setFormData({ ...formData, house_ids: Array.from(allIds) });
        }
        if (errors.house_ids) {
            setErrors({ ...errors, house_ids: "" });
        }
    };

    const columns: Column<HouseGroup>[] = [
        {
            key: "name",
            header: "Group Name",
            sortable: true,
            filterable: true,
            accessor: (row) => (
                <span className="font-medium">{row.name}</span>
            ),
        },
        {
            key: "description",
            header: "Description",
            sortable: true,
            accessor: (row) => row.description || (
                <span className="text-muted-foreground">—</span>
            ),
        },
        {
            key: "is_active",
            header: "Status",
            sortable: true,
            filterable: true,
            filterType: "select",
            filterOptions: STATUS_FILTERS.filter(f => f.value !== "all").map((f) => ({
                value: f.value,
                label: f.label,
            })),
            accessor: (row) => {
                const isActive = (row as any).is_active;
                return (
                    <span className={`text-sm ${isActive ? "text-green-600" : "text-muted-foreground"}`}>
                        {isActive ? "Active" : "Inactive"}
                    </span>
                );
            },
        },
        {
            key: "houses",
            header: "Houses",
            sortable: false,
            accessor: (row) => {
                const count = row.house_ids?.length || row.houses?.length || 0;
                return (
                    <span className="text-sm">{count} house{count !== 1 ? "s" : ""}</span>
                );
            },
        },
        {
            key: "created_at",
            header: "Created",
            sortable: true,
            accessor: (row) => (
                <span className="text-xs text-muted-foreground">
                    {formatDate(row.created_at)}
                </span>
            ),
        },
        {
            key: "actions",
            header: "",
            sortable: false,
            className: "w-24 text-right",
            accessor: (row) => (
                <div className="flex items-center justify-end gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(row);
                        }}
                        className="h-7 w-7 p-0"
                    >
                        <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            openDeleteModal(row);
                        }}
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <>
            <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex-shrink-0 border-b border-border bg-background">
                    <div className="px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-xl font-semibold text-foreground">House Groups</h1>
                                <p className="text-sm text-muted-foreground mt-0.5">
                                    Group houses for unified management
                                </p>
                            </div>
                            <Button
                                onClick={() => {
                                    setIsCreateModalOpen(true);
                                    setFormData({ name: "", description: "", house_ids: [] });
                                    setSelectedHouses(new Set());
                                    setErrors({});
                                }}
                                size="sm"
                            >
                                <Plus className="h-4 w-4 mr-1.5" />
                                Create Group
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    <div className="px-6 py-4">
                        {/* Table */}
                        {isLoading ? (
                            <TableSkeleton />
                        ) : houseGroups.length === 0 && !search && !status ? (
                            <EmptyState
                                icon={Building2}
                                title="No house groups"
                                description="Create your first house group to organize houses"
                                action={{
                                    label: "Create House Group",
                                    onClick: () => {
                                        setIsCreateModalOpen(true);
                                        setFormData({ name: "", description: "", house_ids: [] });
                                        setSelectedHouses(new Set());
                                        setErrors({});
                                    },
                                }}
                            />
                        ) : (
                            <DataTable
                                data={houseGroups}
                                columns={columns}
                                searchable={true}
                                searchPlaceholder="Search house groups..."
                                pageSize={pageSize}
                                pageSizeOptions={PAGE_SIZE_OPTIONS}
                                onPageSizeChange={setPageSize}
                                showPagination={true}
                                emptyMessage="No house groups found"
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
                                    const statusFilter = filters.find((f) => f.field === "is_active");
                                    setStatus(statusFilter?.value as string | undefined || undefined);
                                }}
                                onSortChange={(newSort) => {
                                    setPage(1);
                                    setSort(newSort);
                                }}
                                disableClientSideFiltering={true}
                                disableClientSideSorting={false}
                                className="border border-zinc-200 rounded"
                                selectable={true}
                                selectedRows={selectedGroups}
                                onSelectionChange={setSelectedGroups}
                                bulkActions={bulkActions}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Create Modal */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => {
                    setIsCreateModalOpen(false);
                    setFormData({ name: "", description: "", house_ids: [] });
                    setSelectedHouses(new Set());
                    setErrors({});
                }}
                title="Create House Group"
            >
                <form onSubmit={handleCreateSubmit} className="space-y-4">
                    <Input
                        label="Group Name"
                        placeholder="e.g., Building A, East Wing"
                        value={formData.name}
                        onChange={(e) => {
                            setFormData({ ...formData, name: e.target.value });
                            if (errors.name) setErrors({ ...errors, name: "" });
                        }}
                        error={errors.name}
                        required
                    />

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Description (Optional)
                        </label>
                        <textarea
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            placeholder="Brief description of this group"
                            value={formData.description}
                            onChange={(e) =>
                                setFormData({ ...formData, description: e.target.value })
                            }
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium">
                                Houses <span className="text-destructive">*</span>
                            </label>
                            {allHouses.length > 0 && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={toggleAllHouses}
                                    className="h-7 text-xs"
                                >
                                    {selectedHouses.size === allHouses.length
                                        ? "Deselect All"
                                        : "Select All"}
                                </Button>
                            )}
                        </div>
                        <div className="border border-border rounded-md max-h-64 overflow-y-auto p-2">
                            {allHouses.length === 0 ? (
                                <p className="text-sm text-muted-foreground p-2">
                                    No houses available
                                </p>
                            ) : (
                                <div className="space-y-1">
                                    {allHouses.map((house) => (
                                        <label
                                            key={house.id}
                                            className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/50 cursor-pointer"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedHouses.has(house.id)}
                                                onChange={() => toggleHouseSelection(house.id)}
                                                className="h-4 w-4 rounded border-input"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium">{house.name}</div>
                                                <div className="text-xs text-muted-foreground truncate">
                                                    {house.address}
                                                </div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                        {errors.house_ids && (
                            <p className="text-xs text-destructive mt-1">{errors.house_ids}</p>
                        )}
                    </div>

                    <div className="flex gap-3 justify-end pt-2 border-t border-border">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setIsCreateModalOpen(false);
                                setFormData({ name: "", description: "", house_ids: [] });
                                setSelectedHouses(new Set());
                                setErrors({});
                            }}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" isLoading={createMutation.isPending}>
                            Create Group
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Edit Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setSelectedGroup(null);
                    setFormData({ name: "", description: "", house_ids: [] });
                    setSelectedHouses(new Set());
                    setErrors({});
                }}
                title="Edit House Group"
            >
                <form onSubmit={handleEditSubmit} className="space-y-4">
                    <Input
                        label="Group Name"
                        placeholder="e.g., Building A, East Wing"
                        value={formData.name}
                        onChange={(e) => {
                            setFormData({ ...formData, name: e.target.value });
                            if (errors.name) setErrors({ ...errors, name: "" });
                        }}
                        error={errors.name}
                        required
                    />

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Description (Optional)
                        </label>
                        <textarea
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            placeholder="Brief description of this group"
                            value={formData.description}
                            onChange={(e) =>
                                setFormData({ ...formData, description: e.target.value })
                            }
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium">
                                Houses <span className="text-destructive">*</span>
                            </label>
                            {allHouses.length > 0 && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={toggleAllHouses}
                                    className="h-7 text-xs"
                                >
                                    {selectedHouses.size === allHouses.length
                                        ? "Deselect All"
                                        : "Select All"}
                                </Button>
                            )}
                        </div>
                        <div className="border border-border rounded-md max-h-64 overflow-y-auto p-2">
                            {allHouses.length === 0 ? (
                                <p className="text-sm text-muted-foreground p-2">
                                    No houses available
                                </p>
                            ) : (
                                <div className="space-y-1">
                                    {allHouses.map((house) => (
                                        <label
                                            key={house.id}
                                            className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/50 cursor-pointer"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedHouses.has(house.id)}
                                                onChange={() => toggleHouseSelection(house.id)}
                                                className="h-4 w-4 rounded border-input"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium">{house.name}</div>
                                                <div className="text-xs text-muted-foreground truncate">
                                                    {house.address}
                                                </div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                        {errors.house_ids && (
                            <p className="text-xs text-destructive mt-1">{errors.house_ids}</p>
                        )}
                    </div>

                    <div className="flex gap-3 justify-end pt-2 border-t border-border">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setIsEditModalOpen(false);
                                setSelectedGroup(null);
                                setFormData({ name: "", description: "", house_ids: [] });
                                setSelectedHouses(new Set());
                                setErrors({});
                            }}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" isLoading={updateMutation.isPending}>
                            Save Changes
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setSelectedGroup(null);
                }}
                title="Delete House Group"
            >
                <div className="space-y-4">
                    <p className="text-sm text-foreground">
                        Are you sure you want to delete{" "}
                        <span className="font-medium">{selectedGroup?.name}</span>? This
                        action cannot be undone.
                    </p>

                    <div className="flex gap-3 justify-end pt-2 border-t border-border">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setIsDeleteModalOpen(false);
                                setSelectedGroup(null);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleDelete}
                            isLoading={deleteMutation.isPending}
                        >
                            Delete
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
