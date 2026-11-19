"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { parseApiError } from "@/lib/error-utils";
import { placeGroupsApi, type PlaceGroup } from "@/features/place-groups/api";
import { roomCategoryKeys } from "../queries";

/**
 * Which category the room is sold as, with the ability to create one here.
 *
 * A desk entering its first rooms is exactly when categories do not exist yet,
 * and sending somebody to another page to create one and back again is how a
 * room ends up uncategorised. So when the list is empty the field offers to make
 * the first category, and it does the same when it is not.
 *
 * The category is a Place group; this is the hospitality vocabulary for it, and
 * the vocabulary is the only thing that differs.
 */
export function RoomCategoryField({
  value,
  onChange,
  categories,
  isLoading,
  siteId,
  canEdit,
}: {
  value: string;
  onChange: (categoryId: string) => void;
  categories: PlaceGroup[];
  isLoading: boolean;
  siteId: string;
  canEdit: boolean;
}) {
  const client = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: async (categoryName: string) =>
      placeGroupsApi.create({
        site_id: siteId,
        name: categoryName,
        description: null,
        place_ids: [],
      }),
    onSuccess: async (created) => {
      await client.invalidateQueries({ queryKey: roomCategoryKeys.all });
      // Select it straight away: creating a category from here is only ever
      // done because this room is meant to be in it.
      onChange(created.id);
      setCreating(false);
      setName("");
      setError(null);
    },
    onError: (cause) => setError(parseApiError(cause).message),
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    create.mutate(trimmed);
  }

  const noneYet = !isLoading && categories.length === 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor="room-category"
          className="text-sm font-medium text-[var(--vms-ink)]"
        >
          Room category
        </label>
        {canEdit && !creating ? (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--vms-accent)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-accent)]"
          >
            <Plus aria-hidden="true" className="h-3.5 w-3.5" />
            New category
          </button>
        ) : null}
      </div>

      <select
        id="room-category"
        name="place_group_id"
        className="h-[var(--vms-control-height)] w-full rounded-[var(--vms-radius-control)] border border-[var(--vms-line-strong)] bg-[var(--vms-surface)] px-3 text-base sm:text-sm"
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        disabled={isLoading}
      >
        <option value="">
          {isLoading ? "Loading categories…" : "Not categorised"}
        </option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>

      <p className="text-xs text-[var(--vms-ink-muted)]">
        {noneYet
          ? "No categories yet — create the first one and it will be selected here."
          : "What guests book. The room itself is assigned later."}
      </p>

      {creating ? (
        <form
          onSubmit={submit}
          className="flex flex-col gap-2 rounded-lg border border-[var(--vms-border)] bg-[var(--vms-surface-muted)] p-3"
        >
          <Input
            label="New category name"
            name="new_category"
            autoFocus
            value={name}
            onChange={(event) => setName(event.currentTarget.value)}
            placeholder="Deluxe Super"
          />
          {error ? (
            <p
              role="alert"
              className="text-xs font-medium text-[var(--vms-danger)]"
            >
              {error}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setCreating(false);
                setError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!name.trim() || !siteId || create.isPending}
              isLoading={create.isPending}
            >
              Create category
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
