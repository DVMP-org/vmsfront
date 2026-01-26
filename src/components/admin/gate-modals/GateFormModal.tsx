"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { Checkbox } from "@/components/ui/Checkbox";
import { Gate, CreateGateRequest, UpdateGateRequest } from "@/types";
import { useCreateGate, useUpdateGate, useAdmins, useAdminGates } from "@/hooks/use-admin";

const gateSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    admin_ids: z.array(z.string()).min(1, "At least one admin is required"),
    dependency_id: z.string().nullable().optional(),
    is_default: z.boolean().optional(),
    slug: z.string().optional(),
});

type GateFormValues = z.infer<typeof gateSchema>;

interface GateFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    gate?: Gate;
}

export function GateFormModal({ isOpen, onClose, gate }: GateFormModalProps) {
    const isEditing = !!gate;

    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors },
        setValue,
        watch,
    } = useForm<GateFormValues>({
        resolver: zodResolver(gateSchema),
        defaultValues: {
            name: "",
            admin_ids: [],
            dependency_id: null,
            is_default: false,
            slug: "",
        },
    });

    const watchAdminIds = watch("admin_ids");
    const watchDependencyId = watch("dependency_id");
    const watchIsDefault = watch("is_default");

    useEffect(() => {
        if (gate) {
            reset({
                name: gate.name,
                admin_ids: gate.gate_admins?.map(ga => ga.admin_id) || gate.admin_ids || [],
                dependency_id: gate.dependency_id,
                is_default: gate.is_default,
                slug: gate.slug,
            });
        } else {
            reset({
                name: "",
                admin_ids: [],
                dependency_id: null,
                is_default: false,
                slug: "",
            });
        }
    }, [gate, reset, isOpen]);

    const createGate = useCreateGate();
    const updateGate = useUpdateGate();

    const { data: adminsData } = useAdmins({ page: 1, pageSize: 100 });
    const { data: gatesData } = useAdminGates({ page: 1, pageSize: 100 });

    const adminOptions = (adminsData?.items || []).map((admin) => ({
        value: admin.id,
        label: admin.user?.name || admin.user?.email || "Unknown Admin",
    }));

    const gateOptions = (gatesData?.items || [])
        .filter((g) => g.id !== gate?.id)
        .map((g) => ({
            value: g.id,
            label: g.name,
        }));

    const onSubmit = async (data: GateFormValues) => {
        try {
            if (isEditing && gate) {
                await updateGate.mutateAsync({
                    gateId: gate.id,
                    data: data as UpdateGateRequest,
                });
            } else {
                await createGate.mutateAsync(data as CreateGateRequest);
            }
            onClose();
        } catch (error) {
            console.error("Failed to save gate:", error);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? "Edit Gate" : "Create Gate"}
            className="bg-card"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Gate Name</label>
                    <Input
                        placeholder="Main Entrance"
                        {...register("name")}
                        error={errors.name?.message}
                    />
                </div>

                {isEditing && (
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Slug</label>
                        <Input
                            placeholder="main-entrance"
                            {...register("slug")}
                            error={errors.slug?.message}
                        />
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-sm font-medium">Gate Admins</label>
                    <SearchableSelect
                        isMulti
                        options={adminOptions}
                        placeholder="Select admins..."
                        value={watchAdminIds}
                        onChange={(values: any) => {
                            setValue("admin_ids", values || []);
                        }}
                    />
                    {errors.admin_ids && (
                        <p className="text-xs text-red-500">{errors.admin_ids.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Dependency Gate (Optional)</label>
                    <SearchableSelect
                        options={gateOptions}
                        isClearable
                        placeholder="Select dependency gate..."
                        value={watchDependencyId || undefined}
                        onChange={(value: any) => {
                            setValue("dependency_id", value || null);
                        }}
                    />
                </div>

                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="is_default"
                        checked={!!watchIsDefault}
                        onChange={(e) => setValue("is_default", e.target.checked)}
                        label="Mark as default gate"
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <Button variant="outline" type="button" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        isLoading={createGate.isPending || updateGate.isPending}
                    >
                        {isEditing ? "Save Changes" : "Create Gate"}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
