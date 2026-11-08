"use client";

import React, { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { Field } from "@/components/ui/form/Field";
import { Gate } from "@/types";
import { useUpdateGate, useAdmins } from "@/hooks/use-admin";

interface GateToggleAdminModalProps {
    isOpen: boolean;
    onClose: () => void;
    gate?: Gate;
}

export function GateToggleAdminModal({ isOpen, onClose, gate }: GateToggleAdminModalProps) {
    const [selectedAdminIds, setSelectedAdminIds] = useState<string[]>([]);
    const [error, setError] = useState("");
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
        setError("");
        try {
            await updateGate.mutateAsync({
                gateId: gate.id,
                data: { admin_ids: selectedAdminIds },
            });
            onClose();
        } catch (submitError) {
            setError(
                submitError instanceof Error
                    ? submitError.message
                    : "Administrators could not be updated.",
            );
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Manage administrators for ${gate?.name}`}
            description="Assigned administrators can configure and operate this gate."
        >
            <div className="space-y-5 p-5">
                <Field
                    id="gate-admin-assignments"
                    label="Gate administrators"
                    description="At least one administrator is required."
                    required
                >
                    {() => (
                        <SearchableSelect
                            inputId="gate-admin-assignments"
                            isMulti
                            options={adminOptions}
                            isLoading={isLoadingAdmins}
                            placeholder="Select administrators"
                            value={selectedAdminIds}
                            onChange={(values: string[] | undefined) => {
                                setSelectedAdminIds(values || []);
                                setError("");
                            }}
                        />
                    )}
                </Field>
                {error ? (
                    <p
                        role="alert"
                        className="rounded-[var(--vms-radius-control)] border border-[var(--vms-danger)] bg-[var(--vms-danger-subtle)] p-3 text-sm text-[var(--vms-danger)]"
                    >
                        {error}
                    </p>
                ) : null}

                <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-[var(--vms-line)] bg-[var(--vms-surface)] pt-4 sm:flex-row sm:justify-end">
                    <Button variant="outline" type="button" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        isLoading={updateGate.isPending}
                        disabled={selectedAdminIds.length === 0}
                    >
                        Update administrators
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
