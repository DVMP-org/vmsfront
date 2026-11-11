"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Layers,
  Loader2,
  PauseCircle,
  PlugZap,
  RefreshCw,
  Search,
  Settings2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  IntegrationStatusToggle,
  IntegrationTypeIcon,
} from "../integrations/components";
import {
  useDisableIntegration,
  useEnableIntegration,
  useIntegrations,
} from "@/hooks/use-integrations";
import {
  Integration,
  IntegrationType,
  INTEGRATION_TYPE_LABELS,
} from "@/types/integration";
import { cn, titleCase } from "@/lib/utils";

type StatusFilter = "all" | "connected" | "needs-setup" | "paused";

const STATUS_FILTERS: Array<{ id: StatusFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "connected", label: "Connected" },
  { id: "needs-setup", label: "Needs setup" },
  { id: "paused", label: "Paused" },
];

const TYPE_ORDER = Object.keys(INTEGRATION_TYPE_LABELS) as IntegrationType[];

function integrationStatus(integration: Integration) {
  if (integration.enabled) {
    return {
      label: "Connected",
      tone: "success" as const,
      icon: <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />,
    };
  }
  if (integration.configured) {
    return {
      label: "Paused",
      tone: "neutral" as const,
      icon: <PauseCircle className="h-3.5 w-3.5" aria-hidden="true" />,
    };
  }
  return {
    label: "Needs setup",
    tone: "warning" as const,
    icon: <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />,
  };
}

function matchesSearch(integration: Integration, query: string) {
  if (!query) return true;
  const haystack = [
    integration.name,
    integration.description ?? "",
    INTEGRATION_TYPE_LABELS[integration.provider] ?? "",
    integration.provider,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

export default function IntegrationsSection({
  embedded = false,
}: {
  /**
   * Organization settings already render the page title and tabs, so the
   * shared catalog suppresses its own masthead there.
   */
  embedded?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const basePath = pathname?.startsWith("/organization/integrations")
    ? "/organization/integrations"
    : pathname?.startsWith("/organization")
      ? "/organization/settings/integrations"
      : "/admin/integrations";

  const { data, isLoading, isError, isFetching, refetch } = useIntegrations({
    page: 1,
    pageSize: 100,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<IntegrationType | "">("");

  const enableMutation = useEnableIntegration();
  const disableMutation = useDisableIntegration();

  const items = data?.items;
  const integrations = useMemo(() => items ?? [], [items]);

  const counts = useMemo(() => {
    const connected = integrations.filter((item) => item.enabled).length;
    const configured = integrations.filter((item) => item.configured).length;
    return {
      total: integrations.length,
      connected,
      configured,
      needsSetup: integrations.length - configured,
      categories: new Set(integrations.map((item) => item.provider)).size,
    };
  }, [integrations]);

  const availableTypes = useMemo(() => {
    const present = new Set(integrations.map((item) => item.provider));
    return TYPE_ORDER.filter((type) => present.has(type));
  }, [integrations]);

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const rows = integrations.filter((integration) => {
      if (typeFilter && integration.provider !== typeFilter) return false;
      if (statusFilter === "connected" && !integration.enabled) return false;
      if (statusFilter === "needs-setup" && integration.configured) return false;
      if (
        statusFilter === "paused" &&
        (!integration.configured || integration.enabled)
      ) {
        return false;
      }
      return matchesSearch(integration, query);
    });

    return rows.sort((left, right) => {
      const rank = (item: Integration) =>
        item.enabled ? 0 : item.configured ? 1 : 2;
      const rankDelta = rank(left) - rank(right);
      if (rankDelta !== 0) return rankDelta;
      return titleCase(left.name).localeCompare(titleCase(right.name));
    });
  }, [integrations, searchQuery, statusFilter, typeFilter]);

  const hasActiveFilters =
    Boolean(searchQuery.trim()) || statusFilter !== "all" || Boolean(typeFilter);
  const togglingName = enableMutation.isPending
    ? enableMutation.variables
    : disableMutation.isPending
      ? disableMutation.variables
      : undefined;
  const mutationError = enableMutation.error ?? disableMutation.error;

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setTypeFilter("");
  };

  const handleToggle = (integration: Integration) => {
    if (integration.enabled) {
      disableMutation.mutate(integration.name);
    } else {
      enableMutation.mutate(integration.name);
    }
  };

  return (
    <div className="space-y-5 text-[var(--vms-ink)]">
      {embedded ? null : (
        <PageHeader
          eyebrow="Organization administration"
          title="Integrations"
          description="Connect messaging, payments, access control and data providers once, then share them across every active place in this organization."
          primaryAction={
            <Button asChild variant="outline">
              <Link href="/admin/plugins">Browse plugins</Link>
            </Button>
          }
        />
      )}

      <section
        aria-label="Integration summary"
        className="overflow-hidden rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)]"
      >
        <dl className="grid grid-cols-2 divide-x divide-y divide-[var(--vms-line)] sm:grid-cols-4 sm:divide-y-0">
          <SummaryCell label="Connected" value={counts.connected} hint="Live for this organization" />
          <SummaryCell label="Configured" value={counts.configured} hint="Credentials saved" />
          <SummaryCell label="Needs setup" value={counts.needsSetup} hint="Awaiting credentials" />
          <SummaryCell label="Categories" value={counts.categories} hint="Provider types" />
        </dl>
      </section>

      <section
        aria-label="Integration filters"
        className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
      >
        <div
          role="group"
          aria-label="Filter by connection status"
          className="inline-flex w-fit flex-wrap gap-1 rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-1"
        >
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              aria-pressed={statusFilter === filter.id}
              onClick={() => setStatusFilter(filter.id)}
              className={cn(
                "min-h-8 rounded-[var(--vms-radius-control)] px-3 text-xs font-semibold transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]",
                statusFilter === filter.id
                  ? "bg-[var(--vms-action)] text-[var(--vms-on-action)]"
                  : "text-[var(--vms-ink-muted)] hover:bg-[var(--vms-surface-subtle)] hover:text-[var(--vms-ink)]",
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="w-full lg:max-w-sm">
          <Input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search integrations"
            aria-label="Search integrations"
            leftNode={<Search className="h-4 w-4" aria-hidden="true" />}
            rightNode={
              searchQuery ? (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setSearchQuery("")}
                  className="grid h-8 w-8 place-items-center rounded-[var(--vms-radius-control)] text-[var(--vms-ink-muted)] hover:bg-[var(--vms-surface-subtle)] hover:text-[var(--vms-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              ) : undefined
            }
          />
        </div>
      </section>

      {availableTypes.length ? (
        <div
          role="group"
          aria-label="Filter by category"
          className="flex flex-wrap gap-2"
        >
          <CategoryChip
            active={typeFilter === ""}
            onClick={() => setTypeFilter("")}
          >
            All categories
          </CategoryChip>
          {availableTypes.map((type) => (
            <CategoryChip
              key={type}
              active={typeFilter === type}
              onClick={() => setTypeFilter(typeFilter === type ? "" : type)}
            >
              {INTEGRATION_TYPE_LABELS[type]}
            </CategoryChip>
          ))}
        </div>
      ) : null}

      {mutationError ? (
        <InlineAlert tone="danger" title="That change could not be saved">
          {mutationError instanceof Error
            ? mutationError.message
            : "Try again in a moment."}
        </InlineAlert>
      ) : null}

      {isError ? (
        <InlineAlert
          tone="danger"
          title="Integrations could not be loaded"
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              leftNode={<RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />}
            >
              Retry
            </Button>
          }
        >
          Check your connection and try again. Existing connections are not
          affected.
        </InlineAlert>
      ) : null}

      {isLoading ? (
        <div
          role="status"
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          <span className="sr-only">Loading integrations</span>
          {[0, 1, 2, 3, 4, 5].map((key) => (
            <div
              key={key}
              className="h-56 animate-pulse rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] motion-reduce:animate-none"
            />
          ))}
        </div>
      ) : !isError && !filtered.length ? (
        <div className="rounded-[var(--vms-radius-surface)] border border-dashed border-[var(--vms-line-strong)] bg-[var(--vms-surface)]">
          <EmptyState
            icon={PlugZap}
            title={
              hasActiveFilters
                ? "No integrations match these filters"
                : "No integrations available yet"
            }
            description={
              hasActiveFilters
                ? "Try a different category or clear the filters to see every provider."
                : "Providers appear here once they are registered for this organization."
            }
            action={
              hasActiveFilters ? (
                <Button variant="outline" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3 text-xs text-[var(--vms-ink-muted)]">
            <p aria-live="polite">
              Showing {filtered.length} of {counts.total} integration
              {counts.total === 1 ? "" : "s"}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="inline-flex min-h-8 items-center gap-1.5 rounded-[var(--vms-radius-control)] px-2 font-semibold hover:bg-[var(--vms-surface-subtle)] hover:text-[var(--vms-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)] disabled:opacity-50"
            >
              {isFetching ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {isFetching ? "Refreshing…" : "Refresh"}
            </button>
          </div>

          <ul className="grid list-none gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((integration) => (
              <li key={integration.id} className="min-w-0">
                <IntegrationCard
                  integration={integration}
                  isToggling={togglingName === integration.name}
                  onConfigure={() =>
                    router.push(`${basePath}/${integration.id}`)
                  }
                  onToggle={() => handleToggle(integration)}
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function SummaryCell({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <div className="px-4 py-3.5">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--vms-ink-muted)]">
        {label}
      </dt>
      <dd className="mt-1 flex items-baseline gap-2">
        <span className="text-2xl font-semibold leading-8 tabular-nums">
          {value}
        </span>
        <span className="text-[11px] leading-4 text-[var(--vms-ink-muted)]">
          {hint}
        </span>
      </dd>
    </div>
  );
}

function CategoryChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-8 items-center rounded-full border px-3 text-xs font-semibold transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)] focus-visible:ring-offset-1",
        active
          ? "border-[var(--vms-action)] bg-[var(--vms-action)] text-[var(--vms-on-action)]"
          : "border-[var(--vms-line)] bg-[var(--vms-surface)] text-[var(--vms-ink-muted)] hover:border-[var(--vms-line-strong)] hover:text-[var(--vms-ink)]",
      )}
    >
      {children}
    </button>
  );
}

function IntegrationCard({
  integration,
  isToggling,
  onConfigure,
  onToggle,
}: {
  integration: Integration;
  isToggling: boolean;
  onConfigure: () => void;
  onToggle: () => void;
}) {
  const name = titleCase(integration.name);
  const status = integrationStatus(integration);

  return (
    <article className="flex h-full min-w-0 flex-col rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-5 transition-[border-color,box-shadow] duration-[var(--vms-motion)] hover:border-[var(--vms-line-strong)] hover:shadow-[0_1px_2px_rgb(0_0_0_/_0.05)]">
      <div className="flex items-start justify-between gap-3">
        <IntegrationTypeIcon
          type={integration.provider}
          logoUrl={integration.logo_url}
        />
        <StatusBadge tone={status.tone} icon={status.icon}>
          {status.label}
        </StatusBadge>
      </div>

      <h2 className="mt-4 break-words text-[15px] font-semibold leading-6">
        {name}
      </h2>
      <p className="mt-0.5 text-xs text-[var(--vms-ink-muted)]">
        {INTEGRATION_TYPE_LABELS[integration.provider] ?? "Other"}{" "}
        <span aria-hidden="true">·</span> Organization-wide
      </p>
      <p className="mt-3 line-clamp-3 flex-1 text-sm leading-6 text-[var(--vms-ink-muted)]">
        {integration.description || "Provider connection for this organization."}
      </p>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--vms-line)] pt-4">
        <div className="min-w-0">
          {integration.configured ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-[var(--vms-ink-muted)]">
              <Settings2 className="h-3.5 w-3.5" aria-hidden="true" />
              Credentials saved
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs text-[var(--vms-ink-muted)]">
              <Layers className="h-3.5 w-3.5" aria-hidden="true" />
              Available on your plan
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {integration.configured ? (
            <>
              <Button variant="outline" size="sm" onClick={onConfigure}>
                Configure
              </Button>
              <IntegrationStatusToggle
                enabled={integration.enabled}
                onToggle={onToggle}
                disabled={isToggling}
                showLabel={false}
                size="sm"
                label={`${integration.enabled ? "Disable" : "Enable"} ${name}`}
              />
            </>
          ) : (
            <Button size="sm" onClick={onConfigure}>
              Set up
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
