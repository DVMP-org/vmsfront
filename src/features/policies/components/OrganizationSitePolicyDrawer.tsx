"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

import { FormDrawer, FormHint } from "@/components/ui/form/FormDrawer";

import type { PolicyValue } from "../api";
import { policyDraftChanges, policyValuesEqual } from "../lib";
import {
    useOrganizationSitePolicies,
    useResetOrganizationSitePolicy,
    useSetOrganizationSitePolicy,
} from "../queries";
import { SitePolicyRow } from "./SitePolicyRow";

/**
 * Organization owners manage a site's explicit overrides without impersonating
 * the site administrator. The resolver and audit trail are the same ones the
 * site surface uses.
 */
export function OrganizationSitePolicyDrawer({
    slug,
    siteId,
    siteName,
    isOpen,
    onClose,
    canEdit = true,
}: {
    slug: string;
    siteId: string | null;
    siteName: string;
    isOpen: boolean;
    onClose: () => void;
    canEdit?: boolean;
}) {
    const catalog = useOrganizationSitePolicies(slug, siteId, isOpen);
    const setPolicy = useSetOrganizationSitePolicy(slug, siteId);
    const resetPolicy = useResetOrganizationSitePolicy(slug, siteId);
    const [drafts, setDrafts] = useState<Record<string, PolicyValue>>({});
    const [resetting, setResetting] = useState<string | null>(null);

    const policies = useMemo(
        () => catalog.data?.policies ?? [],
        [catalog.data?.policies],
    );

    useEffect(() => {
        const next: Record<string, PolicyValue> = {};
        for (const policy of policies) next[policy.key] = policy.effective_value;
        setDrafts(next);
    }, [policies]);

    useEffect(() => {
        if (!isOpen) {
            setDrafts({});
            setResetting(null);
        }
    }, [isOpen]);

    const changes = policyDraftChanges(policies, drafts);
    const isSaving = setPolicy.isPending;

    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        for (const change of changes) {
            await setPolicy.mutateAsync({
                key: change.policy.key,
                value: change.value,
            });
        }
        onClose();
    };

    const reset = async (key: string) => {
        setResetting(key);
        try {
            await resetPolicy.mutateAsync(key);
        } finally {
            setResetting(null);
        }
    };

    return (
        <FormDrawer
            isOpen={isOpen}
            onClose={onClose}
            title={`Policies for ${siteName}`}
            description="Override an organization standard only where the policy allows it. The effective value and its source stay visible on the site."
            submitLabel="Save site overrides"
            onSubmit={submit}
            isSubmitting={isSaving}
            canSubmit={canEdit && changes.length > 0}
            error={catalog.error?.message ?? setPolicy.error?.message ?? null}
            footerNote={
                !canEdit
                    ? "Your role can view this site's policies but cannot change them."
                    : changes.length === 0
                        ? "No unsaved changes."
                        : `${changes.length} policy change${changes.length === 1 ? "" : "s"
                        }. Saving affects new operations immediately.`
            }
            size="lg"
        >
            {catalog.isPending ? (
                <p className="text-sm text-[var(--vms-ink-muted)]" role="status">
                    Loading policies…
                </p>
            ) : catalog.data ? (
                <>
                    <FormHint>
                        {catalog.data.template
                            ? `This site inherits ${catalog.data.template.name}. Overrides below take precedence where allowed.`
                            : "This site has no organization standard; it uses platform and operating defaults."}
                    </FormHint>
                    {catalog.data.groups.map((group) => (
                        <fieldset key={group.key} className="border-t border-[var(--vms-line)] pt-4">
                            <legend className="sr-only">{group.label}</legend>
                            <h3 className="text-sm font-semibold">{group.label}</h3>
                            <ul className="mt-2 divide-y divide-[var(--vms-line)]">
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
                                        disabled={isSaving || !canEdit}
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
                        </fieldset>
                    ))}
                </>
            ) : (
                <p className="text-sm text-[var(--vms-ink-muted)]">
                    No policies apply to this site.
                </p>
            )}
        </FormDrawer>
    );
}
