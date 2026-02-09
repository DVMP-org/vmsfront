"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { SearchableSelect, SearchableSelectOption } from "@/components/ui/SearchableSelect";
import { Mail, User2Icon, Phone, Building2, Users, MessageSquare, FileText } from "lucide-react";
import { toast } from "sonner";
import { CreateVisitRequest, VisitResidency, VisitResident } from "@/types";
import { visitService } from "@/services/visit-service";


export default function VisitRequestPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        residency_id: "",
        resident_id: "",
        name: "",
        email: "",
        phone: "",
        purpose: "",
        additional_information: "",
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Fetch residencies
    const {
        data: residenciesResponse,
        isLoading: isLoadingResidencies,
    } = useQuery({
        queryKey: ["visit", "residencies"],
        queryFn: () => visitService.getResidenciesForVisit(),
    });

    // Fetch residents based on selected residency
    const {
        data: residentsResponse,
        isLoading: isLoadingResidents,
        refetch: refetchResidents,
    } = useQuery({
        queryKey: ["visit", "residents", formData.residency_id],
        queryFn: () => visitService.getResidentsForResidency(formData.residency_id),
        enabled: !!formData.residency_id,
    });

    // Create visit request mutation
    const createVisitMutation = useMutation({
        mutationFn: (data: CreateVisitRequest) => visitService.createVisitRequest(data),
        onSuccess: (response) => {
            toast.success("Visit request submitted successfully!");
            const visitId = response.data?.id || "confirmed";
            router.push(`/visit/success?reference=${visitId}`);
        },
        onError: (error: any) => {
            const errorMessage =
                error?.response?.data?.message ||
                error?.message ||
                "Failed to submit visit request. Please try again.";
            toast.error(errorMessage);
        },
    });

    // Transform residencies data for SearchableSelect
    const residencyOptions: SearchableSelectOption[] =
        residenciesResponse?.data?.map((residency: VisitResidency) => ({
            value: residency.id,
            label: `${residency.name} - ${residency.address}`,
        })) || [];

    // Transform residents data for SearchableSelect
    const residentOptions: SearchableSelectOption[] =
        residentsResponse?.data?.map((resident: VisitResident) => ({
            value: resident.id,
            label: resident.name,
        })) || [];

    // Reset resident selection when residency changes
    useEffect(() => {
        if (formData.residency_id) {
            setFormData((prev) => ({ ...prev, resident_id: "" }));
        }
    }, [formData.residency_id]);

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.residency_id) {
            newErrors.residency_id = "Please select a residency";
        }

        if (!formData.resident_id) {
            newErrors.resident_id = "Please select a resident";
        }

        if (!formData.name.trim()) {
            newErrors.name = "Name is required";
        }

        if (!formData.email.trim()) {
            newErrors.email = "Email is required";
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) {
                newErrors.email = "Please enter a valid email address";
            }
        }

        if (!formData.phone.trim()) {
            newErrors.phone = "Phone number is required";
        }

        if (!formData.purpose.trim()) {
            newErrors.purpose = "Purpose of visit is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error("Please fill in all required fields");
            return;
        }

        createVisitMutation.mutate(formData as CreateVisitRequest);
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        // Clear error for this field when user starts typing
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: "" }));
        }
    };

    return (
        <AuthLayout
            title="Book Your Visit"
            description="Schedule your appointment with a resident"
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Residency Selection */}
                <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Select Residency <span className="text-red-500">*</span>
                    </label>
                    <SearchableSelect
                        value={formData.residency_id}
                        onChange={(value) => handleInputChange("residency_id", value || "")}
                        options={residencyOptions}
                        placeholder={
                            isLoadingResidencies ? "Loading residencies..." : "Select a residency"
                        }
                        isDisabled={isLoadingResidencies}
                        className="h-12"
                    />
                    {errors.residency_id && (
                        <p className="text-red-500 text-sm mt-1">{errors.residency_id}</p>
                    )}
                </div>

                {/* Resident Selection */}
                <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Select Resident <span className="text-red-500">*</span>
                    </label>
                    <SearchableSelect
                        value={formData.resident_id}
                        onChange={(value) => handleInputChange("resident_id", value || "")}
                        options={residentOptions}
                        placeholder={
                            !formData.residency_id
                                ? "Please select a residency first"
                                : isLoadingResidents
                                    ? "Loading residents..."
                                    : "Select a resident"
                        }
                        isDisabled={!formData.residency_id || isLoadingResidents}
                        className="h-12"
                    />
                    {errors.resident_id && (
                        <p className="text-red-500 text-sm mt-1">{errors.resident_id}</p>
                    )}
                </div>

                {/* Name Input */}
                <Input
                    type="text"
                    label="Your Name"
                    placeholder="John Doe"
                    icon={User2Icon}
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    error={errors.name}
                    className="h-12"
                    showAsterisk
                />

                {/* Email Input */}
                <Input
                    type="email"
                    label="Email Address"
                    placeholder="john.doe@example.com"
                    icon={Mail}
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    error={errors.email}
                    className="h-12"
                    showAsterisk
                />

                {/* Phone Input */}
                <Input
                    type="tel"
                    label="Phone Number"
                    placeholder="+1 234 567 8900"
                    icon={Phone}
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    error={errors.phone}
                    className="h-12"
                    showAsterisk
                />

                {/* Purpose Input */}
                <Input
                    type="text"
                    label="Purpose of Visit"
                    placeholder="e.g., Family visit, Delivery, Business meeting"
                    icon={MessageSquare}
                    value={formData.purpose}
                    onChange={(e) => handleInputChange("purpose", e.target.value)}
                    error={errors.purpose}
                    className="h-12"
                    showAsterisk
                />

                {/* Additional Information */}
                <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Additional Information
                    </label>
                    <textarea
                        placeholder="Any additional details about your visit..."
                        value={formData.additional_information}
                        onChange={(e) =>
                            handleInputChange("additional_information", e.target.value)
                        }
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-white/20 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-main dark:bg-transparent dark:text-white placeholder:text-gray-400"
                    />
                </div>

                {/* Submit Button */}
                <Button
                    type="submit"
                    className="w-full h-12 text-base font-semibold"
                    isLoading={createVisitMutation.isPending}
                    disabled={createVisitMutation.isPending}
                >
                    {createVisitMutation.isPending ? "Submitting..." : "Submit Visit Request"}
                </Button>

                {/* Help Text */}
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                    Your visit request will be sent to the resident for approval.
                    You will be notified via email once approved.
                </p>
            </form>
        </AuthLayout>
    );
}
