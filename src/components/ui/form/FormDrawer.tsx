"use client";

import * as React from "react";
import { AlertCircle } from "lucide-react";

import { Button } from "../Button";
import { SlideOver } from "../SlideOver";
import { cn } from "@/lib/utils";

export interface FormDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    /** Panel heading. Keep it to the action, e.g. "Create invitation". */
    title: string;
    /** One line of context shown under the heading. */
    description?: string;
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
    submitLabel: string;
    isSubmitting?: boolean;
    /** Blocks submit while keeping the footer stable, e.g. missing context. */
    canSubmit?: boolean;
    /** Extra muted note in the footer, usually validation or record context. */
    footerNote?: React.ReactNode;
    /** Replaces the default Cancel button, e.g. a destructive secondary action. */
    secondaryAction?: React.ReactNode;
    error?: string | null;
    children: React.ReactNode;
    size?: "sm" | "md" | "lg" | "xl";
    className?: string;
}

/**
 * Form shell for side panels.
 *
 * Mirrors the pattern used across the operations product: a right-hand panel
 * with a titled header, sectioned body, inline error banner and a sticky action
 * footer. Forms belong in a drawer rather than a centred dialog so the record
 * the user is editing stays visible beside it.
 */
export function FormDrawer({
    isOpen,
    onClose,
    title,
    description,
    onSubmit,
    submitLabel,
    isSubmitting = false,
    canSubmit = true,
    footerNote,
    secondaryAction,
    error,
    children,
    size = "md",
    className,
}: FormDrawerProps) {
    const formId = React.useId().replace(/:/g, "");

    return (
        <SlideOver
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            description={description}
            size={size}
            className={className}
            dismissible={!isSubmitting}
            busy={isSubmitting}
            initialFocusSelector="input:not([disabled]), select:not([disabled]), textarea:not([disabled])"
            footer={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    {footerNote ? (
                        <p className="hidden min-w-0 flex-1 text-xs leading-5 text-[var(--vms-ink-muted)] sm:block">
                            {footerNote}
                        </p>
                    ) : (
                        <span className="hidden flex-1 sm:block" />
                    )}
                    <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
                        {secondaryAction}
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            form={formId}
                            isLoading={isSubmitting}
                            disabled={!canSubmit}
                        >
                            {submitLabel}
                        </Button>
                    </div>
                </div>
            }
        >
            <form
                id={formId}
                onSubmit={onSubmit}
                className="space-y-6"
                noValidate
            >
                {error ? (
                    <div
                        role="alert"
                        className="flex items-start gap-2.5 rounded-[var(--vms-radius-control)] border border-[var(--vms-danger)] bg-[var(--vms-danger-subtle)] px-3 py-2.5 text-sm text-[var(--vms-danger)]"
                    >
                        <AlertCircle aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
                        <p className="min-w-0 flex-1">{error}</p>
                    </div>
                ) : null}
                {children}
            </form>
        </SlideOver>
    );
}

/** Shared hint row used under drawers' section headings. */
export function FormHint({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <p
            className={cn(
                "text-xs leading-5 text-[var(--vms-ink-muted)]",
                className,
            )}
        >
            {children}
        </p>
    );
}

/** Compact record strip shown at the top of a form drawer. */
export function FormRecordSummary({
    title,
    meta,
    trailing,
}: {
    title: React.ReactNode;
    meta?: React.ReactNode;
    trailing?: React.ReactNode;
}) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] px-3 py-2.5">
            <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-[var(--vms-ink)]">
                    {title}
                </p>
                {meta ? (
                    <p className="truncate text-xs text-[var(--vms-ink-muted)]">{meta}</p>
                ) : null}
            </div>
            {trailing}
        </div>
    );
}
