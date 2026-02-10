"use client";

import { useMemo, type ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { useAdminAnalyticsSummary } from "@/hooks/use-admin";
import { formatDate } from "@/lib/utils";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import {
  RefreshCcw,
  Users,
  Home,
  Ticket,
  UserCheck,
  Activity,
  ShieldCheck,
  ShieldX,
  UserCog,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

const numberFormatter = new Intl.NumberFormat("en-US");
const formatNumber = (value?: number) => numberFormatter.format(value ?? 0);
const formatSignedNumber = (value: number) =>
  `${value > 0 ? "+" : value < 0 ? "-" : ""}${formatNumber(Math.abs(value))}`;

const formatDateLabel = (date: string) =>
  new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
  });

type TooltipPayload = {
  color: string;
  name: string;
  value: number;
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
    <div className="rounded-lg border bg-background/95 backdrop-blur-sm px-3 py-2 text-xs shadow-lg">
      <p className="mb-2 font-semibold text-foreground">{label}</p>
      <div className="space-y-1.5">
        {payload.map((item) => (
          <div
            key={item.name}
            className="flex items-center justify-between gap-6"
          >
            <span className="flex items-center gap-2 text-muted-foreground">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              {item.name}
            </span>
            <span className="font-semibold text-foreground">
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
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 9 }).map((_, index) => (
          <Card key={index} className="border-2">
            <CardContent className="p-5">
              <div className="mb-3 flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-8 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="h-[360px] shadow-sm">
        <CardHeader className="border-b pb-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-2 h-4 w-64" />
        </CardHeader>
        <CardContent className="h-full p-6">
          <div className="h-full rounded border border-dashed border-muted-foreground/20" />
        </CardContent>
      </Card>
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

  const summaryMetrics = useMemo(() => {
    if (!analytics) return [];

    return [
      {
        label: "Residents",
        value: analytics.total_residents,
        icon: Users,
        color: "text-blue-600",
        bgColor: "bg-blue-50 dark:bg-blue-950/20",
        borderColor: "border-blue-200 dark:border-blue-800",
      },
      {
        label: "Residencies",
        value: analytics.total_residencies,
        icon: Home,
        color: "text-emerald-600",
        bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
        borderColor: "border-emerald-200 dark:border-emerald-800",
      },
      {
        label: "Gate Passes",
        value: analytics.total_gate_passes,
        icon: Ticket,
        color: "text-amber-600",
        bgColor: "bg-amber-50 dark:bg-amber-950/20",
        borderColor: "border-amber-200 dark:border-amber-800",
      },
      {
        label: "Visitors",
        value: analytics.total_visitors,
        icon: UserCheck,
        color: "text-purple-600",
        bgColor: "bg-purple-50 dark:bg-purple-950/20",
        borderColor: "border-purple-200 dark:border-purple-800",
      },
      {
        label: "Gate Events",
        value: analytics.total_gate_events,
        icon: Activity,
        color: "text-indigo-600",
        bgColor: "bg-indigo-50 dark:bg-indigo-950/20",
        borderColor: "border-indigo-200 dark:border-indigo-800",
      },
      {
        label: "Approved",
        value: analytics.total_gate_events_approved,
        icon: ShieldCheck,
        color: "text-green-600",
        bgColor: "bg-green-50 dark:bg-green-950/20",
        borderColor: "border-green-200 dark:border-green-800",
      },
      {
        label: "Denied",
        value: analytics.total_gate_events_denied,
        icon: ShieldX,
        color: "text-red-600",
        bgColor: "bg-red-50 dark:bg-red-950/20",
        borderColor: "border-red-200 dark:border-red-800",
      },
      {
        label: "Admins",
        value: analytics.total_admins,
        icon: UserCog,
        color: "text-slate-600",
        bgColor: "bg-slate-50 dark:bg-slate-950/20",
        borderColor: "border-slate-200 dark:border-slate-800",
      },
      {
        label: "Roles",
        value: analytics.total_roles,
        icon: UserCog,
        color: "text-slate-600",
        bgColor: "bg-slate-50 dark:bg-slate-950/20",
        borderColor: "border-slate-200 dark:border-slate-800",
      },
    ];
  }, [analytics]);

  const trendSeries = useMemo(() => {
    if (!analytics) return [];

    const entries = new Map<
      string,
      { date: string; residencies: number; gate_passes: number; visitors: number }
    >();

    const ingest = (
      key: "residencies" | "gate_passes" | "visitors",
      data: { date: string; count: number }[]
    ) => {
      data.forEach((point) => {
        const current = entries.get(point.date) ?? {
          date: point.date,
          residencies: 0,
          gate_passes: 0,
          visitors: 0,
        };
        current[key] = point.count;
        entries.set(point.date, current);
      });
    };

    ingest("residencies", analytics.time_series.residencies);
    ingest("gate_passes", analytics.time_series.gate_passes);
    ingest("visitors", analytics.time_series.visitors);

    return Array.from(entries.values())
      .sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      )
      .map((point) => ({
        ...point,
        label: formatDateLabel(point.date),
      }));
  }, [analytics]);

  const gateFlowSeries = useMemo(() => {
    if (!analytics) return [];

    const { checkins, checkouts } = analytics.time_series;
    const dates = new Set<string>();
    checkins.forEach((item) => dates.add(item.date));
    checkouts.forEach((item) => dates.add(item.date));

    return Array.from(dates.values())
      .sort(
        (a, b) => new Date(a).getTime() - new Date(b).getTime()
      )
      .map((date) => ({
        date,
        label: formatDateLabel(date),
        checkins: checkins.find((item) => item.date === date)?.count ?? 0,
        checkouts: checkouts.find((item) => item.date === date)?.count ?? 0,
      }));
  }, [analytics]);

  const topGateDays = useMemo(() => {
    if (!analytics) return [];

    return [...analytics.time_series.gate_passes]
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [analytics]);

  const averageDailyPasses = useMemo(() => {
    if (!analytics) return 0;
    const { gate_passes } = analytics.time_series;
    if (!gate_passes.length) return 0;
    const total = gate_passes.reduce((sum, point) => sum + point.count, 0);
    return total / gate_passes.length;
  }, [analytics]);

  const averageDailyVisitors = useMemo(() => {
    if (!analytics) return 0;
    const { visitors } = analytics.time_series;
    if (!visitors.length) return 0;
    const total = visitors.reduce((sum, point) => sum + point.count, 0);
    return total / visitors.length;
  }, [analytics]);

  const movementStats = useMemo(() => {
    if (!analytics) {
      return {
        totalCheckins: 0,
        totalCheckouts: 0,
        averageCheckins: 0,
        averageCheckouts: 0,
      };
    }

    const totalCheckins = analytics.time_series.checkins.reduce(
      (sum, item) => sum + item.count,
      0
    );
    const totalCheckouts = analytics.time_series.checkouts.reduce(
      (sum, item) => sum + item.count,
      0
    );
    const averageCheckins =
      analytics.time_series.checkins.length > 0
        ? totalCheckins / analytics.time_series.checkins.length
        : 0;
    const averageCheckouts =
      analytics.time_series.checkouts.length > 0
        ? totalCheckouts / analytics.time_series.checkouts.length
        : 0;

    return {
      totalCheckins,
      totalCheckouts,
      averageCheckins,
      averageCheckouts,
    };
  }, [analytics]);

  const observationWindowDays =
    analytics?.time_series.gate_passes.length ?? 0;

  const gateEventsPerAdmin = useMemo(() => {
    if (!analytics || analytics.total_admins === 0) return 0;
    return analytics.total_gate_events / analytics.total_admins;
  }, [analytics]);

  const visitorSpike = useMemo(() => {
    if (!analytics || analytics.time_series.visitors.length === 0) {
      return null;
    }
    return analytics.time_series.visitors.reduce((prev, current) =>
      current.count > prev.count ? current : prev
    );
  }, [analytics]);

  if (isLoading) {
    return (
      <>
        <div className="space-y-8">
          <PageHeader
            onRefresh={() => refetch()}
            isRefreshing={isFetching}
          />
          <AnalyticsSkeleton />
        </div>
      </>
    );
  }

  if (isError) {
    return (
      <>
        <div className="space-y-8">
          <PageHeader
            onRefresh={() => refetch()}
            isRefreshing={isFetching}
          />
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Unable to load analytics</CardTitle>
              <CardDescription>
                Something went wrong while fetching analytics summary. Please
                try again.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => refetch()}
                className="flex items-center gap-2"
              >
                <RefreshCcw className="h-4 w-4" />
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (!analytics) {
    return (
      <>
        <div className="space-y-8">
          <PageHeader
            onRefresh={() => refetch()}
            isRefreshing={isFetching}
          />
          <EmptyState
            title="No analytics yet"
            description="We could not find analytics for your estate yet. Once activity starts flowing through the gate, you'll see trends and usage details here."
            action={{
              label: "Reload",
              onClick: () => refetch(),
            }}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="space-y-8">
        <PageHeader onRefresh={() => refetch()} isRefreshing={isFetching} />

        <Section title="Overview">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {summaryMetrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <Card
                  key={metric.label}
                  className={`group relative overflow-hidden border-2 transition-all hover:shadow-md hover:scale-[1.02] ${metric.borderColor}`}
                >
                  <div
                    className={`absolute inset-0 ${metric.bgColor} opacity-0 transition-opacity group-hover:opacity-100`}
                  />
                  <CardContent className="relative p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="mb-3 flex items-center gap-2">
                          <div
                            className={`rounded-lg p-2 ${metric.bgColor} ${metric.color}`}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            {metric.label}
                          </p>
                        </div>
                        <p className="text-2xl font-bold text-foreground">
                          {formatNumber(metric.value)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </Section>

        <Section
          title="Engagement timeline"
          description="Gate passes, housing, and visitor trends over the selected period."
        >
          <div className="grid gap-6 xl:grid-cols-3">
            <Card className="xl:col-span-2 shadow-sm">
              <CardHeader className="border-b pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Activity overview
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Smooth trendlines make it easy to spot spikes across metrics.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="h-[360px] p-6">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendSeries}>
                    <defs>
                      <linearGradient id="colorPasses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorResidencies" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="gate_passes"
                      name="Gate passes"
                      stroke="#f97316"
                      fillOpacity={1}
                      fill="url(#colorPasses)"
                    />
                    <Area
                      type="monotone"
                      dataKey="visitors"
                      name="Visitors"
                      stroke="#a855f7"
                      fillOpacity={1}
                      fill="url(#colorVisitors)"
                    />
                    <Area
                      type="monotone"
                      dataKey="residencies"
                      name="Residencies"
                      stroke="#0ea5e9"
                      fillOpacity={1}
                      fill="url(#colorResidencies)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-lg">Activity highlights</CardTitle>
                <CardDescription className="mt-1">
                  Key callouts pulled from the current observation window.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                {(visitorSpike || topGateDays[0]) && (
                  <div className="space-y-3 rounded-lg border-2 bg-gradient-to-br from-primary/5 to-primary/10 p-4">
                    {visitorSpike && (
                      <div className="flex items-start gap-3">
                        <div className="rounded-full bg-primary/10 p-2">
                          <ArrowUpRight className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Busiest visitor day
                          </p>
                          <p className="mt-1 text-lg font-bold text-foreground">
                            {formatDate(visitorSpike.date)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatNumber(visitorSpike.count)} visitors processed
                          </p>
                        </div>
                      </div>
                    )}
                    {topGateDays[0] && (
                      <div className="flex items-start gap-3">
                        <div className="rounded-full bg-amber-500/10 p-2">
                          <TrendingUp className="h-4 w-4 text-amber-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Gate pass spike
                          </p>
                          <p className="mt-1 text-lg font-bold text-foreground">
                            {formatDate(topGateDays[0].date)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatNumber(topGateDays[0].count)} passes issued
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <div className="space-y-3">
                  <HighlightStat
                    label="Avg passes per day"
                    value={`${averageDailyPasses.toFixed(1)}`}
                    helper={`Across ${observationWindowDays || "0"} days`}
                  />
                  <HighlightStat
                    label="Avg visitors per day"
                    value={`${averageDailyVisitors.toFixed(1)}`}
                    helper="Unique visitor entries"
                  />
                  <HighlightStat
                    label="Gate events per admin"
                    value={gateEventsPerAdmin.toFixed(1)}
                    helper="Indicates load on admin team"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </Section>

        <Section
          title="Access control health"
          description="Decision quality and high-volume touch points."
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="shadow-sm">
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-lg">Gate decision quality</CardTitle>
                <CardDescription className="mt-1">
                  Approval vs denial rate across all recorded events
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-muted-foreground">
                      Approval rate
                    </span>
                    <span className="font-bold text-emerald-600">
                      {approvalRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-500"
                      style={{ width: `${Math.min(approvalRate, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-muted-foreground">
                      Denial rate
                    </span>
                    <span className="font-bold text-red-600">
                      {denialRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-500"
                      style={{ width: `${Math.min(denialRate, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="rounded-lg border-2 bg-gradient-to-br from-slate-50 to-slate-100/50 p-5 dark:from-slate-900/50 dark:to-slate-800/30">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Approvals vs denials
                  </p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <p className="text-3xl font-bold text-foreground">
                      {formatNumber(analytics.total_gate_events_approved)}
                    </p>
                    <span className="text-muted-foreground">/</span>
                    <p className="text-3xl font-bold text-foreground">
                      {formatNumber(analytics.total_gate_events_denied)}
                    </p>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Out of {formatNumber(analytics.total_gate_events)} total gate
                    events
                  </p>
                </div>
                {visitorSpike && (
                  <div className="rounded-lg border-2 bg-gradient-to-br from-purple-50 to-purple-100/50 p-4 dark:from-purple-950/20 dark:to-purple-900/10">
                    <div className="flex items-center gap-2">
                      <div className="rounded-full bg-purple-500/10 p-1.5">
                        <UserCheck className="h-3.5 w-3.5 text-purple-600" />
                      </div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Busiest visitor day
                      </p>
                    </div>
                    <p className="mt-2 text-xl font-bold text-foreground">
                      {formatDate(visitorSpike.date)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatNumber(visitorSpike.count)} visitors processed
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-lg">High-velocity days</CardTitle>
                <CardDescription className="mt-1">
                  Dates with the most gate pass creations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 p-6">
                {topGateDays.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Gate pass volume data is not available yet. Activity will
                    populate as soon as new passes are issued.
                  </p>
                ) : (
                  topGateDays.map((day, index) => (
                    <div
                      key={day.date}
                      className="group flex items-center justify-between rounded-lg border-2 bg-card p-4 transition-all hover:border-primary/50 hover:shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full font-bold ${index === 0
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
                            : "bg-muted text-muted-foreground"
                            }`}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">
                            {formatDate(day.date)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {index === 0 ? "Busiest day" : `Top ${index + 1}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-foreground">
                          {formatNumber(day.count)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          passes issued
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </Section>

        <Section
          title="Gate flow"
          description="Balance of check-ins and check-outs for visitors."
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="shadow-sm">
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-lg">Check-ins vs check-outs</CardTitle>
                <CardDescription className="mt-1">
                  Daily balance of visitor movements
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[360px] p-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={gateFlowSeries}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend />
                    <Bar dataKey="checkins" name="Check-ins" fill="#0ea5e9" />
                    <Bar dataKey="checkouts" name="Check-outs" fill="#6366f1" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-lg">Movement snapshot</CardTitle>
                <CardDescription className="mt-1">
                  Aggregate check-ins and check-outs across the period
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border-2 bg-gradient-to-br from-blue-50 to-blue-100/50 p-4 dark:from-blue-950/20 dark:to-blue-900/10">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Total check-ins
                    </p>
                    <p className="mt-2 text-2xl font-bold text-foreground">
                      {formatNumber(movementStats.totalCheckins)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {movementStats.averageCheckins.toFixed(1)} avg / day
                    </p>
                  </div>
                  <div className="rounded-lg border-2 bg-gradient-to-br from-indigo-50 to-indigo-100/50 p-4 dark:from-indigo-950/20 dark:to-indigo-900/10">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Total check-outs
                    </p>
                    <p className="mt-2 text-2xl font-bold text-foreground">
                      {formatNumber(movementStats.totalCheckouts)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {movementStats.averageCheckouts.toFixed(1)} avg / day
                    </p>
                  </div>
                </div>
                <div className="rounded-lg border-2 bg-gradient-to-br from-slate-50 to-slate-100/50 p-5 dark:from-slate-900/50 dark:to-slate-800/30">
                  <div className="flex items-center gap-2">
                    <div className="rounded-full bg-primary/10 p-1.5">
                      {movementStats.totalCheckins - movementStats.totalCheckouts >= 0 ? (
                        <ArrowUpRight className="h-4 w-4 text-primary" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Net flow
                    </p>
                  </div>
                  <p className="mt-2 text-3xl font-bold text-foreground">
                    {formatSignedNumber(
                      movementStats.totalCheckins - movementStats.totalCheckouts
                    )}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Difference between entries and exits
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Based on {observationWindowDays || "current"} days of activity.
                </p>
              </CardContent>
            </Card>
          </div>
        </Section>
      </div>
    </>
  );
}

function PageHeader({
  onRefresh,
  isRefreshing,
}: {
  onRefresh: () => void;
  isRefreshing: boolean;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Monitor residents, visitors, and gate efficiency in real time.
        </p>
      </div>
      <Button
        variant="outline"
        onClick={onRefresh}
        isLoading={isRefreshing}
        className="flex items-center gap-2 shadow-sm transition-all hover:shadow"
      >
        <RefreshCcw className="h-4 w-4" />
        Refresh data
      </Button>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-bold tracking-tight">{title}</h2>
        {description && (
          <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function HighlightStat({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-lg border-2 bg-card p-4 transition-all hover:border-primary/50 hover:shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1.5 text-xl font-bold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
    </div>
  );
}

