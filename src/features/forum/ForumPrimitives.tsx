"use client";
import { formatDistanceToNow } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { parseApiError } from "@/lib/error-utils";
export const field =
  "min-h-11 w-full rounded-md border border-[var(--vms-line-strong)] bg-[var(--vms-surface)] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]";
export const surface =
  "rounded-lg border border-[var(--vms-line)] bg-[var(--vms-surface)]";
export function age(date: string) {
  const value = new Date(date);
  return Number.isNaN(value.getTime())
    ? ""
    : formatDistanceToNow(value, { addSuffix: true });
}
export function ErrorText({ error }: { error: unknown }) {
  return error ? (
    <p role="alert" className="text-sm text-[var(--vms-danger)]">
      {parseApiError(error).message}
    </p>
  ) : null;
}
export function Pagination({
  page,
  total,
  onChange,
}: {
  page: number;
  total: number;
  onChange: (n: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / 20));
  return (
    <nav
      aria-label="Forum pagination"
      className="flex items-center justify-between gap-3 border-t border-[var(--vms-line)] px-4 py-3 text-sm"
    >
      <span className="text-[var(--vms-ink-muted)]">
        Page {page} of {pages} · {total} {total === 1 ? "item" : "items"}
      </span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          aria-label="Next page"
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  );
}
