"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Check, Loader2, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Field, fieldControlClassName } from "@/components/ui/form/Field";
import { InlineAlert } from "@/components/ui/InlineAlert";
import {
    generateSlugFromName,
    useCheckSlugAvailability,
    useCreateOrganization,
} from "@/hooks/use-organization";

import {
    ORGANIZATION_DRAFT_KEY,
    SLUG_TAKEN_MESSAGE,
    emptyOrganizationDraft,
    normalizeSlugInput,
    validateOrganizationDraft,
    type OrganizationDraft,
} from "../lib";

const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || "yourdomain.com";

function readDraft(): OrganizationDraft | null {
    try {
        const saved = window.localStorage.getItem(ORGANIZATION_DRAFT_KEY);
        if (!saved) return null;
        const parsed = JSON.parse(saved) as Partial<OrganizationDraft>;
        const draft = { ...emptyOrganizationDraft, ...parsed };
        return draft.name || draft.slug || draft.description ? draft : null;
    } catch {
        return null;
    }
}

/**
 * Step 1. Owns the draft, the workspace URL availability check and the submit,
 * so the page above it only has to describe the step.
 */
export function OrganizationIdentityForm() {
    const [draft, setDraft] = useState<OrganizationDraft>(emptyOrganizationDraft);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [draftReady, setDraftReady] = useState(false);
    const [draftRestored, setDraftRestored] = useState(false);
    const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
    const [slugCheckPending, setSlugCheckPending] = useState(false);

    const { createOrganization, isLoading, error, fieldErrors } =
        useCreateOrganization({
            redirectTo: "/plans?setup=first-site",
            onSuccess: () => window.localStorage.removeItem(ORGANIZATION_DRAFT_KEY),
        });
    const { checkSlug, isChecking } = useCheckSlugAvailability();

    useEffect(() => {
        const restored = readDraft();
        if (restored) {
            setDraft(restored);
            setDraftRestored(true);
        }
        setDraftReady(true);
    }, []);

    useEffect(() => {
        if (!draftReady) return;
        window.localStorage.setItem(ORGANIZATION_DRAFT_KEY, JSON.stringify(draft));
    }, [draft, draftReady]);

    useEffect(() => {
        if (draft.slugManuallyEdited || !draft.name) return;
        setDraft((current) => ({
            ...current,
            slug: generateSlugFromName(current.name),
        }));
    }, [draft.name, draft.slugManuallyEdited]);

    useEffect(() => {
        let cancelled = false;
        const timeout = window.setTimeout(async () => {
            const slug = draft.slug;
            if (slug.length < 2) {
                setSlugCheckPending(false);
                setSlugAvailable(null);
                setErrors((current) => {
                    if (current.slug !== SLUG_TAKEN_MESSAGE) return current;
                    const next = { ...current };
                    delete next.slug;
                    return next;
                });
                return;
            }

            setSlugCheckPending(true);
            const available = await checkSlug(slug);
            if (cancelled) return;
            setSlugCheckPending(false);
            setSlugAvailable(available);
            setErrors((current) => {
                if (available) {
                    if (current.slug !== SLUG_TAKEN_MESSAGE) return current;
                    const next = { ...current };
                    delete next.slug;
                    return next;
                }
                return { ...current, slug: SLUG_TAKEN_MESSAGE };
            });
        }, 300);

        return () => {
            cancelled = true;
            window.clearTimeout(timeout);
        };
    }, [draft.slug, checkSlug]);

    function update<Key extends keyof OrganizationDraft>(
        key: Key,
        value: OrganizationDraft[Key],
    ) {
        setDraft((current) => ({ ...current, [key]: value }));
        setErrors((current) => {
            if (!current[key]) return current;
            const next = { ...current };
            delete next[key];
            return next;
        });
    }

    function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
        const nextErrors: Record<string, string> = validateOrganizationDraft(draft);
        if (slugAvailable === false) {
            nextErrors.slug = SLUG_TAKEN_MESSAGE;
        }
        if (Object.keys(nextErrors).length) {
            setErrors(nextErrors);
            return;
        }
        setErrors({});
        createOrganization({
            name: draft.name.trim(),
            slug: draft.slug.trim(),
            description: draft.description.trim() || undefined,
        });
    }

    function startOver() {
        setDraft(emptyOrganizationDraft);
        setDraftRestored(false);
        setSlugAvailable(null);
        setErrors({});
        window.localStorage.removeItem(ORGANIZATION_DRAFT_KEY);
    }

    const combinedErrors = { ...errors, ...fieldErrors };
    const checking = isChecking || slugCheckPending;
    const slugPreview = `${draft.slug || "your-organization"}.${BASE_DOMAIN}`;
    const slugHintId = "workspace-url-status";

    return (
        <section
            aria-labelledby="organization-details-title"
            className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)]"
        >
            <div className="flex items-start gap-3 border-b border-[var(--vms-line)] p-5 sm:p-7">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--vms-radius-control)] bg-[var(--vms-surface-subtle)] text-[var(--vms-action)]">
                    <Building2 className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                    <h2
                        id="organization-details-title"
                        className="text-base font-semibold tracking-[-0.01em]"
                    >
                        Organization details
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-[var(--vms-ink-muted)]">
                        This is the tenant every Site, person, charge and invoice belongs
                        to. You can rename it later and invite the rest of the team.
                    </p>
                </div>
            </div>

            <div className="p-5 sm:p-7">
                {draftRestored ? (
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] px-4 py-3 text-sm">
                        <span className="flex items-center gap-2 font-medium text-[var(--vms-ink)]">
                            <RotateCcw
                                className="h-4 w-4 text-[var(--vms-ink-muted)]"
                                aria-hidden="true"
                            />
                            Draft restored from this browser.
                        </span>
                        <button
                            type="button"
                            onClick={startOver}
                            className="rounded-[var(--vms-radius-control)] text-xs font-semibold text-[var(--vms-action)] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)] focus-visible:ring-offset-2"
                        >
                            Start over
                        </button>
                    </div>
                ) : null}

                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                    {error ? (
                        <InlineAlert tone="danger" title="The organization was not created">
                            {error}
                        </InlineAlert>
                    ) : null}

                    <div className="grid gap-5 sm:grid-cols-2">
                        <Field
                            id="name"
                            label="Organization name"
                            description="Shown in the workspace switcher and on invoices."
                            required
                            error={combinedErrors.name}
                        >
                            {(control) => (
                                <input
                                    {...control}
                                    name="name"
                                    className={fieldControlClassName}
                                    placeholder="Harbour Operations"
                                    value={draft.name}
                                    onChange={(event) => update("name", event.target.value)}
                                    disabled={isLoading}
                                    autoComplete="organization"
                                    autoFocus
                                />
                            )}
                        </Field>

                        <Field
                            id="slug"
                            label="Workspace URL"
                            description={`Your team signs in at ${slugPreview}.`}
                            required
                            error={combinedErrors.slug}
                        >
                            {(control) => (
                                <div className="relative">
                                    <input
                                        {...control}
                                        name="slug"
                                        className={`${fieldControlClassName} pr-10`}
                                        placeholder="harbour-operations"
                                        value={draft.slug}
                                        onChange={(event) => {
                                            update("slug", normalizeSlugInput(event.target.value));
                                            update("slugManuallyEdited", true);
                                        }}
                                        disabled={isLoading}
                                        aria-describedby={`${control["aria-describedby"] ?? ""} ${slugHintId}`.trim()}
                                    />
                                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                                        {checking ? (
                                            <Loader2
                                                className="h-4 w-4 animate-spin text-[var(--vms-ink-muted)] motion-reduce:animate-none"
                                                aria-hidden="true"
                                            />
                                        ) : slugAvailable === true ? (
                                            <Check
                                                className="h-4 w-4 text-[var(--vms-success)]"
                                                aria-hidden="true"
                                            />
                                        ) : null}
                                    </span>
                                </div>
                            )}
                        </Field>
                    </div>

                    <p
                        id={slugHintId}
                        aria-live="polite"
                        className="text-xs leading-5 text-[var(--vms-ink-muted)]"
                    >
                        {checking
                            ? "Checking whether this workspace URL is free…"
                            : draft.slug.length >= 2 && slugAvailable === true
                                ? "Available. Lowercase letters, numbers and hyphens only."
                                : "Lowercase letters, numbers and hyphens. You can change it later."}
                    </p>

                    <Field
                        id="description"
                        label="Description (optional)"
                        description="What this organization operates. Helpful for colleagues who join later."
                        error={combinedErrors.description}
                    >
                        {(control) => (
                            <textarea
                                {...control}
                                name="description"
                                value={draft.description}
                                onChange={(event) => update("description", event.target.value)}
                                disabled={isLoading}
                                rows={4}
                                maxLength={500}
                                placeholder="Mixed-use estate operations across Lagos and Abuja."
                                className={`${fieldControlClassName} resize-none`}
                            />
                        )}
                    </Field>
                    <p className="-mt-2 text-right text-[11px] tabular-nums text-[var(--vms-ink-muted)]">
                        {draft.description.length}/500
                    </p>

                    <div className="flex flex-col-reverse gap-3 border-t border-[var(--vms-line)] pt-5 sm:flex-row sm:items-center sm:justify-between">
                        <Link
                            href="/organizations"
                            className="inline-flex min-h-11 items-center justify-center rounded-[var(--vms-radius-control)] px-3 text-sm font-semibold text-[var(--vms-ink-muted)] hover:bg-[var(--vms-surface-subtle)] hover:text-[var(--vms-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)] focus-visible:ring-offset-2 sm:justify-start"
                        >
                            Cancel
                        </Link>
                        <Button
                            type="submit"
                            isLoading={isLoading}
                            loadingLabel="Creating organization…"
                            disabled={
                                isLoading || checking || slugAvailable === false
                            }
                        >
                            {checking && !isLoading
                                ? "Checking workspace URL…"
                                : "Continue to plan"}
                        </Button>
                    </div>
                </form>
            </div>
        </section>
    );
}
