"use client";

import { FormEvent, useMemo, useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Layers3, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Drawer } from "@/components/ui/Drawer";
import { Input } from "@/components/ui/Input";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { parseApiError } from "@/lib/error-utils";
import { placeGroupsApi, type PlaceGroup } from "@/features/place-groups/api";
import { useAppStore } from "@/store/app-store";
import {
  useHospitalityRooms,
  useRoomCategories,
  roomCategoryKeys,
  hospitalityRoomKeys,
} from "../queries";

/**
 * The categories a room is sold as.
 *
 * A category is a Place group, but this page is written for the desk that runs a
 * hotel rather than for whoever maintains grouping for charges: here a category
 * exists to be attached to rooms, and it is allowed to exist before any room
 * does. That is the point — a new property starts by deciding what it sells.
 *
 * The room count is derived from the rooms themselves rather than stored on the
 * category. A count column that someone has to remember to update is a count
 * column that is eventually wrong.
 */
export function RoomCategoriesWorkspace({ canManage }: { canManage: boolean }) {
  const selectedSite = useAppStore((state) => state.selectedSite);
  const client = useQueryClient();
  const categories = useRoomCategories();
  const rooms = useHospitalityRooms();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<PlaceGroup | null>(null);

  const counts = useMemo(() => {
    const tally = new Map<string, number>();
    for (const room of rooms.data ?? []) {
      if (!room.place_group_id) continue;
      tally.set(room.place_group_id, (tally.get(room.place_group_id) ?? 0) + 1);
    }
    return tally;
  }, [rooms.data]);

  const columns: Column<PlaceGroup>[] = [
    {
      key: "category",
      header: "Category",
      accessor: (group) => (
        <span className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-[var(--vms-radius-control)] bg-[var(--vms-surface-subtle)]">
            <Layers3 className="h-4 w-4" aria-hidden="true" />
          </span>
          <span>
            <strong className="block">{group.name}</strong>
            <span className="block text-xs text-[var(--vms-ink-muted)]">
              {group.description || "No description"}
            </span>
          </span>
        </span>
      ),
    },
    {
      key: "rooms",
      header: "Rooms",
      accessor: (group) => {
        const count = counts.get(group.id) ?? 0;
        return (
          <span className={count === 0 ? "text-[var(--vms-ink-muted)]" : ""}>
            {count === 0
              ? "No rooms yet"
              : `${count} room${count === 1 ? "" : "s"}`}
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "",
      mobileHide: true,
      accessor: (group) =>
        canManage ? (
          <div className="flex justify-end">
            <Button size="sm" variant="ghost" onClick={() => setEditing(group)}>
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              Edit
            </Button>
          </div>
        ) : null,
    },
  ];

  if (categories.isError) {
    return (
      <InlineAlert
        tone="danger"
        title="Room categories could not be loaded"
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => categories.refetch()}
          >
            Retry
          </Button>
        }
      >
        {parseApiError(categories.error).message}
      </InlineAlert>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[var(--vms-ink)]">
            Room categories
          </h2>
          <p className="text-xs text-[var(--vms-ink-muted)]">
            What guests book — “Deluxe Super”, “Executive Suite”. A category can
            be created before any room belongs to it, and a room belongs to one
            category.
          </p>
        </div>
        {canManage ? (
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            New category
          </Button>
        ) : null}
      </div>

      <DataTable
        data={categories.data ?? []}
        columns={columns}
        tableLabel="Room categories"
        searchPlaceholder="Search categories"
        isLoading={categories.isPending || rooms.isPending}
        emptyMessage="No categories yet. Create one to start selling rooms by type."
        mobileSummary={(group) => (
          <div className="space-y-2">
            <strong>{group.name}</strong>
            <p className="text-xs text-[var(--vms-ink-muted)]">
              {counts.get(group.id) ?? 0} rooms ·{" "}
              {group.description || "No description"}
            </p>
            {canManage ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditing(group)}
              >
                Edit {group.name}
              </Button>
            ) : null}
          </div>
        )}
      />

      {creating || editing ? (
        <CategoryDrawer
          key={`${selectedSite?.id ?? "none"}:${editing?.id ?? "new"}`}
          group={editing}
          siteId={selectedSite?.id ?? ""}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={async (message) => {
            setCreating(false);
            setEditing(null);
            await Promise.all([
              client.invalidateQueries({ queryKey: roomCategoryKeys.all }),
              // The room form's picker reads this, so a new category has to show
              // up there without a reload.
              client.invalidateQueries({ queryKey: hospitalityRoomKeys.all }),
            ]);
            toast.success(message);
          }}
        />
      ) : null}
    </div>
  );
}

/**
 * Create or rename a category.
 *
 * Deliberately short: a name and a description. Assigning rooms happens on the
 * room, because that is where the decision is made — and requiring a room here
 * would make it impossible to set up a property before its rooms are entered.
 */
function CategoryDrawer({
  group,
  siteId,
  onClose,
  onSaved,
}: {
  group: PlaceGroup | null;
  siteId: string;
  onClose: () => void;
  onSaved: (message: string) => Promise<void>;
}) {
  const [name, setName] = useState(group?.name ?? "");
  const [description, setDescription] = useState(group?.description ?? "");

  const mutation = useMutation({
    mutationFn: async () => {
      const trimmed = name.trim();
      if (!trimmed) throw new Error("A category needs a name.");
      return group
        ? placeGroupsApi.update(group.id, {
            name: trimmed,
            description: description.trim() || null,
          })
        : placeGroupsApi.create({
            site_id: siteId,
            name: trimmed,
            description: description.trim() || null,
            // No rooms yet: the category is the thing being set up.
            place_ids: [],
          });
    },
    onSuccess: () =>
      void onSaved(group ? "Category renamed." : "Category created."),
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate();
  }

  return (
    <Drawer
      isOpen
      onClose={onClose}
      title={group ? "Rename category" : "New category"}
      description={
        group
          ? "Renaming updates every room in this category."
          : "Rooms can be added to it now or later."
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Input
          label="Category name"
          name="name"
          required
          value={name}
          onChange={(event) => setName(event.currentTarget.value)}
          placeholder="Deluxe Super"
        />
        <Input
          label="Description"
          name="description"
          value={description}
          onChange={(event) => setDescription(event.currentTarget.value)}
          placeholder="King bed, city view, sleeps two"
        />
        {mutation.isError ? (
          <InlineAlert tone="danger" title="That did not save">
            {parseApiError(mutation.error).message}
          </InlineAlert>
        ) : null}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={!name.trim() || mutation.isPending}
            isLoading={mutation.isPending}
          >
            {group ? "Save" : "Create category"}
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
