"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAdminDashboard } from "@/hooks/use-admin";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { GatePassStatus } from "@/types";
import { Button } from "@/components/ui/Button";
import { formatDate, getFullName, getInitials } from "@/lib/utils";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from "recharts";
import {
  Building2,
  Users,
  CreditCard,
  Activity,
  TrendingUp,
  ShieldCheck,
  ArrowUpRight,
  Clock,
} from "lucide-react";

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
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-lg">
      <p className="font-semibold text-zinc-900 mb-1">{label}</p>
      {payload.map((item: any, idx: number) => (
        <div key={idx} className="flex items-center justify-between gap-4 text-zinc-600">
          <span className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            {item.name}
          </span>
          <span className="font-medium text-zinc-900">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboardPage() {
  const { data: dashboard, isLoading } = useAdminDashboard();
  const router = useRouter();

  // Process data for charts
  const chartData = useMemo(() => {
    if (!dashboard) return null;

    const gatePasses = dashboard.gate_passes || [];
    const gateEvents = dashboard.gate_events || [];

    // Gate pass status distribution
    const statusCounts = {
      [GatePassStatus.CHECKED_IN]: gatePasses.filter((p) => p.status === GatePassStatus.CHECKED_IN).length,
      [GatePassStatus.CHECKED_OUT]: gatePasses.filter((p) => p.status === GatePassStatus.CHECKED_OUT).length,
      [GatePassStatus.PENDING]: gatePasses.filter((p) => p.status === GatePassStatus.PENDING).length,
      [GatePassStatus.EXPIRED]: gatePasses.filter((p) => p.status === GatePassStatus.EXPIRED).length,
      [GatePassStatus.COMPLETED]: gatePasses.filter((p) => p.status === GatePassStatus.COMPLETED).length,
      [GatePassStatus.REVOKED]: gatePasses.filter((p) => p.status === GatePassStatus.REVOKED).length,
    };

    const statusChartData = [
      { name: "Checked In", value: statusCounts[GatePassStatus.CHECKED_IN], color: COLORS.success },
      { name: "Checked Out", value: statusCounts[GatePassStatus.CHECKED_OUT], color: COLORS.zinc },
      { name: "Pending", value: statusCounts[GatePassStatus.PENDING], color: COLORS.warning },
      { name: "Expired", value: statusCounts[GatePassStatus.EXPIRED], color: COLORS.danger },
      { name: "Completed", value: statusCounts[GatePassStatus.COMPLETED], color: COLORS.primary },
      { name: "Revoked", value: statusCounts[GatePassStatus.REVOKED], color: "#6b7280" },
    ].filter((item) => item.value > 0);

    // Gate events by hour (last 24 hours)
    const now = new Date();
    const hours = Array.from({ length: 24 }, (_, i) => {
      const hour = new Date(now);
      hour.setHours(hour.getHours() - (23 - i));
      hour.setMinutes(0);
      hour.setSeconds(0);
      return hour;
    });

    const eventsByHour = hours.map((hour) => {
      const hourStart = hour.getTime();
      const hourEnd = hourStart + 3600000;
      const count = gateEvents.filter((event) => {
        const eventTime = new Date(event.checkin_time).getTime();
        return eventTime >= hourStart && eventTime < hourEnd;
      }).length;
      return {
        hour: hour.getHours(),
        label: hour.toLocaleTimeString("en-US", { hour: "numeric", hour12: true }),
        count,
      };
    });

    // Recent activity trend (last 7 days)
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      date.setHours(0, 0, 0, 0);
      return date;
    });

    const activityTrend = days.map((date) => {
      const dateStart = date.getTime();
      const dateEnd = dateStart + 86400000;
      const events = gateEvents.filter((event) => {
        const eventTime = new Date(event.checkin_time).getTime();
        return eventTime >= dateStart && eventTime < dateEnd;
      }).length;
      return {
        date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        events,
      };
    });

    return {
      statusChartData,
      eventsByHour,
      activityTrend,
    };
  }, [dashboard]);

  if (isLoading) {
    return (
      <DashboardLayout type="admin">
        <div className="space-y-4">
          <div className="h-16 border border-zinc-200 bg-zinc-50 animate-pulse rounded" />
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 border border-zinc-200 bg-zinc-50 animate-pulse rounded" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const houses = dashboard?.houses || [];
  const residents = dashboard?.residents || [];

  const totalResidents = dashboard?.residents?.length || 0;
  const totalHouses = dashboard?.houses?.length || 0;
  const totalGatePasses = dashboard?.gate_passes?.length || 0;
  const totalGateEvents = dashboard?.gate_events?.length || 0;
  const activeGatePasses = dashboard?.gate_passes?.filter((p) => p.status === GatePassStatus.CHECKED_IN).length || 0;
  const passUtilization = totalGatePasses ? Math.round((activeGatePasses / totalGatePasses) * 100) : 0;
  const avgResidentsPerHouse = totalHouses ? Math.round(totalResidents / totalHouses) : 0;

  return (
    <DashboardLayout type="admin">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
            <div>
            <h1 className="text-lg font-semibold text-zinc-900">Admin Dashboard</h1>
            <p className="text-xs text-zinc-500 mt-0.5">System overview and operations</p>
              </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/admin/analytics")}
              className="text-xs h-8"
            >
              Analytics
              </Button>
              <Button
              size="sm"
                onClick={() => router.push("/admin/admins/create")}
              className="text-xs h-8"
              >
              Onboard Admin
              </Button>
          </div>
        </div>

        {/* Enhanced Stat Cards with Icons */}
        <div className="grid grid-cols-4 gap-3">
          <div className="border border-zinc-200 rounded-lg bg-gradient-to-br from-blue-50 to-white p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-zinc-500 uppercase tracking-wide">Houses</div>
              <Building2 className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-zinc-900 mb-1">{totalHouses}</div>
            <div className="text-xs text-zinc-500">Managed properties</div>
          </div>
          <div className="border border-zinc-200 rounded-lg bg-gradient-to-br from-purple-50 to-white p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-zinc-500 uppercase tracking-wide">Residents</div>
              <Users className="h-4 w-4 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-zinc-900 mb-1">{totalResidents}</div>
            <div className="text-xs text-zinc-500">Active profiles</div>
          </div>
          <div className="border border-zinc-200 rounded-lg bg-gradient-to-br from-amber-50 to-white p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-zinc-500 uppercase tracking-wide">Active Passes</div>
              <CreditCard className="h-4 w-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-zinc-900 mb-1">{activeGatePasses}</div>
            <div className="text-xs text-zinc-500">{totalGatePasses} total issued</div>
          </div>
          <div className="border border-zinc-200 rounded-lg bg-gradient-to-br from-emerald-50 to-white p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-zinc-500 uppercase tracking-wide">Gate Events</div>
              <Activity className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-zinc-900 mb-1">{totalGateEvents}</div>
            <div className="text-xs text-zinc-500">Total scans</div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-3 gap-4">
          {/* Gate Pass Status Distribution */}
          <div className="border border-zinc-200 rounded-lg bg-white">
            <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-3 rounded-t-lg">
              <h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-zinc-600" />
                Pass Status
              </h2>
            </div>
            <div className="p-4">
              {chartData && chartData.statusChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={chartData.statusChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={70}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.statusChartData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-xs text-zinc-500">
                  No pass data available
                </div>
              )}
            </div>
          </div>

          {/* Activity Trend (Last 7 Days) */}
          <div className="border border-zinc-200 rounded-lg bg-white">
            <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-3 rounded-t-lg">
              <h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-zinc-600" />
                Activity Trend
              </h2>
            </div>
            <div className="p-4">
              {chartData && chartData.activityTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData.activityTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      stroke="#71717a"
                    />
                    <YAxis tick={{ fontSize: 11 }} stroke="#71717a" />
                    <Tooltip content={<ChartTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="events"
                      stroke={COLORS.primary}
                      strokeWidth={2}
                      dot={{ fill: COLORS.primary, r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-xs text-zinc-500">
                  No activity data available
                </div>
              )}
            </div>
          </div>

          {/* Gate Events by Hour */}
          <div className="border border-zinc-200 rounded-lg bg-white">
            <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-3 rounded-t-lg">
              <h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                <Clock className="h-4 w-4 text-zinc-600" />
                Events by Hour
              </h2>
            </div>
            <div className="p-4">
              {chartData && chartData.eventsByHour.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData.eventsByHour.slice(-12)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                    <XAxis
                      dataKey="hour"
                      tick={{ fontSize: 10 }}
                      stroke="#71717a"
                    />
                    <YAxis tick={{ fontSize: 10 }} stroke="#71717a" />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="count" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-xs text-zinc-500">
                  No event data available
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Operational Metrics with Progress Bar */}
        <div className="grid grid-cols-3 gap-4">
          <div className="border border-zinc-200 rounded-lg bg-white">
            <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-3 rounded-t-lg">
              <h2 className="text-sm font-semibold text-zinc-900">Operational Metrics</h2>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-zinc-600">Pass utilization</span>
                  <span className="text-sm font-semibold text-zinc-900">{passUtilization}%</span>
                </div>
                <div className="w-full bg-zinc-100 rounded-full h-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all"
                    style={{ width: `${passUtilization}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between py-2 border-t border-zinc-100">
                <span className="text-sm text-zinc-600">Total gate passes</span>
                <span className="text-sm font-semibold text-zinc-900">{totalGatePasses}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-t border-zinc-100">
                <span className="text-sm text-zinc-600">Active check-ins</span>
                <span className="text-sm font-semibold text-zinc-900">{activeGatePasses}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-t border-zinc-100">
                <span className="text-sm text-zinc-600">Residents per house</span>
                <span className="text-sm font-semibold text-zinc-900">{avgResidentsPerHouse}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="border border-zinc-200 rounded-lg bg-white">
            <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-3 rounded-t-lg">
              <h2 className="text-sm font-semibold text-zinc-900">Quick Actions</h2>
            </div>
            <div className="p-3 space-y-2">
              <button
                onClick={() => router.push("/admin/houses")}
                className="w-full flex items-center justify-between px-3 py-2.5 text-left text-sm text-zinc-700 hover:bg-zinc-50 rounded-md transition-colors border border-transparent hover:border-zinc-200"
              >
                <div>
                  <div className="font-medium">Create house</div>
                  <div className="text-xs text-zinc-500">Add a property profile</div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-zinc-400" />
              </button>
              <button
                onClick={() => router.push("/admin/residents/create")}
                className="w-full flex items-center justify-between px-3 py-2.5 text-left text-sm text-zinc-700 hover:bg-zinc-50 rounded-md transition-colors border border-transparent hover:border-zinc-200"
              >
                <div>
                  <div className="font-medium">Add resident</div>
                  <div className="text-xs text-zinc-500">Link a user to houses</div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-zinc-400" />
              </button>
              <button
                onClick={() => router.push("/admin/gate")}
                className="w-full flex items-center justify-between px-3 py-2.5 text-left text-sm text-zinc-700 hover:bg-zinc-50 rounded-md transition-colors border border-transparent hover:border-zinc-200"
              >
                <div>
                  <div className="font-medium">Issue gate pass</div>
                  <div className="text-xs text-zinc-500">Manage visitor access</div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-zinc-400" />
              </button>
            </div>
          </div>

          {/* Recent Activity Summary */}
          <div className="border border-zinc-200 rounded-lg bg-white">
            <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-3 rounded-t-lg">
              <h2 className="text-sm font-semibold text-zinc-900">Activity Summary</h2>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-600">Recent houses</span>
                <span className="text-sm font-semibold text-zinc-900">{houses.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-600">Recent residents</span>
                <span className="text-sm font-semibold text-zinc-900">{residents.length}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
                <span className="text-sm text-zinc-600">Avg. residents/house</span>
                <span className="text-sm font-semibold text-zinc-900">{avgResidentsPerHouse}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Tables */}
        <div className="grid grid-cols-2 gap-4">
          {/* Recent houses table */}
          <div className="border border-zinc-200 rounded-lg bg-white">
            <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-3 rounded-t-lg">
              <h2 className="text-sm font-semibold text-zinc-900">Recent Houses</h2>
            </div>
              {!houses || houses.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-zinc-500">
                  No houses yet
              </div>
              ) : (
                <div className="divide-y divide-zinc-100">
                  {houses.slice(0, 5).map((house) => (
                    <div
                      key={house.id}
                      className="px-4 py-3 hover:bg-zinc-50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/admin/houses/${house.id}`)}
                    >
                      <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-zinc-900 truncate">{house.name}</div>
                          <div className="text-xs text-zinc-500 truncate mt-0.5">{house.address}</div>
                      </div>
                      {house.created_at && (
                          <div className="text-right ml-4 flex-shrink-0">
                            <div className="text-xs text-zinc-500">{formatDate(house.created_at)}</div>
                        </div>
                      )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>

          {/* Recent residents table */}
          <div className="border border-zinc-200 rounded-lg bg-white">
            <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-3 rounded-t-lg">
              <h2 className="text-sm font-semibold text-zinc-900">Recent Residents</h2>
            </div>
              {!residents || residents.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-zinc-500">
                  No residents yet
              </div>
              ) : (
                <div className="divide-y divide-zinc-100">
                  {residents.slice(0, 5).map((resident) => (
                    <div
                      key={resident.user.id}
                      className="px-4 py-3 hover:bg-zinc-50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/admin/residents/${resident.user.id}`)}
                    >
                      <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-zinc-900 truncate">
                            {getFullName(resident.user.first_name, resident.user.last_name)}
                          </div>
                          <div className="text-xs text-zinc-500 truncate mt-0.5">{resident.user.email}</div>
                        </div>
                        <div className="ml-4 flex-shrink-0">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 text-zinc-700">
                            {resident.houses?.length || 0} {resident.houses?.length === 1 ? 'house' : 'houses'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
