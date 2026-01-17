"use client";

import { useMemo, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatCurrency, titleCase } from "@/lib/utils";
import { useHouseDues } from "@/hooks/use-resident";
import { useUrlQuerySync } from "@/hooks/use-url-query-sync";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Receipt, Wallet, ArrowRight } from "lucide-react";
import { HouseDue, HouseDueStatus } from "@/types";
import { cn } from "@/lib/utils";

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50];
const PAGE_SIZE = 20;

export default function ResidentDuesPage() {
    const params = useParams<{ houseId: string }>();
    const router = useRouter(); // Error check: next/navigation is standard in this project
    const houseId = params.houseId;

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

    const { data, isLoading } = useHouseDues(houseId, page, pageSize);

    const dues = useMemo(() => data?.items ?? [], [data]);
    const total = data?.total ?? 0;

    const columns: Column<HouseDue>[] = [
        {
            key: "name",
            header: "Due Description",
            accessor: (row) => (
                <div className="py-1">
                    <span className="font-semibold text-foreground block truncate max-w-[250px]">{row.due?.name || "Service Charge"}</span>
                    <span className="text-[10px] text-muted-foreground font-mono tracking-tighter uppercase opacity-70">RID: {row.id.split('-')[0]}</span>
                </div>
            ),
        },
        {
            key: "amount",
            header: "Total Amount",
            accessor: (row) => <span className="font-medium tabular-nums text-foreground">{formatCurrency(row.amount)}</span>,
        },
        {
            key: "balance",
            header: "Balance Remaining",
            accessor: (row) => (
                <span className={cn(
                    "font-bold tabular-nums",
                    row.balance > 0 ? "text-red-500" : "text-emerald-600"
                )}>
                    {formatCurrency(row.balance)}
                </span>
            ),
        },
        {
            key: "status",
            header: "Payment Status",
            accessor: (row) => {
                const variants = {
                    [HouseDueStatus.PAID]: "success",
                    [HouseDueStatus.PARTIALLY_PAID]: "secondary",
                    [HouseDueStatus.UNPAID]: "danger",
                };
                return (
                    <Badge
                        variant={variants[row.status] as any}
                        className="text-[10px] font-bold uppercase tracking-tight px-2 h-5 border-none"
                    >
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
                        className="h-8 group text-xs text-muted-foreground hover:text-brand-primary"
                        onClick={() => router.replace(`/house/${houseId}/dues/${row.due_id}`)}
                    >
                        View Due
                        <ArrowRight className="h-3 w-3 ml-1 transition-transform group-hover:translate-x-0.5" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6 max-w-7xl animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <Wallet className="h-5 w-5 text-muted-foreground" />
                        My Property Dues
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        View and manage service charges, utility billings, and payment schedules for your unit.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="h-9 px-4 font-bold border-border/60 bg-muted/5 flex items-center">
                        Active Bills: {total}
                    </Badge>
                </div>
            </div>

            {/* Dues Ledger Table */}
            <div className="bg-white border border-border/60 rounded-lg overflow-hidden">
                {isLoading ? (
                    <div className="p-6">
                        <TableSkeleton />
                    </div>
                ) : dues.length === 0 ? (
                    <EmptyState
                        icon={Receipt}
                        title="No dues found"
                        description="There are no outstanding or historical dues recorded for this property unit."
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
                        className="border-none"
                    />
                )}
            </div>

            <div className="flex justify-between items-center text-[11px] text-muted-foreground/60 uppercase font-bold tracking-widest px-2">
                <span>VMS Core Property Ledger</span>
                <span>Entry Synchronization Active</span>
            </div>
        </div>
    );
}
