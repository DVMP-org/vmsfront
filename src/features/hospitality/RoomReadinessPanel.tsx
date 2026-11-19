"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import {
  PanelState,
  ReportPanel,
  SeeAllLink,
} from "@/features/dashboard/DashboardPrimitives";
import { formatDateTime } from "@/lib/datetime";

import type { HospitalityRoom } from "./contracts";
import { roomReadiness, type RoomIssue } from "./room-readiness";

const issueColors: Record<
  RoomIssue["kind"],
  { row: string; badge: "danger" | "warning" | "info" }
> = {
  out_of_service: {
    row: "border-l-[3px] border-l-[var(--vms-danger)] bg-[color-mix(in_srgb,var(--vms-danger)_4%,white)]",
    badge: "danger",
  },
  maintenance: {
    row: "border-l-[3px] border-l-[var(--vms-warning)] bg-[color-mix(in_srgb,var(--vms-warning)_4%,white)]",
    badge: "warning",
  },
  dirty: {
    row: "border-l-[3px] border-l-[var(--vms-warning)] bg-[color-mix(in_srgb,var(--vms-warning)_4%,white)]",
    badge: "warning",
  },
  cleaning: {
    row: "border-l-[3px] border-l-[var(--vms-info)] bg-[color-mix(in_srgb,var(--vms-info)_4%,white)]",
    badge: "info",
  },
};

export function RoomReadinessPanel({
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
  const { issues } = roomReadiness(rooms);

  return (
    <ReportPanel
      title="Room readiness"
      description="Rooms needing attention before the next guest."
      action={
        <SeeAllLink href="/admin/hospitality/rooms">View rooms</SeeAllLink>
      }
      footer={
        <Link
          href="/admin/hospitality/housekeeping"
          className="inline-flex items-center gap-1 font-semibold text-[var(--vms-ink)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]"
        >
          Open housekeeping <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      }
    >
      {isLoading ? (
        <PanelState
          compact
          kind="loading"
          title="Loading rooms"
          description="Checking operational and housekeeping states."
        />
      ) : error ? (
        <PanelState
          compact
          kind="error"
          title="Room readiness is unavailable"
          description={error}
          onRetry={onRetry}
        />
      ) : rooms.length === 0 ? (
        <PanelState
          compact
          kind="empty"
          title="No rooms configured"
          description="Add rooms to track availability and housekeeping work."
        />
      ) : issues.length === 0 ? (
        <p className="px-4 py-4 text-sm text-[var(--vms-ink-muted)] sm:px-5">
          No room issues or cleaning work are recorded.
        </p>
      ) : (
        <ul className="divide-y divide-[var(--vms-line)]">
          {issues.slice(0, 5).map(({ room, reason, kind }) => (
            <li
              key={room.id}
              className={`flex min-h-14 items-center justify-between gap-4 px-4 py-3 sm:px-5 ${issueColors[kind].row}`}
            >
              <div className="min-w-0">
                <strong className="block truncate text-sm font-semibold text-[var(--vms-ink)]">
                  {room.name}
                </strong>
                <span className="mt-0.5 block truncate text-xs text-[var(--vms-ink-muted)]">
                  {room.next_arrival
                    ? `Next arrival ${formatDateTime(room.next_arrival)}`
                    : room.room_number}
                </span>
              </div>
              <Badge
                variant={issueColors[kind].badge}
                className="shrink-0 text-right"
              >
                {reason}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </ReportPanel>
  );
}
