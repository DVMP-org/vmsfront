"use client";

import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Search, X } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { DataTable, Column, FilterableField } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { useAdminGateEvents } from "@/hooks/use-admin";
import { GateEvent } from "@/types";
import { formatFiltersForAPI, formatSortForAPI } from "@/lib/table-utils";
import { titleCase } from "@/lib/utils";

const PAGE_SIZE_OPTIONS = [15, 30, 50, 100];
const DEFAULT_PAGE_SIZE = 15;
const OWNER_TYPE_FILTERS: Array<{ label: string; value: string | undefined }> = [
  { label: "All types", value: undefined },
  { label: "Visitor", value: "visitor" },
  { label: "Resident", value: "resident" },
];

export default function AdminGateEventsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isInitialMount = useRef(true);

  // Initialize state from URL params
  const [page, setPage] = useState(() => {
    const pageParam = searchParams.get("page");
    return pageParam ? parseInt(pageParam, 10) : 1;
  });
  const [pageSize, setPageSize] = useState(() => {
    const pageSizeParam = searchParams.get("pageSize");
    return pageSizeParam ? parseInt(pageSizeParam, 10) : DEFAULT_PAGE_SIZE;
  });
  const [search, setSearch] = useState(() => searchParams.get("search") || "");
  const [ownerType, setOwnerType] = useState<string | undefined>(() => {
    const ownerTypeParam = searchParams.get("owner_type");
    return ownerTypeParam || undefined;
  });
  const [sort, setSort] = useState<string | null>(() => {
    const sortParam = searchParams.get("sort");
    return sortParam || null;
  });

  // Sync state to URL query parameters
  const syncToUrl = useCallback((updates: {
    page?: number;
    pageSize?: number;
    search?: string;
    ownerType?: string | undefined;
    sort?: string | null;
  }) => {
    const params = new URLSearchParams(searchParams.toString());

    if (updates.page !== undefined) {
      if (updates.page > 1) {
        params.set("page", String(updates.page));
      } else {
        params.delete("page");
      }
    }

    if (updates.pageSize !== undefined) {
      if (updates.pageSize !== DEFAULT_PAGE_SIZE) {
        params.set("pageSize", String(updates.pageSize));
      } else {
        params.delete("pageSize");
      }
    }

    if (updates.search !== undefined) {
      if (updates.search.trim()) {
        params.set("search", updates.search.trim());
      } else {
        params.delete("search");
      }
    }

    if (updates.ownerType !== undefined) {
      if (updates.ownerType) {
        params.set("owner_type", updates.ownerType);
      } else {
        params.delete("owner_type");
      }
    }

    if (updates.sort !== undefined) {
      if (updates.sort) {
        params.set("sort", updates.sort);
      } else {
        params.delete("sort");
      }
    }

    const queryString = params.toString();
    router.replace(
      queryString ? `${pathname}?${queryString}` : pathname,
      { scroll: false }
    );
  }, [pathname, router, searchParams]);

  // Sync state changes to URL (skip initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    syncToUrl({ page, pageSize, search, ownerType, sort });
  }, [page, pageSize, search, ownerType, sort, syncToUrl]);

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setSearch("");
    setOwnerType(undefined);
    setSort(null);
    setPage(1);
    // URL will be updated via the useEffect above
  }, []);

  // Build filterable fields from payload
  const filterableFields = useMemo(() => {
    const fields: Array<{ field: string; operator?: "eq"; value?: string | null }> = [];
    if (ownerType) {
      fields.push({ field: "owner_type", operator: "eq", value: ownerType });
    }
    return fields;
  }, [ownerType]);

  const { data, isLoading, isFetching } = useAdminGateEvents({
    page,
    pageSize,
    search: search.trim() || undefined,
    filters: formatFiltersForAPI(
      filterableFields.map((f) => ({
        field: f.field,
        operator: f.operator || "eq",
        value: f.value!,
      }))
    ),
    sort: sort || undefined,
  });

  const events = useMemo(() => data?.items ?? [], [data?.items]);
  const totalPages = data?.total_pages ?? 1;
  const total = data?.total ?? 0;

  const breakdown = useMemo(() => {
    const entries = events.filter((event) => event.checkout_time === null).length;
    const exits = events.filter((event) => !!event.checkout_time).length;
    return { total, entries, exits };
  }, [total, events]);

  const columns: Column<GateEvent>[] = [
    {
      key: "event",
      header: "Event",
      sortable: false,
      accessor: (row) => (
        <Badge variant="secondary" className="h-5 text-xs font-normal">
          {titleCase(row.owner_type) ?? "Scan"}
        </Badge>
      ),
    },
    {
      key: "pass",
      header: "Pass",
      sortable: true,
      filterable: true,
      accessor: (row) => (
        <span className="text-xs">{row?.gate_pass?.code ?? "—"}</span>
      ),
    },
    {
      key: "house",
      header: "House",
      sortable: false,
      filterable: true,
      accessor: (row) => (
        <span className="text-xs">{row?.gate_pass?.house?.name ?? "—"}</span>
      ),
    },
    {
      key: "owner",
      header: "Owner",
      sortable: false,
      accessor: (row) => (
        <span className="text-xs">
          {row.owner && "name" in row.owner
            ? row.owner.name ?? row.owner.email ?? "—"
            : "—"}
        </span>
      ),
    },
    {
      key: "scanner",
      header: "Scanner",
      sortable: false,
      accessor: (row) => (
        <span className="text-xs">{row?.scanned_by?.name ?? "—"}</span>
      ),
    },
    {
      key: "timestamp",
      header: "Timestamp",
      sortable: true,
      accessor: (row) => (
        <span className="text-xs text-muted-foreground text-right">
          {row.created_at
            ? formatDistanceToNow(new Date(row.created_at), {
              addSuffix: true,
            })
            : "—"}
        </span>
      ),
      className: "text-right",
    },
  ];

  return (
    <DashboardLayout type="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 border-b border-zinc-200 pb-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Gate Events</h1>
            <p className="text-sm text-muted-foreground">
              Total: {breakdown.total} | Entries: {breakdown.entries} | Exits: {breakdown.exits}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
          <select
            value={ownerType ?? ""}
            onChange={(event) => {
              setPage(1);
              setOwnerType(event.target.value || undefined);
            }}
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {OWNER_TYPE_FILTERS.map((option) => (
              <option key={option.label} value={option.value ?? ""}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={pageSize}
              onChange={(event) => {
                setPage(1);
                setPageSize(Number(event.target.value));
              }}
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size} per page
              </option>
            ))}
          </select>
          {(search || ownerType || sort) && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              className="h-10 gap-2"
            >
              <X className="h-4 w-4" />
              Clear Filters
            </Button>
          )}
        </div>

        {/* Table */}
        {isLoading ? (
          <TableSkeleton />
        ) : events.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No events match these filters"
            description="Try removing filters or check back after the next scan."
          />
        ) : (
              <DataTable
                data={events}
                columns={columns}
                searchable={true}
                searchPlaceholder="Search events..."
                pageSize={pageSize}
                showPagination={true}
                emptyMessage="No events found"
                serverSide={true}
                total={total}
                currentPage={page}
                onPageChange={setPage}
                externalSearch={search}
                onSearchChange={(value) => {
                  setPage(1);
                  setSearch(value);
                  // URL will be updated via useEffect
                }}
                filterableFields={filterableFields}
                onSortChange={(newSort) => {
                  setPage(1);
                  setSort(newSort);
                  // URL will be updated via useEffect
                }}
                disableClientSideFiltering={true}
                disableClientSideSorting={true}
                className="border border-zinc-200 rounded"
              />
        )}
      </div>
    </DashboardLayout>
  );
}
