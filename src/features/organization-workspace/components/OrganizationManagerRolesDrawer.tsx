"use client";

import { useEffect, useState } from "react";

import { FormDrawer } from "@/components/ui/form/FormDrawer";
import { FormSection } from "@/components/ui/form/FormSection";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { parseApiError } from "@/lib/error-utils";

import type { OrganizationManager, OrganizationSiteRole } from "../api";
import { useReplaceOrganizationManagerRoles } from "../queries";

export function OrganizationManagerRolesDrawer({
    manager,
    roles,
    slug,
    onClose,
}: {
    manager: OrganizationManager | null;
    roles: OrganizationSiteRole[];
    slug?: string | null;
    onClose: () => void;
}) {
    const mutation = useReplaceOrganizationManagerRoles(slug);
    const [selected, setSelected] = useState<string[]>([]);

    useEffect(() => {
        setSelected(manager?.roles.map((role) => role.id) ?? []);
        mutation.reset();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [manager?.assignment_id]);

    function toggle(roleId: string) {
        setSelected((current) =>
            current.includes(roleId)
                ? current.filter((id) => id !== roleId)
                : [...current, roleId],
        );
    }

    function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!manager || selected.length === 0) return;
        mutation.mutate(
            { assignmentId: manager.assignment_id, roleIds: selected },
            { onSuccess: onClose },
        );
    }

    const errorMessage = mutation.isError
        ? parseApiError(mutation.error).message
        : null;

    return (
        <FormDrawer
            isOpen={Boolean(manager)}
            onClose={onClose}
            title={`Roles for ${manager?.user.name || "manager"}`}
            description={`${manager?.site.name || "Site"} · replace the effective Site role grants.`}
            onSubmit={submit}
            submitLabel="Save roles"
            isSubmitting={mutation.isPending}
            canSubmit={Boolean(manager && selected.length > 0 && !mutation.isPending)}
            error={errorMessage}
            footerNote="A manager needs at least one role. Effective permissions are the union of the selected roles."
        >
            <FormSection
                title="Role grants"
                description="Roles control what the manager can read and change inside the Site."
            >
                <div className="space-y-2">
                    {roles.map((role) => {
                        const checked = selected.includes(role.id);
                        return (
                            <label
                                key={role.id}
                                className="flex min-h-11 cursor-pointer items-start gap-3 rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] px-3 py-2 text-sm transition-colors hover:bg-[var(--vms-surface-subtle)]"
                            >
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggle(role.id)}
                                    className="mt-1 h-4 w-4"
                                />
                                <span className="min-w-0">
                                    <span className="block font-semibold text-[var(--vms-ink)]">
                                        {role.name}
                                    </span>
                                    <span className="block text-xs text-[var(--vms-ink-muted)]">
                                        {role.permissions.includes("*")
                                            ? "Full Site authority"
                                            : `${role.permissions.length} permissions`}
                                    </span>
                                </span>
                            </label>
                        );
                    })}
                </div>
                {roles.length === 0 ? (
                    <InlineAlert tone="warning" title="No Site roles">
                        The organization has no Site role catalog yet.
                    </InlineAlert>
                ) : null}
            </FormSection>
        </FormDrawer>
    );
}
