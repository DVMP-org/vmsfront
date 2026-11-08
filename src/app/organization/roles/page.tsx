"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  FlaskConical,
  Plus,
  ShieldCheck,
} from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { useAdminRoles } from "@/hooks/use-admin";
import { parseApiError } from "@/lib/error-utils";
import { OrganizationAdminHeader } from "@/features/organization-admin/OrganizationAdminHeader";
import type { AdminRole } from "@/types";

export default function OrganizationRolesPage() {
  const pathname = usePathname();
  const embedded = pathname?.startsWith("/organization/settings/roles") === true;
  const [search, setSearch] = useState("");
  const roles = useAdminRoles({
    page: 1,
    pageSize: 100,
    search: search || undefined,
    sort: "name|asc",
  });
  const items = useMemo(() => roles.data?.items ?? [], [roles.data?.items]);
  const basePath = embedded
    ? "/organization/settings/roles"
    : "/organization/roles";
  const columns = useMemo<Column<AdminRole>[]>(
    () => [
      {
        key: "name",
        header: "Role",
        sortable: true,
        accessor: (role) => (
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-[var(--vms-surface-subtle)] text-[var(--vms-ink-muted)]">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold">{role.name}</p>
              <p className="mt-0.5 line-clamp-2 text-xs text-[var(--vms-ink-muted)]">
                {role.description || "No description"}
              </p>
            </div>
          </div>
        ),
      },
      {
        key: "code",
        header: "Code",
        sortable: true,
        accessor: (role) => <Badge variant="neutral">{role.code}</Badge>,
      },
      {
        key: "permissions_parsed",
        header: "Permissions",
        sortable: true,
        accessor: (role) => (
          <span className="text-sm tabular-nums">
            {role.permissions_parsed.length} grant
            {role.permissions_parsed.length === 1 ? "" : "s"}
          </span>
        ),
      },
      {
        key: "scope",
        header: "Scope",
        accessor: (role) => (
          <span className="text-sm text-[var(--vms-ink-muted)]">
            {role.permissions_parsed.includes("*")
              ? "Full tenant access"
              : "Defined grants"}
          </span>
        ),
      },
      {
        key: "actions",
        header: "Action",
        mobileHide: true,
        accessor: (role) => (
          <Link
            href={`${basePath}/create?role=${encodeURIComponent(role.id)}`}
            className="inline-flex min-h-9 items-center justify-end gap-1.5 whitespace-nowrap text-sm font-semibold text-[var(--vms-action)] hover:underline"
          >
            Inspect draft
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        ),
      },
    ],
    [basePath],
  );

  return (
    <div className="space-y-5">
      {!embedded ? (
        <OrganizationAdminHeader
          eyebrow="Organization administration"
          title="Roles & permissions"
          description="Review the roles that govern organization administration. Role authoring is a visual prototype in this release and does not persist changes."
          actions={
            <Button asChild>
              <Link href={`${basePath}/create`}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Create draft role
              </Link>
            </Button>
          }
        />
      ) : null}

      <div className="flex gap-3 rounded-[var(--vms-radius-surface)] border border-[var(--vms-info)] bg-[color-mix(in_srgb,var(--vms-info)_9%,white)] p-4 text-sm text-[var(--vms-info)]">
        <FlaskConical
          className="mt-0.5 h-4 w-4 shrink-0"
          aria-hidden="true"
        />
        <div>
          <p className="font-semibold">Authoring prototype</p>
          <p className="mt-1 leading-5">
            You can explore role and permission composition, but drafts are not
            saved and existing roles are not changed.
          </p>
        </div>
      </div>

      <DataTable
        data={items}
        columns={columns}
        tableLabel="Organization roles"
        searchPlaceholder="Search roles"
        initialSearch={search}
        onSearchChange={setSearch}
        isLoading={roles.isPending}
        errorMessage={
          roles.isError ? parseApiError(roles.error).message : undefined
        }
        onRetry={() => roles.refetch()}
        emptyMessage={
          search ? "No roles match these filters" : "No organization roles yet"
        }
        showPagination={false}
      />
    </div>
  );
}
