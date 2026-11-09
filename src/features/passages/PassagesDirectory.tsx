"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Copy, MapPin, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  DataTable,
  type BulkAction,
  type Column,
  type FilterConfig,
} from "@/components/ui/DataTable";
import { useAdminGates } from "@/hooks/use-admin";
import { propertiesApi } from "@/features/properties/api";
import { useAppStore } from "@/store/app-store";
import { parseApiError } from "@/lib/error-utils";
import {
  checkpointsApi,
  type AccessEventFilters,
  type Passage,
} from "@/features/checkpoints/api";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

function stateLabel(value?: string | null) {
  return (value || "unknown").replaceAll("_", " ");
}

export function PassagesDirectory() {
  const selectedProperty = useAppStore((state) => state.selectedProperty);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<string | null>("occurred_at:desc");
  const [filters, setFilters] = useState<AccessEventFilters>({
    place_id: selectedProperty?.id,
  });
  const properties = useQuery({
    queryKey: ["passage-property-options"],
    queryFn: () =>
      propertiesApi.list({ page: 1, page_size: 100, is_active: true }),
    staleTime: 60_000,
  });
  const gates = useAdminGates({ page: 1, pageSize: 100 });
  const query = useQuery({
    queryKey: ["access-events", page, pageSize, search, sort, filters],
    queryFn: () =>
      checkpointsApi.accessEvents({
        ...filters,
        page,
        page_size: pageSize,
        search: search.trim() || undefined,
        sort: sort || undefined,
      }),
  });
  const presence = useQuery({
    queryKey: ["access-presence", filters.place_id, filters.gate_id],
    queryFn: () =>
      checkpointsApi.presence({
        place_id: filters.place_id,
        gate_id: filters.gate_id,
      }),
  });

  const initialFilters = useMemo<FilterConfig[]>(() => {
    const result: FilterConfig[] = [];
    Object.entries(filters).forEach(([field, value]) => {
      if (!value) return;
      if (field === "occurred_from") {
        result.push({ field: "occurred_at", operator: "gte", value });
        return;
      }
      if (field === "occurred_to") {
        result.push({ field: "occurred_at", operator: "lte", value });
        return;
      }
      result.push({ field, operator: "eq", value });
    });
    return result;
  }, [filters]);

  const columns: Column<Passage>[] = [
    {
      key: "occurred_at",
      header: "Time",
      sortable: true,
      accessor: (event) => (
        <time
          dateTime={event.occurred_at}
          className="whitespace-nowrap text-sm"
        >
          {new Date(event.occurred_at).toLocaleString()}
        </time>
      ),
    },
    {
      key: "person",
      header: "Person",
      accessor: (event) => (
        <div className="min-w-32">
          <strong className="block text-sm">
            {event.person_name || "Unknown credential"}
          </strong>
          <span className="text-xs capitalize text-[var(--vms-ink-muted)]">
            {event.subject_type || "unknown"}
          </span>
        </div>
      ),
    },
    {
      key: "place",
      header: "Property",
      accessor: (event) => (
        <span className="text-sm">
          {event.place_name || "Unknown property"}
        </span>
      ),
      responsiveHide: "md",
    },
    {
      key: "gate",
      header: "Checkpoint",
      accessor: (event) => (
        <span className="text-sm">
          {event.gate_name || "Unknown checkpoint"}
        </span>
      ),
    },
    {
      key: "direction",
      header: "Movement",
      accessor: (event) => (
        <Badge variant={event.direction === "entry" ? "info" : "secondary"}>
          {event.direction === "entry" ? "Check in" : "Check out"}
        </Badge>
      ),
    },
    {
      key: "outcome",
      header: "Decision",
      accessor: (event) => (
        <Badge variant={event.outcome === "allowed" ? "success" : "danger"}>
          {event.outcome}
        </Badge>
      ),
    },
    {
      key: "state",
      header: "Access state",
      accessor: (event) => (
        <span className="text-xs leading-5 text-[var(--vms-ink-muted)]">
          {stateLabel(event.state_before)} to {stateLabel(event.state_after)}
        </span>
      ),
      responsiveHide: "lg",
    },
    {
      key: "credential",
      header: "Credential",
      accessor: (event) => (
        <span className="text-xs">
          <strong className="block capitalize">
            {(event.credential_type || "unknown").replaceAll("_", " ")}
          </strong>
          <span className="text-[var(--vms-ink-muted)]">
            {event.credential_reference || "No reference"}
          </span>
        </span>
      ),
      responsiveHide: "lg",
    },
    {
      key: "reason",
      header: "Reason",
      accessor: (event) => (
        <span className="text-xs capitalize text-[var(--vms-ink-muted)]">
          {event.reason_code.replaceAll("_", " ")}
        </span>
      ),
      responsiveHide: "md",
    },
    {
      key: "actions",
      header: "",
      mobileHide: true,
      accessor: (event) => (
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/admin/passages/${event.id}`}>Open</Link>
        </Button>
      ),
    },
  ];

  const bulkActions: BulkAction[] = [
    {
      label: "Copy event IDs",
      icon: Copy,
      onClick: async (ids) => {
        try {
          await navigator.clipboard.writeText(ids.join("\n"));
          toast.success(`${ids.length} access event IDs copied.`);
        } catch {
          toast.error("Access event IDs could not be copied.");
        }
      },
    },
  ];

  return (
    <main className="space-y-5 pb-10 text-[var(--vms-ink)]">
      <header className="flex flex-col gap-4 border-b border-[var(--vms-line)] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--vms-ink-muted)]">
            Access operations
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
            Passage history
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--vms-ink-muted)]">
            Search every allowed, denied and overridden movement across visitor
            and registered-Party credentials.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/checkpoints">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Open console
            </Link>
          </Button>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <article className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-4">
          <p className="text-xs uppercase tracking-[0.1em] text-[var(--vms-ink-muted)]">
            Recorded movements
          </p>
          <p className="mt-2 text-2xl font-semibold">
            {query.data?.total ?? 0}
          </p>
        </article>
        <article className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-4">
          <p className="text-xs uppercase tracking-[0.1em] text-[var(--vms-ink-muted)]">
            Current presence
          </p>
          <p className="mt-2 text-2xl font-semibold">
            {presence.data?.total ?? 0}
          </p>
        </article>
        <article className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-4">
          <MapPin className="h-5 w-5" aria-hidden="true" />
          <p className="mt-2 text-sm font-semibold">
            {selectedProperty?.name || "All accessible properties"}
          </p>
        </article>
      </section>

      <section className="overflow-hidden rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)]">
        <DataTable
          data={query.data?.items ?? []}
          columns={columns}
          tableLabel="Unified access passage history"
          searchPlaceholder="Search person, credential, checkpoint, property or reason"
          initialSearch={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          serverSide
          total={query.data?.total ?? 0}
          currentPage={page}
          onPageChange={setPage}
          pageSize={pageSize}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          onPageSizeChange={(value) => {
            setPageSize(value);
            setPage(1);
          }}
          initialSort={sort}
          onSortChange={(value) => {
            setSort(value);
            setPage(1);
          }}
          availableFilters={[
            {
              field: "subject_type",
              label: "Person type",
              type: "select",
              options: [
                { value: "visitor", label: "Visitor" },
                { value: "party", label: "Registered Party" },
                { value: "unknown", label: "Unknown credential" },
              ],
            },
            {
              field: "direction",
              label: "Movement",
              type: "select",
              options: [
                { value: "entry", label: "Check in" },
                { value: "exit", label: "Check out" },
              ],
            },
            {
              field: "outcome",
              label: "Decision",
              type: "select",
              options: [
                { value: "allowed", label: "Allowed" },
                { value: "denied", label: "Denied" },
              ],
            },
            {
              field: "place_id",
              label: "Property",
              type: "select",
              isSearchable: true,
              options: (properties.data?.items ?? []).map((property) => ({
                value: property.id,
                label: property.name,
              })),
            },
            {
              field: "gate_id",
              label: "Checkpoint",
              type: "select",
              isSearchable: true,
              options: (gates.data?.items ?? []).map((gate) => ({
                value: gate.id,
                label: gate.name,
              })),
            },
            {
              field: "occurred_at",
              label: "Occurred",
              type: "date-range",
            },
          ]}
          initialFilters={initialFilters}
          onFiltersChange={(next) => {
            const nextFilters: AccessEventFilters = {};
            for (const filter of next) {
              if (filter.field === "occurred_at" && filter.operator === "gte") {
                nextFilters.occurred_from = String(filter.value);
              } else if (
                filter.field === "occurred_at" &&
                filter.operator === "lte"
              ) {
                nextFilters.occurred_to = String(filter.value);
              } else {
                nextFilters[filter.field] = String(filter.value);
              }
            }
            setFilters(nextFilters);
            setPage(1);
          }}
          selectable
          getRowId={(event) => event.id}
          bulkActions={bulkActions}
          isLoading={query.isPending}
          errorMessage={
            query.isError ? parseApiError(query.error).message : undefined
          }
          isStale={query.isError && !!query.data}
          onRetry={() => query.refetch()}
          emptyMessage="No access events match these filters"
          mobileSummary={(event) => (
            <Link
              href={`/admin/passages/${event.id}`}
              className="block space-y-2"
            >
              <span className="flex items-start justify-between gap-3">
                <strong>{event.person_name || "Unknown credential"}</strong>
                <Badge
                  variant={event.outcome === "allowed" ? "success" : "danger"}
                >
                  {event.outcome}
                </Badge>
              </span>
              <span className="text-sm">
                {event.direction === "entry" ? "Check in" : "Check out"} at{" "}
                {event.gate_name || "checkpoint"}
              </span>
              <span className="block text-xs text-[var(--vms-ink-muted)]">
                {new Date(event.occurred_at).toLocaleString()} ·{" "}
                {event.place_name || "property"}
              </span>
            </Link>
          )}
        />
      </section>
    </main>
  );
}
