"use client";

import { useEffect, useState } from "react";

import { Field, fieldControlClassName } from "@/components/ui/form/Field";
import { FormDrawer } from "@/components/ui/form/FormDrawer";
import { FormSection } from "@/components/ui/form/FormSection";
import { parseApiError } from "@/lib/error-utils";

import type { OrganizationSiteSummary } from "../api";
import { useAddOrganizationManager } from "../queries";

export function AddOrganizationManagerDrawer({
    isOpen,
    onClose,
    slug,
    sites,
    defaultSiteId,
}: {
    isOpen: boolean;
    onClose: () => void;
    slug?: string | null;
    sites: OrganizationSiteSummary[];
    defaultSiteId?: string | null;
}) {
    const mutation = useAddOrganizationManager(slug);
    const [siteId, setSiteId] = useState(defaultSiteId ?? "");
    const [displayName, setDisplayName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!isOpen) return;
        setSiteId(defaultSiteId ?? "");
        setDisplayName("");
        setEmail("");
        setPhone("");
        setErrors({});
        mutation.reset();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, defaultSiteId]);

    function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const next: Record<string, string> = {};
        if (!siteId) next.siteId = "Choose the Site this manager leads.";
        const cleanEmail = email.trim();
        if (!cleanEmail) {
            next.email = "Enter the manager email address.";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
            next.email = "Enter a valid email address.";
        }
        setErrors(next);
        if (Object.keys(next).length) return;

        mutation.mutate(
            {
                site_id: siteId,
                display_name: displayName.trim() || null,
                email: cleanEmail,
                phone: phone.trim() || null,
            },
            { onSuccess: onClose },
        );
    }

    const errorMessage = mutation.isError
        ? parseApiError(mutation.error).message
        : null;

    return (
        <FormDrawer
            isOpen={isOpen}
            onClose={onClose}
            title="Add Site manager"
            description="Appoint a manager to a Site. They receive the default Site administration role and can be refined afterwards."
            onSubmit={submit}
            submitLabel="Add manager"
            isSubmitting={mutation.isPending}
            canSubmit={!mutation.isPending}
            error={errorMessage}
            footerNote="Managers are separate from Place parties. The same identity can also hold a party role."
        >
            <FormSection
                title="Site and identity"
                description="The manager administers the selected Site and child Sites that inherit its management."
            >
                <Field
                    id="organization-manager-site"
                    label="Site"
                    required
                    error={errors.siteId}
                >
                    {(control) => (
                        <select
                            {...control}
                            className={fieldControlClassName}
                            value={siteId}
                            onChange={(event) => setSiteId(event.target.value)}
                        >
                            <option value="">Choose a Site</option>
                            {sites.filter((site) => site.is_active).map((site) => (
                                <option key={site.id} value={site.id}>
                                    {site.name}
                                </option>
                            ))}
                        </select>
                    )}
                </Field>
                <Field id="organization-manager-name" label="Full name">
                    {(control) => (
                        <input
                            {...control}
                            className={fieldControlClassName}
                            value={displayName}
                            onChange={(event) => setDisplayName(event.target.value)}
                            autoComplete="name"
                            placeholder="Ada Bello"
                        />
                    )}
                </Field>
                <Field
                    id="organization-manager-email"
                    label="Email address"
                    required
                    error={errors.email}
                    description="We create the User if the email is new, or reuse the existing identity."
                >
                    {(control) => (
                        <input
                            {...control}
                            className={fieldControlClassName}
                            type="email"
                            inputMode="email"
                            autoComplete="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                        />
                    )}
                </Field>
                <Field id="organization-manager-phone" label="Phone number">
                    {(control) => (
                        <input
                            {...control}
                            className={fieldControlClassName}
                            type="tel"
                            inputMode="tel"
                            autoComplete="tel"
                            value={phone}
                            onChange={(event) => setPhone(event.target.value)}
                        />
                    )}
                </Field>
            </FormSection>
        </FormDrawer>
    );
}
