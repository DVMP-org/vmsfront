"use client";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface PaginationBarProps {
  page: number;
  pageSize?: number;
  total?: number;
  totalPages: number;
  hasNext?: boolean;
  hasPrevious?: boolean;
  resourceLabel?: string;
  onChange: (nextPage: number) => void;
  isFetching?: boolean;
  className?: string;
}

export function PaginationBar({
  page,
  pageSize,
  total,
  totalPages,
  hasNext,
  hasPrevious,
  resourceLabel = "records",
  onChange,
  isFetching = false,
  className,
}: PaginationBarProps) {
  const safeTotal = Math.max(total ?? 0, 0);
  const safePageSize = Math.max(pageSize ?? 0, 0);
  const showingFrom =
    safeTotal === 0 || safePageSize === 0 ? 0 : (page - 1) * safePageSize + 1;
  const showingTo =
    safePageSize === 0 ? safeTotal : Math.min(page * safePageSize, safeTotal);
  const canGoPrevious = hasPrevious ?? page > 1;
  const canGoNext = hasNext ?? page < totalPages;

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-2xl border border-dashed border-border/60 bg-muted/60 px-4 py-3 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between",
        className
      )}
    >
      <div className="text-xs uppercase tracking-wide">
        Showing{" "}
        <span className="font-semibold text-foreground">
          {safeTotal === 0 || safePageSize === 0 ? 0 : showingFrom}-{showingTo}
        </span>{" "}
        of{" "}
        <span className="font-semibold text-foreground">{safeTotal}</span>{" "}
        {resourceLabel}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(1)}
          disabled={!canGoPrevious || isFetching}
        >
          First
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={!canGoPrevious || isFetching}
        >
          Previous
        </Button>
        <span className="text-xs font-medium text-foreground">
          Page {page} of {Math.max(totalPages, 1)}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(page + 1)}
          disabled={!canGoNext || isFetching}
        >
          Next
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(totalPages || 1)}
          disabled={!canGoNext || totalPages === 0 || isFetching}
        >
          Last
        </Button>
      </div>
    </div>
  );
}
