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
      aria-label={`Open ${workspace.title} workspace`}
      onClick={() => onOpen(workspace)}
      className={cn(
        "group relative flex w-full items-center gap-3 overflow-hidden rounded-[var(--vms-radius-surface)] border bg-[var(--vms-surface)] px-4 py-1.5 text-left shadow-[var(--vms-shadow-raised)] transition-[background-color,border-color,box-shadow,transform] duration-150 ease-out hover:-translate-y-px hover:border-[var(--vms-line-strong)] hover:bg-[var(--vms-surface-subtle)] hover:shadow-[0_4px_12px_rgb(31_41_51_/_0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)] focus-visible:ring-offset-2 motion-reduce:transform-none motion-reduce:transition-none sm:gap-4 sm:px-5",
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
        <span className="mt-0.5 block line-clamp-2 break-words text-sm font-semibold leading-5 tracking-[-0.02em] text-[var(--vms-ink)] sm:text-base">
          {workspace.title}
        </span>
      </span>

      <span aria-hidden="true" className="flex shrink-0 items-center">
        <span
          className={cn(
            "hidden h-9 w-9 items-center justify-center rounded-[var(--vms-radius-control)] transition-colors duration-150 sm:inline-flex",
            emphasized
              ? "bg-[var(--vms-action)] text-[var(--vms-on-action)] group-hover:bg-[var(--vms-action-hover)]"
              : "border border-[var(--vms-line-strong)] bg-[var(--vms-surface)] text-[var(--vms-ink)] group-hover:bg-[var(--vms-surface-subtle)]",
          )}
        >
          <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5 motion-reduce:transform-none" />
        </span>
        <ArrowRight
          aria-hidden="true"
          className="size-5 text-[var(--vms-ink-muted)] transition-transform duration-[var(--vms-motion)] group-hover:translate-x-0.5 sm:hidden"
        />
      </span>
    </button>
  );
}
