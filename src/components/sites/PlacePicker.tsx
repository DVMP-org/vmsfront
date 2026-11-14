"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { fieldControlClassName } from "@/components/ui/form/Field";
import {
  placesApi,
  type PlaceTreeNode,
} from "@/features/places/api";

export function PlacePicker({
  siteId,
  value,
  onChange,
  label = "Place",
}: {
  siteId: string;
  value: { id: string; name: string } | null;
  onChange: (place: { id: string; name: string } | null) => void;
  label?: string;
}) {
  const places = useQuery({
    queryKey: ["place-picker", siteId],
    queryFn: () => placesApi.tree(siteId),
    enabled: !!siteId,
  });
  const items = useMemo(
    () => flattenPlaces(places.data || []),
    [places.data],
  );
  return (
    <label className="block space-y-2">
      <span className="text-[13px] font-semibold">{label}</span>
      <select
        className={fieldControlClassName}
        value={value?.id || ""}
        onChange={(event) => {
          const place = items.find((item) => item.id === event.target.value);
          onChange(place ? { id: place.id, name: place.name } : null);
        }}
        disabled={places.isPending}
      >
        <option value="">
          {places.isPending ? "Loading Places…" : "Choose a Place"}
        </option>
        {value && !items.some((item) => item.id === value.id) ? (
          <option value={value.id}>{value.name}</option>
        ) : null}
        {items.map((place) => (
          <option key={place.id} value={place.id}>
            {place.name}
          </option>
        ))}
      </select>
      {places.isError ? (
        <span className="block text-xs text-[var(--vms-danger)]">
          Places could not be loaded.
        </span>
      ) : places.isSuccess && !items.length ? (
        <span className="block text-xs text-[var(--vms-ink-muted)]">
          This Site has no active Places.
        </span>
      ) : null}
    </label>
  );
}

export function flattenPlaces(
  roots: PlaceTreeNode[],
): PlaceTreeNode[] {
  return roots.flatMap((root) => [root, ...flattenPlaces(root.children || [])]);
}
