"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { VisitApprovalSuccessModal } from "@/components/visit/VisitApprovalSuccessModal";
import {
    ArrowLeft,
    CheckCircle,
    XCircle,
    User,
    Mail,
    Phone,
    Calendar,
    MessageSquare,
    FileText,
    Clock,
    Loader2,
    Shield,
    Timer,
    Hash,
} from "lucide-react";
import { toast } from "sonner";
import { visitService } from "@/services/visit-service";
import { ApproveVisitResponse, CreateGatePassData } from "@/types";
import { formatDateTime } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import { useProfile } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { useResident, useResidentApproveVisitRequest, useResidentDeclineVisitRequest, useResidentVisitRequest } from "@/hooks/use-resident";

export default function VisitRequestDetailPage() {
    const router = useRouter();
    const params = useParams<{ residencyId?: string; visitRequestId?: string }>();
    const queryClient = useQueryClient();
    const { selectedResidency, setSelectedResidency } = useAppStore();
    const { data: profile } = useProfile();


    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [approvalData, setApprovalData] = useState<ApproveVisitResponse | null>(null);
    const [showDeclineConfirm, setShowDeclineConfirm] = useState(false);
    const [showApprovalForm, setShowApprovalForm] = useState(false);
    const [declineReason, setDeclineReason] = useState("");
    const [showCustomDates, setShowCustomDates] = useState(false);
    const [selectedDuration, setSelectedDuration] = useState<string | null>("30m");

    const approveRequestMutation = useResidentApproveVisitRequest();
    const declineRequestMutation = useResidentDeclineVisitRequest()

    // Gate pass form data
    const [gatePassData, setGatePassData] = useState<CreateGatePassData>({
        max_uses: 1, // Default 1 use
        valid_from: null,
        valid_to: null,
    });

    const rawResidencyId = params?.residencyId;
    const residencyId = Array.isArray(rawResidencyId) ? rawResidencyId[0] : rawResidencyId;
    const rawVisitRequestId = params?.visitRequestId;
    const visitRequestId = Array.isArray(rawVisitRequestId) ? rawVisitRequestId[0] : rawVisitRequestId;

    const durations = [
        { label: "30m", value: "30m", minutes: 30 },
        { label: "1h", value: "1h", minutes: 60 },
        { label: "4h", value: "4h", minutes: 240 },
        { label: "12h", value: "12h", minutes: 720 },
        { label: "1d", value: "1d", minutes: 1440 },
        { label: "3d", value: "3d", minutes: 4320 },
    ];

    const formatDateTimeLocal = (date: Date) => {
        const tzOffset = date.getTimezoneOffset() * 60000;
        const localISOTime = new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
        return localISOTime;
    };

    const handleDurationSelect = (duration: { label: string; value: string; minutes: number } | null) => {
        if (!duration) {
            setSelectedDuration(null);
            setShowCustomDates(true);
            return;
        }

        setSelectedDuration(duration.value);
        setShowCustomDates(false);

        const now = new Date();
        const end = new Date(now.getTime() + duration.minutes * 60000);

        setGatePassData(prev => ({
            ...prev,
            valid_from: formatDateTimeLocal(now),
            valid_to: formatDateTimeLocal(end),
        }));
    };

    useEffect(() => {
        if (!residencyId || !profile?.residencies) return;
        if (selectedResidency?.id === residencyId) return;
        const match = profile.residencies.find((residency) => residency.id === residencyId);
        if (match) {
            setSelectedResidency(match);
        }
    }, [residencyId, profile?.residencies, selectedResidency?.id, setSelectedResidency]);

    // Initialize default duration on mount
    useEffect(() => {
        const defaultDuration = durations[0]; // 30m
        handleDurationSelect(defaultDuration);
    }, []);

    // Fetch visit request details
    const {
        data: visitRequest,
        isLoading,
        error,
    } = useResidentVisitRequest(visitRequestId);

    const [isDeclined, setIsDeclined] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const [isApproved, setIsApproved] = useState(false);

    useEffect(() => {
        if (visitRequest?.status == "declined") {
            setIsDeclined(true);
        }
        if (visitRequest?.status == "pending") {
            setIsPending(true);
        }
        if (visitRequest?.status == "approved") {
            setIsApproved(true);
        }
    }, [visitRequest]);
    const handleShowApprovalForm = () => {
        setShowApprovalForm(true);
    };

    const handleApprove = () => {
        if (!visitRequestId) return;

        // Validate form
        if (gatePassData.max_uses && gatePassData.max_uses < 1) {
            toast.error("Maximum uses must be at least 1");
            return;
        }

        if (gatePassData.valid_from && gatePassData.valid_to) {
            const from = new Date(gatePassData.valid_from);
            const to = new Date(gatePassData.valid_to);
            if (to <= from) {
                toast.error("Valid to date must be after valid from date");
                return;
            }
        }

        approveRequestMutation.mutate(
            { visitRequestId, data: gatePassData },
            {
                onSuccess: (response) => {
                    setApprovalData(response.data);
                    setShowSuccessModal(true);
                    setShowApprovalForm(false);
                    setIsApproved(true);
                    setIsPending(false);
                    setIsDeclined(false);
                    queryClient.invalidateQueries({ queryKey: ["visitRequest", visitRequestId] });
                },
            }
        );
    };

    const handleDecline = () => {
        if (!visitRequestId) return;
        declineRequestMutation.mutate(
            { visitRequestId, reason: declineReason },
            {
                onSuccess: () => {
                    setShowDeclineConfirm(false);
                    setDeclineReason("");
                    setIsDeclined(true);
                    setIsPending(false);
                    setIsApproved(false);
                    queryClient.invalidateQueries({ queryKey: ["visitRequest", visitRequestId] });
                },
            }
        );
    };

    if (!residencyId || !visitRequestId) {
        return (
            <EmptyState
                title="Invalid Request"
                description="Missing residency or visit request ID"
                icon={XCircle}
            />
        );
    }

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-64" />
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-20" />
                        <Skeleton className="h-20" />
                        <Skeleton className="h-20" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error || !visitRequest) {
        return (
            <EmptyState
                title="Visit Request Not Found"
                description="The visit request you're looking for doesn't exist or you don't have permission to view it."
                icon={XCircle}
                action={{
                    label: "Go Back",
                    onClick: () => router.back(),
                }}
            />
        );
    }



    return (
        <>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/residency/${residencyId}/visitors`)}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Visitors
                    </Button>
                </div>

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">Visit Request Details</h1>
                        <p className="text-muted-foreground mt-1">
                            Review and manage visitor request
                        </p>
                    </div>
                    <div>
                        {isPending && (
                            <Badge variant="outline" className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200">
                                <Clock className="w-3 h-3 mr-1" />
                                Pending Approval
                            </Badge>
                        )}
                        {isApproved && (
                            <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Approved
                            </Badge>
                        )}
                        {isDeclined && (
                            <Badge variant="outline" className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200">
                                <XCircle className="w-3 h-3 mr-1" />
                                Declined
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Visit Request Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Visitor Information</CardTitle>
                        <CardDescription>Details about the visitor and their request</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Visitor Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-[rgb(var(--brand-primary)/10 )]rounded-full flex items-center justify-center flex-shrink-0">
                                    <User className="w-5 h-5 text-[rgb(var(--brand-primary))]" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                                        Visitor Name
                                    </p>
                                    <p className="text-base font-semibold">{visitRequest.name}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-[rgb(var(--brand-primary)/10 )]rounded-full flex items-center justify-center flex-shrink-0">
                                    <Mail className="w-5 h-5 text-[rgb(var(--brand-primary))]" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                                        Email Address
                                    </p>
                                    <p className="text-base">{visitRequest.email}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-[rgb(var(--brand-primary)/10 )]rounded-full flex items-center justify-center flex-shrink-0">
                                    <Phone className="w-5 h-5 text-[rgb(var(--brand-primary))]" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                                        Phone Number
                                    </p>
                                    <p className="text-base">{visitRequest.phone}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-[rgb(var(--brand-primary)/10 )]rounded-full flex items-center justify-center flex-shrink-0">
                                    <Calendar className="w-5 h-5 text-[rgb(var(--brand-primary))]" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                                        Request Date
                                    </p>
                                    <p className="text-base">{formatDateTime(visitRequest.created_at)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Purpose */}
                        <div className="pt-6 border-t">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-[rgb(var(--brand-primary)/10 )]rounded-full flex items-center justify-center flex-shrink-0">
                                    <MessageSquare className="w-5 h-5 text-[rgb(var(--brand-primary))]" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                                        Purpose of Visit
                                    </p>
                                    <p className="text-base">{visitRequest.purpose}</p>
                                </div>
                            </div>
                        </div>

                        {/* Additional Information */}
                        {visitRequest.additional_information && (
                            <div className="pt-6 border-t">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-[rgb(var(--brand-primary)/10 )]rounded-full flex items-center justify-center flex-shrink-0">
                                        <FileText className="w-5 h-5 text-[rgb(var(--brand-primary))]" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                                            Additional Information
                                        </p>
                                        <p className="text-base whitespace-pre-wrap">
                                            {visitRequest.additional_information}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Approval Form */}
                {isPending && showApprovalForm && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Card className="border-[rgb(var(--brand-primary))]">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="w-5 h-5" />
                                    Configure Gate Pass
                                </CardTitle>
                                <CardDescription>
                                    Set the access details for this visitor&apos;s gate pass
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Duration Presets */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Pass Duration</Label>
                                    <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
                                        {durations.map((d) => (
                                            <button
                                                key={d.value}
                                                type="button"
                                                onClick={() => handleDurationSelect(d)}
                                                className={`py-2 px-3 text-sm font-medium rounded-md border transition-all ${selectedDuration === d.value
                                                    ? "bg-[rgb(var(--brand-primary))] text-white border-[rgb(var(--brand-primary))] shadow-sm"
                                                    : "bg-card text-zinc-600 dark:text-white border-muted hover:border-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                                                    }`}
                                            >
                                                {d.label}
                                            </button>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => handleDurationSelect(null)}
                                            className={`py-2 px-3 text-sm font-medium rounded-md border transition-all ${showCustomDates
                                                ? "bg-[rgb(var(--brand-primary))] text-white border-[rgb(var(--brand-primary))] shadow-sm"
                                                : "bg-card/50 text-zinc-600 dark:text-white border-muted hover:border-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                                                }`}
                                        >
                                            Custom
                                        </button>
                                    </div>
                                </div>

                                {/* Custom Date/Time Inputs */}
                                {showCustomDates && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t animate-in fade-in slide-in-from-top-1 duration-200">
                                        <div className="space-y-2">
                                            <Label htmlFor="valid_from" className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4" />
                                                Valid From
                                            </Label>
                                            <Input
                                                id="valid_from"
                                                type="datetime-local"
                                                value={gatePassData.valid_from || ""}
                                                onChange={(e) => setGatePassData(prev => ({
                                                    ...prev,
                                                    valid_from: e.target.value || null
                                                }))}
                                                className="h-10"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="valid_to" className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4" />
                                                Valid Until
                                            </Label>
                                            <Input
                                                id="valid_to"
                                                type="datetime-local"
                                                value={gatePassData.valid_to || ""}
                                                onChange={(e) => setGatePassData(prev => ({
                                                    ...prev,
                                                    valid_to: e.target.value || null
                                                }))}
                                                className="h-10"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Max Uses */}
                                <div className="space-y-2">
                                    <Label htmlFor="max_uses" className="flex items-center gap-2">
                                        <Hash className="w-4 h-4" />
                                        Maximum Uses
                                    </Label>
                                    <Input
                                        id="max_uses"
                                        type="number"
                                        min="1"
                                        value={gatePassData.max_uses || ""}
                                        onChange={(e) => setGatePassData(prev => ({
                                            ...prev,
                                            max_uses: parseInt(e.target.value) || 1
                                        }))}
                                        placeholder="1"
                                        className="h-10 max-w-xs"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Number of times the pass can be used
                                    </p>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3 pt-4 border-t">
                                    <Button
                                        onClick={handleApprove}
                                        className="flex-1"
                                        isLoading={approveRequestMutation.isPending}
                                        disabled={approveRequestMutation.isPending}
                                    >
                                        {approveRequestMutation.isPending ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Creating Gate Pass...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                Approve & Create Pass
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowApprovalForm(false)}
                                        disabled={approveRequestMutation.isPending}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* Action Buttons - Show when pending and form not shown */}
                {isPending && !showApprovalForm && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col sm:flex-row gap-4"
                    >
                        <Card className="flex-1 border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center flex-shrink-0">
                                        <CheckCircle className="w-6 h-6 " />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold mb-1">
                                            Approve Visit
                                        </h3>
                                        <p className="text-sm mb-3">
                                            Create a gate pass for this visitor
                                        </p>
                                        <Button
                                            onClick={handleShowApprovalForm}

                                        >
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            Approve Request
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="flex-1 border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center flex-shrink-0">
                                        <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-red-900 dark:text-red-300 mb-1">
                                            Decline Visit
                                        </h3>
                                        <p className="text-sm text-red-700 dark:text-red-400 mb-3">
                                            Reject this visit request
                                        </p>
                                        {!showDeclineConfirm ? (
                                            <Button
                                                onClick={() => setShowDeclineConfirm(true)}
                                                variant="outline"
                                                className="border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20"
                                            >
                                                <XCircle className="w-4 h-4 mr-2" />
                                                Decline Request
                                            </Button>
                                        ) : (
                                            <div className="space-y-3">
                                                <p className="text-xs font-semibold text-red-800 dark:text-red-300">
                                                    Are you sure you want to decline?
                                                </p>
                                                <textarea
                                                    placeholder="Optional: Reason for declining..."
                                                    value={declineReason}
                                                    onChange={(e) => setDeclineReason(e.target.value)}
                                                    rows={2}
                                                    className="w-full px-3 py-2 border border-red-200 dark:border-red-800 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-red-900/10"
                                                />
                                                <div className="flex gap-2">
                                                    <Button
                                                        onClick={handleDecline}
                                                        size="sm"
                                                        variant="destructive"
                                                        isLoading={declineRequestMutation.isPending}
                                                        disabled={declineRequestMutation.isPending}
                                                    >
                                                        Confirm Decline
                                                    </Button>
                                                    <Button
                                                        onClick={() => {
                                                            setShowDeclineConfirm(false);
                                                            setDeclineReason("");
                                                        }}
                                                        size="sm"
                                                        variant="outline"
                                                        disabled={declineRequestMutation.isPending}
                                                    >
                                                        Cancel
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* Status Message for Approved */}
                {isApproved && (
                    <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center">
                                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <p className="font-semibold text-green-900 dark:text-green-300">
                                        Visit Request Approved
                                    </p>
                                    <p className="text-sm text-green-700 dark:text-green-400">
                                        A gate pass has been created for this visitor
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Status Message for Declined */}
                {isDeclined && (
                    <Card className="border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10">
                        <CardContent className="p-6">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center flex-shrink-0">
                                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-red-900 dark:text-red-300 mb-1">
                                        Visit Request Declined
                                    </p>
                                    <p className="text-sm text-red-700 dark:text-red-400">
                                        This visit request has been declined and the visitor has been notified.
                                    </p>
                                    <p className="text-sm italic bg-muted">{visitRequest?.decline_reason} </p>
                                    {visitRequest.updated_at && (
                                        <p className="text-xs text-red-600 dark:text-red-500 mt-2">
                                            Declined on {formatDateTime(visitRequest.updated_at)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Success Modal */}
            <VisitApprovalSuccessModal
                isOpen={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                approvalData={approvalData}
                residencyId={residencyId}
            />
        </>
    );
}
