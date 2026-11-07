"use client";
import { FormEvent, useState } from "react";
import { contextApi, UseCase } from "@/features/context/api";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  ChevronRight,
  CornerDownRight,
  FolderTree,
  MapPin,
  Plus,
  Search,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/store/app-store";
import { useAuthStore } from "@/store/auth-store";
import { adminService } from "@/services/admin-service";
import { hasAdminPermission } from "@/lib/permissions";
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
import "@/app/admin/properties/styles.css";
export interface PropertyRoute { id?: string; action?: "new" | "edit" | "move"; parentId?: string }
export default function PropertiesPage({ route = {} }: { route?: PropertyRoute }) {
  const organization = useAppStore((s) => s.organization);
  const user = useAuthStore((s) => s.user);
  const context = `${organization?.id}:${user?.id}`;
  return (
    <Workspace
      key={context}
      context={context}
      enabled={!!organization?.id && !!user?.id}
      organizationName={organization?.name || "Organization"}
      route={route}
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
  organizationName,
  route,
}: {
  context: string;
  enabled: boolean;
  organizationName: string;
  route: PropertyRoute;
}) {
  const router = useRouter();
  const client = useQueryClient();
  const [page, setPage] = useState(1),
    [search, setSearch] = useState(""),
    [searchInput, setSearchInput] = useState("");
  const [kind, setKind] = useState(""),
    [status, setStatus] = useState("active"),
    [rootOnly, setRootOnly] = useState(true);
  const selected = route.id || null;
  const creating = route.action === "new";
  const notice = "";
  const parent = useQuery({queryKey:["properties",context,"detail",route.parentId],queryFn:()=>propertiesApi.get(route.parentId!),enabled:!!route.parentId && creating});
  const createParent = parent.data;
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
    hasAdminPermission(profile.data, `places.${action}`);
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
  function select(id: string) { router.push(`/admin/properties/${id}`); }
  async function changed(property: Property, _message?: string) {
    await client.invalidateQueries({queryKey:["properties",context]});
    router.push(`/admin/properties/${property.id}`);
  }
  if (!enabled || profile.isPending || !profile.isFetchedAfterMount)
    return <p role="status">Loading property permissions…</p>;
  if (profile.isError)
    return <ErrorState error={profile.error} retry={() => profile.refetch()} />;
  if (!allowed("list"))
    return <p role="alert">You do not have permission to view properties.</p>;
  if (route.action === "new" && !allowed("create")) return <p role="alert">You do not have permission to create properties.</p>;
  if ((route.action === "edit" && !allowed("update")) || (route.action === "move" && !allowed("move"))) return <p role="alert">You do not have permission for this action.</p>;
  if (creating && route.parentId && parent.isPending) return <p role="status">Loading parent property…</p>;
  if (creating && parent.isError) return <ErrorState error={parent.error} retry={() => parent.refetch()} />;
  const inRecord = !!selected || creating;
  return (
    <main className="property-workspace">
      <header className="property-heading">
        <div>
          <p className="property-eyebrow">
            <FolderTree size={14} aria-hidden="true" />
            {organizationName}
            <span>/</span>Property directory
          </p>
          <h1>
            Properties<span className="property-heading-period">.</span>
          </h1>
          <p className="property-heading-copy">
            The properties your organization operates. Every building, room and
            space in context.
          </p>
        </div>
        {allowed("create") && (
          <button
            className="property-primary"
            onClick={() => {
              router.push("/admin/properties/new");
            }}
          >
            <Plus size={16} aria-hidden="true" />
            New property or space
          </button>
        )}
      </header>
      <div className="property-viewline">
        <div>
          <span className="property-view-index">01</span>
          {inRecord ? (
            <button
              className="property-directory-back"
              onClick={() => {
                router.push("/admin/properties");
              }}
            >
              Directory
            </button>
          ) : (
            <strong>Directory</strong>
          )}
          {inRecord && (
            <>
              <ChevronRight size={14} aria-hidden="true" />
              <span>{creating ? "New structure" : "Property workspace"}</span>
            </>
          )}
        </div>
        <span className="property-view-hint">
          {inRecord
            ? "Organization / Property / Space"
            : "A connected record of your properties"}
        </span>
      </div>
      {notice && (
        <p className="property-notice" role="status">
          {notice}
        </p>
      )}
      {!inRecord ? (
        <section className="property-registry" aria-label="Property list">
          <div className="property-toolbar">
            <form
              className="property-search"
              onSubmit={(e) => {
                e.preventDefault();
                setSearch(searchInput.trim());
                setPage(1);
              }}
            >
              <label>
                <span className="sr-only">Search properties</span>
                <Search size={16} aria-hidden="true" />
                <input
                  placeholder="Find a property or space…"
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
                <span>Type</span>
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
                <span>Status</span>
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
          </div>
          <div className="property-registry-meta">
            <label className="property-checkbox">
              <input
                type="checkbox"
                checked={rootOnly}
                onChange={(e) => {
                  setRootOnly(e.target.checked);
                  setPage(1);
                }}
              />
              Top-level within this organization
            </label>
            <span>
              {list.data?.total ?? "—"} records{" "}
              {search && <span>matching “{search}”</span>}
            </span>
          </div>
          <div className="property-registry-columns" aria-hidden="true">
            <span>Property or space</span>
            <span>Structure</span>
            <span>Location</span>
            <span />
          </div>
          {list.isPending ? (
            <div className="property-loading" role="status">
              <span className="property-skeleton" />
              <span className="property-skeleton" />
              <span className="property-skeleton" />
              Loading properties…
            </div>
          ) : list.isError ? (
            <ErrorState error={list.error} retry={() => list.refetch()} />
          ) : (
            <>
              {list.data?.items.length ? (
                <ul className="property-list">
                  {list.data.items.map((property) => (
                    <li key={property.id}>
                      <button
                        aria-label={`${property.name} ${property.is_active ? "Active" : "Archived"}`}
                        disabled={!allowed("show")}
                        onClick={() => select(property.id)}
                      >
                        <span className="property-registry-place">
                          <StructureMark kind={property.kind} />
                          <span>
                            <strong>{property.name}</strong>
                            <span
                              className={`property-status ${property.is_active ? "active" : "archived"}`}
                            >
                              {property.is_active ? "Active" : "Archived"}
                            </span>
                          </span>
                        </span>
                        <span className="property-registry-kind">
                          {propertyKinds[property.kind] || "Space"}
                        </span>
                        <span className="property-registry-location">
                          <MapPin size={14} aria-hidden="true" />
                          {property.address ||
                            (property.parent_id
                              ? "Inside another property or space"
                              : "Top level in organization")}
                        </span>
                        <ArrowUpRight
                          className="property-open-arrow"
                          size={19}
                          aria-hidden="true"
                        />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="property-empty">
                  <StructureMark kind="building" />
                  <h2>No properties found</h2>
                  <p>
                    {search || kind || status !== "active"
                      ? "Try a different search or filter to find your property."
                      : "Add a building or space to begin mapping your organization’s structure."}
                  </p>
                </div>
              )}
              <nav
                className="property-pagination"
                aria-label="Property pagination"
              >
                <span>
                  Showing {list.data?.items.length || 0} of{" "}
                  {list.data?.total || 0} properties and spaces
                </span>
                <div>
                  <button
                    disabled={page === 1 || list.isFetching}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </button>
                  <span>Page {page}</span>
                  <button
                    disabled={
                      page >= (list.data?.total_pages || 0) || list.isFetching
                    }
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </button>
                </div>
              </nav>
            </>
          )}
        </section>
      ) : (
        <section
          className={`property-record ${creating ? "is-editing" : ""}`}
          aria-label="Property details"
        >
          {creating && allowed("create") ? (
            <PropertyForm
              key={createParent ? `child:${createParent.id}` : "new-root"}
              context={context}
              initialParent={createParent}
              onCancel={() => router.push("/admin/properties")}
              onSaved={changed}
            />
          ) : selected && allowed("show") ? (
            detail.isPending ? (
              <p className="property-loading" role="status">
                Loading property…
              </p>
            ) : detail.isError ? (
              <ErrorState error={detail.error} retry={() => detail.refetch()} />
            ) : detail.data ? (
              <PropertyDetails
                key={`${detail.data.id}:${detail.data.updated_at}`}
                context={context}
                property={detail.data}
                allowed={allowed}
                onCreateChild={(parent) => router.push(`/admin/properties/new?parent=${parent.id}`)}
                routeAction={route.action}
                onSelect={select}
                onSaved={changed}
              />
            ) : null
          ) : (
            <p className="property-empty">
              Select a record from the directory to continue.
            </p>
          )}
        </section>
      )}
    </main>
  );
}
function StructureMark({ kind }: { kind: PropertyKind }) {
  const paths: Record<PropertyKind, string> = {
    site: "M8 38V16L24 6l16 10v22M4 38h40M18 38V26h12v12M15 18h3m12 0h3",
    building:
      "M12 39V8h24v31M7 39h34M19 15h3m4 0h3m-10 7h3m4 0h3m-10 7h3m4 0h3M21 39v-5h6v5",
    unit: "M8 39V20l16-12 16 12v19M5 39h38M20 39V27h8v12M14 23h3m14 0h3",
    room: "M12 39V8h24v31M7 39h34M17 39V13h14v26M25 26h2",
    space: "M8 10h32v28H8zM8 24h32M24 10v28M12 14h7m10 0h7m-24 17h7m10 0h7",
  };
  return (
    <span className={`property-structure-mark kind-${kind}`} aria-hidden="true">
      <svg
        viewBox="0 0 48 48"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={paths[kind] || paths.space} />
      </svg>
    </span>
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
  const catalog=useQuery({queryKey:["context-catalog",context],queryFn:contextApi.catalog});
  const organization=useAppStore(s=>s.organization);
  const [buildingType,setBuildingType]=useState(property?.building_type||"");
  const [useCase,setUseCase]=useState<UseCase|"">(property?.use_case||"");
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
    mutationFn: (
      input:
        | { mode: "create"; body: PropertyInput }
        | { mode: "update"; body: Omit<PropertyInput, "kind" | "parent_id" | "building_type" | "use_case"> },
    ) =>
      input.mode === "update"
        ? propertiesApi.update(property!.id, input.body)
        : propertiesApi.create(input.body),
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
    const body = { name: name.trim(), address, description };
    if (property) {
      mutation.mutate({ mode: "update", body });
      return;
    }
    mutation.mutate({
      mode: "create",
      body: { ...body, kind, building_type: buildingType||null, use_case: useCase||null, parent_id: asChild ? parent?.value : null },
    });
  }
  return (
    <form className="property-editor" onSubmit={submit}>
      <p className="property-eyebrow">
        {property
          ? property.name
          : initialParent
            ? `Inside ${initialParent.name}`
            : "Top level within your organization"}
      </p>
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
        {property ? (
          <div className="property-fixed-kind">
            <span>Structure type</span>
            <strong>{propertyKinds[property.kind]}</strong>
            <small>
              This structure is fixed. Use Move to change where it belongs.
            </small>
          </div>
        ) : (
          <label>
            Structure type
            <select
              value={kind}
              onChange={(e) => {setKind(e.target.value as PropertyKind);setBuildingType("");}}
            >
              {Object.entries(propertyKinds).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <small>
              Use a site for a top-level property or a separately managed estate.
            </small>
          </label>
        )}
        {!property ? <>
          {kind !== "site" && <label>Building type<select value={buildingType} onChange={e=>setBuildingType(e.target.value)}><option value="">Unspecified</option>{catalog.data?.building_types.filter(t=>t.kinds.includes(kind)).map(t=><option key={t.value} value={t.value}>{t.label}</option>)}</select></label>}
          {organization?.use_case==="mixed_use"&&<label>Operating use case<select value={useCase} onChange={e=>setUseCase(e.target.value as UseCase|"")}><option value="">Inherit parent context</option>{catalog.data?.use_cases.map(c=><option key={c.value} value={c.value}>{c.label}</option>)}</select><small>Fixed at creation; this governs workflows within this property.</small></label>}
          {catalog.isError&&<p role="alert">Could not load building types. <button type="button" onClick={()=>catalog.refetch()}>Retry</button></p>}
        </> : <div className="property-fixed-kind"><span>Building type / operating context</span><strong>{catalog.data?.building_types.find(t=>t.value===property.building_type)?.label||"Unspecified"} · {catalog.data?.use_cases.find(c=>c.value===property.use_case)?.label||"Inherited"}</strong><small>Classification is fixed at creation.</small></div>}
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
  routeAction,
}: {
  routeAction?: "new" | "edit" | "move";
  context: string;
  property: PropertyDetail;
  onCreateChild: (property: Property) => void;
  allowed: (action: string) => boolean;
  onSelect: (id: string) => void;
  onSaved: (p: Property, message: string) => void;
}) {
  const router = useRouter();
  const setSelectedProperty=useAppStore(s=>s.setSelectedProperty);
  const mode = routeAction === "edit" || routeAction === "move" ? routeAction : null;
  const setMode = (value: "edit" | "move" | null) => router.push(`/admin/properties/${property.id}${value ? "/"+value : ""}`);
  const [confirm, setConfirm] = useState(false),
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
        <StructureMark kind={property.kind} />
        <div>
          <p className="property-eyebrow">
            {propertyKinds[property.kind] || "Space"}
          </p>
          <h2>{property.name}</h2>
          {property.description && <p>{property.description}</p>}
        </div>
        <span
          className={`property-status ${property.is_active ? "active" : "archived"}`}
        >
          {property.is_active ? "Active" : "Archived"}
        </span>
      </div>
      <div className="property-actions property-record-actions">
        <button className="property-primary" onClick={()=>{setSelectedProperty({id:property.id,name:property.name});router.push("/admin");}}>Open workspace</button>
        <button onClick={()=>{setSelectedProperty({id:property.id,name:property.name});router.push("/admin/people");}}>Manage people</button>
        {allowed("update") && (
          <button disabled={mutation.isPending} onClick={() => setMode("edit")}>
            Edit details
          </button>
        )}
        {property.kind !== "site" && allowed("move") && (
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
        {property.kind !== "site" && allowed("toggle_active") && (
          <button
            disabled={mutation.isPending}
            onClick={() => setConfirm(true)}
          >
            {property.is_active ? "Archive" : "Activate"}
          </button>
        )}
      </div>
      <dl className="property-facts">
        <div>
          <dt>
            <MapPin size={13} aria-hidden="true" />
            Address
          </dt>
          <dd>{property.address || "No address provided"}</dd>
        </div>
        <div>
          <dt>
            <CornerDownRight size={13} aria-hidden="true" />
            Belongs to
          </dt>
          <dd>
            {property.ancestors.length
              ? property.ancestors.map((a) => a.name).join(" / ")
              : "Top level within this organization"}
          </dd>
        </div>
        <div>
          <dt>Structure</dt>
          <dd>
            {propertyKinds[property.kind]}
            <small>Fixed at creation</small>
          </dd>
        </div>
      </dl>
      <section className="property-structure" aria-label="Property structure">
        <div className="property-section-heading">
          <div>
            <p className="property-eyebrow">SPATIAL HIERARCHY</p>
            <h3>Inside {property.name}</h3>
          </div>
          <span className="property-child-count">
            {property.children.length} direct{" "}
            {property.children.length === 1 ? "space" : "spaces"}
          </span>
          {allowed("create") && (
            <button
              disabled={!property.is_active}
              onClick={() => onCreateChild(property)}
            >
              <Plus size={15} aria-hidden="true" />
              Add child space
            </button>
          )}
        </div>
        <div className="property-structure-canvas">
          <div className="property-current-node">
            <StructureMark kind={property.kind} />
            <span>
              <small>{propertyKinds[property.kind]}</small>
              <strong>{property.name}</strong>
            </span>
            <span
              className={`property-node-dot ${property.is_active ? "active" : "archived"}`}
              title={property.is_active ? "Active" : "Archived"}
            />
          </div>
          {property.children.length ? (
            <ul className="property-children">
              {property.children.map((child) => (
                <li key={child.id}>
                  <button
                    className={child.is_active ? "" : "is-archived"}
                    onClick={() => onSelect(child.id)}
                  >
                    <StructureMark kind={child.kind} />
                    <span>
                      <strong>{child.name}</strong>
                      <small>
                        {propertyKinds[child.kind]} ·{" "}
                        {child.is_active ? "Active" : "Archived"}
                      </small>
                    </span>
                    <ArrowUpRight size={16} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="property-structure-empty">
              <span className="property-empty-connector" />
              <p>
                No spaces inside this{" "}
                {propertyKinds[property.kind].toLowerCase()} yet.
              </p>
              <small>
                {property.is_active
                  ? "Add a child space to extend this hierarchy."
                  : "Activate this property before adding child spaces."}
              </small>
            </div>
          )}
        </div>
      </section>
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
          className="property-editor property-move-editor"
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
