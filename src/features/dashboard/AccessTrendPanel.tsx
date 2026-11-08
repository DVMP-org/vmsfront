"use client";

import { useId, useMemo } from "react";

import type { AnalyticsSummary } from "@/types";
import { PanelState, ReportPanel } from "./DashboardPrimitives";

export type DashboardRange = 7 | 14 | 30;

interface MovementPoint {
  date: string;
  label: string;
  checkins: number;
  checkouts: number;
}

const dateLabel = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
});

function buildMovementSeries(
  analytics: AnalyticsSummary | undefined,
  range: DashboardRange,
): MovementPoint[] {
  if (!analytics) return [];

  const byDate = new Map<string, MovementPoint>();
  const ingest = (kind: "checkins" | "checkouts") => {
    analytics.time_series[kind].forEach((point) => {
      const parsed = new Date(`${point.date}T00:00:00`);
      const label = Number.isNaN(parsed.getTime())
        ? point.date
        : dateLabel.format(parsed);
      const current = byDate.get(point.date) ?? {
        date: point.date,
        label,
        checkins: 0,
        checkouts: 0,
      };
      current[kind] = point.count;
      byDate.set(point.date, current);
    });
  };

  ingest("checkins");
  ingest("checkouts");

  return Array.from(byDate.values())
    .sort((left, right) => left.date.localeCompare(right.date))
    .slice(-range);
}

function linePoints(
  series: MovementPoint[],
  field: "checkins" | "checkouts",
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
    () => buildMovementSeries(analytics, range),
    [analytics, range],
  );
  const totalCheckins = series.reduce(
    (total, point) => total + point.checkins,
    0,
  );
  const totalCheckouts = series.reduce(
    (total, point) => total + point.checkouts,
    0,
  );
  const max = Math.max(
    1,
    ...series.flatMap((point) => [point.checkins, point.checkouts]),
  );
  const checkinPoints = linePoints(series, "checkins", max);
  const checkoutPoints = linePoints(series, "checkouts", max);
  const tickIndices = Array.from(
    new Set([0, Math.floor((series.length - 1) / 2), series.length - 1]),
  ).filter((index) => index >= 0);

  return (
    <ReportPanel
      title="Access movement"
      description={`Check-ins and check-outs across the last ${range} reporting days.`}
    >
      {isLoading ? (
        <PanelState
          kind="loading"
          title="Loading access movement"
          description="Preparing the latest checkpoint activity."
        />
      ) : isError ? (
        <PanelState
          kind="error"
          title="Access trend unavailable"
          description="The dashboard totals remain available. Retry the movement report without leaving this page."
          onRetry={onRetry}
          isRetrying={isFetching}
        />
      ) : !series.some(
          (point) => point.checkins > 0 || point.checkouts > 0,
        ) ? (
        <PanelState
          kind="empty"
          title="No access movement in this period"
          description="Checkpoint activity will appear here after the next recorded entry or exit."
        />
      ) : (
        <>
          <div className="px-4 pt-4 sm:px-5">
            <p className="text-sm text-[var(--vms-ink-muted)]">
              <strong className="font-semibold text-[var(--vms-ink)]">
                {formatNumber(totalCheckins)} check-ins
              </strong>{" "}
              and{" "}
              <strong className="font-semibold text-[var(--vms-ink)]">
                {formatNumber(totalCheckouts)} check-outs
              </strong>{" "}
              were recorded in the selected period.
            </p>
          </div>

          <div className="mt-2 overflow-hidden px-2 sm:px-4">
            <svg
              viewBox="0 0 720 260"
              role="img"
              aria-labelledby={`${titleId}-chart-title ${titleId}-chart-description`}
              className="h-auto w-full"
            >
              <title id={`${titleId}-chart-title`}>Access movement chart</title>
              <desc id={`${titleId}-chart-description`}>
                Check-ins use the dark primary data line and check-outs use the
                slate comparison line. Exact values are available in the data
                table below.
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
                points={checkinPoints}
                fill="none"
                className="stroke-[var(--vms-data-primary)]"
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
              <polyline
                points={checkoutPoints}
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
              Check-ins
            </span>
            <span className="flex items-center gap-2">
              <span className="h-0.5 w-5 border-t-2 border-dashed border-[var(--vms-data-secondary)]" />
              Check-outs
            </span>
          </div>

          <details className="border-t border-[var(--vms-line)] px-4 py-3 sm:px-5">
            <summary className="cursor-pointer text-xs font-semibold text-[var(--vms-ink)]">
              View exact data table
            </summary>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[440px] text-left text-xs">
                <caption className="sr-only">
                  Check-ins and check-outs by date
                </caption>
                <thead className="bg-[var(--vms-surface-subtle)] text-[var(--vms-ink-muted)]">
                  <tr>
                    <th scope="col" className="px-3 py-2 font-semibold">
                      Date
                    </th>
                    <th scope="col" className="px-3 py-2 text-right font-semibold">
                      Check-ins
                    </th>
                    <th scope="col" className="px-3 py-2 text-right font-semibold">
                      Check-outs
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
                        {formatNumber(point.checkins)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {formatNumber(point.checkouts)}
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
