"use client";
import { useEffect, useId, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { parseApiError } from "@/lib/error-utils";
import { loadFacets, FacetItem } from "./client";
import "./styles.css";
export type { FacetItem } from "./client";
export function FacetPicker({
  facet,
  kind,
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
  const [cursor, setCursor] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ["facets", contextKey, facet, kind, search, cursor],
    queryFn: ({ signal }) =>
      loadFacets(facet, {
        filters: {
          ...(kind ? { kind: kind as "person" | "organization" } : {}),
          is_active: true,
        },
        search,
        cursor,
        signal,
      }),
    enabled: !value,
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
  return (
    <fieldset
      className="stay-picker facet-picker"
      aria-describedby={
        [description ? `${inputId}-description` : "", error ? `${inputId}-error` : ""]
          .filter(Boolean)
          .join(" ") || undefined
      }
    >
      <legend>{label}</legend>
      {description ? (
        <p id={`${inputId}-description`}>{description}</p>
      ) : null}
      {value ? (
        <div className="stay-selected facet-selected">
          {selected.data?.items.find((item) => item.value === value.value)
            ?.label || value.label}
          {selected.isError && (
            <span role="alert">
              Could not verify option.{" "}
              <button type="button" onClick={() => selected.refetch()}>
                Retry
              </button>
            </span>
          )}
          <button type="button" onClick={() => onChange(null)}>
            Change
          </button>
        </div>
      ) : (
        <>
          <label>
            Search {label.toLowerCase()}
            <input
              id={inputId}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCursor(null);
              }}
              autoComplete="off"
              aria-invalid={error ? true : undefined}
              aria-errormessage={error ? `${inputId}-error` : undefined}
            />
          </label>
          {query.isFetching ? (
            <p role="status">Loading options…</p>
          ) : query.isError ? (
            <div role="alert">
              {parseApiError(query.error).message}
              <button type="button" onClick={() => query.refetch()}>
                Retry options
              </button>
            </div>
          ) : (
            <>
              <ul className="stay-options facet-options">
                {query.data?.items.map((item) => (
                  <li key={item.value}>
                    <button
                      type="button"
                      disabled={
                        item.disabled || excludeIds.includes(item.value)
                      }
                      onClick={() => onChange(item)}
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
              {!query.data?.items.length && <p>No matching options.</p>}
              {(query.data?.has_more || cursor) && (
                <div className="stay-actions facet-actions">
                  <button
                    type="button"
                    disabled={!cursor}
                    onClick={() => setCursor(null)}
                  >
                    First options
                  </button>
                  <button
                    type="button"
                    disabled={!query.data?.next_cursor}
                    onClick={() => setCursor(query.data?.next_cursor || null)}
                  >
                    More options
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
      {error ? (
        <p id={`${inputId}-error`} role="alert">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
