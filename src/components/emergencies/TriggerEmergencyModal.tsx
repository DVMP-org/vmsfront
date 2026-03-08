"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmergencyType, EmergencySeverity, TriggerEmergencyRequest } from "@/types";
import { AlertTriangle } from "lucide-react";

const schema = z.object({
    type: z.enum(["fire", "medical", "security", "natural_disaster", "other"]),
    severity: z.enum(["low", "medium", "high", "critical"]).default("high"),
    description: z.string().max(500).optional(),
    location: z.string().max(255).optional(),
    residency_id: z.string().uuid().optional().nullable(),
});

type FormData = z.infer<typeof schema>;

interface TriggerEmergencyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: TriggerEmergencyRequest) => void;
    isLoading?: boolean;
    /** Pre-fill a specific residency. Pass null for community-wide. */
    residencyId?: string | null;
}

const TYPE_OPTIONS: { value: EmergencyType; label: string }[] = [
    { value: "fire", label: "🔥 Fire" },
    { value: "medical", label: "🏥 Medical" },
    { value: "security", label: "🚨 Security" },
    { value: "natural_disaster", label: "🌪 Natural Disaster" },
    { value: "other", label: "⚠️ Other" },
];

const SEVERITY_OPTIONS: { value: EmergencySeverity; label: string; color: string }[] = [
    { value: "low", label: "Low", color: "text-blue-600" },
    { value: "medium", label: "Medium", color: "text-orange-600" },
    { value: "high", label: "High", color: "text-red-600" },
    { value: "critical", label: "Critical", color: "text-red-700 font-bold" },
];

export function TriggerEmergencyModal({
    isOpen,
    onClose,
    onSubmit,
    isLoading = false,
    residencyId,
}: TriggerEmergencyModalProps) {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            type: "security",
            severity: "high",
            residency_id: residencyId ?? null,
        },
    });

    const handleClose = () => {
        reset();
        onClose();
    };

    const onFormSubmit = (data: FormData) => {
        onSubmit({
            type: data.type,
            severity: data.severity,
            description: data.description || undefined,
            location: data.location || undefined,
            residency_id: data.residency_id || undefined,
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Trigger Emergency Alert">
            <div className="mb-4 flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                <p className="text-sm text-red-700">
                    This will immediately notify all security personnel and key community
                    contacts. Only use in a genuine emergency.
                </p>
            </div>

            <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
                {/* Type */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Emergency Type <span className="text-red-500">*</span>
                    </label>
                    <select
                        {...register("type")}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                        {TYPE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                    {errors.type && (
                        <p className="text-red-500 text-xs mt-1">{errors.type.message}</p>
                    )}
                </div>

                {/* Severity */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Severity <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2 flex-wrap">
                        {SEVERITY_OPTIONS.map((opt) => (
                            <label
                                key={opt.value}
                                className="flex items-center gap-1 cursor-pointer"
                            >
                                <input
                                    type="radio"
                                    value={opt.value}
                                    {...register("severity")}
                                    className="accent-red-600"
                                />
                                <span className={`text-sm ${opt.color}`}>{opt.label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                    </label>
                    <textarea
                        {...register("description")}
                        rows={3}
                        placeholder="Briefly describe the situation..."
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                    />
                </div>

                {/* Location */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Location
                    </label>
                    <Input
                        {...register("location")}
                        placeholder="e.g. Block C, Gate 2, Unit 14..."
                    />
                </div>

                <div className="flex gap-3 justify-end pt-2">
                    <Button type="button" variant="outline" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        {isLoading ? "Alerting..." : "🚨 Trigger Alert"}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
