"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, Briefcase, Eye } from "lucide-react";
import { useAdminStaff } from "@/hooks/use-staff";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Column, DataTable } from "@/components/ui/DataTable";
import { Input } from "@/components/ui/Input";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { formatDateTime, getFullName, titleCase } from "@/lib/utils";
import type { StaffMember } from "@/types/staff";

export default function AdminStaffPage() {
    const router = useRouter();
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [kycStatus, setKycStatus] = useState("");

    const { data, isLoading, isFetching } = useAdminStaff({
        page,
        pageSize,
        search: search.trim() || undefined,
        status: status || undefined,
        kycStatus: kycStatus || undefined,
    });

    const staff = useMemo(() => data?.items ?? [], [data]);

    const columns: Column<StaffMember>[] = [
        {
            key: "name",
            header: "Staff member",
            accessor: (row) => (
                <div>
                    <p className="font-medium text-foreground">{getFullName(row.user?.first_name, row.user?.last_name)}</p>
                    <p className="text-xs text-muted-foreground">{row.user?.email ?? "No email"}</p>
                </div>
            ),
        },
        {
            key: "residency",
            header: "Residency",
            accessor: (row) => row.assignment?.residency?.name || row.residency?.name || "—",
        },
        {
            key: "staff_type",
            header: "Type",
            accessor: (row) => titleCase(row.staff_type ?? "unknown"),
        },
        {
            key: "status",
            header: "Status",
            accessor: (row) => (
                <Badge variant={row.status === "active" ? "success" : row.status === "suspended" ? "warning" : "secondary"}>
                    {titleCase(row.status ?? "pending")}
                </Badge>
            ),
        },
        {
            key: "kyc",
            header: "KYC",
            accessor: (row) => (
                <Badge variant={row.latest_kyc?.status === "verified" ? "success" : row.latest_kyc?.status === "failed" ? "danger" : "secondary"}>
                    {titleCase(row.latest_kyc?.status ?? "pending")}
                </Badge>
            ),
        },
        {
            key: "updated_at",
            header: "Updated",
            accessor: (row) => row.updated_at ? formatDateTime(row.updated_at) : "—",
        },
        {
            key: "actions",
            header: "",
            accessor: (row) => (
                <Button variant="ghost" size="sm" onClick={() => router.push(`/admin/staff/${row.id}`)}>
                    <Eye className="h-4 w-4" />
                </Button>
            ),
            className: "text-right",
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Staff</h1>
                    <p className="text-muted-foreground">Review staff across the organization and jump into detail or global movement logs.</p>
                </div>
                <Button variant="outline" className="gap-2" onClick={() => router.push(`/admin/staff/movement-logs`)}>
                    <Activity className="h-4 w-4" />
                    Movement Logs
                </Button>
            </div>

            <Card>
                <CardHeader className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Briefcase className="h-5 w-5" />
                            Staff directory
                        </CardTitle>
                        <CardDescription>Admin-facing oversight of staff assignment, KYC, and status.</CardDescription>
                    </div>
                    <div className="grid gap-2 md:grid-cols-3">
                        <Input
                            value={search}
                            onChange={(e) => {
                                setPage(1);
                                setSearch(e.target.value);
                            }}
                            placeholder="Search staff"
                        />
                        <select
                            value={status}
                            onChange={(e) => {
                                setPage(1);
                                setStatus(e.target.value);
                            }}
                            className="flex h-10 w-full rounded-[4px] border border-[#DEDEDE] bg-white px-3 py-2 text-sm dark:border-white/20 dark:bg-transparent"
                        >
                            <option value="">All statuses</option>
                            <option value="active">Active</option>
                            <option value="pending">Pending</option>
                            <option value="suspended">Suspended</option>
                            <option value="inactive">Inactive</option>
                        </select>
                        <select
                            value={kycStatus}
                            onChange={(e) => {
                                setPage(1);
                                setKycStatus(e.target.value);
                            }}
                            className="flex h-10 w-full rounded-[4px] border border-[#DEDEDE] bg-white px-3 py-2 text-sm dark:border-white/20 dark:bg-transparent"
                        >
                            <option value="">All KYC states</option>
                            <option value="pending">Pending</option>
                            <option value="submitted">Submitted</option>
                            <option value="verified">Verified</option>
                            <option value="failed">Failed</option>
                        </select>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <DataTable
                        data={staff}
                        columns={columns}
                        searchable={false}
                        showPagination={false}
                        emptyMessage="No staff found"
                        isLoading={isLoading || isFetching}
                        disableClientSideFiltering
                        disableClientSideSorting
                    />
                    <PaginationBar
                        page={page}
                        pageSize={pageSize}
                        total={data?.total ?? staff.length}
                        totalPages={data?.total_pages ?? 1}
                        hasNext={data?.has_next ?? false}
                        hasPrevious={data?.has_previous ?? page > 1}
                        isFetching={isFetching}
                        resourceLabel="staff"
                        onChange={setPage}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
