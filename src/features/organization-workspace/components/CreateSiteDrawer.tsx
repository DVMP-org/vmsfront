"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2 } from "lucide-react";

import { FormDrawer, FormRecordSummary } from "@/components/ui/form/FormDrawer";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { FormSection } from "@/components/ui/form/FormSection";
import { Field, fieldControlClassName } from "@/components/ui/form/Field";
import { parseApiError } from "@/lib/error-utils";
import type { UseCase } from "@/features/context/api";

import type {
    CreatedOrganizationSite,
    OrganizationSiteSummary,
} from "../api";
import { useCreateOrganizationSite, useOrganizationManagers } from "../queries";
import {
    ancestorSiteIds,
    operatingTypeLabels,
    parentSiteOptions,
    timezoneOptions,
} from "../lib";

interface Draft {
    name: string;
    useCase: UseCase | "";
    parentId: string;
    address: string;
    timezone: string;
    authority: "inherit" | "none" | "existing" | "invite";
    adminUserId: string;
    adminName: string;
    adminEmail: string;
    adminPhone: string;
}

export interface CreateSiteParent {
    id: string;
    name: string;
    use_case: UseCase;
}

const emptyDraft = (
    timezone: string,
    parentSite?: CreateSiteParent | null,
): Draft => ({
    name: "",
    useCase: "",
    parentId: "",
    address: "",
    timezone,
    authority: parentSite ? "inherit" : "invite",
    adminUserId: "",
    adminName: "",
    adminEmail: "",
    adminPhone: "",
});

export function CreateSiteDrawer({
    isOpen,
    onClose,
    slug,
    sites,
    parentSite,
    onCreated,
}: {
    isOpen: boolean;
    onClose: () => void;
    slug?: string | null;
    sites: OrganizationSiteSummary[];
    parentSite?: CreateSiteParent | null;
    onCreated?: (site: CreatedOrganizationSite) => void;
}) {
    const mutation = useCreateOrganizationSite(slug);
    const managers = useOrganizationManagers(slug, null);
    const detectedTimezone = useMemo(
        () => timezoneOptions()[0] ?? "UTC",
        [],
    );
    const [draft, setDraft] = useState<Draft>(() =>
        emptyDraft(detectedTimezone, parentSite),
    );
    const [errors, setErrors] = useState<Record<string, string>>({});
    const parents = useMemo(() => parentSiteOptions(sites), [sites]);
    const authoritySiteIds = useMemo(
        () =>
            parentSite
                ? new Set([
                      parentSite.id,
                      ...ancestorSiteIds(sites, parentSite.id),
                  ])
                : null,
        [parentSite, sites],
    );
    const managerOptions = useMemo(() => {
        const seen = new Set<string>();
        return (managers.data?.managers ?? []).filter((manager) => {
            if (
                authoritySiteIds !== null &&
                !authoritySiteIds.has(manager.site.id)
            ) {
                return false;
            }
            if (seen.has(manager.user.id)) return false;
            seen.add(manager.user.id);
            return true;
        });
    }, [authoritySiteIds, managers.data?.managers]);

    useEffect(() => {
        if (!isOpen) return;
        setDraft({
            ...emptyDraft(detectedTimezone, parentSite),
            useCase: parentSite?.use_case ?? "",
            parentId: parentSite?.id ?? "",
        });
        setErrors({});
        mutation.reset();
        // The mutation object is stable enough for reset; re-running on every
        // render would clear the draft while the user types.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, parentSite?.id, parentSite?.use_case, detectedTimezone]);

    function validate() {
        const next: Record<string, string> = {};
        const name = draft.name.trim();
        if (name.length < 2) {
            next.name = "Enter a Site name with at least 2 characters.";
        } else if (name.length > 255) {
            next.name = "Site name must not exceed 255 characters.";
        }
        if (!draft.useCase) {
            next.useCase = "Choose the operating type this Site owns.";
        }
        if (
            draft.parentId &&
            !parentSite &&
            !parents.some((site) => site.id === draft.parentId)
        ) {
            next.parentId = "Choose a parent Site in this organization.";
        }
        if (!draft.address.trim()) {
            next.address = "Enter the Site address.";
        } else if (draft.address.trim().length > 255) {
            next.address = "Address must not exceed 255 characters.";
        }
        if (!draft.timezone) {
            next.timezone = "Choose the Site time zone.";
        }
        if (draft.authority === "existing" && !draft.adminUserId) {
            next.authority = "Choose the manager who will lead this Site.";
        }
        if (draft.authority === "invite") {
            const email = draft.adminEmail.trim();
            if (!email) {
                next.authority = "Enter the manager email address.";
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                next.authority = "Enter a valid manager email address.";
            }
        }
        setErrors(next);
        return Object.keys(next).length === 0;
    }

    async function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!validate()) return;
        try {
            const created = await mutation.mutateAsync({
                name: draft.name.trim(),
                use_case: draft.useCase as UseCase,
                parent_site_id: draft.parentId || null,
                address: draft.address.trim(),
                timezone: draft.timezone,
                ...(draft.authority === "existing"
                    ? { admin_user_id: draft.adminUserId }
                    : draft.authority === "invite"
                      ? {
                            admin_email: draft.adminEmail.trim(),
                            admin_name: draft.adminName.trim() || null,
                            admin_phone: draft.adminPhone.trim() || null,
                        }
                      : {}),
            });
            onCreated?.(created);
            onClose();
        } catch {
            // The mutation surfaces the API message through `mutation.error`.
        }
    }

    const errorMessage = mutation.isError
        ? parseApiError(mutation.error).message
        : null;
    const parentName =
        parentSite?.name ||
        parents.find((site) => site.id === draft.parentId)?.name ||
        "Organization root";

    return (
        <FormDrawer
            isOpen={isOpen}
            onClose={onClose}
            title={parentSite ? "Create child Site" : "Create Site"}
            description="Sites are operating boundaries. Creating a Site never creates a Place; add Places through Site management once the Site exists."
            submitLabel="Create Site"
            isSubmitting={mutation.isPending}
            canSubmit={!mutation.isPending}
            onSubmit={submit}
            error={errorMessage}
            footerNote={
                <>
                    {draft.name.trim() || "Untitled Site"} · {parentName} ·{" "}
                    {draft.timezone || "No time zone"}
                </>
            }
        >
            <FormRecordSummary
                title={parentSite ? "Child Site" : "New organization Site"}
                meta={`Portfolio · ${parentName}`}
                trailing={<Building2 className="h-4 w-4 text-[var(--vms-ink-muted)]" aria-hidden="true" />}
            />

            <FormSection
                title="Site identity"
                description="The name is the operating label used across the portfolio, invoices and reports."
            >
                <Field
                    id="site-name"
                    label="Site name"
                    required
                    error={errors.name}
                    description={`${draft.name.trim().length}/255 characters`}
                >
                    {(control) => (
                        <input
                            {...control}
                            className={fieldControlClassName}
                            value={draft.name}
                            onChange={(event) =>
                                setDraft((current) => ({
                                    ...current,
                                    name: event.target.value,
                                }))
                            }
                            placeholder="Harbour Residences"
                            autoFocus
                            maxLength={255}
                        />
                    )}
                </Field>

                <Field
                    id="site-use-case"
                    label="Operating type"
                    required
                    error={errors.useCase}
                    description="The Site owns this type. Its Places and child Sites inherit it."
                >
                    {(control) => (
                        <select
                            {...control}
                            className={fieldControlClassName}
                            value={draft.useCase}
                            onChange={(event) =>
                                setDraft((current) => ({
                                    ...current,
                                    useCase: event.target.value as UseCase,
                                }))
                            }
                        >
                            <option value="">Choose an operating type</option>
                            {(Object.entries(operatingTypeLabels) as [UseCase, string][]).map(
                                ([value, label]) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ),
                            )}
                        </select>
                    )}
                </Field>

                <Field
                    id="site-parent"
                    label="Parent Site"
                    error={errors.parentId}
                    description={
                        parentSite
                            ? "This Site is created inside the selected parent."
                            : "Optional. Parent Sites group related operating Sites."
                    }
                >
                    {(control) => (
                        <select
                            {...control}
                            className={fieldControlClassName}
                            value={parentSite?.id ?? draft.parentId}
                            disabled={Boolean(parentSite)}
                            onChange={(event) =>
                                setDraft((current) => ({
                                    ...current,
                                    parentId: event.target.value,
                                }))
                            }
                        >
                            <option value="">No parent (organization root)</option>
                            {parents.map((site) => (
                                <option key={site.id} value={site.id}>
                                    {site.name}
                                </option>
                            ))}
                        </select>
                    )}
                </Field>
            </FormSection>

            <FormSection
                title="Operation"
                description="Address and time zone are used on operational schedules and reports."
            >
                <Field
                    id="site-address"
                    label="Address"
                    required
                    error={errors.address}
                    description={`${draft.address.trim().length}/255 characters`}
                >
                    {(control) => (
                        <input
                            {...control}
                            className={fieldControlClassName}
                            value={draft.address}
                            onChange={(event) =>
                                setDraft((current) => ({
                                    ...current,
                                    address: event.target.value,
                                }))
                            }
                            placeholder="12 Marina Road, Lagos"
                            autoComplete="street-address"
                            maxLength={255}
                        />
                    )}
                </Field>

                <Field
                    id="site-timezone"
                    label="Time zone"
                    required
                    error={errors.timezone}
                    description="Schedules, check-in windows and reports use this time zone."
                >
                    {(control) => (
                        <select
                            {...control}
                            className={fieldControlClassName}
                            value={draft.timezone}
                            onChange={(event) =>
                                setDraft((current) => ({
                                    ...current,
                                    timezone: event.target.value,
                                }))
                            }
                        >
                            {timezoneOptions().map((zone) => (
                                <option key={zone} value={zone}>
                                    {zone.replaceAll("_", " ")}
                                </option>
                            ))}
                        </select>
                    )}
                </Field>
            </FormSection>

            <FormSection
                title="Management authority"
                description="Management authority belongs to a Site manager. A child Site can inherit it, receive its own manager, or start without one."
            >
                <Field
                    id="site-authority"
                    label="Who manages this Site?"
                    required
                    error={errors.authority}
                >
                    {(control) => (
                        <select
                            {...control}
                            className={fieldControlClassName}
                            value={draft.authority}
                            onChange={(event) =>
                                setDraft((current) => ({
                                    ...current,
                                    authority: event.target
                                        .value as Draft["authority"],
                                }))
                            }
                        >
                            {parentSite ? (
                                <option value="inherit">
                                    Inherit from parent Site
                                </option>
                            ) : (
                                <option value="none">No local manager</option>
                            )}
                            {managerOptions.length > 0 ? (
                                <option value="existing">
                                    Assign an existing manager
                                </option>
                            ) : null}
                            <option value="invite">Invite a new manager</option>
                        </select>
                    )}
                </Field>

                {draft.authority === "inherit" ? (
                    <p className="text-xs leading-5 text-[var(--vms-ink-muted)]">
                        Inherited management resolves to the nearest ancestor Site
                        with active managers. {parentName} is the current parent.
                    </p>
                ) : null}

                {draft.authority === "none" ? (
                    <InlineAlert
                        tone="warning"
                        title="No local management authority"
                    >
                        {parentSite
                            ? `This Site will inherit authority from ${parentName} until a manager is assigned to it.`
                            : "No manager will be assigned to this top-level Site. Assign one from the organization managers page before operating it."}
                    </InlineAlert>
                ) : null}

                {draft.authority === "existing" ? (
                    <Field
                        id="site-existing-manager"
                        label="Existing manager"
                        required
                        error={errors.authority}
                        description="The manager keeps their existing identity and receives the default Site administration role."
                    >
                        {(control) => (
                            <select
                                {...control}
                                className={fieldControlClassName}
                                value={draft.adminUserId}
                                onChange={(event) =>
                                    setDraft((current) => ({
                                        ...current,
                                        adminUserId: event.target.value,
                                    }))
                                }
                            >
                                <option value="">Choose a manager</option>
                                {managerOptions.map((manager) => (
                                    <option
                                        key={manager.assignment_id}
                                        value={manager.user.id}
                                    >
                                        {manager.user.name} · {manager.site.name}
                                    </option>
                                ))}
                            </select>
                        )}
                    </Field>
                ) : null}

                {draft.authority === "invite" ? (
                    <>
                        <Field
                            id="site-admin-email"
                            label="Manager email"
                            required
                            error={errors.authority}
                            description="We create or reuse the User and grant the default Site administration role."
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
                                        setDraft((current) => ({
                                            ...current,
                                            adminEmail: event.target.value,
                                        }))
                                    }
                                />
                            )}
                        </Field>
                        <Field id="site-admin-name" label="Manager name">
                            {(control) => (
                                <input
                                    {...control}
                                    className={fieldControlClassName}
                                    autoComplete="name"
                                    value={draft.adminName}
                                    onChange={(event) =>
                                        setDraft((current) => ({
                                            ...current,
                                            adminName: event.target.value,
                                        }))
                                    }
                                />
                            )}
                        </Field>
                        <Field id="site-admin-phone" label="Manager phone">
                            {(control) => (
                                <input
                                    {...control}
                                    className={fieldControlClassName}
                                    type="tel"
                                    inputMode="tel"
                                    autoComplete="tel"
                                    value={draft.adminPhone}
                                    onChange={(event) =>
                                        setDraft((current) => ({
                                            ...current,
                                            adminPhone: event.target.value,
                                        }))
                                    }
                                />
                            )}
                        </Field>
                    </>
                ) : null}

                {managers.isError ? (
                    <InlineAlert tone="warning" title="Managers could not be loaded">
                        Invite a new manager by email, or retry from the
                        organization managers page.
                    </InlineAlert>
                ) : null}
            </FormSection>
        </FormDrawer>
    );
}
