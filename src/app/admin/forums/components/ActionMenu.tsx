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

  const triggerStyles =
    size === "sm"
      ? "h-8 w-8"
      : "h-10 w-10";

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "inline-flex items-center justify-center rounded-xl border border-transparent bg-white/80 dark:bg-white/20 text-muted-foreground transition hover:border-border hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          triggerStyles,
          triggerClassName
        )}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div
          role="menu"
          className={cn(
            "absolute z-30 mt-2 w-52 rounded-2xl border border-border/60 bg-background/95 p-1.5 shadow-xl backdrop-blur",
            align === "left" ? "left-0" : "right-0"
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
                  option.onClick();
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm transition",
                  option.disabled
                    ? "cursor-not-allowed opacity-50"
                    : "hover:bg-muted/70",
                  option.tone === "destructive"
                    ? "text-destructive"
                    : "text-foreground"
                )}
              >
                {Icon && (
                  <span className="rounded-lg bg-muted px-2 py-1">
                    <Icon className="h-4 w-4" />
                  </span>
                )}
                <div className="flex-1">
                  <p className="font-medium leading-tight">{option.label}</p>
                  {option.badge && (
                    <span className="mt-0.5 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-600">
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
