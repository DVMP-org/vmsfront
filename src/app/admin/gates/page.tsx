"use client";

import React, { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable, Column, FilterConfig, FilterDefinition } from "@/components/ui/DataTable";
import { Plus, Settings, Trash2, UserPlus, Eye } from "lucide-react";
import { Gate } from "@/types";
import { useAdminGates, useDeleteGate } from "@/hooks/use-admin";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { useUrlQuerySync } from "@/hooks/use-url-query-sync";
import { GateFormModal } from "@/components/admin/gate-modals/GateFormModal";
import { GateToggleAdminModal } from "@/components/admin/gate-modals/GateToggleAdminModal";
import { GateViewModal } from "@/components/admin/gate-modals/GateViewModal";
import { formatFiltersForAPI } from "@/lib/table-utils";

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100];
const PAGE_SIZE = 10;

export default function AdminGatesPage() {
    const config = useMemo(() => ({
        page: { defaultValue: 1 },
        pageSize: { defaultValue: PAGE_SIZE },
        search: { defaultValue: "" },
        sort: { defaultValue: undefined },
        dependency_id: { defaultValue: undefined },
    }), []);

    const { initializeFromUrl, syncToUrl } = useUrlQuerySync({
        config,
        skipInitialSync: true,
    });
    const isInitialMount = useRef(true);

    const [page, setPage] = useState(() => initializeFromUrl("page"));
    const [pageSize, setPageSize] = useState(() => initializeFromUrl("pageSize"));
    const [search, setSearch] = useState(() => initializeFromUrl("search") || "");
    const [sort, setSort] = useState<string | null>(() => initializeFromUrl("sort"));
    const [dependency_id, setDependencyId] = useState(() => initializeFromUrl("dependency_id"));

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedGate, setSelectedGate] = useState<Gate | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isToggleAdminModalOpen, setIsToggleAdminModalOpen] = useState(false);

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
        const filters: FilterConfig[] = []

        if (dependency_id) {
            filters.push({
                field: "dependency_id",
                value: dependency_id,
                operator: "eq",
            })
        }

        return filters;
    }, [dependency_id]);



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

    const deleteGateMutation = useDeleteGate();

    const gates = useMemo(() => data?.items ?? [], [data?.items]);
    const total = data?.total ?? 0;

    const availableFilters = useMemo(() => {
        const filters: FilterDefinition[] = []
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
            })
        }
        return filters;
    }, [filterOptionsData]);
    const handleEdit = (gate: Gate) => {
        setSelectedGate(gate);
        setIsEditModalOpen(true);
    };

    const handleView = (gate: Gate) => {
        setSelectedGate(gate);
        setIsViewModalOpen(true);
    };

    const handleToggleAdmin = (gate: Gate) => {
        setSelectedGate(gate);
        setIsToggleAdminModalOpen(true);
    };

    const handleDelete = async (gate: Gate) => {
        if (window.confirm(`Are you sure you want to delete gate "${gate.name}"?`)) {
            try {
                await deleteGateMutation.mutateAsync(gate.id);
            } catch (error) {
                // Error toast is handled in the hook
            }
        }
    };

    const columns: Column<Gate>[] = [
        {
            key: "name",
            header: "Name",
            sortable: true,
            accessor: (row) => (
                <div className="flex flex-col">
                    <span className="font-medium text-sm">{row.name}</span>
                    <span className="text-xs text-muted-foreground">{row.slug}</span>
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
            key: "gate_admins",
            header: "Admins",
            sortable: false,
            accessor: (row) => (
                <div className="flex -space-x-2 overflow-hidden">
                    {row.gate_admins && row.gate_admins.length > 0 ? (
                        row.gate_admins.slice(0, 3).map((gateAdmin) => (
                            <div
                                key={gateAdmin.admin_id}
                                className="inline-block m-2 h-7 w-7 ring-2 ring-white/20 rounded-full bg-white/40 flex items-center justify-center text-[10px] font-medium"
                                title={gateAdmin.admin?.user?.first_name + " " + gateAdmin.admin?.user?.last_name || gateAdmin.admin?.user?.email || "Admin"}
                            >
                                {gateAdmin.admin?.user?.first_name?.[0] || "?"}
                            </div>
                        ))
                    ) : (
                        <span className="text-xs text-muted-foreground italic">None</span>
                    )}
                    {row.gate_admins && row.gate_admins.length > 3 && (
                        <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-zinc-200 flex items-center justify-center text-[10px] font-medium">
                            +{row.gate_admins.length - 3}
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: "dependency",
            header: "Dependency",
            sortable: false,
            accessor: (row) => row.dependency?.name || row.dependency_id || <span className="text-muted-foreground italic">—</span>
        },
        {
            key: "created_at",
            header: "Created",
            sortable: true,
            accessor: (row) => (
                <span className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(row.created_at), { addSuffix: true })}
                </span>
            ),
        },
        {
            key: "actions",
            header: "Actions",
            accessor: (row) => (
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleView(row)} title="View">
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(row)} title="Edit">
                        <Settings className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleToggleAdmin(row)} title="Toggle Admins">
                        <UserPlus className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(row)} className="text-red-500 hover:text-red-600 hover:bg-red-50" title="Delete">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Gates Management</h1>
                    <p className="text-muted-foreground">
                        {total} total gate{total !== 1 ? "s" : ""} configured
                    </p>
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Gate
                </Button>
            </div>

            <Card>
                <CardContent className="p-6">
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
                            const dependencyFilter = filters.find((filter) => filter.field === "dependency_id" && filter.operator === "eq");
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
                </CardContent>
            </Card>

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

            <GateViewModal
                isOpen={isViewModalOpen}
                onClose={() => {
                    setIsViewModalOpen(false);
                    setSelectedGate(null);
                }}
                gate={selectedGate || undefined}
            />

            <GateToggleAdminModal
                isOpen={isToggleAdminModalOpen}
                onClose={() => {
                    setIsToggleAdminModalOpen(false);
                    setSelectedGate(null);
                }}
                gate={selectedGate || undefined}
            />
        </div>
    );
}
