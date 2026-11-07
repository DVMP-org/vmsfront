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
      className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="flex items-start justify-between gap-4 border-b border-zinc-100 p-5 dark:border-zinc-800 sm:p-6">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[rgb(var(--brand-primary,#213928))] dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
            Setup complete
          </p>
          <h2
            id="first-workspace-title"
            className="mt-2 text-xl font-semibold tracking-[-0.025em]"
          >
            Your management workspace is ready
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500 dark:text-zinc-400">
            The organization, plan and management context are active. Review the
            first property hierarchy before inviting people or configuring
            access.
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          aria-label="Dismiss first workspace setup"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid gap-px bg-zinc-100 dark:bg-zinc-800 sm:grid-cols-3">
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
              ? `${rootPlaceCount} root ${rootPlaceCount === 1 ? "property" : "properties"}`
              : "No property created yet"
          }
          attention={!propertyReady}
        />
        <SetupState
          icon={CheckCircle2}
          label="Next step"
          detail={
            propertyReady
              ? "Review the first property"
              : "Create the first property"
          }
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:px-6">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          You can return to this checklist from the Properties page.
        </p>
        <Button type="button" onClick={onOpenProperties}>
          {propertyReady ? "Review first property" : "Create first property"}
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
    <div className="flex items-start gap-3 bg-white p-4 dark:bg-zinc-900">
      <span
        className={
          attention
            ? "grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-200"
            : "grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[rgb(var(--brand-primary,#213928)/0.08)] text-[rgb(var(--brand-primary,#213928))] dark:bg-emerald-950/40 dark:text-emerald-200"
        }
      >
        <Icon className="h-4 w-4" />
      </span>
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        <span className="mt-0.5 block text-xs leading-5 text-zinc-500 dark:text-zinc-400">
          {detail}
        </span>
      </span>
    </div>
  );
}
