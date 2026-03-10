"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Activity } from "lucide-react";
import { useAdminStaffMovementLogs } from "@/hooks/use-staff";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Column, DataTable } from "@/components/ui/DataTable";
import { Input } from "@/components/ui/Input";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { formatDateTime, getFullName } from "@/lib/utils";

export default function AdminStaffMovementLogsPage() {
    const searchParams = useSearchParams();
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [search, setSearch] = useState("");
    const [staffId, setStaffId] = useState(searchParams?.get("staffId") ?? "");

    const { data, isLoading, isFetching } = useAdminStaffMovementLogs({
        page,
        pageSize,
        search: search.trim() || undefined,
        staffId: staffId || undefined,
        sort: "-created_at",
    });

    const columns: Column<any>[] = [
        {
            key: "staff",
            header: "Staff member",
            accessor: (row) => (
                <div>
                    <p className="font-medium text-foreground">
                        {getFullName(row.staff?.user?.first_name ?? row.owner?.user?.first_name, row.staff?.user?.last_name ?? row.owner?.user?.last_name)}
                    </p>
                    <p className="text-xs text-muted-foreground">{row.staff?.user?.email ?? row.owner?.user?.email ?? "No email"}</p>
                </div>
            ),
        },
        {
            key: "residency",
            header: "Residency",
            accessor: (row) => row.residency?.name ?? "—",
        },
        {
            key: "gate",
            header: "Gate",
            accessor: (row) => row.gate?.name ?? "—",
        },
        {
            key: "checkin_time",
            header: "Check-in",
            accessor: (row) => row.checkin_time ? formatDateTime(row.checkin_time) : "—",
        },
        {
            key: "checkout_time",
            header: "Check-out",
            accessor: (row) => row.checkout_time ? formatDateTime(row.checkout_time) : "—",
        },
        {
            key: "status",
            header: "Status",
            accessor: (row) => (
                <Badge variant={row.checkout_time ? "secondary" : "success"}>
                    {row.checkout_time ? "Checked out" : "Checked in"}
                </Badge>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Staff Movement Logs</h1>
                <p className="text-muted-foreground">Organization-wide movement visibility for staff entry and exit records.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Activity className="h-5 w-5" />
                        Staff gate events
                    </CardTitle>
                    <CardDescription>Use the staff filter to narrow logs to one staff profile.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2 md:grid-cols-2">
                        <Input
                            value={search}
                            onChange={(e) => {
                                setPage(1);
                                setSearch(e.target.value);
                            }}
                            placeholder="Search by residency or staff"
                        />
                        <Input
                            value={staffId}
                            onChange={(e) => {
                                setPage(1);
                                setStaffId(e.target.value);
                            }}
                            placeholder="Filter by staff ID"
                        />
                    </div>
                    <DataTable
                        data={data?.items ?? []}
                        columns={columns}
                        searchable={false}
                        showPagination={false}
                        emptyMessage="No staff movement logs found"
                        isLoading={isLoading || isFetching}
                        disableClientSideFiltering
                        disableClientSideSorting
                    />
                    <PaginationBar
                        page={page}
                        pageSize={pageSize}
                        total={data?.total ?? 0}
                        totalPages={data?.total_pages ?? 1}
                        hasNext={data?.has_next ?? false}
                        hasPrevious={data?.has_previous ?? page > 1}
                        isFetching={isFetching}
                        resourceLabel="logs"
                        onChange={setPage}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
