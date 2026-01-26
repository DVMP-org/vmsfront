"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Due, CreateDueRequest } from "@/types";
import { useUpdateDue } from "@/hooks/use-admin";

const updateSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    description: z.string().min(1, "Description is required"),
});

type UpdateFormData = z.infer<typeof updateSchema>;

interface UpdateDueModalProps {
    due: Due;
    isOpen: boolean;
    onClose: () => void;
}

export function UpdateDueModal({ due, isOpen, onClose }: UpdateDueModalProps) {
    const updateMutation = useUpdateDue();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<UpdateFormData>({
        resolver: zodResolver(updateSchema),
        defaultValues: {
            name: due.name,
            description: due.description || "",
        },
    });

    const onSubmit = (data: UpdateFormData) => {
        const payload: Partial<CreateDueRequest> = {
            name: data.name,
            description: data.description,
        };

        updateMutation.mutate(
            { dueId: due.id, data: payload },
            {
                onSuccess: () => {
                    onClose();
                },
            }
        );
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Update Due Basic Info">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                    label="Due Name"
                    placeholder="e.g. Monthly Security Fee"
                    {...register("name")}
                    error={errors.name?.message}
                />
                <div className="space-y-1">
                    <label className="text-sm font-medium">Description</label>
                    <textarea
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:visible:outline-none focus:visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Describe the purpose..."
                        {...register("description")}
                    />
                    {errors.description?.message && (
                        <p className="text-xs text-destructive">{errors.description?.message}</p>
                    )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button variant="outline" type="button" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" isLoading={updateMutation.isPending}>
                        Update Info
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
