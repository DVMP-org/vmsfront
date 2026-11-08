"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

interface FormErrorSummaryProps {
  errors: Record<string, string>;
  title?: string;
  className?: string;
}

export function FormErrorSummary({
  errors,
  title = "Check the highlighted fields",
  className,
}: FormErrorSummaryProps) {
  const summaryRef = useRef<HTMLDivElement>(null);
  const errorEntries = Object.entries(errors);
  const firstField = errorEntries[0]?.[0];

  useEffect(() => {
    if (!firstField) return;
    summaryRef.current?.focus();
    summaryRef.current?.scrollIntoView?.({ block: "nearest" });
  }, [firstField]);

  if (!errorEntries.length) return null;

  return (
    <div
      ref={summaryRef}
      role="alert"
      tabIndex={-1}
      className={cn(
        "rounded-[var(--vms-radius-surface)] border border-[var(--vms-danger)] bg-[var(--vms-danger-subtle)] p-4 text-[var(--vms-danger)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]",
        className,
      )}
    >
      <p className="text-sm font-semibold">{title}</p>
      <ul className="mt-2 space-y-1 text-sm">
        {errorEntries.map(([field, message]) => (
          <li key={field}>
            <a
              href={`#${field}`}
              className="font-medium underline underline-offset-2"
              onClick={(event) => {
                event.preventDefault();
                const control = document.getElementById(field);
                control?.focus();
                control?.scrollIntoView?.({ block: "center" });
              }}
            >
              {message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
