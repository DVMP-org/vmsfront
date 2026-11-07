"use client";
import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/store/app-store";
import { useAuthStore } from "@/store/auth-store";
import { adminService } from "@/services/admin-service";
import { hasPermission } from "@/lib/permissions";
import { parseApiError } from "@/lib/error-utils";
import { FacetItem, FacetPicker } from "@/components/facets/FacetPicker";
import {
  Property,
  PropertyDetail,
  PropertyInput,
  PropertyKind,
  propertiesApi,
  propertyKinds,
} from "@/features/properties/api";
import "./styles.css";
export default function PropertiesPage() {
  const organization = useAppStore((s) => s.organization);
  const user = useAuthStore((s) => s.user);
  const context = `${organization?.id}:${user?.id}`;
  return (
    <Workspace
      key={context}
      context={context}
      enabled={!!organization?.id && !!user?.id}
    />
  );
}
function ErrorState({ error, retry }: { error: unknown; retry: () => void }) {
  return (
    <div className="property-error" role="alert">
      <p>{parseApiError(error).message}</p>
      <button onClick={retry}>Retry</button>
    </div>
  );
}
function Workspace({
  context,
  enabled,
}: {
  context: string;
  enabled: boolean;
}) {
  const client = useQueryClient();
  const [page, setPage] = useState(1),
    [search, setSearch] = useState(""),
    [searchInput, setSearchInput] = useState("");
  const [kind, setKind] = useState(""),
    [status, setStatus] = useState("active"),
    [rootOnly, setRootOnly] = useState(true);
  const [selected, setSelected] = useState<string | null>(null),
    [creating, setCreating] = useState(false),
    [notice, setNotice] = useState("");
  const [createParent, setCreateParent] = useState<Property | undefined>();
  const profile = useQuery({
    queryKey: ["properties-profile", context],
    queryFn: async () => (await adminService.getAdminProfile()).data,
    enabled,
    staleTime: 0,
    refetchOnMount: "always",
  });
  const allowed = (action: string) =>
    profile.isFetchedAfterMount &&
    !profile.isError &&
    hasPermission(profile.data?.role, `places.${action}`);
  const list = useQuery({
    queryKey: [
      "properties",
      context,
      "list",
      page,
      search,
      kind,
      status,
      rootOnly,
    ],
    queryFn: () =>
      propertiesApi.list({
        page,
        page_size: 10,
        ...(search ? { search } : {}),
        ...(kind ? { kind } : {}),
        ...(status !== "all" ? { is_active: status === "active" } : {}),
        root_only: rootOnly,
      }),
    enabled: allowed("list"),
  });
  const detail = useQuery({
    queryKey: ["properties", context, "detail", selected],
    queryFn: () => propertiesApi.get(selected!),
    enabled: !!selected && allowed("show"),
  });
  function select(id: string) {
    setSelected(id);
    setCreating(false);
    setNotice("");
  }
  async function changed(property: Property, message: string) {
    setSelected(property.id);
    setCreating(false);
    setNotice(message);
    await client.invalidateQueries({ queryKey: ["properties", context] });
  }
  if (!enabled || profile.isPending || !profile.isFetchedAfterMount)
    return <p role="status">Loading property permissions…</p>;
  if (profile.isError)
    return <ErrorState error={profile.error} retry={() => profile.refetch()} />;
  if (!allowed("list"))
    return <p role="alert">You do not have permission to view properties.</p>;
  return (
    <main className="property-workspace">
      <header className="property-heading">
        <div>
          <p className="property-eyebrow">PROPERTY OPERATIONS</p>
          <h1>Properties</h1>
          <p>Organize properties, buildings and the spaces within them.</p>
        </div>
        {allowed("create") && (
          <button
            className="property-primary"
            onClick={() => {
              setCreateParent(undefined);
              setCreating(true);
              setSelected(null);
              setNotice("");
            }}
          >
            New property or space
          </button>
        )}
      </header>
      {notice && (
        <p className="property-notice" role="status">
          {notice}
        </p>
      )}
      <div className="property-layout">
        <section className="property-panel" aria-label="Property list">
          <form
            className="property-search"
            onSubmit={(e) => {
              e.preventDefault();
              setSearch(searchInput.trim());
              setPage(1);
            }}
          >
            <label>
              Search properties
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                maxLength={100}
                type="search"
              />
            </label>
            <button>Search</button>
          </form>
          <div className="property-filters">
            <label>
              Type
              <select
                value={kind}
                onChange={(e) => {
                  setKind(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All types</option>
                {Object.entries(propertyKinds).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Status
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
              >
                <option value="active">Active</option>
                <option value="archived">Archived</option>
                <option value="all">All statuses</option>
              </select>
            </label>
          </div>
          <label className="property-checkbox">
            <input
              type="checkbox"
              checked={rootOnly}
              onChange={(e) => {
                setRootOnly(e.target.checked);
                setPage(1);
              }}
            />
            Top-level properties only
          </label>
          {list.isPending ? (
            <p role="status">Loading properties…</p>
          ) : list.isError ? (
            <ErrorState error={list.error} retry={() => list.refetch()} />
          ) : (
            <>
              {list.data?.items.length ? (
                <ul className="property-list">
                  {list.data.items.map((property) => (
                    <li key={property.id}>
                      <button
                        disabled={!allowed("show")}
                        aria-current={
                          selected === property.id ? "true" : undefined
                        }
                        onClick={() => select(property.id)}
                      >
                        <span className="property-item-title">
                          {property.name}
                          <span
                            className={`property-status ${property.is_active ? "active" : "archived"}`}
                          >
                            {property.is_active ? "Active" : "Archived"}
                          </span>
                        </span>
                        <span>
                          {propertyKinds[property.kind] || property.kind}
                        </span>
                        {property.address && <small>{property.address}</small>}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="property-empty">
                  <h2>No properties found</h2>
                  <p>
                    {search || kind || status !== "active"
                      ? "Try changing your search or filters."
                      : "Create a property to begin organizing your spaces."}
                  </p>
                </div>
              )}
              <nav
                className="property-pagination"
                aria-label="Property pagination"
              >
                <button
                  disabled={page === 1 || list.isFetching}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </button>
                <span>
                  Page {page} · {list.data?.total || 0} records
                </span>
                <button
                  disabled={
                    page >= (list.data?.total_pages || 0) || list.isFetching
                  }
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </button>
              </nav>
            </>
          )}
        </section>
        <section
          className="property-panel property-detail"
          aria-label="Property details"
        >
          {creating && allowed("create") ? (
            <PropertyForm
              key={createParent ? `child:${createParent.id}` : "new-root"}
              context={context}
              initialParent={createParent}
              onCancel={() => setCreating(false)}
              onSaved={(p) => changed(p, "Property created.")}
            />
          ) : selected && allowed("show") ? (
            detail.isPending ? (
              <p role="status">Loading property…</p>
            ) : detail.isError ? (
              <ErrorState error={detail.error} retry={() => detail.refetch()} />
            ) : detail.data ? (
              <PropertyDetails
                key={`${detail.data.id}:${detail.data.updated_at}`}
                context={context}
                property={detail.data}
                allowed={allowed}
                onCreateChild={(parent) => {
                  setCreateParent(parent);
                  setCreating(true);
                  setSelected(null);
                  setNotice("");
                }}
                onSelect={select}
                onSaved={changed}
              />
            ) : null
          ) : (
            <div className="property-empty">
              <h2>A place for every operation</h2>
              <p>
                Select a property to explore its hierarchy, details and
                available actions.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
function PropertyForm({
  context,
  property,
  initialParent,
  onSaved,
  onCancel,
}: {
  context: string;
  property?: Property;
  initialParent?: Property;
  onSaved: (p: Property) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(property?.name || ""),
    [kind, setKind] = useState<PropertyKind>(
      property?.kind ||
        (initialParent
          ? initialParent.kind === "site"
            ? "building"
            : initialParent.kind === "building"
              ? "unit"
              : initialParent.kind === "unit"
                ? "room"
                : "space"
          : "site"),
    ),
    [address, setAddress] = useState(property?.address || ""),
    [description, setDescription] = useState(property?.description || "");
  const [parent, setParent] = useState<FacetItem | null>(
      initialParent
        ? {
            value: initialParent.id,
            label: initialParent.name,
            disabled: !initialParent.is_active,
            meta: {
              kind: initialParent.kind,
              slug: "",
              parent_id: initialParent.parent_id,
            },
          }
        : null,
    ),
    [asChild, setAsChild] = useState(!!initialParent),
    [validation, setValidation] = useState("");
  const mutation = useMutation({
    mutationFn: (body: PropertyInput) =>
      property
        ? propertiesApi.update(property.id, body)
        : propertiesApi.create(body),
    onSuccess: onSaved,
  });
  function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setValidation("Enter a name.");
      return;
    }
    if (!property && asChild && !parent) {
      setValidation("Choose a parent property or space.");
      return;
    }
    setValidation("");
    mutation.mutate({
      name: name.trim(),
      kind,
      address,
      description,
      ...(!property ? { parent_id: asChild ? parent?.value : null } : {}),
    });
  }
  return (
    <form onSubmit={submit}>
      <h2>{property ? "Edit details" : "Create property or space"}</h2>
      <fieldset disabled={mutation.isPending}>
        <label>
          Name
          <input
            required
            maxLength={255}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label>
          Type
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as PropertyKind)}
          >
            {Object.entries(propertyKinds).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Address
          <input
            maxLength={255}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </label>
        <label>
          Description
          <textarea
            maxLength={255}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        {!property && (
          <>
            <label className="property-checkbox">
              <input
                type="checkbox"
                checked={asChild}
                onChange={(e) => setAsChild(e.target.checked)}
              />
              Place inside another property or space
            </label>
            {asChild && (
              <FacetPicker
                facet="places"
                label="Parent property or space"
                value={parent}
                onChange={setParent}
                contextKey={context}
              />
            )}
          </>
        )}
      </fieldset>
      {(validation || mutation.isError) && (
        <p className="property-error" role="alert">
          {validation || parseApiError(mutation.error).message}
        </p>
      )}
      <div className="property-actions">
        <button type="button" disabled={mutation.isPending} onClick={onCancel}>
          Close editor
        </button>
        <button className="property-primary" disabled={mutation.isPending}>
          {mutation.isPending
            ? "Saving…"
            : property
              ? "Save details"
              : "Create property"}
        </button>
      </div>
    </form>
  );
}
function PropertyDetails({
  context,
  property,
  allowed,
  onSelect,
  onCreateChild,
  onSaved,
}: {
  context: string;
  property: PropertyDetail;
  onCreateChild: (property: Property) => void;
  allowed: (action: string) => boolean;
  onSelect: (id: string) => void;
  onSaved: (p: Property, message: string) => void;
}) {
  const [mode, setMode] = useState<"edit" | "move" | null>(null),
    [confirm, setConfirm] = useState(false),
    [parent, setParent] = useState<FacetItem | null>(null),
    [toRoot, setToRoot] = useState(false),
    [validation, setValidation] = useState("");
  const mutation = useMutation({
    mutationFn: ({
      action,
      parentId,
    }: {
      action: "move" | "toggle";
      parentId?: string | null;
    }) =>
      action === "move"
        ? propertiesApi.move(property.id, parentId ?? null)
        : propertiesApi.toggle(property.id, !property.is_active),
    onSuccess: (p) => {
      setMode(null);
      setConfirm(false);
      onSaved(p, "Property updated.");
    },
  });
  if (mode === "edit")
    return (
      <PropertyForm
        context={context}
        property={property}
        onCancel={() => setMode(null)}
        onSaved={(p) => onSaved(p, "Property details saved.")}
      />
    );
  return (
    <>
      <nav className="property-breadcrumbs" aria-label="Property hierarchy">
        {property.ancestors.map((a) => (
          <button key={a.id} onClick={() => onSelect(a.id)}>
            {a.name}
          </button>
        ))}
        <span aria-current="page">{property.name}</span>
      </nav>
      <div className="property-detail-heading">
        <div>
          <p className="property-eyebrow">
            {propertyKinds[property.kind] || property.kind}
          </p>
          <h2>{property.name}</h2>
        </div>
        <span
          className={`property-status ${property.is_active ? "active" : "archived"}`}
        >
          {property.is_active ? "Active" : "Archived"}
        </span>
      </div>
      {property.description && <p>{property.description}</p>}
      <dl className="property-facts">
        <div>
          <dt>Address</dt>
          <dd>{property.address || "No address provided"}</dd>
        </div>
        <div>
          <dt>Location</dt>
          <dd>
            {property.ancestors.length
              ? property.ancestors.map((a) => a.name).join(" / ")
              : "Top-level property"}
          </dd>
        </div>
      </dl>
      <h3>Spaces within {property.name}</h3>
      {allowed("create") && (
        <button
          disabled={!property.is_active}
          onClick={() => onCreateChild(property)}
        >
          Add child space
        </button>
      )}
      {property.children.length ? (
        <ul className="property-children">
          {property.children.map((child) => (
            <li key={child.id}>
              <button onClick={() => onSelect(child.id)}>
                {child.name}
                <small>
                  {propertyKinds[child.kind] || child.kind} ·{" "}
                  {child.is_active ? "Active" : "Archived"}
                </small>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="property-muted">No spaces within this property yet.</p>
      )}
      <div className="property-actions">
        {allowed("update") && (
          <button disabled={mutation.isPending} onClick={() => setMode("edit")}>
            Edit details
          </button>
        )}
        {allowed("move") && (
          <button
            disabled={mutation.isPending}
            onClick={() => {
              setMode("move");
              setValidation("");
            }}
          >
            Move property or space
          </button>
        )}
        {allowed("toggle_active") && (
          <button
            disabled={mutation.isPending}
            onClick={() => setConfirm(true)}
          >
            {property.is_active ? "Archive" : "Activate"}
          </button>
        )}
      </div>
      {confirm && (
        <section
          className="property-confirm"
          aria-label="Confirm status change"
        >
          <h3>
            {property.is_active
              ? "Archive this property?"
              : "Activate this property?"}
          </h3>
          <p>
            {property.is_active
              ? "Active children, relationships, reservations, occupied rooms, gates or running access operations can prevent archiving. Existing history is retained."
              : "The parent must be active before this property can be activated."}
          </p>
          <div className="property-actions">
            <button
              disabled={mutation.isPending}
              onClick={() => setConfirm(false)}
            >
              Keep current status
            </button>
            <button
              className="property-primary"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate({ action: "toggle" })}
            >
              {mutation.isPending ? "Saving…" : "Confirm status change"}
            </button>
          </div>
        </section>
      )}
      {mode === "move" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!toRoot && !parent) {
              setValidation(
                "Choose a destination or make this a top-level property.",
              );
              return;
            }
            setValidation("");
            mutation.mutate({
              action: "move",
              parentId: toRoot ? null : parent!.value,
            });
          }}
        >
          <h3>Choose a new location</h3>
          <p className="property-muted">
            All child spaces move with this property. A property cannot move
            inside itself or one of its descendants.
          </p>
          <fieldset disabled={mutation.isPending}>
            <label className="property-checkbox">
              <input
                type="checkbox"
                checked={toRoot}
                onChange={(e) => setToRoot(e.target.checked)}
              />
              Make this a top-level property
            </label>
            {!toRoot && (
              <FacetPicker
                facet="places"
                label="Destination property or space"
                value={parent}
                onChange={setParent}
                contextKey={context}
                excludeIds={[property.id]}
              />
            )}
          </fieldset>
          <div className="property-actions">
            <button
              type="button"
              disabled={mutation.isPending}
              onClick={() => setMode(null)}
            >
              Cancel move
            </button>
            <button className="property-primary" disabled={mutation.isPending}>
              {mutation.isPending ? "Moving…" : "Move here"}
            </button>
          </div>
        </form>
      )}
      {(validation || mutation.isError) && (
        <p className="property-error" role="alert">
          {validation || parseApiError(mutation.error).message}
        </p>
      )}
    </>
  );
}
