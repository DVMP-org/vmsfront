"use client";

import type { CSSProperties } from "react";

import {
  PanelState,
  ReportPanel,
  SeeAllLink,
} from "@/features/dashboard/DashboardPrimitives";

import type {
  HospitalityRoom,
  HousekeepingStatus,
  RoomOperationalStatus,
} from "./contracts";
import { roomReadiness } from "./room-readiness";

type ChartRow = { label: string; count: number; color: string };

const operationalStates: Array<{
  key: RoomOperationalStatus;
  label: string;
  color: string;
}> = [
  { key: "available", label: "Available", color: "var(--vms-data-primary)" },
  { key: "reserved", label: "Reserved", color: "var(--vms-data-secondary)" },
  { key: "occupied", label: "Occupied", color: "var(--vms-data-tertiary)" },
  { key: "cleaning", label: "Cleaning", color: "var(--vms-warning)" },
  {
    key: "out_of_service",
    label: "Out of service",
    color: "var(--vms-danger)",
  },
];

const housekeepingStates: Array<{
  key: HousekeepingStatus;
  label: string;
  color: string;
}> = [
  { key: "clean", label: "Clean", color: "var(--vms-data-primary)" },
  { key: "inspected", label: "Inspected", color: "var(--vms-success)" },
  { key: "in_progress", label: "In progress", color: "var(--vms-info)" },
  { key: "dirty", label: "Dirty", color: "var(--vms-warning)" },
];

export function RoomOperationsAnalytics({
  rooms,
  isLoading,
  error,
  onRetry,
}: {
  rooms: HospitalityRoom[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  const inventory = operationalStates.map((state) => ({
    label: state.label,
    count: rooms.filter((room) => room.status === state.key).length,
    color: state.color,
  }));
  const housekeeping = housekeepingStates.map((state) => ({
    label: state.label,
    count: rooms.filter((room) => room.housekeeping_status === state.key)
      .length,
    color: state.color,
  }));
  const readiness = roomReadiness(rooms);

  return (
    <ReportPanel
      title="Room operations"
      description="Current inventory and housekeeping state across this Site."
      action={
        <SeeAllLink href="/admin/hospitality/rooms">View inventory</SeeAllLink>
      }
      className="mt-4"
      footer={
        !isLoading && !error && rooms.length > 0
          ? `${readiness.ready} of ${rooms.length} rooms ready for assignment · ${readiness.issues.length} requiring work`
          : undefined
      }
    >
      {isLoading ? (
        <PanelState
          compact
          kind="loading"
          title="Loading room analytics"
          description="Reading the current room inventory."
        />
      ) : error ? (
        <PanelState
          compact
          kind="error"
          title="Room analytics are unavailable"
          description={error}
          onRetry={onRetry}
        />
      ) : rooms.length === 0 ? (
        <PanelState
          compact
          kind="empty"
          title="No room data yet"
          description="Add rooms to see their operational and housekeeping distribution."
        />
      ) : (
        <div className="grid gap-6 px-4 py-5 sm:px-5 lg:grid-cols-2 lg:gap-8">
          <BarTable
            title="Inventory by state"
            description="Which rooms are available, occupied or blocked?"
            rows={inventory}
            total={rooms.length}
          />
          <BarTable
            title="Housekeeping pipeline"
            description="How much cleaning and inspection work remains?"
            rows={housekeeping}
            total={rooms.length}
          />
        </div>
      )}
    </ReportPanel>
  );
}

function BarTable({
  title,
  description,
  rows,
  total,
}: {
  title: string;
  description: string;
  rows: ChartRow[];
  total: number;
}) {
  return (
    <figure className="min-w-0">
      <figcaption>
        <h3 className="text-sm font-semibold text-[var(--vms-ink)]">{title}</h3>
        <p className="mt-0.5 text-xs text-[var(--vms-ink-muted)]">
          {description}
        </p>
      </figcaption>
      <table className="mt-3 w-full border-separate border-spacing-y-1.5 text-xs">
        <caption className="sr-only">
          {title}: number and share of {total} Site rooms
        </caption>
        <thead className="sr-only">
          <tr>
            <th scope="col">State</th>
            <th scope="col">Share of rooms</th>
            <th scope="col">Rooms</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <th
                scope="row"
                className="w-28 pr-3 text-left font-medium text-[var(--vms-ink)]"
              >
                {row.label}
              </th>
              <td className="w-full py-1">
                <div
                  className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--vms-surface-subtle)]"
                  aria-hidden="true"
                >
                  <div
                    className="h-full rounded-full"
                    style={
                      {
                        width: `${(row.count / total) * 100}%`,
                        backgroundColor: row.color,
                      } as CSSProperties
                    }
                  />
                </div>
              </td>
              <td className="w-10 pl-3 text-right font-semibold tabular-nums text-[var(--vms-ink)]">
                {row.count}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div
        aria-hidden="true"
        className="ml-28 mr-10 flex justify-between text-[10px] tabular-nums text-[var(--vms-ink-muted)]"
      >
        <span>0%</span>
        <span>50%</span>
        <span>100%</span>
      </div>
    </figure>
  );
}
