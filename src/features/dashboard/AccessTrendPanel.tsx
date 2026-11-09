"use client";

import { useId, useMemo } from "react";

import type { AnalyticsSummary, AnalyticsTimeSeriesPoint } from "@/types";
import { PanelState, ReportPanel } from "./DashboardPrimitives";

export type DashboardRange = 7 | 14 | 30;

export interface AccessDecisionPoint {
  date: string;
  label: string;
  allowed: number;
  denied: number;
}

const dateLabel = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
});

function normalizeDate(value: string) {
  return value.slice(0, 10);
}

export function buildDecisionSeries(
  analytics: AnalyticsSummary | undefined,
  range: DashboardRange,
): AccessDecisionPoint[] {
  const timeSeries = analytics?.time_series;
  if (!timeSeries) return [];

  const byDate = new Map<string, AccessDecisionPoint>();
  const ingest = (
    kind: "allowed" | "denied",
    points: AnalyticsTimeSeriesPoint[] | undefined,
  ) => {
    const safePoints = Array.isArray(points) ? points : [];
    safePoints.forEach((point) => {
      const date = normalizeDate(point.date);
      const parsed = new Date(`${date}T00:00:00`);
      const label = Number.isNaN(parsed.getTime())
        ? date
        : dateLabel.format(parsed);
      const current = byDate.get(date) ?? {
        date,
        label,
        allowed: 0,
        denied: 0,
      };
      current[kind] = point.count;
      byDate.set(date, current);
    });
  };

  ingest("allowed", timeSeries.allowed_passages);
  ingest("denied", timeSeries.denied_passages);

  return Array.from(byDate.values())
    .sort((left, right) => left.date.localeCompare(right.date))
    .slice(-range);
}

function linePoints(
  series: AccessDecisionPoint[],
  field: "allowed" | "denied",
  max: number,
) {
  const width = 720;
  const height = 260;
  const left = 42;
  const right = 18;
  const top = 18;
  const bottom = 38;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const denominator = Math.max(series.length - 1, 1);

  return series
    .map((point, index) => {
      const x = left + (index / denominator) * plotWidth;
      const y = top + plotHeight - (point[field] / max) * plotHeight;
      return `${x},${y}`;
    })
    .join(" ");
}

function formatNumber(value: number) {
  return new Intl.NumberFormat().format(value);
}

export function AccessTrendPanel({
  analytics,
  range,
  isLoading,
  isError,
  isFetching,
  onRetry,
}: {
  analytics?: AnalyticsSummary;
  range: DashboardRange;
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  onRetry: () => void;
}) {
  const titleId = useId().replaceAll(":", "");
  const series = useMemo(
    () => buildDecisionSeries(analytics, range),
    [analytics, range],
  );
  const totalAllowed = series.reduce(
    (total, point) => total + point.allowed,
    0,
  );
  const totalDenied = series.reduce((total, point) => total + point.denied, 0);
  const max = Math.max(
    1,
    ...series.flatMap((point) => [point.allowed, point.denied]),
  );
  const allowedPoints = linePoints(series, "allowed", max);
  const deniedPoints = linePoints(series, "denied", max);
  const tickIndices = Array.from(
    new Set([0, Math.floor((series.length - 1) / 2), series.length - 1]),
  ).filter((index) => index >= 0);

  return (
    <ReportPanel
      title="Access decisions"
      description={`Allowed and denied checkpoint passages across the last ${range} reporting days.`}
    >
      {isLoading ? (
        <PanelState
          kind="loading"
          title="Loading access decisions"
          description="Preparing the latest checkpoint activity."
        />
      ) : isError ? (
        <PanelState
          kind="error"
          title="Access trend unavailable"
          description="The dashboard totals remain available. Retry the decision report without leaving this page."
          onRetry={onRetry}
          isRetrying={isFetching}
        />
      ) : !series.some((point) => point.allowed > 0 || point.denied > 0) ? (
        <PanelState
          kind="empty"
          title="No checkpoint decisions in this period"
          description="Allowed and denied checkpoint decisions will appear after the next recorded passage."
        />
      ) : (
        <>
          <div className="px-4 pt-4 sm:px-5">
            <p className="text-sm text-[var(--vms-ink-muted)]">
              <strong className="font-semibold text-[var(--vms-ink)]">
                {formatNumber(totalAllowed)} allowed
              </strong>{" "}
              and{" "}
              <strong className="font-semibold text-[var(--vms-ink)]">
                {formatNumber(totalDenied)} denied
              </strong>{" "}
              checkpoint decisions were recorded in the selected period.
            </p>
          </div>

          <div className="mt-2 overflow-hidden px-2 sm:px-4">
            <svg
              viewBox="0 0 720 260"
              role="img"
              aria-labelledby={`${titleId}-chart-title ${titleId}-chart-description`}
              className="h-auto w-full"
            >
              <title id={`${titleId}-chart-title`}>Access decision chart</title>
              <desc id={`${titleId}-chart-description`}>
                Allowed passages use the dark primary data line and denied
                passages use the slate comparison line. Exact values are
                available in the data table below.
              </desc>
              {[0, 0.5, 1].map((position) => {
                const y = 18 + 204 - position * 204;
                return (
                  <g key={position}>
                    <line
                      x1="42"
                      x2="702"
                      y1={y}
                      y2={y}
                      className="stroke-[var(--vms-line)]"
                      strokeWidth="1"
                    />
                    <text
                      x="34"
                      y={y + 4}
                      textAnchor="end"
                      className="fill-[var(--vms-ink-muted)] text-[11px]"
                    >
                      {Math.round(max * position)}
                    </text>
                  </g>
                );
              })}
              <polyline
                points={allowedPoints}
                fill="none"
                className="stroke-[var(--vms-data-primary)]"
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
              <polyline
                points={deniedPoints}
                fill="none"
                className="stroke-[var(--vms-data-secondary)]"
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeDasharray="5 4"
                vectorEffect="non-scaling-stroke"
              />
              {tickIndices.map((index) => {
                const x =
                  42 +
                  (index / Math.max(series.length - 1, 1)) * (720 - 42 - 18);
                return (
                  <text
                    key={series[index].date}
                    x={x}
                    y="246"
                    textAnchor={
                      index === 0
                        ? "start"
                        : index === series.length - 1
                          ? "end"
                          : "middle"
                    }
                    className="fill-[var(--vms-ink-muted)] text-[11px]"
                  >
                    {series[index].label}
                  </text>
                );
              })}
            </svg>
          </div>

          <div className="flex flex-wrap gap-4 px-4 pb-4 text-xs text-[var(--vms-ink-muted)] sm:px-5">
            <span className="flex items-center gap-2">
              <span className="h-0.5 w-5 bg-[var(--vms-data-primary)]" />
              Allowed
            </span>
            <span className="flex items-center gap-2">
              <span className="h-0.5 w-5 border-t-2 border-dashed border-[var(--vms-data-secondary)]" />
              Denied
            </span>
          </div>

          <details className="border-t border-[var(--vms-line)] px-4 py-3 sm:px-5">
            <summary className="cursor-pointer text-xs font-semibold text-[var(--vms-ink)]">
              View exact data table
            </summary>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[440px] text-left text-xs">
                <caption className="sr-only">
                  Allowed and denied checkpoint decisions by date
                </caption>
                <thead className="bg-[var(--vms-surface-subtle)] text-[var(--vms-ink-muted)]">
                  <tr>
                    <th scope="col" className="px-3 py-2 font-semibold">
                      Date
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2 text-right font-semibold"
                    >
                      Allowed
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2 text-right font-semibold"
                    >
                      Denied
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {series.map((point) => (
                    <tr
                      key={point.date}
                      className="border-t border-[var(--vms-line)]"
                    >
                      <th scope="row" className="px-3 py-2 font-medium">
                        <time dateTime={point.date}>{point.label}</time>
                      </th>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {formatNumber(point.allowed)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {formatNumber(point.denied)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
    </ReportPanel>
  );
}
