"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Gate } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { format } from "date-fns";
import { useToggleGateAdminStatus } from "@/hooks/use-admin";
import { Loader2 } from "lucide-react";

interface GateViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    gate?: Gate;
}

export function GateViewModal({ isOpen, onClose, gate }: GateViewModalProps) {
    const toggleStatus = useToggleGateAdminStatus();
    if (!gate) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Gate details"
            size="md"
            description="Checkpoint identity, operator assignments and dependencies."
        >
            <div className="space-y-6 p-5">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--vms-ink-muted)]">Gate name</span>
                        <p className="mt-1 text-sm font-medium">{gate.name}</p>
                    </div>
                    <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--vms-ink-muted)]">Slug</span>
                        <p className="mt-1 text-sm font-medium">{gate.slug}</p>
                    </div>
                    <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--vms-ink-muted)]">Default gate</span>
                        <div className="mt-1">
                            <Badge variant={gate.is_default ? "success" : "secondary"}>
                                {gate.is_default ? "Yes" : "No"}
                            </Badge>
                        </div>
                    </div>
                    <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--vms-ink-muted)]">Created at</span>
                        <p className="mt-1 text-sm font-medium">
                            {format(new Date(gate.created_at), "PPP p")}
                        </p>
                    </div>
                </div>

                <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-[var(--vms-ink-muted)]">Dependency</span>
                    <p className="mt-1 text-sm font-medium">
                        {gate.dependency?.name || gate.dependency_id || "None"}
                    </p>
                </div>

                <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-[var(--vms-ink-muted)]">Administrators ({gate.gate_admins?.length || 0})</span>
                    <div className="mt-2 space-y-2">
                        {gate.gate_admins && gate.gate_admins.length > 0 ? (
                            gate.gate_admins.map((gateAdmin) => (
                                <div key={gateAdmin.admin_id} className="flex items-center justify-between gap-3 rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] p-3">
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--vms-surface)] text-xs font-semibold ring-1 ring-[var(--vms-line)]">
                                            {gateAdmin.admin?.user?.first_name?.[0] || gateAdmin.admin?.user?.last_name?.[0] || "?"}
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium">{gateAdmin.admin?.user?.first_name + " " + gateAdmin.admin?.user?.last_name || "Unnamed Admin"}</span>
                                                <Badge variant={gateAdmin.is_active ? "success" : "secondary"} className="text-[10px] px-1.5 py-0">
                                                    {gateAdmin.is_active ? "Active" : "Inactive"}
                                                </Badge>
                                            </div>
                                            <span className="text-xs text-muted-foreground">{gateAdmin.admin?.user?.email}</span>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="min-h-11 text-xs font-semibold"
                                        onClick={() => toggleStatus.mutate({ gateId: gate.id, gateAdminIds: [gateAdmin.id] })}
                                        disabled={toggleStatus.isPending && toggleStatus.variables?.gateAdminIds.includes(gateAdmin.id)}
                                    >
                                        {toggleStatus.isPending && toggleStatus.variables?.gateAdminIds.includes(gateAdmin.id) ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                            gateAdmin.is_active ? "Deactivate" : "Activate"
                                        )}
                                    </Button>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground italic">No admins assigned</p>
                        )}
                    </div>
                </div>

                {gate.dependencies && gate.dependencies.length > 0 && (
                    <div>
                        <span className="text-xs font-semibold uppercase text-[var(--vms-ink-muted)]">Dependent gates ({gate.dependencies.length})</span>
                        <div className="mt-2 space-y-1">
                            {gate.dependencies.map(dep => (
                                <div key={dep.id} className="rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] p-2 text-sm">
                                    {dep.name}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex justify-end pt-4">
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
