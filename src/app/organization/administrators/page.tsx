"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Mail,
  MoreHorizontal,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
  UserCog,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field, fieldControlClassName } from "@/components/ui/form/Field";
import { FormErrorSummary } from "@/components/ui/form/FormErrorSummary";
import { Modal } from "@/components/ui/Modal";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { SlideOver } from "@/components/ui/SlideOver";
import { TableSkeleton } from "@/components/ui/Skeleton";
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
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
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
    sort: "created_at|desc",
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

  return (
    <div className="space-y-5">
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

      <section className="overflow-hidden rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)]">
        <div className="flex flex-col gap-3 border-b border-[var(--vms-line)] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">Organization directory</h2>
            <p className="mt-1 text-sm text-[var(--vms-ink-muted)]">
              One identity may hold multiple organization roles.
            </p>
          </div>
          <form
            className="flex w-full gap-2 sm:max-w-md"
            onSubmit={(event) => {
              event.preventDefault();
              setPage(1);
              setSearch(searchInput.trim());
            }}
          >
            <label className="sr-only" htmlFor="administrator-search">
              Search administrators
            </label>
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--vms-ink-muted)]"
                aria-hidden="true"
              />
              <input
                id="administrator-search"
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search name or email"
                className={`${fieldControlClassName} pl-9`}
              />
            </div>
            <Button type="submit" variant="secondary">
              Search
            </Button>
          </form>
        </div>

        {profile.isPending || admins.isPending ? (
          <div className="p-4">
            <TableSkeleton />
          </div>
        ) : profile.isError ? (
          <StateMessage
            title="Administrator access is unavailable"
            detail={parseApiError(profile.error).message}
            action={
              <Button variant="secondary" onClick={() => profile.refetch()}>
                Retry
              </Button>
            }
          />
        ) : admins.isError && !admins.data ? (
          <StateMessage
            title="Administrators could not be loaded"
            detail={parseApiError(admins.error).message}
            action={
              <Button variant="secondary" onClick={() => admins.refetch()}>
                Retry
              </Button>
            }
          />
        ) : !items.length ? (
          <EmptyState
            icon={Users}
            title={search ? "No administrators match" : "No administrators yet"}
            description={
              search
                ? "Clear the search and try again."
                : "Add an organization administrator to delegate tenant administration."
            }
            action={
              search ? (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSearch("");
                    setSearchInput("");
                  }}
                >
                  Clear search
                </Button>
              ) : canCreate ? (
                <Button onClick={openCreate}>Add administrator</Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full border-collapse text-left">
                <caption className="sr-only">
                  Organization administrators
                </caption>
                <thead className="bg-[var(--vms-surface-subtle)]">
                  <tr className="border-b border-[var(--vms-line)] text-[11px] uppercase tracking-[0.1em] text-[var(--vms-ink-muted)]">
                    <th className="px-4 py-3 font-semibold">Administrator</th>
                    <th className="px-4 py-3 font-semibold">Role</th>
                    <th className="px-4 py-3 font-semibold">Access</th>
                    <th className="px-4 py-3 text-right font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((admin) => (
                    <tr
                      key={admin.id}
                      className="border-b border-[var(--vms-line)] last:border-0"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
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
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="neutral">{roleLabel(admin)}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-[var(--vms-ink-muted)]">
                        {isProtected(admin)
                          ? "Protected owner"
                          : `${admin.effective_permissions?.length || admin.role?.permissions_parsed.length || 0} effective grants`}
                      </td>
                      <td className="px-4 py-3">
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
                          ) : (
                            <MoreHorizontal
                              className="h-4 w-4 text-[var(--vms-ink-muted)]"
                              aria-hidden="true"
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-[var(--vms-line)] md:hidden">
              {items.map((admin) => (
                <li key={admin.id} className="p-4">
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
                </li>
              ))}
            </ul>

            <PaginationBar
              page={page}
              pageSize={PAGE_SIZE}
              total={admins.data?.total}
              totalPages={admins.data?.total_pages || 1}
              resourceLabel="administrators"
              onChange={setPage}
              isFetching={admins.isFetching}
              className="rounded-none border-0 border-t border-[var(--vms-line)]"
            />
          </>
        )}
      </section>

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

function StateMessage({
  title,
  detail,
  action,
}: {
  title: string;
  detail: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      role="alert"
      className="m-4 rounded-[var(--vms-radius-surface)] border border-[var(--vms-danger)] bg-[var(--vms-danger-subtle)] p-4 text-sm text-[var(--vms-danger)]"
    >
      <p className="font-semibold">{title}</p>
      <p className="mt-1">{detail}</p>
      {action ? <div className="mt-3">{action}</div> : null}
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
