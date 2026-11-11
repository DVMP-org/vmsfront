"use client";

import { ArrowRight, Building, Building2, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LobbyWorkspace, LobbyWorkspaceType } from "./lobby";

const iconByType: Record<
  LobbyWorkspaceType,
  React.ComponentType<{ className?: string }>
> = {
  organization: Building2,
  site_admin: Building,
  party: Home,
};

const actionLabelByType: Record<LobbyWorkspaceType, string> = {
  organization: "Open",
  site_admin: "Open workspace",
  party: "Open",
};

export function LobbyWorkspaceCard({
  workspace,
  emphasized = false,
  onOpen,
}: {
  workspace: LobbyWorkspace;
  emphasized?: boolean;
  onOpen: (workspace: LobbyWorkspace) => void;
}) {
  const Icon = iconByType[workspace.type];

  return (
    <button
      type="button"
      onClick={() => onOpen(workspace)}
      className="group flex min-h-[112px] w-full items-center gap-4 rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-5 text-left transition-colors duration-[var(--vms-motion)] hover:border-[var(--vms-line-strong)] hover:bg-[color-mix(in_srgb,var(--vms-surface-subtle)_55%,white)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)] focus-visible:ring-offset-2 sm:gap-5 sm:p-6"
    >
      <span
        aria-hidden="true"
        className="grid h-12 w-12 shrink-0 place-items-center rounded-[var(--vms-radius-control)] bg-[var(--vms-surface-subtle)] text-[var(--vms-ink)] sm:h-24 sm:w-24"
      >
        <Icon className="h-6 w-6 sm:h-8 sm:w-8" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--vms-ink-muted)]">
            {workspace.category}
          </span>
          <span className="rounded-full border border-[var(--vms-line)] bg-[var(--vms-surface)] px-2 py-0.5 text-[11px] font-medium text-[var(--vms-ink-muted)]">
            {workspace.roleLabel}
          </span>
        </span>
        <span className="mt-1.5 block text-base font-semibold tracking-[-0.02em] text-[var(--vms-ink)] sm:text-lg">
          {workspace.title}
        </span>
        <span className="mt-1 block text-sm leading-6 text-[var(--vms-ink-muted)]">
          {workspace.description}
        </span>
      </span>

      <span className="flex shrink-0 items-center">
        <span
          className={cn(
            "hidden min-h-11 items-center gap-2 rounded-[var(--vms-radius-control)] px-4 text-sm font-semibold transition-colors duration-[var(--vms-motion)] sm:inline-flex",
            emphasized
              ? "bg-[var(--vms-action)] text-[var(--vms-on-action)] group-hover:bg-[var(--vms-action-hover)]"
              : "border border-[var(--vms-line-strong)] bg-[var(--vms-surface)] text-[var(--vms-ink)] group-hover:bg-[var(--vms-surface-subtle)]",
          )}
        >
          {actionLabelByType[workspace.type]}
          <ArrowRight className="h-4 w-4" />
        </span>
        <ArrowRight
          aria-hidden="true"
          className="h-5 w-5 text-[var(--vms-ink-muted)] transition-transform duration-[var(--vms-motion)] group-hover:translate-x-0.5 sm:hidden"
        />
      </span>
    </button>
  );
}
