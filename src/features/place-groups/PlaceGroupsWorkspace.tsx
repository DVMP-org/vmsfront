"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Layers3, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Drawer } from "@/components/ui/Drawer";
import { Input } from "@/components/ui/Input";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Field, fieldControlClassName } from "@/components/ui/form/Field";
import { FormErrorSummary } from "@/components/ui/form/FormErrorSummary";
import { PageHeader } from "@/components/ui/PageHeader";
import { parseApiError } from "@/lib/error-utils";
import { propertiesApi } from "@/features/properties/api";
import { useSiteAccess } from "@/features/context/use-site-access";
import { useAppStore } from "@/store/app-store";
import { placeGroupsApi, type PlaceGroup } from "./api";

export function PlaceGroupsWorkspace() {
  const selectedProperty = useAppStore((state) => state.selectedProperty);
  const access = useSiteAccess();
  const client = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<PlaceGroup | null>(null);
  const canManage = access.allowed([
    "place_groups.create",
    "place_groups.update",
  ]);
  const groups = useQuery({
    queryKey: ["place-groups", selectedProperty?.id],
    queryFn: placeGroupsApi.list,
    enabled: !!selectedProperty?.id,
  });
  const places = useQuery({
    queryKey: ["place-group-places", selectedProperty?.id],
    queryFn: () =>
      propertiesApi.list({
        page: 1,
        page_size: 100,
        is_active: true,
        site_id: selectedProperty!.id,
      }),
    enabled: !!selectedProperty?.id,
  });
  const columns: Column<PlaceGroup>[] = [
    {
      key: "name",
      header: "Group",
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
      key: "members",
      header: "Places",
      accessor: (group) => (
        <span className="text-sm">
          {group.places.map((place) => place.name).join(", ") || "No places"}
        </span>
      ),
    },
    {
      key: "count",
      header: "Members",
      accessor: (group) => (
        <span className="tabular-nums">{group.places.length}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      mobileHide: true,
      accessor: (group) => (
        <div className="flex justify-end gap-1">
          {canManage ? (
            <Button size="sm" variant="ghost" onClick={() => setEditing(group)}>
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              Edit
            </Button>
          ) : null}
          <Button size="sm" variant="outline" asChild>
            <Link href={`/admin/charges?group=${group.id}`}>Charges</Link>
          </Button>
        </div>
      ),
    },
  ];
  const close = () => {
    setCreateOpen(false);
    setEditing(null);
  };
  return (
    <main className="space-y-5 pb-10 text-[var(--vms-ink)]">
      <PageHeader
        eyebrow="Site / Units"
        title="Place groups"
        description="Group a logical subset of units and spaces for shared charges, policies and reporting."
        primaryAction={
          canManage && selectedProperty ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Create group
            </Button>
          ) : undefined
        }
      />
      <section className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-3 sm:p-4">
        <DataTable
          data={groups.data ?? []}
          columns={columns}
          tableLabel="Place groups"
          searchPlaceholder="Search groups or member places"
          isLoading={groups.isPending || places.isPending}
          errorMessage={
            groups.isError ? parseApiError(groups.error).message : undefined
          }
          onRetry={() => groups.refetch()}
          emptyMessage="No Place groups have been created."
          mobileSummary={(group) => (
            <div className="space-y-2">
              <strong>{group.name}</strong>
              <p className="text-xs text-[var(--vms-ink-muted)]">
                {group.places.length} places ·{" "}
                {group.places.map((place) => place.name).join(", ") ||
                  "No members"}
              </p>
              {canManage && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditing(group)}
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Edit{" "}
                  {group.name}
                </Button>
              )}
            </div>
          )}
        />
      </section>
      {(createOpen || editing) && (
        <PlaceGroupDrawer
          key={`${selectedProperty?.id}:${editing?.id || "new"}`}
          open
          group={editing}
          siteId={selectedProperty?.id || ""}
          places={places.data?.items ?? []}
          placesLoading={places.isPending}
          placesError={
            places.isError ? parseApiError(places.error).message : undefined
          }
          onRetryPlaces={() => void places.refetch()}
          onClose={close}
          onSaved={async () => {
            close();
            await client.invalidateQueries({ queryKey: ["place-groups"] });
            toast.success(
              editing ? "Place group updated." : "Place group created.",
            );
          }}
        />
      )}
    </main>
  );
}

function PlaceGroupDrawer({
  open,
  group,
  siteId,
  places,
  placesLoading,
  placesError,
  onRetryPlaces,
  onClose,
  onSaved,
}: {
  open: boolean;
  group: PlaceGroup | null;
  siteId: string;
  places: Array<{ id: string; name: string; kind: string }>;
  placesLoading: boolean;
  placesError?: string;
  onRetryPlaces: () => void;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [name, setName] = useState(group?.name || "");
  const [description, setDescription] = useState(group?.description || "");
  const [selected, setSelected] = useState<string[]>(
    group?.places.map((place) => place.id) || [],
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const memberIds = useMemo(() => new Set(selected), [selected]);
  const save = useMutation({
    mutationFn: () =>
      group
        ? placeGroupsApi.update(group.id, {
            name: name.trim(),
            description: description.trim() || null,
            place_ids: selected,
          })
        : placeGroupsApi.create({
            site_id: siteId,
            name: name.trim(),
            description: description.trim() || null,
            place_ids: selected,
          }),
    onSuccess: onSaved,
    onError: (error) => setErrors({ form: parseApiError(error).message }),
  });
  function submit(event: FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (name.trim().length < 2) next.name = "Enter a group name.";
    if (!selected.length) next.places = "Select at least one Place.";
    setErrors(next);
    if (Object.keys(next).length) return;
    save.mutate();
  }
  return (
    <Drawer
      isOpen={open}
      onClose={onClose}
      title={group ? `Edit ${group.name}` : "Create Place group"}
      description="Use groups to assign a charge or policy to a logical subset of Places."
    >
      <form className="space-y-4" onSubmit={submit}>
        <FormErrorSummary errors={errors} />
        <Input
          id="place-group-name"
          label="Group name"
          showAsterisk
          required
          error={errors.name}
          icon={Layers3}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <Field id="place-group-description" label="Description">
          {(control) => (
            <textarea
              {...control}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className={`${fieldControlClassName} min-h-24 py-2`}
            />
          )}
        </Field>
        <fieldset>
          <legend className="text-sm font-semibold">
            Places in this group
          </legend>
          {errors.places ? (
            <p role="alert" className="mt-1 text-xs text-[var(--vms-danger)]">
              {errors.places}
            </p>
          ) : null}
          <div className="mt-2 max-h-72 divide-y divide-[var(--vms-line)] overflow-y-auto rounded-[var(--vms-radius-control)] border border-[var(--vms-line)]">
            {placesLoading ? (
              <p
                role="status"
                className="p-3 text-sm text-[var(--vms-ink-muted)]"
              >
                Loading places…
              </p>
            ) : placesError ? (
              <div role="alert" className="p-3 text-sm">
                <p>{placesError}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={onRetryPlaces}
                >
                  Retry places
                </Button>
              </div>
            ) : places.length === 0 ? (
              <p className="p-3 text-sm text-[var(--vms-ink-muted)]">
                No active places available.
              </p>
            ) : (
              places.map((place) => (
                <div
                  key={place.id}
                  className="px-3 hover:bg-[var(--vms-surface-subtle)]"
                >
                  <Checkbox
                    checked={memberIds.has(place.id)}
                    onChange={(event) =>
                      setSelected((current) =>
                        event.target.checked
                          ? [...current, place.id]
                          : current.filter((id) => id !== place.id),
                      )
                    }
                    label={
                      <span className="flex items-center gap-3">
                        <Building2 className="h-4 w-4" aria-hidden="true" />
                        <span>
                          <strong className="block text-sm">
                            {place.name}
                          </strong>
                          <span className="text-xs capitalize text-[var(--vms-ink-muted)]">
                            {place.kind}
                          </span>
                        </span>
                      </span>
                    }
                  />
                </div>
              ))
            )}
          </div>
        </fieldset>
        <div className="flex justify-end gap-2 border-t border-[var(--vms-line)] pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={save.isPending}
            disabled={placesLoading || !!placesError}
          >
            {group ? "Save group" : "Create group"}
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
