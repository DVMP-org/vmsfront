"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { Field, fieldControlClassName } from "@/components/ui/form/Field";
import { FormSection } from "@/components/ui/form/FormSection";
import { OrganizationAdminHeader } from "@/features/organization-admin/OrganizationAdminHeader";
import type { UseCase } from "@/features/context/api";
import { useCurrentOrganization } from "@/hooks/use-organization";
import { parseApiError } from "@/lib/error-utils";
import { cn } from "@/lib/utils";
import { useAdminProfile } from "@/hooks/use-admin";
import { hasAdminPermission } from "@/lib/permissions";

import type { OrganizationSite, OrganizationSiteNotificationSettings } from "../api";
import { operatingTypeLabels, timezoneOptions } from "../lib";
import {
    useOrganizationSites,
    useOrganizationSite,
    useUpdateOrganizationSite,
} from "../queries";
import { SectionHeading, SurfaceCard } from "./organization-ui";

interface Draft {
    name: string;
    useCase: UseCase | "";
    address: string;
    description: string;
    timezone: string;
    notifications: OrganizationSiteNotificationSettings;
}

const notificationOptions: {
    key: keyof OrganizationSiteNotificationSettings;
    label: string;
}[] = [
        { key: "maintenance_updates", label: "Maintenance updates" },
        { key: "resident_announcements", label: "Resident announcements" },
        { key: "emergency_alerts", label: "Emergency alerts" },
        { key: "visitor_arrivals", label: "Visitor arrivals" },
        { key: "weekly_operations_summary", label: "Weekly operations summary" },
    ];

function draftFrom(site: OrganizationSite): Draft {
    return {
        name: site.name,
        useCase: site.use_case,
        address: site.address,
        description: site.description ?? "",
        timezone: site.timezone,
        notifications: { ...site.notification_settings },
    };
}

function Toggle({
    checked,
    onChange,
    label,
}: {
    checked: boolean;
    onChange: (next: boolean) => void;
    label: string;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            onClick={() => onChange(!checked)}
            className={cn(
                "flex min-h-11 w-full items-center justify-between gap-3 rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] px-3 text-left text-sm text-[var(--vms-ink)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]",
                checked ? "bg-[var(--vms-surface-subtle)]" : "bg-[var(--vms-surface)]",
            )}
        >
            <span>{label}</span>
            <span
                aria-hidden="true"
                className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors",
                    checked
                        ? "border-[var(--vms-success)] bg-[var(--vms-success)]"
                        : "border-[var(--vms-line)] bg-[var(--vms-surface-subtle)]",
                )}
            >
                <span
                    className={cn(
                        "absolute h-4 w-4 rounded-full bg-white shadow transition-transform",
                        checked ? "translate-x-5" : "translate-x-1",
                    )}
                />
            </span>
        </button>
    );
}

export function OrganizationSiteEdit({ siteId }: { siteId: string }) {
    const router = useRouter();
    const { organization } = useCurrentOrganization();
    const slug = organization?.slug ?? null;
    const detail = useOrganizationSite(slug, siteId);
    const portfolio = useOrganizationSites(slug);
    const profile = useAdminProfile();
    const update = useUpdateOrganizationSite(slug);
    const [draft, setDraft] = useState<Draft | null>(null);
    const [nameError, setNameError] = useState("");
    const timezones = useMemo(() => timezoneOptions(), []);

    useEffect(() => {
        if (detail.data && !draft) {
            setDraft(draftFrom(detail.data));
        }
    }, [detail.data, draft]);

    const canUpdate =
        profile.isSuccess &&
        !profile.isError &&
        hasAdminPermission(profile.data, "places.update");

    if (detail.isPending) {
        return (
            <div role="status" className="space-y-4">
                <span className="sr-only">Loading Site</span>
                <div className="h-9 w-72 animate-pulse rounded bg-[var(--vms-surface-subtle)]" />
                <div className="h-64 animate-pulse rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)]" />
            </div>
        );
    }

    if (detail.isError || !detail.data || !draft) {
        return (
            <div className="space-y-4">
                <OrganizationAdminHeader
                    eyebrow="Portfolio"
                    title="Site unavailable"
                    description="This Site could not be loaded for the current organization."
                    backHref="/organization/sites"
                    backLabel="Back to Sites"
                />
                <InlineAlert
                    tone="danger"
                    title="Site could not be loaded"
                    action={
                        <Button size="sm" variant="outline" onClick={() => detail.refetch()}>
                            Retry
                        </Button>
                    }
                >
                    {parseApiError(detail.error).message}
                </InlineAlert>
            </div>
        );
    }

    const site = detail.data;
    const currentParent = site.parent_site_id
        ? portfolio.data?.find((item) => item.id === site.parent_site_id) ?? null
        : null;

    function setNotification(
        key: keyof OrganizationSiteNotificationSettings,
        value: boolean,
    ) {
        setDraft((current) =>
            current
                ? {
                    ...current,
                    notifications: { ...current.notifications, [key]: value },
                }
                : current,
        );
    }

    function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!draft) return;
        const name = draft.name.trim();
        if (!name) {
            setNameError("Enter a Site name.");
            return;
        }
        setNameError("");
        update.mutate(
            {
                siteId: site.id,
                input: {
                    name,
                    use_case: draft.useCase || undefined,
                    address: draft.address.trim(),
                    description: draft.description.trim() || null,
                    timezone: draft.timezone,
                    notification_settings: draft.notifications,
                },
            },
            {
                onSuccess: () => {
                    router.push(`/organization/sites/${site.id}`);
                },
            },
        );
    }

    if (!canUpdate) {
        return (
            <div className="space-y-4">
                <OrganizationAdminHeader
                    eyebrow="Portfolio"
                    title={`Edit ${site.name}`}
                    description="Organization Site metadata."
                    backHref={`/organization/sites/${site.id}`}
                    backLabel="Back to Site"
                />
                <InlineAlert tone="warning" title="Editing unavailable">
                    Your current role cannot update organization Sites.
                </InlineAlert>
            </div>
        );
    }

    const serverError = update.isError
        ? parseApiError(update.error).message
        : null;

    return (
        <div className="space-y-5">
            <OrganizationAdminHeader
                eyebrow="Portfolio"
                title={`Edit ${site.name}`}
                description={`Update the portfolio metadata for this Site${currentParent ? ` under ${currentParent.name}` : " at the organization root"}.`}
                backHref={`/organization/sites/${site.id}`}
                backLabel="Back to Site"
            />

            <form onSubmit={submit} noValidate className="space-y-5">
                <SurfaceCard>
                    <SectionHeading
                        title="Site identity"
                        description="The name, operating type and address shown across the organization."
                    />
                    <div className="space-y-5 px-4 py-4 sm:px-5">
                        {serverError ? (
                            <InlineAlert tone="danger" title="Site could not be updated">
                                {serverError}
                            </InlineAlert>
                        ) : null}
                        <FormSection
                            title="Profile"
                            description="These values describe the operating boundary."
                        >
                            <Field id="site-name" label="Site name" required error={nameError}>
                                {(control) => (
                                    <input
                                        {...control}
                                        type="text"
                                        value={draft.name}
                                        maxLength={255}
                                        onChange={(event) =>
                                            setDraft({ ...draft, name: event.target.value })
                                        }
                                        className={fieldControlClassName}
                                    />
                                )}
                            </Field>
                            <Field
                                id="site-use-case"
                                label="Operating type"
                                description="Operating type is fixed when a Site is created."
                            >
                                {(control) => (
                                    <select
                                        {...control}
                                        value={draft.useCase}
                                        disabled
                                        className={fieldControlClassName}
                                    >
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
                                id="site-address"
                                label="Address"
                                description="Street address or locality used to identify the Site."
                            >
                                {(control) => (
                                    <input
                                        {...control}
                                        type="text"
                                        value={draft.address}
                                        maxLength={255}
                                        onChange={(event) =>
                                            setDraft({ ...draft, address: event.target.value })
                                        }
                                        className={fieldControlClassName}
                                    />
                                )}
                            </Field>
                            <Field id="site-description" label="Description">
                                {(control) => (
                                    <textarea
                                        {...control}
                                        value={draft.description}
                                        maxLength={255}
                                        rows={3}
                                        onChange={(event) =>
                                            setDraft({ ...draft, description: event.target.value })
                                        }
                                        className={fieldControlClassName}
                                    />
                                )}
                            </Field>
                        </FormSection>
                    </div>
                </SurfaceCard>

                <SurfaceCard>
                    <SectionHeading
                        title="Local time"
                        description="Schedules, reports and announcements use this time zone."
                    />
                    <div className="px-4 py-4 sm:px-5">
                        <Field id="site-timezone" label="Time zone" required>
                            {(control) => (
                                <select
                                    {...control}
                                    value={draft.timezone}
                                    onChange={(event) =>
                                        setDraft({ ...draft, timezone: event.target.value })
                                    }
                                    className={fieldControlClassName}
                                >
                                    {timezones.map((zone) => (
                                        <option key={zone} value={zone}>
                                            {zone}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </Field>
                    </div>
                </SurfaceCard>

                <SurfaceCard>
                    <SectionHeading
                        title="Notifications"
                        description="Choose which operational updates this Site sends."
                    />
                    <div className="grid gap-2 px-4 py-4 sm:grid-cols-2 sm:px-5">
                        {notificationOptions.map((option) => (
                            <Toggle
                                key={option.key}
                                label={option.label}
                                checked={draft.notifications[option.key]}
                                onChange={(next) => setNotification(option.key, next)}
                            />
                        ))}
                    </div>
                </SurfaceCard>

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <Button variant="outline" asChild>
                        <Link href={`/organization/sites/${site.id}`}>
                            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                            Cancel
                        </Link>
                    </Button>
                    <Button type="submit" disabled={update.isPending}>
                        {update.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        ) : (
                            <Save className="h-4 w-4" aria-hidden="true" />
                        )}
                        {update.isPending ? "Saving" : "Save changes"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
