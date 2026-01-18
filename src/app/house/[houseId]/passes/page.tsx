"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { differenceInHours, formatDistanceToNow } from "date-fns";
import { useGatePasses } from "@/hooks/use-resident";
import { useProfile } from "@/hooks/use-auth";
import { useAppStore } from "@/store/app-store";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { Column, DataTable, FilterConfig, FilterDefinition } from "@/components/ui/DataTable";
import { Plus, CreditCard, ArrowRight, Home as HomeIcon } from "lucide-react";
import { formatDate, formatDateTime, formatPassWindow, getPassStatusColor, getTimeRemaining, titleCase } from "@/lib/utils";
import { GatePassStatus, type GatePass } from "@/types";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { useUrlQuerySync } from "@/hooks/use-url-query-sync";
import { formatFiltersForAPI } from "@/lib/table-utils";

const STATUS_FILTERS: Array<{ label: string; value: string | undefined }> = [
  { label: "Checked-in", value: GatePassStatus.CHECKED_IN },
  { label: "Checked-out", value: GatePassStatus.CHECKED_OUT },
  { label: "Pending", value: GatePassStatus.PENDING },
  { label: "Completed", value: GatePassStatus.COMPLETED },
  { label: "Revoked", value: GatePassStatus.REVOKED },
  { label: "Expired", value: GatePassStatus.EXPIRED },
];
const PAGE_SIZE = 100;
export default function PassesPage() {
  const router = useRouter();
  const params = useParams<{ houseId?: string }>();
  const rawHouseId = params?.houseId;
  const routeHouseId = Array.isArray(rawHouseId) ? rawHouseId[0] : rawHouseId;
  const { selectedHouse, setSelectedHouse } = useAppStore();
  const { data: profile } = useProfile();
  const houseId = routeHouseId ?? selectedHouse?.id ?? null;

  const config = useMemo(() => ({
    page: { defaultValue: 1 },
    pageSize: { defaultValue: PAGE_SIZE },
    search: { defaultValue: "" },
    sort: { defaultValue: null },
    status: { defaultValue: "" },
    startDate: { defaultValue: "" },
    endDate: { defaultValue: "" },
  }), []);

  const { initializeFromUrl, syncToUrl } = useUrlQuerySync({
    config,
    skipInitialSync: true,
  });
  const isInitialMount = useRef(true);
  const [page, setPage] = useState(() => initializeFromUrl("page"));
  const [pageSize, setPageSize] = useState(() => initializeFromUrl("pageSize"));
  const [search, setSearch] = useState(() => initializeFromUrl("search"));
  const [sort, setSort] = useState(() => initializeFromUrl("sort"));
  const [status, setStatus] = useState(() => initializeFromUrl("status"));
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
      sort,
      startDate,
      endDate
    });
  }, [
    page,
    pageSize,
    search,
    status,
    sort,
    startDate,
    endDate,
    syncToUrl]);

  const activeFilters = useMemo(() => {
    const filters: FilterConfig[] = [];

    if (status) {
      filters.push({ field: "status", operator: "eq", value: status });
    }

    if (startDate) {
      filters.push({ field: "created_at", operator: "gte", value: startDate });
    }
    if (endDate) {
      filters.push({ field: "created_at", operator: "lte", value: endDate });
    }
    return filters;
  },
    [
      status,
      startDate,
      endDate
    ]
  );

  const availableFilters: FilterDefinition[] = useMemo(() => {
    const filters: FilterDefinition[] = [
      {
        field: "status",
        label: "Status",
        type: "select",
        options: STATUS_FILTERS,
      },
      {
        field: "created_at",
        label: "Created Between",
        type: "date-range",
      },
    ]
    return filters;
  }, []);


  const {
    data: paginatedPasses,
    isLoading,
    isFetching,
  } = useGatePasses(
    houseId,
    {
      page,
      pageSize,
      search,
      sort,
      filters: formatFiltersForAPI(activeFilters)
    });

  useEffect(() => {
    if (!routeHouseId || !profile?.houses) return;
    if (selectedHouse?.id === routeHouseId) return;
    const match = profile.houses.find((house) => house.id === routeHouseId);
    if (match) {
      setSelectedHouse(match);
    }
  }, [routeHouseId, profile?.houses, selectedHouse?.id, setSelectedHouse]);

  useEffect(() => {
    setPage(1);
  }, [houseId]);

  const houseBase = houseId ? `/house/${houseId}` : "/select";


  type PassRow = GatePass & {
    visitorNames: string;
    validWindow: string;
    statusLabel: string;
    usesSummary: string;
  };

  const passRows: PassRow[] = useMemo(
    () => {
      const items = paginatedPasses?.items;
      if (!items) return [];
      if (!Array.isArray(items)) return [];

      return items.map((pass) => ({
        ...pass,
        visitorNames:
          pass.visitors?.map((visitor) => visitor.name).join(", ") ||
          "No visitors",
        validWindow: formatPassWindow(pass.valid_from, pass.valid_to),
        statusLabel: titleCase(pass.status.replace("_", " ")),
        usesSummary:
          pass.max_uses !== null && pass.max_uses !== undefined
            ? `${pass.uses_count}/${pass.max_uses}`
            : `${pass.uses_count} used`
      }));
    },
    [paginatedPasses]
  );
  const passColumns: Column<PassRow>[] = [
    {
      key: "code",
      header: "Pass",
      className: "font-mono text-sm font-semibold",
    },
    {
      key: "visitorNames",
      header: "Visitors",
      accessor: (row) =>
        row.visitors && row.visitors.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {row.visitors.map((visitor) => (
              <Badge key={visitor.id} variant="secondary" className="px-2 py-0.5">
                {visitor.name}
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">No visitors</span>
        ),
    },
    {
      key: "validWindow",
      header: "Validity",
      sortable: true,
      accessor: (row) => {
        const remaining = getTimeRemaining(row.valid_to);
        return (
          <div className="flex flex-col text-sm leading-5">
            <span>{row.validWindow}</span>
            {remaining && (
              <span className="text-xs text-amber-600 font-medium">{remaining}</span>
            )}
          </div>
        );
      },
    },
    {
      key: "statusLabel",
      header: "Status",

      accessor: (row) => (
        <Badge className={`${getPassStatusColor(row.status)} px-2 py-0.5`}>
          {row.statusLabel}
        </Badge>
      ),
    },
    {
      key: "usesSummary",
      header: "Usage",
      accessor: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.usesSummary}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      sortable: true,
      accessor: (row) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.created_at)}
        </span>
      )
    },
    {
      key: "id",
      header: "",
      accessor: (row) => (
        <Button
          variant="ghost"
          size="sm"
          className="gap-1"
          onClick={() => router.push(`${houseBase}/passes/${row.id}`)}
        >
          View
          <ArrowRight className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  if (!houseId) {
    return (
      <>
        <Card>
          <CardContent className="p-10">
            <EmptyState
              icon={HomeIcon}
              title="Select a house to continue"
              description="Choose a house from the dashboard selector to manage passes."
              action={{
                label: "Choose House",
                onClick: () => router.push("/select"),
              }}
            />
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Passes</h1>
            <p className="text-muted-foreground">Manage your visitor passes</p>
          </div>
          <Button onClick={() => router.push(`${houseBase}/passes/create`)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Pass
          </Button>
        </div>
        <Card>
          <CardContent className="p-6">

            <>
              <DataTable
                data={passRows}
                columns={passColumns}
                searchable
                showPagination={false}
                searchPlaceholder="Search passes..."
                emptyMessage="No passes match your filters"
                isLoading={isLoading || isFetching}
                initialFilters={activeFilters}
                availableFilters={availableFilters}
                onPageSizeChange={(newPageSize) => {
                  setPage(1);
                  setPageSize(newPageSize);
                }}
                onFiltersChange={(filters) => {
                  setPage(1)
                  const statusFilter = filters.find((f) => f.field === "status");
                  const startDateFilter = filters.find((f) => f.field === "created_at" && f.operator === "gte");
                  const endDateFilter = filters.find((f) => f.field === "created_at" && f.operator === "lte");

                  // Always set state (undefined if filter not found) to ensure URL clearing
                  setStatus(statusFilter?.value as string | undefined || undefined);
                  setStartDate(startDateFilter?.value as string | undefined || undefined);
                  setEndDate(endDateFilter?.value as string | undefined || undefined);
                }}
                onSortChange={(sort) => {
                  setPage(1)
                  setSort(sort)
                }}
                onSearchChange={(search) => {
                  setPage(1)
                  setSearch(search)
                }}
                initialSort={sort}
                initialSearch={search}
                disableClientSideFiltering={true}
                disableClientSideSorting={true}
              />
              <PaginationBar
                page={page}
                pageSize={pageSize}
                total={paginatedPasses?.total ?? passRows.length}
                totalPages={paginatedPasses?.total_pages ?? 1}
                hasNext={
                  paginatedPasses?.has_next ??
                  page < (paginatedPasses?.total_pages ?? 0)
                }
                hasPrevious={
                  paginatedPasses?.has_previous ?? page > 1
                }
                isFetching={isFetching}
                resourceLabel="passes"
                onChange={(next) => setPage(next)}
              />
            </>

          </CardContent>
        </Card>
      </div>
    </>
  );
}


