"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useVisitors } from "@/hooks/use-resident";
import { useAppStore } from "@/store/app-store";
import { useProfile } from "@/hooks/use-auth";

import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { Column, DataTable } from "@/components/ui/DataTable";
import { Users, Home as HomeIcon } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { PaginationBar } from "@/components/ui/PaginationBar";
import type { Visitor } from "@/types";
import { Button } from "@/components/ui/Button";

export default function VisitorsPage() {
  const router = useRouter();
  const params = useParams<{ houseId?: string }>();
  const rawHouseId = params?.houseId;
  const routeHouseId = Array.isArray(rawHouseId) ? rawHouseId[0] : rawHouseId;
  const { selectedHouse, setSelectedHouse } = useAppStore();
  const { data: profile } = useProfile();
  const houseId = routeHouseId ?? selectedHouse?.id ?? null;

  const [page, setPage] = useState(1);
  const pageSize = 10;
  const { data: paginatedVisitors, isLoading, isFetching } = useVisitors(
    houseId,
    page,
    pageSize
  );

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

  // Ensure visitors is always an array, even if API response is malformed
  const visitors = useMemo(() => {
    if (!paginatedVisitors) return [];

    // Handle case where API returns data directly (not wrapped)
    if (Array.isArray(paginatedVisitors)) {
      return paginatedVisitors;
    }

    // Handle case where API returns PaginatedResponse
    const items = paginatedVisitors?.items;
    if (!items) return [];
    if (!Array.isArray(items)) return [];
    return items;
  }, [paginatedVisitors]);

  const visitorColumns: Column<Visitor>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      filterable: true,
      className: "font-medium",
    },
    {
      key: "email",
      header: "Email",
      sortable: true,
      filterable: true,
      accessor: (row) => row.email || "-",
    },
    {
      key: "phone",
      header: "Phone",
      sortable: true,
      accessor: (row) => row.phone || "-",
    },
    {
      key: "created_at",
      header: "Created",
      sortable: true,
      accessor: (row) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.created_at)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      accessor: (row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/house/${houseId}/visitors/${row.id}`)}
        >
          View
        </Button>
      ),
      className: "text-right",
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
              description="Choose a house from the dashboard selector to view visitor history."
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
        <div>
          <h1 className="text-3xl font-bold">Visitors</h1>
          <p className="text-muted-foreground">View all your visitors</p>
        </div>

        <Card>
          <CardContent className="p-6">
            {isLoading ? (
              <TableSkeleton />
            ) : !visitors.length ? (
              <EmptyState
                icon={Users}
                title="No visitors yet"
                description="Visitors from your passes will appear here"
              />
            ) : (
              <>
                <DataTable
                  data={Array.isArray(visitors) ? visitors : []}
                  columns={visitorColumns}
                  searchable
                  showPagination={false}
                  emptyMessage="No visitors found"
                  searchPlaceholder="Search visitors..."
                />
                <PaginationBar
                  page={page}
                  pageSize={pageSize}
                  total={paginatedVisitors?.total ?? visitors.length}
                  totalPages={paginatedVisitors?.total_pages ?? 1}
                  hasNext={
                    paginatedVisitors?.has_next ??
                    page < (paginatedVisitors?.total_pages ?? 0)
                  }
                  hasPrevious={
                    paginatedVisitors?.has_previous ?? page > 1
                  }
                  isFetching={isFetching}
                  resourceLabel="visitors"
                  onChange={(next) => setPage(next)}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
