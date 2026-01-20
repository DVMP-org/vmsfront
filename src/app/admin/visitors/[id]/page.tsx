"use client";

import React, { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import {
    ArrowLeft, Calendar, Clock, MapPin, Search,
    Map as MapIcon, CheckCircle2, Circle, Activity,
    ChevronRight, Home as HomeIcon, User,
    Mail, Phone, Shield, QrCode, LogIn, LogOut,
    Eye
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAdminVisitor } from "@/hooks/use-admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn, titleCase } from "@/lib/utils";
import { VisitorStatus, VisitorGateStatus } from "@/types";

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

    const gateVisualization = useMemo(() => {
        // Handle both spelled and typoed versions from API
        const map = (visitor as any)?.dependency_gate_map || (visitor as any)?.dependecy_gate_map;
        if (!map) return { mainPath: [], branches: [] };

        const items = (Object.values(map) as VisitorGateStatus[]).filter(Boolean);
        const mainPath: VisitorGateStatus[] = [];
        const branches: Record<string, VisitorGateStatus[]> = {};
        const visited = new Set<string>();

        const processNode = (node: VisitorGateStatus) => {
            if (visited.has(node.gate.id)) return;

            if (node.status === 'unavailable') {
                visited.add(node.gate.id);
                // Find visible parent or anchor to first node
                const parentId = node.dependency_gate?.id;
                const attachId = (parentId && visited.has(parentId)) ? parentId : (mainPath.length > 0 ? mainPath[0].gate.id : 'root');
                if (!branches[attachId]) branches[attachId] = [];
                branches[attachId].push(node);
                return;
            }

            visited.add(node.gate.id);
            mainPath.push(node);

            // Get children and sort: cleared/pending first, then locked
            const kids = items.filter(i => i.dependency_gate?.id === node.gate.id);
            const sortedKids = [...kids].sort((a, b) => {
                const getScore = (s: string) => ['checked_out', 'checked_in', 'pending'].includes(s) ? 0 : 1;
                return getScore(a.status) - getScore(b.status);
            });

            sortedKids.forEach(k => processNode(k));
        };

        // Find root nodes (no dependency or dependency not in map)
        const roots = items.filter(i => !i.dependency_gate || !map[i.dependency_gate.id]);
        // Sort roots to start with active ones
        roots.sort((a, b) => {
            const getScore = (s: string) => ['checked_out', 'checked_in', 'pending'].includes(s) ? 0 : 1;
            return getScore(a.status) - getScore(b.status);
        });

        roots.forEach(r => processNode(r));

        // Catch any remaining orphans (disconnected parts of the graph)
        items.forEach(item => {
            if (!visited.has(item.gate.id)) {
                processNode(item);
            }
        });

        return { mainPath, branches };
    }, [visitor]);
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
                            <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400">
                                {visitor.name}
                            </h1>
                            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm">
                                <StatusBadge status={visitor.status || VisitorStatus.PENDING} />
                                <div className="flex items-center gap-2 px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                                    <span className="text-muted-foreground font-mono text-[10px] uppercase tracking-wider">{visitor.id.split('-')[0]}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Card className="px-5 py-2.5 border-white/20 dark:border-zinc-800/50 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl shadow-lg flex items-center gap-4 rounded-xl group transition-all duration-300 hover:shadow-blue-500/10 hover:border-blue-500/30">
                        <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500 group-hover:bg-blue-500 group-hover:text-white transition-all">
                            <QrCode className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-black text-zinc-400 leading-tight tracking-widest">Pass Registry</span>
                            <span className="text-sm font-mono font-black leading-tight tracking-tighter text-zinc-800 dark:text-zinc-200">
                                {visitor.gate_pass?.code || "NULL"}<span className="text-zinc-400 dark:text-zinc-600">-{visitor.pass_code_suffix}</span>
                            </span>
                        </div>
                    </Card>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Movement & Timeline */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Movement Dependency Map */}
                    {((visitor as any)?.dependency_gate_map || (visitor as any)?.dependecy_gate_map) && (
                        <Card className="relative overflow-visible border border-white/20 dark:border-zinc-800/50 shadow-xl bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl h-auto">
                            <CardHeader className="border-b border-zinc-100/50 dark:border-zinc-800/50 px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-lg flex items-center gap-2 font-bold cursor-default group">
                                            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform">
                                                <MapIcon className="h-5 w-5" />
                                            </div>
                                            Gate Clearance Route
                                        </CardTitle>
                                        <CardDescription>Visualizing the verification path and branches</CardDescription>
                                    </div>
                                    <Badge variant="outline" className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm border-zinc-200 dark:border-zinc-800">
                                        {visitor.status === 'checked_out' ? 'Journey Completed' : 'Path Active'}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8 pb-12 overflow-auto max-h-[600px] scrollbar-thin">
                                <div className="flex items-start justify-between min-w-max gap-12 relative pt-8 pb-32">
                                    {/* Main Path Connection Line */}
                                    <div className="hidden md:block absolute top-[60px] left-12 right-12 h-[2px] bg-gradient-to-r from-blue-500/20 via-zinc-200 dark:via-zinc-800 to-zinc-200 dark:to-zinc-800 -z-0" />

                                    {gateVisualization.mainPath.map((gateStatus, idx, arr) => {
                                        const status = gateStatus.status;
                                        const isCleared = status === 'checked_in' || status === 'checked_out';
                                        const isPending = status === 'pending';
                                        const isLocked = status === 'locked';
                                        const isLast = idx === arr.length - 1;
                                        const nodeBranches = gateVisualization.branches[gateStatus.gate.id] || [];

                                        return (
                                            <div key={gateStatus.gate.id} className="flex flex-col items-center gap-4 relative z-10">
                                                {/* Node Circle */}
                                                <motion.div
                                                    initial={{ scale: 0.8, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    transition={{ delay: idx * 0.1 }}
                                                    className={cn(
                                                        "h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-500 border-[3px] shadow-sm relative",
                                                        isCleared
                                                            ? "bg-green-100 border-green-500 text-green-600 shadow-lg shadow-green-500/20"
                                                            : isPending
                                                                ? "bg-blue-50 border-blue-400 text-blue-500 animate-pulse shadow-lg shadow-blue-500/20"
                                                                : isLocked
                                                                    ? "bg-zinc-600 dark:bg-zinc-800 border-zinc-500 dark:border-zinc-700 dark:text-zinc-400 text-zinc-400"
                                                                    : "bg-zinc-50 border-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:border-zinc-700"
                                                    )}
                                                >
                                                    {isCleared ? <CheckCircle2 className="h-7 w-7" /> : isLocked ? <Shield className="h-6 w-6 opacity-70" /> : <Circle className="h-6 w-6" />}

                                                    {/* Progress Connector (Mobile) */}
                                                    {!isLast && (
                                                        <div className="md:hidden absolute -bottom-8 left-1/2 -ml-px h-8 w-0.5 bg-zinc-200 dark:bg-zinc-800" />
                                                    )}
                                                </motion.div>

                                                {/* Info Container */}
                                                <div className="text-center w-32 z-10">
                                                    <p className={cn(
                                                        "text-xs font-extrabold truncate uppercase tracking-tighter",
                                                        isCleared ? "text-green-700 dark:text-green-400" : isPending ? "text-blue-600" : "text-zinc-500"
                                                    )}>
                                                        {gateStatus.gate.name}
                                                    </p>
                                                    <div className="mt-1 flex flex-col items-center gap-1">
                                                        {gateStatus.event ? (
                                                            <div className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[9px] font-bold font-mono">
                                                                {format(new Date(gateStatus.event.checkin_time), "HH:mm")}
                                                            </div>
                                                        ) : (
                                                            <Badge variant="outline" className={cn(
                                                                "text-[8px] uppercase px-1.5 py-0 border-zinc-200 dark:border-zinc-700 font-bold",
                                                                isLocked ? "bg-zinc-200 text-zinc-600" : "bg-blue-50 text-blue-500 border-blue-200"
                                                            )}>
                                                                {status}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* BRANCHING SECTION (Vertical Spine and Spurs) */}
                                                <AnimatePresence>
                                                    {nodeBranches.length > 0 && (
                                                        <div className="absolute top-[120px] left-1/2 flex flex-col gap-12 py-4">
                                                            {nodeBranches.map((branch, bIdx) => (
                                                                <motion.div
                                                                    key={branch.gate.id}
                                                                    initial={{ x: -20, opacity: 0 }}
                                                                    animate={{ x: 0, opacity: 1 }}
                                                                    className="flex items-center gap-4 relative "
                                                                >
                                                                    {/* The Curved Spur - connecting seamlessly to the one above */}
                                                                    <div
                                                                        className="absolute -left-2 border-l-2 border-b-2 border-zinc-200 dark:border-zinc-800 rounded-bl-xl shadow-[0_2px_0_0_rgba(0,0,0,0.02)]"
                                                                        style={{
                                                                            top: bIdx === 0 ? "-80px" : "-60px",
                                                                            height: bIdx === 0 ? "116px" : "96px",
                                                                            width: "28px"
                                                                        }}
                                                                    />

                                                                    <div className={cn(
                                                                        "h-12 w-12 rounded-xl flex items-center justify-center left-4 mr-2 border-2 border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm text-zinc-400 relative z-10",
                                                                        branch.status === 'unavailable' && "opacity-60 grayscale"
                                                                    )}>
                                                                        <Activity className="h-6 w-6" />
                                                                    </div>

                                                                    <div className="flex flex-col relative z-20">
                                                                        <span className="text-[10px] font-black left-4 text-zinc-500 bg-white/80 dark:bg-zinc-900/80 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 leading-none whitespace-nowrap shadow-sm backdrop-blur-sm">
                                                                            {branch.gate.name}
                                                                        </span>
                                                                        <span className="text-[8px] text-zinc-400 mt-1 uppercase font-black tracking-widest px-1.5">
                                                                            {branch.status}
                                                                        </span>
                                                                    </div>
                                                                </motion.div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Chronological Timeline */}
                    <Card className="border border-white/20 dark:border-zinc-800/50 shadow-xl bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl overflow-hidden rounded-2xl">
                        <CardHeader className="px-6 py-5 flex flex-row items-center justify-between border-b border-zinc-100/50 dark:border-zinc-800/50 bg-white/50 dark:bg-zinc-900/50">
                            <div>
                                <CardTitle className="text-lg flex items-center gap-2 font-bold">
                                    <div className="p-1.5 rounded-lg bg-zinc-500/10 text-zinc-500">
                                        <Activity className="h-5 w-5" />
                                    </div>
                                    Activity Timeline
                                </CardTitle>
                            </div>
                            <Badge variant="outline" className="font-mono text-[10px] bg-zinc-50/50 dark:bg-zinc-800/50 px-2 py-0.5 rounded-full border-zinc-200 dark:border-zinc-700">
                                {sortedEvents.length} Events
                            </Badge>
                        </CardHeader>
                        <CardContent className="p-0">
                            {sortedEvents.length === 0 ? (
                                <div className="p-16 text-center text-muted-foreground">
                                    <div className="h-20 w-20 bg-zinc-50 dark:bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-6 border border-dashed border-zinc-200 dark:border-zinc-700">
                                        <Clock className="h-8 w-8 opacity-20" />
                                    </div>
                                    <p className="font-medium">No movement records found.</p>
                                    <p className="text-xs opacity-60 mt-1">Activities will appear here once visitor starts moving.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-zinc-100/50 dark:divide-zinc-800/50">
                                    {sortedEvents.map((event, idx) => (
                                        <motion.div
                                            key={event.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="group p-6 flex items-start gap-5 hover:bg-white/60 dark:hover:bg-zinc-800/40 transition-all duration-300"
                                        >
                                            <div className="flex flex-col items-center">
                                                <div className={cn(
                                                    "h-4 w-4 rounded-full flex-shrink-0 relative z-10 border-2 border-white dark:border-zinc-900 shadow-sm",
                                                    idx === sortedEvents.length - 1 ? "bg-blue-500 ring-4 ring-blue-500/10" : "bg-zinc-300"
                                                )} />
                                                {idx < sortedEvents.length - 1 && (
                                                    <div className="h-full w-[2px] bg-gradient-to-b from-zinc-200 via-zinc-200 to-transparent dark:from-zinc-800 dark:via-zinc-800 my-1" />
                                                )}
                                            </div>

                                            <div className="flex-1 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <p className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">
                                                        {event.gate?.name || "Terminal Processing"}
                                                    </p>
                                                    <time className="text-[10px] text-zinc-500 bg-zinc-50 dark:bg-zinc-800 px-2 py-0.5 rounded-md font-bold font-mono border border-zinc-200 dark:border-zinc-700">
                                                        {format(new Date(event.created_at), "MMM d, HH:mm")}
                                                    </time>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-3">
                                                    {event.checkin_time && (
                                                        <div className="flex items-center gap-2 text-[10px] text-zinc-700 dark:text-zinc-300 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm border border-zinc-100 dark:border-zinc-800 px-3 py-1.5 rounded-lg shadow-sm">
                                                            <div className="h-5 w-5 rounded bg-green-500/10 flex items-center justify-center">
                                                                <LogIn className="h-3 w-3 text-green-600" />
                                                            </div>
                                                            <span className="font-bold opacity-60">IN:</span>
                                                            <span className="font-mono font-bold">{format(new Date(event.checkin_time), "HH:mm:ss")}</span>
                                                        </div>
                                                    )}
                                                    {event.checkout_time && (
                                                        <div className="flex items-center gap-2 text-[10px] text-zinc-700 dark:text-zinc-300 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm border border-zinc-100 dark:border-zinc-800 px-3 py-1.5 rounded-lg shadow-sm">
                                                            <div className="h-5 w-5 rounded bg-orange-500/10 flex items-center justify-center">
                                                                <LogOut className="h-3 w-3 text-orange-600" />
                                                            </div>
                                                            <span className="font-bold opacity-60">OUT:</span>
                                                            <span className="font-mono font-bold">{format(new Date(event.checkout_time), "HH:mm:ss")}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {event.scanned_by && (
                                                    <div className="flex items-center gap-2 pt-1">
                                                        <div className="h-5 w-5 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden">
                                                            <User className="h-3 w-3 text-zinc-400" />
                                                        </div>
                                                        <p className="text-[9px] text-muted-foreground font-medium italic">
                                                            Verified by <span className="font-bold text-zinc-600 dark:text-zinc-400 not-italic">{event.scanned_by.name}</span>
                                                        </p>
                                                    </div>
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
                    <Card className="shadow-lg border-white/20 dark:border-zinc-800/50 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl overflow-hidden">
                        <CardHeader className="bg-zinc-50/50 dark:bg-zinc-800/30 border-b border-zinc-100/50 dark:border-zinc-800/50 px-6 py-4">
                            <CardTitle className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Contact Hub</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-5 p-6">
                            <div className="flex items-center gap-4 group">
                                <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                                    <Mail className="h-5 w-5" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-tight">Email Address</span>
                                    <span className="text-sm font-extrabold text-zinc-800 dark:text-zinc-200">{visitor.email || "No email provided"}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 group">
                                <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300">
                                    <Phone className="h-5 w-5" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-tight">Phone Line</span>
                                    <span className="text-sm font-extrabold text-zinc-800 dark:text-zinc-200">{visitor.phone || "No phone provided"}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Gate Pass Info */}
                    <Card className="shadow-lg border-white/20 dark:border-zinc-800/50 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl overflow-hidden">
                        <CardHeader className="bg-zinc-50/50 dark:bg-zinc-800/30 border-b border-zinc-100/50 dark:border-zinc-800/50 px-6 py-4">
                            <div className="flex flex-col ">
                                <div className="flex items-center justify-between gap-2">
                                    <CardTitle className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">Pass Integrity


                                    </CardTitle>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className=""
                                        onClick={() => router.push(`/admin/gate/pass/${visitor?.gate_pass?.id}`)}>
                                        <Eye className="h-4 w-4" />

                                    </Button>
                                </div>
                                <Badge className="bg-green-500/10 text-green-600 border-none text-[8px] uppercase px-2 py-0 font-extrabold my-2 w-12">{visitor.gate_pass?.status || "active"}</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 p-6">
                            <div className="grid grid-cols-1 gap-4">
                                <div className="p-4 bg-zinc-50/50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100/50 dark:border-zinc-800/50 space-y-4 shadow-inner">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="h-6 w-6 rounded bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                                <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                                            </div>
                                            <span className="text-[10px] font-bold uppercase text-zinc-400">Issued</span>
                                        </div>
                                        <span className="text-xs font-extrabold text-zinc-700 dark:text-zinc-300">
                                            {visitor.gate_pass?.valid_from ? format(new Date(visitor.gate_pass.valid_from), "MMM d, yyyy") : "N/A"}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="h-6 w-6 rounded bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                                <Clock className="h-3.5 w-3.5 text-zinc-500" />
                                            </div>
                                            <span className="text-[10px] font-bold uppercase text-zinc-400">Expires</span>
                                        </div>
                                        <span className="text-xs font-extrabold text-zinc-700 dark:text-zinc-300">
                                            {visitor.gate_pass?.valid_to ? format(new Date(visitor.gate_pass.valid_to), "MMM d, yyyy") : "N/A"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-[10px]">
                                    <span className="uppercase font-extrabold text-zinc-400 tracking-wider">Usage Quota</span>
                                    <span className="font-extrabold text-zinc-800 dark:text-white bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded shadow-sm">
                                        {visitor.gate_pass?.uses_count || 0} / {visitor.gate_pass?.max_uses || "∞"}
                                    </span>
                                </div>
                                <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden p-[1px]">
                                    {visitor.gate_pass?.max_uses ? (
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(100, (visitor.gate_pass.uses_count / visitor.gate_pass.max_uses) * 100)}%` }}
                                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.3)]"
                                        />
                                    ) : (
                                        <div className="h-full bg-green-500 w-full opacity-30 animate-pulse" />
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Destination House */}
                    {visitor.gate_pass?.house && (
                        <Card className="shadow-2xl border-none overflow-hidden bg-zinc-950 text-white rounded-2xl group">
                            <CardContent className="p-8 relative">
                                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <HomeIcon className="h-32 w-32 rotate-12" />
                                </div>
                                <div className="relative z-10 space-y-6">
                                    <Badge className="bg-white/10 text-white border-white/20 backdrop-blur-md text-[9px] uppercase font-extrabold tracking-widest">Target Destination</Badge>
                                    <div className="space-y-2">
                                        <h3 className="font-black text-2xl tracking-tight leading-none">{visitor.gate_pass.house.name}</h3>
                                        <p className="text-xs text-zinc-400 flex items-center gap-2 font-medium">
                                            <div className="p-1 rounded bg-white/5">
                                                <MapPin className="h-3.5 w-3.5 text-zinc-500" />
                                            </div>
                                            {visitor.gate_pass.house.address}
                                        </p>
                                    </div>
                                    <div className="h-[1px] w-full bg-white/10" />

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
        className: cn("bg-zinc-100 text-zinc-600 border border-zinc-200", className),
    };

    return (
        <Badge variant="secondary" className={cn(
            data.className,
            "font-black text-[9px] uppercase px-3 py-1 rounded-full tracking-widest shadow-sm border-2"
        )}>
            {data.label}
        </Badge>
    );
}
