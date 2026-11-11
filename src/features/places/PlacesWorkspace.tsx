"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
  ChevronRight,
  Download,
  MapPin,
  Plus,
  Settings2,
  ShieldCheck,
  Store,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  DataTable,
  type BulkAction,
  type Column,
} from "@/components/ui/DataTable";
import { Field, fieldControlClassName } from "@/components/ui/form/Field";
import { FormSection } from "@/components/ui/form/FormSection";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { Modal } from "@/components/ui/Modal";
import { useAdminProfile } from "@/hooks/use-admin";
import { hasAdminPermission } from "@/lib/permissions";
import { parseApiError } from "@/lib/error-utils";
import { useAppStore } from "@/store/app-store";
import { useAuthStore } from "@/store/auth-store";
import { contextApi } from "@/features/context/api";
import {
  type Place,
  type PlaceInput,
  placeKinds,
} from "@/features/places/api";
import {
  type Site,
  type SiteDetail,
  type SiteInput,
  sitesApi,
} from "@/features/sites/api";
import "./styles.css";

export interface PlaceRoute {
  id?: string;
  action?: "new" | "edit" | "move";
  parentId?: string;
}

type DirectoryValues = {
  search: string;
  status: "active" | "archived" | "all";
};

export default function PlacesPage({
  route = {},
  basePath = "/organization/sites",
}: {
  route?: PlaceRoute;
  basePath?: string;
}) {
  const organization = useAppStore((state) => state.organization);
  const user = useAuthStore((state) => state.user);
  const context = `${organization?.id}:${user?.id}`;
  return (
    <SitesWorkspace
      key={context}
      context={context}
      organizationName={organization?.name || "Organization"}
      route={route}
      basePath={basePath}
    />
  );
}

function SitesWorkspace({
  context,
  organizationName,
  route,
  basePath,
}: {
  context: string;
  organizationName: string;
  route: PlaceRoute;
  basePath: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const profile = useAdminProfile();
  const [searchInput, setSearchInput] = useState(
    searchParams?.get("search") || "",
  );
  const [search, setSearch] = useState(searchParams?.get("search") || "");
  const [status, setStatus] = useState<DirectoryValues["status"]>("active");
  const [page, setPage] = useState(1);
  const [addPlaceOpen, setAddPlaceOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const setSelectedSite = useAppStore((state) => state.setSelectedSite);
  const selectedId = route.id;
  const creating = route.action === "new";
  const allowed = (action: string) =>
    profile.isSuccess &&
    !profile.isError &&
    hasAdminPermission(profile.data, `places.${action}`);
  const list = useQuery({
    queryKey: ["sites", context, page, search, status],
    queryFn: () =>
      sitesApi.list({
        page,
        page_size: 10,
        ...(search ? { search } : {}),
        ...(status !== "all" ? { is_active: status === "active" } : {}),
      }),
    enabled: allowed("list"),
    placeholderData: (previous) => previous,
  });
  const detail = useQuery({
    queryKey: ["sites", context, "detail", selectedId],
    queryFn: () => sitesApi.get(selectedId!),
    enabled: !!selectedId && allowed("show"),
  });
  useEffect(() => {
    if (detail.data) {
      setSelectedSite({ id: detail.data.id, name: detail.data.name });
    }
  }, [detail.data, setSelectedSite]);
  const parent = useQuery({
    queryKey: ["sites", context, "detail", route.parentId],
    queryFn: () => sitesApi.get(route.parentId!),
    enabled: !!route.parentId && creating,
  });
  const siteNames = new Map(
    (list.data?.items ?? []).map((site) => [site.id, site.name]),
  );
  const columns: Column<Site>[] = [
    {
      key: "site",
      header: "Site",
      accessor: (site) => (
        <span className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-[var(--vms-radius-control)] bg-[var(--vms-surface-subtle)]">
            <Building2 className="h-4 w-4" aria-hidden="true" />
          </span>
          <span>
            <strong className="block">{site.name}</strong>
            <span className="block text-xs capitalize text-[var(--vms-ink-muted)]">
              {site.use_case.replaceAll("_", " ")}
            </span>
          </span>
        </span>
      ),
      sortable: true,
    },
    {
      key: "address",
      header: "Location",
      accessor: (site) => (
        <span className="flex items-center gap-2 text-sm text-[var(--vms-ink-muted)]">
          <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
          {site.address || "No address recorded"}
        </span>
      ),
    },
    {
      key: "hierarchy",
      header: "Hierarchy",
      accessor: (site) =>
        site.parent_site_id
          ? siteNames.get(site.parent_site_id) || "Child Site"
          : "Root Site",
    },
    {
      key: "status",
      header: "Status",
      accessor: (site) => (
        <Badge variant={site.is_active ? "success" : "neutral"}>
          {site.is_active ? "Active" : "Archived"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Action",
      mobileHide: true,
      accessor: (site) => (
        <div className="flex justify-end gap-1">
          <Button asChild size="sm" variant="ghost" disabled={!allowed("show")}>
            <Link href={`${basePath}/${site.id}`}>Details</Link>
          </Button>
          <Button
            asChild
            size="sm"
            variant="ghost"
            disabled={!allowed("update")}
          >
            <Link href={`${basePath}/${site.id}/edit`}>Edit</Link>
          </Button>
          <Button
            asChild
            size="sm"
            variant="outline"
            disabled={!allowed("create")}
          >
            <Link href={`${basePath}/new?parent=${site.id}`}>
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Child
            </Link>
          </Button>
        </div>
      ),
    },
  ];
  const bulkActions: BulkAction[] = [
    {
      label: "Export selected",
      icon: Download,
      onClick: (ids) => {
        const rows = (list.data?.items ?? []).filter((site) =>
          ids.includes(site.id),
        );
        const csv = [
          ["Site", "Use case", "Address", "Status"],
          ...rows.map((site) => [
            site.name,
            site.use_case,
            site.address,
            site.is_active ? "Active" : "Archived",
          ]),
        ]
          .map((row) =>
            row
              .map((value) => `"${String(value).replaceAll('"', '""')}"`)
              .join(","),
          )
          .join("\n");
        const url = URL.createObjectURL(
          new Blob([csv], { type: "text/csv;charset=utf-8" }),
        );
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "sites.csv";
        anchor.click();
        URL.revokeObjectURL(url);
      },
    },
  ];
  if (profile.isPending) return <p role="status">Loading Site permissions…</p>;
  if (profile.isError) {
    return (
      <InlineAlert
        tone="danger"
        title="Permissions could not be loaded"
        action={
          <Button size="sm" variant="outline" onClick={() => profile.refetch()}>
            Retry
          </Button>
        }
      >
        {parseApiError(profile.error).message}
      </InlineAlert>
    );
  }
  if (!allowed("list")) {
    return (
      <InlineAlert tone="warning" title="Site directory unavailable">
        Your current role cannot view organization Sites.
      </InlineAlert>
    );
  }
  return (
    <main className="place-workspace">
      <header className="place-heading">
        <div>
          <p className="place-eyebrow">
            <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
            {organizationName}
            <span>/</span>Organization Sites
          </p>
          <h1>Places</h1>
          <p className="place-heading-copy">
            Sites are organization-owned management boundaries. Each Site owns
            its child Sites and the buildings, units, rooms and spaces beneath
            them.
          </p>
        </div>
        {allowed("create") ? (
          <Button onClick={() => router.push(`${basePath}/new`)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            New Site
          </Button>
        ) : null}
      </header>
      {notice ? (
        <InlineAlert tone="success" title="Places updated">
          {notice}
        </InlineAlert>
      ) : null}
      {!selectedId && !creating ? (
        <>
          <section className="flex flex-col gap-3 rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-4 sm:flex-row sm:items-end sm:justify-between">
            <form
              className="flex min-h-11 w-full max-w-xl items-center gap-2 rounded-[var(--vms-radius-control)] border border-[var(--vms-line-strong)] bg-[var(--vms-surface)] px-3"
              onSubmit={(event) => {
                event.preventDefault();
                setSearch(searchInput.trim());
                setPage(1);
              }}
            >
              <input
                type="search"
                className="min-h-9 flex-1 bg-transparent text-base outline-none sm:text-sm"
                placeholder="Search Sites, addresses or context…"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                maxLength={100}
              />
              <button type="submit" className="text-sm font-semibold">
                Search
              </button>
            </form>
            <label className="flex min-h-11 items-center gap-2 text-sm">
              <span className="text-xs font-semibold text-[var(--vms-ink-muted)]">
                Status
              </span>
              <select
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value as DirectoryValues["status"]);
                  setPage(1);
                }}
                className="min-h-11 rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] bg-[var(--vms-surface)] px-3"
              >
                <option value="active">Active</option>
                <option value="archived">Archived</option>
                <option value="all">All</option>
              </select>
            </label>
          </section>
          {list.isError && !list.data ? (
            <InlineAlert
              tone="danger"
              title="Sites could not be loaded"
              action={
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => list.refetch()}
                >
                  Retry
                </Button>
              }
            >
              {parseApiError(list.error).message}
            </InlineAlert>
          ) : list.isError && list.data ? (
            <InlineAlert tone="warning" title="Showing last available Sites">
              The latest refresh failed.{" "}
              <button
                className="font-semibold underline"
                onClick={() => list.refetch()}
              >
                Retry
              </button>
            </InlineAlert>
          ) : null}
          <DataTable
            data={list.data?.items ?? []}
            columns={columns}
            searchable={false}
            tableLabel="Organization Sites"
            serverSide
            total={list.data?.total ?? 0}
            currentPage={page}
            onPageChange={setPage}
            pageSize={10}
            pageSizeOptions={[10]}
            isLoading={list.isPending}
            selectable
            getRowId={(site) => site.id}
            bulkActions={bulkActions}
            emptyMessage="No Sites match these filters"
            mobileSummary={(site) => (
              <span>
                <strong className="block">{site.name}</strong>
                <span className="block text-xs text-[var(--vms-ink-muted)]">
                  {site.address || "No address"} ·{" "}
                  {site.is_active ? "Active" : "Archived"}
                </span>
              </span>
            )}
          />
        </>
      ) : creating && allowed("create") ? (
        parent.isPending && route.parentId ? (
          <p role="status">Loading parent Site…</p>
        ) : (
          <SiteForm
            context={context}
            parent={parent.data}
            onCancel={() => router.push(basePath)}
            onSaved={async (site) => {
              await queryClient.invalidateQueries({
                queryKey: ["sites", context],
              });
              router.push(`${basePath}/${site.id}`);
            }}
          />
        )
      ) : selectedId ? (
        detail.isPending ? (
          <p role="status">Loading Site…</p>
        ) : detail.isError ? (
          <InlineAlert tone="danger" title="Site could not be loaded">
            {parseApiError(detail.error).message}
          </InlineAlert>
        ) : detail.data ? (
          <SiteDetails
            site={detail.data}
            context={context}
            routeAction={route.action}
            allowed={allowed}
            basePath={basePath}
            onAddPlace={() => setAddPlaceOpen(true)}
            onSaved={async (message) => {
              setNotice(message);
              await Promise.all([detail.refetch(), list.refetch()]);
            }}
          />
        ) : null
      ) : null}
      {detail.data ? (
        <AddPlaceModal
          open={addPlaceOpen}
          site={detail.data}
          context={context}
          onClose={() => setAddPlaceOpen(false)}
          onSaved={async () => {
            setAddPlaceOpen(false);
            setNotice("Place added to the Site.");
            await detail.refetch();
          }}
        />
      ) : null}
    </main>
  );
}

function SiteForm({
  context,
  parent,
  onCancel,
  onSaved,
}: {
  context: string;
  parent?: SiteDetail;
  onCancel: () => void;
  onSaved: (site: Site) => Promise<void>;
}) {
  const catalog = useQuery({
    queryKey: ["context-catalog", context],
    queryFn: contextApi.catalog,
  });
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [useCase, setUseCase] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminPhone, setAdminPhone] = useState("");
  const mutation = useMutation({
    mutationFn: () =>
      sitesApi.create({
        name: name.trim(),
        address: address.trim(),
        description: description.trim() || null,
        admin_email: adminEmail.trim(),
        admin_name: adminName.trim() || null,
        admin_phone: adminPhone.trim() || null,
        parent_site_id: parent?.id || null,
        use_case: useCase as SiteInput["use_case"],
      }),
    onSuccess: onSaved,
  });
  return (
    <form
      onSubmit={(event: FormEvent) => {
        event.preventDefault();
        if (name.trim() && adminEmail.trim() && useCase) mutation.mutate();
      }}
      className="space-y-5 rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-5"
    >
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--vms-ink-muted)]">
          {parent ? `Child of ${parent.name}` : "Organization root"}
        </p>
        <h2 className="mt-2 text-2xl font-semibold">
          {parent ? "Create child Site" : "Create Site"}
        </h2>
        <p className="mt-1 text-sm text-[var(--vms-ink-muted)]">
          A Site can contain child Sites and non-Site Places, but a Place can
          never contain a Site.
        </p>
      </header>
      <Field id="site-name" label="Site name" required>
        {(control) => (
          <input
            {...control}
            className={fieldControlClassName}
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        )}
      </Field>
      <Field id="site-address" label="Address">
        {(control) => (
          <input
            {...control}
            className={fieldControlClassName}
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            autoComplete="street-address"
          />
        )}
      </Field>
      <Field id="site-description" label="Description">
        {(control) => (
          <textarea
            {...control}
            className={fieldControlClassName}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
          />
        )}
      </Field>
      <Field
        id="site-use-case"
        label="Operating type"
        required
        description="The Site owns its operating type. Its Places and child Sites inherit it."
      >
        {(control) => (
          <select
            {...control}
            className={fieldControlClassName}
            value={useCase}
            onChange={(event) => setUseCase(event.target.value)}
            required
          >
            <option value="">Choose an operating type</option>
            {catalog.data?.use_cases.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}
      </Field>
      <FormSection
        title="Site administrator"
        description="The administrator is onboarded as a User with Site management authority. This does not create a Place Party relationship."
      >
        <Field id="site-admin-email" label="Administrator email" required>
          {(control) => (
            <input
              {...control}
              className={fieldControlClassName}
              type="email"
              inputMode="email"
              autoComplete="email"
              value={adminEmail}
              onChange={(event) => setAdminEmail(event.target.value)}
              required
            />
          )}
        </Field>
        <Field id="site-admin-name" label="Administrator name">
          {(control) => (
            <input
              {...control}
              className={fieldControlClassName}
              autoComplete="name"
              value={adminName}
              onChange={(event) => setAdminName(event.target.value)}
            />
          )}
        </Field>
        <Field id="site-admin-phone" label="Phone number">
          {(control) => (
            <input
              {...control}
              className={fieldControlClassName}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={adminPhone}
              onChange={(event) => setAdminPhone(event.target.value)}
            />
          )}
        </Field>
      </FormSection>
      {mutation.isError ? (
        <InlineAlert tone="danger" title="Site could not be created">
          {parseApiError(mutation.error).message}
        </InlineAlert>
      ) : null}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={
            mutation.isPending || !name.trim() || !adminEmail.trim() || !useCase
          }
        >
          {mutation.isPending ? "Creating…" : "Create Site"}
        </Button>
      </div>
    </form>
  );
}

function SiteDetails({
  site,
  context,
  routeAction,
  allowed,
  basePath,
  onAddPlace,
  onSaved,
}: {
  site: SiteDetail;
  context: string;
  routeAction?: PlaceRoute["action"];
  allowed: (action: string) => boolean;
  basePath: string;
  onAddPlace: () => void;
  onSaved: (message: string) => Promise<void>;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(routeAction === "edit");
  const archive = useMutation({
    mutationFn: () => sitesApi.toggle(site.id, !site.is_active),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["sites", context] });
      await onSaved(site.is_active ? "Site archived." : "Site activated.");
    },
  });
  const move = useMutation({
    mutationFn: (parentSiteId: string | null) =>
      sitesApi.move(site.id, parentSiteId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["sites", context] });
      router.push(`${basePath}/${site.id}`);
    },
  });
  return (
    <>
      <div className="place-viewline">
        <div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => router.push(basePath)}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Sites
          </Button>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{site.name}</span>
        </div>
        <span className="place-view-hint">
          Organization / Site / {site.slug}
        </span>
      </div>
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <article className="space-y-5 rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-5">
          <header className="flex flex-col gap-3 border-b border-[var(--vms-line)] pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--vms-ink-muted)]">
                Organization Site
              </p>
              <h2 className="mt-1 text-2xl font-semibold">{site.name}</h2>
              <p className="mt-1 text-sm capitalize text-[var(--vms-ink-muted)]">
                {site.use_case.replaceAll("_", " ")} ·{" "}
                {site.address || "No address"}
              </p>
            </div>
            <Badge variant={site.is_active ? "success" : "neutral"}>
              {site.is_active ? "Active" : "Archived"}
            </Badge>
          </header>
          {editing ? (
            <EditSiteForm
              site={site}
              onCancel={() => setEditing(false)}
              onSaved={async () => {
                setEditing(false);
                await onSaved("Site details saved.");
              }}
            />
          ) : (
            <p className="max-w-3xl text-sm leading-6 text-[var(--vms-ink-muted)]">
              {site.description ||
                "Add a description to clarify this Site's operating purpose, boundaries and shared services."}
            </p>
          )}
        </article>
        <aside className="space-y-3">
          <Button asChild className="w-full" variant="outline">
            <Link
              href="/admin/site/configuration"
              onClick={() =>
                useAppStore
                  .getState()
                  .setSelectedSite({ id: site.id, name: site.name })
              }
            >
              <Settings2 className="h-4 w-4" aria-hidden="true" />
              Site configuration
            </Link>
          </Button>
          <Button asChild className="w-full" variant="outline">
            <Link
              href="/admin/managers"
              onClick={() =>
                useAppStore
                  .getState()
                  .setSelectedSite({ id: site.id, name: site.name })
              }
            >
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Managers
            </Link>
          </Button>
          <Button asChild className="w-full" variant="outline">
            <Link
              href="/admin/people"
              onClick={() =>
                useAppStore
                  .getState()
                  .setSelectedSite({ id: site.id, name: site.name })
              }
            >
              <Users className="h-4 w-4" aria-hidden="true" />
              People
            </Link>
          </Button>
          {allowed("update") && !editing ? (
            <Button className="w-full" onClick={() => setEditing(true)}>
              Edit Site
            </Button>
          ) : null}
          {allowed("move") ? (
            <MoveSiteControl
              site={site}
              onMove={(parentId) => move.mutate(parentId)}
              pending={move.isPending}
            />
          ) : null}
          {allowed("toggle_active") ? (
            <Button
              className="w-full"
              variant="outline"
              disabled={archive.isPending}
              onClick={() => archive.mutate()}
            >
              {archive.isPending
                ? "Updating…"
                : site.is_active
                  ? "Archive Site"
                  : "Activate Site"}
            </Button>
          ) : null}
        </aside>
      </section>
      <section className="mt-5 grid gap-4 xl:grid-cols-2">
        <ChildSites
          sites={site.child_sites}
          basePath={basePath}
          canCreate={allowed("create")}
          parentId={site.id}
        />
        <Places
          site={site}
          onAddPlace={onAddPlace}
          canCreate={allowed("create")}
        />
      </section>
    </>
  );
}

function EditSiteForm({
  site,
  onCancel,
  onSaved,
}: {
  site: Site;
  onCancel: () => void;
  onSaved: () => Promise<void>;
}) {
  const [name, setName] = useState(site.name);
  const [address, setAddress] = useState(site.address);
  const [description, setDescription] = useState(site.description || "");
  const mutation = useMutation({
    mutationFn: () =>
      sitesApi.update(site.id, {
        name: name.trim(),
        address: address.trim(),
        description: description.trim() || null,
      }),
    onSuccess: onSaved,
  });
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (name.trim()) mutation.mutate();
      }}
      className="space-y-4"
    >
      <Field id="edit-site-name" label="Site name" required>
        {(control) => (
          <input
            {...control}
            className={fieldControlClassName}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        )}
      </Field>
      <Field id="edit-site-address" label="Address">
        {(control) => (
          <input
            {...control}
            className={fieldControlClassName}
            value={address}
            onChange={(event) => setAddress(event.target.value)}
          />
        )}
      </Field>
      <Field id="edit-site-description" label="Description">
        {(control) => (
          <textarea
            {...control}
            className={fieldControlClassName}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
          />
        )}
      </Field>
      {mutation.isError ? (
        <InlineAlert tone="danger" title="Site could not be saved">
          {parseApiError(mutation.error).message}
        </InlineAlert>
      ) : null}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={mutation.isPending || !name.trim()}>
          Save changes
        </Button>
      </div>
    </form>
  );
}

function MoveSiteControl({
  site,
  onMove,
  pending,
}: {
  site: SiteDetail;
  onMove: (parentId: string | null) => void;
  pending: boolean;
}) {
  const [parentId, setParentId] = useState(site.parent_site_id || "");
  const sites = useQuery({
    queryKey: ["site-move-options", site.id],
    queryFn: () => sitesApi.list({ page: 1, page_size: 100, is_active: true }),
  });
  const excluded = new Set([
    site.id,
    ...site.child_sites.map((child) => child.id),
  ]);
  const options = (sites.data?.items ?? []).filter(
    (candidate) => !excluded.has(candidate.id),
  );
  return (
    <label className="block space-y-2 rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] p-3 text-sm">
      <span className="font-semibold">Move within Site hierarchy</span>
      <select
        className={fieldControlClassName}
        value={parentId}
        onChange={(event) => setParentId(event.target.value)}
      >
        <option value="">Top level in organization</option>
        {options.map((candidate) => (
          <option key={candidate.id} value={candidate.id}>
            {candidate.name}
          </option>
        ))}
      </select>
      <Button
        className="w-full"
        variant="outline"
        disabled={pending || parentId === (site.parent_site_id || "")}
        onClick={() => onMove(parentId || null)}
      >
        Move Site
      </Button>
    </label>
  );
}

function ChildSites({
  sites,
  basePath,
  canCreate,
  parentId,
}: {
  sites: Site[];
  basePath: string;
  canCreate: boolean;
  parentId: string;
}) {
  return (
    <section className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-5">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-semibold">Child Sites</h2>
        {canCreate ? (
          <Button asChild size="sm" variant="outline">
            <Link href={`${basePath}/new?parent=${parentId}`}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Create child
            </Link>
          </Button>
        ) : null}
      </div>
      <p className="mt-1 text-sm text-[var(--vms-ink-muted)]">
        Only this Site's direct children appear here. Siblings and ancestors are
        never included in this workspace.
      </p>
      <div className="mt-4 divide-y divide-[var(--vms-line)]">
        {sites.length ? (
          sites.map((site) => (
            <Link
              key={site.id}
              href={`${basePath}/${site.id}`}
              className="flex min-h-12 items-center justify-between gap-3 py-2"
            >
              <span>
                <strong className="block text-sm">{site.name}</strong>
                <span className="text-xs capitalize text-[var(--vms-ink-muted)]">
                  {site.use_case.replaceAll("_", " ")}
                </span>
              </span>
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          ))
        ) : (
          <p className="py-6 text-sm text-[var(--vms-ink-muted)]">
            This Site has no child Sites.
          </p>
        )}
      </div>
    </section>
  );
}

function Places({
  site,
  onAddPlace,
  canCreate,
}: {
  site: SiteDetail;
  onAddPlace: () => void;
  canCreate: boolean;
}) {
  const columns: Column<Place>[] = [
    {
      key: "name",
      header: "Place",
      accessor: (place) => <strong>{place.name}</strong>,
      sortable: true,
    },
    {
      key: "kind",
      header: "Structure",
      accessor: (place) => placeKinds[place.kind] || place.kind,
    },
    {
      key: "address",
      header: "Location",
      accessor: (place) => place.address || "No address",
    },
  ];
  return (
    <section className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Places in this Site</h2>
          <p className="mt-1 text-sm text-[var(--vms-ink-muted)]">
            Buildings, units, rooms and spaces owned by this exact Site.
          </p>
        </div>
        {canCreate ? (
          <Button size="sm" onClick={onAddPlace}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Place
          </Button>
        ) : null}
      </div>
      <div className="mt-4">
        <DataTable
          data={site.places}
          columns={columns}
          tableLabel={`${site.name} Places`}
          searchable
          emptyMessage="No Places have been created in this Site"
          mobileSummary={(place) => (
            <span>
              <strong className="block">{place.name}</strong>
              <span className="text-xs text-[var(--vms-ink-muted)]">
                {placeKinds[place.kind] || place.kind}
              </span>
            </span>
          )}
        />
      </div>
    </section>
  );
}

function AddPlaceModal({
  open,
  site,
  context,
  onClose,
  onSaved,
}: {
  open: boolean;
  site: SiteDetail;
  context: string;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const catalog = useQuery({
    queryKey: ["context-catalog", context],
    queryFn: contextApi.catalog,
  });
  const [name, setName] = useState("");
  const [kind, setKind] = useState<PlaceInput["kind"]>("building");
  const [buildingType, setBuildingType] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const mutation = useMutation({
    mutationFn: () =>
      sitesApi.createPlace(site.id, {
        name: name.trim(),
        kind,
        building_type: buildingType || null,
        address: address.trim(),
        description: description.trim(),
      }),
    onSuccess: onSaved,
  });
  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Add a Place"
      description={`This Place will belong to ${site.name}.`}
      size="lg"
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (name.trim()) mutation.mutate();
        }}
      >
        <Field id="place-name" label="Place name" required>
          {(control) => (
            <input
              {...control}
              className={fieldControlClassName}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          )}
        </Field>
        <Field id="place-kind" label="Structure" required>
          {(control) => (
            <select
              {...control}
              className={fieldControlClassName}
              value={kind}
              onChange={(event) => {
                setKind(event.target.value as PlaceInput["kind"]);
                setBuildingType("");
              }}
            >
              <option value="building">Building</option>
              <option value="unit">Unit</option>
              <option value="room">Room</option>
              <option value="space">Space</option>
            </select>
          )}
        </Field>
        <Field id="place-type" label="Place type">
          {(control) => (
            <select
              {...control}
              className={fieldControlClassName}
              value={buildingType}
              onChange={(event) => setBuildingType(event.target.value)}
            >
              <option value="">Not specified</option>
              {catalog.data?.building_types
                .filter((type) => type.kinds.includes(kind))
                .map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
            </select>
          )}
        </Field>
        <Field id="place-address" label="Address">
          {(control) => (
            <input
              {...control}
              className={fieldControlClassName}
              value={address}
              onChange={(event) => setAddress(event.target.value)}
            />
          )}
        </Field>
        <Field id="place-description" label="Description">
          {(control) => (
            <textarea
              {...control}
              className={fieldControlClassName}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
            />
          )}
        </Field>
        {mutation.isError ? (
          <InlineAlert tone="danger" title="Place could not be created">
            {parseApiError(mutation.error).message}
          </InlineAlert>
        ) : null}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending || !name.trim()}>
            {mutation.isPending ? "Adding…" : "Add Place"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
