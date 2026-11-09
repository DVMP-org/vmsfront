"use client";

import { useMemo, type ReactNode } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  RefreshCcw,
  ShieldCheck,
  Ticket,
  UserCheck,
  UserCog,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  MetricStrip,
  PanelState,
  ReportPanel,
  StaleDataBanner,
} from "@/features/dashboard/DashboardPrimitives";
import { useAdminAnalyticsSummary } from "@/hooks/use-admin";
import { formatDate } from "@/lib/utils";
import type { AnalyticsTimeSeriesPoint } from "@/types";

const numberFormatter = new Intl.NumberFormat();
const formatNumber = (value?: number) => numberFormatter.format(value ?? 0);
const formatSignedNumber = (value: number) =>
  `${value > 0 ? "+" : value < 0 ? "-" : ""}${formatNumber(Math.abs(value))}`;

function formatDateLabel(date: string) {
  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "2-digit",
  });
}

type TooltipPayload = {
  color?: string;
  name?: string;
  value?: number;
};

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] bg-[var(--vms-surface)] px-3 py-2 text-xs shadow-[var(--vms-shadow-raised)]">
      <p className="mb-2 font-semibold text-[var(--vms-ink)]">{label}</p>
      <div className="space-y-1.5">
        {payload.map((item) => (
          <div
            key={item.name}
            className="flex min-w-40 items-center justify-between gap-5"
          >
            <span className="flex items-center gap-2 text-[var(--vms-ink-muted)]">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              {item.name}
            </span>
            <span className="font-semibold tabular-nums">
              {formatNumber(item.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-live="polite">
      <span className="sr-only">Loading analytics</span>
      <Skeleton className="h-24 w-full" />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.7fr)]">
        <Skeleton className="h-80 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    </div>
  );
}

function ChartDataTable({
  label,
  columns,
  rows,
}: {
  label: string;
  columns: Array<{ key: string; label: string }>;
  rows: Array<Record<string, string | number>>;
}) {
  return (
    <details className="border-t border-[var(--vms-line)] px-4 py-3 sm:px-5">
      <summary className="cursor-pointer text-xs font-semibold text-[var(--vms-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)] focus-visible:ring-offset-2">
        View chart data
      </summary>
      <div
        className="mt-3 overflow-x-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]"
        role="region"
        aria-label={`${label} data`}
        tabIndex={0}
      >
        <table className="w-full min-w-[480px] border-collapse text-left text-xs">
          <caption className="sr-only">{label}</caption>
          <thead>
            <tr className="border-b border-[var(--vms-line)]">
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className="px-2 py-2 font-semibold text-[var(--vms-ink-muted)]"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={String(row[columns[0].key] ?? index)}
                className="border-b border-[var(--vms-line)] last:border-0"
              >
                {columns.map((column) => (
                  <td key={column.key} className="px-2 py-2 tabular-nums">
                    {typeof row[column.key] === "number"
                      ? formatNumber(row[column.key] as number)
                      : String(row[column.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-xl font-semibold tracking-[-0.02em] text-[var(--vms-ink)]">
          {title}
        </h2>
        <p className="mt-1 text-sm text-[var(--vms-ink-muted)]">
          {description}
        </p>
      </div>
      {children}
    </section>
  );
}

function Highlight({
  label,
  value,
  helper,
  attention = false,
}: {
  label: string;
  value: string;
  helper: string;
  attention?: boolean;
}) {
  return (
    <div className="rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.07em] text-[var(--vms-ink-muted)]">
        {label}
      </p>
      <p
        className={`mt-2 text-2xl font-semibold tabular-nums tracking-[-0.03em] ${
          attention ? "text-[var(--vms-warning)]" : "text-[var(--vms-ink)]"
        }`}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-[var(--vms-ink-muted)]">{helper}</p>
    </div>
  );
}

export default function AnalyticsPage() {
  const {
    data: analytics,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useAdminAnalyticsSummary();

  const approvalRate = useMemo(() => {
    if (!analytics || analytics.total_checkpoint_events === 0) return 0;
    return (
      (analytics.total_checkpoint_events_allowed /
        analytics.total_checkpoint_events) *
      100
    );
  }, [analytics]);

  const denialRate = useMemo(() => {
    if (!analytics || analytics.total_checkpoint_events === 0) return 0;
    return (
      (analytics.total_checkpoint_events_denied /
        analytics.total_checkpoint_events) *
      100
    );
  }, [analytics]);

  const trendSeries = useMemo(() => {
    if (!analytics?.time_series) return [];
    const entries = new Map<
      string,
      {
        date: string;
        places: number;
        relationships: number;
        visitAuthorizations: number;
      }
    >();
    const ingest = (
      key: "places" | "relationships" | "visitAuthorizations",
      data: AnalyticsTimeSeriesPoint[] | undefined,
    ) => {
      (data ?? []).forEach((point) => {
        const date = point.date.slice(0, 10);
        const current = entries.get(date) ?? {
          date,
          places: 0,
          relationships: 0,
          visitAuthorizations: 0,
        };
        current[key] = point.count;
        entries.set(date, current);
      });
    };
    ingest("places", analytics.time_series.places);
    ingest("relationships", analytics.time_series.relationships);
    ingest("visitAuthorizations", analytics.time_series.visit_authorizations);
    return Array.from(entries.values())
      .sort((left, right) => left.date.localeCompare(right.date))
      .map((point) => ({ ...point, label: formatDateLabel(point.date) }));
  }, [analytics]);

  const decisionSeries = useMemo(() => {
    if (!analytics?.time_series) return [];
    const dates = new Set<string>();
    analytics.time_series.allowed_passages.forEach((item) =>
      dates.add(item.date.slice(0, 10)),
    );
    analytics.time_series.denied_passages.forEach((item) =>
      dates.add(item.date.slice(0, 10)),
    );
    return Array.from(dates)
      .sort()
      .map((date) => ({
        date,
        label: formatDateLabel(date),
        allowed:
          analytics.time_series?.allowed_passages.find(
            (item) => item.date.slice(0, 10) === date,
          )?.count ?? 0,
        denied:
          analytics.time_series?.denied_passages.find(
            (item) => item.date.slice(0, 10) === date,
          )?.count ?? 0,
      }));
  }, [analytics]);

  const topDecisionDays = useMemo(
    () =>
      analytics?.time_series
        ? [...analytics.time_series.checkpoint_events]
            .sort((left, right) => right.count - left.count)
            .slice(0, 5)
        : [],
    [analytics],
  );

  const decisions = useMemo(() => {
    const allowed = analytics?.time_series?.allowed_passages ?? [];
    const denied = analytics?.time_series?.denied_passages ?? [];
    const totalAllowed = allowed.reduce((sum, item) => sum + item.count, 0);
    const totalDenied = denied.reduce((sum, item) => sum + item.count, 0);
    return {
      totalAllowed,
      totalDenied,
      averageAllowed: allowed.length ? totalAllowed / allowed.length : 0,
      averageDenied: denied.length ? totalDenied / denied.length : 0,
    };
  }, [analytics]);

  const authorizationPeak = useMemo(
    () =>
      analytics?.time_series?.visit_authorizations.reduce<AnalyticsTimeSeriesPoint | null>(
        (highest, point) =>
          !highest || point.count > highest.count ? point : highest,
        null,
      ) ?? null,
    [analytics],
  );

  const header = (
    <PageHeader
      eyebrow="Operations Hub / Reporting"
      title="Analytics"
      description="Exact access and relationship activity for the selected property context, summarized for decisions and backed by tabular detail."
      primaryAction={
        <Button
          variant="secondary"
          onClick={() => refetch()}
          isLoading={isFetching}
        >
          {!isFetching ? <RefreshCcw className="h-4 w-4" aria-hidden /> : null}
          Refresh data
        </Button>
      }
    />
  );

  if (isLoading && !analytics) {
    return (
      <div className="space-y-4 pb-10 text-[var(--vms-ink)]">
        {header}
        <AnalyticsSkeleton />
      </div>
    );
  }

  if (isError && !analytics) {
    return (
      <div className="space-y-4 pb-10 text-[var(--vms-ink)]">
        {header}
        <div className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)]">
          <PanelState
            kind="error"
            title="Unable to load analytics"
            description="The analytics summary could not be requested. Retry before treating the property as inactive."
            onRetry={() => refetch()}
            isRetrying={isFetching}
          />
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="space-y-4 pb-10 text-[var(--vms-ink)]">
        {header}
        <div className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)]">
          <PanelState
            kind="empty"
            title="No analytics yet"
            description="Activity will appear after relationship, invitation or checkpoint records are created."
            onRetry={() => refetch()}
            isRetrying={isFetching}
          />
        </div>
      </div>
    );
  }

  const observationDays =
    analytics.time_series?.checkpoint_events.length ||
    analytics.time_series?.allowed_passages.length ||
    0;
  const decisionDifference = decisions.totalAllowed - decisions.totalDenied;

  return (
    <div className="space-y-4 pb-10 text-[var(--vms-ink)]">
      {header}

      {isError ? (
        <StaleDataBanner
          message="The latest analytics refresh failed. The last successful summary remains visible."
          onRetry={() => refetch()}
          isRetrying={isFetching}
        />
      ) : null}

      <MetricStrip
        metrics={[
          {
            label: "People",
            value: formatNumber(analytics.total_parties),
            detail: "Party records in this organization",
            icon: Users,
          },
          {
            label: "Properties",
            value: formatNumber(analytics.total_places),
            detail: `${formatNumber(analytics.total_active_relationships)} active relationships`,
            icon: Building2,
          },
          {
            label: "Visit authorizations",
            value: formatNumber(analytics.total_visit_authorizations),
            detail: `${formatNumber(analytics.total_visit_sessions)} visit sessions`,
            icon: Ticket,
          },
          {
            label: "Checkpoint events",
            value: formatNumber(analytics.total_checkpoint_events),
            detail: `${approvalRate.toFixed(1)}% allowed`,
            icon: Activity,
          },
          {
            label: "Denied",
            value: formatNumber(analytics.total_checkpoint_events_denied),
            detail: `${denialRate.toFixed(1)}% of decisions`,
            icon: UserCheck,
            attention: analytics.total_checkpoint_events_denied > 0,
          },
          {
            label: "Administrators",
            value: formatNumber(analytics.total_admins),
            detail: `${formatNumber(analytics.total_roles)} assigned roles`,
            icon: UserCog,
          },
        ]}
      />

      <Section
        title="Activity"
        description="Property, relationship and visit-authorization activity across the available observation window."
      >
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,0.7fr)]">
          <ReportPanel
            title="Activity trend"
            description="Properties, relationships and visit authorizations by day."
          >
            {trendSeries.length ? (
              <>
                <div
                  className="h-80 p-3 sm:p-5"
                  role="img"
                  aria-label="Line chart comparing daily properties, relationships and visit authorizations"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendSeries}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--vms-line)"
                      />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="visitAuthorizations"
                        name="Visit authorizations"
                        stroke="var(--vms-data-primary)"
                        strokeWidth={2.5}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="places"
                        name="Places"
                        stroke="var(--vms-data-secondary)"
                        strokeWidth={1.75}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="relationships"
                        name="Relationships"
                        stroke="var(--vms-data-tertiary)"
                        strokeWidth={1.75}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <ChartDataTable
                  label="Daily activity"
                  columns={[
                    { key: "label", label: "Day" },
                    {
                      key: "visitAuthorizations",
                      label: "Visit authorizations",
                    },
                    { key: "places", label: "Places" },
                    { key: "relationships", label: "Relationships" },
                  ]}
                  rows={trendSeries}
                />
              </>
            ) : (
              <PanelState
                kind="empty"
                compact
                title="No activity points"
                description="No daily property, relationship or visit-authorization series was returned."
              />
            )}
          </ReportPanel>

          <ReportPanel
            title="Activity highlights"
            description="Exact callouts from the current observation window."
          >
            <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-1">
              <Highlight
                label="Busiest authorization day"
                value={
                  authorizationPeak
                    ? `${formatNumber(authorizationPeak.count)} authorizations`
                    : "No activity"
                }
                helper={
                  authorizationPeak
                    ? formatDate(authorizationPeak.date)
                    : "No dates available"
                }
              />
              <Highlight
                label="Busiest checkpoint day"
                value={
                  topDecisionDays[0]
                    ? `${formatNumber(topDecisionDays[0].count)} events`
                    : "No activity"
                }
                helper={
                  topDecisionDays[0]
                    ? formatDate(topDecisionDays[0].date)
                    : "No dates available"
                }
              />
              <Highlight
                label="Average allowed"
                value={decisions.averageAllowed.toFixed(1)}
                helper={`Across ${observationDays || 0} observed days`}
              />
              <Highlight
                label="Allowed minus denied"
                value={formatSignedNumber(decisionDifference)}
                helper="Decision balance"
                attention={decisionDifference < 0}
              />
            </div>
          </ReportPanel>
        </div>
      </Section>

      <Section
        title="Access control"
        description="Decision quality and movement balance across recorded checkpoint events."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <ReportPanel
            title="Decision quality"
            description="Allowed and denied gate decisions, with exact totals."
          >
            <div className="space-y-5 p-5">
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-[var(--vms-ink-muted)]">
                    <ShieldCheck className="h-4 w-4 text-[var(--vms-success)]" />
                    Allowed
                  </span>
                  <span className="font-semibold tabular-nums">
                    {formatNumber(analytics.total_checkpoint_events_allowed)} ·{" "}
                    {approvalRate.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--vms-surface-subtle)]">
                  <div
                    className="h-full rounded-full bg-[var(--vms-success)] motion-reduce:transition-none"
                    style={{ width: `${Math.min(approvalRate, 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-[var(--vms-ink-muted)]">
                    <ArrowDownRight className="h-4 w-4 text-[var(--vms-danger)]" />
                    Denied
                  </span>
                  <span className="font-semibold tabular-nums">
                    {formatNumber(analytics.total_checkpoint_events_denied)} ·{" "}
                    {denialRate.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--vms-surface-subtle)]">
                  <div
                    className="h-full rounded-full bg-[var(--vms-danger)] motion-reduce:transition-none"
                    style={{ width: `${Math.min(denialRate, 100)}%` }}
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Highlight
                  label="Decision total"
                  value={formatNumber(analytics.total_checkpoint_events)}
                  helper="Recorded checkpoint events"
                />
                <Highlight
                  label="Checkpoint events per admin"
                  value={
                    analytics.total_admins
                      ? (
                          analytics.total_checkpoint_events /
                          analytics.total_admins
                        ).toFixed(1)
                      : "—"
                  }
                  helper="Current administrator count"
                />
              </div>
            </div>
          </ReportPanel>

          <ReportPanel
            title="Decision flow"
            description="Daily allowed and denied checkpoint decisions."
          >
            {decisionSeries.length ? (
              <>
                <div
                  className="h-64 p-3 sm:p-5"
                  role="img"
                  aria-label="Bar chart comparing daily allowed and denied checkpoint decisions"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={decisionSeries}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--vms-line)"
                      />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend />
                      <Bar
                        dataKey="allowed"
                        name="Allowed"
                        fill="var(--vms-data-primary)"
                        radius={[3, 3, 0, 0]}
                      />
                      <Bar
                        dataKey="denied"
                        name="Denied"
                        fill="var(--vms-data-secondary)"
                        radius={[3, 3, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <ChartDataTable
                  label="Daily access decisions"
                  columns={[
                    { key: "label", label: "Day" },
                    { key: "allowed", label: "Allowed" },
                    { key: "denied", label: "Denied" },
                  ]}
                  rows={decisionSeries}
                />
                <div className="grid grid-cols-2 gap-3 border-t border-[var(--vms-line)] p-4">
                  <Highlight
                    label="Total allowed"
                    value={formatNumber(decisions.totalAllowed)}
                    helper={`${decisions.averageAllowed.toFixed(1)} average/day`}
                  />
                  <Highlight
                    label="Total denied"
                    value={formatNumber(decisions.totalDenied)}
                    helper={`${decisions.averageDenied.toFixed(1)} average/day`}
                  />
                </div>
              </>
            ) : (
              <PanelState
                kind="empty"
                compact
                title="No decision-flow points"
                description="No allowed or denied checkpoint series was returned."
              />
            )}
          </ReportPanel>
        </div>
      </Section>

      <Section
        title="High-velocity days"
        description="Days with the highest recorded checkpoint-event volume."
      >
        <ReportPanel
          title="Top checkpoint-event days"
          description="Ordered by daily event volume; this is not a performance score."
        >
          {topDecisionDays.length ? (
            <ol className="divide-y divide-[var(--vms-line)]">
              {topDecisionDays.map((day, index) => (
                <li
                  key={day.date}
                  className="grid min-h-16 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-5"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-full border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] text-xs font-semibold tabular-nums">
                    {index + 1}
                  </span>
                  <span>
                    <strong className="block text-sm font-semibold">
                      {formatDate(day.date)}
                    </strong>
                    <span className="text-xs text-[var(--vms-ink-muted)]">
                      {index === 0
                        ? "Highest observed day"
                        : `Rank ${index + 1}`}
                    </span>
                  </span>
                  <span className="flex items-center gap-1 text-lg font-semibold tabular-nums">
                    <ArrowUpRight className="h-4 w-4 text-[var(--vms-ink-muted)]" />
                    {formatNumber(day.count)}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <PanelState
              kind="empty"
              compact
              title="No checkpoint-volume data"
              description="Daily checkpoint-event counts will appear after decisions are recorded."
            />
          )}
        </ReportPanel>
      </Section>
    </div>
  );
}
