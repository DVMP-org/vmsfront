"use client";

import type { ReactNode } from "react";
import { CircleAlert, type LucideIcon } from "lucide-react";

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
  /** A small, decorative cue inside the control; the label remains persistent. */
  icon?: LucideIcon;
}

export function Field({
  id,
  label,
  children,
  description,
  error,
  required = false,
  className,
  icon: Icon,
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
            <span
              aria-hidden="true"
              className="ml-0.5 text-[var(--vms-danger)]"
            >
              *
            </span>
            <span className="sr-only"> (required)</span>
          </>
        ) : null}
      </label>
      <div
        className={cn(
          "relative",
          Icon && "[&_input]:pl-10 [&_select]:pl-10 [&_textarea]:pl-10",
        )}
      >
        {Icon ? (
          <Icon
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-3.5 z-[1] h-4 w-4 text-[var(--vms-ink-muted)]"
          />
        ) : null}
        {children({
          id,
          required,
          "aria-describedby": describedBy || undefined,
          "aria-errormessage": errorId,
          "aria-invalid": error ? true : undefined,
        })}
      </div>
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
          className="flex items-start gap-1.5 text-xs font-medium leading-[18px] text-[var(--vms-danger)]"
        >
          <CircleAlert
            aria-hidden="true"
            className="mt-0.5 h-3.5 w-3.5 shrink-0"
          />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}

export const fieldControlClassName =
  "min-h-11 w-full rounded-[var(--vms-radius-control)] border border-[var(--vms-line-strong)] bg-[var(--vms-surface)] px-3 py-2.5 text-base leading-5 text-[var(--vms-ink)] shadow-[0_1px_2px_rgb(0_0_0_/_0.025)] outline-none transition-[border-color,box-shadow,background-color] duration-[var(--vms-motion)] placeholder:text-[var(--vms-ink-muted)] enabled:hover:border-[var(--vms-ink-muted)] focus-visible:border-[var(--vms-ink)] focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)] focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:bg-[var(--vms-surface-subtle)] disabled:opacity-60 [&[readonly]]:bg-[var(--vms-surface-subtle)] aria-[invalid=true]:border-[var(--vms-danger)] aria-[invalid=true]:bg-[var(--vms-danger-subtle)] sm:text-sm";
