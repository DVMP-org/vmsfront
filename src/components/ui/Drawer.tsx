"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { useDialogFocus } from "./useDialogFocus";
import styles from "./DrawerMotion.module.css";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  /** Edge the panel slides in from. Navigation drawers use "left". */
  side?: "left" | "right";
}

export function Drawer({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
  contentClassName,
  side = "right",
}: DrawerProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const generatedId = React.useId();
  const titleId = `drawer-title-${generatedId.replace(/:/g, "")}`;
  const descriptionId = `drawer-description-${generatedId.replace(/:/g, "")}`;
  useDialogFocus(
    isOpen,
    onClose,
    panelRef,
    "input:not([disabled]), select:not([disabled]), textarea:not([disabled])",
  );

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-50 flex overflow-hidden",
        side === "left" ? "justify-start" : "justify-end",
      )}
    >
      <div
        className={cn("absolute inset-0 bg-black/40", styles.backdrop)}
        onClick={onClose}
        aria-hidden="true"
      />
      <section
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        data-side={side}
        className={cn(
          side === "left" ? styles.panelLeft : styles.panel,
          "relative flex h-full w-full max-w-xl flex-col overflow-hidden bg-[var(--vms-surface)] text-[var(--vms-ink)] shadow-[var(--vms-shadow-overlay)]",
          side === "left" ? "border-r" : "border-l",
          "border-[var(--vms-line)]",
          className,
        )}
      >
        <header className="flex min-h-16 items-start justify-between gap-3 border-b border-[var(--vms-line)] px-4 py-4 sm:px-5">
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-semibold leading-6">
              {title}
            </h2>
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
            aria-label="Close drawer"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-[var(--vms-radius-control)] text-[var(--vms-ink-muted)] hover:bg-[var(--vms-surface-subtle)] hover:text-[var(--vms-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </header>
        <div
          className={cn(
            "min-h-0 flex-1 overflow-y-auto p-4 sm:p-5",
            contentClassName,
          )}
        >
          {children}
        </div>
      </section>
    </div>,
    document.body,
  );
}
