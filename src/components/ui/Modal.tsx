"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { useDialogFocus } from "./useDialogFocus";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  ariaLabel?: string;
}

const sizes: Record<NonNullable<ModalProps["size"]>, string> = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-3xl",
  xl: "max-w-5xl",
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = "md",
  className,
  ariaLabel = "Dialog",
}: ModalProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const generatedId = React.useId();
  const titleId = `dialog-title-${generatedId.replace(/:/g, "")}`;
  const descriptionId = `dialog-description-${generatedId.replace(/:/g, "")}`;
  useDialogFocus(isOpen, onClose, panelRef);

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-[max(0.5rem,env(safe-area-inset-top))] sm:items-center sm:px-4 sm:py-6">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <section
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : ariaLabel}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn(
          "relative flex max-h-[min(94dvh,58rem)] w-full flex-col overflow-hidden rounded-t-[var(--vms-radius-overlay)] border border-[var(--vms-line)] bg-[var(--vms-surface)] text-[var(--vms-ink)] shadow-[var(--vms-shadow-overlay)] sm:rounded-[var(--vms-radius-overlay)]",
          sizes[size],
          className,
        )}
      >
        <header className="flex min-h-14 items-start justify-between gap-3 border-b border-[var(--vms-line)] px-4 py-3 sm:px-5">
          <div className="min-w-0">
            {title ? (
              <h2 id={titleId} className="text-lg font-semibold leading-6">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p
                id={descriptionId}
                className="mt-1 text-sm leading-5 text-[var(--vms-ink-muted)]"
              >
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-[var(--vms-radius-control)] text-[var(--vms-ink-muted)] transition-colors duration-[var(--vms-motion)] hover:bg-[var(--vms-surface-subtle)] hover:text-[var(--vms-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </header>
        <div className="overflow-y-auto p-4 sm:p-5">{children}</div>
      </section>
    </div>,
    document.body,
  );
}
