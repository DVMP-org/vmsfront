"use client";

import {
  ArrowRight,
  BedDouble,
  Briefcase,
  Building,
  Building2,
  Crown,
  Home,
} from "lucide-react";
import { domainExperience, type DomainUseCase } from "@/config/domains";
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

const iconByDomain: Record<
  DomainUseCase,
  React.ComponentType<{ className?: string }>
> = {
  residential: Home,
  commercial: Briefcase,
  hospitality: BedDouble,
  mixed_use: Building,
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
  const domain = domainExperience(workspace.useCase);
  const Icon =
    workspace.type === "organization"
      ? iconByType.organization
      : domain
        ? iconByDomain[domain.domain]
        : iconByType[workspace.type];

  return (
    <button
      type="button"
      onClick={() => onOpen(workspace)}
      className={cn(
        "group relative flex w-full items-center gap-3 overflow-hidden rounded-[var(--vms-radius-surface)] border bg-[var(--vms-surface)] px-4 py-1.5 text-left shadow-[var(--vms-shadow-raised)] transition-colors duration-[var(--vms-motion)] hover:border-[var(--vms-line-strong)] hover:bg-[var(--vms-surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)] focus-visible:ring-offset-2 sm:gap-4 sm:px-5",
        emphasized
          ? "min-h-[92px] border-[var(--vms-coral-accent)] bg-[color-mix(in_srgb,var(--vms-coral-accent)_4%,white)] "
          : "min-h-[72px] border-[var(--vms-line)]",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "grid size-12 shrink-0 place-items-center rounded-[var(--vms-radius-control)]",
          emphasized
            ? "bg-[color-mix(in_srgb,var(--vms-coral-accent)_10%,white)] text-[var(--vms-ink)] sm:size-14"
            : "bg-[var(--vms-surface-subtle)] text-[var(--vms-ink)]",
        )}
      >
        <Icon className="size-5 sm:size-6" />
      </span>

      <span className="min-w-0 flex-1 border-l border-[var(--vms-line-strong)] pl-3 sm:pl-4">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--vms-ink-muted)]">
            {workspace.category}
          </span>
          {workspace.type !== "site_admin" && workspace.roleLabel ? (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium leading-3",
                emphasized
                  ? "border-[color-mix(in_srgb,var(--vms-coral-accent)_35%,white)] bg-[color-mix(in_srgb,var(--vms-coral-accent)_8%,white)] text-[var(--vms-coral-accent)]"
                  : "border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] text-[var(--vms-ink-muted)]",
              )}
            >
              {emphasized && /super/i.test(workspace.roleLabel) ? (
                <Crown className="size-3" aria-hidden="true" />
              ) : null}
              {workspace.roleLabel}
            </span>
          ) : null}
        </span>
        <span className="mt-0.5 block truncate text-sm font-semibold tracking-[-0.02em] text-[var(--vms-ink)] sm:text-base">
          {workspace.title}
        </span>
        <span className="block truncate text-xs leading-4 text-[var(--vms-ink-muted)] sm:text-[13px]">
          {workspace.description}
        </span>
      </span>

      <span className="flex shrink-0 items-center">
        <span
          className={cn(
            "hidden min-h-9 items-center gap-2 rounded-[var(--vms-radius-control)] px-4 text-xs font-semibold transition-colors duration-[var(--vms-motion)] sm:inline-flex",
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
          className="size-5 text-[var(--vms-ink-muted)] transition-transform duration-[var(--vms-motion)] group-hover:translate-x-0.5 sm:hidden"
        />
      </span>
    </button>
  );
}
