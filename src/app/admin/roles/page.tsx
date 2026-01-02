"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAdminRoles } from "@/hooks/use-admin";
import { useUrlQuerySync } from "@/hooks/use-url-query-sync";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable, Column, BulkAction } from "@/components/ui/DataTable";
import { Shield, Trash2, Edit } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { AdminRole } from "@/types";

const PAGE_SIZE = 20;

export default function RolesPage() {
  const { data: roles, isLoading } = useAdminRoles();
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

  // Sync state to URL
  useEffect(() => {
    syncToUrl({ page, pageSize, search, sort });
  }, [page, pageSize, search, sort, syncToUrl]);

  // Filter roles client-side
  const filteredRoles = useMemo(() => {
    if (!roles) return [];
    if (!search.trim()) return roles;

    const q = search.toLowerCase();
    return roles.filter((role) => {
      const name = role.name?.toLowerCase() || "";
      const code = role.code?.toLowerCase() || "";
      const description = role.description?.toLowerCase() || "";
      return name.includes(q) || code.includes(q) || description.includes(q);
    });
  }, [roles, search]);

  // Pagination
  const paginatedRoles = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredRoles.slice(startIndex, endIndex);
  }, [filteredRoles, page, pageSize]);

  const totalPages = Math.ceil(filteredRoles.length / pageSize);
  const total = filteredRoles.length;

  // Bulk actions
  const handleBulkDelete = (selectedIds: string[]) => {
    toast.info(`Deleting ${selectedIds.length} role(s)...`);
    // TODO: Implement bulk delete
    setSelectedRoles(new Set());
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
            onClick={() => router.push(`/admin/roles/${row.id}/edit`)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (window.confirm(`Are you sure you want to delete the role "${row.name}"?`)) {
                toast.info(`Deleting role "${row.name}"...`);
                // TODO: Implement delete
              }
            }}
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
            <h1 className="text-2xl font-bold">Roles & Permissions</h1>
            <p className="text-muted-foreground">
              Manage admin roles and their permissions
            </p>
          </div>
          <Button
            type="button"
            onClick={() => router.push("/admin/roles/create")}
          >
            Create role
          </Button>
        </div>

        <Card>
          <CardContent className="p-6">
            {isLoading ? (
              <TableSkeleton />
            ) : !roles || roles.length === 0 && !search ? (
              <EmptyState
                icon={Shield}
                title="No roles defined"
                description="Admin roles will appear here"
                action={{
                  label: "Create role",
                  onClick: () => router.push("/admin/roles/create"),
                }}
              />
            ) : (
              <DataTable
                data={paginatedRoles}
                columns={columns}
                searchable={true}
                searchPlaceholder="Search roles by name, code, or description..."
                pageSize={pageSize}
                showPagination={true}
                emptyMessage="No roles found"
                serverSide={false}
                total={total}
                currentPage={page}
                onPageChange={setPage}
                externalSearch={search}
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
              />
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
