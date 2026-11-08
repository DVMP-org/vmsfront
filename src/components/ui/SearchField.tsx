"use client";

import { useRef } from "react";
import { Search, X } from "lucide-react";

import { cn } from "@/lib/utils";

export function SearchField({
  value,
  onValueChange,
  label = "Search",
  placeholder = "Search",
  className,
  inputClassName,
  shortcut,
  autoFocus,
}: {
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  shortcut?: string;
  autoFocus?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <label
      className={cn(
        "relative flex h-9 min-w-0 items-center rounded-[var(--vms-radius-control)] border border-[var(--vms-line-strong)] bg-[var(--vms-surface)] text-[var(--vms-ink)] transition-[border-color,box-shadow] focus-within:border-[var(--vms-ink-muted)] focus-within:ring-2 focus-within:ring-[var(--vms-focus)] focus-within:ring-offset-1",
        className,
      )}
    >
      <span className="sr-only">{label}</span>
      <Search
        className="pointer-events-none ml-3 h-4 w-4 shrink-0 text-[var(--vms-ink-muted)]"
        aria-hidden="true"
      />
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={cn(
          "h-full min-w-0 flex-1 border-0 bg-transparent px-2.5 text-base outline-none placeholder:text-[var(--vms-ink-muted)] sm:text-sm [&::-webkit-search-cancel-button]:hidden",
          inputClassName,
        )}
      />
      {value ? (
        <button
          type="button"
          onClick={() => {
            onValueChange("");
            inputRef.current?.focus();
          }}
          className="mr-1 grid h-7 w-7 place-items-center rounded text-[var(--vms-ink-muted)] hover:bg-[var(--vms-surface-subtle)] hover:text-[var(--vms-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]"
          aria-label={`Clear ${label.toLowerCase()}`}
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      ) : shortcut ? (
        <kbd className="mr-2 hidden rounded border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] px-1.5 py-0.5 font-sans text-[10px] text-[var(--vms-ink-muted)] sm:inline">
          {shortcut}
        </kbd>
      ) : null}
    </label>
  );
}
