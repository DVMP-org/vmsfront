"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  FlaskConical,
  Plus,
  Search,
  ShieldCheck,
} from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { fieldControlClassName } from "@/components/ui/form/Field";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useAdminRoles } from "@/hooks/use-admin";
import { parseApiError } from "@/lib/error-utils";
import { OrganizationAdminHeader } from "@/features/organization-admin/OrganizationAdminHeader";

export default function OrganizationRolesPage() {
  const pathname = usePathname();
  const embedded = pathname?.startsWith("/organization/settings/roles") === true;
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const roles = useAdminRoles({
    page: 1,
    pageSize: 100,
    search: search || undefined,
    sort: "name|asc",
  });
  const items = useMemo(() => roles.data?.items ?? [], [roles.data?.items]);

  return (
    <div className="space-y-5">
      {!embedded ? (
        <OrganizationAdminHeader
          eyebrow="Organization administration"
          title="Roles & permissions"
          description="Review the roles that govern organization administration. Role authoring is a visual prototype in this release and does not persist changes."
          actions={
            <Button asChild>
              <Link href="/organization/roles/create">
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

      <section className="overflow-hidden rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)]">
        <div className="flex flex-col gap-3 border-b border-[var(--vms-line)] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">
              Current organization roles
            </h2>
            <p className="mt-1 text-sm text-[var(--vms-ink-muted)]">
              These are read-only in the prototype.
            </p>
          </div>
          <form
            className="flex w-full gap-2 sm:max-w-md"
            onSubmit={(event) => {
              event.preventDefault();
              setSearch(searchInput.trim());
            }}
          >
            <label htmlFor="role-search" className="sr-only">
              Search roles
            </label>
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--vms-ink-muted)]"
                aria-hidden="true"
              />
              <input
                id="role-search"
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search roles"
                className={`${fieldControlClassName} pl-9`}
              />
            </div>
            <Button type="submit" variant="secondary">
              Search
            </Button>
          </form>
        </div>

        {roles.isPending ? (
          <div className="p-4">
            <TableSkeleton rows={4} />
          </div>
        ) : roles.isError ? (
          <div
            role="alert"
            className="m-4 rounded-[var(--vms-radius-surface)] border border-[var(--vms-danger)] bg-[var(--vms-danger-subtle)] p-4 text-sm text-[var(--vms-danger)]"
          >
            <p className="font-semibold">Roles could not be loaded</p>
            <p className="mt-1">{parseApiError(roles.error).message}</p>
            <Button
              variant="secondary"
              className="mt-3"
              onClick={() => roles.refetch()}
            >
              Retry
            </Button>
          </div>
        ) : !items.length ? (
          <EmptyState
            icon={ShieldCheck}
            title={search ? "No roles match" : "No organization roles yet"}
            description={
              search
                ? "Clear the search and try again."
                : "Open the draft authoring surface to preview a role setup."
            }
            action={
              <Button asChild>
                <Link href="/organization/roles/create">
                  Create draft role
                </Link>
              </Button>
            }
          />
        ) : (
          <div className="divide-y divide-[var(--vms-line)]">
            {items.map((role) => (
              <article
                key={role.id}
                className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(14rem,0.5fr)_auto] lg:items-center"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--vms-radius-control)] bg-[var(--vms-surface-subtle)] text-[var(--vms-ink-muted)]">
                    <ShieldCheck
                      className="h-4 w-4"
                      aria-hidden="true"
                    />
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold">
                      {role.name}
                    </h3>
                    <p className="mt-0.5 text-xs text-[var(--vms-ink-muted)]">
                      {role.description || "No description"}
                    </p>
                    <Badge variant="neutral" className="mt-2">
                      {role.code}
                    </Badge>
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--vms-ink-muted)]">
                    Permissions
                  </p>
                  <p className="mt-1 text-sm">
                    {role.permissions_parsed.length} configured grants
                  </p>
                  <p className="mt-1 text-xs text-[var(--vms-ink-muted)]">
                    {role.permissions_parsed.includes("*")
                      ? "Full tenant access"
                      : "Use draft authoring to preview changes"}
                  </p>
                </div>
                <Link
                  href={`/organization/roles/create?role=${encodeURIComponent(role.id)}`}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--vms-radius-control)] border border-[var(--vms-line-strong)] bg-[var(--vms-surface)] px-3 text-sm font-semibold text-[var(--vms-ink)] hover:bg-[var(--vms-surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]"
                >
                  Inspect draft
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
