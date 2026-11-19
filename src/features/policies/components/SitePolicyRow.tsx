"use client";

import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

import type { PolicyEntry, PolicyValue } from "../api";
import {
    formatPolicyValue,
    policySourceLabel,
    policySourceTone,
} from "../lib";
import { PolicyValueControl } from "./PolicyValueControl";

const toneClass = {
    neutral: "border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] text-[var(--vms-ink-muted)]",
    info: "border-[var(--vms-info)] bg-[var(--vms-info-subtle,var(--vms-surface-subtle))] text-[var(--vms-info)]",
    accent:
        "border-[var(--vms-active-accent)] bg-[var(--vms-surface-subtle)] text-[var(--vms-ink)]",
} as const;

export function SitePolicyRow({
    policy,
    value,
    onChange,
    onReset,
    disabled,
    isDirty,
    isResetting,
}: {
    policy: PolicyEntry;
    value: PolicyValue;
    onChange: (value: PolicyValue) => void;
    onReset: () => void;
    disabled: boolean;
    isDirty: boolean;
    isResetting: boolean;
}) {
    const sourceLabel =
        policy.source === "organization_template" && policy.template_name
            ? policy.template_name
            : policySourceLabel(policy.source);
    const locked = !policy.editable || policy.guardrail;

    return (
        <li className="grid gap-4 border-b border-[var(--vms-line)] px-4 py-5 last:border-b-0 sm:px-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(220px,0.8fr)_auto] lg:items-start">
            <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm font-semibold text-[var(--vms-ink)]">
                        {policy.name}
                    </h4>
                    <span
                        className={cn(
                            "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]",
                            toneClass[policySourceTone(policy.source)],
                        )}
                    >
                        {sourceLabel}
                    </span>
                    {isDirty ? (
                        <span className="text-[11px] font-semibold text-[var(--vms-active-accent)]">
                            Unsaved
                        </span>
                    ) : null}
                </div>
                <p className="mt-1.5 max-w-2xl text-xs leading-5 text-[var(--vms-ink-muted)]">
                    {policy.description}
                </p>
                <p className="mt-2 text-xs text-[var(--vms-ink-muted)]">
                    Current:{" "}
                    <span className="font-semibold text-[var(--vms-ink)]">
                        {formatPolicyValue(policy, policy.effective_value)}
                    </span>
                    {policy.template_name &&
                        policy.source === "organization_template" ? (
                        <> · from {policy.template_name}</>
                    ) : null}
                    {policy.has_site_override ? <> · this site overrides</> : null}
                </p>
                {locked ? (
                    <p className="mt-2 text-xs leading-5 text-[var(--vms-ink-muted)]">
                        Set by the platform. Sites cannot override this policy.
                    </p>
                ) : !policy.editable ? (
                    <p className="mt-2 text-xs leading-5 text-[var(--vms-ink-muted)]">
                        Your organization standard does not allow a site override.
                    </p>
                ) : null}
            </div>

            <div className="min-w-0">
                <PolicyValueControl
                    policy={policy}
                    value={value}
                    onChange={onChange}
                    disabled={disabled || locked}
                />
            </div>

            <div className="flex items-center gap-2 lg:justify-end">
                {policy.has_site_override ? (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={disabled || isResetting}
                        isLoading={isResetting}
                        onClick={onReset}
                    >
                        <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                        Restore inherited
                    </Button>
                ) : null}
            </div>
        </li>
    );
}
