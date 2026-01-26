"use client";

import React, { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { Gate } from "@/types";
import { useUpdateGate, useAdmins } from "@/hooks/use-admin";

interface GateToggleAdminModalProps {
    isOpen: boolean;
    onClose: () => void;
    gate?: Gate;
}

export function GateToggleAdminModal({ isOpen, onClose, gate }: GateToggleAdminModalProps) {
    const [selectedAdminIds, setSelectedAdminIds] = useState<string[]>([]);
    const updateGate = useUpdateGate();
    const { data: adminsData, isLoading: isLoadingAdmins } = useAdmins({ page: 1, pageSize: 100 });

    useEffect(() => {
        if (gate) {
            setSelectedAdminIds(gate.gate_admins?.map(ga => ga.admin_id) || gate.admin_ids || []);
        }
    }, [gate, isOpen]);

    const adminOptions = (adminsData?.items || []).map((admin) => ({
        value: admin.id,
        label: admin.user?.name || admin.user?.email || "Unknown Admin",
    }));

    const handleSubmit = async () => {
        if (!gate) return;
        try {
            await updateGate.mutateAsync({
                gateId: gate.id,
                data: { admin_ids: selectedAdminIds },
            });
            onClose();
        } catch (error) {
            console.error("Failed to update admins:", error);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Manage Admins for ${gate?.name}`}
        >
            <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                    Select or remove admins who have access to manage this gate.
                </p>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Gate Admins</label>
                    <SearchableSelect
                        isMulti
                        options={adminOptions}
                        isLoading={isLoadingAdmins}
                        placeholder="Select admins..."
                        value={selectedAdminIds}
                        onChange={(values: any) => {
                            setSelectedAdminIds(values || []);
                        }}
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <Button variant="outline" type="button" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        isLoading={updateGate.isPending}
                        disabled={selectedAdminIds.length === 0}
                    >
                        Update Admins
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
