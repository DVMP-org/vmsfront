"use client";

import React, { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
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
import { cn, formatPassWindow, getTimeRemaining } from "@/lib/utils";
import { useUrlQuerySync } from "@/hooks/use-url-query-sync";

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100];
const PAGE_SIZE = 10;
const STATUS_FILTERS: Array<{ label: string; value: string | undefined }> = [
  { label: "Checked-in", value: GatePassStatus.CHECKED_IN },
  { label: "Checked-out", value: GatePassStatus.CHECKED_OUT },
  { label: "Pending", value: GatePassStatus.PENDING },
  { label: "Completed", value: GatePassStatus.COMPLETED },
  { label: "Revoked", value: GatePassStatus.REVOKED },
  { label: "Expired", value: GatePassStatus.EXPIRED },
];

export default function AdminGatePassesPage() {
  const router = useRouter();
  const config = useMemo(() => ({
    page: { defaultValue: 1 },
    pageSize: { defaultValue: PAGE_SIZE },
    search: { defaultValue: "" },
    sort: { defaultValue: undefined },
    status: { defaultValue: undefined },
    house_id: { defaultValue: undefined },
    resident_id: { defaultValue: undefined },
    startDate: { defaultValue: undefined },
    endDate: { defaultValue: undefined },
  }), []);

  const { initializeFromUrl, syncToUrl } = useUrlQuerySync({
    config,
    skipInitialSync: true,
  });
  const isInitialMount = useRef(true);

  // Initialize state from URL params
  const [page, setPage] = useState(() => initializeFromUrl("page"));
  const [pageSize, setPageSize] = useState(() => initializeFromUrl("pageSize"));
  const [selectedPasses, setSelectedPasses] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState(() => initializeFromUrl("search") || "");
  const [status, setStatus] = useState<string | undefined>(() => initializeFromUrl("status"));
  const [houseId, setHouseId] = useState<string | undefined>(() => initializeFromUrl("house_id"));
  const [residentId, setResidentId] = useState<string | undefined>(() => initializeFromUrl("resident_id"));
  const [sort, setSort] = useState<string | null>(() => initializeFromUrl("sort"));
  const [startDate, setStartDate] = useState<string | undefined>(() => initializeFromUrl("startDate"));
  const [endDate, setEndDate] = useState<string | undefined>(() => initializeFromUrl("endDate"));


  // Sync state changes to URL (skip initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    syncToUrl({
      page,
      pageSize,
      search,
      status,
      house_id: houseId,
      resident_id: residentId,
      sort,
      startDate,
      endDate
    });
  }, [
    page,
    pageSize,
    search,
    status,
    houseId,
    residentId,
    sort,
    startDate,
    endDate,
    syncToUrl]);

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
        isSearchable: true,
        options: [
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
        isSearchable: true,
        options: [

          ...residents.map((resident) => ({
            value: resident.resident.id,
            label: `${resident.user?.name || ""}`.trim() || "Unknown",
          })),
        ],
        operator: "eq",
      });
    }

    filters.push(
      {
        field: "created_at",
        label: "Date Range",
        type: "date-range",
      }
    )

    return filters;
  }, [houses, residents]);

  // Build filters for API from current state
  const activeFilters = useMemo(() => {
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
    if (startDate) {
      filters.push({ field: "created_at", operator: "gte", value: startDate });
    }
    if (endDate) {
      filters.push({ field: "created_at", operator: "lte", value: endDate });
    }
    return filters;
  }, [status, houseId, residentId, startDate, endDate]);

  const { data, isLoading, isFetching } = useAdminGatePasses({
    page,
    pageSize,
    search: search.trim() || undefined,
    filters: formatFiltersForAPI(activeFilters),
    sort: sort || undefined,
  });

  const passes = useMemo(() => data?.items ?? [], [data?.items]);
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
      accessor: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "validity",
      header: "Validity",
      sortable: false,
      accessor: (row) => {
        const remaining = getTimeRemaining(row.valid_to);
        return (
          <div className="flex flex-col text-sm leading-5">
            <span >
              {
                row.valid_from && row.valid_to ? (
                  <>
                    {formatPassWindow(row.valid_from, row.valid_to)}
                  </>
                ) : (
                  "Flexible"
                )
              }
            </span >
            {remaining && (
              <span className="text-xs text-amber-600 font-medium">{remaining}</span>
            )}
          </div>
        )
      },
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
    <>
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
              initialFilters={activeFilters}
              onFiltersChange={(filters) => {
                setPage(1);
                // Extract filter values from filters and explicitly clear if not found
                const statusFilter = filters.find((f) => f.field === "status");
                const houseIdFilter = filters.find((f) => f.field === "house_id");
                const residentIdFilter = filters.find((f) => f.field === "resident_id");
                const startDateFilter = filters.find((f) => f.field === "created_at" && f.operator === "gte");
                const endDateFilter = filters.find((f) => f.field === "created_at" && f.operator === "lte");

                // Always set state (undefined if filter not found) to ensure URL clearing
                setStatus(statusFilter?.value as string | undefined || undefined);
                setHouseId(houseIdFilter?.value as string | undefined || undefined);
                setResidentId(residentIdFilter?.value as string | undefined || undefined);
                setStartDate(startDateFilter?.value as string | undefined || undefined);
                setEndDate(endDateFilter?.value as string | undefined || undefined);
              }}
              initialSort={sort}
              onSortChange={(newSort) => {
                setPage(1);
                setSort(newSort);
              }}
              disableClientSideFiltering={true}
              disableClientSideSorting={true}
              isLoading={isLoading || isFetching}
              className=" rounded"
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function StatusBadge({ status, className }: { status: string, className?: string }) {
  const statusMap: Record<string, { label: string; className: string }> = {
    [GatePassStatus.CHECKED_IN]: {
      label: "Checked in",
      className: cn("bg-green-50 text-green-600 border border-green-600 w-fit", className),
    },
    [GatePassStatus.CHECKED_OUT]: {
      label: "Checked out",
      className: cn("bg-indigo-50 text-indigo-600 border border-indigo-600 w-fit", className),
    },
    [GatePassStatus.PENDING]: {
      label: "Pending",
      className: cn("bg-amber-50 text-amber-600 border border-amber-600 w-fit", className),
    },
    [GatePassStatus.REVOKED]: {
      label: "Revoked",
      className: cn("bg-red-50 text-red-600 border border-red-600 w-fit", className),
    },
    [GatePassStatus.EXPIRED]: {
      label: "Expired",
      className: cn("bg-red-50 text-red-600 border border-red-600 w-fit", className),
    },
    [GatePassStatus.COMPLETED]: {
      label: "Completed",
      className: cn("bg-red-50 text-red-600 border border-red-600 w-fit", className),
    },
  };

  const data = statusMap[status] ?? {
    label: status,
    className: cn("bg-muted text-muted-foreground border border-border w-fit", className),
  };

  return (
    <Badge variant="secondary" className={`${data.className} font-normal text-xs`}>
      {data.label}
    </Badge>
  );
}
