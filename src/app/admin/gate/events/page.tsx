"use client";

import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
<<<<<<< HEAD
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { DataTable, Column, FilterDefinition, FilterConfig } from "@/components/ui/DataTable";
=======
import { Search } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
>>>>>>> sidebar-fixes
import { Badge } from "@/components/ui/Badge";
import { useAdminGateEvents } from "@/hooks/use-admin";
import { GateEvent } from "@/types";
import { formatFiltersForAPI } from "@/lib/table-utils";
import { titleCase } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/Card";

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100];
const DEFAULT_PAGE_SIZE = 10;
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

  // Build initial filters from URL state
  const initialFilters = useMemo(() => {
    const filters: FilterConfig[] = [];
    if (ownerType) {
      filters.push({ field: "owner_type", operator: "eq", value: ownerType });
    }
    return filters;
  }, [ownerType]);

  // Define available filters for DataTable
  const availableFilters: FilterDefinition[] = useMemo(() => [
    {
      field: "owner_type",
      label: "Owner Type",
      type: "select",
      options: OWNER_TYPE_FILTERS.map((f) => ({
        value: f.value || "",
        label: f.label,
      })),
      operator: "eq",
    },
  ], []);

  // Build filters for API from current state
  const filtersForAPI = useMemo(() => {
    const filters: FilterConfig[] = [];
    if (ownerType) {
      filters.push({ field: "owner_type", operator: "eq", value: ownerType });
    }
    return filters;
  }, [ownerType]);

  const { data, isLoading, isFetching } = useAdminGateEvents({
    page,
    pageSize,
    search: search.trim() || undefined,
    filters: formatFiltersForAPI(filtersForAPI),
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
<<<<<<< HEAD
    <DashboardLayout type="admin">
      <div className="space-y-6">
=======
    <>
      <div className="space-y-4">
>>>>>>> sidebar-fixes
        {/* Header */}
        <div className="flex flex-col gap-3 border-b border-zinc-200 pb-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Gate Events</h1>
            <p className="text-sm text-muted-foreground">
              Total: {breakdown.total} | Entries: {breakdown.entries} | Exits: {breakdown.exits}
            </p>
          </div>
        </div>

<<<<<<< HEAD

        {/* Table */}
        <Card>
          <CardContent>
            {isLoading ? (
              <TableSkeleton />
            ) : (
              <DataTable
                data={events}
                columns={columns}
                searchable={true}
                searchPlaceholder="Search events..."
                pageSize={pageSize}
                pageSizeOptions={PAGE_SIZE_OPTIONS}
                onPageSizeChange={(newPageSize) => {
                  setPage(1);
                  setPageSize(newPageSize);
                }}
                showPagination={true}
                emptyMessage="No events match these filters. Try removing filters or check back after the next scan."
                serverSide={true}
                total={total}
                currentPage={page}
                onPageChange={setPage}
                initialSearch={search}
                onSearchChange={(value) => {
                  setPage(1);
                  setSearch(value);
                }}
                availableFilters={availableFilters}
                initialFilters={initialFilters}
                onFiltersChange={(filters) => {
                  setPage(1);
                  // Extract owner_type from filters and explicitly clear if not found
                  const ownerTypeFilter = filters.find((f) => f.field === "owner_type");
                  // Always set state (undefined if filter not found) to ensure URL clearing
                  setOwnerType(ownerTypeFilter?.value as string | undefined || undefined);
                }}
                initialSort={sort}
                onSortChange={(newSort) => {
                  setPage(1);
                  setSort(newSort);
                }}
                disableClientSideFiltering={true}
                disableClientSideSorting={true}
                className=" rounded"
              />
            )}
          </CardContent>
        </Card>
=======
        {/* Table */}
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, index) => (
              <div
                key={index}
                className="h-9 animate-pulse rounded border border-border bg-muted/30"
              />
            ))}
          </div>
        ) : events.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No events match these filters"
            description="Try removing filters or check back after the next scan."
          />
        ) : (
          <>
            <div className="overflow-x-auto border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="h-9 text-xs font-medium">Event</TableHead>
                    <TableHead className="h-9 text-xs font-medium">Pass</TableHead>
                    <TableHead className="h-9 text-xs font-medium">House</TableHead>
                    <TableHead className="h-9 text-xs font-medium">Owner</TableHead>
                    <TableHead className="h-9 text-xs font-medium">Scanner</TableHead>
                    <TableHead className="h-9 text-right text-xs font-medium">Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => (
                    <TableRow
                      key={event.id}
                      className="cursor-pointer hover:bg-muted/30"
                      onClick={() => router.push(`/admin/gate/events/${event.id}`)}
                    >
                      <TableCell className="h-9 py-1.5">
                        <Badge variant="secondary" className="h-5 text-xs font-normal">
                          {titleCase(event.owner_type) ?? "Scan"}
                        </Badge>
                      </TableCell>
                      <TableCell className="h-9 py-1.5 text-xs">{event?.gate_pass?.code ?? "—"}</TableCell>
                      <TableCell className="h-9 py-1.5 text-xs">{event?.gate_pass?.house_id ?? "—"}</TableCell>
                      <TableCell className="h-9 py-1.5 text-xs">
                        {event.owner && "name" in event.owner
                          ? event.owner.name ?? event.owner.email ?? "—"
                          : "—"}
                      </TableCell>
                      <TableCell className="h-9 py-1.5 text-xs">{event?.scanned_by?.name ?? "—"}</TableCell>
                      <TableCell className="h-9 py-1.5 text-right text-xs text-muted-foreground">
                        {event.created_at
                          ? formatDistanceToNow(new Date(event.created_at), {
                            addSuffix: true,
                          })
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-col gap-2 border-t border-border pt-2 md:flex-row md:items-center md:justify-between">
              <p className="text-xs text-muted-foreground">
                {isFetching ? "Refreshing..." : `${events.length} of ${data?.total ?? 0} events`}
              </p>
              {totalPages > 1 && (
                <PaginationBar
                  page={page}
                  pageSize={PAGE_SIZE}
                  total={data?.total ?? events.length}
                  totalPages={totalPages}
                  resourceLabel="events"
                  onChange={setPage}
                />
              )}
            </div>
          </>
        )}
>>>>>>> sidebar-fixes
      </div>
    </>
  );
}
