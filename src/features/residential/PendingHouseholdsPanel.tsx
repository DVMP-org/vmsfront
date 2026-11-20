"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  PanelState,
  ReportPanel,
  SeeAllLink,
} from "@/features/dashboard/DashboardPrimitives";
import type { WorkspaceRelationship } from "@/types";

export function PendingHouseholdsPanel({
  relationships,
  isLoading,
  error,
  isComplete,
  onRetry,
}: {
  relationships: WorkspaceRelationship[];
  isLoading: boolean;
  error: string | null;
  isComplete: boolean;
  onRetry: () => void;
}) {
  return (
    <ReportPanel
      title="Pending households"
      description="Unit relationships awaiting a decision."
      action={
        <SeeAllLink href="/admin/residential/occupancies">
          View residents
        </SeeAllLink>
      }
      footer={
        !isLoading && !error && !isComplete
          ? "Showing pending relationships from the loaded page. Open Residents & households to review the full register."
          : undefined
      }
    >
      {isLoading ? (
        <PanelState
          compact
          kind="loading"
          title="Loading households"
          description="Checking unit relationships."
        />
      ) : error ? (
        <PanelState
          compact
          kind="error"
          title="Households are unavailable"
          description={error}
          onRetry={onRetry}
        />
      ) : relationships.length ? (
        <ul className="divide-y divide-[var(--vms-line)]">
          {relationships.slice(0, 5).map((relationship) => (
            <li key={relationship.id}>
              <Link
                href={`/admin/residential/occupancies/${relationship.id}`}
                className="flex min-h-14 items-center justify-between gap-3 px-4 py-3 text-[var(--vms-ink)] transition-colors hover:bg-[var(--vms-surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--vms-focus)] motion-reduce:transition-none sm:px-5"
              >
                <span className="min-w-0">
                  <strong className="block truncate text-sm font-semibold">
                    {relationship.party.display_name}
                  </strong>
                  <span className="block truncate text-xs text-[var(--vms-ink-muted)]">
                    {relationship.place.name}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <StatusBadge tone="warning">Pending</StatusBadge>
                  <ArrowRight
                    className="h-4 w-4 text-[var(--vms-ink-muted)]"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-4 py-4 text-sm text-[var(--vms-ink-muted)] sm:px-5">
          {isComplete
            ? "No household relationships are awaiting review."
            : "No pending households in the loaded results."}
        </p>
      )}
    </ReportPanel>
  );
}
