"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface FieldControlProps {
  id: string;
  required: boolean;
  "aria-describedby"?: string;
  "aria-errormessage"?: string;
  "aria-invalid"?: true;
}

interface FieldProps {
  id: string;
  label: string;
  children: (control: FieldControlProps) => ReactNode;
  description?: string;
  error?: string;
  required?: boolean;
  className?: string;
}

export function Field({
  id,
  label,
  children,
  description,
  error,
  required = false,
  className,
}: FieldProps) {
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(" ");

  return (
    <div className={cn("space-y-2", className)}>
      <label
        htmlFor={id}
        className="block text-[13px] font-semibold leading-[18px] text-[var(--vms-ink)]"
      >
        {label}
        {required ? (
          <>
            <span aria-hidden="true" className="ml-0.5 text-[var(--vms-danger)]">
              *
            </span>
            <span className="sr-only"> (required)</span>
          </>
        ) : null}
      </label>
      {children({
        id,
        required,
        "aria-describedby": describedBy || undefined,
        "aria-errormessage": errorId,
        "aria-invalid": error ? true : undefined,
      })}
      {description ? (
        <p
          id={descriptionId}
          className="text-xs leading-[18px] text-[var(--vms-ink-muted)]"
        >
          {description}
        </p>
      ) : null}
      {error ? (
        <p
          id={errorId}
          className="text-xs font-semibold leading-[18px] text-[var(--vms-danger)]"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

export const fieldControlClassName =
  "min-h-11 w-full rounded-[var(--vms-radius-control)] border border-[var(--vms-line-strong)] bg-[var(--vms-surface)] px-3 py-2 text-base text-[var(--vms-ink)] outline-none transition-[border-color,box-shadow] duration-[var(--vms-motion)] placeholder:text-[var(--vms-ink-muted)] focus-visible:border-[var(--vms-ink-muted)] focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)] focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:bg-[var(--vms-surface-subtle)] disabled:opacity-60 aria-[invalid=true]:border-[var(--vms-danger)] aria-[invalid=true]:bg-[var(--vms-danger-subtle)] sm:text-sm";
