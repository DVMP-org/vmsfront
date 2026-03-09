"use client";

import { FormEvent, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Briefcase, FileBadge, ShieldAlert, ShieldCheck } from "lucide-react";
import { useAdminStaffMember, useAdminStaffMovementLogs, useReviewStaffKyc, useUpdateAdminStaffStatus } from "@/hooks/use-staff";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Column, DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { formatDateTime, getFullName, titleCase } from "@/lib/utils";

export default function AdminStaffDetailPage() {
    const router = useRouter();
    const params = useParams<{ staffId?: string }>();
    const rawStaffId = params?.staffId;
    const staffId = Array.isArray(rawStaffId) ? rawStaffId[0] : rawStaffId;

    const { data: staff, isLoading } = useAdminStaffMember(staffId ?? null);
    const updateStatus = useUpdateAdminStaffStatus(staffId ?? null);
    const reviewKyc = useReviewStaffKyc(staffId ?? null);
    const [status, setStatus] = useState("active");
    const [reviewStatus, setReviewStatus] = useState("verified");
    const [reviewNotes, setReviewNotes] = useState("");
    const [page, setPage] = useState(1);

    const { data: movementLogs, isFetching: isFetchingLogs } = useAdminStaffMovementLogs({
        page,
        pageSize: 10,
        staffId: staffId ?? undefined,
        sort: "-created_at",
    });

    const latestKyc = staff?.latest_kyc ?? staff?.kyc_verification ?? null;

    const logColumns: Column<any>[] = useMemo(() => [
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
    ], []);

    const handleStatusSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        updateStatus.mutate({ status });
    };

    const handleReviewSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        reviewKyc.mutate({ status: reviewStatus, notes: reviewNotes || undefined });
    };

    if (!staffId) {
        return (
            <Card>
                <CardContent className="p-10">
                    <EmptyState
                        icon={Briefcase}
                        title="Staff member not found"
                        description="The requested staff profile could not be resolved."
                        action={{ label: "Back to Staff", onClick: () => router.push("/admin/staff") }}
                    />
                </CardContent>
            </Card>
        );
    }

    if (isLoading || !staff) {
        return (
            <Card>
                <CardContent className="p-10 text-sm text-muted-foreground">Loading staff record…</CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => router.push("/admin/staff")} className="-ml-3">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
            </div>

            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold">{getFullName(staff.user?.first_name, staff.user?.last_name)}</h1>
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={staff.status === "active" ? "success" : staff.status === "suspended" ? "warning" : "secondary"}>
                            {titleCase(staff.status ?? "pending")}
                        </Badge>
                        <Badge variant={latestKyc?.status === "verified" ? "success" : latestKyc?.status === "failed" ? "danger" : "secondary"}>
                            KYC {titleCase(latestKyc?.status ?? "pending")}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{staff.user?.email}</span>
                    </div>
                </div>
                <Button variant="outline" className="gap-2" onClick={() => router.push(`/admin/staff/movement-logs?staffId=${staffId}`)}>
                    <ShieldCheck className="h-4 w-4" />
                    Open Full Logs
                </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Briefcase className="h-5 w-5" />
                                Staff overview
                            </CardTitle>
                            <CardDescription>
                                Residency: {staff.assignment?.residency?.name || staff.residency?.name || "—"} · Role: {staff.assignment?.role_title || staff.role_title || "—"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-2">
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Staff type</p>
                                <p className="mt-1 text-sm">{titleCase(staff.staff_type ?? "unknown")}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Sponsor resident</p>
                                <p className="mt-1 text-sm">{staff.assignment?.sponsor_resident?.user?.email || staff.assignment?.sponsor_resident?.name || "—"}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Created</p>
                                <p className="mt-1 text-sm">{staff.created_at ? formatDateTime(staff.created_at) : "—"}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Updated</p>
                                <p className="mt-1 text-sm">{staff.updated_at ? formatDateTime(staff.updated_at) : "—"}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <ShieldCheck className="h-5 w-5" />
                                Recent movement logs
                            </CardTitle>
                            <CardDescription>Recent entry and exit events tied to this staff profile.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <DataTable
                                data={movementLogs?.items ?? []}
                                columns={logColumns}
                                searchable={false}
                                showPagination={false}
                                emptyMessage="No movement logs found"
                                isLoading={isFetchingLogs}
                                disableClientSideFiltering
                                disableClientSideSorting
                            />
                            <PaginationBar
                                page={page}
                                pageSize={10}
                                total={movementLogs?.total ?? 0}
                                totalPages={movementLogs?.total_pages ?? 1}
                                hasNext={movementLogs?.has_next ?? false}
                                hasPrevious={movementLogs?.has_previous ?? page > 1}
                                isFetching={isFetchingLogs}
                                resourceLabel="logs"
                                onChange={setPage}
                            />
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <ShieldAlert className="h-5 w-5" />
                                Status review
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form className="space-y-4" onSubmit={handleStatusSubmit}>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Staff status</label>
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                        className="flex h-10 w-full rounded-[4px] border border-[#DEDEDE] bg-white px-3 py-2 text-sm dark:border-white/20 dark:bg-transparent"
                                    >
                                        <option value="active">Active</option>
                                        <option value="suspended">Suspended</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                                <Button type="submit" className="w-full" isLoading={updateStatus.isPending}>Update Status</Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <FileBadge className="h-5 w-5" />
                                KYC review
                            </CardTitle>
                            <CardDescription>
                                Latest submission: {latestKyc?.document_type ? titleCase(latestKyc.document_type) : "No submission"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="rounded-xl border border-border/60 p-3 text-sm text-muted-foreground">
                                <p>Status: <span className="font-medium text-foreground">{titleCase(latestKyc?.status ?? "pending")}</span></p>
                                <p>Provider: <span className="font-medium text-foreground">{titleCase(latestKyc?.provider ?? "manual")}</span></p>
                                <p>Document: <span className="font-medium text-foreground">{latestKyc?.document_number_masked || "—"}</span></p>
                            </div>
                            <form className="space-y-4" onSubmit={handleReviewSubmit}>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Decision</label>
                                    <select
                                        value={reviewStatus}
                                        onChange={(e) => setReviewStatus(e.target.value)}
                                        className="flex h-10 w-full rounded-[4px] border border-[#DEDEDE] bg-white px-3 py-2 text-sm dark:border-white/20 dark:bg-transparent"
                                    >
                                        <option value="verified">Verified</option>
                                        <option value="failed">Failed</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Notes</label>
                                    <textarea
                                        value={reviewNotes}
                                        onChange={(e) => setReviewNotes(e.target.value)}
                                        className="min-h-28 w-full rounded-[8px] border border-[#DEDEDE] bg-white px-3 py-2 text-sm dark:border-white/20 dark:bg-transparent"
                                        placeholder="All documents verified"
                                    />
                                </div>
                                <Button type="submit" className="w-full" isLoading={reviewKyc.isPending}>Submit Review</Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
