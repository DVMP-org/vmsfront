"use client";

import React, { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import {
    ArrowLeft, Calendar, Clock, MapPin, Search,
    Map as MapIcon, CheckCircle2, Circle, Activity,
    ChevronRight, Home as HomeIcon, User,
    Mail, Phone, Shield, QrCode, LogIn, LogOut
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAdminVisitor } from "@/hooks/use-admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn, titleCase } from "@/lib/utils";
import { VisitorStatus } from "@/types";

export default function VisitorDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { data: visitor, isLoading, error } = useAdminVisitor(id as string);

    const events = useMemo(() => visitor?.gate_events || [], [visitor]);
    const sortedEvents = useMemo(() => {
        return [...events].sort((a, b) =>
            new Date(a?.created_at || "").getTime() - new Date(b?.created_at || "").getTime()
        );
    }, [events]);

    const gateSequence = useMemo(() => {
        if (!visitor?.dependecy_gate_map) return [];
        const map = visitor.dependecy_gate_map;
        const items = Object.values(map);

        const sorted: typeof items = [];
        let current = items.find(i => !i.dependency_gate || !map[i.dependency_gate.id]);

        const visited = new Set();
        while (current && !visited.has(current.gate.id)) {
            sorted.push(current);
            visited.add(current.gate.id);
            // Find the one that depends on the current gate
            const next = items.find(i => i.dependency_gate?.id === current?.gate.id);
            current = next;
        }

        // Add any orphans if the chain is broken
        if (sorted.length < items.length) {
            items.forEach(item => {
                if (!visited.has(item.gate.id)) {
                    sorted.push(item);
                    visited.add(item.gate.id);
                }
            });
        }

        return sorted;
    }, [visitor?.dependency_gate_map]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <div className="h-12 w-12 rounded-full border-4 border-zinc-200 border-t-zinc-800 animate-spin" />
                <p className="text-muted-foreground animate-pulse font-medium">Loading visitor details...</p>
            </div>
        );
    }

    if (error || !visitor) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <div className="p-4 rounded-full bg-red-50 text-red-600">
                    <Shield className="h-10 w-10" />
                </div>
                <h2 className="text-xl font-bold">Visitor Not Found</h2>
                <p className="text-muted-foreground">The visitor details could not be retrieved.</p>
                <Button onClick={() => router.back()} variant="outline">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Go Back
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.back()}
                        className="-ml-2 text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Visitors
                    </Button>
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border-2 border-white dark:border-zinc-700 shadow-sm">
                            <User className="h-8 w-8 text-zinc-600 dark:text-zinc-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">{visitor.name}</h1>
                            <div className="flex flex-wrap items-center gap-3 mt-1 text-sm">
                                <StatusBadge status={visitor.status || VisitorStatus.PENDING} />
                                <span className="text-muted-foreground font-mono text-xs uppercase tracking-widest">{visitor.id.split('-')[0]}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Card className="px-4 py-2 border-zinc-200 bg-white shadow-sm flex items-center gap-3">
                        <QrCode className="h-5 w-5 text-zinc-400" />
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold text-zinc-400 leading-tight">Pass Code</span>
                            <span className="text-sm font-mono font-bold leading-tight">{visitor.gate_pass?.code || "N/A"}-{visitor.pass_code_suffix}</span>
                        </div>
                    </Card>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Movement & Timeline */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Movement Dependency Map */}
                    {visitor.dependecy_gate_map && (
                        <Card className="overflow-hidden border-none shadow-md bg-zinc-50 dark:bg-zinc-900/50">
                            <CardHeader className="border-b bg-white dark:bg-zinc-900 px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <MapIcon className="h-5 w-5 text-blue-500" />
                                            Gate Clearance Route
                                        </CardTitle>
                                        <CardDescription>Track mandatory gate clearing sequence</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8">
                                <div className="flex flex-col md:flex-row items-center justify-between gap-4 relative">
                                    {/* Connection Line (desktop) */}
                                    <div className="hidden md:block absolute top-[22px] left-12 right-12 h-0.5 bg-zinc-200 dark:bg-zinc-800 -z-0" />

                                    {gateSequence.map((gateStatus, idx, arr) => {
                                        const status = gateStatus.status;
                                        const isCleared = status === 'checked_in' || status === 'checked_out';
                                        const isPending = status === 'pending';
                                        const isLocked = status === 'locked';
                                        const isUnavailable = status === 'unavailable';
                                        const isLast = idx === arr.length - 1;

                                        return (
                                            <div key={gateStatus.gate.id} className="flex flex-col items-center gap-3 relative z-10 w-full md:w-auto">
                                                <div className={cn(
                                                    "h-12 w-12 rounded-full flex items-center justify-center transition-all duration-500 border-4",
                                                    isCleared
                                                        ? "bg-green-100 border-green-500 text-green-600 scale-110 shadow-lg shadow-green-200 dark:shadow-green-900/20"
                                                        : isPending
                                                            ? "bg-blue-50 border-blue-400 text-blue-500 animate-pulse"
                                                            : isLocked
                                                                ? "bg-zinc-100 border-zinc-300 text-zinc-400"
                                                                : isUnavailable
                                                                    ? "bg-zinc-100 border-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:border-zinc-700"
                                                                    : "bg-zinc-100 border-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:border-zinc-700"
                                                )}>
                                                    {isCleared ? <CheckCircle2 className="h-6 w-6" /> : isLocked ? <Shield className="h-5 w-5 opacity-50" /> : <Circle className="h-5 w-5" />}
                                                </div>
                                                <div className="text-center max-w-[120px]">
                                                    <p className={cn(
                                                        "text-sm font-bold truncate",
                                                        isCleared ? "text-green-700 dark:text-green-400" : isPending ? "text-blue-600" : "text-zinc-500"
                                                    )}>
                                                        {gateStatus.gate.name}
                                                    </p>
                                                    <div className="mt-1">
                                                        {gateStatus.event ? (
                                                            <p className="text-[10px] text-zinc-400 font-medium">
                                                                {format(new Date(gateStatus.event.checkin_time), "HH:mm")}
                                                            </p>
                                                        ) : (
                                                            <Badge variant="outline" className={cn(
                                                                "text-[8px] uppercase px-1 py-0 border-none",
                                                                isLocked ? "text-zinc-400" : "text-blue-400"
                                                            )}>
                                                                {status}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    {gateStatus.message && (
                                                        <p className="text-[9px] text-muted-foreground mt-1 leading-tight line-clamp-2">
                                                            {gateStatus.message}
                                                        </p>
                                                    )}
                                                </div>

                                                {!isLast && (
                                                    <div className="md:hidden h-8 w-0.5 bg-zinc-200 dark:bg-zinc-800 my-1" />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Chronological Timeline */}
                    <Card className="border-none shadow-md overflow-hidden">
                        <CardHeader className="px-6 py-4 flex flex-row items-center justify-between bg-white dark:bg-zinc-900 border-b">
                            <div>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-zinc-400" />
                                    Activity Timeline
                                </CardTitle>
                            </div>
                            <Badge variant="outline" className="font-mono">{sortedEvents.length} Events</Badge>
                        </CardHeader>
                        <CardContent className="p-0">
                            {sortedEvents.length === 0 ? (
                                <div className="p-12 text-center text-muted-foreground">
                                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-10" />
                                    <p>No movement records found for this visitor.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                    {sortedEvents.map((event, idx) => (
                                        <motion.div
                                            key={event.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="group p-5 flex items-start gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors"
                                        >
                                            <div className={cn(
                                                "mt-1.5 h-3 w-3 rounded-full flex-shrink-0 relative",
                                                idx === 0 ? "bg-zinc-300" : "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                                            )}>
                                                {idx < sortedEvents.length - 1 && (
                                                    <div className="absolute top-3 left-1.5 h-16 w-[1px] bg-zinc-100 dark:bg-zinc-800 -z-10 group-last:hidden" />
                                                )}
                                            </div>

                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <p className="font-bold text-zinc-900 dark:text-zinc-100">
                                                        {event.gate?.name || "Terminal Processing"}
                                                    </p>
                                                    <time className="text-xs text-muted-foreground bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full font-medium">
                                                        {format(new Date(event.created_at), "MMM d, HH:mm")}
                                                    </time>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-3 mt-2">
                                                    {event.checkin_time && (
                                                        <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-900 border px-2 py-1 rounded-md">
                                                            <LogIn className="h-3 w-3 text-green-500" />
                                                            <span className="font-semibold">Checked In:</span>
                                                            {format(new Date(event.checkin_time), "HH:mm:ss")}
                                                        </div>
                                                    )}
                                                    {event.checkout_time && (
                                                        <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-900 border px-2 py-1 rounded-md">
                                                            <LogOut className="h-3 w-3 text-orange-500" />
                                                            <span className="font-semibold">Checked Out:</span>
                                                            {format(new Date(event.checkout_time), "HH:mm:ss")}
                                                        </div>
                                                    )}
                                                </div>

                                                {event.scanned_by && (
                                                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 pt-1 italic">
                                                        <Shield className="h-2.5 w-2.5" />
                                                        Managed by {event.scanned_by.name}
                                                    </p>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Details & Info */}
                <div className="space-y-6">
                    {/* Contact Details */}
                    <Card className="shadow-sm border-zinc-200">
                        <CardHeader>
                            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Contact Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center">
                                    <Mail className="h-4 w-4 text-zinc-400" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs text-muted-foreground">Email Address</span>
                                    <span className="text-sm font-medium">{visitor.email || "No email available"}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center">
                                    <Phone className="h-4 w-4 text-zinc-400" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs text-muted-foreground">Phone Number</span>
                                    <span className="text-sm font-medium">{visitor.phone || "No phone available"}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Gate Pass Info */}
                    <Card className="shadow-sm border-zinc-200">
                        <CardHeader>
                            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Gate Pass Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-muted-foreground">Status</span>
                                    <Badge variant="outline" className="text-[10px] px-2 py-0">{visitor.gate_pass?.status || "active"}</Badge>
                                </div>
                                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-100 dark:border-zinc-800 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                                            <span className="text-xs">Valid From</span>
                                        </div>
                                        <span className="text-xs font-semibold">
                                            {visitor.gate_pass?.valid_from ? format(new Date(visitor.gate_pass.valid_from), "MMM d, yyyy") : "N/A"}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-3.5 w-3.5 text-zinc-400" />
                                            <span className="text-xs">Valid Until</span>
                                        </div>
                                        <span className="text-xs font-semibold">
                                            {visitor.gate_pass?.valid_to ? format(new Date(visitor.gate_pass.valid_to), "MMM d, yyyy") : "N/A"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2">
                                <div className="flex items-center justify-between mb-2 text-xs">
                                    <span className="text-muted-foreground">Usage Quota</span>
                                    <span className="font-bold">{visitor.gate_pass?.uses_count || 0} / {visitor.gate_pass?.max_uses || "∞"}</span>
                                </div>
                                <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                    {visitor.gate_pass?.max_uses ? (
                                        <div
                                            className="h-full bg-blue-500 rounded-full"
                                            style={{ width: `${Math.min(100, (visitor.gate_pass.uses_count / visitor.gate_pass.max_uses) * 100)}%` }}
                                        />
                                    ) : (
                                        <div className="h-full bg-green-500 w-full opacity-30" />
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Destination House */}
                    {visitor.gate_pass?.house && (
                        <Card className="shadow-sm border-zinc-200 overflow-hidden bg-zinc-900 text-white">
                            <CardContent className="p-6 relative">
                                <HomeIcon className="absolute -bottom-4 -right-4 h-24 w-24 text-white/5 rotate-12" />
                                <div className="relative z-10 space-y-4">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Destination</span>
                                    <div className="space-y-1">
                                        <h3 className="font-bold text-xl">{visitor.gate_pass.house.name}</h3>
                                        <p className="text-xs text-zinc-400 flex items-center gap-1.5">
                                            <MapPin className="h-3 w-3 text-zinc-500" />
                                            {visitor.gate_pass.house.address}
                                        </p>
                                    </div>
                                    <Button variant="secondary" size="sm" className="w-full h-8 text-xs font-bold" disabled>
                                        View House Details
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ status, className }: { status: string, className?: string }) {
    const statusMap: Record<string, { label: string; className: string }> = {
        [VisitorStatus.CHECKED_IN]: {
            label: "Checked in",
            className: cn("bg-orange-50 text-orange-600 border border-orange-200", className),
        },
        [VisitorStatus.CHECKED_OUT]: {
            label: "Checked out",
            className: cn("bg-indigo-50 text-indigo-600 border border-indigo-200", className),
        },
        [VisitorStatus.PENDING]: {
            label: "Pending",
            className: cn("bg-amber-50 text-amber-600 border border-amber-200", className),
        },
        [VisitorStatus.REVOKED]: {
            label: "Revoked",
            className: cn("bg-red-50 text-red-600 border border-red-200", className),
        },
        [VisitorStatus.IN_PROGRESS]: {
            label: "In Progress",
            className: cn("bg-green-50 text-green-600 border border-green-200", className),
        },
    };

    const data = statusMap[status] ?? {
        label: titleCase(status),
        className: cn("bg-muted text-muted-foreground border border-border", className),
    };

    return (
        <Badge variant="secondary" className={cn(data.className, "font-bold text-[10px] uppercase px-2 py-0 rounded-md")}>
            {data.label}
        </Badge>
    );
}
