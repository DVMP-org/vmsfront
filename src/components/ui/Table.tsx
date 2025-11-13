import React from "react";
import { cn } from "@/lib/utils";

export function Table({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="relative w-full overflow-x-auto overflow-y-visible rounded-lg border border-border -mx-1 xs:mx-0">
      <div className="inline-block min-w-full align-middle">
        <table
          className={cn(
            "w-full caption-bottom text-sm",
            "border-collapse",
            className
          )}
          {...props}
        />
      </div>
    </div>
  );
}

export function TableHeader({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead 
      className={cn(
        "border-b border-border bg-muted/50",
        "[&_tr]:border-b",
        className
      )} 
      {...props} 
    />
  );
}

export function TableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody 
      className={cn(
        "[&_tr:last-child]:border-0",
        "[&_tr:nth-child(even)]:bg-muted/30",
        className
      )} 
      {...props} 
    />
  );
}

export function TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        "border-b border-border transition-colors",
        "hover:bg-muted/70",
        "data-[state=selected]:bg-muted",
        "group",
        className
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
        "h-10 xs:h-12 px-2 xs:px-3 sm:px-4 text-left align-middle font-semibold",
        "text-muted-foreground text-xs xs:text-xs uppercase tracking-wider",
        "bg-muted/50 whitespace-nowrap",
        "[&:has([role=checkbox])]:pr-0",
        "[&:has([role=checkbox])]:w-10 xs:w-12",
        className
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
        "text-xs xs:text-sm",
        "[&:has([role=checkbox])]:pr-0",
        "[&:has([role=checkbox])]:w-10 xs:w-12",
        "group-hover:text-foreground transition-colors",
        className
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
      className={cn(
        "mt-4 text-xs xs:text-sm text-muted-foreground",
        className
      )}
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
        className
      )}
      {...props}
    />
  );
}
