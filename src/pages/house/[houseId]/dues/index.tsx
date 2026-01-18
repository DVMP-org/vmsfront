import { useMemo, useState, ReactElement } from "react";
import { useRouter } from "next/router";
import { formatCurrency, formatDate, titleCase, cn } from "@/lib/utils";
import { useHouseDues } from "@/hooks/use-resident";
import { DataTable, Column, FilterDefinition } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Wallet, Eye } from "lucide-react";
import { DueTenureLength, HouseDue, HouseDueStatus } from "@/types";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { formatFiltersForAPI } from "@/lib/table-utils";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { RouteGuard } from "@/components/auth/RouteGuard";

const PAGE_SIZE = 20;

export default function ResidentDuesPage() {
    const router = useRouter();
    const { houseId } = router.query;
    const hId = useMemo(() => (Array.isArray(houseId) ? houseId[0] : houseId) || "", [houseId]);

    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState<string | undefined>();
    const [paymentBreakdown, setPaymentBreakdown] = useState<string | undefined>();

    const activeFilters = useMemo(() => {
        const filters = [];
        if (paymentBreakdown) filters.push({ field: "payment_breakdown", operator: "eq" as const, value: paymentBreakdown });
        if (status) filters.push({ field: "status", operator: "eq" as const, value: status });
        return filters;
    }, [status, paymentBreakdown]);

    const availableFilters: FilterDefinition[] = [
        {
            field: "payment_breakdown",
            label: "Breakdown",
            type: "select",
            options: Object.values(DueTenureLength).map(v => ({ value: v, label: titleCase(v) })),
        },
        {
            field: "status",
            label: "Status",
            type: "select",
            options: Object.values(HouseDueStatus).map(v => ({ value: v, label: titleCase(v) })),
        },
    ];

    const { data, isLoading, isFetching } = useHouseDues(hId, {
        page,
        pageSize: PAGE_SIZE,
        search: search.trim() || null,
        filters: activeFilters.length > 0 ? formatFiltersForAPI(activeFilters) : undefined
    });

    if (!router.isReady) return null;

    const columns: Column<HouseDue>[] = [
        {
            key: "name",
            header: "Due Description",
            accessor: (row) => (
                <div className="py-1">
                    <span className="font-semibold text-foreground block truncate max-w-[250px]">{row.due?.name || "Service Charge"}</span>
                    <span className="text-[10px] text-muted-foreground font-mono uppercase opacity-70">RID: {row.id.split('-')[0]}</span>
                </div>
            ),
        },
        { key: "amount", header: "Total", accessor: (row) => <span className="font-medium tabular-nums">{formatCurrency(row.amount)}</span> },
        { key: "balance", header: "Balance", accessor: (row) => <span className={cn("font-bold tabular-nums", row.balance > 0 ? "text-red-500" : "text-emerald-600")}>{formatCurrency(row.balance)}</span> },
        { key: "payment_breakdown", header: "Breakdown", accessor: (row) => <span className="text-sm">{titleCase(row.payment_breakdown)}</span> },
        { key: "created_at", header: "Created", accessor: (row) => <span className="text-xs text-muted-foreground">{formatDate(row.created_at)}</span> },
        {
            key: "status",
            header: "Status",
            accessor: (row) => (
                <Badge variant={row.status === HouseDueStatus.PAID ? "success" : row.status === HouseDueStatus.PARTIALLY_PAID ? "secondary" : "danger"} className="text-[10px] uppercase font-bold px-2 py-0.5">
                    {titleCase(row.status)}
                </Badge>
            ),
        },
        {
            key: "actions",
            header: "",
            accessor: (row) => (
                <div className="flex justify-end">
                    <Button variant="ghost" size="sm" className="h-8 text-muted-foreground hover:text-primary" onClick={() => router.push(`/house/${hId}/dues/${row.due_id}`)}>
                        <Eye className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Wallet className="h-5 w-5 text-muted-foreground" />My Dues</h1>
                    <p className="text-sm text-muted-foreground mt-1">Manage service charges and utility billings for your unit.</p>
                </div>
                <Badge variant="outline" className="h-9 px-4 font-bold border-border bg-muted/5">Active Bills: {data?.total || 0}</Badge>
            </div>

            <div className="border border-border/60 rounded-lg p-3 bg-card/50">
                <DataTable
                    data={data?.items || []}
                    columns={columns}
                    searchable={true}
                    searchPlaceholder="Search dues..."
                    onSearchChange={(v) => { setPage(1); setSearch(v); }}
                    availableFilters={availableFilters}
                    onFiltersChange={(filters) => {
                        setPage(1);
                        setStatus(filters.find(f => f.field === "status")?.value as string);
                        setPaymentBreakdown(filters.find(f => f.field === "payment_breakdown")?.value as string);
                    }}
                    isLoading={isLoading || isFetching}
                    className="border-none"
                    showPagination={false}
                />
                <PaginationBar
                    page={page}
                    pageSize={PAGE_SIZE}
                    total={data?.total || 0}
                    totalPages={data?.total_pages || 1}
                    resourceLabel="dues"
                    onChange={setPage}
                />
            </div>
        </div>
    );
}

ResidentDuesPage.getLayout = function getLayout(page: ReactElement) {
    return (
        <RouteGuard>
            <DashboardLayout type="resident">
                {page}
            </DashboardLayout>
        </RouteGuard>
    );
};
