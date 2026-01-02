"use client";

import React, { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { DataTable, Column, FilterDefinition, FilterConfig } from "@/components/ui/DataTable";
import { X } from "lucide-react";
import { GatePassStatus, GatePass } from "@/types";
import { useAdminGatePasses, useAdminHouses, useAdminResidents } from "@/hooks/use-admin";
import { formatFiltersForAPI } from "@/lib/table-utils";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/Card";

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100];
const DEFAULT_PAGE_SIZE = 20;
const STATUS_FILTERS: Array<{ label: string; value: string | undefined }> = [
  { label: "All statuses", value: undefined },
  { label: "Active / Checked-in", value: GatePassStatus.CHECKED_IN },
  { label: "Checked-out", value: GatePassStatus.CHECKED_OUT },
  { label: "Pending", value: GatePassStatus.PENDING },
  { label: "Completed", value: GatePassStatus.COMPLETED },
  { label: "Revoked", value: GatePassStatus.REVOKED },
  { label: "Expired", value: GatePassStatus.EXPIRED },
];

export default function AdminGatePassesPage() {
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
  const [status, setStatus] = useState<string | undefined>(() => {
    const statusParam = searchParams.get("status");
    return statusParam || undefined;
  });
  const [houseId, setHouseId] = useState<string | undefined>(() => {
    const houseIdParam = searchParams.get("house_id");
    return houseIdParam || undefined;
  });
  const [residentId, setResidentId] = useState<string | undefined>(() => {
    const residentIdParam = searchParams.get("resident_id");
    return residentIdParam || undefined;
  });
  const [sort, setSort] = useState<string | null>(() => {
    const sortParam = searchParams.get("sort");
    return sortParam || null;
  });
  const [selectedPasses, setSelectedPasses] = useState<Set<string>>(new Set());

  // Sync state to URL query parameters
  const syncToUrl = useCallback((updates: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string | undefined;
    houseId?: string | undefined;
    residentId?: string | undefined;
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

    if (updates.status !== undefined) {
      if (updates.status) {
        params.set("status", updates.status);
      } else {
        params.delete("status");
      }
    }

    if (updates.houseId !== undefined) {
      if (updates.houseId) {
        params.set("house_id", updates.houseId);
      } else {
        params.delete("house_id");
      }
    }

    if (updates.residentId !== undefined) {
      if (updates.residentId) {
        params.set("resident_id", updates.residentId);
      } else {
        params.delete("resident_id");
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
    syncToUrl({ page, pageSize, search, status, houseId, residentId, sort });
  }, [page, pageSize, search, status, houseId, residentId, sort, syncToUrl]);

  // Fetch houses and residents for filter dropdowns
  const { data: housesData } = useAdminHouses({
    page: 1,
    pageSize: 100, // Get all houses for dropdown
  });
  const { data: residentsData } = useAdminResidents({
    page: 1,
    pageSize: 100, // Get all residents for dropdown
  });

  const houses = useMemo(() => housesData?.items ?? [], [housesData]);
  const residents = useMemo(() => residentsData?.items ?? [], [residentsData]);

  // Build initial filters from URL state
  const initialFilters = useMemo(() => {
    const filters: FilterConfig[] = [];
    if (status) {
      filters.push({ field: "status", operator: "eq", value: status });
    }
    if (houseId) {
      filters.push({ field: "house_id", operator: "eq", value: houseId });
    }
    if (residentId) {
      filters.push({ field: "resident_id", operator: "eq", value: residentId });
    }
    return filters;
  }, [status, houseId, residentId]);

  // Define available filters for DataTable
  const availableFilters: FilterDefinition[] = useMemo(() => {
    const filters: FilterDefinition[] = [
      {
        field: "status",
        label: "Status",
        type: "select",
        options: STATUS_FILTERS.map((f) => ({
          value: f.value || "",
          label: f.label,
        })),
        operator: "eq",
      },
    ];

    // Add house filter if houses are loaded
    if (houses.length > 0) {
      filters.push({
        field: "house_id",
        label: "House",
        type: "select",
        options: [
          { value: "", label: "All Houses" },
          ...houses.map((house) => ({
            value: house.id,
            label: house.name,
          })),
        ],
        operator: "eq",
      });
    }

    // Add resident filter if residents are loaded
    if (residents.length > 0) {
      filters.push({
        field: "resident_id",
        label: "Resident",
        type: "select",
        options: [
          { value: "", label: "All Residents" },
          ...residents.map((resident) => ({
            value: resident.resident.id,
            label: `${resident.user?.first_name || ""} ${resident.user?.last_name || ""} ${resident.user?.email ? `(${resident.user.email})` : ""}`.trim() || "Unknown",
          })),
        ],
        operator: "eq",
      });
    }

    return filters;
  }, [houses, residents]);

  // Build filters for API from current state
  const filtersForAPI = useMemo(() => {
    const filters: FilterConfig[] = [];
    if (status) {
      filters.push({ field: "status", operator: "eq", value: status });
    }
    if (houseId) {
      filters.push({ field: "house_id", operator: "eq", value: houseId });
    }
    if (residentId) {
      filters.push({ field: "resident_id", operator: "eq", value: residentId });
    }
    return filters;
  }, [status, houseId, residentId]);

  const { data, isLoading, isFetching } = useAdminGatePasses({
    page,
    pageSize,
    search: search.trim() || undefined,
    filters: formatFiltersForAPI(filtersForAPI),
    sort: sort || undefined,
  });

  const passes = useMemo(() => data?.items ?? [], [data?.items]);
  const totalPages = data?.total_pages ?? 1;
  const total = data?.total ?? 0;

  const handleBulkRevoke = useCallback(async () => {
    if (selectedPasses.size === 0) return;
    // TODO: Implement bulk revoke API call
    toast.info(`Revoking ${selectedPasses.size} pass(es)...`);
    // For now, just clear selection
    setSelectedPasses(new Set());
  }, [selectedPasses]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedPasses.size === 0) return;
    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedPasses.size} pass(es)? This action cannot be undone.`
    );
    if (!confirmed) return;
    // TODO: Implement bulk delete API call
    toast.info(`Deleting ${selectedPasses.size} pass(es)...`);
    setSelectedPasses(new Set());
  }, [selectedPasses]);

  const columns: Column<GatePass>[] = [
    {
      key: "code",
      header: "Pass code",
      sortable: true,
      filterable: true,
      accessor: (row) => (
        <span className="font-medium text-sm">{row.code}</span>
      ),
    },
    {
      key: "visitor",
      header: "Resident/Visitor",
      sortable: false,
      accessor: (row) => (
        <span className="text-sm">
          {row.visitors?.[0]?.name ?? row.visitors?.[0]?.email ?? "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      filterable: true,
      filterType: "select",
      filterOptions: STATUS_FILTERS.map((f) => ({
        value: f.value || "",
        label: f.label,
      })),
      accessor: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "validity",
      header: "Validity",
      sortable: false,
      accessor: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.valid_from && row.valid_to ? (
            <>
              {new Date(row.valid_from).toLocaleDateString()} –{" "}
              {new Date(row.valid_to).toLocaleDateString()}
            </>
          ) : (
            "Flexible"
          )}
        </span>
      ),
    },
    {
      key: "uses",
      header: "Uses",
      sortable: false,
      accessor: (row) => (
        <span className="text-sm">
          {row.uses_count}/{row.max_uses ?? "∞"}
        </span>
      ),
    },
    {
      key: "updated_at",
      header: "Last updated",
      sortable: true,
      accessor: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.updated_at
            ? formatDistanceToNow(new Date(row.updated_at), {
              addSuffix: true,
            })
            : "—"}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Created at",
      sortable: true,
      accessor: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.created_at
            ? formatDistanceToNow(new Date(row.created_at), {
              addSuffix: true,
            })
            : "—"}
        </span>
      ),
    },
  ];

  return (
    <DashboardLayout type="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Gate Passes</h1>
            <p className="text-muted-foreground">
              {total > 0 ? `${total} total pass${total !== 1 ? "es" : ""}` : "All issued gate passes"}
            </p>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedPasses.size > 0 && (
          <div className="flex items-center justify-between border border-zinc-200 bg-zinc-50 px-4 py-2 rounded">
            <span className="text-sm text-foreground">
              {selectedPasses.size} pass{selectedPasses.size !== 1 ? "es" : ""} selected
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedPasses(new Set())}
              >
                <X className="h-3.5 w-3.5 mr-1.5" />
                Clear
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkRevoke}
              >
                Revoke
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
              >
                Delete
              </Button>
            </div>
          </div>
        )}

        <Card>
          {/* Table */}
          <CardContent className="p-6">
            {isLoading ? (
              <TableSkeleton />
            ) : (
              <DataTable
                data={passes}
                columns={columns}
                searchable={true}
                searchPlaceholder="Search pass code, resident or visitor..."
                pageSize={pageSize}
                pageSizeOptions={PAGE_SIZE_OPTIONS}
                onPageSizeChange={(newPageSize) => {
                  setPage(1);
                  setPageSize(newPageSize);
                }}
                showPagination={true}
                emptyMessage="No passes found. Once visitors or residents generate passes, they will appear here."
                selectable={true}
                getRowId={(row) => row.id}
                selectedRows={selectedPasses}
                onSelectionChange={setSelectedPasses}
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
                  // Extract filter values from filters
                  const statusFilter = filters.find((f) => f.field === "status");
                  const houseIdFilter = filters.find((f) => f.field === "house_id");
                  const residentIdFilter = filters.find((f) => f.field === "resident_id");
                  setStatus(statusFilter?.value as string | undefined);
                  setHouseId(houseIdFilter?.value as string | undefined);
                  setResidentId(residentIdFilter?.value as string | undefined);
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
      </div>
    </DashboardLayout>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusMap: Record<string, { label: string; className: string }> = {
    [GatePassStatus.CHECKED_IN]: {
      label: "Checked in",
      className: "bg-muted text-foreground border border-border",
    },
    [GatePassStatus.CHECKED_OUT]: {
      label: "Checked out",
      className: "bg-muted text-muted-foreground border border-border",
    },
    [GatePassStatus.PENDING]: {
      label: "Pending",
      className: "bg-muted text-foreground border border-border",
    },
    [GatePassStatus.REVOKED]: {
      label: "Revoked",
      className: "bg-muted text-destructive border border-border",
    },
    [GatePassStatus.EXPIRED]: {
      label: "Expired",
      className: "bg-muted text-muted-foreground border border-border",
    },
    [GatePassStatus.COMPLETED]: {
      label: "Completed",
      className: "bg-muted text-muted-foreground border border-border",
    },
  };

  const data = statusMap[status] ?? {
    label: status,
    className: "bg-muted text-muted-foreground border border-border",
  };

  return (
    <Badge variant="secondary" className={`${data.className} font-normal text-xs`}>
      {data.label}
    </Badge>
  );
}
