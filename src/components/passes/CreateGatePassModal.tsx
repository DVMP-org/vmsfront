"use client";

import { useEffect, useRef, useState } from "react";
import { useCreateGatePass, useResident } from "@/hooks/use-resident";
import { useAuthStore } from "@/store/auth-store";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ChevronDown, ChevronUp, Hash, Mail, Phone, User2, Users } from "lucide-react";

interface Visitor {
    name: string;
    email: string;
    phone: string;
}

interface CreateGatePassModalProps {
    isOpen: boolean;
    onClose: () => void;
    residencyId: string | null;
    onSuccess?: (passId: string) => void;
}

const durations = [
    { label: "30m", value: "30m", minutes: 30 },
    { label: "1h", value: "1h", minutes: 60 },
    { label: "4h", value: "4h", minutes: 240 },
    { label: "12h", value: "12h", minutes: 720 },
    { label: "1d", value: "1d", minutes: 1440 },
];

const formatDateTimeLocal = (date: Date) => {
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
};

export function CreateGatePassModal({
    isOpen,
    onClose,
    residencyId,
    onSuccess,
}: CreateGatePassModalProps) {
    const { user } = useAuthStore();
    const { data: resident } = useResident();
    const createPassMutation = useCreateGatePass(residencyId);
    const nameInputRef = useRef<HTMLInputElement>(null);

    const [visitorName, setVisitorName] = useState("");
    const [validFrom, setValidFrom] = useState("");
    const [validTo, setValidTo] = useState("");
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [showCustomDates, setShowCustomDates] = useState(false);
    const [selectedDuration, setSelectedDuration] = useState<string | null>("30m");
    const [maxUses, setMaxUses] = useState("");
    const [visitors, setVisitors] = useState<Visitor[]>([{ name: "", email: "", phone: "" }]);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleDurationSelect = (
        duration: { label: string; value: string; minutes: number } | null
    ) => {
        if (!duration) {
            setSelectedDuration(null);
            setShowCustomDates(true);
            return;
        }

        setSelectedDuration(duration.value);
        setShowCustomDates(false);

        const now = new Date();
        const end = new Date(now.getTime() + duration.minutes * 60000);

        setValidFrom(formatDateTimeLocal(now));
        setValidTo(formatDateTimeLocal(end));
        setErrors((prev) => {
            const next = { ...prev };
            delete next.validFrom;
            delete next.validTo;
            return next;
        });
    };

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setVisitorName("");
            setShowAdvanced(false);
            setShowCustomDates(false);
            setMaxUses("");
            setVisitors([{ name: "", email: "", phone: "" }]);
            setErrors({});
            // Initialize default duration
            handleDurationSelect(durations[0]);
            // Autofocus
            setTimeout(() => nameInputRef.current?.focus(), 50);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const toggleAdvanced = () => {
        const next = !showAdvanced;
        setShowAdvanced(next);

        if (next) {
            if (visitorName.trim()) {
                setVisitors((prev) => {
                    const updated = [...prev];
                    if (updated.length > 0 && !updated[0].name) {
                        updated[0] = { ...updated[0], name: visitorName.trim() };
                    }
                    return updated;
                });
            }
        } else {
            if (visitors.length > 0 && visitors[0].name) {
                setVisitorName(visitors[0].name);
            }
        }
    };

    const addVisitor = () => {
        setVisitors([...visitors, { name: "", email: "", phone: "" }]);
    };

    const removeVisitor = (index: number) => {
        if (visitors.length > 1) {
            setVisitors(visitors.filter((_, i) => i !== index));
        }
    };

    const updateVisitor = (index: number, field: keyof Visitor, value: string) => {
        const updated = [...visitors];
        updated[index][field] = value;
        setVisitors(updated);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const newErrors: Record<string, string> = {};
        if (!showAdvanced && !visitorName.trim()) newErrors.visitorName = "Visitor name is required";
        if (!validFrom) newErrors.validFrom = "Start date is required";
        if (!validTo) newErrors.validTo = "End date is required";
        if (validFrom && validTo && new Date(validFrom) >= new Date(validTo)) {
            newErrors.validTo = "End date must be after start date";
        }

        if (showAdvanced) {
            visitors.forEach((visitor, index) => {
                if (!visitor.name) newErrors[`visitor_${index}_name`] = "Name is required";
                if (!visitor.email) newErrors[`visitor_${index}_email`] = "Email is required";
            });
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        if (!residencyId || !user || !resident) return;

        const visitorData = showAdvanced
            ? visitors.filter((v) => v.name && v.email)
            : [{ name: visitorName, email: "", phone: "" }];

        createPassMutation.mutate(
            {
                resident_id: resident.id,
                residency_id: residencyId,
                valid_from: new Date(validFrom).toISOString(),
                valid_to: new Date(validTo).toISOString(),
                max_uses: maxUses ? parseInt(maxUses) : undefined,
                visitors: visitorData,
            },
            {
                onSuccess: (response) => {
                    const passId = response?.data?.id;
                    onSuccess?.(passId ?? "");
                    onClose();
                },
            }
        );
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create Gate Pass" size="lg">
            <div className="px-3 pb-4 xs:px-4 sm:px-6">
                <form onSubmit={handleSubmit} className="space-y-3 mt-4">
                    {/* Fast Mode: Essential Fields */}
                    <div className="bg-card border border-muted rounded-md shadow-sm overflow-hidden">
                        <div className="p-4 space-y-4">
                            {!showAdvanced && (
                                <Input
                                    ref={nameInputRef}
                                    label="Visitor Name"
                                    placeholder="e.g. John Doe"
                                    icon={Users}
                                    value={visitorName}
                                    onChange={(e) => setVisitorName(e.target.value)}
                                    error={errors.visitorName}
                                    className="outline-none border-muted"
                                />
                            )}

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                                    Pass Duration
                                </label>
                                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                    {durations.map((d) => (
                                        <button
                                            key={d.value}
                                            type="button"
                                            onClick={() => handleDurationSelect(d)}
                                            className={`py-2 px-3 text-sm font-medium rounded-xs dark:text-white border transition-all ${selectedDuration === d.value
                                                    ? "bg-[rgb(var(--brand-primary))] text-white border-[rgb(var(--brand-primary))] shadow-sm"
                                                    : "bg-card text-zinc-600 border-muted hover:border-zinc-300 hover:bg-zinc-50 dark:hover:text-[rgb(var(--brand-primary))]"
                                                }`}
                                        >
                                            {d.label}
                                        </button>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => handleDurationSelect(null)}
                                        className={`py-2 px-3 text-sm font-medium rounded-xs dark:text-white border transition-all ${showCustomDates
                                                ? "bg-[rgb(var(--brand-primary))] text-white border-[rgb(var(--brand-primary))] shadow-sm"
                                                : "bg-card/50 text-zinc-600 border-muted hover:border-zinc-300 hover:bg-zinc-50 dark:hover:text-[rgb(var(--brand-primary))]"
                                            }`}
                                    >
                                        Custom
                                    </button>
                                </div>
                            </div>

                            {showCustomDates && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-zinc-100 mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                    <Input
                                        id="validFrom"
                                        type="datetime-local"
                                        label="Valid From"
                                        value={validFrom}
                                        onChange={(e) => setValidFrom(e.target.value)}
                                        error={errors.validFrom}
                                    />
                                    <Input
                                        id="validTo"
                                        type="datetime-local"
                                        label="Valid To"
                                        value={validTo}
                                        onChange={(e) => setValidTo(e.target.value)}
                                        error={errors.validTo}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Advanced Options */}
                    <div className="border border-muted rounded-md bg-card shadow-sm overflow-hidden">
                        <button
                            type="button"
                            onClick={toggleAdvanced}
                            className="w-full cursor-pointer flex items-center justify-between px-4 py-3 text-sm text-zinc-700 dark:text-white hover:bg-zinc-50/50 dark:hover:bg-zinc-800 transition-colors font-medium"
                        >
                            <div className="flex items-center gap-2">
                                <span className="p-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                                    {showAdvanced ? (
                                        <ChevronUp className="h-4 w-4" />
                                    ) : (
                                        <ChevronDown className="h-4 w-4" />
                                    )}
                                </span>
                                <span>Advanced Options</span>
                                {!showAdvanced && (
                                    <span className="text-[10px] text-zinc-400 font-normal ml-1">
                                        (multiple visitors, uses)
                                    </span>
                                )}
                            </div>
                        </button>

                        {showAdvanced && (
                            <div className="border-t border-muted p-4 space-y-6 bg-zinc-50/30 dark:bg-zinc-800/30">
                                <div className="max-w-xs">
                                    <Input
                                        type="number"
                                        label="Max Uses"
                                        placeholder="Unlimited"
                                        icon={Hash}
                                        value={maxUses}
                                        onChange={(e) => setMaxUses(e.target.value)}
                                        min="1"
                                    />
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between border-b border-muted pb-2">
                                        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                                            Visitor Details
                                        </label>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={addVisitor}
                                            className="h-8 text-xs font-medium"
                                        >
                                            + Add Visitor
                                        </Button>
                                    </div>

                                    <div className="space-y-4">
                                        {visitors.map((visitor, index) => (
                                            <div
                                                key={index}
                                                className="border border-muted rounded-lg p-4 space-y-4 bg-background shadow-sm relative group"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-zinc-400">
                                                        VISITOR #{index + 1}
                                                    </span>
                                                    {visitors.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeVisitor(index)}
                                                            className="text-xs font-medium text-red-500 hover:text-red-600 transition-colors bg-red-50 px-2 py-1 rounded"
                                                        >
                                                            Remove
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-1 gap-4">
                                                    <Input
                                                        label="Name"
                                                        placeholder="Full Name"
                                                        value={visitor.name}
                                                        icon={User2}
                                                        onChange={(e) => updateVisitor(index, "name", e.target.value)}
                                                        error={errors[`visitor_${index}_name`]}
                                                    />
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <Input
                                                            type="email"
                                                            label="Email"
                                                            placeholder="email@example.com"
                                                            icon={Mail}
                                                            value={visitor.email}
                                                            onChange={(e) => updateVisitor(index, "email", e.target.value)}
                                                            error={errors[`visitor_${index}_email`]}
                                                        />
                                                        <Input
                                                            type="tel"
                                                            label="Phone"
                                                            icon={Phone}
                                                            placeholder="Optional"
                                                            value={visitor.phone}
                                                            onChange={(e) => updateVisitor(index, "phone", e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-muted">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="px-6 h-10 text-zinc-600 font-medium dark:text-white"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            isLoading={createPassMutation.isPending}
                            className="px-8 h-10 bg-[rgb(var(--brand-primary))] text-white font-medium shadow-md hover:bg-zinc-800 transition-all ring-offset-2 active:scale-[0.98]"
                        >
                            Create Pass
                        </Button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
