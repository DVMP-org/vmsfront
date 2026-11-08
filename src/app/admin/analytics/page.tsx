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
        <p className="mt-1 text-sm text-[var(--vms-ink-muted)]">{description}</p>
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
    if (!analytics || analytics.total_gate_events === 0) return 0;
    return (
      (analytics.total_gate_events_approved / analytics.total_gate_events) * 100
    );
  }, [analytics]);

  const denialRate = useMemo(() => {
    if (!analytics || analytics.total_gate_events === 0) return 0;
    return (
      (analytics.total_gate_events_denied / analytics.total_gate_events) * 100
    );
  }, [analytics]);

  const trendSeries = useMemo(() => {
    if (!analytics) return [];
    const entries = new Map<
      string,
      { date: string; residencies: number; gatePasses: number; visitors: number }
    >();
    const ingest = (
      key: "residencies" | "gatePasses" | "visitors",
      data: AnalyticsTimeSeriesPoint[],
    ) => {
      data.forEach((point) => {
        const current = entries.get(point.date) ?? {
          date: point.date,
          residencies: 0,
          gatePasses: 0,
          visitors: 0,
        };
        current[key] = point.count;
        entries.set(point.date, current);
      });
    };
    ingest("residencies", analytics.time_series.residencies);
    ingest("gatePasses", analytics.time_series.gate_passes);
    ingest("visitors", analytics.time_series.visitors);
    return Array.from(entries.values())
      .sort((left, right) => left.date.localeCompare(right.date))
      .map((point) => ({ ...point, label: formatDateLabel(point.date) }));
  }, [analytics]);

  const gateFlowSeries = useMemo(() => {
    if (!analytics) return [];
    const dates = new Set<string>();
    analytics.time_series.checkins.forEach((item) => dates.add(item.date));
    analytics.time_series.checkouts.forEach((item) => dates.add(item.date));
    return Array.from(dates)
      .sort()
      .map((date) => ({
        date,
        label: formatDateLabel(date),
        checkins:
          analytics.time_series.checkins.find((item) => item.date === date)
            ?.count ?? 0,
        checkouts:
          analytics.time_series.checkouts.find((item) => item.date === date)
            ?.count ?? 0,
      }));
  }, [analytics]);

  const topGateDays = useMemo(
    () =>
      analytics
        ? [...analytics.time_series.gate_passes]
            .sort((left, right) => right.count - left.count)
            .slice(0, 5)
        : [],
    [analytics],
  );

  const movement = useMemo(() => {
    const checkins = analytics?.time_series.checkins ?? [];
    const checkouts = analytics?.time_series.checkouts ?? [];
    const totalCheckins = checkins.reduce((sum, item) => sum + item.count, 0);
    const totalCheckouts = checkouts.reduce((sum, item) => sum + item.count, 0);
    return {
      totalCheckins,
      totalCheckouts,
      averageCheckins: checkins.length ? totalCheckins / checkins.length : 0,
      averageCheckouts: checkouts.length
        ? totalCheckouts / checkouts.length
        : 0,
    };
  }, [analytics]);

  const visitorSpike = useMemo(
    () =>
      analytics?.time_series.visitors.reduce<AnalyticsTimeSeriesPoint | null>(
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
          {!isFetching ? (
            <RefreshCcw className="h-4 w-4" aria-hidden />
          ) : null}
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
    analytics.time_series.gate_passes.length ||
    analytics.time_series.checkins.length;
  const netFlow = movement.totalCheckins - movement.totalCheckouts;

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
            value: formatNumber(analytics.total_residents),
            detail: "Active person records",
            icon: Users,
          },
          {
            label: "Occupancy relationships",
            value: formatNumber(analytics.total_residencies),
            detail: `${formatNumber(analytics.total_visitors)} visitor records`,
            icon: Building2,
          },
          {
            label: "Gate passes",
            value: formatNumber(analytics.total_gate_passes),
            detail: "Issued access passes",
            icon: Ticket,
          },
          {
            label: "Gate events",
            value: formatNumber(analytics.total_gate_events),
            detail: `${approvalRate.toFixed(1)}% approved`,
            icon: Activity,
          },
          {
            label: "Denied",
            value: formatNumber(analytics.total_gate_events_denied),
            detail: `${denialRate.toFixed(1)}% of decisions`,
            icon: UserCheck,
            attention: analytics.total_gate_events_denied > 0,
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
        description="Relationship and visitor activity across the available observation window."
      >
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,0.7fr)]">
          <ReportPanel
            title="Activity trend"
            description="Gate passes, visitors and occupancy relationships by day."
          >
            {trendSeries.length ? (
              <>
                <div
                  className="h-80 p-3 sm:p-5"
                  role="img"
                  aria-label="Line chart comparing daily gate passes, visitors and occupancy relationships"
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
                        dataKey="gatePasses"
                        name="Gate passes"
                        stroke="var(--vms-data-primary)"
                        strokeWidth={2.5}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="visitors"
                        name="Visitors"
                        stroke="var(--vms-data-secondary)"
                        strokeWidth={1.75}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="residencies"
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
                    { key: "gatePasses", label: "Gate passes" },
                    { key: "visitors", label: "Visitors" },
                    { key: "residencies", label: "Relationships" },
                  ]}
                  rows={trendSeries}
                />
              </>
            ) : (
              <PanelState
                kind="empty"
                compact
                title="No activity points"
                description="No daily gate-pass, visitor or relationship series was returned."
              />
            )}
          </ReportPanel>

          <ReportPanel
            title="Activity highlights"
            description="Exact callouts from the current observation window."
          >
            <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-1">
              <Highlight
                label="Busiest visitor day"
                value={
                  visitorSpike
                    ? `${formatNumber(visitorSpike.count)} visitors`
                    : "No activity"
                }
                helper={
                  visitorSpike ? formatDate(visitorSpike.date) : "No dates available"
                }
              />
              <Highlight
                label="Busiest gate-pass day"
                value={
                  topGateDays[0]
                    ? `${formatNumber(topGateDays[0].count)} passes`
                    : "No activity"
                }
                helper={
                  topGateDays[0]
                    ? formatDate(topGateDays[0].date)
                    : "No dates available"
                }
              />
              <Highlight
                label="Average check-ins"
                value={movement.averageCheckins.toFixed(1)}
                helper={`Across ${observationDays || 0} observed days`}
              />
              <Highlight
                label="Net flow"
                value={formatSignedNumber(netFlow)}
                helper="Entries minus exits"
                attention={netFlow < 0}
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
                    Approved
                  </span>
                  <span className="font-semibold tabular-nums">
                    {formatNumber(analytics.total_gate_events_approved)} ·{" "}
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
                    {formatNumber(analytics.total_gate_events_denied)} ·{" "}
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
                  value={formatNumber(analytics.total_gate_events)}
                  helper="Recorded checkpoint events"
                />
                <Highlight
                  label="Gate events per admin"
                  value={
                    analytics.total_admins
                      ? (
                          analytics.total_gate_events /
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
            title="Gate flow"
            description="Daily check-in and check-out balance."
          >
            {gateFlowSeries.length ? (
              <>
                <div
                  className="h-64 p-3 sm:p-5"
                  role="img"
                  aria-label="Bar chart comparing daily check-ins and check-outs"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={gateFlowSeries}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--vms-line)"
                      />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend />
                      <Bar
                        dataKey="checkins"
                        name="Check-ins"
                        fill="var(--vms-data-primary)"
                        radius={[3, 3, 0, 0]}
                      />
                      <Bar
                        dataKey="checkouts"
                        name="Check-outs"
                        fill="var(--vms-data-secondary)"
                        radius={[3, 3, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <ChartDataTable
                  label="Daily gate flow"
                  columns={[
                    { key: "label", label: "Day" },
                    { key: "checkins", label: "Check-ins" },
                    { key: "checkouts", label: "Check-outs" },
                  ]}
                  rows={gateFlowSeries}
                />
                <div className="grid grid-cols-2 gap-3 border-t border-[var(--vms-line)] p-4">
                  <Highlight
                    label="Total check-ins"
                    value={formatNumber(movement.totalCheckins)}
                    helper={`${movement.averageCheckins.toFixed(1)} average/day`}
                  />
                  <Highlight
                    label="Total check-outs"
                    value={formatNumber(movement.totalCheckouts)}
                    helper={`${movement.averageCheckouts.toFixed(1)} average/day`}
                  />
                </div>
              </>
            ) : (
              <PanelState
                kind="empty"
                compact
                title="No gate-flow points"
                description="No check-in or check-out series was returned."
              />
            )}
          </ReportPanel>
        </div>
      </Section>

      <Section
        title="High-velocity days"
        description="Days with the highest recorded pass creation volume."
      >
        <ReportPanel
          title="Top gate-pass days"
          description="Ordered by daily pass volume; this is not a performance score."
        >
          {topGateDays.length ? (
            <ol className="divide-y divide-[var(--vms-line)]">
              {topGateDays.map((day, index) => (
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
                      {index === 0 ? "Highest observed day" : `Rank ${index + 1}`}
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
              title="No pass-volume data"
              description="Daily gate-pass counts will appear after passes are issued."
            />
          )}
        </ReportPanel>
      </Section>
    </div>
  );
}
