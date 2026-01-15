"use client";

import { useParams, useRouter } from "next/navigation";
import { useAdminDue, useAdminDueHouses } from "@/hooks/use-admin";
import { useUrlQuerySync } from "@/hooks/use-url-query-sync";
import { Card, CardContent } from "@/components/ui/Card";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Eye } from "lucide-react";
import { formatCurrency, titleCase } from "@/lib/utils";
import { HouseDue, HouseDueStatus } from "@/types";
import { useMemo, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50];

export default function DueHousesPage() {
    const params = useParams();
    const router = useRouter();
    const dueId = params?.id as string;

    const { data: due } = useAdminDue(dueId);

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

    const { data, isLoading } = useAdminDueHouses(dueId, {
        page,
        pageSize,
        search: search.trim() || undefined,
    });

    const houseDues = useMemo(() => data?.items ?? [], [data]);
    const total = data?.total ?? 0;

    const columns: Column<HouseDue>[] = [
        {
            key: "house",
            header: "House",
            accessor: (row) => (
                <div className="flex flex-col">
                    <span className="font-medium">{row.house?.name || "Unknown House"}</span>
                    <span className="text-xs text-muted-foreground">{row.house?.address}</span>
                </div>
            ),
        },
        {
            key: "amount",
            header: "Target Amount",
            accessor: (row) => formatCurrency(row.amount),
        },
        {
            key: "paid",
            header: "Paid",
            accessor: (row) => (
                <span className="text-green-600 font-medium">
                    {formatCurrency(row.paid_amount)}
                </span>
            ),
        },
        {
            key: "balance",
            header: "Balance",
            accessor: (row) => (
                <span className={cn(row.balance > 0 ? "text-destructive" : "text-muted-foreground")}>
                    {formatCurrency(row.balance)}
                </span>
            ),
        },
        {
            key: "status",
            header: "Status",
            accessor: (row) => {
                const colors = {
                    [HouseDueStatus.PAID]: "default",
                    [HouseDueStatus.PARTIALLY_PAID]: "secondary",
                    [HouseDueStatus.UNPAID]: "danger",
                };
                return (
                    <Badge variant={colors[row.status] as any} className="capitalize">
                        {titleCase(row.status)}
                    </Badge>
                );
            },
        },
        {
            key: "actions",
            header: "Actions",
            accessor: (row) => (
                <div className="flex justify-end">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/admin/dues/${dueId}/house/${row.house_id}`)}
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
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/admin/dues/${dueId}`)}
                    className="-ml-2 h-8 hover:bg-transparent hover:underline px-2"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Due
                </Button>
            </div>

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">House Dues: {due?.name}</h1>
                    <p className="text-muted-foreground">
                        Tracking payments for all houses assigned to this due
                    </p>
                </div>
            </div>

            <Card>
                <CardContent className="p-6">
                    {isLoading ? (
                        <TableSkeleton />
                    ) : (
                        <DataTable
                            data={houseDues}
                            columns={columns}
                            searchable={true}
                            searchPlaceholder="Search houses..."
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
