"use client";

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
    LineChart,
    Line,
} from "recharts";
import { ShieldCheck, TrendingUp, Clock } from "lucide-react";

const COLORS = {
    primary: "#3b82f6",
    success: "#10b981",
    warning: "#f59e0b",
    danger: "#ef4444",
    purple: "#8b5cf6",
    zinc: "#71717a",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-lg">
            <p className="font-semibold text-zinc-900 mb-1">{label}</p>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
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

interface DashboardChartsProps {
    chartData: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        statusChartData: any[];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        eventsByHour: any[];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        activityTrend: any[];
    } | null;
}

export default function DashboardCharts({ chartData }: DashboardChartsProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Gate Pass Status Distribution */}
            <div className="border border-foreground/20 rounded-lg">
                <div className="border-b border-foreground/20 px-4 py-3 rounded-t-lg">
                    <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-[var(--brand-primary,#213928)]" />
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
            <div className="border border-foreground/20 rounded-lg">
                <div className="border-b border-foreground/20 px-4 py-3 rounded-t-lg">
                    <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-[var(--brand-primary,#213928)]" />
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
                                    name="Check-ins"
                                    type="monotone"
                                    dataKey="checkins"
                                    stroke={COLORS.primary}
                                    strokeWidth={2}
                                    dot={{ fill: COLORS.primary, r: 3 }}
                                />
                                <Line
                                    name="Check-outs"
                                    type="monotone"
                                    dataKey="checkouts"
                                    stroke={COLORS.success}
                                    strokeWidth={2}
                                    dot={{ fill: COLORS.success, r: 3 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[200px] flex items-center justify-center text-xs text-foreground">
                            No activity data available
                        </div>
                    )}
                </div>
            </div>

            {/* Gate Events by Hour */}
            <div className="border border-foreground/20 rounded-lg">
                <div className="border-b border-foreground/20 px-4 py-3 rounded-t-lg">
                    <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Clock className="h-4 w-4 text-[var(--brand-primary,#213928)]" />
                        Events by Hour
                    </h2>
                </div>
                <div className="p-4">
                    {chartData && chartData.eventsByHour.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={chartData.eventsByHour.slice(-12)}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                                <XAxis
                                    dataKey="label"
                                    tick={{ fontSize: 10 }}
                                    stroke="#71717a"
                                />
                                <YAxis tick={{ fontSize: 10 }} stroke="#71717a" />
                                <Tooltip content={<ChartTooltip />} />
                                <Bar name="Check-ins" dataKey="checkins" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                                <Bar name="Check-outs" dataKey="checkouts" fill={COLORS.success} radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[200px] flex items-center justify-center text-xs text-foreground">
                            No event data available
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
