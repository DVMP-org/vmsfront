"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAdminDeleteRole, useAdminRoles } from "@/hooks/use-admin";
import { useUrlQuerySync } from "@/hooks/use-url-query-sync";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable, Column, BulkAction, FilterDefinition, FilterConfig } from "@/components/ui/DataTable";
import { Shield, Trash2, Edit, Plus } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { AdminRole } from "@/types";
import { SlideOver } from "@/components/ui/SlideOver";
import { UpdateRoleForm } from "./components/UpdateRoleForm";
import { formatFiltersForAPI } from "@/lib/table-utils";

const PAGE_SIZE = 20;

export default function RolesPage() {

  const router = useRouter();

  // URL query sync
  const { initializeFromUrl, syncToUrl } = useUrlQuerySync({
    config: {
      page: { defaultValue: 1 },
      pageSize: { defaultValue: PAGE_SIZE },
      search: { defaultValue: "" },
      sort: { defaultValue: null },
    },
    skipInitialSync: true,
  });

  // Initialize state from URL
  const [page, setPage] = useState(() => initializeFromUrl("page"));
  const [pageSize, setPageSize] = useState(() => initializeFromUrl("pageSize"));
  const [search, setSearch] = useState(() => initializeFromUrl("search"));
  const [sort, setSort] = useState<string | null>(() => initializeFromUrl("sort"));
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set());
  const [editingRole, setEditingRole] = useState<AdminRole | null>(null);
  const [deletingRoleId, setDeletingRoleId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(() => initializeFromUrl("status"));
  const [startDate, setStartDate] = useState<string | null>(() => initializeFromUrl("startDate"));
  const [endDate, setEndDate] = useState<string | null>(() => initializeFromUrl("endDate"));
  const deletRole = useAdminDeleteRole();

  // Sync state to URL
  useEffect(() => {
    syncToUrl({ page, pageSize, search, sort });
  }, [page, pageSize, search, sort, syncToUrl]);

  const activeFilters = useMemo(() => {
    const filters: FilterConfig[] = [];
    if (status) filters.push({ field: "status", operator: "eq" as const, value: status });

    // Match the DataTable internal key pattern for date-range
    if (startDate) filters.push({ field: "created_at", operator: "gte" as const, value: startDate });
    if (endDate) filters.push({ field: "created_at", operator: "lte" as const, value: endDate });

    return filters;
  }, [status, startDate, endDate]);

  const availableFilters: FilterDefinition[] = [
    {
      field: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ],
    },
    {
      field: "created_at",
      label: "Created Between",
      type: "date-range",
    },
  ];


  const { data: rolesData, isLoading, isFetching } = useAdminRoles({
    page,
    pageSize,
    search,
    sort: sort || undefined,
    filters: formatFiltersForAPI(activeFilters)
  });

  // Pagination
  const roles = useMemo(() => rolesData?.items ?? [], [rolesData]);

  const total = rolesData?.total ?? 0;

  // Bulk actions
  const handleBulkDelete = (selectedIds: string[]) => {
    toast.info(`Deleting ${selectedIds.length} role(s)...`);
    // TODO: Implement bulk delete
    setSelectedRoles(new Set());
  };

  const handleDelete = (roleId: string) => {
    setDeletingRoleId(roleId);
    toast.info(`Deleting role "${roleId}"...`);
    deletRole.mutate(roleId, {
      onSettled: () => {
        setDeletingRoleId(null);
      },
    });
  };

  const bulkActions: BulkAction[] = [
    {
      label: "Delete",
      icon: Trash2,
      onClick: handleBulkDelete,
      variant: "destructive",
      requiresConfirmation: true,
    },
  ];

  // Define columns
  const columns: Column<AdminRole>[] = [
    {
      key: "name",
      header: "Role Name",
      sortable: true,
      accessor: (row) => (
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-[var(--brand-primary,#213928)]" />
          <div>
            <p className="font-medium text-lg">{row.name}</p>
            {row.description && (
              <p className="text-sm text-muted-foreground">
                {row.description}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "code",
      header: "Code",
      sortable: true,
      accessor: (row) => (
        <Badge variant="secondary">{row.code}</Badge>
      ),
    },
    {
      key: "permissions",
      header: "Permissions",
      sortable: false,
      accessor: (row) => {
        if (!row.permissions_parsed || row.permissions_parsed.length === 0) {
          return <span className="text-sm text-muted-foreground">No permissions</span>;
        }

        return (
          <div className="flex flex-wrap gap-1">
            {row.permissions_parsed.slice(0, 3).map((perm, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {perm}
              </Badge>
            ))}
            {row.permissions_parsed.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{row.permissions_parsed.length - 3} more
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      key: "created_at",
      header: "Created",
      sortable: true,
      accessor: (row) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.created_at)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      sortable: false,
      accessor: (row) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditingRole(row)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (confirm(`Are you sure you want to delete the role "${row.name}"?`)) {
                toast.info(`Deleting role "${row.name}"...`);
                handleDelete(row.id);
              }
            }}
            disabled={deletingRoleId === row.id}
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
            <h1 className="text-2xl font-bold">Roles & Permissions</h1>
            <p className="text-muted-foreground">
              Manage admin roles and their permissions
            </p>
          </div>
          <Button
            type="button"
            onClick={() => router.push("/admin/admins/roles/create")}
          >
            <Plus className="h-4 w-4" />
            Create role
          </Button>
        </div>

        <Card>
          <CardContent className="p-6">

            <DataTable
              data={roles}
              columns={columns}
              searchable={true}
              searchPlaceholder="Search roles by name, code, or description..."
              pageSize={pageSize}
              showPagination={true}
              emptyMessage="No roles found"
              serverSide={false}
              total={total}
              currentPage={page}
              initialFilters={activeFilters}
              availableFilters={availableFilters}
              onPageChange={setPage}
              initialSearch={search}
              onFiltersChange={(filters) => {
                setPage(1);
                const statusFilter = filters.find((filter) => filter.field === "status");
                const startDateFilter = filters.find((filter) => filter.field === "created_at" && filter.operator === "gte");
                const endDateFilter = filters.find((filter) => filter.field === "created_at" && filter.operator === "lte");
                setStatus(statusFilter?.value as string || "");
                setStartDate(startDateFilter?.value as string || "");
                setEndDate(endDateFilter?.value as string || "");
              }}
              onSearchChange={(value) => {
                setPage(1);
                setSearch(value);
              }}
              onSortChange={(newSort) => {
                setPage(1);
                setSort(newSort);
              }}
              disableClientSideFiltering={true}
              disableClientSideSorting={false}
              selectable={true}
              selectedRows={selectedRoles}
              onSelectionChange={setSelectedRoles}
              bulkActions={bulkActions}
              isLoading={isLoading || isFetching}
            />

          </CardContent>
        </Card>
      </div>

      {/* Update Role SlideOver */}
      <SlideOver
        isOpen={!!editingRole}
        onClose={() => setEditingRole(null)}
        title="Edit Role & Permissions"
        description="Modify the name, code, and access levels for this role."
        size="lg"
      >
        {editingRole && (
          <UpdateRoleForm
            role={editingRole}
            onSuccess={() => {
              setEditingRole(null);
            }}
            onCancel={() => setEditingRole(null)}
          />
        )}
      </SlideOver>
    </>
  );
}
