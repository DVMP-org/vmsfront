"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import type { LucideIcon } from "lucide-react";
import { OverlayHeader } from "./OverlayHeader";
import { useOverlayPresence } from "./useOverlayPresence";
import styles from "./DrawerMotion.module.css";

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
  icon?: LucideIcon;
  footer?: React.ReactNode;
  bodyClassName?: string;
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
  icon,
  footer,
  bodyClassName,
}: ModalProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const generatedId = React.useId();
  const titleId = `dialog-title-${generatedId.replace(/:/g, "")}`;
  const descriptionId = `dialog-description-${generatedId.replace(/:/g, "")}`;
  const { present, state } = useOverlayPresence(isOpen);
  useDialogFocus(present, onClose, panelRef);

  if (!present || typeof document === "undefined") return null;

  return createPortal(
    <div
      data-overlay-root=""
      className="fixed inset-0 z-50 flex items-end justify-center px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-[max(0.5rem,env(safe-area-inset-top))] sm:items-center sm:px-4 sm:py-6"
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
        className={cn(
          styles.modal,
          "relative flex max-h-[min(94dvh,58rem)] w-full flex-col overflow-hidden rounded-t-[var(--vms-radius-overlay)] border border-[var(--vms-line)] bg-[var(--vms-surface)] text-[var(--vms-ink)] shadow-[var(--vms-shadow-overlay)] sm:rounded-[var(--vms-radius-overlay)]",
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
          onClose={onClose}
          closeLabel="Close dialog"
        />
        <div
          className={cn(
            "min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6",
            bodyClassName,
          )}
        >
          {children}
        </div>
        {footer ? (
          <footer className="shrink-0 border-t border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
            {footer}
          </footer>
        ) : null}
      </section>
    </div>,
    document.body,
  );
}
