"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminDues } from "@/hooks/use-admin";
import { useUrlQuerySync } from "@/hooks/use-url-query-sync";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Building2, Eye, Receipt } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Due } from "@/types";

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50];
const PAGE_SIZE = 10;

export default function HouseDuesOverviewPage() {
    const router = useRouter();

    const { initializeFromUrl, syncToUrl } = useUrlQuerySync({
        config: {
            page: { defaultValue: 1 },
            pageSize: { defaultValue: PAGE_SIZE },
            search: { defaultValue: "" },
        },
        skipInitialSync: true,
    });

    const [page, setPage] = useState(() => initializeFromUrl("page"));
    const [pageSize, setPageSize] = useState(() => initializeFromUrl("pageSize"));
    const [search, setSearch] = useState(() => initializeFromUrl("search"));

    useEffect(() => {
        syncToUrl({ page, pageSize, search });
    }, [page, pageSize, search, syncToUrl]);

    const { data, isLoading } = useAdminDues({
        page,
        pageSize,
        search: search.trim() || undefined,
    });

    const dues = useMemo(() => data?.items ?? [], [data]);
    const total = data?.total ?? 0;

    const columns: Column<Due>[] = [
        {
            key: "name",
            header: "Due Name",
            accessor: (row) => <span className="font-medium">{row.name}</span>,
        },
        {
            key: "amount",
            header: "Amount",
            accessor: (row) => formatCurrency(row.amount),
        },
        {
            key: "houses_count",
            header: "Assigned Houses",
            accessor: (row) => (
                <Badge variant="outline">
                    {row.houses?.length || 0} Houses
                </Badge>
            ),
        },
        {
            key: "actions",
            header: "Actions",
            accessor: (row) => (
                <div className="flex justify-end">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/admin/dues/${row.id}/houses`)}
                    >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">House Dues Overview</h1>
                <p className="text-muted-foreground">Select a due to view detailed house-by-house status</p>
            </div>

            <Card>
                <CardContent className="p-6">
                    {isLoading ? (
                        <TableSkeleton />
                    ) : dues.length === 0 ? (
                        <EmptyState
                            icon={Receipt}
                            title="No dues found"
                            description="Create a due first to manage house assignments"
                        />
                    ) : (
                        <DataTable
                            data={dues}
                            columns={columns}
                            searchable={true}
                            searchPlaceholder="Search dues..."
                            pageSize={pageSize}
                            onPageSizeChange={setPageSize}
                            pageSizeOptions={PAGE_SIZE_OPTIONS}
                            serverSide={true}
                            total={total}
                            currentPage={page}
                            onPageChange={setPage}
                            onSearchChange={(val) => {
                                setPage(1);
                                setSearch(val);
                            }}
                            externalSearch={search}
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
