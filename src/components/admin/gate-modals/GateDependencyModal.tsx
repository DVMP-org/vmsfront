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
                        <div className="h-px w-10 bg-[var(--vms-line-strong)] transition-colors group-hover:bg-[var(--vms-ink-muted)]" />
                        <div className="-ml-1 h-2 w-2 rounded-full bg-[var(--vms-line-strong)] transition-colors group-hover:bg-[var(--vms-ink-muted)]" />
                    </div>
                )}

                <Card className={cn(
                    "min-w-[280px] max-w-[360px] flex-1 border-[var(--vms-line)] transition-colors duration-150",
                    "shadow-none hover:border-[var(--vms-line-strong)]",
                    "bg-[var(--vms-surface)]"
                )}>
                    <CardContent className="p-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--vms-radius-control)] transition-colors",
                                node.is_default
                                    ? "bg-[var(--vms-action)] text-[var(--vms-on-action)]"
                                    : "bg-[var(--vms-surface-subtle)] text-[var(--vms-ink-muted)]"
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
                                <span className="self-start truncate rounded bg-[var(--vms-surface-subtle)] px-1 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[var(--vms-ink-muted)]">
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
                                            className="flex h-6 w-6 items-center justify-center rounded-full border border-[var(--vms-line)] bg-[var(--vms-surface)] text-[9px] font-bold ring-2 ring-[var(--vms-surface)]"
                                            title={ga.admin?.user?.email}
                                        >
                                            {ga.admin?.user?.first_name?.[0] || "?"}
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-[var(--vms-line-strong)] text-[var(--vms-ink-muted)]">
                                        <Shield className="h-2.5 w-2.5" />
                                    </div>
                                )}
                            </div>
                            <span className="text-[8px] font-bold uppercase leading-none tracking-widest text-[var(--vms-ink-muted)]">
                                {node.gate_admins?.length || 0} Admins
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {node.children && node.children.length > 0 && (
                <div className="ml-[20px] mt-4 space-y-4 border-l border-[var(--vms-line)] pb-2 pl-10">
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
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] p-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--vms-ink-muted)]">
                            <div className="h-2.5 w-2.5 rounded-full bg-[var(--vms-action)]" />
                            Root gate
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--vms-ink-muted)]">
                            <div className="h-2.5 w-2.5 rounded-full bg-[var(--vms-line-strong)]" />
                            Child gate
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-medium text-[var(--vms-ink-muted)]">
                        <Clock className="h-3 w-3" />
                        Updated: {new Date().toLocaleDateString()}
                    </div>
                </div>

                <div className="relative min-h-[400px] overflow-x-auto pb-8">
                    {isLoading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                            <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--vms-line)] border-t-[var(--vms-action)] motion-reduce:animate-none" />
                            <p className="text-sm font-medium text-[var(--vms-ink-muted)]">Mapping dependencies…</p>
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
                                            <div className="flex h-16 w-16 items-center justify-center rounded-[var(--vms-radius-surface)] bg-[var(--vms-surface-subtle)] text-[var(--vms-ink-muted)]">
                                                <DoorOpen className="h-8 w-8" />
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="text-lg font-semibold">No dependencies mapped</h3>
                                                <p className="mx-auto max-w-xs text-sm text-[var(--vms-ink-muted)]">Configure gate dependencies to see them visualized.</p>
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
