"use client";

import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ShieldCheck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export function FirstWorkspaceSetup({
  rootPlaceCount,
  onOpenProperties,
  onDismiss,
}: {
  rootPlaceCount: number;
  onOpenProperties: () => void;
  onDismiss: () => void;
}) {
  const propertyReady = rootPlaceCount > 0;

  return (
    <section
      aria-labelledby="first-workspace-title"
      className="overflow-hidden rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)]"
    >
      <div className="flex items-start justify-between gap-4 border-b border-[var(--vms-line)] p-5 sm:p-6">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--vms-ink-muted)]">
            <CheckCircle2 className="h-4 w-4" />
            {propertyReady ? "Setup complete" : "Organization ready"}
          </p>
          <h2
            id="first-workspace-title"
            className="mt-2 text-xl font-semibold tracking-[-0.025em]"
          >
            {propertyReady
              ? "Your management workspace is ready"
              : "Create your first site"}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--vms-ink-muted)]">
            {propertyReady
              ? "The organization, plan and management context are active. Review the first site hierarchy before inviting people or configuring access."
              : "The organization and management role are active. Create the top-level site that will own its people, gates, policies and visitor access."}
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-[var(--vms-radius-control)] text-[var(--vms-ink-muted)] transition hover:bg-[var(--vms-surface-subtle)] hover:text-[var(--vms-ink)]"
          aria-label="Dismiss first workspace setup"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid gap-px bg-[var(--vms-line)] sm:grid-cols-3">
        <SetupState
          icon={ShieldCheck}
          label="Management access"
          detail="Administrator workspace"
        />
        <SetupState
          icon={Building2}
          label="Property hierarchy"
          detail={
            propertyReady
              ? `${rootPlaceCount} root ${rootPlaceCount === 1 ? "site" : "sites"}`
              : "No site created yet"
          }
          attention={!propertyReady}
        />
        <SetupState
          icon={CheckCircle2}
          label="Next step"
          detail={
            propertyReady
              ? "Review the first site"
              : "Create the first site"
          }
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:px-6">
        <p className="text-xs text-[var(--vms-ink-muted)]">
          You can return to this checklist from the Properties page.
        </p>
        <Button type="button" onClick={onOpenProperties}>
          {propertyReady ? "Review first site" : "Create your first site"}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </section>
  );
}

function SetupState({
  icon: Icon,
  label,
  detail,
  attention = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  detail: string;
  attention?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 bg-[var(--vms-surface)] p-4">
      <span
        className={
          attention
            ? "grid h-9 w-9 shrink-0 place-items-center rounded-[var(--vms-radius-control)] bg-[var(--vms-warning-subtle)] text-[var(--vms-warning)]"
            : "grid h-9 w-9 shrink-0 place-items-center rounded-[var(--vms-radius-control)] bg-[var(--vms-surface-subtle)] text-[var(--vms-action)]"
        }
      >
        <Icon className="h-4 w-4" />
      </span>
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        <span className="mt-0.5 block text-xs leading-5 text-[var(--vms-ink-muted)]">
          {detail}
        </span>
      </span>
    </div>
  );
}
