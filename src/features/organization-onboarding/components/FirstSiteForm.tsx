"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Building2, Loader2, MapPin, ShieldCheck, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Field, fieldControlClassName } from "@/components/ui/form/Field";
import { FormErrorSummary } from "@/components/ui/form/FormErrorSummary";
import { FormSection } from "@/components/ui/form/FormSection";
import { InlineAlert } from "@/components/ui/InlineAlert";
import type { UseCase } from "@/features/context/api";
import { useCreateOrganizationSite } from "@/features/organization-workspace/queries";
import { parseApiError } from "@/lib/error-utils";
import { useAppStore } from "@/store/app-store";
import type { Organization } from "@/types";

import { useUseCaseCatalog } from "../queries";
import {
    emptyFirstSiteDraft,
    operatingTypesFor,
    validateFirstSiteDraft,
    type FirstSiteDraft,
} from "../lib";
import { IncludedCapabilities } from "./IncludedCapabilities";
import { OperatingTypePicker } from "./OperatingTypePicker";

/**
 * Step 3. Collects the first Site, explains what its operating type
 * provisions, and hands the person to the management workspace.
 */
export function FirstSiteForm({ organization }: { organization: Organization }) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const setSelectedSite = useAppStore((state) => state.setSelectedSite);
    const catalog = useUseCaseCatalog();
    const mutation = useCreateOrganizationSite(organization.slug);

    const [draft, setDraft] = useState<FirstSiteDraft>(emptyFirstSiteDraft);
    const [errors, setErrors] = useState<
        Partial<Record<keyof FirstSiteDraft, string>>
    >({});

    const profiles = operatingTypesFor(catalog.data);
    const serverError = mutation.error ? parseApiError(mutation.error).message : "";

    function update<Key extends keyof FirstSiteDraft>(
        key: Key,
        value: FirstSiteDraft[Key],
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
        const nextErrors = validateFirstSiteDraft(draft);
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length || !draft.useCase) return;

        mutation.mutate(
            {
                name: draft.name.trim(),
                address: draft.address.trim(),
                description: draft.description.trim(),
                admin_email: draft.adminEmail.trim(),
                admin_name: draft.adminName.trim() || null,
                admin_phone: draft.adminPhone.trim() || null,
                parent_site_id: null,
                use_case: draft.useCase,
            },
            {
                onSuccess: (saved) => {
                    setSelectedSite(saved);
                    queryClient.setQueryData(
                        ["organization", organization.slug],
                        { ...organization, needs_first_site: false },
                    );
                    void queryClient.invalidateQueries({ queryKey: ["organizations"] });
                    router.replace("/?lobby=1&setup=complete");
                },
            },
        );
    }

    const submitting = mutation.isPending;

    return (
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <FormErrorSummary errors={errors} />
            {serverError ? (
                <InlineAlert tone="danger" title="The first Site was not created">
                    {serverError}
                </InlineAlert>
            ) : null}

            <section
                aria-labelledby="first-site-identity-title"
                className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)]"
            >
                <div className="flex items-start gap-3 border-b border-[var(--vms-line)] p-5 sm:p-7">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--vms-radius-control)] bg-[var(--vms-surface-subtle)] text-[var(--vms-action)]">
                        <Building2 className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--vms-ink-muted)]">
                            {organization.name}
                        </p>
                        <h2
                            id="first-site-identity-title"
                            className="mt-1 text-base font-semibold tracking-[-0.01em]"
                        >
                            Site identity
                        </h2>
                        <p className="mt-1 text-sm leading-6 text-[var(--vms-ink-muted)]">
                            Start with the Site operators recognise. Buildings, units, rooms
                            and people come next, inside this Site.
                        </p>
                    </div>
                </div>

                <div className="p-5 sm:p-7">
                    <FormSection
                        title="Core details"
                        description="Shown in the workspace switcher, the Site register and every operational record."
                        icon={MapPin}
                    >
                        <Field
                            id="first-site-name"
                            label="Site name"
                            description="For example the estate, park or property group name."
                            required
                            error={errors.name}
                        >
                            {(control) => (
                                <input
                                    {...control}
                                    className={fieldControlClassName}
                                    value={draft.name}
                                    onChange={(event) => update("name", event.target.value)}
                                    placeholder="e.g. Harbour Court"
                                    autoComplete="organization"
                                    autoFocus
                                    disabled={submitting}
                                />
                            )}
                        </Field>

                        <Field
                            id="first-site-address"
                            label="Address"
                            description="Street, building and locality used by operators and on visitor directions."
                        >
                            {(control) => (
                                <input
                                    {...control}
                                    className={fieldControlClassName}
                                    value={draft.address}
                                    onChange={(event) => update("address", event.target.value)}
                                    placeholder="e.g. 19 Marina Road, Lagos"
                                    autoComplete="street-address"
                                    disabled={submitting}
                                />
                            )}
                        </Field>

                        <Field
                            id="first-site-description"
                            label="Description (optional)"
                            description="Operational context other managers will see."
                            error={errors.description}
                        >
                            {(control) => (
                                <textarea
                                    {...control}
                                    className={`${fieldControlClassName} resize-none`}
                                    value={draft.description}
                                    onChange={(event) =>
                                        update("description", event.target.value)
                                    }
                                    rows={3}
                                    maxLength={500}
                                    placeholder="What does this Site operate?"
                                    disabled={submitting}
                                />
                            )}
                        </Field>
                    </FormSection>
                </div>
            </section>

            <section
                aria-labelledby="first-site-operating-title"
                className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)]"
            >
                <div className="flex items-start gap-3 border-b border-[var(--vms-line)] p-5 sm:p-7">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--vms-radius-control)] bg-[var(--vms-surface-subtle)] text-[var(--vms-action)]">
                        <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                        <h2
                            id="first-site-operating-title"
                            className="text-base font-semibold tracking-[-0.01em]"
                        >
                            Operating type
                        </h2>
                        <p className="mt-1 text-sm leading-6 text-[var(--vms-ink-muted)]">
                            This decides the workspaces, defaults and access rules the Site
                            owns. Pick the closest fit — the Site keeps it.
                        </p>
                    </div>
                </div>

                <div className="p-5 sm:p-7">
                    <OperatingTypePicker
                        profiles={profiles}
                        value={draft.useCase}
                        onChange={(value: UseCase) => update("useCase", value)}
                        disabled={submitting}
                        loading={catalog.isLoading}
                        error={errors.useCase}
                    />
                    {catalog.isError ? (
                        <InlineAlert
                            tone="warning"
                            title="Could not load the operating-type catalogue"
                            className="mt-4"
                            action={
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => catalog.refetch()}
                                >
                                    Retry
                                </Button>
                            }
                        >
                            The list below falls back to the built-in defaults.
                        </InlineAlert>
                    ) : null}
                </div>
            </section>

            <IncludedCapabilities useCase={draft.useCase} catalog={catalog.data} />

            <section
                aria-labelledby="first-site-admin-title"
                className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)]"
            >
                <div className="flex items-start gap-3 border-b border-[var(--vms-line)] p-5 sm:p-7">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--vms-radius-control)] bg-[var(--vms-surface-subtle)] text-[var(--vms-action)]">
                        <UserPlus className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                        <h2
                            id="first-site-admin-title"
                            className="text-base font-semibold tracking-[-0.01em]"
                        >
                            Site administrator
                        </h2>
                        <p className="mt-1 text-sm leading-6 text-[var(--vms-ink-muted)]">
                            We create or reuse this person, grant Site management authority
                            and email onboarding instructions. No Place Party relationship is
                            created.
                        </p>
                    </div>
                </div>

                <div className="p-5 sm:p-7">
                    <FormSection
                        title="Manager account"
                        description="The first person who can open this Site and invite everybody else."
                    >
                        <Field
                            id="first-site-admin-email"
                            label="Administrator email"
                            description="They receive the setup email at this address."
                            required
                            error={errors.adminEmail}
                        >
                            {(control) => (
                                <input
                                    {...control}
                                    className={fieldControlClassName}
                                    type="email"
                                    inputMode="email"
                                    autoComplete="email"
                                    value={draft.adminEmail}
                                    onChange={(event) =>
                                        update("adminEmail", event.target.value)
                                    }
                                    disabled={submitting}
                                />
                            )}
                        </Field>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field id="first-site-admin-name" label="Administrator name">
                                {(control) => (
                                    <input
                                        {...control}
                                        className={fieldControlClassName}
                                        autoComplete="name"
                                        value={draft.adminName}
                                        onChange={(event) =>
                                            update("adminName", event.target.value)
                                        }
                                        disabled={submitting}
                                    />
                                )}
                            </Field>
                            <Field id="first-site-admin-phone" label="Phone number">
                                {(control) => (
                                    <input
                                        {...control}
                                        className={fieldControlClassName}
                                        type="tel"
                                        inputMode="tel"
                                        autoComplete="tel"
                                        value={draft.adminPhone}
                                        onChange={(event) =>
                                            update("adminPhone", event.target.value)
                                        }
                                        disabled={submitting}
                                    />
                                )}
                            </Field>
                        </div>
                    </FormSection>
                </div>
            </section>

            <section className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-5 sm:p-7">
                <dl className="grid gap-3 rounded-[var(--vms-radius-control)] bg-[var(--vms-surface-subtle)] p-4 text-sm sm:grid-cols-3">
                    <div>
                        <dt className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--vms-ink-muted)]">
                            Structure
                        </dt>
                        <dd className="mt-1 font-semibold">Top-level Site</dd>
                    </div>
                    <div>
                        <dt className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--vms-ink-muted)]">
                            Operating type
                        </dt>
                        <dd className="mt-1 font-semibold">
                            {draft.useCase
                                ? profiles.find((profile) => profile.value === draft.useCase)
                                    ?.label ?? draft.useCase
                                : "Not selected"}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--vms-ink-muted)]">
                            Administrator
                        </dt>
                        <dd className="mt-1 truncate font-semibold">
                            {draft.adminEmail.trim() || "Not set"}
                        </dd>
                    </div>
                </dl>

                <div className="mt-5 flex flex-col-reverse gap-2 border-t border-[var(--vms-line)] pt-5 sm:flex-row sm:items-center sm:justify-end">
                    <Button type="button" variant="outline" asChild>
                        <Link href="/plans?setup=first-site">Cancel</Link>
                    </Button>
                    <Button
                        type="submit"
                        disabled={
                            submitting ||
                            !draft.name.trim() ||
                            !draft.adminEmail.trim() ||
                            !draft.useCase
                        }
                        aria-busy={submitting}
                    >
                        {submitting ? (
                            <Loader2
                                className="h-4 w-4 animate-spin motion-reduce:animate-none"
                                aria-hidden="true"
                            />
                        ) : (
                            <Building2 className="h-4 w-4" aria-hidden="true" />
                        )}
                        {submitting ? "Creating Site…" : "Create first Site"}
                    </Button>
                </div>
            </section>
        </form>
    );
}
