"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  description?: React.ReactNode;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, className, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || `checkbox-${generatedId.replace(/:/g, "")}`;
    const descriptionId = `${inputId}-description`;

    return (
      <div className="text-sm text-[var(--vms-ink)]">
        <label
          htmlFor={inputId}
          className="flex min-h-11 cursor-pointer touch-manipulation items-center gap-3 py-2"
        >
          <input
            id={inputId}
            type="checkbox"
            ref={ref}
            aria-describedby={description ? descriptionId : undefined}
            className={cn(
              "h-4 w-4 shrink-0 cursor-pointer accent-[var(--vms-action)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)] focus-visible:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-50",
              className,
            )}
            {...props}
          />
          {label && <span className="font-medium leading-5">{label}</span>}
        </label>
        {description && (
          <p
            id={descriptionId}
            className="ml-7 -mt-1 pb-2 text-xs leading-5 text-[var(--vms-ink-muted)]"
          >
            {description}
          </p>
        )}
      </div>
    );
  },
);

Checkbox.displayName = "Checkbox";
