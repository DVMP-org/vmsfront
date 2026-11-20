"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Puzzle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { Skeleton } from "@/components/ui/Skeleton";
import { OrganizationAdminHeader } from "@/features/organization-admin/OrganizationAdminHeader";
import { useAdminProfile } from "@/hooks/use-admin";
import { useUrlQuerySync } from "@/hooks/use-url-query-sync";
import { parseApiError } from "@/lib/error-utils";
import { hasAdminPermission } from "@/lib/permissions";
import { useAppStore } from "@/store/app-store";
import type { MarketplacePlugin } from "@/types/plugin";

import { PluginCard } from "./components/PluginCard";
import { PluginDetailDrawer } from "./components/PluginDetailDrawer";
import { PluginsToolbar } from "./components/PluginsToolbar";
import type { PluginRecord, PluginView } from "./lib";
import {
  useInstalledPlugins,
  useMarketplaceCategories,
  usePluginAction,
  usePluginCatalog,
} from "./queries";

const PAGE_SIZE = 12;

const URL_CONFIG = {
  view: {
    defaultValue: "installed" as PluginView,
    deserialize: (value: string | null): PluginView =>
      value === "catalog" ? "catalog" : "installed",
  },
  plugin: { defaultValue: undefined },
  q: { defaultValue: "" },
  category: { defaultValue: "" },
  page: { defaultValue: 1 },
};

export function OrganizationPluginsPage() {
  const organizationId = useAppStore((state) => state.organization?.id);
  if (!organizationId) return <p role="status">Loading organization…</p>;
  return (
    <OrganizationPlugins key={organizationId} organizationId={organizationId} />
  );
}

function OrganizationPlugins({ organizationId }: { organizationId: string }) {
  const profile = useAdminProfile();
  const canManage = hasAdminPermission(profile.data, "admins.list");

  const { initializeFromUrl, syncToUrl } = useUrlQuerySync({
    config: URL_CONFIG,
    skipInitialSync: true,
  });

  const [view, setView] = useState<PluginView>(
    () => initializeFromUrl("view") ?? "installed",
  );
  const [search, setSearch] = useState<string>(
    () => initializeFromUrl("q") ?? "",
  );
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [category, setCategory] = useState<string>(
    () => initializeFromUrl("category") ?? "",
  );
  const [page, setPage] = useState<number>(
    () => initializeFromUrl("page") ?? 1,
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    () => initializeFromUrl("plugin") ?? null,
  );

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    syncToUrl({
      view,
      plugin: selectedId ?? undefined,
      q: debouncedSearch,
      category,
      page: view === "catalog" ? page : undefined,
    });
  }, [view, selectedId, debouncedSearch, category, page, syncToUrl]);

  const installed = useInstalledPlugins(organizationId, canManage);
  const catalog = usePluginCatalog(
    organizationId,
    { page, pageSize: PAGE_SIZE, search: debouncedSearch, category },
    canManage && view === "catalog",
  );
  const categories = useMarketplaceCategories(canManage);
  const action = usePluginAction(organizationId);

  const installedIds = useMemo(
    () => new Set((installed.data ?? []).map((plugin) => plugin.id)),
    [installed.data],
  );

  const installedRows = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    return (installed.data ?? []).filter((plugin) =>
      `${plugin.name} ${plugin.description ?? ""} ${plugin.category ?? ""}`
        .toLowerCase()
        .includes(query),
    );
  }, [installed.data, debouncedSearch]);

  const catalogRows = catalog.data?.items ?? [];
  const rows: PluginRecord[] =
    view === "installed" ? installedRows : catalogRows;
  const active = view === "installed" ? installed : catalog;

  const selectedPlugin: PluginRecord | undefined =
    installed.data?.find((plugin) => plugin.id === selectedId) ??
    catalog.data?.items.find((plugin) => plugin.id === selectedId);

  useEffect(() => {
    if (!selectedId || active.isLoading || active.isFetching) return;
    if (!selectedPlugin) setSelectedId(null);
  }, [selectedId, selectedPlugin, active.isLoading, active.isFetching]);

  const selectedIsInstalled = selectedPlugin
    ? installedIds.has(selectedPlugin.id) ||
    (selectedPlugin as MarketplacePlugin).installed === true
    : false;

  const openPlugin = (plugin: PluginRecord) => setSelectedId(plugin.id);
  const runAction = (plugin: PluginRecord, isInstalledRecord: boolean) =>
    action.mutate({
      pluginId: plugin.id,
      action: isInstalledRecord ? "toggle" : "install",
    });

  return (
    <div className="space-y-6">
      <OrganizationAdminHeader
        eyebrow="Organization administration"
        title="Plugins"
        description="Install business tools for the organization, then activate them per Site with an approved provider connection. Your plan decides what is available."
        actions={
          <Button variant="outline" asChild>
            <Link href="/organization/settings/integrations">
              Provider integrations
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </Button>
        }
      />

      {profile.isLoading ? (
        <p role="status">Loading permissions…</p>
      ) : profile.isError ? (
        <div
          role="alert"
          className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-5"
        >
          <p>Organization permissions could not be loaded.</p>
          <Button
            variant="outline"
            className="mt-3"
            onClick={() => profile.refetch()}
          >
            Retry
          </Button>
        </div>
      ) : !canManage ? (
        <div
          role="alert"
          className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-5 text-sm"
        >
          Organization administration permission is required to manage plugins.
          Contact an organization administrator.
        </div>
      ) : (
        <>
          <PluginsToolbar
            view={view}
            installedCount={installed.data?.length}
            catalogTotal={catalog.data?.total}
            search={search}
            category={category}
            categories={categories.data ?? []}
            onViewChange={(next) => {
              setView(next);
              action.reset();
            }}
            onSearchChange={setSearch}
            onCategoryChange={(value) => {
              setCategory(value);
              setPage(1);
            }}
          />

          {action.isError ? (
            <p
              role="alert"
              className="rounded-[var(--vms-radius-control)] bg-[var(--vms-danger-subtle)] p-4 text-sm text-[var(--vms-danger)]"
            >
              {parseApiError(action.error).message}
            </p>
          ) : null}

          <section
            id="plugins-panel"
            role="tabpanel"
            aria-labelledby={`plugins-panel-tab-${view}`}
            aria-busy={active.isLoading}
            className="space-y-4"
          >
            {active.isError ? (
              <div
                role="alert"
                className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-5"
              >
                <p className="text-sm">
                  {view === "installed"
                    ? "Installed plugins could not be loaded."
                    : "The catalogue could not be loaded."}
                </p>
                <Button
                  variant="outline"
                  className="mt-3"
                  onClick={() => active.refetch()}
                >
                  <RefreshCw aria-hidden="true" className="h-4 w-4" />
                  Retry
                </Button>
              </div>
            ) : active.isLoading ? (
              <div
                role="status"
                className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
              >
                <span className="sr-only">Loading plugins</span>
                {[0, 1, 2, 3, 4, 5].map((key) => (
                  <Skeleton key={key} className="h-64 w-full" />
                ))}
              </div>
            ) : !rows.length ? (
              <EmptyState
                icon={Puzzle}
                title={
                  debouncedSearch
                    ? "No matching plugins"
                    : view === "installed"
                      ? "No plugins installed yet"
                      : "No plugins available"
                }
                description={
                  debouncedSearch
                    ? "Try another name, category or clear the search."
                    : view === "installed"
                      ? "Browse the catalogue to install a tool for this organization."
                      : "Every catalogue plugin is already installed, or your plan includes none."
                }
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {rows.map((plugin) => {
                  const isInstalled =
                    installedIds.has(plugin.id) ||
                    (plugin as MarketplacePlugin).installed === true;
                  const pending =
                    action.isPending && action.variables?.pluginId === plugin.id;
                  return (
                    <PluginCard
                      key={plugin.id}
                      plugin={plugin}
                      installed={isInstalled}
                      busy={action.isPending}
                      pending={Boolean(pending)}
                      onOpen={() => openPlugin(plugin)}
                      onAction={() => runAction(plugin, isInstalled)}
                    />
                  );
                })}
              </div>
            )}
          </section>

          {view === "catalog" &&
            catalog.data &&
            catalog.data.total_pages > 1 ? (
            <PaginationBar
              page={catalog.data.page}
              pageSize={catalog.data.page_size}
              total={catalog.data.total}
              totalPages={catalog.data.total_pages}
              hasNext={catalog.data.has_next}
              hasPrevious={catalog.data.has_previous}
              resourceLabel="plugins"
              onChange={setPage}
              isFetching={catalog.isFetching}
            />
          ) : null}
        </>
      )}

      {selectedPlugin ? (
        <PluginDetailDrawer
          organizationId={organizationId}
          plugin={selectedPlugin}
          installed={selectedIsInstalled}
          actionPending={action.isPending}
          onClose={() => setSelectedId(null)}
          onAction={() => runAction(selectedPlugin, selectedIsInstalled)}
        />
      ) : null}
    </div>
  );
}
