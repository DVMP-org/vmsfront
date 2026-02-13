"use client";

import React from "react";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/password-input";
import { FormLabel } from "@/components/ui/label/FormLabel";
import { FormDescription } from "@/components/ui/form/FormDescription";
import { Checkbox } from "@/components/ui/Checkbox";
import {
    CredentialField,
    IntegrationCredentials,
    CredentialFormValues,
} from "@/types/integration";
import { cn } from "@/lib/utils";

interface CredentialFormRendererProps {
    credentials: IntegrationCredentials;
    values: CredentialFormValues;
    onChange: (key: string, value: string | number | boolean) => void;
    errors?: Record<string, string>;
    disabled?: boolean;
}

function formatFieldLabel(key: string): string {
    return key
        .replace(/_/g, " ")
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase())
        .trim();
}

function renderField(
    key: string,
    field: CredentialField,
    value: string | number | boolean | undefined,
    onChange: (val: string | number | boolean) => void,
    error?: string,
    disabled?: boolean
) {
    const label = formatFieldLabel(key);
    const isRequired = field.required !== false;
    const currentValue = value ?? field.value ?? "";

    switch (field.type) {
        case "password":
            return (
                <div key={key} className="space-y-1.5">
                    <FormLabel showAsterisk={isRequired} error={error}>
                        {label}
                    </FormLabel>
                    <PasswordInput
                        placeholder={field.placeholder || `Enter ${label.toLowerCase()}`}
                        value={currentValue as string}
                        onChange={(e) => onChange(e.target.value)}
                        status={error ? "error" : "default"}
                        disabled={disabled}
                    />
                    {field.description && (
                        <FormDescription className="text-xs">
                            {field.description}
                        </FormDescription>
                    )}
                    {error && <p className="text-xs text-red-500">{error}</p>}
                </div>
            );

        case "boolean":
            return (
                <div key={key} className="space-y-1.5">
                    <div className="flex items-center gap-3">
                        <Checkbox
                            id={key}
                            checked={!!currentValue}
                            onChange={(e) => onChange(e.target.checked)}
                            disabled={disabled}
                        />
                        <div className="flex flex-col">
                            <label
                                htmlFor={key}
                                className="text-sm font-medium leading-none cursor-pointer"
                            >
                                {label}
                            </label>
                            {field.description && (
                                <span className="text-xs text-muted-foreground mt-0.5">
                                    {field.description}
                                </span>
                            )}
                        </div>
                    </div>
                    {error && <p className="text-xs text-red-500">{error}</p>}
                </div>
            );

        case "number":
            return (
                <div key={key} className="space-y-1.5">
                    <FormLabel showAsterisk={isRequired} error={error}>
                        {label}
                    </FormLabel>
                    <Input
                        type="number"
                        placeholder={field.placeholder || `Enter ${label.toLowerCase()}`}
                        value={currentValue as number}
                        onChange={(e) => onChange(Number(e.target.value))}
                        status={error ? "error" : "default"}
                        disabled={disabled}
                    />
                    {field.description && (
                        <FormDescription className="text-xs">
                            {field.description}
                        </FormDescription>
                    )}
                    {error && <p className="text-xs text-red-500">{error}</p>}
                </div>
            );

        case "select":
            return (
                <div key={key} className="space-y-1.5">
                    <FormLabel showAsterisk={isRequired} error={error}>
                        {label}
                    </FormLabel>
                    <select
                        value={currentValue as string}
                        onChange={(e) => onChange(e.target.value)}
                        disabled={disabled}
                        className={cn(
                            "flex h-10 w-full rounded-[4px] border px-3 py-2 text-sm",
                            "border-[#DEDEDE] bg-white dark:border-white/20 dark:bg-transparent",
                            "focus:outline-none focus:ring-2 focus:ring-offset-2",
                            "disabled:cursor-not-allowed disabled:opacity-50",
                            error && "border-red-500"
                        )}
                    >
                        <option value="">
                            {field.placeholder || `Select ${label.toLowerCase()}`}
                        </option>
                        {field.options?.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                    {field.description && (
                        <FormDescription className="text-xs">
                            {field.description}
                        </FormDescription>
                    )}
                    {error && <p className="text-xs text-red-500">{error}</p>}
                </div>
            );

        case "text":
            return (
                <div key={key} className="space-y-1.5">
                    <FormLabel showAsterisk={isRequired} error={error}>
                        {label}
                    </FormLabel>
                    <textarea
                        placeholder={field.placeholder || `Enter ${label.toLowerCase()}`}
                        value={currentValue as string}
                        onChange={(e) => onChange(e.target.value)}
                        disabled={disabled}
                        rows={3}
                        className={cn(
                            "flex w-full rounded-[4px] border px-3 py-2 text-sm",
                            "border-[#DEDEDE] bg-white dark:border-white/20 dark:bg-transparent",
                            "focus:outline-none focus:ring-2 focus:ring-offset-2",
                            "disabled:cursor-not-allowed disabled:opacity-50",
                            "resize-none",
                            error && "border-red-500"
                        )}
                    />
                    {field.description && (
                        <FormDescription className="text-xs">
                            {field.description}
                        </FormDescription>
                    )}
                    {error && <p className="text-xs text-red-500">{error}</p>}
                </div>
            );

        case "url":
        case "email":
        case "string":
        default:
            return (
                <div key={key} className="space-y-1.5">
                    <FormLabel showAsterisk={isRequired} error={error}>
                        {label}
                    </FormLabel>
                    <Input
                        type={field.type === "email" ? "email" : field.type === "url" ? "url" : "text"}
                        placeholder={field.placeholder || `Enter ${label.toLowerCase()}`}
                        value={currentValue as string}
                        onChange={(e) => onChange(e.target.value)}
                        status={error ? "error" : "default"}
                        disabled={disabled}
                    />
                    {field.description && (
                        <FormDescription className="text-xs">
                            {field.description}
                        </FormDescription>
                    )}
                    {error && <p className="text-xs text-red-500">{error}</p>}
                </div>
            );
    }
}

export function CredentialFormRenderer({
    credentials,
    values,
    onChange,
    errors = {},
    disabled = false,
}: CredentialFormRendererProps) {
    if (!credentials) {
        return (
            <div className="text-sm text-muted-foreground py-4 text-center border border-dashed border-zinc-200 rounded-lg">
                No configuration required for this integration.
            </div>
        );
    }
    const credentialEntries = Object.entries(credentials);

    if (credentialEntries.length === 0) {
        return (
            <div className="text-sm text-muted-foreground py-4 text-center border border-dashed border-zinc-200 rounded-lg">
                No configuration required for this integration.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {credentialEntries.map(([key, field]) =>
                renderField(
                    key,
                    field,
                    values[key],
                    (val) => onChange(key, val),
                    errors[key],
                    disabled
                )
            )}
        </div>
    );
}
