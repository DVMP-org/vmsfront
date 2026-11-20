"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { FormDrawer, FormHint } from "@/components/ui/form/FormDrawer";
import { FormSection } from "@/components/ui/form/FormSection";
import { Field, fieldControlClassName } from "@/components/ui/form/Field";

import type {
    PolicyDefinitionCatalog,
    PolicyDefinitionEntry,
    PolicyTemplate,
    PolicyValue,
} from "../api";
import { formatPolicyValue } from "../lib";
import {
    useCreatePolicyTemplate,
    useUpdatePolicyTemplate,
} from "../queries";
import { PolicyValueControl } from "./PolicyValueControl";

const CONTEXTS = [
    { value: "residential", label: "Residential" },
    { value: "commercial", label: "Commercial" },
    { value: "hospitality", label: "Hospitality" },
    { value: "mixed_use", label: "Mixed use" },
];

export function PolicyTemplateDrawer({
    slug,
    isOpen,
    onClose,
    template,
    catalog,
}: {
    slug: string;
    isOpen: boolean;
    onClose: () => void;
    template: PolicyTemplate | null;
    catalog?: PolicyDefinitionCatalog;
}) {
    const create = useCreatePolicyTemplate(slug);
    const update = useUpdatePolicyTemplate(slug);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [useCases, setUseCases] = useState<string[]>(["residential"]);
    const [values, setValues] = useState<Record<string, PolicyValue>>({});

    useEffect(() => {
        if (!isOpen) return;
        setName(template?.name ?? "");
        setDescription(template?.description ?? "");
        setUseCases(template?.use_cases ?? ["residential"]);
        setValues(template?.values ?? {});
    }, [isOpen, template]);

    const groups = useMemo(() => {
        const definitions = catalog?.groups ?? [];
        return definitions
            .map((group) => ({
                ...group,
                policies: group.policies.filter((policy) =>
                    useCases.some((useCase) => policy.domains.includes(useCase)),
                ),
            }))
            .filter((group) => group.policies.length > 0);
    }, [catalog?.groups, useCases]);

    const toggleContext = (value: string) => {
        setUseCases((current) =>
            current.includes(value)
                ? current.filter((item) => item !== value)
                : [...current, value],
        );
    };

    const togglePolicy = (policy: PolicyDefinitionEntry, enabled: boolean) => {
        setValues((current) => {
            const next = { ...current };
            if (enabled) next[policy.key] = policy.default;
            else delete next[policy.key];
            return next;
        });
    };

    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!name.trim() || useCases.length === 0) return;
        const payload = {
            name: name.trim(),
            description: description.trim() || null,
            use_cases: useCases,
            values,
        };
        if (template) {
            await update.mutateAsync({ templateId: template.id, input: payload });
        } else {
            await create.mutateAsync(payload);
        }
        onClose();
    };

    const isPending = create.isPending || update.isPending;

    return (
        <FormDrawer
            isOpen={isOpen}
            onClose={onClose}
            title={template ? "Edit policy standard" : "New policy standard"}
            description="Choose the operating contexts this standard covers, then set only the policies it should define. Anything left unset keeps its platform or operating default."
            submitLabel={template ? "Save standard" : "Create standard"}
            onSubmit={submit}
            isSubmitting={isPending}
            canSubmit={Boolean(name.trim()) && useCases.length > 0}
            error={create.error?.message ?? update.error?.message ?? null}
            footerNote="Assigning this standard does not overwrite an existing site override."
            size="lg"
        >
            <FormSection title="Standard" description="A name operators will recognise.">
                <Field id="policy-standard-name" label="Name" required>
                    {(control) => (
                        <input
                            {...control}
                            className={fieldControlClassName}
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            placeholder="Estate operations standard"
                            maxLength={120}
                        />
                    )}
                </Field>
                <Field id="policy-standard-description" label="Description">
                    {(control) => (
                        <textarea
                            {...control}
                            className={`${fieldControlClassName} min-h-20`}
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                            placeholder="What this standard is for, and which sites should use it."
                            rows={3}
                        />
                    )}
                </Field>
            </FormSection>

            <FormSection
                title="Applies to"
                description="A standard can be assigned only to a site whose operating context is selected here."
            >
                <div className="grid gap-2 sm:grid-cols-2">
                    {CONTEXTS.map((context) => (
                        <div
                            key={context.value}
                            className="rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] px-3"
                        >
                            <Checkbox
                                id={`policy-standard-context-${context.value}`}
                                label={context.label}
                                checked={useCases.includes(context.value)}
                                onChange={() => toggleContext(context.value)}
                                className="rounded border-[var(--vms-line-strong)]"
                            />
                        </div>
                    ))}
                </div>
                <FormHint>
                    Mixed-use sites can use residential, commercial and hospitality policies.
                </FormHint>
            </FormSection>

            {groups.map((group) => (
                <FormSection
                    key={group.key}
                    title={group.label}
                    description="Turn a policy on to include it in this standard."
                >
                    <ul className="space-y-3">
                        {group.policies.map((policy) => {
                            const included = policy.key in values;
                            return (
                                <li
                                    key={policy.key}
                                    className="rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] p-3"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium">{policy.name}</p>
                                            <p className="mt-1 text-xs leading-5 text-[var(--vms-ink-muted)]">
                                                {policy.description}
                                            </p>
                                        </div>
                                        <Button
                                            type="button"
                                            variant={included ? "outline" : "ghost"}
                                            size="sm"
                                            aria-pressed={included}
                                            onClick={() => togglePolicy(policy, !included)}
                                        >
                                            {included ? "Included" : "Include"}
                                        </Button>
                                    </div>
                                    {included ? (
                                        <div className="mt-3 border-t border-[var(--vms-line)] pt-3">
                                            <PolicyValueControl
                                                policy={policy}
                                                value={values[policy.key]}
                                                onChange={(value) =>
                                                    setValues((current) => ({
                                                        ...current,
                                                        [policy.key]: value,
                                                    }))
                                                }
                                            />
                                            <p className="mt-2 text-xs text-[var(--vms-ink-muted)]">
                                                Standard value:{" "}
                                                {formatPolicyValue(policy, values[policy.key])}
                                            </p>
                                        </div>
                                    ) : null}
                                </li>
                            );
                        })}
                    </ul>
                </FormSection>
            ))}
        </FormDrawer>
    );
}
