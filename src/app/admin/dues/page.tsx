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
import { Plus, Receipt, Eye } from "lucide-react";
import { formatCurrency, titleCase } from "@/lib/utils";
import { Due } from "@/types";

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50];
const PAGE_SIZE = 10;

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
            header: "Name",
            sortable: true,
            accessor: (row) => <span className="font-medium">{row.name}</span>,
        },
        {
            key: "amount",
            header: "Amount",
            sortable: true,
            accessor: (row) => formatCurrency(row.amount),
        },
        {
            key: "tenure_length",
            header: "Tenure",
            accessor: (row) => (
                <Badge variant="secondary" className="capitalize">
                    {titleCase(row.tenure_length)}
                </Badge>
            ),
        },
        {
            key: "recurring",
            header: "Type",
            accessor: (row) => (
                <Badge variant={row.recurring ? "outline" : "secondary"}>
                    {row.recurring ? "Recurring" : "One-time"}
                </Badge>
            ),
        },
        {
            key: "houses",
            header: "Houses",
            accessor: (row) => (
                <div className="flex flex-wrap gap-1">
                    {row.houses && row.houses.length > 0 ? (
                        <>
                            {row.houses.slice(0, 2).map((h) => (
                                <Badge key={h.id} variant="secondary">
                                    {h.name}
                                </Badge>
                            ))}
                            {row.houses.length > 2 && (
                                <Badge variant="secondary">+{row.houses.length - 2}</Badge>
                            )}
                        </>
                    ) : (
                        <span className="text-muted-foreground text-xs italic">All Houses</span>
                    )}
                </div>
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
                        onClick={() => router.push(`/admin/dues/${row.id}`)}
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Dues</h1>
                    <p className="text-muted-foreground">Manage service charges and dues</p>
                </div>
                <Button onClick={() => router.push("/admin/dues/create")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Due
                </Button>
            </div>

            <Card>
                <CardContent className="p-6">
                    {isLoading ? (
                        <TableSkeleton />
                    ) : dues.length === 0 ? (
                        <EmptyState
                            icon={Receipt}
                            title="No dues found"
                            description="Create your first due to start collecting payments"
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
