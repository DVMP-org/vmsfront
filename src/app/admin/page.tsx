"use client";

import { useMemo, memo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useAdminDashboard } from "@/hooks/use-admin";
import { GatePassStatus } from "@/types";
import { Button } from "@/components/ui/Button";
import { formatDate, getFullName } from "@/lib/utils";
import {
  Building2,
  Users,
  CreditCard,
  Activity,
  ArrowUpRight,
  PieChartIcon,
  UserPlus,
} from "lucide-react";

// Lazy load the charts component
const DashboardCharts = dynamic(
  () => import("./components/DashboardCharts"),
  {
    loading: () => (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border border-zinc-200 rounded-lg h-[280px] bg-background dark:bg-card animate-pulse" />
        ))}
      </div>
    ),
    ssr: false, // Charts are client-side only
  }
);

const COLORS = {
  primary: "#3b82f6",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  purple: "#8b5cf6",
  zinc: "#71717a",
};

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[rgb(var(--brand-primary))] bg-white px-3 py-2 text-sm shadow-lg">
      <p className="font-semibold text-[rgb(var(--brand-primary))] mb-1">{label}</p>
      {payload.map((item: any, idx: number) => (
        <div key={idx} className="flex items-center justify-between gap-4 text-zinc-600">
          <span className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            {item.name}
          </span>
          <span className="font-medium text-[var(--brand-primary)]">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

const MetricCard = memo(function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="border border-zinc-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-background dark:bg-card">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-zinc-500 uppercase tracking-wide">{title}</div>
        <Icon className="h-4 w-4 text-[var(--brand-primary,#213928)]" />
      </div>
      <div className="text-2xl font-bold text-foreground mb-1">{value}</div>
      <div className="text-xs text-zinc-500">{subtitle}</div>
    </div>
  );
});

export default function AdminDashboardPage() {
  const { data: dashboard, isLoading } = useAdminDashboard();
  const router = useRouter();

  // Process data for charts and stats
  const { chartData, stats } = useMemo(() => {
    if (!dashboard) return { chartData: null, stats: null };

    const gatePasses = dashboard.gate_passes || [];
    const gateEvents = dashboard.gate_events || [];
    const residencies = dashboard.residencies || [];
    const residents = dashboard.residents || [];

    // All-in-one pass for stats and grouping
    const statusCounts: Record<string, number> = {};
    let activeGatePasses = 0;
    gatePasses.forEach(p => {
      statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
      if (p.status === GatePassStatus.CHECKED_IN || p.status === GatePassStatus.ACTIVE) activeGatePasses++;
    });

    const hourStats = new Map<string, { checkins: number; checkouts: number }>();
    const dayStats = new Map<string, { checkins: number; checkouts: number }>();
    let totalCheckouts = 0;

    gateEvents.forEach(event => {
      if (event.checkin_time) {
        const time = new Date(event.checkin_time).getTime();
        const hourKey = new Date(time).setMinutes(0, 0, 0).toString();
        const dayKey = new Date(time).setHours(0, 0, 0, 0).toString();

        const hStat = hourStats.get(hourKey) || { checkins: 0, checkouts: 0 };
        hStat.checkins++;
        hourStats.set(hourKey, hStat);

        const dStat = dayStats.get(dayKey) || { checkins: 0, checkouts: 0 };
        dStat.checkins++;
        dayStats.set(dayKey, dStat);
      }

      if (event.checkout_time) {
        totalCheckouts++;
        const time = new Date(event.checkout_time).getTime();
        const hourKey = new Date(time).setMinutes(0, 0, 0).toString();
        const dayKey = new Date(time).setHours(0, 0, 0, 0).toString();

        const hStat = hourStats.get(hourKey) || { checkins: 0, checkouts: 0 };
        hStat.checkouts++;
        hourStats.set(hourKey, hStat);

        const dStat = dayStats.get(dayKey) || { checkins: 0, checkouts: 0 };
        dStat.checkouts++;
        dayStats.set(dayKey, dStat);
      }
    });

    const statusChartData = [
      { name: "Active", value: statusCounts[GatePassStatus.ACTIVE] || 0, color: COLORS.success },
      { name: "Checked In", value: statusCounts[GatePassStatus.CHECKED_IN] || 0, color: COLORS.success },
      { name: "Checked Out", value: statusCounts[GatePassStatus.CHECKED_OUT] || 0, color: COLORS.zinc },
      { name: "Pending", value: statusCounts[GatePassStatus.PENDING] || 0, color: COLORS.warning },
      { name: "Expired", value: statusCounts[GatePassStatus.EXPIRED] || 0, color: COLORS.danger },
      { name: "Completed", value: statusCounts[GatePassStatus.COMPLETED] || 0, color: COLORS.primary },
      { name: "Revoked", value: statusCounts[GatePassStatus.REVOKED] || 0, color: "#6b7280" },
    ].filter((item) => item.value > 0);

    const now = new Date();
    const eventsByHour = Array.from({ length: 24 }, (_, i) => {
      const hour = new Date(now);
      hour.setHours(hour.getHours() - (23 - i), 0, 0, 0);
      return {
        hour: hour.getHours(),
        label: hour.toLocaleTimeString("en-US", { hour: "numeric", hour12: true }),
        ...(hourStats.get(hour.getTime().toString()) || { checkins: 0, checkouts: 0 })
      };
    });

    const activityTrend = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      date.setHours(0, 0, 0, 0);
      return {
        date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        ...(dayStats.get(date.getTime().toString()) || { checkins: 0, checkouts: 0 })
      };
    });

    return {
      chartData: { statusChartData, eventsByHour, activityTrend },
      stats: {
        totalResidencies: residencies.length,
        totalResidents: residents.length,
        activeGatePasses,
        totalGatePasses: gatePasses.length,
        totalGateScans: gateEvents.length + totalCheckouts,
        passUtilization: gatePasses.length ? Math.round((activeGatePasses / gatePasses.length) * 100) : 0,
        avgResidentsPerResidency: residencies.length ? Math.round(residents.length / residencies.length) : 0,
      }
    };
  }, [dashboard]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-16 bg-muted animate-pulse rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-muted dark:bg-background animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const residencies = dashboard?.residencies || [];
  const residents = dashboard?.residents || [];
  const {
    totalResidencies,
    totalResidents,
    activeGatePasses,
    totalGatePasses,
    totalGateScans,
    passUtilization,
    avgResidentsPerResidency
  } = stats || {
    totalResidencies: 0,
    totalResidents: 0,
    activeGatePasses: 0,
    totalGatePasses: 0,
    totalGateScans: 0,
    passUtilization: 0,
    avgResidentsPerResidency: 0
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Admin Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-0.5">System overview and operations</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/admin/analytics")}
            className="text-xs h-8"
          >
            <PieChartIcon className="h-4 w-4 mr-2" />
            Analytics
          </Button>
          <Button
            size="sm"
            onClick={() => router.push("/admin/admins/create")}
            className="text-xs h-8"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Onboard Admin
          </Button>
        </div>
      </div>

      {/* Enhanced Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          title="Residencies"
          value={totalResidencies}
          subtitle="Managed properties"
          icon={Building2}
        />
        <MetricCard
          title="Residents"
          value={totalResidents}
          subtitle="Active profiles"
          icon={Users}
        />
        <MetricCard
          title="Active Passes"
          value={activeGatePasses}
          subtitle={`${totalGatePasses} total issued`}
          icon={CreditCard}
        />
        <MetricCard
          title="Gate Events"
          value={totalGateScans}
          subtitle="Total scans"
          icon={Activity}
        />
      </div>

      {/* Charts Section */}
      <DashboardCharts chartData={chartData} />

      {/* Operational Metrics, Quick Actions, and Activity Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Operational Metrics */}
        <div className="border border-foreground/20 rounded-lg">
          <div className="border-b border-foreground/20 px-4 py-3 rounded-t-lg">
            <h2 className="text-sm font-semibold text-foreground">Operational Metrics</h2>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-foreground">Pass utilization</span>
                <span className="text-sm font-semibold text-muted-foreground">{passUtilization}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all"
                  style={{ width: `${passUtilization}%` }}
                />
              </div>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-zinc-100">
              <span className="text-sm text-foreground">Total gate passes</span>
              <span className="text-sm font-semibold text-muted-foreground">{totalGatePasses}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-zinc-100">
              <span className="text-sm text-foreground">Active check-ins</span>
              <span className="text-sm font-semibold text-muted-foreground">{activeGatePasses}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-zinc-100">
              <span className="text-sm text-foreground">Residents per residency</span>
              <span className="text-sm font-semibold text-muted-foreground">{avgResidentsPerResidency}</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="border border-foreground/20 rounded-lg">
          <div className="border-b border-foreground/20 px-4 py-3 rounded-t-lg">
            <h2 className="text-sm font-semibold text-foreground">Quick Actions</h2>
          </div>
          <div className="p-3 space-y-2">
            {[
              { label: "Create residency", sub: "Add a property profile", href: "/admin/residencies", icon: Building2 },
              { label: "Add resident", sub: "Link a user to residencies", href: "/admin/residents/create", icon: Users },
              { label: "Issue gate pass", sub: "Manage visitor access", href: "/admin/gate", icon: CreditCard },
            ].map((action) => (
              <button
                key={action.href}
                onClick={() => router.push(action.href)}
                className="w-full flex items-center justify-between px-3 py-2.5 text-left text-sm text-zinc-700 hover:bg-foreground/10 rounded-md transition-colors border border-transparent hover:border-foreground/20"
              >
                <div>
                  <div className="font-medium text-foreground">{action.label}</div>
                  <div className="text-xs text-zinc-500">{action.sub}</div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-zinc-400" />
              </button>
            ))}
          </div>
        </div>

        {/* Activity Summary */}
        <div className="border border-foreground/20 rounded-lg">
          <div className="border-b border-foreground/20 px-4 py-3 rounded-t-lg">
            <h2 className="text-sm font-semibold text-foreground">Activity Summary</h2>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Recent residencies</span>
              <span className="text-sm font-semibold text-muted-foreground">{residencies.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Recent residents</span>
              <span className="text-sm font-semibold text-muted-foreground">{residents.length}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-foreground/20">
              <span className="text-sm text-foreground">Avg. residents/residency</span>
              <span className="text-sm font-semibold text-muted-foreground">{avgResidentsPerResidency}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent residencies table */}
        <div className="border border-foreground/20 rounded-lg overflow-hidden">
          <div className="border-b border-foreground/20 px-4 py-3 bg-muted/50">
            <h2 className="text-sm font-semibold text-foreground">Recent Residencies</h2>
          </div>
          {!residencies || residencies.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-muted-foreground">No residencies yet</div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {residencies.slice(0, 5).map((residency) => (
                <div
                  key={residency.id}
                  className="px-4 py-3 hover:bg-foreground/5 transition-colors cursor-pointer flex items-center justify-between"
                  onClick={() => router.push(`/admin/residencies/${residency.id}`)}
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-foreground truncate">{residency.name}</div>
                    <div className="text-xs text-muted-foreground truncate mt-0.5">{residency.address}</div>
                  </div>
                  {residency.created_at && (
                    <div className="text-right ml-4 flex-shrink-0">
                      <div className="text-xs text-zinc-500">{formatDate(residency.created_at)}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent residents table */}
        <div className="border border-foreground/20 rounded-lg overflow-hidden">
          <div className="border-b border-foreground/20 px-4 py-3 bg-muted/50">
            <h2 className="text-sm font-semibold text-foreground">Recent Residents</h2>
          </div>
          {!residents || residents.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-muted-foreground">No residents yet</div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {residents.slice(0, 5).map((resident) => (
                <div
                  key={resident.user.id}
                  className="px-4 py-3 hover:bg-foreground/5 transition-colors cursor-pointer flex items-center justify-between"
                  onClick={() => router.push(`/admin/residents/${resident.user.id}`)}
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-foreground truncate">
                      {getFullName(resident.user.first_name, resident.user.last_name)}
                    </div>
                    <div className="text-xs text-muted-foreground truncate mt-0.5">{resident.user.email}</div>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--brand-primary,#213928)] text-white">
                      {resident.residencies?.length || 0} {resident.residencies?.length === 1 ? 'residency' : 'residencies'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
