"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminDues } from "@/hooks/use-admin";
import { useUrlQuerySync } from "@/hooks/use-url-query-sync";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Plus, Receipt, Filter, LayoutGrid } from "lucide-react";
import { formatCurrency, titleCase } from "@/lib/utils";
import { Due } from "@/types";

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50];
const PAGE_SIZE = 20;

export default function DuesPage() {
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
            sortable: true,
            accessor: (row) => (
                <div className="py-1">
                    <span className="font-semibold text-foreground block truncate max-w-[250px]">{row.name}</span>
                    <span className="text-[10px] text-muted-foreground font-mono tracking-tighter uppercase opacity-70 leading-none">ID: {row.id.split('-')[0]}</span>
                </div>
            ),
        },
        {
            key: "amount",
            header: "Amount",
            sortable: true,
            accessor: (row) => <span className="font-medium tabular-nums text-foreground">{formatCurrency(row.amount)}</span>,
        },
        {
            key: "tenure_length",
            header: "Billing Cycle",
            accessor: (row) => (
                <span className="text-xs text-muted-foreground capitalize">
                    {titleCase(row.tenure_length)}
                </span>
            ),
        },
        {
            key: "recurring",
            header: "Plan Type",
            accessor: (row) => (
                <Badge
                    variant="outline"
                    className={cn(
                        "text-[10px] font-bold uppercase tracking-tight px-2 py-0 h-5 border-border/40",
                        row.recurring ? "bg-brand-primary/5 text-brand-primary border-brand-primary/20" : "bg-zinc-100 text-zinc-600 border-zinc-200"
                    )}
                >
                    {row.recurring ? "Recurring" : "One-time"}
                </Badge>
            ),
        },
        {
            key: "houses",
            header: "Houses",
            accessor: (row) => (
                <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-muted-foreground">
                        {row.houses && row.houses.length > 0 ? `${row.houses.length} Units` : "Global"}
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
                        className="h-8 group text-xs text-muted-foreground hover:text-brand-primary transition-colors"
                        onClick={() => router.push(`/admin/dues/${row.id}`)}
                    >
                        View
                        <ArrowRight className="h-3 w-3 ml-1 transition-transform group-hover:translate-x-0.5" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6 max-w-7xl animate-in fade-in duration-500">
            {/* VMS Standard Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <Receipt className="h-5 w-5 text-muted-foreground" />
                        Dues
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage your property fees and dues.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-10 "
                        onClick={() => router.push("/admin/dues/houses")}
                    >
                        <LayoutGrid className="h-4 w-4 mr-2" />
                        House List
                    </Button>
                    <Button
                        size="sm"
                        className="h-10 px-4 "
                        onClick={() => router.push("/admin/dues/create")}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Create New Due
                    </Button>
                </div>
            </div>

            <div className="bg-white border border-border/60 rounded-lg overflow-hidden">
                {isLoading ? (
                    <div className="p-6">
                        <TableSkeleton />
                    </div>
                ) : dues.length === 0 ? (
                    <EmptyState
                        icon={Receipt}
                        title="No dues found"
                        description="You haven't created any dues yet. Start by creating a new one."
                        action={{
                            label: "Create Due",
                            onClick: () => router.push("/admin/dues/create"),
                        }}
                    />
                ) : (
                    <DataTable
                        data={dues}
                        columns={columns}
                        searchable={true}
                        searchPlaceholder="Search dues by name..."
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
                <span>Dues</span>
                <span>Total: {total}</span>
            </div>
        </div>
    );
}

import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
