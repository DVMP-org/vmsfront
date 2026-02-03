
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useExtendGatePass } from "@/hooks/use-resident";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/Input";
import { useEffect } from "react";
import { format } from "date-fns";
import { FormLabel } from "@/components/ui/label/FormLabel";
import { ErrorMessage } from "@/components/ui/form/ErrorMessage";

const extendSchema = z.object({
    validTo: z.string().min(1, "Valid until date is required"),
});

type ExtendFormValues = z.infer<typeof extendSchema>;

interface ExtendGatePassModalProps {
    isOpen: boolean;
    onClose: () => void;
    passId: string;
    houseId: string;
    currentValidTo?: string | null;
}

export function ExtendGatePassModal({
    isOpen,
    onClose,
    passId,
    houseId,
    currentValidTo,
}: ExtendGatePassModalProps) {
    const extendMutation = useExtendGatePass(houseId);

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
        reset,
    } = useForm<ExtendFormValues>({
        resolver: zodResolver(extendSchema),
        defaultValues: {
            validTo: "",
        },
    });

    useEffect(() => {
        if (isOpen && currentValidTo) {
            // Format current date for datetime-local input (YYYY-MM-DDThh:mm)
            try {
                const date = new Date(currentValidTo);
                const formatted = format(date, "yyyy-MM-dd'T'HH:mm");
                setValue("validTo", formatted);
            } catch (e) {
                console.error("Error formatting date:", e);
                setValue("validTo", "");
            }
        } else if (isOpen) {
            setValue("validTo", "");
        }
    }, [isOpen, currentValidTo, setValue]);

    const onSubmit = (data: ExtendFormValues) => {
        // Convert local datetime string to ISO string for backend
        const date = new Date(data.validTo);
        const isoString = date.toISOString();

        extendMutation.mutate(
            { passId, validTo: isoString },
            {
                onSuccess: () => {
                    onClose();
                    reset();
                },
            }
        );
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Extend Gate Pass">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md text-sm text-blue-800 dark:text-blue-300 mb-4">
                    Extend the validity of this gate pass. The pass will remain active until the new date and time.
                </div>

                <div className="space-y-2">
                    <FormLabel>Valid Until</FormLabel>
                    <Input
                        type="datetime-local"
                        {...register("validTo")}
                        min={new Date().toISOString().slice(0, 16)}
                        error={errors.validTo?.message}
                    />
                    <ErrorMessage error={errors.validTo?.message} />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" isLoading={extendMutation.isPending}>
                        Extend Pass
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
