"use client";

import React from "react";
import { useAdminGateDependencyMap } from "@/hooks/use-admin";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { GitGraph, Shield, DoorOpen, Users, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GateNode } from "@/types/gate";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";

const GateNodeComponent = ({ node, level = 0 }: { node: GateNode; level?: number }) => {
    return (
        <div className="flex flex-col">
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: level * 0.1 }}
                className="relative flex items-center gap-6 group"
            >
                {/* Connection Line from Parent */}
                {level > 0 && (
                    <div className="absolute -left-10 top-1/2 -translate-y-1/2 flex items-center">
                        <div className="h-px w-10 bg-zinc-300 dark:bg-zinc-700 group-hover:bg-primary/50 transition-colors" />
                        <div className="h-2 w-2 rounded-full bg-zinc-300 dark:bg-zinc-700 group-hover:bg-primary/50 -ml-1 transition-colors" />
                    </div>
                )}

                <Card className={cn(
                    "flex-1 min-w-[280px] max-w-[360px] transition-all duration-300 border-zinc-200/60 dark:border-zinc-800/60",
                    "hover:border-primary/40 hover:shadow-sm shadow-none",
                    "bg-white dark:bg-zinc-900/50 backdrop-blur-sm"
                )}>
                    <CardContent className="p-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "h-10 w-10 rounded-xl flex items-center justify-center transition-colors shadow-smShrink-0",
                                node.is_default
                                    ? "bg-primary text-white shadow-primary/20"
                                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                            )}>
                                <DoorOpen className="h-5 w-5" />
                            </div>
                            <div className="flex flex-col gap-0.5 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm tracking-tight truncate">{node.name}</span>
                                    {node.is_default && (
                                        <Badge variant="default" className="text-[8px] px-1 h-3.5 font-bold uppercase tracking-wider">Default</Badge>
                                    )}
                                </div>
                                <span className="text-[9px] text-muted-foreground font-mono bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded uppercase tracking-wider self-start truncate">
                                    {node.slug}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <div className="flex -space-x-1.5 overflow-hidden">
                                {node.gate_admins && node.gate_admins.length > 0 ? (
                                    node.gate_admins.slice(0, 3).map((ga, idx) => (
                                        <div
                                            key={idx}
                                            className="h-6 w-6 rounded-full ring-2 ring-background bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[9px] font-bold border border-zinc-200 dark:border-zinc-700 shadow-sm"
                                            title={ga.admin?.user?.email}
                                        >
                                            {ga.admin?.user?.first_name?.[0] || "?"}
                                        </div>
                                    ))
                                ) : (
                                    <div className="h-6 w-6 rounded-full border border-dashed border-zinc-300 dark:border-zinc-700 flex items-center justify-center text-zinc-400">
                                        <Shield className="h-2.5 w-2.5" />
                                    </div>
                                )}
                            </div>
                            <span className="text-[8px] text-zinc-400 font-bold uppercase tracking-widest leading-none">
                                {node.gate_admins?.length || 0} Admins
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {node.children && node.children.length > 0 && (
                <div className="ml-[20px] pl-10 border-l border-zinc-200 dark:border-zinc-800 mt-4 space-y-4 pb-2">
                    {node.children.map((child) => (
                        <GateNodeComponent
                            key={child.id}
                            node={child}
                            level={level + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export interface GateDependencyModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function GateDependencyModal({ isOpen, onClose }: GateDependencyModalProps) {
    const { data: tree, isLoading } = useAdminGateDependencyMap();

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Gate Dependency Map"
            size="xl"
            className="max-w-[1000px]"
        >
            <div className="space-y-6">
                <div className="flex items-center justify-between gap-4 p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                            <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                            Root Gate
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                            <div className="h-2.5 w-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                            Child Gate
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-medium">
                        <Clock className="h-3 w-3" />
                        Updated: {new Date().toLocaleDateString()}
                    </div>
                </div>

                <div className="relative min-h-[400px] overflow-x-auto pb-8">
                    {isLoading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                            <div className="h-10 w-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
                            <p className="text-zinc-400 text-sm font-medium animate-pulse">Mapping dependencies...</p>
                        </div>
                    ) : (
                        <div className="pt-4">
                            <AnimatePresence>
                                <div className="flex flex-col gap-10">
                                    {tree && tree.length > 0 ? (
                                        tree.map((node) => (
                                            <GateNodeComponent key={node.id} node={node} />
                                        ))
                                    ) : (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="flex flex-col items-center justify-center py-20 text-center gap-4"
                                        >
                                            <div className="h-16 w-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                                                <DoorOpen className="h-8 w-8" />
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="text-lg font-bold">No Dependencies Mapped</h3>
                                                <p className="text-sm text-zinc-500 max-w-xs mx-auto">Configure gate dependencies to see them visualized.</p>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}
