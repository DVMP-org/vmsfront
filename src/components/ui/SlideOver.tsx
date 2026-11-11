"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import type { LucideIcon } from "lucide-react";
import { OverlayHeader } from "./OverlayHeader";
import { useOverlayPresence } from "./useOverlayPresence";

import { cn } from "@/lib/utils";
import { useDialogFocus } from "./useDialogFocus";
import styles from "./DrawerMotion.module.css";

export interface SlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full" | "custom";
  className?: string;
  ariaLabel?: string;
  /** Sticky action bar pinned below the scrolling body. */
  footer?: React.ReactNode;
  bodyClassName?: string;
  side?: "left" | "right";
  icon?: LucideIcon;
  eyebrow?: string;
  closeLabel?: string;
  initialFocusSelector?: string;
}

const sizes: Record<NonNullable<SlideOverProps["size"]>, string> = {
  sm: "sm:max-w-md",
  md: "sm:max-w-xl",
  lg: "sm:max-w-3xl",
  xl: "sm:max-w-5xl",
  full: "sm:max-w-full",
  custom: "",
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
  side = "right",
  icon,
  eyebrow,
  closeLabel = "Close panel",
  initialFocusSelector,
}: SlideOverProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const generatedId = React.useId();
  const titleId = `drawer-title-${generatedId.replace(/:/g, "")}`;
  const descriptionId = `drawer-description-${generatedId.replace(/:/g, "")}`;
  const { present, state } = useOverlayPresence(isOpen);
  useDialogFocus(present, onClose, panelRef, initialFocusSelector);

  if (!present || typeof document === "undefined") return null;

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-50 flex overflow-hidden",
        side === "left" ? "justify-start" : "justify-end",
      )}
      data-overlay-root=""
    >
      <div
        className={cn("absolute inset-0 bg-black/30", styles.backdrop)}
        data-state={state}
        onClick={isOpen ? onClose : undefined}
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
        data-state={state}
        data-side={side}
        className={cn(
          side === "left" ? styles.panelLeft : styles.panel,
          "relative flex h-[100dvh] w-full flex-col overflow-hidden border-[var(--vms-line)] bg-[var(--vms-surface)] text-[var(--vms-ink)] shadow-[var(--vms-shadow-overlay)]",
          side === "left" ? "border-r" : "border-l",
          sizes[size],
          className,
        )}
      >
        <OverlayHeader
          title={title}
          titleId={titleId}
          description={description}
          descriptionId={descriptionId}
          icon={icon}
          eyebrow={eyebrow}
          onClose={onClose}
          closeLabel={closeLabel}
        />
        <div
          className={cn(
            "min-h-0 flex-1 overscroll-contain overflow-y-auto px-4 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-6",
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
