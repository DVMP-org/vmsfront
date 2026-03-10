"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import {
    Activity,
    Briefcase,
    Calendar,
    Clock,
    Eye,
    EyeOff,
    FileText,
    FilePlus,
    Home,
    LogIn,
    LogOut,
    MapPin,
    Pencil,
    Phone,
    Mail,
    QrCode,
    Shield,
    User,
    CheckCircle,
    AlertCircle,
    Clock3,
    X,
    XCircle,
} from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useAppStore } from "@/store/app-store";
import { useStaffKycHistory, useStaffMovementLogs, useSubmitStaffKyc } from "@/hooks/use-staff";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { cn, formatDateTime, getFullName, titleCase } from "@/lib/utils";
import type { StaffMember, StaffResidencyAssignment, StaffKYCVerification, StaffMovementLog, StaffKYCSubmit } from "@/types/staff";

// --- Status Helpers ---
function getStatusIcon(status: string | null | undefined) {
    switch (status?.toLowerCase()) {
        case "active":
        case "verified":
            return <CheckCircle className="h-4 w-4 text-emerald-500" />;
        case "pending":
        case "submitted":
            return <Clock3 className="h-4 w-4 text-amber-500" />;
        case "suspended":
        case "revoked":
        case "failed":
            return <XCircle className="h-4 w-4 text-red-500" />;
        default:
            return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
}

function getStatusColor(status: string | null | undefined) {
    switch (status?.toLowerCase()) {
        case "active":
        case "verified":
            return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
        case "pending":
        case "submitted":
            return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
        case "suspended":
        case "revoked":
        case "failed":
            return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
        default:
            return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
    }
}

// --- Tab Component ---
type TabKey = "overview" | "kyc" | "logs";

interface Tab {
    key: TabKey;
    label: string;
    icon: React.ElementType;
}

const tabs: Tab[] = [
    { key: "overview", label: "Overview", icon: User },
    { key: "kyc", label: "KYC & Verification", icon: Shield },
    { key: "logs", label: "Movement Logs", icon: Activity },
];

// --- Sensitive Field Component ---
function SensitiveField({
    label,
    value,
    className,
}: {
    label: string;
    value: string | null | undefined;
    className?: string;
}) {
    const [revealed, setRevealed] = useState(false);

    const maskedValue = value ? value.replace(/./g, "•") : "Not provided";
    const displayValue = revealed ? (value ?? "Not provided") : maskedValue;

    return (
        <div className={cn("space-y-1", className)}>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {label}
            </p>
            <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground font-mono">
                    {displayValue}
                </p>
                {value && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => setRevealed(!revealed)}
                    >
                        {revealed ? (
                            <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : (
                            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                    </Button>
                )}
            </div>
        </div>
    );
}

// --- KYC Card Component ---
function KYCCard({ kyc, isLatest }: { kyc: StaffKYCVerification; isLatest?: boolean }) {
    const [showDetails, setShowDetails] = useState(false);

    return (
        <Card className={cn(isLatest && "border-[rgb(var(--brand-primary))]/30 bg-[rgb(var(--brand-primary))]/5")}>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                            <CardTitle className="text-base flex items-center gap-2">
                                {titleCase(kyc.document_type ?? "Document")}
                                {isLatest && (
                                    <Badge variant="outline" className="text-[10px]">
                                        Latest
                                    </Badge>
                                )}
                            </CardTitle>
                            <CardDescription className="text-xs">
                                {kyc.provider ? `Via ${kyc.provider}` : "Manual verification"}
                            </CardDescription>
                        </div>
                    </div>
                    <Badge className={getStatusColor(kyc.status)}>
                        <span className="flex items-center gap-1">
                            {getStatusIcon(kyc.status)}
                            {titleCase(kyc.status ?? "Unknown")}
                        </span>
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                    <SensitiveField label="Document Number" value={kyc.document_number_masked} />
                    <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Submitted
                        </p>
                        <p className="text-sm font-semibold text-foreground mt-1">
                            {kyc.submitted_at ? formatDateTime(kyc.submitted_at) : "Not submitted"}
                        </p>
                    </div>
                </div>

                {kyc.status === "verified" && kyc.reviewed_at && (
                    <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 p-3 border border-emerald-200 dark:border-emerald-800">
                        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm font-medium">
                                Verified on {formatDateTime(kyc.reviewed_at)}
                            </span>
                        </div>
                        {kyc.reviewer && (
                            <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1">
                                By {getFullName(kyc.reviewer.user?.first_name, kyc.reviewer.user?.last_name)}
                            </p>
                        )}
                    </div>
                )}

                {kyc.status === "failed" && kyc.notes && (
                    <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-3 border border-red-200 dark:border-red-800">
                        <p className="text-xs font-medium text-red-700 dark:text-red-400 uppercase tracking-wider">
                            Rejection Reason
                        </p>
                        <p className="text-sm text-red-600 dark:text-red-300 mt-1">{kyc.notes}</p>
                    </div>
                )}

                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => setShowDetails(!showDetails)}
                >
                    {showDetails ? "Hide Details" : "Show More Details"}
                </Button>

                {showDetails && (
                    <div className="space-y-2 pt-2 border-t border-border/40">
                        <div className="grid gap-2 text-xs">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Record ID</span>
                                <span className="font-mono text-foreground">{kyc.id}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Created</span>
                                <span className="text-foreground">{kyc.created_at ? formatDateTime(kyc.created_at) : "—"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Last Updated</span>
                                <span className="text-foreground">{kyc.updated_at ? formatDateTime(kyc.updated_at) : "—"}</span>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// --- Main Component ---
export function StaffDashboard() {
    const router = useRouter();
    const params = useParams<{ residencyId?: string }>();
    const rawResidencyId = params?.residencyId;
    const routeResidencyId = Array.isArray(rawResidencyId) ? rawResidencyId[0] : rawResidencyId;

    const { user } = useAuthStore();
    const { selectedResidency } = useAppStore();

    const staff = user?.staff as StaffMember | null | undefined;
    const residencyId = routeResidencyId ?? selectedResidency?.id ?? null;

    const [activeTab, setActiveTab] = useState<TabKey>("overview");
    const [logsPage, setLogsPage] = useState(1);
    const [logsPageSize, setLogsPageSize] = useState(10);

    // Find the assignment for the current residency
    const currentAssignment = useMemo(() => {
        if (!staff || !residencyId) return null;
        const assignments = (staff as any).assignments as StaffResidencyAssignment[] | undefined;
        if (assignments) {
            return assignments.find((a) => a.residency_id === residencyId) ?? assignments[0] ?? null;
        }
        return staff.assignment ?? null;
    }, [staff, residencyId]);

    // Fetch movement logs
    const { data: logsData, isLoading: logsLoading } = useStaffMovementLogs(
        residencyId,
        staff?.id ?? null,
        { page: logsPage, pageSize: logsPageSize }
    );

    const kycVerification = useStaffKycHistory(residencyId, staff.id ?? null)

    // KYC submission form state
    const [kycForm, setKycForm] = useState<StaffKYCSubmit>({
        document_type: "national_id",
        document_number_masked: "",
        provider: "manual",
    });
    const [showKycForm, setShowKycForm] = useState(false);
    const [showBadgeModal, setShowBadgeModal] = useState(false);

    // KYC submission mutation
    const kycMutation = useSubmitStaffKyc(residencyId, staff?.id ?? null);


    const handleKycSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        kycMutation.mutate(kycForm, {
            onSuccess: () => {
                setShowKycForm(false);
                setKycForm({
                    document_type: "national_id",
                    document_number_masked: "",
                    provider: "manual",
                });
            },
        });
    };

    if (!staff) {
        return (
            <Card>
                <CardContent className="p-10">
                    <EmptyState
                        icon={Briefcase}
                        title="No staff profile found"
                        description="Your staff profile is not available. Please contact your administrator."
                        action={{
                            label: "Go to Profile Settings",
                            onClick: () => router.push("/user/settings"),
                        }}
                    />
                </CardContent>
            </Card>
        );
    }

    const residency = currentAssignment?.residency ?? staff.residency;

    const badgeUrl = (staff as any).badge_url as string | null | undefined;
    const passCode = (staff as any).pass_code as string | null | undefined;


    // Movement log columns - derive type from checkin/checkout
    const logColumns: Column<StaffMovementLog>[] = [
        {
            key: "type",
            header: "Type",
            accessor: (row) => {
                const isEntry = row.checkin_time && !row.checkout_time;
                return (
                    <Badge variant={isEntry ? "success" : "secondary"}>
                        <span className="flex items-center gap-1">
                            {isEntry ? (
                                <LogIn className="h-3 w-3" />
                            ) : (
                                <LogOut className="h-3 w-3" />
                            )}
                            {isEntry ? "Entry" : "Exit"}
                        </span>
                    </Badge>
                );
            },
        },
        {
            key: "gate",
            header: "Gate",
            accessor: (row) => row.gate?.name ?? "Unknown gate",
        },
        {
            key: "time",
            header: "Time",
            accessor: (row) => {
                const time = row.checkout_time ?? row.checkin_time;
                return time ? formatDateTime(time) : "—";
            },
        },
        {
            key: "residency",
            header: "Residency",
            accessor: (row) => row.residency?.name ?? "—",
        },
    ];

    return (
        <div className="space-y-6">
            {/* Hero Profile Card */}
            <Card className="overflow-hidden">
                <div className="relative bg-gradient-to-br from-[rgb(var(--brand-primary))]/10 via-[rgb(var(--brand-primary))]/5 to-transparent">
                    <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                            {/* Profile Info */}
                            <div className="flex-1 flex flex-col sm:flex-row sm:items-start gap-4">
                                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-background shadow-lg border border-border/40 text-[rgb(var(--brand-primary))]">
                                    {user?.avatar_url ? (
                                        <Image
                                            src={user.avatar_url}
                                            alt={getFullName(user.first_name, user.last_name)}
                                            width={80}
                                            height={80}
                                            className="rounded-2xl object-cover"
                                        />
                                    ) : (
                                        <User className="h-10 w-10" />
                                    )}
                                </div>
                                <div className="flex-1 space-y-3">
                                    <div>
                                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                            {getFullName(user?.first_name, user?.last_name)}
                                        </h1>
                                        <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1.5">
                                                <Briefcase className="h-4 w-4" />
                                                {titleCase(staff.staff_type ?? "Staff Member")}
                                            </span>
                                            {residency && (
                                                <>
                                                    <span className="text-border">•</span>
                                                    <span className="flex items-center gap-1.5">
                                                        <MapPin className="h-4 w-4" />
                                                        {residency.name}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    {/* Status Badges */}
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge className={cn(getStatusColor(staff.status), "px-3 py-1")}>
                                            <span className="flex items-center gap-1.5">
                                                {getStatusIcon(staff.status)}
                                                {titleCase(staff.status ?? "Unknown")}
                                            </span>
                                        </Badge>
                                        {staff.latest_kyc && (
                                            <Badge className={cn(getStatusColor(staff.latest_kyc.status), "px-3 py-1")} variant="outline">
                                                <span className="flex items-center gap-1.5">
                                                    <Shield className="h-3.5 w-3.5" />
                                                    KYC: {titleCase(staff.latest_kyc.status ?? "pending")}
                                                </span>
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Staff Badge - Opens Modal */}
                            {(badgeUrl || passCode) && (
                                <div className="lg:flex-shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => setShowBadgeModal(true)}
                                        className="w-full lg:w-auto group"
                                    >
                                        <div className="rounded-xl border border-border/60 bg-background/80 backdrop-blur-sm shadow-sm p-3 transition-all duration-300 hover:shadow-md hover:border-[rgb(var(--brand-primary))]/40">
                                            <div className="flex items-center gap-3">
                                                {/* Badge QR/Image */}
                                                <div className="relative h-14 w-14 rounded-lg overflow-hidden border border-border/60 bg-white">
                                                    {badgeUrl ? (
                                                        <Image
                                                            src={badgeUrl}
                                                            alt="Staff Badge"
                                                            fill
                                                            className="object-contain p-1"
                                                        />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center bg-muted">
                                                            <QrCode className="h-8 w-8 text-muted-foreground" />
                                                        </div>
                                                    )}
                                                </div>
                                                {/* Badge Info */}
                                                <div className="flex flex-col gap-0.5">
                                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                                        <QrCode className="h-3 w-3" />
                                                        Staff Badge
                                                    </p>
                                                    {passCode && (
                                                        <p className="font-mono text-sm font-bold text-[rgb(var(--brand-primary))]">
                                                            {passCode}
                                                        </p>
                                                    )}
                                                    <div className="flex items-center gap-1 text-xs text-muted-foreground group-hover:text-[rgb(var(--brand-primary))] transition-colors">
                                                        <Eye className="h-3.5 w-3.5" />
                                                        <span>Click to view</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </div>

                {/* Quick Stats Bar */}
                <div className="border-t border-border/60 bg-muted/30">
                    <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-border/60">
                        <div className="p-4 text-center">
                            <p className="text-2xl font-bold text-foreground">{logsData?.total ?? 0}</p>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Gate Events</p>
                        </div>
                        <div className="p-4 text-center">
                            {/* <p className="text-2xl font-bold text-foreground">{kycVerification?.id}</p> */}
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">KYC Status</p>
                        </div>
                        <div className="p-4 text-center">
                            <p className="text-2xl font-bold text-[rgb(var(--brand-primary))]">
                                {currentAssignment?.is_active ? "Active" : "Inactive"}
                            </p>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Assignment</p>
                        </div>
                        <div className="p-4 text-center">
                            <p className="text-2xl font-bold text-foreground">
                                {staff.created_at
                                    ? new Date(staff.created_at).toLocaleDateString("en-US", { month: "short", year: "2-digit" })
                                    : "—"}
                            </p>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Since</p>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Tabs */}
            <Card className="overflow-hidden">
                <div className="border-b border-border/60 bg-muted/20">
                    <nav className="flex gap-0">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.key;
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={cn(
                                        "flex-1 sm:flex-none flex items-center justify-center sm:justify-start gap-2 px-6 py-3.5 text-sm font-medium transition-all relative",
                                        isActive
                                            ? "text-[rgb(var(--brand-primary))] bg-background"
                                            : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    <span className="hidden sm:inline">{tab.label}</span>
                                    {isActive && (
                                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[rgb(var(--brand-primary))]" />
                                    )}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Tab Content */}
                <CardContent className="p-6">
                    <div className="min-h-[400px]">
                        {/* Overview Tab */}
                        {activeTab === "overview" && (
                            <div className="space-y-6">
                                {/* Contact Info */}
                                <div>
                                    <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-[rgb(var(--brand-primary))]" />
                                        Contact Information
                                    </h3>
                                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        <div className="flex items-center gap-3 rounded-xl border border-border/60 p-4 bg-muted/20 hover:bg-muted/40 transition-colors">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-background shadow-sm">
                                                <Mail className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</p>
                                                <p className="text-sm font-semibold text-foreground mt-0.5">
                                                    {user?.email ?? "Not provided"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 rounded-xl border border-border/60 p-4 bg-muted/20 hover:bg-muted/40 transition-colors">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-background shadow-sm">
                                                <Phone className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Phone</p>
                                                <p className="text-sm font-semibold text-foreground mt-0.5">
                                                    {user?.phone ?? "Not provided"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 rounded-xl border border-border/60 p-4 bg-muted/20 hover:bg-muted/40 transition-colors">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-background shadow-sm">
                                                <Calendar className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Joined</p>
                                                <p className="text-sm font-semibold text-foreground mt-0.5">
                                                    {staff.created_at ? formatDateTime(staff.created_at) : "Unknown"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Assignment Details */}
                                {currentAssignment && (
                                    <div>
                                        <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                                            <Home className="h-4 w-4 text-[rgb(var(--brand-primary))]" />
                                            Current Assignment
                                        </h3>
                                        <div className="rounded-xl border border-border/60 p-4 bg-muted/20">
                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <div className="space-y-3">
                                                    <div>
                                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                            Residency
                                                        </p>
                                                        <p className="text-sm font-semibold text-foreground mt-1">
                                                            {residency?.name ?? "Unknown"}
                                                        </p>
                                                        {residency?.address && (
                                                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                                <MapPin className="h-3 w-3" />
                                                                {residency.address}
                                                            </p>
                                                        )}
                                                    </div>

                                                </div>
                                                <div className="space-y-3">
                                                    <div>
                                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                            Status
                                                        </p>
                                                        <div className="mt-1">
                                                            <Badge
                                                                className={
                                                                    currentAssignment.is_active
                                                                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                                                        : "bg-gray-100 text-gray-700"
                                                                }
                                                            >
                                                                {currentAssignment.is_active ? "Active" : "Inactive"}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    {(currentAssignment.valid_from || currentAssignment.valid_to) && (
                                                        <div>
                                                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                                Valid Period
                                                            </p>
                                                            <p className="text-sm font-semibold text-foreground mt-1 flex items-center gap-1">
                                                                <Clock className="h-3.5 w-3.5" />
                                                                {currentAssignment.valid_from
                                                                    ? formatDateTime(currentAssignment.valid_from)
                                                                    : "No start"}{" "}
                                                                →{" "}
                                                                {currentAssignment.valid_to
                                                                    ? formatDateTime(currentAssignment.valid_to)
                                                                    : "No end"}
                                                            </p>
                                                        </div>
                                                    )}
                                                    {currentAssignment.sponsor_resident && (
                                                        <div>
                                                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                                Sponsor
                                                            </p>
                                                            <p className="text-sm font-semibold text-foreground mt-1">
                                                                {getFullName(
                                                                    currentAssignment.sponsor_resident.user?.first_name,
                                                                    currentAssignment.sponsor_resident.user?.last_name
                                                                )}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Movement Permission */}
                                {currentAssignment?.movement_permission && (
                                    <div>
                                        <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                                            <Shield className="h-4 w-4 text-[rgb(var(--brand-primary))]" />
                                            Movement Permissions
                                        </h3>
                                        <div className="rounded-xl border border-border/60 p-4 bg-muted/20">
                                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                                {currentAssignment.movement_permission.allowed_days && (
                                                    <div>
                                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                            Allowed Days
                                                        </p>
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {currentAssignment.movement_permission.allowed_days.map((day) => (
                                                                <Badge key={day} variant="outline" className="text-xs">
                                                                    {titleCase(day)}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                {(currentAssignment.movement_permission.time_start ||
                                                    currentAssignment.movement_permission.time_end) && (
                                                        <div>
                                                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                                Allowed Hours
                                                            </p>
                                                            <p className="text-sm font-semibold text-foreground mt-1">
                                                                {currentAssignment.movement_permission.time_start ?? "Any"} -{" "}
                                                                {currentAssignment.movement_permission.time_end ?? "Any"}
                                                            </p>
                                                        </div>
                                                    )}
                                                {currentAssignment.movement_permission.entry_mode && (
                                                    <div>
                                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                            Entry Mode
                                                        </p>
                                                        <p className="text-sm font-semibold text-foreground mt-1">
                                                            {titleCase(currentAssignment.movement_permission.entry_mode)}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                            {currentAssignment.movement_permission.notes && (
                                                <div className="mt-4 rounded-lg bg-muted/50 p-3">
                                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                        Notes
                                                    </p>
                                                    <p className="text-sm text-foreground mt-1">
                                                        {currentAssignment.movement_permission.notes}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* KYC Tab */}
                        {activeTab === "kyc" && (
                            <div className="space-y-6">
                                {/* Show form ONLY when no KYC exists OR user clicked Edit */}
                                {(!kycVerification || showKycForm) ? (
                                    <Card className="border-[rgb(var(--brand-primary))]/30 bg-[rgb(var(--brand-primary))]/5">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2 text-lg">
                                                <FilePlus className="h-5 w-5 text-[rgb(var(--brand-primary))]" />
                                                {!kycVerification ? "Submit KYC Verification" : "Update KYC Details"}
                                            </CardTitle>
                                            <CardDescription>
                                                {!kycVerification
                                                    ? "Submit your identity verification documents to activate your staff access."
                                                    : "Submit new verification documents to update your KYC status."}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <form className="space-y-4" onSubmit={handleKycSubmit}>
                                                <div className="grid gap-4 sm:grid-cols-2">
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium text-foreground">
                                                            Document Type
                                                        </label>
                                                        <select
                                                            value={kycForm.document_type}
                                                            onChange={(e) =>
                                                                setKycForm((prev) => ({ ...prev, document_type: e.target.value }))
                                                            }
                                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                        >
                                                            <option value="national_id">National ID</option>
                                                            <option value="drivers_license">Driver's License</option>
                                                            <option value="passport">Passport</option>
                                                            <option value="voter_card">Voter's Card</option>
                                                        </select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium text-foreground">
                                                            Verification Provider
                                                        </label>
                                                        <select
                                                            value={kycForm.provider ?? "manual"}
                                                            onChange={(e) =>
                                                                setKycForm((prev) => ({ ...prev, provider: e.target.value }))
                                                            }
                                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                        >
                                                            <option value="manual">Manual Verification</option>
                                                            <option value="smile_id">Smile ID</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <Input
                                                    label="Document Number"
                                                    value={kycForm.document_number_masked ?? ""}
                                                    onChange={(e) =>
                                                        setKycForm((prev) => ({ ...prev, document_number_masked: e.target.value }))
                                                    }
                                                    placeholder="Enter your document number (e.g., NGA-1234-5678)"
                                                />
                                                <p className="text-xs text-muted-foreground">
                                                    Your document number will be securely stored and partially masked for privacy.
                                                </p>
                                                <div className="flex items-center gap-3 pt-2">
                                                    <Button
                                                        type="submit"
                                                        isLoading={kycMutation.isPending}
                                                        className="flex-1 sm:flex-none"
                                                    >
                                                        Submit KYC
                                                    </Button>
                                                    {kycVerification && (
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            onClick={() => setShowKycForm(false)}
                                                        >
                                                            Cancel
                                                        </Button>
                                                    )}
                                                </div>
                                            </form>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    /* Show KYC details when data exists and not editing */
                                    <>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h2 className="text-lg font-bold text-foreground">KYC Verification</h2>
                                                <p className="text-sm text-muted-foreground">
                                                    Your identity verification document and status
                                                </p>
                                            </div>
                                            <Button variant="outline" size="sm" onClick={() => setShowKycForm(true)}>
                                                <Pencil className="mr-2 h-4 w-4" />
                                                Edit KYC
                                            </Button>
                                        </div>
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <KYCCard
                                                kyc={kycVerification}
                                                isLatest={true}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Movement Logs Tab */}
                        {activeTab === "logs" && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-lg font-bold text-foreground">Movement Logs</h2>
                                        <p className="text-sm text-muted-foreground">
                                            Your entry and exit history at gates
                                        </p>
                                    </div>
                                </div>

                                <Card>
                                    <CardContent className="p-0">
                                        <DataTable
                                            columns={logColumns}
                                            data={logsData?.items ?? []}
                                            isLoading={logsLoading}
                                            emptyMessage="Your gate entry and exit history will appear here."
                                            showPagination={false}
                                        />
                                    </CardContent>
                                </Card>

                                {logsData && logsData.total_pages > 1 && (
                                    <PaginationBar
                                        page={logsPage}
                                        totalPages={logsData.total_pages}
                                        total={logsData.total}
                                        pageSize={logsPageSize}
                                        onChange={setLogsPage}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Badge Modal */}
            <Modal
                isOpen={showBadgeModal}
                onClose={() => setShowBadgeModal(false)}
                title="Staff Badge"
                size="sm"
            >
                <div className="flex flex-col items-center p-6 space-y-6">
                    {/* Large Badge QR/Image */}
                    <div className="relative h-64 w-64 rounded-2xl overflow-hidden border-2 border-border/60 bg-white shadow-lg">
                        {badgeUrl ? (
                            <Image
                                src={badgeUrl}
                                alt="Staff Badge"
                                fill
                                className="object-contain p-4"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted/50 to-muted">
                                <QrCode className="h-32 w-32 text-muted-foreground" />
                            </div>
                        )}
                    </div>

                    {/* Pass Code */}
                    {passCode && (
                        <div className="text-center">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                                Pass Code
                            </p>
                            <p className="font-mono text-3xl font-bold text-[rgb(var(--brand-primary))] tracking-wider">
                                {passCode}
                            </p>
                        </div>
                    )}

                    {/* Staff Info */}
                    <div className="w-full rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Name</span>
                            <span className="text-sm font-semibold text-foreground">
                                {getFullName(user?.first_name, user?.last_name)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Role</span>
                            <span className="text-sm font-semibold text-foreground">
                                {titleCase(staff?.staff_type ?? "Staff")}
                            </span>
                        </div>
                        {residency && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Residency</span>
                                <span className="text-sm font-semibold text-foreground">
                                    {residency.name}
                                </span>
                            </div>
                        )}
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Status</span>
                            <Badge className={cn(getStatusColor(staff?.status), "px-2 py-0.5 text-xs")}>
                                {titleCase(staff?.status ?? "Unknown")}
                            </Badge>
                        </div>
                    </div>

                    <p className="text-xs text-center text-muted-foreground">
                        Present this badge at gates for entry/exit verification
                    </p>
                </div>
            </Modal>
        </div>
    );
}
