import { CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { Visitor, VisitorGateStatus } from "@/types";
import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, CheckCircle2, Circle, Shield } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/Badge";

interface VisitorDetailProps {
    visitor: Visitor;
}


function VisitorDetail({ visitor }: VisitorDetailProps) {

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
    return (
        <div className={cn(
            "flex items-start min-w-max gap-12 relative pt-8 pb-32",
            gateVisualization.mainPath.length === 1 ? "justify-center w-full" : "justify-between"
        )}>
            {/* Main Path Connection Line */}
            {gateVisualization.mainPath.length > 1 && (
                <div className="hidden md:block absolute top-[60px] left-12 right-12 h-[2px] bg-gradient-to-r from-blue-500/20 via-zinc-200 dark:via-zinc-800 to-zinc-200 dark:to-zinc-800 -z-0" />
            )}

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
                                <p className="text-[10px] text-amber-500 dark:text-amber-400 max-w-[100px] leading-tight mt-1 italic font-medium">
                                    {gateStatus.message}
                                </p>
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
                                                "h-10 w-10 p-2 rounded-xl flex items-center justify-center left-4 mr-2 border-2 border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm text-zinc-400 relative z-10",
                                                branch.status === 'unavailable' && "opacity-60 grayscale"
                                            )}>
                                                <Activity className="h-5 w-5" />
                                            </div>

                                            <div className="flex flex-col relative z-20">
                                                <span className="text-[10px] font-black left-4 text-zinc-500 bg-white/80 dark:bg-zinc-900/80 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 leading-none whitespace-nowrap shadow-sm backdrop-blur-sm">
                                                    {branch.gate.name}
                                                </span>
                                                <span className="text-[8px] text-zinc-400 mt-1 uppercase font-black tracking-widest px-1.5">
                                                    {branch.status}
                                                </span>
                                                <span className="text-[10px] text-red-500/80 dark:text-red-400 mt-0.5 italic leading-tight px-1.5 max-w-[120px]">
                                                    {branch.message}
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
    );
}

export default VisitorDetail;