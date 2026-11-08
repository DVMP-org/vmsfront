"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Download,
  Mail,
  MoreHorizontal,
  Plus,
  ShieldAlert,
  Trash2,
  UserCog,
} from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column, type BulkAction } from "@/components/ui/DataTable";
import { Field, fieldControlClassName } from "@/components/ui/form/Field";
import { FormErrorSummary } from "@/components/ui/form/FormErrorSummary";
import { Modal } from "@/components/ui/Modal";
import { SlideOver } from "@/components/ui/SlideOver";
import {
  useAdminRoles,
  useAdmins,
  useCreateAdmin,
  useDeleteAdmin,
  useUpdateAdminRole,
} from "@/hooks/use-admin";
import { parseApiError } from "@/lib/error-utils";
import { hasAdminPermission } from "@/lib/permissions";
import { adminService } from "@/services/admin-service";
import type { Admin, AdminRole, CreateAdminRequest } from "@/types";
import { OrganizationAdminHeader } from "@/features/organization-admin/OrganizationAdminHeader";

const PAGE_SIZE = 10;

type CreateDraft = CreateAdminRequest & {
  confirmEmail: string;
};

const emptyDraft: CreateDraft = {
  first_name: "",
  last_name: "",
  email: "",
  confirmEmail: "",
  role_id: "",
};

function displayName(admin: Admin) {
  const name = [admin.user?.first_name, admin.user?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  return name || admin.name || admin.user?.email || "Administrator";
}

function initials(admin: Admin) {
  return displayName(admin)
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function roleLabel(admin: Admin) {
  return (
    admin.roles?.map((role) => role.name).join(", ") ||
    admin.role?.name ||
    "No role"
  );
}

function isProtected(admin: Admin) {
  return [admin.role, ...(admin.roles || [])].some(
    (role) => role?.code === "super_admin",
  );
}

export default function OrganizationAdministratorsPage() {
  const pathname = usePathname();
  const embedded =
    pathname?.startsWith("/organization/settings/administrators") === true;
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("created_at|desc");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [deletingAdmin, setDeletingAdmin] = useState<Admin | null>(null);
  const [draft, setDraft] = useState<CreateDraft>(emptyDraft);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");

  const profile = useQuery({
    queryKey: ["organization-admin-profile"],
    queryFn: async () => (await adminService.getAdminProfile()).data,
  });
  const admins = useAdmins({
    page,
    pageSize: PAGE_SIZE,
    search: search || undefined,
    sort,
  });
  const roles = useAdminRoles({ page: 1, pageSize: 100 });
  const createAdmin = useCreateAdmin();
  const updateRole = useUpdateAdminRole();
  const deleteAdmin = useDeleteAdmin();

  const items = useMemo(() => admins.data?.items ?? [], [admins.data?.items]);
  const roleItems = roles.data?.items ?? [];
  const canCreate = hasAdminPermission(profile.data, "admins.create");
  const canUpdate = hasAdminPermission(profile.data, "admins.update");
  const canDelete = hasAdminPermission(profile.data, "admins.delete");
  const readOnly = !canCreate && !canUpdate && !canDelete;

  function openCreate() {
    setDraft(emptyDraft);
    setErrors({});
    createAdmin.reset();
    setCreateOpen(true);
  }

  function validateCreate() {
    const next: Record<string, string> = {};
    if (!draft.first_name.trim()) {
      next.admin_first_name = "Enter the administrator's first name.";
    }
    if (!draft.last_name.trim()) {
      next.admin_last_name = "Enter the administrator's last name.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) {
      next.admin_email = "Enter a valid work email address.";
    }
    if (
      draft.email.trim().toLowerCase() !==
      draft.confirmEmail.trim().toLowerCase()
    ) {
      next.admin_confirm_email = "The email addresses do not match.";
    }
    if (!draft.role_id) next.admin_role = "Choose an organization role.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function submitCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!validateCreate()) return;
    const { confirmEmail: _confirmEmail, ...payload } = draft;
    createAdmin.mutate(
      {
        ...payload,
        first_name: payload.first_name.trim(),
        last_name: payload.last_name.trim(),
        email: payload.email.trim(),
      },
      {
        onSuccess: (result) => {
          setNotice(
            `${displayName(result.data)} was added as an organization administrator.`,
          );
          setCreateOpen(false);
          setDraft(emptyDraft);
          setErrors({});
        },
      },
    );
  }

  function exportSelected(ids: string[]) {
    const selectedItems = items.filter((item) => ids.includes(item.id));
    const rows = [
      ["Name", "Email", "Role"],
      ...selectedItems.map((item) => [
        displayName(item),
        item.user?.email || "",
        roleLabel(item),
      ]),
    ];
    const csv = rows
      .map((row) =>
        row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","),
      )
      .join("\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "organization-administrators.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function removeSelected(ids: string[]) {
    const removable = items.filter(
      (item) => ids.includes(item.id) && !isProtected(item),
    );
    if (!removable.length) {
      setNotice("Protected owners must be changed by another owner.");
      return;
    }
    const results = await Promise.allSettled(
      removable.map((item) => deleteAdmin.mutateAsync(item.id)),
    );
    const removed = results.filter((result) => result.status === "fulfilled")
      .length;
    await admins.refetch();
    setNotice(
      `${removed} administrator${removed === 1 ? "" : "s"} removed${
        removable.length > removed ? "; protected or failed records remain" : "."
      }`,
    );
  }

  const columns = useMemo<Column<Admin>[]>(
    () => [
      {
        key: "name",
        header: "Administrator",
        sortable: true,
        accessor: (admin) => (
          <div className="flex min-w-0 items-center gap-3">
            <Avatar admin={admin} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {displayName(admin)}
              </p>
              <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-[var(--vms-ink-muted)]">
                <Mail className="h-3 w-3" aria-hidden="true" />
                {admin.user?.email || "No email"}
              </p>
            </div>
          </div>
        ),
      },
      {
        key: "role",
        header: "Role",
        accessor: (admin) => <Badge variant="neutral">{roleLabel(admin)}</Badge>,
      },
      {
        key: "access",
        header: "Access",
        accessor: (admin) => (
          <span className="text-sm text-[var(--vms-ink-muted)]">
            {isProtected(admin)
              ? "Protected owner"
              : `${admin.effective_permissions?.length || admin.role?.permissions_parsed.length || 0} effective grants`}
          </span>
        ),
      },
      {
        key: "actions",
        header: "Actions",
        mobileHide: true,
        accessor: (admin) => (
          <div className="flex justify-end gap-1">
            {canUpdate && !isProtected(admin) ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingAdmin(admin)}
              >
                Change role
              </Button>
            ) : null}
            {canDelete && !isProtected(admin) ? (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Remove ${displayName(admin)}`}
                onClick={() => setDeletingAdmin(admin)}
              >
                <Trash2
                  className="h-4 w-4 text-[var(--vms-danger)]"
                  aria-hidden="true"
                />
              </Button>
            ) : isProtected(admin) ? (
              <MoreHorizontal
                className="h-4 w-4 text-[var(--vms-ink-muted)]"
                aria-label="Protected owner"
              />
            ) : null}
          </div>
        ),
      },
    ],
    [canDelete, canUpdate],
  );

  const bulkActions: BulkAction[] = [
    {
      label: "Export selected",
      icon: Download,
      onClick: exportSelected,
    },
    ...(canDelete
      ? [
          {
            label: "Remove selected",
            icon: Trash2,
            variant: "destructive" as const,
            requiresConfirmation: true,
            confirmationMessage:
              "Remove the selected organization administrators? Protected owners will be skipped.",
            onClick: removeSelected,
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-5">
      {!embedded ? (
        <OrganizationAdminHeader
          eyebrow="Organization administration"
          title="Administrators"
          description="Manage organization-level access. Site administration and occupancy relationships remain separate in Places and People."
          actions={
            canCreate ? (
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add administrator
              </Button>
            ) : undefined
          }
        />
      ) : null}

      {notice ? (
        <div
          role="status"
          className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-success)] bg-[var(--vms-success-subtle)] px-4 py-3 text-sm text-[var(--vms-success)]"
        >
          {notice}
        </div>
      ) : null}

      {readOnly && profile.isSuccess ? (
        <div className="flex gap-3 rounded-[var(--vms-radius-surface)] border border-[var(--vms-warning)] bg-[var(--vms-warning-subtle)] p-4 text-sm text-[var(--vms-warning)]">
          <ShieldAlert
            className="mt-0.5 h-4 w-4 shrink-0"
            aria-hidden="true"
          />
          <p>
            You can review administrators, but your role does not allow
            changes.
          </p>
        </div>
      ) : null}

      <DataTable
        data={items}
        columns={columns}
        tableLabel="Organization administrators"
        searchPlaceholder="Search name or email"
        initialSearch={search}
        initialSort="created_at:desc"
        onSearchChange={(value) => {
          setSearch(value.trim());
          setPage(1);
        }}
        onSortChange={(value) =>
          setSort(value ? value.replace(":", "|") : "created_at|desc")
        }
        serverSide
        total={admins.data?.total ?? 0}
        currentPage={page}
        onPageChange={setPage}
        pageSize={PAGE_SIZE}
        pageSizeOptions={[PAGE_SIZE]}
        isLoading={profile.isPending || admins.isPending}
        errorMessage={
          profile.isError
            ? parseApiError(profile.error).message
            : admins.isError && !admins.data
              ? parseApiError(admins.error).message
              : undefined
        }
        isStale={admins.isError && !!admins.data}
        onRetry={() => {
          if (profile.isError) void profile.refetch();
          if (admins.isError) void admins.refetch();
        }}
        emptyMessage={
          search
            ? "No administrators match this search"
            : "No administrators yet"
        }
        selectable
        getRowId={(admin) => admin.id}
        bulkActions={bulkActions}
        mobileSummary={(admin) => (
          <div className="flex items-start gap-3">
            <Avatar admin={admin} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {displayName(admin)}
              </p>
              <p className="mt-0.5 truncate text-xs text-[var(--vms-ink-muted)]">
                {admin.user?.email}
              </p>
              <div className="mt-3 grid gap-2">
                <Detail label="Role" value={roleLabel(admin)} />
                <Detail
                  label="Access"
                  value={
                    isProtected(admin)
                      ? "Protected owner"
                      : "Organization administration"
                  }
                />
              </div>
              {canUpdate || canDelete ? (
                <div className="mt-3 flex gap-2">
                  {canUpdate && !isProtected(admin) ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setEditingAdmin(admin)}
                    >
                      Change role
                    </Button>
                  ) : null}
                  {canDelete && !isProtected(admin) ? (
                    <Button
                      size="sm"
                      variant="destructive-outlined"
                      onClick={() => setDeletingAdmin(admin)}
                    >
                      Remove
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        )}
      />

      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Add organization administrator"
        description="This grants tenant administration. It does not grant a property workspace or occupancy relationship."
        size="lg"
      >
        <form className="space-y-5" onSubmit={submitCreate} noValidate>
          <FormErrorSummary errors={errors} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="admin_first_name"
              label="First name"
              required
              error={errors.admin_first_name}
            >
              {(control) => (
                <input
                  {...control}
                  autoComplete="given-name"
                  value={draft.first_name}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      first_name: event.target.value,
                    }))
                  }
                  className={fieldControlClassName}
                />
              )}
            </Field>
            <Field
              id="admin_last_name"
              label="Last name"
              required
              error={errors.admin_last_name}
            >
              {(control) => (
                <input
                  {...control}
                  autoComplete="family-name"
                  value={draft.last_name}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      last_name: event.target.value,
                    }))
                  }
                  className={fieldControlClassName}
                />
              )}
            </Field>
          </div>
          <Field
            id="admin_email"
            label="Work email"
            required
            description="An onboarding email is queued when this identity is new."
            error={errors.admin_email}
          >
            {(control) => (
              <input
                {...control}
                type="email"
                inputMode="email"
                autoComplete="email"
                value={draft.email}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                className={fieldControlClassName}
              />
            )}
          </Field>
          <Field
            id="admin_confirm_email"
            label="Confirm email"
            required
            error={errors.admin_confirm_email}
          >
            {(control) => (
              <input
                {...control}
                type="email"
                inputMode="email"
                autoComplete="email"
                value={draft.confirmEmail}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    confirmEmail: event.target.value,
                  }))
                }
                className={fieldControlClassName}
              />
            )}
          </Field>
          <Field
            id="admin_role"
            label="Role"
            required
            error={errors.admin_role}
          >
            {(control) => (
              <select
                {...control}
                value={draft.role_id}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    role_id: event.target.value,
                  }))
                }
                className={fieldControlClassName}
              >
                <option value="">Select a role</option>
                {roleItems.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            )}
          </Field>
          {roles.isError ? (
            <p className="text-sm text-[var(--vms-danger)]">
              Roles could not be loaded. Retry before adding an administrator.
            </p>
          ) : null}
          {createAdmin.isError ? (
            <p
              role="alert"
              className="rounded-[var(--vms-radius-control)] bg-[var(--vms-danger-subtle)] p-3 text-sm text-[var(--vms-danger)]"
            >
              {parseApiError(createAdmin.error).message}
            </p>
          ) : null}
          <div className="flex flex-col-reverse gap-2 border-t border-[var(--vms-line)] pt-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={createAdmin.isPending}
              loadingLabel="Adding administrator"
            >
              Add administrator
            </Button>
          </div>
        </form>
      </Modal>

      <SlideOver
        isOpen={!!editingAdmin}
        onClose={() => setEditingAdmin(null)}
        title="Change administrator role"
        description={editingAdmin ? displayName(editingAdmin) : undefined}
        size="sm"
      >
        {editingAdmin ? (
          <RoleAssignmentForm
            admin={editingAdmin}
            roles={roleItems}
            busy={updateRole.isPending}
            error={updateRole.error}
            onCancel={() => setEditingAdmin(null)}
            onSubmit={(roleId) => {
              updateRole.mutate(
                { adminId: editingAdmin.id, roleId },
                {
                  onSuccess: () => {
                    setNotice(
                      `The role for ${displayName(editingAdmin)} was updated.`,
                    );
                    setEditingAdmin(null);
                  },
                },
              );
            }}
          />
        ) : null}
      </SlideOver>

      <Modal
        isOpen={!!deletingAdmin}
        onClose={() => setDeletingAdmin(null)}
        title="Remove organization administrator?"
        description={
          deletingAdmin
            ? `${displayName(deletingAdmin)} will lose organization administration access. Property workspaces and occupancy relationships are not removed automatically.`
            : undefined
        }
        size="sm"
      >
        {deleteAdmin.isError ? (
          <p
            role="alert"
            className="mb-4 text-sm text-[var(--vms-danger)]"
          >
            {parseApiError(deleteAdmin.error).message}
          </p>
        ) : null}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="secondary"
            onClick={() => setDeletingAdmin(null)}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            isLoading={deleteAdmin.isPending}
            loadingLabel="Removing"
            onClick={() => {
              if (!deletingAdmin) return;
              deleteAdmin.mutate(deletingAdmin.id, {
                onSuccess: () => {
                  setNotice(
                    `${displayName(deletingAdmin)} was removed from organization administration.`,
                  );
                  setDeletingAdmin(null);
                },
              });
            }}
          >
            Remove administrator
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function Avatar({ admin }: { admin: Admin }) {
  return (
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] text-xs font-semibold text-[var(--vms-ink)]">
      {initials(admin) || <UserCog className="h-4 w-4" aria-hidden="true" />}
    </span>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[5rem_minmax(0,1fr)] gap-2 text-sm">
      <span className="text-[var(--vms-ink-muted)]">{label}</span>
      <span className="truncate font-medium">{value}</span>
    </div>
  );
}

function RoleAssignmentForm({
  admin,
  roles,
  busy,
  error,
  onCancel,
  onSubmit,
}: {
  admin: Admin;
  roles: AdminRole[];
  busy: boolean;
  error: unknown;
  onCancel: () => void;
  onSubmit: (roleId: string) => void;
}) {
  const [roleId, setRoleId] = useState(
    admin.role_id || admin.roles?.[0]?.id || "",
  );
  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (roleId) onSubmit(roleId);
      }}
    >
      <Field id="edit_admin_role" label="Organization role" required>
        {(control) => (
          <select
            {...control}
            value={roleId}
            onChange={(event) => setRoleId(event.target.value)}
            className={fieldControlClassName}
          >
            <option value="">Select a role</option>
            {roles
              .filter((role) => role.code !== "super_admin")
              .map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
          </select>
        )}
      </Field>
      {error ? (
        <p role="alert" className="text-sm text-[var(--vms-danger)]">
          {parseApiError(error).message}
        </p>
      ) : null}
      <div className="flex flex-col-reverse gap-2 border-t border-[var(--vms-line)] pt-4 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!roleId}
          isLoading={busy}
          loadingLabel="Updating"
        >
          Update role
        </Button>
      </div>
    </form>
  );
}
