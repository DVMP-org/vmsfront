"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Puzzle, RefreshCw, Settings2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { fieldControlClassName } from "@/components/ui/form/Field";
import { OrganizationAdminHeader } from "@/features/organization-admin/OrganizationAdminHeader";
import { useAdminProfile } from "@/hooks/use-admin";
import { parseApiError } from "@/lib/error-utils";
import { hasAdminPermission } from "@/lib/permissions";
import { pluginEntitlementLabel } from "@/lib/plugin-utils";
import { adminService } from "@/services/admin-service";
import { useAppStore } from "@/store/app-store";
import type {
  BackendPlugin,
  MarketplacePlugin,
  PluginConfig,
} from "@/types/plugin";

const heading = (name: string) =>
  name.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

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
  const queryClient = useQueryClient();
  const [view, setView] = useState<"installed" | "catalog">("installed");
  const [search, setSearch] = useState("");
  const [catalogSearch, setCatalogSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<BackendPlugin | null>(null);
  const queryKey = ["organization", organizationId, "plugins"];

  useEffect(() => {
    const timer = setTimeout(() => {
      setCatalogSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const installed = useQuery({
    queryKey: [...queryKey, "installed"],
    queryFn: async () =>
      (await adminService.getPlugins()).data as BackendPlugin[],
    enabled: canManage,
  });
  const catalog = useQuery({
    queryKey: [...queryKey, "catalog", page, catalogSearch],
    queryFn: async () =>
      (
        await adminService.getMarketplacePlugins({
          page,
          pageSize: 12,
          search: catalogSearch,
        })
      ).data,
    enabled: canManage && view === "catalog",
  });

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey }),
      queryClient.invalidateQueries({ queryKey: ["admin", "plugins"] }),
    ]);
  };
  const mutation = useMutation({
    mutationFn: async ({
      plugin,
      action,
    }: {
      plugin: BackendPlugin | MarketplacePlugin;
      action: "toggle" | "install";
    }) => {
      if (!canManage)
        throw new Error("Organization administration permission is required.");
      return action === "install"
        ? adminService.installPlugin(plugin.id)
        : adminService.togglePlugin(plugin.id);
    },
    onSuccess: async (_, { action }) => {
      toast.success(
        action === "install"
          ? "Plugin installed"
          : "Plugin availability updated",
      );
    },
    onSettled: invalidate,
  });

  const active = view === "installed" ? installed : catalog;
  const installedIds = new Set(
    (installed.data || []).map((plugin) => plugin.id),
  );
  const rows: Array<BackendPlugin | MarketplacePlugin> =
    view === "installed"
      ? (installed.data || []).filter((plugin) =>
          `${plugin.name} ${plugin.description || ""}`
            .toLowerCase()
            .includes(search.toLowerCase()),
        )
      : catalog.data?.items || [];

  return (
    <div className="space-y-6">
      <OrganizationAdminHeader
        eyebrow="Organization administration"
        title="Plugins"
        description="Manage the business tools installed for this organization. Workspace access and your plan determine where each plugin can be used."
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
          className="rounded-lg border border-[var(--vms-line)] bg-[var(--vms-surface)] p-5"
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
          className="rounded-lg border border-[var(--vms-line)] bg-[var(--vms-surface)] p-5 text-sm"
        >
          Organization administration permission is required to manage plugins.
          Contact an organization administrator.
        </div>
      ) : (
        <>
          <section
            aria-label="Plugin controls"
            className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
          >
            <div
              className="flex flex-wrap gap-2"
              aria-label="Plugin collection"
            >
              <Button
                variant={view === "installed" ? "primary" : "outline"}
                aria-pressed={view === "installed"}
                onClick={() => {
                  setView("installed");
                  mutation.reset();
                }}
              >
                Installed{installed.data ? ` (${installed.data.length})` : ""}
              </Button>
              <Button
                variant={view === "catalog" ? "primary" : "outline"}
                aria-pressed={view === "catalog"}
                onClick={() => {
                  setView("catalog");
                  mutation.reset();
                }}
              >
                Browse catalog
              </Button>
            </div>
            <div className="w-full sm:max-w-xs">
              <label
                htmlFor="organization-plugin-search"
                className="mb-1 block text-xs font-semibold"
              >
                Search plugins
              </label>
              <input
                id="organization-plugin-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className={`${fieldControlClassName} text-base sm:text-sm`}
                placeholder="Search by name or description"
              />
            </div>
          </section>
          {mutation.isError ? (
            <p
              role="alert"
              className="rounded-lg bg-[var(--vms-danger-subtle)] p-4 text-sm text-[var(--vms-danger)]"
            >
              {parseApiError(mutation.error).message}
            </p>
          ) : null}
          {active.isError ? (
            <div
              role="alert"
              className="rounded-lg border border-[var(--vms-line)] bg-[var(--vms-surface)] p-5"
            >
              <p className="text-sm">
                Plugins could not be refreshed. Availability may have changed.
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
          ) : null}
          {active.isLoading ? (
            <div
              role="status"
              className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
            >
              <span className="sr-only">Loading plugins</span>
              {[0, 1, 2].map((key) => (
                <div
                  key={key}
                  className="h-56 animate-pulse rounded-lg border border-[var(--vms-line)] bg-[var(--vms-surface)] motion-reduce:animate-none"
                />
              ))}
            </div>
          ) : !rows.length && !active.isError ? (
            <div className="rounded-lg border border-dashed border-[var(--vms-line-strong)] bg-[var(--vms-surface)] px-5 py-12 text-center">
              <Puzzle
                aria-hidden="true"
                className="mx-auto h-8 w-8 text-[var(--vms-ink-muted)]"
              />
              <h2 className="mt-4 text-base font-semibold">
                {search
                  ? "No matching plugins"
                  : view === "installed"
                    ? "No plugins installed"
                    : "No plugins available"}
              </h2>
              <p className="mt-2 text-sm text-[var(--vms-ink-muted)]">
                {search
                  ? "Try another name or clear your search."
                  : "Browse tools included in your organization’s plan."}
              </p>
              <Button
                className="mt-5"
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setView("catalog");
                }}
              >
                Browse all plugins
              </Button>
            </div>
          ) : (
            <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
              {rows.map((plugin) => {
                const isInstalled =
                  installedIds.has(plugin.id) || plugin.installed === true;
                const busy =
                  mutation.isPending || active.isError || active.isFetching;
                return (
                  <article
                    key={plugin.id}
                    className="flex h-full min-w-0 flex-col rounded-lg border border-[var(--vms-line)] bg-[var(--vms-surface)] p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-[var(--vms-surface-subtle)]">
                        <Puzzle aria-hidden="true" className="h-5 w-5" />
                      </div>
                      <StatusBadge
                        tone={
                          plugin.enabled && plugin.access_ready
                            ? "success"
                            : "neutral"
                        }
                      >
                        {plugin.enabled
                          ? plugin.access_ready
                            ? "Enabled"
                            : "Setup required"
                          : isInstalled
                            ? "Disabled"
                            : "Not installed"}
                      </StatusBadge>
                    </div>
                    <h2 className="mt-4 break-words text-base font-semibold">
                      {heading(plugin.name)}
                    </h2>
                    <p className="mt-1 text-xs text-[var(--vms-ink-muted)]">
                      {plugin.category || "Business tools"} · Version{" "}
                      {plugin.version}
                    </p>
                    <p className="mt-3 flex-1 text-sm leading-6 text-[var(--vms-ink-muted)]">
                      {plugin.description || "Organization business plugin."}
                    </p>
                    <div className="mt-4 border-t border-[var(--vms-line)] pt-4">
                      <p className="text-xs font-semibold">
                        {pluginEntitlementLabel(plugin.entitlement_status)}
                      </p>
                      {plugin.entitlement_reason ? (
                        <p className="mt-1 text-xs leading-5 text-[var(--vms-ink-muted)]">
                          {plugin.entitlement_reason}
                        </p>
                      ) : null}
                      <div className="mt-4 flex flex-wrap gap-2">
                        {isInstalled ? (
                          <>
                            <Button
                              variant="outline"
                              disabled={
                                busy || (!plugin.enabled && !plugin.can_enable)
                              }
                              onClick={() =>
                                mutation.mutate({ plugin, action: "toggle" })
                              }
                            >
                              {mutation.isPending &&
                              mutation.variables?.plugin.id === plugin.id
                                ? "Updating…"
                                : plugin.enabled
                                  ? "Disable"
                                  : "Enable"}
                            </Button>
                            <Button
                              variant="ghost"
                              disabled={busy}
                              aria-label={`Configure ${heading(plugin.name)}`}
                              onClick={() =>
                                setSelected(plugin as BackendPlugin)
                              }
                            >
                              <Settings2
                                aria-hidden="true"
                                className="h-4 w-4"
                              />
                              Configure
                            </Button>
                          </>
                        ) : (
                          <Button
                            disabled={busy || !plugin.can_install}
                            onClick={() =>
                              mutation.mutate({ plugin, action: "install" })
                            }
                          >
                            {mutation.isPending &&
                            mutation.variables?.plugin.id === plugin.id
                              ? "Installing…"
                              : "Install plugin"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
          {view === "catalog" &&
          catalog.data &&
          catalog.data.total_pages > 1 ? (
            <nav
              aria-label="Plugin catalog pages"
              className="flex flex-wrap items-center justify-between gap-3"
            >
              <Button
                variant="outline"
                disabled={page === 1 || catalog.isFetching}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <span className="text-sm">
                Page {page} of {catalog.data.total_pages}
              </span>
              <Button
                variant="outline"
                disabled={
                  page >= catalog.data.total_pages || catalog.isFetching
                }
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </nav>
          ) : null}
        </>
      )}
      {selected ? (
        <PluginSettings
          key={`${organizationId}:${selected.id}`}
          plugin={selected}
          organizationId={organizationId}
          onClose={() => setSelected(null)}
          onSaved={invalidate}
        />
      ) : null}
    </div>
  );
}

function PluginSettings({
  plugin,
  organizationId,
  onClose,
  onSaved,
}: {
  plugin: BackendPlugin;
  organizationId: string;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const query = useQuery({
    queryKey: ["organization", organizationId, "plugins", plugin.id],
    queryFn: async () => (await adminService.getPluginSettings(plugin.id)).data,
    refetchOnWindowFocus: false,
  });
  return (
    <Drawer
      isOpen
      title={`${heading(plugin.name)} settings`}
      description="Organization configuration applies wherever this plugin is available. Manage provider credentials under Integrations."
      onClose={onClose}
    >
      {query.isLoading ? (
        <p role="status" className="p-5">
          Loading plugin settings…
        </p>
      ) : query.isError ? (
        <div role="alert" className="space-y-3 p-5">
          <p>{parseApiError(query.error).message}</p>
          <Button variant="outline" onClick={() => query.refetch()}>
            Retry
          </Button>
        </div>
      ) : query.data ? (
        <ConfigEditor plugin={query.data} onSaved={onSaved} onClose={onClose} />
      ) : null}
    </Drawer>
  );
}

function ConfigEditor({
  plugin,
  onSaved,
  onClose,
}: {
  plugin: BackendPlugin;
  onSaved: () => Promise<void>;
  onClose: () => void;
}) {
  const options = plugin.details?.configOptions || [];
  const [draft, setDraft] = useState<PluginConfig>(() =>
    Object.fromEntries([
      ...options.map((option) => [
        option.key,
        option.defaultValue ??
          (option.type === "boolean" || option.type === "toggle" ? false : ""),
      ]),
      ...Object.entries(plugin.configuration || {}),
    ]),
  );
  const unsupported = options.some(
    (option) =>
      !["text", "string", "number", "boolean", "toggle", "select"].includes(
        option.type,
      ),
  );
  const save = useMutation({
    mutationFn: async () => {
      if (!plugin.can_configure || unsupported)
        throw new Error(
          "This plugin cannot be configured with your current access.",
        );
      return adminService.updatePluginSettings(plugin.id, draft);
    },
    onSuccess: async () => {
      await onSaved();
      toast.success("Plugin settings saved");
      onClose();
    },
  });
  return (
    <form
      className="space-y-5 p-5"
      onSubmit={(event) => {
        event.preventDefault();
        save.mutate();
      }}
    >
      {!plugin.can_configure ? (
        <p className="rounded-md bg-[var(--vms-warning-subtle)] p-3 text-sm">
          {plugin.entitlement_reason ||
            "Settings are read-only for this plugin."}
        </p>
      ) : null}
      {save.isError ? (
        <p role="alert" className="text-sm text-[var(--vms-danger)]">
          {parseApiError(save.error).message}
        </p>
      ) : null}
      {!options.length ? (
        <p className="text-sm text-[var(--vms-ink-muted)]">
          This plugin has no organization settings.
        </p>
      ) : (
        options.map((option) => {
          const id = `plugin-setting-${option.key}`;
          const disabled = !plugin.can_configure || save.isPending;
          const value = draft[option.key];
          return (
            <div key={option.key} className="space-y-1.5">
              <label htmlFor={id} className="block text-sm font-semibold">
                {option.label}
              </label>
              {option.description ? (
                <p
                  id={`${id}-help`}
                  className="text-xs leading-5 text-[var(--vms-ink-muted)]"
                >
                  {option.description}
                </p>
              ) : null}
              {option.type === "boolean" || option.type === "toggle" ? (
                <div className="flex min-h-11 items-center">
                  <input
                    id={id}
                    type="checkbox"
                    checked={value === true}
                    disabled={disabled}
                    aria-describedby={
                      option.description ? `${id}-help` : undefined
                    }
                    onChange={(event) =>
                      setDraft({ ...draft, [option.key]: event.target.checked })
                    }
                    className="h-5 w-5 accent-[var(--vms-action)]"
                  />
                </div>
              ) : option.type === "select" ? (
                <select
                  id={id}
                  className={fieldControlClassName}
                  value={String(value ?? "")}
                  disabled={disabled}
                  aria-describedby={
                    option.description ? `${id}-help` : undefined
                  }
                  onChange={(event) =>
                    setDraft({ ...draft, [option.key]: event.target.value })
                  }
                >
                  <option value="">Choose an option</option>
                  {option.options?.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              ) : ["text", "string", "number"].includes(option.type) ? (
                <input
                  id={id}
                  type={option.type === "number" ? "number" : "text"}
                  step={option.type === "number" ? "any" : undefined}
                  className={`${fieldControlClassName} text-base sm:text-sm`}
                  value={String(value ?? "")}
                  disabled={disabled}
                  aria-describedby={
                    option.description ? `${id}-help` : undefined
                  }
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      [option.key]:
                        option.type === "number" && event.target.value !== ""
                          ? Number(event.target.value)
                          : event.target.value,
                    })
                  }
                />
              ) : (
                <p className="text-sm text-[var(--vms-warning)]">
                  This setting needs an updated plugin configuration form.
                </p>
              )}
            </div>
          );
        })
      )}
      <div className="flex flex-wrap justify-end gap-3 border-t border-[var(--vms-line)] pt-5">
        <Button
          type="button"
          variant="outline"
          disabled={save.isPending}
          onClick={onClose}
        >
          Close
        </Button>
        {options.length ? (
          <Button
            type="submit"
            disabled={!plugin.can_configure || unsupported || save.isPending}
          >
            {save.isPending ? "Saving…" : "Save settings"}
          </Button>
        ) : null}
      </div>
    </form>
  );
}
