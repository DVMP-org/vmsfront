"use client";

import { useEffect, useState, type FormEvent } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

import { FormDrawer, FormHint } from "@/components/ui/form/FormDrawer";
import { FormSection } from "@/components/ui/form/FormSection";

import type {
    PolicyAssignmentPreview,
    PolicyDefinitionEntry,
    PolicySiteAssignment,
    PolicyTemplate,
} from "../api";
import { formatPolicyValue } from "../lib";
import { useAssignPolicyTemplate } from "../queries";

const contextLabel = (value: string) => value.replaceAll("_", " ");

export function TemplateAssignDrawer({
    slug,
    isOpen,
    onClose,
    template,
    sites,
    definitions,
}: {
    slug: string;
    isOpen: boolean;
    onClose: () => void;
    template: PolicyTemplate | null;
    sites: PolicySiteAssignment[];
    definitions: Record<string, PolicyDefinitionEntry>;
}) {
    const assign = useAssignPolicyTemplate(slug);
    const [selected, setSelected] = useState<string[]>([]);
    const [reason, setReason] = useState("");
    const [preview, setPreview] = useState<PolicyAssignmentPreview | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        setSelected(template?.assigned_site_ids ?? []);
        setReason("");
        setPreview(null);
    }, [isOpen, template]);

    if (!template) return null;

    const compatible = (site: PolicySiteAssignment) =>
        template.use_cases.includes(site.use_case);

    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (selected.length === 0) return;
        const result = await assign.mutateAsync({
            template_id: template.id,
            site_ids: selected,
            preview: preview === null,
            reason: reason.trim() || null,
        });
        if (preview === null) {
            setPreview(result);
            return;
        }
        onClose();
    };

    return (
        <FormDrawer
            isOpen={isOpen}
            onClose={onClose}
            title={`Assign ${template.name}`}
            description="Preview the effective change before anything is written. Existing site overrides are listed but never removed."
            submitLabel={preview ? "Apply to selected sites" : "Preview impact"}
            onSubmit={submit}
            isSubmitting={assign.isPending}
            canSubmit={selected.length > 0}
            error={assign.error?.message ?? null}
            footerNote={
                preview
                    ? "Applying takes effect immediately for new operations."
                    : "Nothing changes until you confirm the preview."
            }
            size="lg"
            secondaryAction={
                preview ? (
                    <button
                        type="button"
                        className="min-h-11 px-3 text-xs font-semibold text-[var(--vms-ink-muted)] hover:text-[var(--vms-ink)]"
                        onClick={() => setPreview(null)}
                    >
                        Start over
                    </button>
                ) : undefined
            }
        >
            <FormSection
                title="Sites"
                description="Only sites with a matching operating context can receive this standard."
            >
                <ul className="max-h-80 space-y-2 overflow-y-auto pr-1">
                    {sites.map((site) => {
                        const allowed = compatible(site);
                        const checked = selected.includes(site.site_id);
                        return (
                            <li key={site.site_id}>
                                <label
                                    className={[
                                        "flex min-h-11 items-start gap-3 rounded-[var(--vms-radius-control)] border px-3 py-2 text-sm",
                                        allowed
                                            ? "border-[var(--vms-line)]"
                                            : "border-dashed border-[var(--vms-line)] opacity-60",
                                    ].join(" ")}
                                >
                                    <input
                                        type="checkbox"
                                        className="mt-1"
                                        disabled={!allowed}
                                        checked={checked}
                                        onChange={() =>
                                            setSelected((current) =>
                                                checked
                                                    ? current.filter((id) => id !== site.site_id)
                                                    : [...current, site.site_id],
                                            )
                                        }
                                    />
                                    <span className="min-w-0 flex-1">
                                        <span className="block font-medium">{site.site_name}</span>
                                        <span className="mt-0.5 block text-xs text-[var(--vms-ink-muted)]">
                                            {contextLabel(site.use_case)} ·{" "}
                                            {site.template_name
                                                ? `currently ${site.template_name}`
                                                : "no standard"}
                                            {site.override_count > 0
                                                ? ` · ${site.override_count} site override${site.override_count === 1 ? "" : "s"
                                                }`
                                                : ""}
                                        </span>
                                        {!allowed ? (
                                            <span className="mt-1 block text-xs text-[var(--vms-warning)]">
                                                This standard does not cover {contextLabel(site.use_case)}.
                                            </span>
                                        ) : null}
                                    </span>
                                </label>
                            </li>
                        );
                    })}
                </ul>
            </FormSection>

            <FormSection
                title="Reason"
                description="Optional. Recorded in the policy change history."
            >
                <input
                    className="min-h-11 w-full rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] bg-[var(--vms-surface)] px-3 text-sm"
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder="Rolling out the 2026 estate standard"
                    maxLength={255}
                />
                <FormHint>
                    Assigning a standard does not overwrite a site's own overrides.
                </FormHint>
            </FormSection>

            {preview ? (
                <FormSection
                    title="Preview"
                    description="What changes when this standard is applied."
                >
                    {preview.conflicts.length > 0 ? (
                        <div
                            role="alert"
                            className="rounded-[var(--vms-radius-control)] border border-[var(--vms-warning)] p-3 text-sm"
                        >
                            <p className="flex items-center gap-2 font-semibold">
                                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                                {preview.conflicts.length} site
                                {preview.conflicts.length === 1 ? "" : "s"} cannot use this
                                standard
                            </p>
                            <ul className="mt-2 space-y-1 text-xs leading-5">
                                {preview.conflicts.map((conflict) => (
                                    <li key={conflict.site_id}>{conflict.reasons.join(" · ")}</li>
                                ))}
                            </ul>
                        </div>
                    ) : null}
                    <ul className="space-y-2">
                        {preview.sites.map((site) => (
                            <li
                                key={site.site_id}
                                className="rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] p-3"
                            >
                                <p className="flex items-center gap-2 text-sm font-semibold">
                                    <CheckCircle2
                                        className="h-4 w-4 text-[var(--vms-success)]"
                                        aria-hidden="true"
                                    />
                                    {site.site_name}
                                </p>
                                {site.changed_values.length === 0 ? (
                                    <p className="mt-1 text-xs text-[var(--vms-ink-muted)]">
                                        No effective value changes.
                                    </p>
                                ) : (
                                    <ul className="mt-2 space-y-1 text-xs leading-5">
                                        {site.changed_values.map((change) => {
                                            const definition = definitions[change.key];
                                            const format = (
                                                value: (typeof change)["new_value"] | null,
                                            ) =>
                                                definition
                                                    ? formatPolicyValue(definition, value)
                                                    : String(value ?? "Not set");
                                            return (
                                                <li key={change.key}>
                                                    <span className="font-medium">
                                                        {definition?.name ?? change.name}:
                                                    </span>{" "}
                                                    {format(change.previous_value)} →{" "}
                                                    {format(change.new_value)}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                                {site.site_override_keys.length > 0 ? (
                                    <p className="mt-2 text-xs text-[var(--vms-ink-muted)]">
                                        Keeps {site.site_override_keys.length} site override
                                        {site.site_override_keys.length === 1 ? "" : "s"}.
                                    </p>
                                ) : null}
                            </li>
                        ))}
                    </ul>
                </FormSection>
            ) : null}
        </FormDrawer>
    );
}
