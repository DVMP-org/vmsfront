import { useMemo, ReactElement } from "react";
import { useRouter } from "next/router";
import { format } from "date-fns";
import { ArrowLeft, Clock, MapPin, Fingerprint, Scan, ShieldCheck, User2, Mail, Phone, Copy, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAdminGateEvent } from "@/hooks/use-admin";
import { cn, getPassStatusColor, titleCase } from "@/lib/utils";
import { toast } from "sonner";
import { GatePassStatus, Resident, Visitor } from "@/types";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminPermissionGuard } from "@/components/auth/AdminPermissionGuard";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { EmptyState } from "@/components/ui/EmptyState";

export default function AdminGateEventDetailPage() {
    const router = useRouter();
    const eventId = router.query.eventId as string;

    const { data, isLoading } = useAdminGateEvent(eventId);
    const { copyToClipboard, isCopied } = useCopyToClipboard();

    const timeline = useMemo(() => {
        if (!data) return [];
        const entries: any[] = [];
        if (data.checkin_time) {
            entries.push({
                label: "Check-in",
                timestamp: data.checkin_time,
                status: "in"
            });
        }
        if (data.checkout_time) {
            entries.push({
                label: "Check-out",
                timestamp: data.checkout_time,
                status: "out"
            });
        }
        return entries;
    }, [data]);

    if (isLoading) {
        return (
            <div className="space-y-4 max-w-7xl">
                <div className="flex items-center gap-2 mb-4">
                    <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-40 w-full rounded-lg" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Skeleton className="h-64 w-full rounded-lg" />
                    <Skeleton className="h-64 w-full rounded-lg" />
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <EmptyState
                icon={Scan}
                title="Event not found"
                description="The requested gate event could not be found or has been removed."
                action={{
                    label: "Back to Events",
                    onClick: () => router.push("/admin/gate/events"),
                }}
            />
        );
    }

    return (
        <div className="space-y-6 max-w-7xl animate-in fade-in duration-500">
            {/* Action Bar */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => router.push("/admin/gate/events")}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                >
                    <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                    Back to Gate Events
                </button>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-[10px] uppercase">
                        ID: {data.id.split('-')[0]}...
                    </Badge>
                </div>
            </div>

            {/* Main Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <Scan className="h-5 w-5 text-muted-foreground" />
                        Gate Event: {titleCase(data.owner_type)}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Activity log for pass code <span className="font-mono font-medium text-foreground">{data.gate_pass?.code || "N/A"}</span>
                    </p>
                </div>
                <div className="flex gap-2">
                    {data?.checkout_time ? (
                        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200">Completed</Badge>
                    ) : (
                        <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-200">Active Session</Badge>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Event Details */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="rounded-lg shadow-none border-border/60">
                        <CardHeader className="py-4 border-b">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Fingerprint className="h-4 w-4 text-muted-foreground" />
                                Event Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x border-b last:border-b-0">
                                <div className="p-4 space-y-4">
                                    <DetailItem label="Event ID" value={data.id} isMono />
                                    <DetailItem label="Scanner Agent" value={data.scanned_by?.user?.name || "System Automated"} />
                                    <DetailItem label="Scan Type" value={titleCase(data.owner_type)} />
                                </div>
                                <div className="p-4 space-y-4">
                                    <DetailItem
                                        label="Created Timestamp"
                                        value={format(new Date(data.created_at), "yyyy-MM-dd HH:mm:ss")}
                                    />
                                    <DetailItem label="Pass Status" value={data.gate_pass?.status || "N/A"} />
                                    <DetailItem label="House Unit" value={data.house?.name || "Unassigned"} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-lg shadow-none border-border/60 overflow-hidden">
                        <CardHeader className="py-4 border-b bg-muted/30">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <User2 className="h-4 w-4 text-muted-foreground" />
                                Owner Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="md:w-1/3 text-center md:text-left">
                                    <div className="w-12 h-12 rounded-lg bg-zinc-100 flex items-center justify-center mb-2 mx-auto md:mx-0">
                                        <User2 className="h-6 w-6 text-zinc-600" />
                                    </div>
                                    <h3 className="font-bold text-foreground text-lg">{data.owner?.name || "N/A"}</h3>
                                    <p className="text-xs text-muted-foreground uppercase tracking-tight">{titleCase(data.owner_type)} Details</p>
                                </div>
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 py-2 border-t md:border-t-0 md:border-l border-border md:pl-8">
                                    <div className="space-y-1">
                                        <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/80 flex items-center gap-1">
                                            <Mail className="h-3 w-3" /> Email Address
                                        </p>
                                        <p className="text-sm font-medium text-foreground">{data.owner?.email || "N/A"}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/80 flex items-center gap-1">
                                            <Phone className="h-3 w-3" /> Phone Number
                                        </p>
                                        <p className="text-sm font-medium text-foreground">
                                            {(data.owner as any)?.phone || (data.owner as any)?.user?.phone || "N/A"}
                                        </p>
                                    </div>
                                    {data.owner_type.toLowerCase() === "visitor" ? (
                                        <div className="space-y-1">
                                            <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/80 flex items-center gap-1">
                                                <User2 className="h-3 w-3" /> Visitor Pass Code
                                            </p>
                                            <span className="flex items-center cursor-pointer group" onClick={() =>
                                                copyToClipboard(`${data?.gate_pass?.code}-${(data?.owner as Visitor).pass_code_suffix}`, "visitor_pass", "Visitor pass code copied")
                                            }>
                                                <p className="text-sm font-medium text-foreground">
                                                    {data?.gate_pass?.code}-{(data?.owner as Visitor).pass_code_suffix}
                                                </p>

                                                {isCopied("visitor_pass") ? (
                                                    <Check className="h-3.5 w-3.5 ml-2 text-emerald-500 animate-in zoom-in duration-300" />
                                                ) : (
                                                    <Copy
                                                        className="h-3.5 w-3.5 ml-2 text-muted-foreground group-hover:text-foreground transition-colors"
                                                    />
                                                )}
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/80 flex items-center gap-1">
                                                <User2 className="h-3 w-3" /> Resident Pass Code
                                            </p>
                                            <span className="flex items-center cursor-pointer group" onClick={() =>
                                                copyToClipboard(`${data?.gate_pass?.code}-${(data?.owner as Resident).pass_code}`, "resident_pass", "Resident pass code copied")
                                            }>
                                                <p className="text-sm font-medium text-foreground">
                                                    {data?.gate_pass?.code}-{(data?.owner as Resident).pass_code}
                                                </p>
                                                {isCopied("resident_pass") ? (
                                                    <Check className="h-3.5 w-3.5 ml-2 text-emerald-500 animate-in zoom-in duration-300" />
                                                ) : (
                                                    <Copy
                                                        className="h-3.5 w-3.5 ml-2 text-muted-foreground group-hover:text-foreground transition-colors"
                                                    />
                                                )}
                                            </span>
                                        </div>
                                    )}

                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Linked House Details Card */}
                    <Card className="rounded-lg shadow-none border-border/60 overflow-hidden">
                        <CardHeader className="py-4 border-b bg-muted/30">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                Linked House Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                            {data.house ? (
                                <div className="flex flex-col md:flex-row gap-6">
                                    <div className="md:w-1/3 text-center md:text-left">
                                        <div className="w-12 h-12 rounded-lg bg-[rgb(var(--brand-primary)/0.1)] flex items-center justify-center mb-2 mx-auto md:mx-0">
                                            <Building2 className="h-6 w-6 text-[rgb(var(--brand-primary))]" />
                                        </div>
                                        <h3 className="font-bold text-foreground text-lg">{data.house.name}</h3>
                                        <p className="text-xs text-muted-foreground uppercase tracking-tight">Registered Unit</p>
                                    </div>
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 py-2 border-t md:border-t-0 md:border-l border-border md:pl-8">
                                        <DetailItem label="Street Address" value={data.house.address} />
                                        <DetailItem label="House Description" value={data.house.description || "No description provided."} />
                                        <DetailItem label="House Status" value={data.house.is_active ? "Active" : "Inactive"} />
                                        <DetailItem label="Unit ID" value={data.house.id} isMono />
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-24 text-muted-foreground italic text-sm">
                                    No registered house linked to this gate event.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* Activity Timeline Card */}
                    <Card className="rounded-lg shadow-none border-border/60">
                        <CardHeader className="py-4 border-b">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                Activity Timeline
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                            {timeline.length > 0 ? (
                                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2.5 before:h-full before:w-0.5 before:bg-muted">
                                    {timeline.map((item, idx) => (
                                        <div key={idx} className="relative pl-8 flex flex-col gap-1">
                                            <div className={cn(
                                                "absolute left-0 mt-1.5 h-6 w-6 rounded-full border-4 border-background flex items-center justify-center",
                                                item.status === 'in' ? "bg-emerald-500" : "bg-orange-500"
                                            )}>
                                                {item.status === 'in' ? <ArrowLeft className="h-3 w-3 text-white rotate-180" /> : <ArrowLeft className="h-3 w-3 text-white rotate-0" />}
                                            </div>
                                            <p className="text-sm font-bold text-foreground leading-none">{item.label}</p>
                                            <p className="text-xs text-muted-foreground tabular-nums">
                                                {format(new Date(item.timestamp), "MMM d, yyyy · HH:mm:ss")}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-sm text-muted-foreground italic py-4">
                                    No scan timestamps recorded yet.
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Security Audit Notice Card */}
                    <Card className="rounded-lg shadow-none border-[rgb(var(--brand-primary))] bg-[rgb(var(--brand-primary)/0.2)]">
                        <CardContent className="p-4 space-y-3">
                            <div className="flex items-center gap-2 text-[rgb(var(--brand-primary))] text-sm font-semibold">
                                <ShieldCheck className="h-4 w-4" />
                                Security Audit Notice
                            </div>
                            <p className="text-xs leading-relaxed text-muted-foreground">
                                This record is immutable and serves as a digital signature for property entry/exit. Any discrepancies should be reported to the IT administrator.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div >
        </div >
    );
}

function DetailItem({ label, value, isMono = false, className }: { label: string; value: string; isMono?: boolean, className?: string }) {
    const statuses: string[] = Object.values(GatePassStatus) as string[]
    return (
        <div className="space-y-1">
            <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/80">{label}</p>
            <p className={cn(
                "text-sm font-medium text-foreground break-all",
                isMono && "font-mono text-xs text-muted-foreground",

            )}>
                {statuses.includes(value.toLocaleLowerCase()) ? (<div className={cn(
                    "px-3 py-1 border-md rounded-xs w-fit",
                    getPassStatusColor(value)
                )}>{titleCase(value)}</div>) : titleCase(value)
                }
            </p >
        </div >
    );
}

function Building2(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
            <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
            <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
            <path d="M10 6h4" />
            <path d="M10 10h4" />
            <path d="M10 14h4" />
            <path d="M10 18h4" />
        </svg>
    );
}

AdminGateEventDetailPage.getLayout = function getLayout(page: ReactElement) {
    return (
        <RouteGuard>
            <DashboardLayout type="admin">
                <AdminPermissionGuard>{page}</AdminPermissionGuard>
            </DashboardLayout>
        </RouteGuard>
    );
};
