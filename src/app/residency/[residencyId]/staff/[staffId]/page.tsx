"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    Briefcase,
    Clock3,
    FileBadge,
    ShieldCheck,
    UserCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Column, DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { PaginationBar } from "@/components/ui/PaginationBar";
import {
    useCreateStaffPermission,
    useResidencyStaffMember,
    useStaffKycHistory,
    useStaffMovementLogs,
    useSubmitStaffKyc,
    useUpdateResidencyStaffMember,
} from "@/hooks/use-staff";
import { formatDateTime, getFullName, titleCase } from "@/lib/utils";
import type { StaffAssignmentUpdate, StaffKYCSubmit, StaffMovementPermissionCreate } from "@/types/staff";
import { useGates } from "@/hooks/use-resident";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
function toDateTimeLocal(value?: string | null) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const pad = (input: number) => `${input}`.padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function ResidencyStaffDetailPage() {
    const router = useRouter();
    const params = useParams<{ residencyId?: string; staffId?: string }>();
    const rawResidencyId = params?.residencyId;
    const rawStaffId = params?.staffId;
    const residencyId = Array.isArray(rawResidencyId) ? rawResidencyId[0] : rawResidencyId;
    const staffId = Array.isArray(rawStaffId) ? rawStaffId[0] : rawStaffId;

    const { data: staff, isLoading } = useResidencyStaffMember(residencyId ?? null, staffId ?? null);
    const updateMutation = useUpdateResidencyStaffMember(residencyId ?? null, staffId ?? null);
    const permissionMutation = useCreateStaffPermission(residencyId ?? null, staffId ?? null);
    const kycMutation = useSubmitStaffKyc(residencyId ?? null, staffId ?? null);

    const [logPage, setLogPage] = useState(1);
    const [logPageSize] = useState(10);

    const { data: logs, isFetching: isFetchingLogs } = useStaffMovementLogs(residencyId ?? null, staffId ?? null, {
        page: logPage,
        pageSize: logPageSize,
        sort: "-created_at",
    });
    const { data: kycHistory } = useStaffKycHistory(residencyId ?? null, staffId ?? null);
    const { data: gatesData } = useGates(residencyId ?? null, {
        page: 1,
        pageSize: 100,
    });

    const gates = gatesData?.items ?? [];
    const gateOptions = useMemo(
        () => gates.map((gate) => ({ label: gate.name, value: gate.id })),
        [gates]
    );
    const [assignmentForm, setAssignmentForm] = useState<StaffAssignmentUpdate>({
        notes: "",
        is_active: true,
        valid_from: "",
        valid_to: "",
    });
    const [permissionForm, setPermissionForm] = useState<StaffMovementPermissionCreate>({
        allowed_days: [],
        time_start: "08:00:00",
        time_end: "18:00:00",
        allowed_gates: [],
        entry_mode: "free",
        exit_mode: "free",
        requires_host_confirmation: false,
        notes: "",
    });
    const [kycForm, setKycForm] = useState<StaffKYCSubmit>({
        document_type: "national_id",
        document_number_masked: "",
        provider: "manual",
    });
    useEffect(() => {
        if (!staff) return;
        setAssignmentForm({
            notes: staff.assignment?.notes ?? "",
            is_active: staff.assignment?.is_active ?? true,
            valid_from: toDateTimeLocal(staff.assignment?.valid_from),
            valid_to: toDateTimeLocal(staff.assignment?.valid_to),
        });
        setPermissionForm({
            allowed_days: staff.movement_permission?.allowed_days ?? [],
            time_start: staff.movement_permission?.time_start ?? "08:00:00",
            time_end: staff.movement_permission?.time_end ?? "18:00:00",
            allowed_gates: staff.movement_permission?.allowed_gates ?? [],
            entry_mode: staff.movement_permission?.entry_mode ?? "free",
            exit_mode: staff.movement_permission?.exit_mode ?? "free",
            requires_host_confirmation: staff.movement_permission?.requires_host_confirmation ?? false,
            notes: staff.movement_permission?.notes ?? "",
        });
    }, [staff]);

    const logColumns: Column<any>[] = [
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
            key: "gate",
            header: "Gate",
            accessor: (row) => row.gate?.name ?? "—",
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

    const handleAssignmentSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        updateMutation.mutate({
            notes: assignmentForm.notes || undefined,
            is_active: assignmentForm.is_active,
            valid_from: assignmentForm.valid_from || undefined,
            valid_to: assignmentForm.valid_to || undefined,
        });
    };

    const handlePermissionSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        permissionMutation.mutate(permissionForm);
    };

    const DAYS_OF_WEEK = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
    const DAY_LABELS: Record<string, string> = {
        monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu",
        friday: "Fri", saturday: "Sat", sunday: "Sun",
    };

    const toggleDay = (day: string) => {
        setPermissionForm((prev) => ({
            ...prev,
            allowed_days: prev.allowed_days?.includes(day)
                ? prev.allowed_days.filter((d) => d !== day)
                : [...(prev.allowed_days ?? []), day],
        }));
    };

    const handleKycSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        kycMutation.mutate(kycForm);
    };

    const latestKyc = staff?.latest_kyc ?? kycHistory?.[0] ?? null;

    if (!residencyId || !staffId) {
        return (
            <Card>
                <CardContent className="p-10">
                    <EmptyState
                        icon={Briefcase}
                        title="Staff member not found"
                        description="The requested staff record could not be resolved from the current route."
                        action={{ label: "Back to Staff", onClick: () => router.push(`/residency/${residencyId ?? ""}/staff`) }}
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
            {/* Back navigation */}
            <Button variant="ghost" size="sm" onClick={() => router.push(`/residency/${residencyId}/staff`)} className="-ml-3">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Staff
            </Button>

            {/* Hero header */}
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <UserCircle2 className="h-4 w-4" />
                        <span className="text-xs uppercase tracking-widest">Staff profile</span>
                    </div>
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
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">

                    {/* ── Assignment ───────────────────────────────────── */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Briefcase className="h-5 w-5" />
                                Assignment
                            </CardTitle>
                            <CardDescription>
                                Control whether this staff member is active and define the validity window for the assignment.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form className="space-y-6" onSubmit={handleAssignmentSubmit}>
                                {/* Status */}
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Status</p>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setAssignmentForm((prev) => ({ ...prev, is_active: true }))}
                                            className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors ${assignmentForm.is_active ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300" : "border-border text-muted-foreground hover:bg-muted"}`}
                                        >
                                            Active
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setAssignmentForm((prev) => ({ ...prev, is_active: false }))}
                                            className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors ${!assignmentForm.is_active ? "border-zinc-400 bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" : "border-border text-muted-foreground hover:bg-muted"}`}
                                        >
                                            Inactive
                                        </button>
                                    </div>
                                </div>

                                {/* Validity window */}
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Validity window</p>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-1">
                                            <label className="text-sm font-medium">From</label>
                                            <input
                                                type="datetime-local"
                                                value={assignmentForm.valid_from ?? ""}
                                                onChange={(e) => setAssignmentForm((prev) => ({ ...prev, valid_from: e.target.value }))}
                                                className="flex h-10 w-full rounded-[4px] border border-[#DEDEDE] bg-white px-3 py-2 text-sm dark:border-white/20 dark:bg-transparent"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-sm font-medium">To</label>
                                            <input
                                                type="datetime-local"
                                                value={assignmentForm.valid_to ?? ""}
                                                onChange={(e) => setAssignmentForm((prev) => ({ ...prev, valid_to: e.target.value }))}
                                                className="flex h-10 w-full rounded-[4px] border border-[#DEDEDE] bg-white px-3 py-2 text-sm dark:border-white/20 dark:bg-transparent"
                                            />
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Leave blank to allow access indefinitely.</p>
                                </div>

                                {/* Notes */}
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Notes</p>
                                    <textarea
                                        value={assignmentForm.notes ?? ""}
                                        onChange={(e) => setAssignmentForm((prev) => ({ ...prev, notes: e.target.value }))}
                                        rows={3}
                                        className="w-full rounded-[8px] border border-[#DEDEDE] bg-white px-3 py-2 text-sm dark:border-white/20 dark:bg-transparent"
                                        placeholder="Internal notes about this assignment…"
                                    />
                                </div>

                                <div className="flex justify-end border-t pt-4">
                                    <Button type="submit" isLoading={updateMutation.isPending}>Save Assignment</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* ── Movement permissions ─────────────────────────── */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Clock3 className="h-5 w-5" />
                                Movement permissions
                            </CardTitle>
                            <CardDescription>
                                Define when and how this staff member may enter or exit the residency.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form className="space-y-6" onSubmit={handlePermissionSubmit}>
                                {/* Schedule */}
                                <div className="space-y-3">
                                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Schedule</p>

                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">Allowed days</label>
                                        <div className="flex flex-wrap gap-2 pt-1">
                                            {DAYS_OF_WEEK.map((day) => {
                                                const active = permissionForm.allowed_days?.includes(day);
                                                return (
                                                    <button
                                                        key={day}
                                                        type="button"
                                                        onClick={() => toggleDay(day)}
                                                        className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${active ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:bg-muted"}`}
                                                    >
                                                        {DAY_LABELS[day]}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <p className="text-xs text-muted-foreground">Leave all unselected to allow any day.</p>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <Input
                                            label="Time start"
                                            type="time"
                                            value={(permissionForm.time_start ?? "08:00:00").slice(0, 5)}
                                            onChange={(e) => setPermissionForm((prev) => ({ ...prev, time_start: `${e.target.value}:00` }))}
                                        />
                                        <Input
                                            label="Time end"
                                            type="time"
                                            value={(permissionForm.time_end ?? "18:00:00").slice(0, 5)}
                                            onChange={(e) => setPermissionForm((prev) => ({ ...prev, time_end: `${e.target.value}:00` }))}
                                        />
                                    </div>
                                </div>

                                {/* Access control */}
                                <div className="space-y-3">
                                    <p className="text-xs font-semibold uppercase tracking-widest ">Access control</p>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-1">
                                            <label className="text-sm font-medium">Entry mode</label>
                                            <select
                                                value={permissionForm.entry_mode ?? "free"}
                                                onChange={(e) => setPermissionForm((prev) => ({ ...prev, entry_mode: e.target.value }))}
                                                className="flex h-10 w-full rounded-[4px] border border-[#DEDEDE] bg-white px-3 py-2 text-sm dark:border-white/20 dark:bg-transparent"
                                            >
                                                <option value="free">Free</option>
                                                <option value="approval_required">Approval required</option>
                                                <option value="blocked">Blocked</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-sm font-medium">Exit mode</label>
                                            <select
                                                value={permissionForm.exit_mode ?? "free"}
                                                onChange={(e) => setPermissionForm((prev) => ({ ...prev, exit_mode: e.target.value }))}
                                                className="flex h-10 w-full rounded-[4px] bg-white border border-[#DEDEDE] px-3 py-2 text-sm dark:border-white/20 dark:bg-transparent"
                                            >
                                                <option value="free">Free</option>
                                                <option value="approval_required">Approval required</option>
                                                <option value="blocked">Blocked</option>
                                            </select>
                                        </div>
                                    </div>

                                    <SearchableSelect
                                        options={gateOptions}
                                        label="Allowed gates"
                                        isMulti
                                        placeholder="Select gates…"
                                        value={permissionForm.allowed_gates ?? []}
                                        onChange={(values) => setPermissionForm((prev) => ({ ...prev, allowed_gates: values ?? [] }))}
                                    />

                                    <label className="flex items-center gap-3 rounded-md border border-border/60 px-3 py-2.5 text-sm cursor-pointer hover:bg-muted/40 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={permissionForm.requires_host_confirmation ?? false}
                                            onChange={(e) => setPermissionForm((prev) => ({ ...prev, requires_host_confirmation: e.target.checked }))}
                                            className="h-4 w-4"
                                        />
                                        <span className="font-medium">Requires host confirmation</span>
                                        <span className="ml-auto text-xs text-muted-foreground">Host must approve each entry</span>
                                    </label>
                                </div>

                                {/* Notes */}
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Notes</p>
                                    <textarea
                                        value={permissionForm.notes ?? ""}
                                        onChange={(e) => setPermissionForm((prev) => ({ ...prev, notes: e.target.value }))}
                                        rows={3}
                                        className="w-full rounded-[8px] border border-[#DEDEDE] bg-white px-3 py-2 text-sm dark:border-white/20 dark:bg-transparent"
                                        placeholder="Access guidance for the gate team…"
                                    />
                                </div>

                                <div className="flex justify-end border-t pt-4">
                                    <Button type="submit" isLoading={permissionMutation.isPending}>Save Permission</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* ── Movement logs ────────────────────────────────── */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <ShieldCheck className="h-5 w-5" />
                                Movement logs
                            </CardTitle>
                            <CardDescription>
                                Entry and exit records derived from gate events for this staff identity.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <DataTable
                                data={logs?.items ?? []}
                                columns={logColumns}
                                searchable={false}
                                showPagination={false}
                                emptyMessage="No movement records found"
                                isLoading={isFetchingLogs}
                                disableClientSideFiltering
                                disableClientSideSorting
                            />
                            <PaginationBar
                                page={logPage}
                                pageSize={logPageSize}
                                total={logs?.total ?? 0}
                                totalPages={logs?.total_pages ?? 1}
                                hasNext={logs?.has_next ?? false}
                                hasPrevious={logs?.has_previous ?? logPage > 1}
                                isFetching={isFetchingLogs}
                                resourceLabel="logs"
                                onChange={setLogPage}
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* ── KYC (sidebar) ────────────────────────────────── */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <FileBadge className="h-5 w-5" />
                                KYC
                            </CardTitle>
                            <CardDescription>
                                Submit or resubmit identity verification for this staff profile.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <form className="space-y-4" onSubmit={handleKycSubmit}>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Document type</label>
                                    <select
                                        value={kycForm.document_type}
                                        onChange={(e) => setKycForm((prev) => ({ ...prev, document_type: e.target.value }))}
                                        className="flex h-10 w-full rounded-[4px] border border-[#DEDEDE] bg-white px-3 py-2 text-sm dark:border-white/20 dark:bg-transparent"
                                    >
                                        <option value="national_id">National ID</option>
                                        <option value="drivers_license">Driver's license</option>
                                        <option value="passport">Passport</option>
                                    </select>
                                </div>
                                <Input
                                    label="Document number (masked)"
                                    value={kycForm.document_number_masked ?? ""}
                                    onChange={(e) => setKycForm((prev) => ({ ...prev, document_number_masked: e.target.value }))}
                                    placeholder="NGA-****-1234"
                                />
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Provider</label>
                                    <select
                                        value={kycForm.provider ?? "manual"}
                                        onChange={(e) => setKycForm((prev) => ({ ...prev, provider: e.target.value }))}
                                        className="flex h-10 w-full rounded-[4px] border border-[#DEDEDE] bg-white px-3 py-2 text-sm dark:border-white/20 dark:bg-transparent"
                                    >
                                        <option value="manual">Manual</option>
                                        <option value="smile_id">Smile ID</option>
                                    </select>
                                </div>
                                <Button type="submit" className="w-full" isLoading={kycMutation.isPending}>Submit KYC</Button>
                            </form>

                            <div className="space-y-3 border-t pt-4">
                                <p className="text-sm font-semibold">Submission history</p>
                                {kycHistory?.length ? (
                                    <div className="space-y-3">
                                        {kycHistory.map((record) => (
                                            <div key={record.id} className="rounded-xl border border-border/60 p-3">
                                                <div className="flex items-center justify-between gap-3">
                                                    <p className="text-sm font-medium">{titleCase(record.document_type ?? "document")}</p>
                                                    <Badge variant={record.status === "verified" ? "success" : record.status === "failed" ? "danger" : "secondary"}>
                                                        {titleCase(record.status ?? "pending")}
                                                    </Badge>
                                                </div>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    {record.document_number_masked || "No masked number"}
                                                </p>
                                                <p className="mt-2 text-xs text-muted-foreground">
                                                    Submitted {record.created_at ? formatDateTime(record.created_at) : "—"}
                                                </p>
                                                {record.notes && (
                                                    <p className="mt-2 text-xs text-muted-foreground">{record.notes}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No KYC submissions yet.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
