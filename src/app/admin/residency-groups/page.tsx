"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminResidencyGroups, useCreateResidencyGroup, useUpdateResidencyGroup, useDeleteResidencyGroup, useAdminResidencies, useBulkDeleteResidencyGroups, useBulkToggleResidencyGroupActive } from "@/hooks/use-admin";
import { useUrlQuerySync } from "@/hooks/use-url-query-sync";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { DataTable, Column, BulkAction, FilterDefinition, FilterConfig } from "@/components/ui/DataTable";
import { Plus, Building2, Edit, Trash2, CheckCircle, Eye } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { formatFiltersForAPI } from "@/lib/table-utils";
import { ResidencyGroup, Residency } from "@/types";
import { ResidencyGroupForm, ResidencyGroupFormData } from "./components/ResidencyGroupForm";
import { Card, CardContent } from "@/components/ui/Card";

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100];
const PAGE_SIZE = 10;
const STATUS_FILTERS: Array<{ value: string, label: string }> = [
    { value: "True", label: "Active" },
    { value: "False", label: "Inactive" },
]

export default function ResidencyGroupsPage() {
    const router = useRouter();
    // URL query sync
    const { initializeFromUrl, syncToUrl } = useUrlQuerySync({
        config: {
            page: { defaultValue: 1 },
            pageSize: { defaultValue: PAGE_SIZE },
            search: { defaultValue: "" },
            is_active: { defaultValue: undefined },
            sort: { defaultValue: null },
            startDate: { defaultValue: undefined },
            endDate: { defaultValue: undefined },
        },
        skipInitialSync: true,
    });

    // Initialize state from URL
    const [page, setPage] = useState(() => initializeFromUrl("page"));
    const [pageSize, setPageSize] = useState(() => initializeFromUrl("pageSize"));
    const [search, setSearch] = useState(() => initializeFromUrl("search"));
    const [status, setStatus] = useState<string | undefined>(() => initializeFromUrl("is_active"));
    const [sort, setSort] = useState<string | null>(() => initializeFromUrl("sort"));
    const [startDate, setStartDate] = useState<string | undefined>(() => initializeFromUrl("startDate"))
    const [endDate, setEndDate] = useState<string | undefined>(() => initializeFromUrl("endDate"))


    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<ResidencyGroup | null>(null);
    const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());

    // Mutations
    const createMutation = useCreateResidencyGroup();
    const updateMutation = useUpdateResidencyGroup();
    const deleteMutation = useDeleteResidencyGroup();
    const bulkDeleteMutation = useBulkDeleteResidencyGroups();
    const bulkToggleActiveMutation = useBulkToggleResidencyGroupActive();

    // Sync state to URL
    useEffect(() => {
        syncToUrl({
            page,
            pageSize,
            search,
            is_active: status,
            sort,
            startDate,
            endDate
        });
    }, [page, pageSize, search, status, sort, startDate, endDate, syncToUrl]);

    // Build filters
    const availableFilters = useMemo(() => {
        const fields: FilterDefinition[] = [{
            field: "is_active",
            label: "Status",
            type: "select",
            options: [
                ...STATUS_FILTERS.map((s) => ({ value: s.value, label: s.label }))
            ],
        },
        {
            field: "created_at",
            label: "Date Range",
            type: "date-range",

        }
        ];
        return fields;
    }, [status]);

    const activeFilters = useMemo(() => {
        const filters: FilterConfig[] = [];
        if (status) {
            filters.push({ field: "is_active", operator: "eq", value: status });
        }
        if (startDate) {
            filters.push({ field: "created_at", operator: "gte", value: startDate });
        }
        if (endDate) {
            filters.push({ field: "created_at", operator: "lte", value: endDate });
        }
        return filters;
    }, [status, startDate, endDate]);

    // Fetch residency groups
    const { data, isLoading, isFetching } = useAdminResidencyGroups({
        page,
        pageSize,
        search: search.trim() || undefined,
        filters: formatFiltersForAPI(activeFilters),
        sort: sort || undefined,
    });

    // Fetch all residencies for selection
    const { data: residenciesData } = useAdminResidencies({
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

    const residencyGroups = data?.items ?? [];
    const total = data?.total ?? 0;
    const allResidencies = residenciesData?.items ?? [];

    const handleCreateSubmit = (data: ResidencyGroupFormData) => {
        createMutation.mutate(
            {
                name: data.name.trim(),
                description: data.description?.trim() || null,
                residency_ids: data.residency_ids,
            },
            {
                onSuccess: () => {
                    setIsCreateModalOpen(false);
                },
            }
        );
    };

    const handleEditSubmit = (data: ResidencyGroupFormData) => {
        if (!selectedGroup) return;

        updateMutation.mutate(
            {
                groupId: selectedGroup.id,
                data: {
                    name: data.name.trim(),
                    description: data.description?.trim() || null,
                    residency_ids: data.residency_ids,
                },
            },
            {
                onSuccess: () => {
                    setIsEditModalOpen(false);
                    setSelectedGroup(null);
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

    const openEditModal = (group: ResidencyGroup) => {
        setSelectedGroup(group);
        setIsEditModalOpen(true);
    };

    const openDeleteModal = (group: ResidencyGroup) => {
        setSelectedGroup(group);
        setIsDeleteModalOpen(true);
    };

    const columns: Column<ResidencyGroup>[] = [
        {
            key: "name",
            header: "Group Name",
            sortable: true,
            accessor: (row) => (
                <button
                    onClick={() => router.push(`/admin/residency-groups/${row.id}`)}
                    className="font-medium text-primary hover:underline text-left"
                >
                    {row.name}
                </button>
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
            key: "residencies",
            header: "Residencies",
            sortable: false,
            accessor: (row) => {
                const count = row.residency_ids?.length || row.residencies?.length || 0;
                return (
                    <span className="text-sm">{count} residency{count !== 1 ? "s" : ""}</span>
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
                            router.push(`/admin/residency-groups/${row.id}`);
                        }}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
                    >
                        <Eye className="h-3.5 w-3.5" />
                    </Button>
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
                                <h1 className="text-xl font-semibold text-foreground">Residency Groups</h1>
                                <p className="text-sm text-muted-foreground mt-0.5">
                                    Group residencies for unified management
                                </p>
                            </div>
                            <Button
                                onClick={() => {
                                    setIsCreateModalOpen(true);
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
                        <Card>
                            <CardContent className="p-6">

                                <DataTable
                                    data={residencyGroups}
                                    columns={columns}
                                    searchable={true}
                                    searchPlaceholder="Search residency groups..."
                                    pageSize={pageSize}
                                    pageSizeOptions={PAGE_SIZE_OPTIONS}
                                    onPageSizeChange={setPageSize}
                                    showPagination={true}
                                    emptyMessage="No residency groups found"
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
                                        const statusFilter = filters.find((f) => f.field === "is_active");
                                        setStatus(statusFilter?.value as string | undefined || undefined);
                                        const startDateFilter = filters.find((f) => f.field === "created_at" && f.operator === "gte");
                                        setStartDate(startDateFilter?.value as string | undefined || undefined);
                                        const endDateFilter = filters.find((f) => f.field === "created_at" && f.operator === "lte");
                                        setEndDate(endDateFilter?.value as string | undefined || undefined);
                                    }}
                                    onSortChange={(newSort) => {
                                        setPage(1);
                                        setSort(newSort);
                                    }}
                                    disableClientSideFiltering={true}
                                    disableClientSideSorting={false}
                                    className=" rounded"
                                    selectable={true}
                                    selectedRows={selectedGroups}
                                    onSelectionChange={setSelectedGroups}
                                    bulkActions={bulkActions}
                                    isLoading={isLoading || isFetching}
                                />

                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Create Modal */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => {
                    setIsCreateModalOpen(false);
                }}
                title="Create Residency Group"
            >
                <ResidencyGroupForm
                    onSubmit={handleCreateSubmit}
                    onCancel={() => setIsCreateModalOpen(false)}
                    isLoading={createMutation.isPending}
                    allResidencies={allResidencies}
                />
            </Modal>

            {/* Edit Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setSelectedGroup(null);
                }}
                title="Edit Residency Group"
            >
                {selectedGroup && (
                    <ResidencyGroupForm
                        initialData={{
                            name: selectedGroup.name,
                            description: selectedGroup.description || "",
                            residency_ids: selectedGroup.residency_ids || [],
                        }}
                        onSubmit={handleEditSubmit}
                        onCancel={() => {
                            setIsEditModalOpen(false);
                            setSelectedGroup(null);
                        }}
                        isLoading={updateMutation.isPending}
                        allResidencies={allResidencies}
                    />
                )}
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setSelectedGroup(null);
                }}
                title="Delete Residency Group"
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
