"use client";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { contextApi, UseCase } from "@/features/context/api";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowUpRight,
  ChevronRight,
  CornerDownRight,
  Download,
  FolderTree,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  TriangleAlert,
  Users,
  X,
} from "lucide-react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { useAppStore } from "@/store/app-store";
import { useAuthStore } from "@/store/auth-store";
import { adminService } from "@/services/admin-service";
import { hasAdminPermission } from "@/lib/permissions";
import { parseApiError } from "@/lib/error-utils";
import { FacetItem, FacetPicker } from "@/components/facets/FacetPicker";
import { SetupProgress } from "@/components/onboarding/SetupProgress";
import { Button } from "@/components/ui/Button";
import {
  DataTable,
  type BulkAction,
  type Column,
} from "@/components/ui/DataTable";
import { Field, fieldControlClassName } from "@/components/ui/form/Field";
import { FormErrorSummary } from "@/components/ui/form/FormErrorSummary";
import { FormSection } from "@/components/ui/form/FormSection";
import { Modal } from "@/components/ui/Modal";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import {
  Property,
  PropertyDetail,
  PropertyInput,
  PropertyKind,
  propertiesApi,
  propertyKinds,
} from "@/features/properties/api";
import "@/app/admin/properties/styles.css";
export interface PropertyRoute {
  id?: string;
  action?: "new" | "edit" | "move";
  parentId?: string;
  setup?: "first-place";
}

type PropertyDirectoryState = {
  page: number;
  search: string;
  kind: string;
  status: "active" | "archived" | "all";
  rootOnly: boolean;
};

type PropertyListResult = {
  items: Property[];
  page: number;
  total_pages: number;
  total: number;
};

const DEFAULT_DIRECTORY_STATE: PropertyDirectoryState = {
  page: 1,
  search: "",
  kind: "",
  status: "active",
  rootOnly: true,
};

function readDirectoryState(
  params: Pick<URLSearchParams, "get">,
): PropertyDirectoryState {
  const pageValue = Number.parseInt(params.get("page") || "1", 10);
  const status = params.get("status");
  return {
    page: Number.isFinite(pageValue) && pageValue > 0 ? pageValue : 1,
    search: (params.get("search") || "").slice(0, 100),
    kind: params.get("kind") || "",
    status: status === "archived" || status === "all" ? status : "active",
    rootOnly: params.get("all_levels") !== "true",
  };
}

function writeDirectoryState(
  current: URLSearchParams,
  next: PropertyDirectoryState,
) {
  const params = new URLSearchParams(current.toString());
  const values: Array<[string, string | undefined]> = [
    ["page", next.page === 1 ? undefined : String(next.page)],
    ["search", next.search || undefined],
    ["kind", next.kind || undefined],
    ["status", next.status === "active" ? undefined : next.status],
    ["all_levels", next.rootOnly ? undefined : "true"],
  ];
  values.forEach(([key, value]) => {
    if (value) params.set(key, value);
    else params.delete(key);
  });
  return params;
}
export default function PropertiesPage({
  route = {},
}: {
  route?: PropertyRoute;
}) {
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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryString = searchParams?.toString() || "";
  const initialDirectory = readDirectoryState(new URLSearchParams(queryString));
  const client = useQueryClient();
  const [page, setPage] = useState(initialDirectory.page),
    [search, setSearch] = useState(initialDirectory.search),
    [searchInput, setSearchInput] = useState(initialDirectory.search);
  const [kind, setKind] = useState(initialDirectory.kind),
    [status, setStatus] = useState(initialDirectory.status),
    [rootOnly, setRootOnly] = useState(initialDirectory.rootOnly);
  const selected = route.id || null;
  const creating = route.action === "new";
  const notice = "";

  useEffect(() => {
    const next = readDirectoryState(new URLSearchParams(queryString));
    setPage(next.page);
    setSearch(next.search);
    setSearchInput(next.search);
    setKind(next.kind);
    setStatus(next.status);
    setRootOnly(next.rootOnly);
  }, [queryString]);

  const updateDirectory = useCallback(
    (next: PropertyDirectoryState) => {
      setPage(next.page);
      setSearch(next.search);
      setSearchInput(next.search);
      setKind(next.kind);
      setStatus(next.status);
      setRootOnly(next.rootOnly);
      const params = writeDirectoryState(
        new URLSearchParams(queryString),
        next,
      );
      const nextQuery = params.toString();
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
        scroll: false,
      });
    },
    [pathname, queryString, router],
  );

  function currentDirectory(
    updates: Partial<PropertyDirectoryState> = {},
  ): PropertyDirectoryState {
    return { page, search, kind, status, rootOnly, ...updates };
  }

  const parent = useQuery({
    queryKey: ["properties", context, "detail", route.parentId],
    queryFn: () => propertiesApi.get(route.parentId!),
    enabled: !!route.parentId && creating,
  });
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
    placeholderData: keepPreviousData,
  });
  const [lastSuccessfulList, setLastSuccessfulList] =
    useState<PropertyListResult>();
  useEffect(() => {
    if (list.data) setLastSuccessfulList(list.data);
  }, [list.data]);
  const visibleList = list.data ?? lastSuccessfulList;
  const detail = useQuery({
    queryKey: ["properties", context, "detail", selected],
    queryFn: () => propertiesApi.get(selected!),
    enabled: !!selected && allowed("show"),
  });
  function select(id: string) {
    router.push(`/admin/properties/${id}`);
  }
  async function changed(property: Property, _message?: string) {
    await client.invalidateQueries({ queryKey: ["properties", context] });
    router.push(`/admin/properties/${property.id}`);
  }
  if (!enabled || profile.isPending || !profile.isFetchedAfterMount)
    return <p role="status">Loading property permissions…</p>;
  if (profile.isError)
    return <ErrorState error={profile.error} retry={() => profile.refetch()} />;
  if (!allowed("list"))
    return <p role="alert">You do not have permission to view properties.</p>;
  if (route.action === "new" && !allowed("create"))
    return <p role="alert">You do not have permission to create properties.</p>;
  if (
    (route.action === "edit" && !allowed("update")) ||
    (route.action === "move" && !allowed("move"))
  )
    return <p role="alert">You do not have permission for this action.</p>;
  if (creating && route.parentId && parent.isPending)
    return <p role="status">Loading parent property…</p>;
  if (creating && parent.isError)
    return <ErrorState error={parent.error} retry={() => parent.refetch()} />;
  const inRecord = !!selected || creating;
  const hasActiveFilters =
    !!search ||
    !!kind ||
    status !== DEFAULT_DIRECTORY_STATE.status ||
    !rootOnly;
  const retainStaleRows = !!visibleList && list.isError;
  const columns: Column<Property>[] = [
    {
      key: "name",
      header: "Property",
      sortable: true,
      accessor: (property) => (
        <span className="property-registry-place">
          <StructureMark kind={property.kind} />
          <span>
            <strong>{property.name}</strong>
            <span
              className={`property-status ${
                property.is_active ? "active" : "archived"
              }`}
            >
              {property.is_active ? "Active" : "Archived"}
            </span>
          </span>
        </span>
      ),
    },
    {
      key: "kind",
      header: "Structure",
      sortable: true,
      accessor: (property) => (
        <span className="property-registry-kind">
          {propertyKinds[property.kind] || "Space"}
        </span>
      ),
    },
    {
      key: "address",
      header: "Location",
      sortable: true,
      accessor: (property) => (
        <span className="property-registry-location">
          <MapPin size={14} aria-hidden="true" />
          <span>
            {property.address ||
              (property.parent_id
                ? "Inside another property"
                : "Top level in organization")}
          </span>
        </span>
      ),
    },
    {
      key: "actions",
      header: "Action",
      mobileHide: true,
      accessor: (property) => (
        <button
          className="property-row-action"
          aria-label={`Open ${property.name}`}
          disabled={!allowed("show")}
          onClick={() => select(property.id)}
        >
          Open
          <ArrowUpRight size={16} aria-hidden="true" />
        </button>
      ),
    },
  ];
  const bulkActions: BulkAction[] = [
    {
      label: "Export selected",
      icon: Download,
      onClick: (ids) => {
        const selectedItems =
          visibleList?.items.filter((property) => ids.includes(property.id)) ??
          [];
        const values = [
          ["Name", "Kind", "Address", "Status"],
          ...selectedItems.map((property) => [
            property.name,
            propertyKinds[property.kind] || property.kind,
            property.address || "",
            property.is_active ? "Active" : "Archived",
          ]),
        ];
        const csv = values
          .map((row) =>
            row
              .map((value) => `"${String(value).replaceAll('"', '""')}"`)
              .join(","),
          )
          .join("\n");
        const url = URL.createObjectURL(
          new Blob([csv], { type: "text/csv;charset=utf-8" }),
        );
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "properties.csv";
        anchor.click();
        URL.revokeObjectURL(url);
      },
    },
  ];
  return (
    <main className="property-workspace">
      <header className="property-heading">
        <div>
          <p className="property-eyebrow">
            <FolderTree size={14} aria-hidden="true" />
            {organizationName}
            <span>/</span>Property directory
          </p>
          <h1>Properties</h1>
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
            New property
          </button>
        )}
      </header>
      {inRecord && (
        <div className="property-viewline">
          <div>
            <span className="property-view-index">01</span>
            <button
              className="property-directory-back"
              onClick={() => {
                router.push("/admin/properties");
              }}
            >
              Properties
            </button>
            <ChevronRight size={14} aria-hidden="true" />
            <span>{creating ? "New property" : "Property record"}</span>
          </div>
          <span className="property-view-hint">
            {organizationName} / Property / Record
          </span>
        </div>
      )}
      {notice && (
        <p className="property-notice" role="status">
          {notice}
        </p>
      )}
      {!inRecord ? (
        <section
          className="property-registry"
          aria-labelledby="property-register-heading"
        >
          <h2 id="property-register-heading" className="sr-only">
            Property register
          </h2>
          <div className="property-toolbar">
            <form
              className="property-search"
              onSubmit={(e) => {
                e.preventDefault();
                const nextSearch = searchInput.trim();
                updateDirectory(
                  currentDirectory({ search: nextSearch, page: 1 }),
                );
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
                  autoComplete="off"
                />
              </label>
              <button type="submit">Search</button>
            </form>
            <div className="property-filters">
              <label>
                <span>Type</span>
                <select
                  value={kind}
                  onChange={(e) => {
                    updateDirectory(
                      currentDirectory({ kind: e.target.value, page: 1 }),
                    );
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
                    updateDirectory(
                      currentDirectory({
                        status: e.target
                          .value as PropertyDirectoryState["status"],
                        page: 1,
                      }),
                    );
                  }}
                >
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                  <option value="all">All statuses</option>
                </select>
              </label>
              {hasActiveFilters && (
                <button
                  type="button"
                  className="property-clear-filters"
                  onClick={() => updateDirectory(DEFAULT_DIRECTORY_STATE)}
                >
                  <X size={14} aria-hidden="true" />
                  Clear all
                </button>
              )}
            </div>
          </div>
          <div className="property-registry-meta">
            <label className="property-checkbox">
              <input
                type="checkbox"
                checked={rootOnly}
                onChange={(e) => {
                  updateDirectory(
                    currentDirectory({
                      rootOnly: e.target.checked,
                      page: 1,
                    }),
                  );
                }}
              />
              Top-level within this organization
            </label>
            <span className="property-result-count" aria-live="polite">
              {list.isPending && !visibleList
                ? "Loading records"
                : `${visibleList?.total ?? 0} ${visibleList?.total === 1 ? "record" : "records"}`}
              {search && (!list.isPending || visibleList) ? (
                <span> matching “{search}”</span>
              ) : null}
              {list.isFetching && visibleList ? (
                <span className="property-refresh-status">
                  <RefreshCw size={12} aria-hidden="true" />
                  Updating
                </span>
              ) : null}
            </span>
          </div>
          {list.isPending && !visibleList ? (
            <div className="property-loading" role="status">
              <span className="property-skeleton" />
              <span className="property-skeleton" />
              <span className="property-skeleton" />
              Loading properties…
            </div>
          ) : list.isError && !visibleList ? (
            <ErrorState error={list.error} retry={() => list.refetch()} />
          ) : (
            <>
              {retainStaleRows ? (
                <div className="property-stale" role="status">
                  <span>
                    <TriangleAlert size={16} aria-hidden="true" />
                    The latest update failed. The last available records remain
                    visible.
                  </span>
                  <button type="button" onClick={() => list.refetch()}>
                    <RefreshCw size={14} aria-hidden="true" />
                    Retry update
                  </button>
                </div>
              ) : null}
              <DataTable
                data={visibleList?.items ?? []}
                columns={columns}
                tableLabel="Properties register"
                searchable={false}
                serverSide
                total={visibleList?.total ?? 0}
                currentPage={page}
                onPageChange={(nextPage) =>
                  updateDirectory(
                    currentDirectory({ page: Math.max(1, nextPage) }),
                  )
                }
                pageSize={10}
                pageSizeOptions={[10]}
                selectable
                getRowId={(property) => property.id}
                bulkActions={bulkActions}
                emptyMessage={
                  search || kind || status !== "active"
                    ? "No properties match these filters"
                    : "No properties found"
                }
                mobileSummary={(property) => (
                  <div className="flex items-start gap-3">
                    <StructureMark kind={property.kind} />
                    <div className="min-w-0 flex-1">
                      <strong className="block truncate text-sm">
                        {property.name}
                      </strong>
                      <span className="block text-xs text-[var(--vms-ink-muted)]">
                        {propertyKinds[property.kind] || "Space"} ·{" "}
                        {property.is_active ? "Active" : "Archived"}
                      </span>
                      <span className="mt-2 flex items-center gap-1.5 text-xs text-[var(--vms-ink-muted)]">
                        <MapPin size={13} aria-hidden="true" />
                        {property.address || "Location not set"}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        disabled={!allowed("show")}
                        onClick={() => select(property.id)}
                      >
                        Open property
                      </Button>
                    </div>
                  </div>
                )}
              />
            </>
          )}
        </section>
      ) : (
        <section
          className={`property-record ${creating ? "is-editing" : ""}`}
          aria-label="Property details"
        >
          {creating && allowed("create") ? (
            <>
              {route.setup === "first-place" ? (
                <div className="mb-5">
                  <SetupProgress currentStep="workspace" />
                </div>
              ) : null}
              <PropertyForm
                key={createParent ? `child:${createParent.id}` : "new-root"}
                context={context}
                initialParent={createParent}
                onCancel={() => router.push("/admin/properties")}
                onSaved={changed}
              />
            </>
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
                onCreateChild={(parent) =>
                  router.push(`/admin/properties/new?parent=${parent.id}`)
                }
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
  const catalog = useQuery({
    queryKey: ["context-catalog", context],
    queryFn: contextApi.catalog,
  });
  const organization = useAppStore((state) => state.organization);
  const inferredKind: PropertyKind =
    property?.kind ||
    (initialParent
      ? initialParent.kind === "site"
        ? "building"
        : initialParent.kind === "building"
          ? "unit"
          : initialParent.kind === "unit"
            ? "room"
            : "space"
      : "site");
  const initialParentFacet: FacetItem | null = initialParent
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
    : null;
  const [name, setName] = useState(property?.name || "");
  const [kind, setKind] = useState<PropertyKind>(inferredKind);
  const [buildingType, setBuildingType] = useState(
    property?.building_type || "",
  );
  const [useCase, setUseCase] = useState<UseCase | "">(
    property?.use_case || "",
  );
  const [address, setAddress] = useState(property?.address || "");
  const [description, setDescription] = useState(property?.description || "");
  const [parent, setParent] = useState<FacetItem | null>(initialParentFacet);
  const [asChild, setAsChild] = useState(!!initialParent);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const initialValue = useMemo(
    () =>
      JSON.stringify({
        name: property?.name || "",
        kind: inferredKind,
        buildingType: property?.building_type || "",
        useCase: property?.use_case || "",
        address: property?.address || "",
        description: property?.description || "",
        parentId: initialParent?.id || null,
        asChild: !!initialParent,
      }),
    [inferredKind, initialParent, property],
  );
  const isDirty =
    initialValue !==
    JSON.stringify({
      name,
      kind,
      buildingType,
      useCase,
      address,
      description,
      parentId: parent?.value || null,
      asChild,
    });
  const canLeave = useUnsavedChanges(isDirty);
  const mutation = useMutation({
    mutationFn: (
      input:
        | { mode: "create"; body: PropertyInput }
        | {
            mode: "update";
            body: Omit<
              PropertyInput,
              "kind" | "parent_id" | "building_type" | "use_case"
            >;
          },
    ) =>
      input.mode === "update"
        ? propertiesApi.update(property!.id, input.body)
        : propertiesApi.create(input.body),
    onSuccess: (saved) => {
      toast.success(property ? "Property details saved." : "Property created.");
      onSaved(saved);
    },
    onError: (error) => {
      setServerError(parseApiError(error).message);
    },
  });
  const clearError = (field: string) =>
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  const close = () => {
    if (canLeave()) onCancel();
  };

  function submit(event: FormEvent) {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!name.trim()) nextErrors["property-name"] = "Enter a property name.";
    if (!property && asChild && !parent)
      nextErrors["property-parent"] =
        "Choose the property or space that contains this record.";
    setErrors(nextErrors);
    setServerError("");
    if (Object.keys(nextErrors).length) return;

    const body = {
      name: name.trim(),
      address: address.trim(),
      description: description.trim(),
    };
    if (property) {
      mutation.mutate({ mode: "update", body });
      return;
    }
    mutation.mutate({
      mode: "create",
      body: {
        ...body,
        kind,
        building_type: buildingType || null,
        use_case: useCase || null,
        parent_id: asChild ? parent?.value || null : null,
      },
    });
  }

  const title = property ? "Edit property details" : "Add property";
  const availableBuildingTypes =
    catalog.data?.building_types.filter((type) => type.kinds.includes(kind)) ||
    [];
  const selectedBuildingType = catalog.data?.building_types.find(
    (type) => type.value === property?.building_type,
  )?.label;
  const selectedUseCase = catalog.data?.use_cases.find(
    (option) => option.value === property?.use_case,
  )?.label;

  return (
    <form
      className="property-editor property-form"
      onSubmit={submit}
      noValidate
      aria-labelledby="property-form-title"
    >
      <header className="property-form-header">
        <div>
          <p className="property-eyebrow">
            {property
              ? property.name
              : initialParent
                ? `Inside ${initialParent.name}`
                : "Top level within your organization"}
          </p>
          <h2 id="property-form-title">{title}</h2>
          <p>
            {property
              ? "Update the public details. Structure and classification stay fixed."
              : "Create a managed property or a child space inside the current organization hierarchy."}
          </p>
        </div>
        <span className="property-form-mode">
          {property ? "Editable details" : "New record"}
        </span>
      </header>

      <FormErrorSummary errors={errors} />
      {serverError ? (
        <div className="property-form-server-error" role="alert">
          <strong>We could not save this property.</strong>
          <span>{serverError}</span>
          <button type="button" onClick={() => setServerError("")}>
            Dismiss
          </button>
        </div>
      ) : null}

      <fieldset
        disabled={mutation.isPending || catalog.isPending}
        className="property-form-fields"
      >
        <div className="property-form-sections">
          <FormSection
            title="Property identity"
            description="Use the name and address operators recognise in daily work."
          >
            <Field
              id="property-name"
              label="Property name"
              required
              error={errors["property-name"]}
              description="Shown across Workspaces, People and Access."
            >
              {(control) => (
                <input
                  {...control}
                  className={fieldControlClassName}
                  autoComplete="off"
                  maxLength={255}
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    clearError("property-name");
                  }}
                />
              )}
            </Field>

            {property ? (
              <dl className="property-fixed-kind">
                <div>
                  <dt>Structure</dt>
                  <dd>{propertyKinds[property.kind]}</dd>
                </div>
                <div>
                  <dt>Building type</dt>
                  <dd>{selectedBuildingType || "Unspecified"}</dd>
                </div>
                <div>
                  <dt>Operating context</dt>
                  <dd>{selectedUseCase || "Inherited"}</dd>
                </div>
              </dl>
            ) : (
              <Field
                id="property-kind"
                label="Structure type"
                required
                description="Structure is fixed after creation. Use Move to change the hierarchy location."
              >
                {(control) => (
                  <select
                    {...control}
                    className={fieldControlClassName}
                    value={kind}
                    onChange={(event) => {
                      setKind(event.target.value as PropertyKind);
                      setBuildingType("");
                    }}
                  >
                    {Object.entries(propertyKinds).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
            )}

            <Field
              id="property-address"
              label="Address"
              description="Street, building and locality used by operators."
            >
              {(control) => (
                <input
                  {...control}
                  className={fieldControlClassName}
                  autoComplete="street-address"
                  maxLength={255}
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                />
              )}
            </Field>
            <Field
              id="property-description"
              label="Description"
              description={`${description.length}/255 characters`}
            >
              {(control) => (
                <textarea
                  {...control}
                  className={`${fieldControlClassName} min-h-28 resize-y py-3`}
                  rows={4}
                  maxLength={255}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              )}
            </Field>
          </FormSection>

          {!property ? (
            <FormSection
              title="Operating classification"
              description="These values govern available specialist workflows. They are fixed after creation."
            >
              {kind !== "site" ? (
                <Field
                  id="property-building-type"
                  label="Building type"
                  description="Choose a catalogued type that matches this structure."
                >
                  {(control) => (
                    <select
                      {...control}
                      className={fieldControlClassName}
                      value={buildingType}
                      onChange={(event) => setBuildingType(event.target.value)}
                    >
                      <option value="">Unspecified</option>
                      {availableBuildingTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  )}
                </Field>
              ) : (
                <p className="property-form-note">
                  A site is the top-level structural record. Building type is
                  not assigned to sites.
                </p>
              )}
              {organization?.use_case === "mixed_use" ? (
                <Field
                  id="property-use-case"
                  label="Operating context"
                  description="Choose an explicit context or inherit from the selected parent."
                >
                  {(control) => (
                    <select
                      {...control}
                      className={fieldControlClassName}
                      value={useCase}
                      onChange={(event) =>
                        setUseCase(event.target.value as UseCase | "")
                      }
                    >
                      <option value="">Inherit parent context</option>
                      {catalog.data?.use_cases.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  )}
                </Field>
              ) : null}
              {catalog.isError ? (
                <div className="property-form-inline-error" role="alert">
                  <span>
                    Could not load classification options. Editing is paused to
                    avoid unsupported values.
                  </span>
                  <button type="button" onClick={() => catalog.refetch()}>
                    Retry
                  </button>
                </div>
              ) : null}
            </FormSection>
          ) : null}

          {!property ? (
            <FormSection
              title="Hierarchy"
              description="Create a top-level site or place this record inside an existing structure."
            >
              <label className="property-form-checkbox">
                <input
                  type="checkbox"
                  checked={asChild}
                  disabled={!!initialParent}
                  onChange={(event) => {
                    setAsChild(event.target.checked);
                    if (!event.target.checked) setParent(null);
                    clearError("property-parent");
                  }}
                />
                <span>
                  Place inside another property or space
                  {initialParent ? (
                    <small>Locked by the route that opened this form.</small>
                  ) : null}
                </span>
              </label>
              {asChild ? (
                <FacetPicker
                  id="property-parent"
                  facet="places"
                  label="Parent property or space"
                  description="The new record inherits context from this selection unless an explicit mixed-use context is chosen."
                  error={errors["property-parent"]}
                  value={parent}
                  onChange={(item) => {
                    setParent(item);
                    clearError("property-parent");
                  }}
                  contextKey={context}
                />
              ) : (
                <p className="property-form-note">
                  This will be a top-level site in the organization.
                </p>
              )}
            </FormSection>
          ) : null}
        </div>
      </fieldset>

      <footer className="property-form-actions">
        <p>
          {isDirty
            ? "Unsaved changes will be lost if you leave."
            : "No unsaved changes."}
        </p>
        <div>
          <Button
            type="button"
            variant="secondary"
            disabled={mutation.isPending}
            onClick={close}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={mutation.isPending}
            loadingLabel="Saving…"
            disabled={catalog.isPending || catalog.isError}
          >
            {property ? "Save details" : "Create property"}
          </Button>
        </div>
      </footer>
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
  const setSelectedProperty = useAppStore((s) => s.setSelectedProperty);
  const mode =
    routeAction === "edit" || routeAction === "move" ? routeAction : null;
  const setMode = (value: "edit" | "move" | null) =>
    router.push(`/admin/properties/${property.id}${value ? "/" + value : ""}`);
  const [confirm, setConfirm] = useState(false),
    [parent, setParent] = useState<FacetItem | null>(null),
    [toRoot, setToRoot] = useState(false),
    [moveErrors, setMoveErrors] = useState<Record<string, string>>({});
  const moveDraftDirty = mode === "move" && (toRoot || !!parent);
  const canLeaveMove = useUnsavedChanges(moveDraftDirty);
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
    onSuccess: (saved, variables) => {
      toast.success(
        variables.action === "move"
          ? "Property moved."
          : saved.is_active
            ? "Property activated."
            : "Property archived.",
      );
      setMode(null);
      setConfirm(false);
      onSaved(saved, "Property updated.");
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
        <Button
          onClick={() => {
            setSelectedProperty({ id: property.id, name: property.name });
            router.push("/admin");
          }}
        >
          Open workspace
        </Button>
        {allowed("update") && (
          <Button
            variant="secondary"
            disabled={mutation.isPending}
            onClick={() => setMode("edit")}
          >
            Edit details
          </Button>
        )}
        {property.kind !== "site" && allowed("move") && (
          <Button
            variant="secondary"
            disabled={mutation.isPending}
            onClick={() => {
              setMode("move");
              setMoveErrors({});
              setParent(null);
              setToRoot(false);
            }}
          >
            Move property or space
          </Button>
        )}
        {property.kind !== "site" && allowed("toggle_active") && (
          <Button
            variant={property.is_active ? "destructive-outlined" : "secondary"}
            disabled={mutation.isPending}
            onClick={() => setConfirm(true)}
          >
            {property.is_active ? "Archive" : "Activate"}
          </Button>
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
      <section className="property-people-callout">
        <span className="property-people-callout-icon">
          <Users size={18} aria-hidden="true" />
        </span>
        <div>
          <p className="property-eyebrow">PEOPLE &amp; ACCESS</p>
          <h3>
            {property.kind === "site"
              ? "Manage site administrators"
              : "Assign the people who belong here"}
          </h3>
          <p>
            {property.kind === "site"
              ? "Site administration stays separate from resident, employee and guest access."
              : "Add occupants using the roles allowed by this property’s operating context. New accounts receive onboarding."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setSelectedProperty({ id: property.id, name: property.name });
            router.push("/admin/people");
          }}
        >
          Manage people
          <ArrowUpRight size={15} aria-hidden="true" />
        </button>
      </section>
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
      <Modal
        isOpen={confirm}
        onClose={() => {
          if (!mutation.isPending) setConfirm(false);
        }}
        title={
          property.is_active
            ? "Archive this property?"
            : "Activate this property?"
        }
        description={
          property.is_active
            ? "Active children, relationships, reservations, occupied rooms, gates or running access operations can prevent archiving. Existing history is retained."
            : "The parent must be active before this property can be activated."
        }
        size="sm"
      >
        <div className="property-confirm-actions">
          <p>
            <strong>{property.name}</strong>
            {property.is_active
              ? " will leave the active directory but remain available in history."
              : " will return to the active directory if its parent is active."}
          </p>
          <div className="property-form-actions">
            <div>
              <Button
                variant="secondary"
                disabled={mutation.isPending}
                onClick={() => setConfirm(false)}
              >
                Keep current status
              </Button>
              <Button
                variant={property.is_active ? "destructive" : "primary"}
                isLoading={mutation.isPending}
                loadingLabel="Saving…"
                onClick={() => mutation.mutate({ action: "toggle" })}
              >
                {property.is_active ? "Archive property" : "Activate property"}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
      {mode === "move" && (
        <form
          className="property-editor property-form property-move-editor"
          onSubmit={(e) => {
            e.preventDefault();
            if (!toRoot && !parent) {
              setMoveErrors({
                "property-move-destination":
                  "Choose a destination or make this a top-level property.",
              });
              return;
            }
            setMoveErrors({});
            mutation.mutate({
              action: "move",
              parentId: toRoot ? null : parent!.value,
            });
          }}
          noValidate
        >
          <header className="property-form-header">
            <div>
              <p className="property-eyebrow">PROPERTY HIERARCHY</p>
              <h2 id="property-move-title">Move {property.name}</h2>
              <p>
                The record keeps its fixed structure and classification. All
                child spaces move with it.
              </p>
            </div>
          </header>
          <FormErrorSummary errors={moveErrors} />
          <fieldset disabled={mutation.isPending || mutation.isError}>
            <label className="property-form-checkbox">
              <input
                type="checkbox"
                checked={toRoot}
                onChange={(event) => {
                  setToRoot(event.target.checked);
                  setMoveErrors({});
                }}
              />
              <span>
                Make this a top-level property
                <small>
                  Only permitted when the organization hierarchy allows another
                  root site.
                </small>
              </span>
            </label>
            {!toRoot && (
              <FacetPicker
                id="property-move-destination"
                facet="places"
                label="Destination property or space"
                description="A property cannot move inside itself or one of its descendants. Unsupported destinations are disabled by the server contract."
                error={moveErrors["property-move-destination"]}
                value={parent}
                onChange={(item) => {
                  setParent(item);
                  setMoveErrors({});
                }}
                contextKey={context}
                excludeIds={[property.id]}
              />
            )}
          </fieldset>
          {mutation.isError ? (
            <div className="property-form-server-error" role="alert">
              <strong>This property could not be moved.</strong>
              <span>{parseApiError(mutation.error).message}</span>
              <button type="button" onClick={() => mutation.reset()}>
                Dismiss
              </button>
            </div>
          ) : null}
          <footer className="property-form-actions">
            <p>
              Destination:{" "}
              <strong>
                {toRoot ? "Top level in organization" : parent?.label || "None"}
              </strong>
            </p>
            <div>
              <Button
                type="button"
                variant="secondary"
                disabled={mutation.isPending}
                onClick={() => {
                  if (canLeaveMove("Discard this move draft?")) setMode(null);
                }}
              >
                Cancel move
              </Button>
              <Button
                type="submit"
                isLoading={mutation.isPending}
                loadingLabel="Moving…"
              >
                Move here
              </Button>
            </div>
          </footer>
        </form>
      )}
      {mutation.isError && mode !== "move" ? (
        <p className="property-error" role="alert">
          {parseApiError(mutation.error).message}
        </p>
      ) : null}
    </>
  );
}
