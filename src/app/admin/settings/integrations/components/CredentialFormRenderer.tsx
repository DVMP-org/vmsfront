"use client";

import React from "react";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/password-input";
import { Checkbox } from "@/components/ui/Checkbox";
import {
  CredentialField,
  IntegrationCredentials,
  CredentialFormValues,
} from "@/types/integration";
import { fieldControlClassName } from "@/components/ui/form/Field";
import { cn } from "@/lib/utils";

interface CredentialFormRendererProps {
  credentials: IntegrationCredentials;
  values: CredentialFormValues;
  onChange: (key: string, value: string | number | boolean) => void;
  /** Keys with a stored value. The value itself never reaches the client. */
  configuredKeys?: string[];
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

function SavedBadge() {
  return (
    <span className="rounded-full bg-[var(--vms-success-subtle)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--vms-success)]">
      Saved
    </span>
  );
}

function FieldLabel({
  htmlFor,
  label,
  isRequired,
  saved,
}: {
  htmlFor: string;
  label: string;
  isRequired: boolean;
  saved: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="flex flex-wrap items-center gap-2 text-sm font-semibold"
    >
      <span>
        {label}
        {isRequired ? (
          <span className="ml-1 text-[var(--vms-danger)]" aria-hidden="true">
            *
          </span>
        ) : null}
      </span>
      {saved ? <SavedBadge /> : null}
    </label>
  );
}

function FieldError({ id, error }: { id: string; error?: string }) {
  if (!error) return null;
  return (
    <p
      id={id}
      role="alert"
      className="text-xs font-medium text-[var(--vms-danger)]"
    >
      {error}
    </p>
  );
}

function FieldDescription({
  id,
  children,
  saved,
}: {
  id: string;
  children?: string;
  saved?: boolean;
}) {
  if (!children && !saved) return null;
  return (
    <p id={id} className="text-xs leading-5 text-[var(--vms-ink-muted)]">
      {saved
        ? `${children ? `${children} ` : ""}Leave blank to keep the saved value.`
        : children}
    </p>
  );
}

function renderField(
  key: string,
  field: CredentialField,
  value: string | number | boolean | undefined,
  onChange: (val: string | number | boolean) => void,
  error?: string,
  disabled?: boolean,
  saved = false,
) {
  const label = formatFieldLabel(key);
  const isRequired = field.required !== false;
  const currentValue = value ?? field.value ?? "";
  const inputId = `integration-credential-${key}`;
  const descriptionId = `${inputId}-description`;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy =
    [descriptionId, errorId].filter(Boolean).join(" ") || undefined;
  const placeholder =
    field.placeholder ??
    (saved
      ? "•••••••• saved — enter a new value to replace"
      : field.type === "password"
        ? "Enter a value"
        : `Enter ${label.toLowerCase()}`);

  switch (field.type) {
    case "password":
      return (
        <div key={key} className="space-y-1.5">
          <FieldLabel
            htmlFor={inputId}
            label={label}
            isRequired={isRequired}
            saved={saved}
          />
          <PasswordInput
            id={inputId}
            placeholder={placeholder}
            value={String(currentValue)}
            onChange={(e) => onChange(e.target.value)}
            status={error ? "error" : "default"}
            error={error}
            disabled={disabled}
            aria-describedby={describedBy}
          />
          <FieldDescription id={descriptionId} saved={saved}>
            {field.description}
          </FieldDescription>
        </div>
      );

    case "boolean":
      return (
        <div key={key} className="space-y-1.5">
          <div className="flex items-start gap-3">
            <Checkbox
              id={inputId}
              checked={!!currentValue}
              onChange={(e) => onChange(e.target.checked)}
              disabled={disabled}
              aria-describedby={describedBy}
            />
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <label
                  htmlFor={inputId}
                  className="cursor-pointer text-sm font-medium leading-5"
                >
                  {label}
                </label>
                {saved ? <SavedBadge /> : null}
              </div>
              <FieldDescription id={descriptionId} saved={saved}>
                {field.description}
              </FieldDescription>
            </div>
          </div>
          <FieldError id={`${inputId}-error`} error={error} />
        </div>
      );

    case "number":
      return (
        <div key={key} className="space-y-1.5">
          <FieldLabel
            htmlFor={inputId}
            label={label}
            isRequired={isRequired}
            saved={saved}
          />
          <Input
            id={inputId}
            type="number"
            placeholder={placeholder}
            value={currentValue as number}
            onChange={(e) =>
              onChange(e.target.value === "" ? "" : Number(e.target.value))
            }
            error={error}
            disabled={disabled}
            aria-describedby={describedBy}
          />
          <FieldDescription id={descriptionId} saved={saved}>
            {field.description}
          </FieldDescription>
        </div>
      );

    case "select":
      return (
        <div key={key} className="space-y-1.5">
          <FieldLabel
            htmlFor={inputId}
            label={label}
            isRequired={isRequired}
            saved={saved}
          />
          <select
            id={inputId}
            value={String(currentValue)}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={cn(
              fieldControlClassName,
              error &&
                "border-[var(--vms-danger)] bg-[var(--vms-danger-subtle)]",
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
          <FieldDescription id={descriptionId} saved={saved}>
            {field.description}
          </FieldDescription>
          <FieldError id={`${inputId}-error`} error={error} />
        </div>
      );

    case "text":
      return (
        <div key={key} className="space-y-1.5">
          <FieldLabel
            htmlFor={inputId}
            label={label}
            isRequired={isRequired}
            saved={saved}
          />
          <textarea
            id={inputId}
            placeholder={placeholder}
            value={String(currentValue)}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            rows={3}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={cn(
              fieldControlClassName,
              "resize-none",
              error &&
                "border-[var(--vms-danger)] bg-[var(--vms-danger-subtle)]",
            )}
          />
          <FieldDescription id={descriptionId} saved={saved}>
            {field.description}
          </FieldDescription>
          <FieldError id={`${inputId}-error`} error={error} />
        </div>
      );

    case "url":
    case "email":
    case "string":
    default:
      return (
        <div key={key} className="space-y-1.5">
          <FieldLabel
            htmlFor={inputId}
            label={label}
            isRequired={isRequired}
            saved={saved}
          />
          <Input
            id={inputId}
            type={
              field.type === "email"
                ? "email"
                : field.type === "url"
                  ? "url"
                  : "text"
            }
            placeholder={placeholder}
            value={String(currentValue)}
            onChange={(e) => onChange(e.target.value)}
            error={error}
            disabled={disabled}
            aria-describedby={describedBy}
          />
          <FieldDescription id={descriptionId} saved={saved}>
            {field.description}
          </FieldDescription>
        </div>
      );
  }
}

export function CredentialFormRenderer({
  credentials,
  values,
  onChange,
  configuredKeys = [],
  errors = {},
  disabled = false,
}: CredentialFormRendererProps) {
  if (!credentials) {
    return (
      <div className="rounded-[var(--vms-radius-control)] border border-dashed border-[var(--vms-line)] px-4 py-6 text-center text-sm text-[var(--vms-ink-muted)]">
        No configuration required for this integration.
      </div>
    );
  }

  const credentialEntries = Object.entries(credentials);
  const saved = new Set(configuredKeys);

  if (credentialEntries.length === 0) {
    return (
      <div className="rounded-[var(--vms-radius-control)] border border-dashed border-[var(--vms-line)] px-4 py-6 text-center text-sm text-[var(--vms-ink-muted)]">
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
          disabled,
          saved.has(key),
        ),
      )}
    </div>
  );
}
