"use client";

import { useEffect, useRef, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ActionMenuOption {
  label: string;
  onClick: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  tone?: "default" | "destructive";
  disabled?: boolean;
  badge?: string;
}

interface ActionMenuProps {
  options: ActionMenuOption[];
  ariaLabel?: string;
  align?: "left" | "right";
  triggerClassName?: string;
  size?: "sm" | "md";
}

export function ActionMenu({
  options,
  ariaLabel = "Open actions menu",
  align = "right",
  triggerClassName,
  size = "md",
}: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const firstItem = menuRef.current?.querySelector<HTMLButtonElement>(
      '[role="menuitem"]:not(:disabled)',
    );
    firstItem?.focus();
  }, [open]);

  const triggerStyles = size === "sm" ? "h-8 w-8" : "h-10 w-10";

  return (
    <div className="relative" ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={(event) => {
          if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
          event.preventDefault();
          setOpen(true);
        }}
        className={cn(
          "inline-flex items-center justify-center rounded-[var(--vms-radius-control)] border border-transparent bg-transparent text-[var(--vms-ink-muted)] transition hover:border-[var(--vms-line)] hover:bg-[var(--vms-surface-subtle)] hover:text-[var(--vms-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          triggerStyles,
          triggerClassName,
        )}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label={ariaLabel}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              setOpen(false);
              triggerRef.current?.focus();
              return;
            }
            if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
            const items = Array.from(
              menuRef.current?.querySelectorAll<HTMLButtonElement>(
                '[role="menuitem"]:not(:disabled)',
              ) ?? [],
            );
            const current = items.indexOf(
              document.activeElement as HTMLButtonElement,
            );
            const direction = event.key === "ArrowDown" ? 1 : -1;
            const next = (current + direction + items.length) % items.length;
            event.preventDefault();
            items[next]?.focus();
          }}
          className={cn(
            "absolute z-30 mt-2 w-56 rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-1.5 shadow-[var(--vms-shadow-overlay)]",
            align === "left" ? "left-0" : "right-0",
          )}
        >
          {options.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.label}
                type="button"
                role="menuitem"
                disabled={option.disabled}
                onClick={() => {
                  setOpen(false);
                  triggerRef.current?.focus();
                  option.onClick();
                }}
                className={cn(
                  "flex min-h-10 w-full items-center gap-2 rounded-[var(--vms-radius-control)] px-2.5 py-2 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]",
                  option.disabled
                    ? "cursor-not-allowed opacity-50"
                    : "hover:bg-[var(--vms-surface-subtle)]",
                  option.tone === "destructive"
                    ? "text-[var(--vms-danger)]"
                    : "text-[var(--vms-ink)]",
                )}
              >
                {Icon && (
                  <span className="rounded-[var(--vms-radius-control)] bg-[var(--vms-surface-subtle)] p-1.5">
                    <Icon className="h-4 w-4" />
                  </span>
                )}
                <div className="flex-1">
                  <p className="font-medium leading-tight">{option.label}</p>
                  {option.badge && (
                    <span className="mt-0.5 inline-flex items-center rounded-full bg-[var(--vms-warning-subtle)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--vms-warning)]">
                      {option.badge}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
