"use client";

import { useParams, useRouter } from "next/navigation";
import { useAdminDue, useAdminDueHouses } from "@/hooks/use-admin";
import { useUrlQuerySync } from "@/hooks/use-url-query-sync";
import { Card, CardContent } from "@/components/ui/Card";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ChevronLeft, Eye, LayoutGrid, ChevronRight, Activity } from "lucide-react";
import { formatCurrency, titleCase } from "@/lib/utils";
import { HouseDue, HouseDueStatus } from "@/types";
import { useMemo, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

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
                <div className="py-1">
                    <span className="font-medium text-foreground block">{row.house?.name || "Null_Unit"}</span>
                    <span className="text-[9px] text-muted-foreground font-mono uppercase tracking-tighter opacity-70">UID: {row.house_id}</span>
                </div>
            ),
        },
        {
            key: "amount",
            header: "Total Amount",
            accessor: (row) => <span className="font-medium tabular-nums">{formatCurrency(row.amount)}</span>,
        },
        {
            key: "paid",
            header: "Paid",
            accessor: (row) => (
                <span className="text-emerald-600 font-medium tabular-nums">
                    +{formatCurrency(row.paid_amount)}
                </span>
            ),
        },
        {
            key: "balance",
            header: "Balance",
            accessor: (row) => (
                <span className={cn("font-bold tabular-nums", row.balance > 0 ? "text-red-500" : "text-emerald-600")}>
                    {formatCurrency(row.balance)}
                </span>
            ),
        },
        {
            key: "status",
            header: "Status",
            accessor: (row) => {
                const variants = {
                    [HouseDueStatus.PAID]: "success",
                    [HouseDueStatus.PARTIALLY_PAID]: "secondary",
                    [HouseDueStatus.UNPAID]: "danger",
                };
                return (
                    <Badge variant={variants[row.status] as any} className="text-[10px] font-black uppercase tracking-tighter px-2 h-5 border-none">
                        {titleCase(row.status)}
                    </Badge>
                );
            },
        },
        {
            key: "actions",
            header: "",
            accessor: (row) => (
                <div className="flex justify-end">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-[10px] font-black uppercase tracking-tighter text-primary hover:bg-primary/5"
                        onClick={() => router.push(`/admin/dues/${dueId}/house/${row.house_id}`)}
                    >
                        View
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-4">
            {/* Utility Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-muted-foreground/10 pb-4">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => router.push(`/admin/dues/${dueId}`)}
                        className="h-8 w-8 border-muted-foreground/20 rounded-md"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="space-y-0.5">
                        <div className="flex items-center gap-2 text-[11px] font-black uppercase  text-muted-foreground/50">
                            <span>Dues</span>
                            <ChevronRight className="h-2.5 w-2.5 opacity-40" />
                            <span className="text-primary/70">{due?.name || "Due"}</span>
                            <ChevronRight className="h-2.5 w-2.5 opacity-40" />
                            <span className="text-foreground">Houses</span>
                        </div>
                        <h1 className="text-xl font-black  text-foreground leading-none">House List</h1>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="h-8 font-black uppercase  text-[10px] bg-muted/5 border-muted-foreground/10 px-3">
                        Total: {total}
                    </Badge>
                </div>
            </div>

            {/* Matrix Ledger */}
            <div className="bg-muted/10 border border-muted-foreground/10 rounded-md p-1">
                {isLoading ? (
                    <div className="bg-background rounded-lg p-6">
                        <TableSkeleton />
                    </div>
                ) : (
                    <div className="bg-background rounded-lg overflow-hidden shadow-sm">
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
                            className="border-none"
                        />
                    </div>
                )}
            </div>


        </div>
    );
}
