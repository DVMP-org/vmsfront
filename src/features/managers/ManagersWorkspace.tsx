"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, ShieldCheck, UserCog, Users } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Field, fieldControlClassName } from "@/components/ui/form/Field";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { Modal } from "@/components/ui/Modal";
import { useAdminProfile } from "@/hooks/use-admin";
import { hasAdminPermission } from "@/lib/permissions";
import { parseApiError } from "@/lib/error-utils";
import { useAppStore } from "@/store/app-store";
import { type SiteManager, managersApi, type SiteRole } from "./api";

export function ManagersWorkspace() {
  const selectedSite = useAppStore((state) => state.selectedProperty);
  const queryClient = useQueryClient();
  const profile = useAdminProfile();
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<SiteManager | null>(null);
  const [notice, setNotice] = useState("");
  const siteId = selectedSite?.id;
  const managers = useQuery({
    queryKey: ["site-managers", siteId],
    queryFn: () => managersApi.list(siteId!),
    enabled: !!siteId,
    retry: false,
  });
  const roles = useQuery({
    queryKey: ["site-roles"],
    queryFn: () => managersApi.roles(),
    enabled: !!siteId,
    retry: false,
  });
  const canManage =
    !!profile.data && hasAdminPermission(profile.data, "admins.create");
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (managers.data?.managers ?? []).filter((manager) =>
      [manager.user.name, manager.user.email || ""]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [managers.data?.managers, search]);
  const columns: Column<SiteManager>[] = [
    {
      key: "manager",
      header: "Manager",
      accessor: (manager) => (
        <span>
          <strong className="block">{manager.user.name}</strong>
          <span className="block text-xs text-[var(--vms-ink-muted)]">
            {manager.user.email || "No email"}
          </span>
        </span>
      ),
      sortable: true,
    },
    {
      key: "roles",
      header: "Roles",
      accessor: (manager) => (
        <span className="flex flex-wrap gap-1">
          {manager.roles.length ? (
            manager.roles.map((role) => (
              <Badge key={role.id} variant="neutral">
                {role.name}
              </Badge>
            ))
          ) : (
            <span className="text-xs text-[var(--vms-ink-muted)]">
              No roles
            </span>
          )}
        </span>
      ),
    },
    {
      key: "permissions",
      header: "Authority",
      accessor: (manager) => (
        <span className="text-xs text-[var(--vms-ink-muted)]">
          {manager.effective_permissions.includes("*")
            ? "Full Site authority"
            : `${manager.effective_permissions.length} permissions`}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      mobileHide: true,
      accessor: (manager) =>
        canManage ? (
          <span className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditing(manager)}
            >
              Roles
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                void managersApi
                  .remove(siteId!, manager.assignment_id)
                  .then(async () => {
                    setNotice("Manager access removed.");
                    await queryClient.invalidateQueries({
                      queryKey: ["site-managers", siteId],
                    });
                  });
              }}
            >
              Remove
            </Button>
          </span>
        ) : null,
    },
  ];
  if (!siteId) {
    return (
      <main className="space-y-5 pb-10">
        <EmptySite />
      </main>
    );
  }
  return (
    <main className="mx-auto w-full max-w-[1360px] space-y-5 pb-10 text-[var(--vms-ink)]">
      <header className="flex flex-col gap-4 border-b border-[var(--vms-line)] pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--vms-ink-muted)]">
            <UserCog className="h-4 w-4" aria-hidden="true" />
            {selectedSite?.name} / Site administration
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
            Managers
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--vms-ink-muted)]">
            Site managers administer this Site and its child hierarchy. They are
            separate from Place parties and may also hold a Party relationship
            at any child Place.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/people">
              <Users className="h-4 w-4" aria-hidden="true" />
              View parties
            </Link>
          </Button>
          {canManage ? (
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add manager
            </Button>
          ) : null}
        </div>
      </header>
      {notice ? (
        <InlineAlert tone="success" title="Manager updated">
          {notice}
        </InlineAlert>
      ) : null}
      {managers.isError ? (
        <InlineAlert
          tone="danger"
          title="Managers could not be loaded"
          action={
            <Button
              size="sm"
              variant="outline"
              onClick={() => managers.refetch()}
            >
              Retry
            </Button>
          }
        >
          {parseApiError(managers.error).message}
        </InlineAlert>
      ) : (
        <DataTable
          data={filtered}
          columns={columns}
          tableLabel="Site managers"
          searchable
          initialSearch={search}
          onSearchChange={setSearch}
          isLoading={managers.isPending}
          emptyMessage="No Site managers match this search"
          mobileSummary={(manager) => (
            <span className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--vms-surface-subtle)]">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              </span>
              <span>
                <strong className="block">{manager.user.name}</strong>
                <span className="text-xs text-[var(--vms-ink-muted)]">
                  {manager.user.email || "Site manager"}
                </span>
              </span>
            </span>
          )}
        />
      )}
      <AddManagerModal
        open={addOpen}
        siteId={siteId}
        roles={roles.data?.items ?? []}
        onClose={() => setAddOpen(false)}
        onSaved={async () => {
          setAddOpen(false);
          setNotice("Manager invited and assigned to this Site.");
          await queryClient.invalidateQueries({
            queryKey: ["site-managers", siteId],
          });
        }}
      />
      <ManagerRolesModal
        manager={editing}
        siteId={siteId}
        roles={roles.data?.items ?? []}
        onClose={() => setEditing(null)}
        onSaved={async () => {
          setEditing(null);
          setNotice("Manager roles replaced.");
          await queryClient.invalidateQueries({
            queryKey: ["site-managers", siteId],
          });
        }}
      />
    </main>
  );
}

function EmptySite() {
  return (
    <InlineAlert
      tone="warning"
      title="Select a Site workspace"
      action={
        <Button asChild>
          <Link href="/admin/properties">Open Sites</Link>
        </Button>
      }
    >
      Managers are administered per Site.
    </InlineAlert>
  );
}

function AddManagerModal({
  open,
  siteId,
  roles,
  onClose,
  onSaved,
}: {
  open: boolean;
  siteId: string;
  roles: SiteRole[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const mutation = useMutation({
    mutationFn: () =>
      managersApi.add(siteId, {
        display_name: displayName.trim(),
        email: email.trim(),
      }),
    onSuccess: onSaved,
  });
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!displayName.trim() || !email.trim()) return;
    mutation.mutate();
  }
  return (
    <Modal isOpen={open} onClose={onClose} title="Add Site manager">
      <form onSubmit={submit} className="space-y-4 p-1">
        <Field id="manager-name" label="Full name" required>
          {(control) => (
            <input
              {...control}
              className={fieldControlClassName}
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              autoComplete="name"
              required
            />
          )}
        </Field>
        <Field id="manager-email" label="Email address" required>
          {(control) => (
            <input
              {...control}
              className={fieldControlClassName}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              inputMode="email"
              required
            />
          )}
        </Field>
        <p className="text-xs leading-5 text-[var(--vms-ink-muted)]">
          New managers receive the full Site administration role. Roles can be
          refined after the identity is activated. Available Site roles:{" "}
          {roles.map((role) => role.name).join(", ") || "default Site role"}.
        </p>
        {mutation.isError ? (
          <InlineAlert tone="danger" title="Manager could not be added">
            {parseApiError(mutation.error).message}
          </InlineAlert>
        ) : null}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={
              mutation.isPending || !displayName.trim() || !email.trim()
            }
          >
            {mutation.isPending ? "Adding…" : "Add manager"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function ManagerRolesModal({
  manager,
  siteId,
  roles,
  onClose,
  onSaved,
}: {
  manager: SiteManager | null;
  siteId: string;
  roles: SiteRole[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const currentId = manager?.assignment_id;
  useEffect(() => {
    setSelected(manager?.roles.map((role) => role.id) ?? []);
  }, [manager]);
  const mutation = useMutation({
    mutationFn: () => managersApi.replaceRoles(siteId, currentId!, selected),
    onSuccess: onSaved,
  });
  return (
    <Modal
      isOpen={!!manager}
      onClose={onClose}
      title={`Roles for ${manager?.user.name || "manager"}`}
    >
      <form
        className="space-y-4 p-1"
        onSubmit={(event) => {
          event.preventDefault();
          if (selected.length) mutation.mutate();
        }}
      >
        <div className="space-y-2">
          {roles.map((role) => (
            <label
              key={role.id}
              className="flex min-h-11 cursor-pointer items-start gap-3 rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] p-3"
            >
              <input
                type="checkbox"
                checked={selected.includes(role.id)}
                onChange={(event) =>
                  setSelected((current) =>
                    event.target.checked
                      ? Array.from(new Set([...current, role.id]))
                      : current.filter((id) => id !== role.id),
                  )
                }
              />
              <span>
                <strong className="block text-sm">{role.name}</strong>
                <span className="block text-xs text-[var(--vms-ink-muted)]">
                  {role.description || role.permissions.join(", ")}
                </span>
              </span>
            </label>
          ))}
        </div>
        {mutation.isError ? (
          <InlineAlert tone="danger" title="Roles could not be updated">
            {parseApiError(mutation.error).message}
          </InlineAlert>
        ) : null}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!selected.length || mutation.isPending}
          >
            {mutation.isPending ? "Saving…" : "Replace roles"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
