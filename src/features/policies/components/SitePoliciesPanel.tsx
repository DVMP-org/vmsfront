"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, History, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { formatDateTime } from "@/lib/datetime";

import type { PolicyValue } from "../api";
import {
    policyDraftChanges,
    policySourceLabel,
    policyValuesEqual,
} from "../lib";
import {
    useResetSitePolicy,
    useSetSitePolicy,
    useSitePolicies,
    useSitePolicyHistory,
} from "../queries";
import { SitePolicyRow } from "./SitePolicyRow";

export function SitePoliciesPanel({
    siteId,
    canEdit,
}: {
    siteId: string;
    canEdit: boolean;
}) {
    const catalog = useSitePolicies(siteId);
    const setPolicy = useSetSitePolicy(siteId);
    const resetPolicy = useResetSitePolicy(siteId);
    const [drafts, setDrafts] = useState<Record<string, PolicyValue>>({});
    const [resetting, setResetting] = useState<string | null>(null);
    const [showHistory, setShowHistory] = useState(false);
    const history = useSitePolicyHistory(siteId, showHistory);

    const policies = useMemo(
        () => catalog.data?.policies ?? [],
        [catalog.data?.policies],
    );

    useEffect(() => {
        const next: Record<string, PolicyValue> = {};
        for (const policy of policies) {
            next[policy.key] = policy.effective_value;
        }
        setDrafts(next);
    }, [policies]);

    const changes = policyDraftChanges(policies, drafts);
    const isSaving = setPolicy.isPending;

    const save = async () => {
        for (const change of changes) {
            await setPolicy.mutateAsync({
                key: change.policy.key,
                value: change.value,
            });
        }
        setDrafts((current) => ({ ...current }));
    };

    const reset = async (key: string) => {
        setResetting(key);
        try {
            await resetPolicy.mutateAsync(key);
        } finally {
            setResetting(null);
        }
    };

    if (catalog.isPending) {
        return <p role="status">Loading policies…</p>;
    }
    if (catalog.isError) {
        return (
            <InlineAlert
                tone="danger"
                title="Policies could not be loaded"
                action={
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => catalog.refetch()}
                    >
                        Retry
                    </Button>
                }
            >
                The selected site may no longer be available, or your role may not be
                allowed to view its policies.
            </InlineAlert>
        );
    }
    if (policies.length === 0) {
        return (
            <EmptyState
                title="No policies apply yet"
                description="Enable the modules this site operates, or check that the site's operating context supports the available policies."
            />
        );
    }

    return (
        <div className="space-y-5">
            <section className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)]">
                            <BookOpen
                                className="h-4 w-4 text-[var(--vms-ink-muted)]"
                                aria-hidden="true"
                            />
                        </span>
                        <div>
                            <h2 className="text-sm font-semibold text-[var(--vms-ink)]">
                                {catalog.data.template
                                    ? `Following ${catalog.data.template.name}`
                                    : "No organization standard assigned"}
                            </h2>
                            <p className="mt-1 max-w-2xl text-xs leading-5 text-[var(--vms-ink-muted)]">
                                {catalog.data.template
                                    ? "This site inherits the organization's policy template. A site override is allowed only where the policy permits it and takes precedence over the template."
                                    : "This site uses platform and operating defaults. Your organization owner can assign a reusable standard from Policies & Standards."}
                            </p>
                        </div>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        aria-expanded={showHistory}
                        onClick={() => setShowHistory((value) => !value)}
                    >
                        <History className="h-3.5 w-3.5" aria-hidden="true" />
                        {showHistory ? "Hide history" : "View history"}
                    </Button>
                </div>
            </section>

            {!canEdit ? (
                <InlineAlert tone="info" title="Read-only">
                    You can see the effective policy, but changing it requires the
                    site-settings permission on this site.
                </InlineAlert>
            ) : null}

            <div className="space-y-5">
                {catalog.data.groups.map((group) => (
                    <section
                        key={group.key}
                        className="overflow-hidden rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)]"
                    >
                        <header className="flex items-center gap-2 border-b border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] px-4 py-3 sm:px-5">
                            <ShieldCheck
                                className="h-4 w-4 text-[var(--vms-ink-muted)]"
                                aria-hidden="true"
                            />
                            <h3 className="text-sm font-semibold text-[var(--vms-ink)]">
                                {group.label}
                            </h3>
                        </header>
                        <ul>
                            {group.policies.map((policy) => (
                                <SitePolicyRow
                                    key={policy.key}
                                    policy={policy}
                                    value={drafts[policy.key] ?? policy.effective_value}
                                    isDirty={
                                        policy.key in drafts &&
                                        !policyValuesEqual(
                                            drafts[policy.key],
                                            policy.effective_value,
                                        )
                                    }
                                    isResetting={resetting === policy.key}
                                    disabled={!canEdit || isSaving}
                                    onChange={(value) =>
                                        setDrafts((current) => ({
                                            ...current,
                                            [policy.key]: value,
                                        }))
                                    }
                                    onReset={() => reset(policy.key)}
                                />
                            ))}
                        </ul>
                    </section>
                ))}
            </div>

            {changes.length > 0 ? (
                <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] px-4 py-3 shadow-[var(--vms-shadow-surface)]">
                    <p className="text-xs text-[var(--vms-ink-muted)]">
                        {changes.length} unsaved policy change
                        {changes.length === 1 ? "" : "s"}. Saving takes effect immediately for
                        new operations; completed work keeps the policy it was decided with.
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isSaving}
                            onClick={() => {
                                const next: Record<string, PolicyValue> = {};
                                for (const policy of policies) {
                                    next[policy.key] = policy.effective_value;
                                }
                                setDrafts(next);
                            }}
                        >
                            Discard
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            isLoading={isSaving}
                            onClick={save}
                        >
                            Save changes
                        </Button>
                    </div>
                </div>
            ) : null}

            {showHistory ? (
                <section className="overflow-hidden rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)]">
                    <header className="border-b border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] px-4 py-3 sm:px-5">
                        <h3 className="text-sm font-semibold">Recent policy changes</h3>
                    </header>
                    {history.isPending ? (
                        <p className="px-4 py-4 text-sm text-[var(--vms-ink-muted)]" role="status">
                            Loading history…
                        </p>
                    ) : history.data && history.data.length > 0 ? (
                        <ul className="divide-y divide-[var(--vms-line)]">
                            {history.data.map((event) => (
                                <li key={event.id} className="px-4 py-3 text-sm sm:px-5">
                                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                                        <p className="font-medium text-[var(--vms-ink)]">
                                            {event.policy_name}
                                        </p>
                                        <p className="text-xs text-[var(--vms-ink-muted)]">
                                            {formatDateTime(event.created_at)}
                                        </p>
                                    </div>
                                    <p className="mt-1 text-xs leading-5 text-[var(--vms-ink-muted)]">
                                        {policySourceLabel(
                                            event.source === "site_assignment"
                                                ? "organization_template"
                                                : event.source,
                                        )}
                                        {event.reason ? ` · ${event.reason}` : ""}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="px-4 py-4 text-sm text-[var(--vms-ink-muted)]">
                            No policy changes have been recorded for this site.
                        </p>
                    )}
                </section>
            ) : null}
        </div>
    );
}
