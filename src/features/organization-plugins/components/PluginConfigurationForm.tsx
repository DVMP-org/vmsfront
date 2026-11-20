"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import { fieldControlClassName } from "@/components/ui/form/Field";
import type { BackendPlugin, PluginConfig } from "@/types/plugin";

import { configurationDraft, configurationFields } from "../lib";
import { useConfigurePlugin } from "../queries";

export function PluginConfigurationForm({
    organizationId,
    plugin,
}: {
    organizationId: string;
    plugin: BackendPlugin;
}) {
    const fields = configurationFields(plugin, "organization");
    const initial = configurationDraft(fields, plugin.configuration);
    const [draft, setDraft] = useState<PluginConfig>(initial);
    const mutation = useConfigurePlugin(organizationId, plugin.id);
    const disabled = !plugin.can_configure || mutation.isPending;
    const dirty = JSON.stringify(draft) !== JSON.stringify(initial);

    const setValue = (key: string, value: PluginConfig[string]) =>
        setDraft((current) => ({ ...current, [key]: value }));

    const submit = () => {
        const payload: PluginConfig = {};
        for (const field of fields) {
            const value = draft[field.key];
            if (value === "" || value === undefined) continue;
            payload[field.key] = value;
        }
        mutation.mutate(payload);
    };

    if (!fields.length) {
        return (
            <p className="p-5 text-sm leading-6 text-[var(--vms-ink-muted)]">
                This plugin declares no organization configuration. Its behaviour is
                governed by the provider connection and the Site activation.
            </p>
        );
    }

    return (
        <form
            className="space-y-5 p-5"
            onSubmit={(event) => {
                event.preventDefault();
                submit();
            }}
        >
            <p className="text-sm leading-6 text-[var(--vms-ink-muted)]">
                Organization configuration applies wherever this plugin is activated.
                Revision {plugin.config_revision ?? 0}
                {plugin.configured ? "" : " · not yet saved"}.
            </p>

            {!plugin.can_configure ? (
                <p className="rounded-[var(--vms-radius-control)] bg-[var(--vms-warning-subtle)] p-3 text-sm">
                    {plugin.entitlement_reason || "Settings are read-only for this plugin."}
                </p>
            ) : null}

            {mutation.isError ? (
                <p role="alert" className="text-sm text-[var(--vms-danger)]">
                    {mutation.error instanceof Error
                        ? mutation.error.message
                        : "Settings could not be saved."}
                </p>
            ) : null}

            {fields.map((field) => {
                const id = `plugin-setting-${field.key}`;
                const help = field.description ?? undefined;
                const value = draft[field.key];
                return (
                    <div key={field.key} className="space-y-1.5">
                        <label htmlFor={id} className="block text-sm font-semibold">
                            {field.label}
                            {field.required ? (
                                <span className="ml-1 text-[var(--vms-danger)]" aria-hidden="true">
                                    *
                                </span>
                            ) : null}
                        </label>
                        {help ? (
                            <p
                                id={`${id}-help`}
                                className="text-xs leading-5 text-[var(--vms-ink-muted)]"
                            >
                                {help}
                            </p>
                        ) : null}

                        {field.type === "boolean" || field.type === "toggle" ? (
                            <div className="flex min-h-11 items-center">
                                <Checkbox
                                    id={id}
                                    checked={value === true}
                                    disabled={disabled}
                                    aria-describedby={help ? `${id}-help` : undefined}
                                    onChange={(event) => setValue(field.key, event.target.checked)}
                                    className="h-5 w-5"
                                />
                            </div>
                        ) : field.type === "select" ? (
                            <select
                                id={id}
                                className={fieldControlClassName}
                                value={String(value ?? "")}
                                disabled={disabled}
                                aria-describedby={help ? `${id}-help` : undefined}
                                onChange={(event) => setValue(field.key, event.target.value)}
                            >
                                <option value="">Choose an option</option>
                                {(field.choices ?? []).map((choice) => (
                                    <option key={choice} value={choice}>
                                        {choice}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <Input
                                id={id}
                                type={
                                    field.type === "number" || field.type === "integer"
                                        ? "number"
                                        : field.type === "url"
                                            ? "url"
                                            : "text"
                                }
                                min={field.min ?? undefined}
                                max={field.max ?? undefined}
                                step={
                                    field.type === "integer"
                                        ? 1
                                        : field.type === "number"
                                            ? "any"
                                            : undefined
                                }
                                value={String(value ?? "")}
                                disabled={disabled}
                                aria-describedby={help ? `${id}-help` : undefined}
                                onChange={(event) =>
                                    setValue(
                                        field.key,
                                        field.type === "number" || field.type === "integer"
                                            ? event.target.value === ""
                                                ? ""
                                                : Number(event.target.value)
                                            : event.target.value,
                                    )
                                }
                            />
                        )}

                        {field.min !== undefined || field.max !== undefined ? (
                            <p className="text-xs text-[var(--vms-ink-muted)]">
                                Allowed range: {field.min ?? "—"} to {field.max ?? "—"}
                            </p>
                        ) : null}
                    </div>
                );
            })}

            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[var(--vms-line)] pt-5">
                {dirty ? (
                    <p className="mr-auto text-xs text-[var(--vms-ink-muted)]">
                        Unsaved changes
                    </p>
                ) : null}
                <Button
                    type="button"
                    variant="outline"
                    disabled={!dirty || mutation.isPending}
                    onClick={() => setDraft(initial)}
                >
                    Reset
                </Button>
                <Button type="submit" disabled={!plugin.can_configure || !dirty || mutation.isPending}>
                    {mutation.isPending ? "Saving…" : "Save settings"}
                </Button>
            </div>
        </form>
    );
}
