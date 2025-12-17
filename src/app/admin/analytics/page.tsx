"use client";

import { useMemo, type ReactNode } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
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
  BadgeCheck,
  UserCheck,
  ShieldCheck,
  ShieldAlert,
  UserCog,
  Activity,
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
    <div className="rounded-md border bg-background/90 px-3 py-2 text-sm shadow-lg backdrop-blur">
      <p className="font-semibold">{label}</p>
      {payload.map((item) => (
        <div
          key={item.name}
          className="flex items-center justify-between gap-6 text-muted-foreground"
        >
          <span className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            {item.name}
          </span>
          <span className="font-medium text-foreground">
            {formatNumber(item.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="space-y-4 pt-6">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-40" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="h-[360px]">
        <CardHeader>
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-40" />
        </CardHeader>
        <CardContent className="h-full">
          <div className="h-full rounded-md border border-dashed border-muted-foreground/20" />
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

  const summaryCards = useMemo(() => {
    if (!analytics) return [];

    return [
      {
        title: "Residents",
        value: analytics.total_residents,
        description: "Active residents on file",
        icon: Users,
        accent: "from-sky-500/10 via-sky-500/5 to-transparent",
      },
      {
        title: "Houses",
        value: analytics.total_houses,
        description: "Homes linked to residents",
        icon: Home,
        accent: "from-emerald-500/10 via-emerald-500/5 to-transparent",
      },
      {
        title: "Gate Passes",
        value: analytics.total_gate_passes,
        description: "Passes ever issued",
        icon: BadgeCheck,
        accent: "from-amber-500/10 via-amber-500/5 to-transparent",
      },
      {
        title: "Visitors",
        value: analytics.total_visitors,
        description: "Unique visitor profiles",
        icon: UserCheck,
        accent: "from-fuchsia-500/10 via-fuchsia-500/5 to-transparent",
      },
      {
        title: "Gate Events",
        value: analytics.total_gate_events,
        description: "Check-ins & approvals",
        icon: Activity,
        accent: "from-indigo-500/10 via-indigo-500/5 to-transparent",
      },
      {
        title: "Approved Events",
        value: analytics.total_gate_events_approved,
        description: "Cleared at security",
        icon: ShieldCheck,
        accent: "from-emerald-500/10 via-emerald-500/5 to-transparent",
      },
      {
        title: "Denied Events",
        value: analytics.total_gate_events_denied,
        description: "Flagged for review",
        icon: ShieldAlert,
        accent: "from-rose-500/10 via-rose-500/5 to-transparent",
      },
      {
        title: "Admins / Roles",
        value: `${analytics.total_admins} / ${analytics.total_roles}`,
        description: "Security leadership footprint",
        icon: UserCog,
        accent: "from-purple-500/10 via-purple-500/5 to-transparent",
      },
    ];
  }, [analytics]);

  const trendSeries = useMemo(() => {
    if (!analytics) return [];

    const entries = new Map<
      string,
      { date: string; houses: number; gate_passes: number; visitors: number }
    >();

    const ingest = (
      key: "houses" | "gate_passes" | "visitors",
      data: { date: string; count: number }[]
    ) => {
      data.forEach((point) => {
        const current = entries.get(point.date) ?? {
          date: point.date,
          houses: 0,
          gate_passes: 0,
          visitors: 0,
        };
        current[key] = point.count;
        entries.set(point.date, current);
      });
    };

    ingest("houses", analytics.time_series.houses);
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
      <DashboardLayout type="admin">
        <div className="space-y-6">
          <PageHeader
            onRefresh={() => refetch()}
            isRefreshing={isFetching}
          />
          <AnalyticsSkeleton />
        </div>
      </DashboardLayout>
    );
  }

  if (isError) {
    return (
      <DashboardLayout type="admin">
        <div className="space-y-6">
          <PageHeader
            onRefresh={() => refetch()}
            isRefreshing={isFetching}
          />
          <Card>
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
      </DashboardLayout>
    );
  }

  if (!analytics) {
    return (
      <DashboardLayout type="admin">
        <div className="space-y-6">
          <PageHeader
            onRefresh={() => refetch()}
            isRefreshing={isFetching}
          />
          <EmptyState
            title="No analytics yet"
            description="We could not find analytics for your estate yet. Once activity starts flowing through the gate, you’ll see trends and usage details here."
            action={{
              label: "Reload",
              onClick: () => refetch(),
            }}
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout type="admin">
      <div className="space-y-8">
        <PageHeader onRefresh={() => refetch()} isRefreshing={isFetching} />

        <Section
          title="Estate overview"
          description="Snapshot of residents, housing, passes, and staffing footprint."
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map(({ icon: Icon, accent, ...card }) => (
              <Card
                key={card.title}
                className={`overflow-hidden border-none bg-gradient-to-br ${accent}`}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </CardTitle>
                  <span className="rounded-full bg-white/70 p-2 text-[var(--brand-primary,#2563eb)] shadow-sm dark:bg-white/10">
                    <Icon className="h-5 w-5" />
                  </span>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {typeof card.value === "number"
                      ? formatNumber(card.value)
                      : card.value}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {card.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </Section>

        <Section
          title="Engagement timeline"
          description="Gate passes, housing, and visitor trends over the selected period."
        >
          <div className="grid gap-4 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  Activity overview
                </CardTitle>
                <CardDescription>
                  Smooth trendlines make it easy to spot spikes across metrics.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[360px]">
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
                      <linearGradient id="colorHouses" x1="0" y1="0" x2="0" y2="1">
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
                      dataKey="houses"
                      name="Houses"
                      stroke="#0ea5e9"
                      fillOpacity={1}
                      fill="url(#colorHouses)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Activity highlights</CardTitle>
                <CardDescription>
                  Key callouts pulled from the current observation window.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {(visitorSpike || topGateDays[0]) && (
                  <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
                    {visitorSpike && (
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          Busiest visitor day
                        </p>
                        <p className="text-lg font-semibold">
                          {formatDate(visitorSpike.date)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatNumber(visitorSpike.count)} visitors processed
                        </p>
                      </div>
                    )}
                    {topGateDays[0] && (
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          Gate pass spike
                        </p>
                        <p className="text-lg font-semibold">
                          {formatDate(topGateDays[0].date)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatNumber(topGateDays[0].count)} passes issued
                        </p>
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
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Gate decision quality</CardTitle>
                <CardDescription>
                  Approval vs denial rate across all recorded events
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Approval rate</span>
                    <span className="font-semibold">
                      {approvalRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-emerald-500"
                      style={{ width: `${Math.min(approvalRate, 100)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Denials</span>
                    <span className="font-semibold">
                      {denialRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-rose-500"
                      style={{ width: `${Math.min(denialRate, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="rounded-lg border bg-muted/30 p-4">
                  <p className="text-sm text-muted-foreground">
                    Approvals vs denials
                  </p>
                  <p className="text-2xl font-semibold mt-1">
                    {formatNumber(analytics.total_gate_events_approved)} /{" "}
                    {formatNumber(analytics.total_gate_events_denied)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Out of {formatNumber(analytics.total_gate_events)} total gate
                    events
                  </p>
                </div>
                {visitorSpike && (
                  <div className="rounded-lg border bg-background p-4">
                    <p className="text-sm text-muted-foreground">
                      Busiest visitor day
                    </p>
                    <p className="text-lg font-semibold">
                      {formatDate(visitorSpike.date)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatNumber(visitorSpike.count)} visitors processed
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>High-velocity days</CardTitle>
                <CardDescription>
                  Dates with the most gate pass creations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {topGateDays.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Gate pass volume data is not available yet. Activity will
                    populate as soon as new passes are issued.
                  </p>
                ) : (
                  topGateDays.map((day, index) => (
                    <div
                      key={day.date}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {formatDate(day.date)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {index === 0 ? "Busiest day" : `Top ${index + 1}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-semibold">
                          {formatNumber(day.count)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Gate passes issued
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
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Check-ins vs check-outs</CardTitle>
                <CardDescription>
                  Daily balance of visitor movements
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[320px]">
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

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Movement snapshot</CardTitle>
                <CardDescription>
                  Aggregate check-ins and check-outs across the period
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <MovementStat
                    label="Total check-ins"
                    value={formatNumber(movementStats.totalCheckins)}
                    helper={`${movementStats.averageCheckins.toFixed(1)} avg / day`}
                    accent="from-sky-500/10 via-sky-500/5 to-transparent"
                  />
                  <MovementStat
                    label="Total check-outs"
                    value={formatNumber(movementStats.totalCheckouts)}
                    helper={`${movementStats.averageCheckouts.toFixed(1)} avg / day`}
                    accent="from-indigo-500/10 via-indigo-500/5 to-transparent"
                  />
                </div>
                <div className="rounded-lg border bg-background p-4">
                  <p className="text-sm text-muted-foreground">Net flow</p>
                  <p className="text-3xl font-semibold">
                    {formatSignedNumber(
                      movementStats.totalCheckins - movementStats.totalCheckouts
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
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
    </DashboardLayout>
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
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">
          Monitor residents, visitors, and gate efficiency in real time.
        </p>
      </div>
      <Button
        variant="outline"
        onClick={onRefresh}
        isLoading={isRefreshing}
        className="flex items-center gap-2"
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
        <h2 className="text-xl font-semibold">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
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
    <div className="rounded-lg border bg-card/40 p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-xl font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{helper}</p>
    </div>
  );
}

function MovementStat({
  label,
  value,
  helper,
  accent,
}: {
  label: string;
  value: string;
  helper: string;
  accent: string;
}) {
  return (
    <div
      className={`rounded-xl border bg-gradient-to-br ${accent} p-4 shadow-sm`}
    >
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{helper}</p>
    </div>
  );
}
