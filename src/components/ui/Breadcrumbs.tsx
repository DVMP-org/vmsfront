import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumbs({
  items,
  className,
}: {
  items: BreadcrumbItem[];
  className?: string;
}) {
  if (!items.length) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn("min-w-0", className)}>
      <ol className="flex min-w-0 items-center gap-1.5 text-xs text-[var(--vms-ink-muted)]">
        {items.map((item, index) => {
          const current = index === items.length - 1;
          const compactHidden =
            index > 0 && index < items.length - 2
              ? "hidden sm:inline-flex"
              : "inline-flex";
          return (
            <li
              key={`${item.label}:${index}`}
              className={cn("min-w-0 items-center gap-1.5", compactHidden)}
            >
              {index > 0 ? (
                <ChevronRight className="h-3 w-3 shrink-0" aria-hidden="true" />
              ) : null}
              {item.href && !current ? (
                <Link
                  href={item.href}
                  className="truncate rounded-sm hover:text-[var(--vms-ink)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={cn(
                    "truncate",
                    current && "font-medium text-[var(--vms-ink)]",
                  )}
                  aria-current={current ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
        {items.length > 3 ? (
          <li className="hidden text-[var(--vms-ink-muted)] sm:list-item">
            <span aria-hidden="true">…</span>
          </li>
        ) : null}
      </ol>
    </nav>
  );
}
