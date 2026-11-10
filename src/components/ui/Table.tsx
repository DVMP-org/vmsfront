import React from "react";
import { cn } from "@/lib/utils";

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  containerClassName?: string;
  /** Accessible name for the keyboard-operable horizontal comparison region. */
  scrollLabel?: string;
  /** Show a persistent scroll cue when a wide table cannot become a summary. */
  scrollHint?: string;
}

export function Table({
  className,
  containerClassName,
  scrollLabel = "Data table",
  scrollHint,
  ...props
}: TableProps) {
  return (
    <div
      className={cn(
        "relative w-full overflow-x-auto overflow-y-visible rounded-lg border border-border -mx-1 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 xs:mx-0",
        containerClassName,
      )}
      role="region"
      aria-label={scrollLabel}
      tabIndex={0}
    >
      {scrollHint ? (
        <p className="border-b border-border bg-muted/40 px-3 py-2 text-left text-xs text-muted-foreground md:hidden">
          {scrollHint}
        </p>
      ) : null}
      <div className="inline-block min-w-full align-middle">
        <table
          className={cn(
            "w-full caption-bottom text-[13px] leading-5",
            "border-collapse",
            className,
          )}
          {...props}
        />
      </div>
    </div>
  );
}

export function TableHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn(
        "border-b border-border bg-muted/50",
        "[&_tr]:border-b",
        className,
      )}
      {...props}
    />
  );
}

export function TableBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />
  );
}

export function TableRow({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        "border-b border-border transition-colors",
        "hover:bg-muted/70",
        "data-[state=selected]:bg-muted",
        "group",
        className,
      )}
      {...props}
    />
  );
}

export function TableHead({
  className,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "h-11 px-2 xs:px-3 sm:px-4 text-left align-middle font-semibold",
        "text-foreground text-xs tracking-normal",
        "bg-muted/50 whitespace-nowrap",
        "[&:has([role=checkbox])]:pr-0",
        "[&:has([role=checkbox])]:w-10 xs:w-12",
        className,
      )}
      {...props}
    />
  );
}

export function TableCell({
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn(
        "px-2 xs:px-3 sm:px-4 py-2 xs:py-3 align-middle",
        "text-[13px] leading-5 text-[var(--vms-ink)]",
        "[&:has([role=checkbox])]:pr-0",
        "[&:has([role=checkbox])]:w-10 xs:w-12",
        "group-hover:text-foreground transition-colors",
        className,
      )}
      {...props}
    />
  );
}

export function TableCaption({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableCaptionElement>) {
  return (
    <caption
      className={cn("mt-4 text-xs xs:text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export function TableFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tfoot
      className={cn(
        "border-t border-border bg-muted/50 font-medium",
        "[&_tr:last-child]:border-0",
        className,
      )}
      {...props}
    />
  );
}
