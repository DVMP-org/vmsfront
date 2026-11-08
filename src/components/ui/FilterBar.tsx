import type { ReactNode } from "react";
import { SlidersHorizontal, X } from "lucide-react";

import { Button } from "./Button";
import { cn } from "@/lib/utils";

export function FilterBar({
  children,
  activeCount = 0,
  onClear,
  label = "Collection filters",
  className,
}: {
  children: ReactNode;
  activeCount?: number;
  onClear?: () => void;
  label?: string;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-2",
        className,
      )}
    >
      <span className="hidden items-center gap-1.5 px-1 text-xs font-medium text-[var(--vms-ink-muted)] sm:inline-flex">
        <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
        Filters
        {activeCount ? (
          <span className="rounded-full bg-[var(--vms-ink)] px-1.5 text-[10px] text-[var(--vms-on-action)]">
            {activeCount}
          </span>
        ) : null}
      </span>
      <div className="contents">{children}</div>
      {activeCount && onClear ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="ml-auto h-8 gap-1 px-2 text-xs"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
          Clear
        </Button>
      ) : null}
    </div>
  );
}
