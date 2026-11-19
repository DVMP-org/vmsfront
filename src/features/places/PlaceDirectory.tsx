"use client";
import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Field, fieldControlClassName } from "@/components/ui/form/Field";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { contextApi } from "@/features/context/api";
import { useSiteAccess } from "@/features/context/use-site-access";
import { useAppStore } from "@/store/app-store";
import { parseApiError } from "@/lib/error-utils";
import { placesApi, type Place, type PlaceKind } from "./api";

export function PlaceDirectory() {
  const { allowed, contextKey, workspace } = useSiteAccess();
  const site = useAppStore((state) => state.selectedSite);
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const canCreate = allowed("places.create");
  const list = useQuery({
    queryKey: ["places", contextKey, page, search],
    queryFn: () =>
      placesApi.list({ page, page_size: 20, site_id: site!.id, search }),
    enabled:
      !!site &&
      allowed("places.list") &&
      !workspace.isError &&
      !workspace.isPending,
  });
  const columns: Column<Place>[] = [
    {
      key: "name",
      header: "Place",
      accessor: (place) => (
        <Link
          className="font-semibold hover:underline"
          href={`/admin/places/${place.id}`}
        >
          {place.name}
        </Link>
      ),
    },
    { key: "kind", header: "Type" },
    { key: "address", header: "Address" },
  ];
  if (workspace.isPending) return <p role="status">Loading workspace…</p>;
  if (workspace.isError)
    return <p role="alert">{parseApiError(workspace.error).message}</p>;
  if (!site || !allowed("places.list"))
    return (
      <p role="alert">Select a workspace with permission to list places.</p>
    );
  return (
    <main className="space-y-5">
      <PageHeader
        title="Places"
        description={`Buildings, units, rooms and spaces at ${site.name}.`}
        primaryAction={
          canCreate ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add Place
            </Button>
          ) : null
        }
      />
      {list.isSuccess && list.data.total === 0 && !search.trim() ? (
        <section className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] px-5 py-6">
          <h2 className="text-base font-semibold">No Places yet</h2>
          <p className="mt-1 max-w-2xl text-sm leading-5 text-[var(--vms-ink-muted)]">
            Add a building, unit, room or shared space to give occupancy,
            hospitality and access workflows a clear physical location.
            {canCreate ? " Start with the Add Place action." : " Ask a Site administrator to create the first Place."}
          </p>
        </section>
      ) : (
        <DataTable
          data={list.data?.items ?? []}
          columns={columns}
          serverSide
          pageSize={20}
          currentPage={page}
          onPageChange={setPage}
          total={list.data?.total ?? 0}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          isLoading={list.isPending}
          errorMessage={list.isError ? parseApiError(list.error).message : null}
          onRetry={() => list.refetch()}
          emptyMessage="No Places match this search. Try a different name or clear the search."
        />
      )}
      {site && canCreate && createOpen ? (
        <CreatePlaceModal
          siteId={site.id}
          siteName={site.name}
          contextKey={contextKey}
          onClose={() => setCreateOpen(false)}
          onSaved={async () => {
            setCreateOpen(false);
            setPage(1);
            setSearch("");
            await Promise.all([
              queryClient.invalidateQueries({ queryKey: ["places", contextKey] }),
              queryClient.invalidateQueries({ queryKey: ["mixed-use-overview-tree"] }),
            ]);
          }}
        />
      ) : null}
    </main>
  );
}

function CreatePlaceModal({
  siteId,
  siteName,
  contextKey,
  onClose,
  onSaved,
}: {
  siteId: string;
  siteName: string;
  contextKey: string;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState<PlaceKind>("building");
  const [buildingType, setBuildingType] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const catalog = useQuery({
    queryKey: ["context-catalog", contextKey],
    queryFn: contextApi.catalog,
  });
  const create = useMutation({
    mutationFn: () =>
      placesApi.create({
        site_id: siteId,
        name: name.trim(),
        kind,
        building_type: buildingType || null,
        address: address.trim(),
        description: description.trim(),
      }),
    onSuccess: onSaved,
  });

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Add a Place"
      description={`This Place will belong to ${siteName}.`}
      size="md"
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (name.trim()) create.mutate();
        }}
      >
        <Field id="directory-place-name" label="Place name" required>
          {(control) => (
            <input
              {...control}
              className={fieldControlClassName}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          )}
        </Field>
        <Field
          id="directory-place-kind"
          label="Structure"
          required
          description="Choose the physical space type. You can add its address and operational details later."
        >
          {(control) => (
            <select
              {...control}
              className={fieldControlClassName}
              value={kind}
              onChange={(event) => {
                setKind(event.target.value as PlaceKind);
                setBuildingType("");
              }}
            >
              <option value="building">Building</option>
              <option value="unit">Unit</option>
              <option value="room">Room</option>
              <option value="space">Space</option>
            </select>
          )}
        </Field>
        <Field id="directory-place-type" label="Place type">
          {(control) => (
            <select
              {...control}
              className={fieldControlClassName}
              value={buildingType}
              onChange={(event) => setBuildingType(event.target.value)}
              disabled={catalog.isPending}
            >
              <option value="">Not specified</option>
              {catalog.data?.building_types
                .filter((type) => type.kinds.includes(kind))
                .map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
            </select>
          )}
        </Field>
        <Field id="directory-place-address" label="Address">
          {(control) => (
            <input
              {...control}
              className={fieldControlClassName}
              value={address}
              onChange={(event) => setAddress(event.target.value)}
            />
          )}
        </Field>
        <Field id="directory-place-description" label="Description">
          {(control) => (
            <textarea
              {...control}
              className={fieldControlClassName}
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          )}
        </Field>
        {create.isError ? (
          <InlineAlert tone="danger" title="Place could not be created">
            {parseApiError(create.error).message}
          </InlineAlert>
        ) : null}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={create.isPending || !name.trim()}>
            {create.isPending ? "Adding…" : "Add Place"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
