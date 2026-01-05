"use client";

import { useForm } from "react-hook-form";
import { ResidentUserCreate, ResidentProfileUpdatePayload, ResidentUser, ResidentHouse } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const residentSchema = z.object({
    first_name: z.string().min(2, "First name is required"),
    last_name: z.string().min(2, "Last name is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().optional(),
    user_type: z.enum(["resident", "admin"]).optional(),
});

type FormData = z.infer<typeof residentSchema>;

interface ResidentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    isLoading: boolean;
    initialData?: ResidentHouse | null;
    mode: "create" | "edit";
}

export function ResidentModal({
    isOpen,
    onClose,
    onSubmit,
    isLoading,
    initialData,
    mode,
}: ResidentModalProps) {
    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(residentSchema),
        defaultValues: {
            first_name: "",
            last_name: "",
            email: "",
            phone: "",
        }
    });

    useEffect(() => {
        if (isOpen && initialData) {
            setValue("first_name", initialData.resident.user.first_name || "");
            setValue("last_name", initialData.resident.user.last_name || "");
            setValue("email", initialData.resident.user.email || "");
            setValue("phone", initialData.resident.user.phone || "");
        } else if (isOpen && !initialData) {
            reset({
                first_name: "",
                last_name: "",
                email: "",
                phone: "",
            });
        }
    }, [isOpen, initialData, setValue, reset]);

    const handleFormSubmit = async (data: FormData) => {
        // For create we need more fields usually, for edit just profile updates
        // Keeping it simple based on defined types for now
        await onSubmit(data);
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={mode === "create" ? "Add Resident" : "Edit Resident"}
        >
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="First Name"
                        {...register("first_name")}
                        error={errors.first_name?.message}
                        placeholder="John"
                    />
                    <Input
                        label="Last Name"
                        {...register("last_name")}
                        error={errors.last_name?.message}
                        placeholder="Doe"
                    />
                </div>

                <Input
                    label="Email"
                    type="email"
                    {...register("email")}
                    error={errors.email?.message}
                    placeholder="john.doe@example.com"
                    disabled={mode === "edit"} // Often emails aren't editable directly
                />

                <Input
                    label="Phone"
                    {...register("phone")}
                    error={errors.phone?.message}
                    placeholder="+1234567890"
                />

                <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button type="submit" isLoading={isLoading}>
                        {mode === "create" ? "Add Resident" : "Save Changes"}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
