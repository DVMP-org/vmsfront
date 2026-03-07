"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    QrCode,
    CheckCircle2,
    AlertCircle,
    Calendar,
    Lock,
    Users,
    Clock,
    Home,
    User,
    Zap,
    X,
    Maximize2,
} from "lucide-react";
import { adminService } from "@/services/admin-service";
import { GatePass } from "@/types";
import { Loader } from "@/components/ui/loader";
import { formatDistanceToNow, format } from "date-fns";
import Image from "next/image";
import { generalService } from "@/services/general-service";

export default function PublicGatePassPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const code = searchParams?.get("code");

    const [gatePass, setGatePass] = useState<GatePass | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedQR, setExpandedQR] = useState(false);

    useEffect(() => {
        const fetchGatePass = async () => {
            try {
                if (!code) {
                    setError("Invalid gate pass link. Missing pass ID or code.");
                    setLoading(false);
                    return;
                }

                const response = await generalService.getPublicGatePass(code);

                if (response.success && response.data) {
                    setGatePass(response.data);
                    setError(null);
                } else {
                    setError(response.message || "Failed to load gate pass. Please check the link.");
                }
            } catch (err: any) {
                const errorMsg = err?.response?.data?.message || "Gate pass not found or has expired.";
                setError(errorMsg);
            } finally {
                setLoading(false);
            }
        };

        fetchGatePass();
    }, [code]);


    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-transparent">
                <div className="text-center space-y-3">
                    <div className="flex justify-center">
                        <Loader size={40} colour="brand-primary" className="animate-spin" />
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">Loading gate pass...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-transparent p-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-md w-full space-y-4"
                >
                    <div className="text-center space-y-3">
                        <div className="inline-flex">
                            <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-md p-4">
                                <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
                                Gate Pass Not Found
                            </h1>
                            <p className="text-slate-600 dark:text-slate-400 text-sm">{error}</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    const statusColor = gatePass?.status === "active"
        ? "bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20 text-green-700 dark:text-green-400"
        : gatePass?.status === "expired"
            ? "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400"
            : "bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/20 text-yellow-700 dark:text-yellow-400";

    return (
        <div className="min-h-screen bg-transparent py-8 px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-3xl mx-auto"
            >
                <div className="bg-card overflow-hidden rounded-md">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-[rgb(var(--brand-primary,#213928))] to-[rgb(var(--brand-primary,#213928))]/90 px-6 py-6 text-white border-b border-[rgb(var(--brand-primary,#213928))]/20 rounded-t-md">
                        <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="space-y-0.5">
                                <h1 className="text-2xl font-bold">Guest Pass</h1>
                                <p className="text-white/70 text-xs">Entry authorization document</p>
                            </div>
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.3 }}
                                className={`flex items-center gap-1.5 px-3 py-1 rounded-md border text-xs font-medium ${statusColor}`}
                            >
                                <div
                                    className={`w-1.5 h-1.5 rounded-full ${gatePass?.status === "active" ? "bg-green-400"
                                        : gatePass?.status === "expired" ? "bg-red-400"
                                            : "bg-yellow-400"
                                        }`}
                                />
                                {gatePass?.status === "active"
                                    ? "Active"
                                    : gatePass?.status === "expired"
                                        ? "Expired"
                                        : "Inactive"}
                            </motion.div>
                        </div>

                        {/* Pass Code */}
                        <div className="space-y-1 pt-1 border-t border-white/10">
                            <p className="text-white/70 text-xs uppercase tracking-widest font-medium">Pass Code</p>
                            <p className="text-2xl font-mono font-bold tracking-wider">{gatePass?.code}</p>
                        </div>
                    </div>

                    {/* QR Code Section */}
                    {gatePass?.qr_code_url && (
                        <div className="px-6 py-6 flex flex-col items-center border-b border-slate-200 dark:border-slate-800">
                            <p className="text-slate-600 dark:text-slate-400 text-xs mb-4 font-medium uppercase tracking-wide">
                                Scan QR Code at Gate Entry
                            </p>
                            <motion.button
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                onClick={() => setExpandedQR(true)}
                                className="relative hover:opacity-80 transition-opacity cursor-pointer group"
                            >
                                <div className="bg-white dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-700 rounded-sm relative">
                                    <Image
                                        src={gatePass.qr_code_url}
                                        alt="Gate pass QR code"
                                        width={180}
                                        height={180}
                                        className=""
                                        priority
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 flex items-center justify-center transition-colors">
                                        <Maximize2 className="w-6 h-6 text-slate-900 dark:text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </div>
                            </motion.button>
                            <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">Click to expand</p>
                        </div>
                    )}

                    {/* Details Section */}
                    <div className="px-6 py-6 space-y-6">
                        {/* Guest Information */}
                        {gatePass?.visitors && gatePass.visitors.length > 0 && (
                            <div className="space-y-3 pb-5 border-b border-slate-200 dark:border-slate-800">
                                <h2 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                    <Users className="w-4 h-4 text-[rgb(var(--brand-primary,#213928))]" />
                                    Authorized Visitors
                                </h2>
                                <div className="space-y-2">
                                    {gatePass.visitors.map((visitor) => (
                                        <motion.div
                                            key={visitor.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-sm"
                                        >
                                            <div className="w-10 h-10 bg-[rgb(var(--brand-primary,#213928))]/10 flex items-center justify-center flex-shrink-0 border border-[rgb(var(--brand-primary,#213928))]/20 rounded-md">
                                                <User className="w-5 h-5 text-[rgb(var(--brand-primary,#213928))]" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-slate-900 dark:text-white text-sm">
                                                    {visitor.name}
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{visitor.email}</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Details Grid */}
                        <div className="space-y-1">
                            <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-3 pb-2 border-b border-slate-200 dark:border-slate-800">
                                Pass Details
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {gatePass?.residency && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                        className="flex gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-sm"
                                    >
                                        <Home className="w-4 h-4 text-[rgb(var(--brand-primary,#213928))] flex-shrink-0 mt-0.5" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-0.5 font-medium">
                                                Property
                                            </p>
                                            <p className="font-medium text-slate-900 dark:text-white text-sm truncate">
                                                {gatePass.residency.name}
                                            </p>
                                        </div>
                                    </motion.div>
                                )}

                                {gatePass?.valid_from && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                        className="flex gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-sm"
                                    >
                                        <Calendar className="w-4 h-4 text-[rgb(var(--brand-primary,#213928))] flex-shrink-0 mt-0.5" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-0.5 font-medium">
                                                Valid From
                                            </p>
                                            <p className="font-medium text-slate-900 dark:text-white text-sm">
                                                {format(new Date(gatePass.valid_from), "MMM d, HH:mm")}
                                            </p>
                                        </div>
                                    </motion.div>
                                )}

                                {gatePass?.valid_to && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.4 }}
                                        className="flex gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-sm"
                                    >
                                        <Clock className="w-4 h-4 text-[rgb(var(--brand-primary,#213928))] flex-shrink-0 mt-0.5" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-0.5 font-medium">
                                                Valid Until
                                            </p>
                                            <p className="font-medium text-slate-900 dark:text-white text-sm">
                                                {format(new Date(gatePass.valid_to), "MMM d, HH:mm")}
                                            </p>
                                        </div>
                                    </motion.div>
                                )}

                                {gatePass?.max_uses && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.5 }}
                                        className="flex gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-sm"
                                    >
                                        <Zap className="w-4 h-4 text-[rgb(var(--brand-primary,#213928))] flex-shrink-0 mt-0.5" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-0.5 font-medium">
                                                Entry Uses
                                            </p>
                                            <p className="font-medium text-slate-900 dark:text-white text-sm">
                                                {gatePass.uses_count} of {gatePass.max_uses}
                                            </p>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </div>

                        {/* Info Banner */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-900 dark:text-blue-200 rounded-sm"
                        >
                            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <div className="text-xs space-y-1">
                                <p className="font-medium">
                                    Present this pass at the gate entry point
                                </p>
                                <p className="text-blue-800 dark:text-blue-300">
                                    Show this page or the QR code to authorized personnel
                                </p>
                            </div>
                        </motion.div>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-slate-200 dark:border-slate-800 px-6 py-3 bg-slate-50 dark:bg-slate-800/50 text-center text-xs text-slate-500 dark:text-slate-400 space-y-1 rounded-b-md">
                        <p>
                            Pass ID: <span className="font-mono text-slate-700 dark:text-slate-300 text-xs">{gatePass?.id}</span>
                        </p>
                        <p>Do not share this link with unauthorized persons</p>
                    </div>
                </div>
            </motion.div>

            {/* Expanded QR Modal */}
            <AnimatePresence>
                {expandedQR && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setExpandedQR(false)}
                            className="fixed inset-0 bg-black/50 z-40"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="fixed inset-4 flex items-center justify-center z-50"
                        >
                            <div className="bg-card p-6 max-w-sm w-full rounded-md">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Gate Pass QR Code</h2>
                                    <button
                                        onClick={() => setExpandedQR(false)}
                                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                                    </button>
                                </div>
                                <div className="flex justify-center">
                                    <Image
                                        src={gatePass?.qr_code_url!}
                                        alt="Gate pass QR code expanded"
                                        width={300}
                                        height={300}
                                        className=""
                                        priority
                                    />
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 text-center">
                                    Pass Code: <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{gatePass?.code}</span>
                                </p>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

