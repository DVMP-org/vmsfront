"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { useDialogFocus } from "./useDialogFocus";
import styles from "./DrawerMotion.module.css";

export interface SlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  className?: string;
  ariaLabel?: string;
  /** Sticky action bar pinned below the scrolling body. */
  footer?: React.ReactNode;
  bodyClassName?: string;
}

const sizes: Record<NonNullable<SlideOverProps["size"]>, string> = {
  sm: "sm:max-w-md",
  md: "sm:max-w-xl",
  lg: "sm:max-w-3xl",
  xl: "sm:max-w-5xl",
  full: "sm:max-w-full",
};

export function SlideOver({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = "md",
  className,
  ariaLabel = "Panel",
  footer,
  bodyClassName,
}: SlideOverProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const generatedId = React.useId();
  const titleId = `drawer-title-${generatedId.replace(/:/g, "")}`;
  const descriptionId = `drawer-description-${generatedId.replace(/:/g, "")}`;
  useDialogFocus(isOpen, onClose, panelRef);

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end overflow-hidden">
      <div
        className={cn("absolute inset-0 bg-black/40", styles.backdrop)}
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
          styles.panel,
          "relative flex h-full w-full flex-col border-l border-[var(--vms-line)] bg-[var(--vms-surface)] text-[var(--vms-ink)] shadow-[var(--vms-shadow-overlay)]",
          sizes[size],
          className,
        )}
      >
        <header className="flex min-h-16 items-start justify-between gap-3 border-b border-[var(--vms-line)] px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6">
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
            aria-label="Close panel"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-[var(--vms-radius-control)] text-[var(--vms-ink-muted)] transition-colors duration-[var(--vms-motion)] hover:bg-[var(--vms-surface-subtle)] hover:text-[var(--vms-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </header>
        <div
          className={cn(
            "flex-1 overflow-y-auto px-4 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-6",
            footer && "pb-5",
            bodyClassName,
          )}
        >
          {children}
        </div>
        {footer ? (
          <footer className="shrink-0 border-t border-[var(--vms-line)] bg-[var(--vms-surface)] px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
            {footer}
          </footer>
        ) : null}
      </section>
    </div>,
    document.body,
  );
}
