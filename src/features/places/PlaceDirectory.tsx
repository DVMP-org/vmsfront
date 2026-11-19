"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Field, fieldControlClassName } from "@/components/ui/form/Field";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { isModuleEnabled } from "@/config/admin-routes";
import { contextApi } from "@/features/context/api";
import { useSiteAccess } from "@/features/context/use-site-access";
import { useAppStore } from "@/store/app-store";
import { parseApiError } from "@/lib/error-utils";
import {
  placeKinds,
  placesApi,
  type Place,
  type PlaceKind,
  type PlaceTreeNode,
} from "./api";

type BuildingOption = { id: string; label: string };

export function PlaceDirectory() {
  const { allowed, contextKey, workspace } = useSiteAccess();
  const site = useAppStore((state) => state.selectedSite);
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState<PlaceKind | "">("");
  const [status, setStatus] = useState<"" | "active" | "archived">("");
  const [createOpen, setCreateOpen] = useState(false);
  const canCreate = allowed("places.create");
  const isMixedUse = workspace.data?.effective_use_case === "mixed_use";
  const canOpenFacilities =
    isMixedUse &&
    allowed("places.show") &&
    isModuleEnabled("shared_facilities", workspace.data?.modules);
  const canOpenExpenses =
    isMixedUse &&
    allowed("charges.show") &&
    isModuleEnabled("expense_allocation", workspace.data?.modules);
  const list = useQuery({
    queryKey: ["places", contextKey, page, search, kind, status],
    queryFn: () =>
      placesApi.list({
        page,
        page_size: 20,
        site_id: site!.id,
        search,
        kind: kind || undefined,
        is_active: status ? status === "active" : undefined,
      }),
    enabled:
      !!site &&
      allowed("places.list") &&
      !workspace.isError &&
      !workspace.isPending,
  });
  const tree = useQuery({
    queryKey: ["places-tree", contextKey],
    queryFn: () => placesApi.tree(site!.id, true),
    enabled:
      !!site &&
      allowed("places.list") &&
      !workspace.isPending &&
      !workspace.isError,
    retry: false,
  });
  const catalog = useQuery({
    queryKey: ["context-catalog", contextKey],
    queryFn: contextApi.catalog,
    enabled: !workspace.isPending && !workspace.isError,
    retry: false,
  });
  const categoryLabels = new Map(
    catalog.data?.building_types.map((type) => [type.value, type.label]) ?? [],
  );
  const hierarchy = useMemo(() => {
    const paths = new Map<string, string>();
    const buildings: BuildingOption[] = [];
    const visit = (nodes: PlaceTreeNode[], parents: string[]) => {
      for (const node of nodes) {
        const path = [...parents, node.name];
        paths.set(node.id, path.join(" / "));
        if (node.kind === "building" && node.is_active) {
          buildings.push({ id: node.id, label: path.join(" / ") });
        }
        visit(node.children ?? [], path);
      }
    };
    visit(tree.data ?? [], []);
    return { paths, buildings };
  }, [tree.data]);
  const firstUse =
    list.isSuccess &&
    list.data.total === 0 &&
    !search.trim() &&
    !kind &&
    !status;
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
    {
      key: "kind",
      header: "Structure",
      accessor: (place) => placeKinds[place.kind],
    },
    {
      key: "building_type",
      header: "Category",
      accessor: (place) =>
        place.building_type ? (
          categoryLabels.get(place.building_type) ||
          place.building_type.replaceAll("_", " ")
        ) : (
          <span className="text-[var(--vms-ink-muted)]">Not set</span>
        ),
      responsiveHide: "lg",
    },
    {
      key: "parent_id",
      header: "Within",
      accessor: (place) =>
        place.parent_id ? (
          <Link
            className="text-[var(--vms-ink-muted)] underline-offset-4 hover:underline"
            href={`/admin/places/${place.parent_id}`}
          >
            {hierarchy.paths.get(place.parent_id) || "Parent Place"}
          </Link>
        ) : (
          <span className="text-[var(--vms-ink-muted)]">Site level</span>
        ),
    },
    {
      key: "is_active",
      header: "Status",
      accessor: (place) => (
        <StatusBadge tone={place.is_active ? "success" : "neutral"}>
          {place.is_active ? "Active" : "Archived"}
        </StatusBadge>
      ),
    },
    { key: "address", header: "Address", responsiveHide: "lg" },
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
        description={
          isMixedUse
            ? `Buildings, residential units, commercial spaces, rooms and shared areas at ${site.name}.`
            : `Buildings, units, rooms and spaces at ${site.name}.`
        }
        primaryAction={
          canCreate && !firstUse ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add Place
            </Button>
          ) : null
        }
      />

      {firstUse ? (
        <section className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] px-5 py-6 sm:px-6">
          <h2 className="text-lg font-semibold">Set up the first Place</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--vms-ink-muted)]">
            Start with a building or a top-level space. Add units and rooms
            within a building, then connect people and operations to the right
            locations.
          </p>
          {isMixedUse ? (
            <p className="mt-3 text-xs leading-5 text-[var(--vms-ink-muted)]">
              Residential unit · Commercial space · Hospitality room · Shared
              area
            </p>
          ) : null}
          {canCreate ? (
            <Button className="mt-4" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add first Place
            </Button>
          ) : (
            <p className="mt-3 text-sm text-[var(--vms-ink-muted)]">
              Ask a Site administrator to create the first Place.
            </p>
          )}
        </section>
      ) : (
        <section className="space-y-3" aria-label="Site place inventory">
          <div className="flex flex-wrap items-end gap-3">
            <label className="grid gap-1 text-xs font-medium text-[var(--vms-ink-muted)]">
              Structure
              <select
                className={fieldControlClassName}
                value={kind}
                onChange={(event) => {
                  setKind(event.target.value as PlaceKind | "");
                  setPage(1);
                }}
              >
                <option value="">All structures</option>
                {Object.entries(placeKinds).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-xs font-medium text-[var(--vms-ink-muted)]">
              Status
              <select
                className={fieldControlClassName}
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value as "" | "active" | "archived");
                  setPage(1);
                }}
              >
                <option value="">All statuses</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </label>
            {kind || status ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setKind("");
                  setStatus("");
                  setPage(1);
                }}
              >
                Clear filters
              </Button>
            ) : null}
          </div>
          {tree.isError ? (
            <InlineAlert
              tone="warning"
              title="Place hierarchy unavailable"
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => tree.refetch()}
                >
                  Retry hierarchy
                </Button>
              }
            >
              The register remains available, but parent names cannot be shown
              until the hierarchy loads.
            </InlineAlert>
          ) : null}
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
            searchPlaceholder="Search Places"
            isLoading={list.isPending}
            errorMessage={
              list.isError ? parseApiError(list.error).message : null
            }
            onRetry={() => list.refetch()}
            emptyMessage="No Places match this view. Change the filters or search to see other locations."
            tableLabel="Site place inventory"
            mobileSummary={(place) => (
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/admin/places/${place.id}`}
                    className="font-semibold underline-offset-4 hover:underline"
                  >
                    {place.name}
                  </Link>
                  <p className="mt-1 text-xs text-[var(--vms-ink-muted)]">
                    {placeKinds[place.kind]}
                    {place.building_type
                      ? ` · ${categoryLabels.get(place.building_type) || place.building_type.replaceAll("_", " ")}`
                      : ""}
                    {" · "}
                    {place.parent_id
                      ? hierarchy.paths.get(place.parent_id) || "Parent Place"
                      : "Site level"}
                  </p>
                </div>
                <StatusBadge tone={place.is_active ? "success" : "neutral"}>
                  {place.is_active ? "Active" : "Archived"}
                </StatusBadge>
              </div>
            )}
          />
        </section>
      )}
      {site && canCreate && createOpen ? (
        <CreatePlaceModal
          key={site.id}
          siteId={site.id}
          siteName={site.name}
          contextKey={contextKey}
          buildings={hierarchy.buildings}
          hierarchyLoading={tree.isPending}
          hierarchyError={tree.isError}
          onRetryHierarchy={() => void tree.refetch()}
          onClose={() => setCreateOpen(false)}
          onSaved={async () => {
            setCreateOpen(false);
            setPage(1);
            setSearch("");
            await Promise.all([
              queryClient.invalidateQueries({
                queryKey: ["places", contextKey],
              }),
              queryClient.invalidateQueries({
                queryKey: ["places-tree", contextKey],
              }),
              queryClient.invalidateQueries({
                queryKey: ["mixed-use-overview-tree"],
              }),
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
  buildings,
  hierarchyLoading,
  hierarchyError,
  onRetryHierarchy,
  onClose,
  onSaved,
}: {
  siteId: string;
  siteName: string;
  contextKey: string;
  buildings: BuildingOption[];
  hierarchyLoading: boolean;
  hierarchyError: boolean;
  onRetryHierarchy: () => void;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState<PlaceKind>("building");
  const [parentId, setParentId] = useState("");
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
        parent_id: parentId || null,
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
        <Field
          id="directory-place-parent"
          label="Within a building"
          description="Optional. Only buildings can contain other Places; leave this blank for a Site-level Place."
        >
          {(control) => (
            <select
              {...control}
              className={fieldControlClassName}
              value={parentId}
              onChange={(event) => setParentId(event.target.value)}
              disabled={hierarchyLoading || hierarchyError}
            >
              <option value="">Site level</option>
              {buildings.map((building) => (
                <option key={building.id} value={building.id}>
                  {building.label}
                </option>
              ))}
            </select>
          )}
        </Field>
        {hierarchyError ? (
          <InlineAlert
            tone="warning"
            title="Buildings could not be loaded"
            action={
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onRetryHierarchy}
              >
                Retry
              </Button>
            }
          >
            You can still create a Site-level Place. Retry to choose a parent
            building.
          </InlineAlert>
        ) : null}
        <Field
          id="directory-place-type"
          label="Place category"
          description="Optional physical classification. The Site's operating type controls which modules are available."
        >
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
        {catalog.isError ? (
          <InlineAlert
            tone="warning"
            title="Place categories unavailable"
            action={
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => catalog.refetch()}
              >
                Retry
              </Button>
            }
          >
            You can create the Place without a category and add one later.
          </InlineAlert>
        ) : null}
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
