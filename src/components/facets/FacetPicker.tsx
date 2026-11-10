"use client";
import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { useQuery } from "@tanstack/react-query";
import { parseApiError } from "@/lib/error-utils";
import { loadFacets, FacetItem } from "./client";
export type { FacetItem } from "./client";
export function FacetPicker({
  facet,
  kind,
  placeId,
  label,
  value,
  onChange,
  contextKey,
  excludeIds = [],
  id,
  description,
  error,
}: {
  facet: "parties" | "places";
  kind?: string;
    /** Restricts party results to Parties with an active relationship to this Place. */
    placeId?: string;
  label: string;
  value: FacetItem | null;
  onChange: (item: FacetItem | null) => void;
  contextKey: string;
  excludeIds?: string[];
  id?: string;
  description?: string;
  error?: string;
}) {
  const generatedId = useId();
  const inputId = id || `facet-${facet}-${generatedId.replace(/:/g, "")}`;
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ["facets", contextKey, facet, kind, placeId, search, cursor],
    queryFn: ({ signal }) =>
      loadFacets(facet, {
        filters: {
          ...(kind ? { kind: kind as "person" | "organization" } : {}),
          ...(facet === "parties" && placeId ? { place_id: placeId } : {}),
          is_active: true,
        },
        search,
        cursor,
        signal,
      }),
    enabled: open,
    staleTime: 0,
  });
  const selected = useQuery({
    queryKey: ["facets", contextKey, facet, kind, "selected", value?.value],
    queryFn: ({ signal }) =>
      loadFacets(facet, {
        filters: {
          ...(kind ? { kind: kind as "person" | "organization" } : {}),
          is_active: true,
        },
        ids: [value!.value],
        signal,
      }),
    enabled: !!value,
    staleTime: 0,
  });
  useEffect(() => {
    if (
      value &&
      selected.isSuccess &&
      !selected.data.items.some(
        (item) => item.value === value.value && !item.disabled,
      )
    )
      onChange(null);
  }, [value, selected.isSuccess, selected.data, onChange]);
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        setOpen(false);
        containerRef.current
          ?.querySelector<HTMLButtonElement>("[data-facet-trigger]")
          ?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);
  const descriptionId = description ? `${inputId}-description` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const selectedLabel =
    selected.data?.items.find((item) => item.value === value?.value)?.label ||
    value?.label;
  return (
    <div ref={containerRef} className="relative min-w-0 space-y-1.5">
      <label
        id={`${inputId}-label`}
        htmlFor={inputId}
        className="block text-[13px] font-semibold leading-[18px] text-[var(--vms-ink)]"
      >
        {label}
      </label>
      {description && (
        <p
          id={descriptionId}
          className="text-xs leading-5 text-[var(--vms-ink-muted)]"
        >
          {description}
        </p>
      )}
      <div className="flex min-h-11 items-center rounded-[var(--vms-radius-control)] border border-[var(--vms-line-strong)] bg-[var(--vms-surface)] focus-within:ring-2 focus-within:ring-[var(--vms-focus)]">
        <button
          id={inputId}
          data-facet-trigger
          type="button"
          aria-labelledby={`${inputId}-label ${inputId}-value`}
          aria-describedby={
            [descriptionId, errorId].filter(Boolean).join(" ") || undefined
          }
          aria-invalid={error ? true : undefined}
          aria-expanded={open}
          aria-controls={`${inputId}-options`}
          onClick={() => setOpen((current) => !current)}
          className="flex min-h-11 min-w-0 flex-1 items-center justify-between gap-2 px-3 text-left text-sm focus-visible:outline-none"
        >
          <span
            id={`${inputId}-value`}
            className={`truncate ${value ? "text-[var(--vms-ink)]" : "text-[var(--vms-ink-muted)]"}`}
          >
            {selectedLabel || `Select ${label.toLowerCase()}`}
          </span>
          <ChevronDown
            className="h-4 w-4 shrink-0 text-[var(--vms-ink-muted)]"
            aria-hidden="true"
          />
        </button>
        {value && (
          <button
            type="button"
            aria-label={`Clear ${label}`}
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
            className="grid h-11 w-11 shrink-0 place-items-center text-[var(--vms-ink-muted)] hover:text-[var(--vms-ink)]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
      {value && selected.isError && (
        <p role="alert" className="text-xs text-[var(--vms-danger)]">
          Could not verify option.{" "}
          <button
            type="button"
            className="underline"
            onClick={() => selected.refetch()}
          >
            Retry
          </button>
        </p>
      )}
      {open && (
        <div
          id={`${inputId}-options`}
          className="absolute z-30 mt-1 w-full rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-2 shadow-[var(--vms-shadow-overlay)]"
        >
          <Input
            aria-label={`Search ${label.toLowerCase()}`}
            placeholder="Search options"
            icon={Search}
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setCursor(null);
            }}
            autoComplete="off"
          />
          {query.isFetching ? (
            <p
              role="status"
              className="p-3 text-sm text-[var(--vms-ink-muted)]"
            >
              Loading options…
            </p>
          ) : query.isError ? (
            <div role="alert" className="p-3 text-sm text-[var(--vms-danger)]">
              {parseApiError(query.error).message}{" "}
              <button
                type="button"
                className="underline"
                onClick={() => query.refetch()}
              >
                Retry options
              </button>
            </div>
          ) : (
            <>
              <ul className="mt-1 max-h-48 overflow-y-auto py-1">
                {query.data?.items.map((item) => (
                  <li key={item.value}>
                    <button
                      type="button"
                      disabled={
                        item.disabled || excludeIds.includes(item.value)
                      }
                      onClick={() => {
                        onChange(item);
                        setOpen(false);
                        setSearch("");
                        setCursor(null);
                      }}
                      className="min-h-11 w-full rounded px-3 text-left text-sm hover:bg-[var(--vms-surface-subtle)] focus-visible:bg-[var(--vms-surface-subtle)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {item.label}
                      {item.description && (
                        <span className="block text-xs text-[var(--vms-ink-muted)]">
                          {item.description}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
              {!query.data?.items.length && (
                <p className="p-3 text-sm text-[var(--vms-ink-muted)]">
                  No matching options.
                </p>
              )}
              {(query.data?.has_more || cursor) && (
                <div className="flex justify-between gap-2 border-t border-[var(--vms-line)] pt-2 text-xs">
                  <button
                    type="button"
                    className="min-h-10 px-2 disabled:opacity-40"
                    disabled={!cursor}
                    onClick={() => setCursor(null)}
                  >
                    First options
                  </button>
                  <button
                    type="button"
                    className="min-h-10 px-2 disabled:opacity-40"
                    disabled={!query.data?.next_cursor}
                    onClick={() => setCursor(query.data?.next_cursor || null)}
                  >
                    More options
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
      {error && (
        <p
          id={errorId}
          role="alert"
          className="text-xs font-semibold text-[var(--vms-danger)]"
        >
          {error}
        </p>
      )}
    </div>
  );
}
