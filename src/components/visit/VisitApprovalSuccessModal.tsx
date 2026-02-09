"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Copy, Check, QrCode, ExternalLink, User, Shield } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ApproveVisitResponse } from "@/types";

interface VisitApprovalSuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    approvalData: ApproveVisitResponse | null;
    residencyId: string;
}

export function VisitApprovalSuccessModal({
    isOpen,
    onClose,
    approvalData,
    residencyId,
}: VisitApprovalSuccessModalProps) {
    const router = useRouter();
    const [copiedPassCode, setCopiedPassCode] = useState(false);
    const [copiedFullCode, setCopiedFullCode] = useState(false);

    if (!approvalData?.gate_pass || !approvalData?.visitor) return null;

    const { gate_pass, visitor } = approvalData;
    const fullPassCode = visitor.pass_code_suffix
        ? `${gate_pass.code}-${visitor.pass_code_suffix}`
        : gate_pass.code;

    const copyToClipboard = (text: string, type: "pass" | "full") => {
        navigator.clipboard.writeText(text);
        if (type === "pass") {
            setCopiedPassCode(true);
            toast.success("Pass code copied to clipboard");
            setTimeout(() => setCopiedPassCode(false), 2000);
        } else {
            setCopiedFullCode(true);
            toast.success("Full code copied to clipboard");
            setTimeout(() => setCopiedFullCode(false), 2000);
        }
    };

    const handleViewGatePass = () => {
        if (gate_pass.id) {
            router.push(`/residency/${residencyId}/passes/${gate_pass.id}`);
            onClose();
        }
    };

    const handleViewVisitor = () => {
        if (visitor.id) {
            router.push(`/residency/${residencyId}/visitors/${visitor.id}`);
            onClose();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Visit Approved Successfully!" size="lg">
            <div className="space-y-6">
                {/* Success Message */}
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center flex-shrink-0">
                            <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-green-900 dark:text-green-300 mb-1">
                                Gate Pass Created Successfully
                            </h3>
                            <p className="text-sm text-green-700 dark:text-green-400">
                                A gate pass has been generated for {visitor.name}. Share the access details below with your visitor.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Visitor Information */}
                <Card className="border-2">
                    <CardContent className="p-6">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                                <User className="w-6 h-6 text-primary" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-lg">{visitor.name}</h3>
                                <p className="text-sm text-muted-foreground">{visitor.email}</p>
                                {visitor.phone && (
                                    <p className="text-sm text-muted-foreground">{visitor.phone}</p>
                                )}
                            </div>
                        </div>

                        {/* Gate Pass Code */}
                        <div className="space-y-3 mt-6 pt-6 border-t">
                            <div className="flex items-center gap-2 mb-2">
                                <Shield className="w-4 h-4 text-primary" />
                                <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                    Access Credentials
                                </span>
                            </div>

                            {/* Pass Code */}
                            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-medium text-muted-foreground uppercase">
                                        Gate Pass Code
                                    </span>
                                    <button
                                        onClick={() => copyToClipboard(gate_pass.code, "pass")}
                                        className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded transition-colors"
                                    >
                                        {copiedPassCode ? (
                                            <Check className="w-4 h-4 text-green-500" />
                                        ) : (
                                            <Copy className="w-4 h-4 text-muted-foreground" />
                                        )}
                                    </button>
                                </div>
                                <p className="font-mono text-2xl font-bold tracking-tight">
                                    {gate_pass.code}
                                </p>
                            </div>

                            {/* Full Pass Code with Suffix */}
                            {visitor.pass_code_suffix && (
                                <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-medium text-muted-foreground uppercase">
                                            Full Visitor Code
                                        </span>
                                        <button
                                            onClick={() => copyToClipboard(fullPassCode, "full")}
                                            className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded transition-colors"
                                        >
                                            {copiedFullCode ? (
                                                <Check className="w-4 h-4 text-green-500" />
                                            ) : (
                                                <Copy className="w-4 h-4 text-muted-foreground" />
                                            )}
                                        </button>
                                    </div>
                                    <p className="font-mono text-2xl font-bold tracking-tight">
                                        {gate_pass.code}
                                        <span className="text-primary">-{visitor.pass_code_suffix}</span>
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* QR Code */}
                        {(gate_pass.qr_code_url || visitor.qr_code_url) && (
                            <div className="mt-6 pt-6 border-t">
                                <div className="flex items-center gap-2 mb-4">
                                    <QrCode className="w-4 h-4 text-primary" />
                                    <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                        QR Code
                                    </span>
                                </div>
                                <div className="flex justify-center p-4 bg-white dark:bg-zinc-900 rounded-lg border-2 border-zinc-200 dark:border-zinc-800">
                                    <Image
                                        src={visitor.qr_code_url || gate_pass.qr_code_url || ""}
                                        alt="Visitor QR Code"
                                        width={200}
                                        height={200}
                                        className="rounded-lg"
                                        unoptimized
                                    />
                                </div>
                                <p className="text-xs text-center text-muted-foreground mt-2">
                                    Visitor can scan this QR code at the gate for quick access
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button
                        variant="outline"
                        onClick={handleViewVisitor}
                        className="w-full h-11"
                    >
                        <User className="w-4 h-4 mr-2" />
                        View Visitor Details
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleViewGatePass}
                        className="w-full h-11"
                    >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Gate Pass
                    </Button>
                </div>

                {/* Close Button */}
                <Button onClick={onClose} className="w-full h-11 font-semibold">
                    Done
                </Button>

                {/* Share Instructions */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-4">
                    <p className="text-sm text-blue-900 dark:text-blue-300">
                        <strong>Next Steps:</strong> Share the pass code and QR code with your visitor.
                        They will need this to gain access at the gate.
                    </p>
                </div>
            </div>
        </Modal>
    );
}
