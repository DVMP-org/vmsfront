"use client";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from "lucide-react";

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
    safeTotal === 0 || safePageSize === 0
      ? 0
      : Math.min((page - 1) * safePageSize + 1, safeTotal);
  const showingTo =
    safePageSize === 0 ? safeTotal : Math.min(page * safePageSize, safeTotal);
  const canGoPrevious = hasPrevious ?? page > 1;
  const canGoNext = hasNext ?? page < totalPages;

  return (
    <nav
      aria-label={`${resourceLabel} pagination`}
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between",
        className
      )}
    >
      <div className="text-xs tabular-nums" aria-live="polite">
        Showing{" "}
        <span className="font-semibold text-foreground">
          {safeTotal === 0 ? 0 : showingFrom}-{showingTo}
        </span>{" "}
        of{" "}
        <span className="font-semibold text-foreground">{safeTotal}</span>{" "}
        {resourceLabel}
      </div>
      <div className="flex items-center justify-between gap-1.5 sm:justify-end sm:gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(1)}
          disabled={!canGoPrevious || isFetching}
          className="hidden min-h-11 sm:inline-flex"
          aria-label="First page"
        >
          <ChevronsLeftIcon className="h-4 w-4" />
          <span className="hidden lg:inline">First</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={!canGoPrevious || isFetching}
          className="min-h-11"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Previous</span>
        </Button>
        <span className="px-1 text-xs font-medium tabular-nums text-foreground">
          Page {page} of {Math.max(totalPages, 1)}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(page + 1)}
          disabled={!canGoNext || isFetching}
          className="min-h-11"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
          <span className="hidden sm:inline">Next</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(totalPages || 1)}
          disabled={!canGoNext || totalPages === 0 || isFetching}
          className="hidden min-h-11 sm:inline-flex"
          aria-label="Last page"
        >
          <ChevronsRightIcon className="h-4 w-4" />
          <span className="hidden lg:inline">Last</span>
        </Button>
      </div>
    </nav>
  );
}
