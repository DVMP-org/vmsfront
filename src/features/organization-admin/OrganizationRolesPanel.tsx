"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { PermissionSelector } from "@/components/admin/PermissionSelector";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Field, fieldControlClassName } from "@/components/ui/form/Field";
import { Modal } from "@/components/ui/Modal";
import { SlideOver } from "@/components/ui/SlideOver";
import {
  useAdminDeleteRole,
  useAdminPermissions,
  useAdminRoles,
  useCreateRole,
  useUpdateRole,
} from "@/hooks/use-admin";
import { parseApiError } from "@/lib/error-utils";
import type { AdminRole } from "@/types";

const PAGE_SIZE = 10;

type RoleDraft = {
  name: string;
  code: string;
  description: string;
  permissions: string[];
};

function draftFor(role: AdminRole | null): RoleDraft {
  return {
    name: role?.name ?? "",
    code: role?.code ?? "",
    description: role?.description ?? "",
    permissions: role?.permissions_parsed ?? [],
  };
}

export function OrganizationRolesPanel({
  canCreate,
  canUpdate,
  canDelete,
}: {
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<AdminRole | null | "new">(null);
  const [deleting, setDeleting] = useState<AdminRole | null>(null);
  const [draft, setDraft] = useState<RoleDraft>(() => draftFor(null));
  const [validation, setValidation] = useState("");
  const [notice, setNotice] = useState("");
  const roles = useAdminRoles({
    page,
    pageSize: PAGE_SIZE,
    search: search || undefined,
  });
  const permissions = useAdminPermissions();
  const create = useCreateRole();
  const update = useUpdateRole();
  const remove = useAdminDeleteRole();

  function openEditor(role: AdminRole | null) {
    setDraft(draftFor(role));
    setValidation("");
    create.reset();
    update.reset();
    setEditing(role ?? "new");
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const name = draft.name.trim();
    const code = draft.code.trim().toLowerCase().replace(/\s+/g, "_");
    if (!name || !code || !/^[a-z][a-z0-9_]*$/.test(code)) {
      setValidation(
        "Enter a name and a code using lowercase letters, numbers, and underscores.",
      );
      return;
    }
    if (!draft.permissions.length) {
      setValidation("Select at least one permission.");
      return;
    }
    setValidation("");
    const payload = {
      name,
      code,
      description: draft.description.trim(),
      permissions: draft.permissions,
    };
    if (editing === "new") {
      create.mutate(payload, {
        onSuccess: () => {
          setNotice(`${name} role created.`);
          setEditing(null);
        },
      });
    } else if (editing) {
      update.mutate(
        { roleId: editing.id, data: payload },
        {
          onSuccess: () => {
            setNotice(`${name} role updated.`);
            setEditing(null);
          },
        },
      );
    }
  }

  const columns: Column<AdminRole>[] = [
    {
      key: "name",
      header: "Role",
      accessor: (role) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{role.name}</p>
          {role.description ? (
            <p className="mt-0.5 truncate text-xs text-[var(--vms-ink-muted)]">
              {role.description}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      key: "code",
      header: "Code",
      accessor: (role) => <Badge variant="neutral">{role.code}</Badge>,
    },
    {
      key: "permissions",
      header: "Access",
      accessor: (role) => (
        <span className="text-sm text-[var(--vms-ink-muted)]">
          {role.permissions_parsed.includes("*")
            ? "Full access"
            : `${role.permissions_parsed.length} permissions`}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      accessor: (role) =>
        role.code === "super_admin" ? (
          <span className="text-xs text-[var(--vms-ink-muted)]">
            Protected owner role
          </span>
        ) : (
          <div className="flex justify-end gap-1">
            {canUpdate ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => openEditor(role)}
              >
                Edit
              </Button>
            ) : null}
            {canDelete ? (
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label={`Delete ${role.name}`}
                onClick={() => setDeleting(role)}
              >
                <Trash2 className="h-4 w-4 text-[var(--vms-danger)]" />
              </Button>
            ) : null}
          </div>
        ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Organization roles</h2>
          <p className="text-sm text-[var(--vms-ink-muted)]">
            Define the permissions available to organization administrators.
          </p>
        </div>
        {canCreate ? (
          <Button onClick={() => openEditor(null)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Create role
          </Button>
        ) : null}
      </div>
      {notice ? (
        <p
          role="status"
          className="rounded-[var(--vms-radius-control)] bg-[var(--vms-success-subtle)] px-4 py-3 text-sm text-[var(--vms-success)]"
        >
          {notice}
        </p>
      ) : null}
      <DataTable
        data={roles.data?.items ?? []}
        columns={columns}
        tableLabel="Organization roles"
        searchPlaceholder="Search roles"
        initialSearch={search}
        onSearchChange={(value) => {
          setSearch(value.trim());
          setPage(1);
        }}
        serverSide
        total={roles.data?.total ?? 0}
        currentPage={page}
        onPageChange={setPage}
        pageSize={PAGE_SIZE}
        pageSizeOptions={[PAGE_SIZE]}
        isLoading={roles.isPending}
        errorMessage={
          roles.isError && !roles.data
            ? parseApiError(roles.error).message
            : undefined
        }
        isStale={roles.isError && !!roles.data}
        onRetry={() => void roles.refetch()}
        emptyMessage={
          search ? "No roles match this search" : "No organization roles yet"
        }
        mobileSummary={(role) => (
          <div className="space-y-2">
            <p className="font-semibold">{role.name}</p>
            <p className="text-sm text-[var(--vms-ink-muted)]">
              {role.code} · {role.permissions_parsed.length} permissions
            </p>
            {role.code !== "super_admin" && canUpdate ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => openEditor(role)}
              >
                Edit role
              </Button>
            ) : null}
          </div>
        )}
      />
      <SlideOver
        isOpen={editing !== null}
        onClose={() => setEditing(null)}
        title={
          editing === "new"
            ? "Create organization role"
            : "Edit organization role"
        }
        description="Role permissions apply only to organization administration."
        size="lg"
      >
        <form className="space-y-5" onSubmit={submit}>
          <Field id="org_role_name" label="Role name" required>
            {(control) => (
              <input
                {...control}
                className={fieldControlClassName}
                value={draft.name}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
              />
            )}
          </Field>
          <Field
            id="org_role_code"
            label="Role code"
            required
            description="Lowercase letters, numbers, and underscores."
          >
            {(control) => (
              <input
                {...control}
                className={fieldControlClassName}
                value={draft.code}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    code: event.target.value,
                  }))
                }
              />
            )}
          </Field>
          <Field id="org_role_description" label="Description">
            {(control) => (
              <textarea
                {...control}
                className={`${fieldControlClassName} min-h-20`}
                value={draft.description}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
              />
            )}
          </Field>
          <div className="space-y-2">
            <p className="text-sm font-medium">Permissions</p>
            <Checkbox
              label="Grant all organization permissions"
              checked={draft.permissions.includes("*")}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  permissions: event.target.checked ? ["*"] : [],
                }))
              }
            />
            {!draft.permissions.includes("*") ? (
              permissions.isPending ? (
                <p className="text-sm text-[var(--vms-ink-muted)]">
                  Loading permissions…
                </p>
              ) : permissions.isError ? (
                <div role="alert" className="text-sm text-[var(--vms-danger)]">
                  Permissions could not be loaded.{" "}
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => void permissions.refetch()}
                  >
                    Retry
                  </Button>
                </div>
              ) : permissions.data ? (
                <PermissionSelector
                  permissions={permissions.data}
                  value={draft.permissions}
                  onChange={(value) =>
                    setDraft((current) => ({ ...current, permissions: value }))
                  }
                />
              ) : null
            ) : null}
          </div>
          {validation || create.isError || update.isError ? (
            <p role="alert" className="text-sm text-[var(--vms-danger)]">
              {validation ||
                parseApiError(create.error || update.error).message}
            </p>
          ) : null}
          <div className="flex justify-end gap-2 border-t border-[var(--vms-line)] pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditing(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={create.isPending || update.isPending}
              disabled={!draft.permissions.includes("*") && !permissions.data}
            >
              {editing === "new" ? "Create role" : "Save role"}
            </Button>
          </div>
        </form>
      </SlideOver>
      <Modal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete organization role?"
        description={
          deleting
            ? `Delete ${deleting.name}? Administrators assigned this role may lose access.`
            : undefined
        }
        size="sm"
      >
        {remove.isError ? (
          <p role="alert" className="mb-4 text-sm text-[var(--vms-danger)]">
            {parseApiError(remove.error).message}
          </p>
        ) : null}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleting(null)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            isLoading={remove.isPending}
            onClick={() => {
              if (deleting)
                remove.mutate(deleting.id, {
                  onSuccess: () => {
                    setNotice(`${deleting.name} role deleted.`);
                    setDeleting(null);
                  },
                });
            }}
          >
            Delete role
          </Button>
        </div>
      </Modal>
    </div>
  );
}
