"use client";

import React from "react";
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
            title="Gate Details"
            size="md"
            className="bg-card"
        >
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase uppercase tracking-wider">Gate Name</label>
                        <p className="text-sm font-medium mt-1">{gate.name}</p>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Slug</label>
                        <p className="text-sm font-medium mt-1">{gate.slug}</p>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Default Gate</label>
                        <div className="mt-1">
                            <Badge variant={gate.is_default ? "success" : "secondary"}>
                                {gate.is_default ? "Yes" : "No"}
                            </Badge>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Created At</label>
                        <p className="text-sm font-medium mt-1">
                            {format(new Date(gate.created_at), "PPP p")}
                        </p>
                    </div>
                </div>

                <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dependency</label>
                    <p className="text-sm font-medium mt-1">
                        {gate.dependency?.name || gate.dependency_id || "None"}
                    </p>
                </div>

                <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Admins ({gate.gate_admins?.length || 0})</label>
                    <div className="mt-2 space-y-2">
                        {gate.gate_admins && gate.gate_admins.length > 0 ? (
                            gate.gate_admins.map((gateAdmin) => (
                                <div key={gateAdmin.admin_id} className="flex items-center justify-between p-2 rounded-md bg-white/10 border border-white/20">
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-full bg-white/50 flex items-center justify-center text-xs font-medium">
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
                                        className="h-8 text-[10px] uppercase font-bold tracking-tight hover:bg-white/20"
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
                        <label className="text-xs font-semibold text-muted-foreground uppercase ">Dependent Gates ({gate.dependencies.length})</label>
                        <div className="mt-2 space-y-1">
                            {gate.dependencies.map(dep => (
                                <div key={dep.id} className="text-sm p-2 rounded bg-white/10 border border-white/50">
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
