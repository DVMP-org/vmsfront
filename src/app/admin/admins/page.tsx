"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useAdmins,
  useAdminRoles,
  useCreateAdmin,
  useDeleteAdmin,
  useUpdateAdminRole,
} from "@/hooks/use-admin";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { Modal } from "@/components/ui/Modal";
import { getFullName, getInitials, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { Shield, Trash2, UserPlus2, Search, ShieldCheck } from "lucide-react";

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

export default function AdminManagementPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateAdminFormState>(initialFormState);
  const [updatingAdminId, setUpdatingAdminId] = useState<string | null>(null);
  const [deletingAdminId, setDeletingAdminId] = useState<string | null>(null);

  const { data: admins, isLoading: adminsLoading } = useAdmins();
  const { data: roles, isLoading: rolesLoading } = useAdminRoles();
  const createAdmin = useCreateAdmin();
  const updateAdminRole = useUpdateAdminRole();
  const deleteAdmin = useDeleteAdmin();

  const filteredAdmins = useMemo(() => {
    if (!admins) return [];
    if (!searchQuery.trim()) return admins;
    const q = searchQuery.toLowerCase();
    return admins.filter((admin) => {
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
  }, [admins, searchQuery]);

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

  const handleDeleteAdmin = (adminId: string, adminName: string) => {
    const confirmed = window.confirm(`Remove ${adminName} from admin workspace?`);
    if (!confirmed) return;
    setDeletingAdminId(adminId);
    deleteAdmin.mutate(adminId, {
      onSettled: () => setDeletingAdminId(null),
    });
  };

  const handleCreateAdmin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!createForm.first_name.trim() || !createForm.last_name.trim()) {
      toast.error("First and last names are required.");
      return;
    }

    if (!createForm.email.trim()) {
      toast.error("Email address is required.");
      return;
    }

    if (!createForm.role_id) {
      toast.error("Assign a role to the new admin.");
      return;
    }

    createAdmin.mutate(
      {
        first_name: createForm.first_name.trim(),
        last_name: createForm.last_name.trim(),
        email: createForm.email.trim(),
        role_id: createForm.role_id,
      },
      {
        onSuccess: () => {
          setCreateForm(initialFormState);
          setCreateModalOpen(false);
        },
      }
    );
  };

  const renderTable = () => {
    if (adminsLoading) {
      return <TableSkeleton />;
    }

    if (!filteredAdmins || filteredAdmins.length === 0) {
      return (
        <EmptyState
          icon={Shield}
          title="No admins onboarded yet"
          description="Use the quick onboard button to add your first teammate."
          action={{
            label: "Quick onboard admin",
            onClick: () => setCreateModalOpen(true),
          }}
        />
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Admin</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Permissions</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredAdmins.map((admin) => {
            const name = admin.user
              ? getFullName(admin.user.first_name, admin.user.last_name)
              : admin.name;
            const initials = admin.user
              ? getInitials(admin.user.first_name, admin.user.last_name)
              : (admin.name || "A").slice(0, 2).toUpperCase();

            const permissionsLabel =
              admin.permissions === "*"
                ? "All access"
                : admin.permissions
                ? `${admin.permissions.split(",").length} override(s)`
                : "Inherit role";

            return (
              <TableRow key={admin.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted font-semibold text-[var(--brand-primary,#213928)]">
                      {initials}
                    </div>
                    <div>
                      <p className="font-medium leading-tight">{name}</p>
                      <p className="text-xs text-muted-foreground">#{admin.id.slice(0, 8)}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-0.5">
                    <p className="text-sm">{admin.user?.email}</p>
                    {admin.user?.phone && (
                      <p className="text-xs text-muted-foreground">{admin.user.phone}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {rolesLoading ? (
                    <span className="text-xs text-muted-foreground">Loading roles...</span>
                  ) : roles && roles.length > 0 ? (
                    <select
                      className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={admin.role_id || ""}
                      onChange={(event) => handleRoleChange(admin.id, event.target.value)}
                      disabled={updatingAdminId === admin.id}
                    >
                      <option value="">Assign role</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Badge variant="secondary">No roles</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={admin.permissions ? "default" : "secondary"}
                    className="capitalize"
                  >
                    {permissionsLabel}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(admin.created_at)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteAdmin(admin.id, name)}
                      isLoading={deletingAdminId === admin.id && deleteAdmin.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  };

  return (
    <DashboardLayout type="admin">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              Security team workspace
            </p>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-[var(--brand-primary,#213928)]" />
              Admin Management
            </h1>
            <p className="text-muted-foreground text-sm">
              Invite, reassign, or remove operations teammates from the control tower.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => router.push("/admin/roles")}
            >
              Manage roles
            </Button>
            <Button
              className="gap-2 bg-[var(--brand-primary,#213928)] text-white hover:bg-[var(--brand-primary,#213928)] hover:opacity-90"
              onClick={() => setCreateModalOpen(true)}
            >
              <UserPlus2 className="h-4 w-4" />
              Quick onboard
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="grid gap-4 md:grid-cols-4">
            {[
              { label: "Total admins", value: stats.total },
              { label: "Roles represented", value: stats.uniqueRoles },
              { label: "Custom overrides", value: stats.withCustomPermissions },
              { label: "All-access", value: stats.allAccess },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</p>
                <p className="text-2xl font-semibold mt-1">{item.value}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Admin directory</CardTitle>
            <div className="flex w-full max-w-xs items-center gap-2">
              <div className="relative w-full">
                <Input
                  placeholder="Search by name, email, or role"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="pl-10"
                />
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
          </CardHeader>
          <CardContent>{renderTable()}</CardContent>
        </Card>
      </div>

      <Modal
        isOpen={createModalOpen}
        onClose={() => {
          if (!createAdmin.isPending) {
            setCreateModalOpen(false);
            setCreateForm(initialFormState);
          }
        }}
        title="Quick onboard admin"
      >
        <form className="space-y-4" onSubmit={handleCreateAdmin}>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="First name"
              placeholder="Ada"
              value={createForm.first_name}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, first_name: event.target.value }))}
              required
            />
            <Input
              label="Last name"
              placeholder="Obi"
              value={createForm.last_name}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, last_name: event.target.value }))}
              required
            />
          </div>
          <Input
            label="Work email"
            type="email"
            placeholder="ada@estate.com"
            value={createForm.email}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, email: event.target.value }))}
            required
          />
          <div>
            <label className="block text-sm font-medium mb-2">Role</label>
            {rolesLoading ? (
              <p className="text-sm text-muted-foreground">Loading roles...</p>
            ) : roles && roles.length > 0 ? (
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={createForm.role_id}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, role_id: event.target.value }))}
                required
              >
                <option value="">Select a role</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-muted-foreground">
                You need at least one role before onboarding admins.
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" isLoading={createAdmin.isPending}>
              Invite admin
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push("/admin/admins/create")}
            >
              Open advanced onboarding
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
