"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BedDouble,
  Building2,
  Calculator,
  CalendarDays,
  FileText,
  Home,
  Megaphone,
  Receipt,
  Save,
  Scale,
  Share2,
  ShieldCheck,
  Sparkles,
  Store,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import {
  DataTable,
  type BulkAction,
  type Column,
} from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { Skeleton } from "@/components/ui/Skeleton";
import { parseApiError } from "@/lib/error-utils";
import {
  siteModulesApi,
  type DomainModuleKey,
  type SiteModule,
  type SiteModuleList,
} from "./api";

const moduleIcons: Record<DomainModuleKey, LucideIcon> = {
  properties: Building2,
  people: Users,
  billing: Receipt,
  access_control: ShieldCheck,
  maintenance: Wrench,
  communication: Megaphone,
  documents: FileText,
  residential: Home,
  commercial: Store,
  hospitality: BedDouble,
  leases: Scale,
  reservations: CalendarDays,
  housekeeping: Sparkles,
  shared_facilities: Share2,
  expense_allocation: Calculator,
};

type ModuleRow = SiteModule & { stagedEnabled: boolean };

export function SiteModulesPanel({
  siteId,
  siteName,
  canEdit,
}: {
  siteId: string;
  siteName: string;
  canEdit: boolean;
}) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["site-modules", siteId],
    queryFn: () => siteModulesApi.get(siteId),
    retry: false,
  });
  const [draft, setDraft] = useState<Record<string, boolean>>({});
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!query.data) return;
    setDraft(
      Object.fromEntries(
        query.data.modules.map((module) => [module.key, module.enabled]),
      ),
    );
    setSelectedRows(new Set());
  }, [query.data]);

  const rows = useMemo<ModuleRow[]>(
    () =>
      (query.data?.modules ?? []).map((module) => ({
        ...module,
        stagedEnabled: draft[module.key] ?? module.enabled,
      })),
    [draft, query.data],
  );
  const changed = rows.filter(
    (module) => module.stagedEnabled !== module.enabled,
  );
  const save = useMutation({
    mutationFn: () =>
      siteModulesApi.update(
        siteId,
        rows.map((module) => ({
          key: module.key,
          enabled: module.stagedEnabled,
          settings: module.settings,
        })),
      ),
    onSuccess: (updated) => {
      queryClient.setQueryData(["site-modules", siteId], updated);
      void queryClient.invalidateQueries({ queryKey: ["workspace-context"] });
      toast.success("Site modules updated.");
    },
    onError: (error) => {
      toast.error(parseApiError(error).message);
    },
  });

  function setModulesEnabled(keys: string[], enabled: boolean) {
    setDraft((current) => {
      const next = { ...current };
      for (const key of keys) next[key] = enabled;
      return next;
    });
  }

  function resetDraft() {
    if (!query.data) return;
    setDraft(
      Object.fromEntries(
        query.data.modules.map((module) => [module.key, module.enabled]),
      ),
    );
    setSelectedRows(new Set());
  }

  const bulkActions: BulkAction[] = canEdit
    ? [
        {
          label: "Enable selected",
          onClick: (ids) => setModulesEnabled(ids, true),
        },
        {
          label: "Disable selected",
          variant: "outline",
          onClick: (ids) => setModulesEnabled(ids, false),
        },
      ]
    : [];

  const columns: Column<ModuleRow>[] = [
    {
      key: "label",
      header: "Module",
      sortable: true,
      accessor: (module) => {
        const Icon = moduleIcons[module.key] ?? Building2;
        return (
          <div className="flex min-w-48 items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--vms-radius-control)] bg-[var(--vms-surface-subtle)] text-[var(--vms-ink)]">
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <p className="font-semibold text-[var(--vms-ink)]">
                {module.label}
              </p>
              <p className="mt-0.5 text-xs font-normal leading-5 text-[var(--vms-ink-muted)]">
                {module.description}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      key: "scope",
      header: "Availability",
      sortable: true,
      accessor: () => (
        <span className="text-xs font-medium text-[var(--vms-ink-muted)]">
          this Site
        </span>
      ),
      responsiveHide: "md",
    },
    {
      key: "stagedEnabled",
      header: "Status",
      sortable: true,
      accessor: (module) => (
        <button
          type="button"
          role="switch"
          aria-checked={module.stagedEnabled}
          aria-label={`${module.label} ${
            module.stagedEnabled ? "enabled" : "disabled"
          }`}
          disabled={!canEdit || save.isPending}
          onClick={() => setModulesEnabled([module.key], !module.stagedEnabled)}
          className="inline-flex min-h-11 items-center gap-2 rounded-[var(--vms-radius-control)] text-sm font-semibold text-[var(--vms-ink)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span
            aria-hidden="true"
            className={[
              "relative h-6 w-11 rounded-full border transition-colors",
              module.stagedEnabled
                ? "border-[var(--vms-action)] bg-[var(--vms-action)]"
                : "border-[var(--vms-line-strong)] bg-[var(--vms-surface-subtle)]",
            ].join(" ")}
          >
            <span
              className={[
                "absolute top-0.5 h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-transform",
                module.stagedEnabled ? "translate-x-[22px]" : "translate-x-0.5",
              ].join(" ")}
            />
          </span>
          {module.stagedEnabled ? "Enabled" : "Disabled"}
        </button>
      ),
    },
    {
      key: "change",
      header: "Change",
      accessor: (module) =>
        module.stagedEnabled === module.enabled ? (
          <span className="text-xs text-[var(--vms-ink-muted)]">Saved</span>
        ) : (
          <span className="text-xs font-semibold text-[var(--vms-coral)]">
            Pending
          </span>
        ),
      responsiveHide: "sm",
    },
  ];

  if (query.isPending) {
    return (
      <section
        aria-label="Site modules"
        className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-5"
      >
        <Skeleton className="h-6 w-48" />
        <Skeleton className="mt-3 h-4 w-full max-w-xl" />
        <Skeleton className="mt-5 h-48 w-full" />
      </section>
    );
  }

  if (query.isError) {
    return (
      <InlineAlert
        tone="danger"
        title="Site modules could not be loaded"
        action={
          <Button variant="outline" size="sm" onClick={() => query.refetch()}>
            Retry
          </Button>
        }
      >
        {parseApiError(query.error).message}
      </InlineAlert>
    );
  }

  return (
    <section
      aria-labelledby="property-modules-heading"
      className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)]"
    >
      <header className="flex flex-col gap-3 border-b border-[var(--vms-line)] p-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--vms-ink-muted)]">
            Operating configuration
          </p>
          <h3
            id="property-modules-heading"
            className="mt-1 text-lg font-semibold tracking-[-0.02em]"
          >
            Modules for {siteName}
          </h3>
          <p className="mt-1 max-w-2xl text-sm leading-5 text-[var(--vms-ink-muted)]">
            Choose the workflows this property offers. The organization&apos;s{" "}
            {query.data.effective_use_case.replaceAll("_", " ")} context still
            controls which modules are available.
          </p>
        </div>
        {canEdit ? (
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={!changed.length || save.isPending}
              onClick={resetDraft}
            >
              Reset
            </Button>
            <Button
              size="sm"
              disabled={!changed.length}
              isLoading={save.isPending}
              loadingLabel="Saving…"
              onClick={() => save.mutate()}
            >
              <Save className="h-4 w-4" aria-hidden="true" />
              Save {changed.length ? `${changed.length} changes` : "changes"}
            </Button>
          </div>
        ) : null}
      </header>
      <div className="p-4 sm:p-5">
        {rows.length ? (
          <DataTable
            data={rows}
            columns={columns}
            getRowId={(module) => module.key}
            selectable={canEdit}
            selectedRows={selectedRows}
            onSelectionChange={setSelectedRows}
            bulkActions={bulkActions}
            availableFilters={[
              {
                field: "stagedEnabled",
                label: "Status",
                type: "select",
                options: [
                  { value: "true", label: "Enabled" },
                  { value: "false", label: "Disabled" },
                ],
              },
            ]}
            initialSort="label"
            searchPlaceholder="Search modules"
            emptyMessage="No modules match this view."
            mobileSummary={(module) => (
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{module.label}</p>
                    <p className="mt-1 text-xs leading-5 text-[var(--vms-ink-muted)]">
                      {module.description}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold">
                    {module.stagedEnabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
              </div>
            )}
          />
        ) : (
          <EmptyState
            title="No Site modules available"
            description="this Site's operating use case does not currently expose configurable modules."
          />
        )}
      </div>
    </section>
  );
}
