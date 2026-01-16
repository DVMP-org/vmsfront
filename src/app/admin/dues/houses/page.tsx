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
import { Building2, Eye, Receipt, ChevronRight, Filter, Activity } from "lucide-react";
import { formatCurrency, titleCase } from "@/lib/utils";
import { Due } from "@/types";

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50];
const PAGE_SIZE = 20;

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
            header: "Due",
            accessor: (row) => (
                <div className="py-1">
                    <span className="font-medium text-foreground block">{row.name}</span>
                    <span className="text-[9px] text-muted-foreground font-mono uppercase tracking-tighter opacity-70">RID: {row.id.split('-')[0]}</span>
                </div>
            ),
        },
        {
            key: "amount",
            header: "Amount",
            accessor: (row) => <span className="font-medium tabular-nums">{formatCurrency(row.amount)}</span>,
        },
        {
            key: "houses_count",
            header: "Houses",
            accessor: (row) => (
                <div className="flex items-center gap-1.5">
                    <Building2 className="h-3 w-3 text-muted-foreground/40" />
                    <span className="text-xs font-bold text-muted-foreground/80">
                        {row.houses?.length || 0} Houses
                    </span>
                </div>
            ),
        },
        {
            key: "actions",
            header: "",
            accessor: (row) => (
                <div className="flex justify-end">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-3 text-[10px] font-black uppercase tracking-tighter text-primary hover:bg-primary/5"
                        onClick={() => router.push(`/admin/dues/${row.id}/houses`)}
                    >
                        View
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-4">
            {/* Enterprise Navigation Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-muted-foreground/10 pb-4">
                <div className="space-y-0.5">
                    <div className="flex items-center gap-2 text-[9px] font-black uppercase  text-muted-foreground/50">
                        <span>Dues</span>
                        <ChevronRight className="h-2.5 w-2.5 opacity-40" />
                        <span className="text-foreground">Houses</span>
                    </div>
                    <h1 className="text-xl font-black  text-foreground leading-none">House Dues</h1>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-9 border-muted-foreground/20 text-xs font-bold uppercase ">
                        <Filter className="h-3.5 w-3.5 mr-2 opacity-60" />
                        Filter
                    </Button>
                </div>
            </div>

            {/* Assessment Grid */}
            <div className="bg-muted/10 border border-muted-foreground/10 rounded-md p-1">
                {isLoading ? (
                    <div className="bg-background rounded-lg p-6">
                        <TableSkeleton />
                    </div>
                ) : dues.length === 0 ? (
                    <div className="bg-background rounded-lg">
                        <EmptyState
                            icon={Receipt}
                            title="No dues found"
                            description="No dues have been created yet."
                        />
                    </div>
                ) : (
                    <div className="bg-background rounded-lg overflow-hidden shadow-sm">
                        <DataTable
                            data={dues}
                            columns={columns}
                            searchable={true}
                            searchPlaceholder="Filter dues..."
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

            {/* Footer Metrics */}
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">
                        <Activity className="h-3 w-3" />
                        Dues
                    </div>
                </div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest tabular-nums">
                    Total: {total}
                </span>
            </div>
        </div>
    );
}
