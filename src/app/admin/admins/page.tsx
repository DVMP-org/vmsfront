"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useAdmins,
  useAdminRoles,
  useCreateAdmin,
  useDeleteAdmin,
  useUpdateAdminRole,
} from "@/hooks/use-admin";
import { useUrlQuerySync } from "@/hooks/use-url-query-sync";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { Modal } from "@/components/ui/Modal";
import { DataTable, Column, BulkAction } from "@/components/ui/DataTable";
import { getFullName, getInitials, formatDate } from "@/lib/utils";
import { formatFiltersForAPI } from "@/lib/table-utils";
import { toast } from "sonner";
import { Shield, Trash2, UserPlus2, ShieldCheck } from "lucide-react";
import { Admin } from "@/types";

interface CreateAdminFormState {
  first_name: string;
  last_name: string;
  email: string;
  role_id: string;
}

const initialFormState: CreateAdminFormState = {
  first_name: "",
  last_name: "",
  email: "",
  role_id: "",
};

const PAGE_SIZE = 20;

export default function AdminManagementPage() {
  const router = useRouter();

  // URL query sync
  const { initializeFromUrl, syncToUrl } = useUrlQuerySync({
    config: {
      page: { defaultValue: 1 },
      pageSize: { defaultValue: PAGE_SIZE },
      search: { defaultValue: "" },
      roleId: { defaultValue: undefined },
      sort: { defaultValue: null },
    },
    skipInitialSync: true,
  });

  // Initialize state from URL
  const [page, setPage] = useState(() => initializeFromUrl("page"));
  const [pageSize, setPageSize] = useState(() => initializeFromUrl("pageSize"));
  const [search, setSearch] = useState(() => initializeFromUrl("search"));
  const [roleId, setRoleId] = useState<string | undefined>(() => initializeFromUrl("roleId"));
  const [sort, setSort] = useState<string | null>(() => initializeFromUrl("sort"));

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateAdminFormState>(initialFormState);
  const [updatingAdminId, setUpdatingAdminId] = useState<string | null>(null);
  const [deletingAdminId, setDeletingAdminId] = useState<string | null>(null);
  const [selectedAdmins, setSelectedAdmins] = useState<Set<string>>(new Set());

  const { data: admins, isLoading: adminsLoading } = useAdmins();
  const { data: roles, isLoading: rolesLoading } = useAdminRoles();
  const createAdmin = useCreateAdmin();
  const updateAdminRole = useUpdateAdminRole();
  const deleteAdmin = useDeleteAdmin();

  // Sync state to URL
  useEffect(() => {
    syncToUrl({ page, pageSize, search, roleId, sort });
  }, [page, pageSize, search, roleId, sort, syncToUrl]);

  // Build filterable fields
  const filterableFields = useMemo(() => {
    const fields: Array<{ field: string; operator?: "eq"; value?: string }> = [];
    if (roleId) {
      fields.push({
        field: "role_id",
        operator: "eq",
        value: roleId
      });
    }
    return fields;
  }, [roleId]);

  // Filter admins client-side (since API doesn't support pagination yet)
  const filteredAdmins = useMemo(() => {
    if (!admins) return [];
    let result = admins;

    // Apply search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((admin) => {
        const name = admin.name?.toLowerCase() || "";
        const firstName = admin.user?.first_name?.toLowerCase() || "";
        const lastName = admin.user?.last_name?.toLowerCase() || "";
        const email = admin.user?.email?.toLowerCase() || "";
        const role = admin.role?.name?.toLowerCase() || "";
        return (
          name.includes(q) ||
          firstName.includes(q) ||
          lastName.includes(q) ||
          email.includes(q) ||
          role.includes(q)
        );
      });
    }

    // Apply role filter
    if (roleId) {
      result = result.filter((admin) => admin.role_id === roleId);
    }

    return result;
  }, [admins, search, roleId]);

  // Pagination
  const paginatedAdmins = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredAdmins.slice(startIndex, endIndex);
  }, [filteredAdmins, page, pageSize]);

  const totalPages = Math.ceil(filteredAdmins.length / pageSize);
  const total = filteredAdmins.length;

  const stats = useMemo(() => {
    if (!admins) {
      return {
        total: 0,
        withCustomPermissions: 0,
        allAccess: 0,
        uniqueRoles: 0,
      };
    }
    const total = admins.length;
    const withCustomPermissions = admins.filter((admin) => admin.permissions && admin.permissions !== "").length;
    const allAccess = admins.filter((admin) => admin.permissions === "*" || admin.role?.code?.toLowerCase() === "super_admin").length;
    const uniqueRoles = new Set(admins.map((admin) => admin.role_id).filter(Boolean)).size;
    return { total, withCustomPermissions, allAccess, uniqueRoles };
  }, [admins]);

  const handleRoleChange = (adminId: string, roleId: string) => {
    if (!roleId) {
      toast.error("Select a role before updating.");
      return;
    }
    setUpdatingAdminId(adminId);
    updateAdminRole.mutate(
      { adminId, roleId },
      {
        onSettled: () => setUpdatingAdminId(null),
      }
    );
  };

  const handleDelete = (adminId: string) => {
    setDeletingAdminId(adminId);
    deleteAdmin.mutate(adminId, {
      onSettled: () => setDeletingAdminId(null),
    });
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createAdmin.mutate(createForm, {
      onSuccess: () => {
        setCreateForm(initialFormState);
        setCreateModalOpen(false);
      },
    });
  };

  // Bulk actions
  const handleBulkDelete = (selectedIds: string[]) => {
    toast.info(`Deleting ${selectedIds.length} admin(s)...`);
    // TODO: Implement bulk delete
    setSelectedAdmins(new Set());
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
  const columns: Column<Admin>[] = [
    {
      key: "name",
      header: "Admin",
      sortable: true,
      accessor: (row) => {
        const name = row.user
          ? getFullName(row.user.first_name, row.user.last_name)
          : row.name;
        const initials = row.user
          ? getInitials(row.user.first_name, row.user.last_name)
          : (row.name || "A").slice(0, 2).toUpperCase();

        return (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted font-semibold text-[var(--brand-primary,#213928)]">
              {initials}
            </div>
            <div>
              <p className="font-medium">{name}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: "email",
      header: "Contact",
      sortable: true,
      accessor: (row) => (
        <div>
          <p className="text-sm">{row.user?.email || "-"}</p>
          {row.user?.phone && (
            <p className="text-xs text-muted-foreground">{row.user.phone}</p>
          )}
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      sortable: true,
      filterable: true,
      filterType: "select",
      filterOptions: roles?.map((role) => ({
        value: role.id,
        label: role.name,
      })) || [],
      accessor: (row) => (
        <select
          value={row.role_id || ""}
          onChange={(e) => handleRoleChange(row.id, e.target.value)}
          disabled={updatingAdminId === row.id}
          className="h-9 rounded-md border border-input bg-background px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        >
          <option value="">No role</option>
          {roles?.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
      ),
    },
    {
      key: "permissions",
      header: "Permissions",
      sortable: false,
      accessor: (row) => {
        const permissionsLabel =
          row.permissions === "*"
            ? "All access"
            : row.permissions
              ? `${row.permissions.split(",").length} override(s)`
              : "Inherit role";

        return (
          <Badge
            variant={
              row.permissions === "*"
                ? "default"
                : row.permissions
                  ? "secondary"
                  : "warning"
            }
          >
            {permissionsLabel}
          </Badge>
        );
      },
    },
    {
      key: "created_at",
      header: "Joined",
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
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(row.id)}
            disabled={deletingAdminId === row.id}
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
            <h1 className="text-3xl font-bold">Admin Management</h1>
            <p className="text-muted-foreground">
              Manage admin users and their roles
            </p>
          </div>
          <Button onClick={() => setCreateModalOpen(true)}>
            <UserPlus2 className="mr-2 h-4 w-4" />
            Quick onboard admin
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Admins</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Custom Permissions
              </CardTitle>
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.withCustomPermissions}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">All Access</CardTitle>
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.allAccess}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unique Roles</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.uniqueRoles}</div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-6">
            {adminsLoading ? (
              <TableSkeleton />
            ) : !filteredAdmins || filteredAdmins.length === 0 && !search && !roleId ? (
              <EmptyState
                icon={Shield}
                title="No admins onboarded yet"
                description="Use the quick onboard button to add your first teammate."
                action={{
                  label: "Quick onboard admin",
                  onClick: () => setCreateModalOpen(true),
                }}
              />
            ) : (
              <DataTable
                data={paginatedAdmins}
                columns={columns}
                searchable={true}
                searchPlaceholder="Search admins by name, email, or role..."
                pageSize={pageSize}
                showPagination={true}
                emptyMessage="No admins found"
                serverSide={false}
                total={total}
                currentPage={page}
                onPageChange={setPage}
                externalSearch={search}
                onSearchChange={(value) => {
                  setPage(1);
                  setSearch(value);
                }}
                filterableFields={filterableFields}
                onSortChange={(newSort) => {
                  setPage(1);
                  setSort(newSort);
                }}
                disableClientSideFiltering={true}
                disableClientSideSorting={false}
                selectable={true}
                selectedRows={selectedAdmins}
                onSelectionChange={setSelectedAdmins}
                bulkActions={bulkActions}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Admin Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Quick Onboard Admin"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <Input
            label="First Name"
            value={createForm.first_name}
            onChange={(e) =>
              setCreateForm({ ...createForm, first_name: e.target.value })
            }
            required
          />
          <Input
            label="Last Name"
            value={createForm.last_name}
            onChange={(e) =>
              setCreateForm({ ...createForm, last_name: e.target.value })
            }
            required
          />
          <Input
            label="Email"
            type="email"
            value={createForm.email}
            onChange={(e) =>
              setCreateForm({ ...createForm, email: e.target.value })
            }
            required
          />
          <div>
            <label className="block text-sm font-medium mb-2">Role</label>
            <select
              value={createForm.role_id}
              onChange={(e) =>
                setCreateForm({ ...createForm, role_id: e.target.value })
              }
              required
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Select a role</option>
              {roles?.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-4 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={createAdmin.isPending}>
              Create Admin
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
