"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    QrCode,
    CheckCircle2,
    XCircle,
    Users,
    Zap,
    X,
    Maximize2,
    MapPin,
    Info,
    Share2,
    Copy,
    Check,
    MessageCircle,
    ExternalLink,
} from "lucide-react";
import { GatePass, BrandingTheme } from "@/types";
import { Loader } from "@/components/ui/loader";
import { format, formatDistanceToNow, isPast } from "date-fns";
import { generalService } from "@/services/general-service";
import { cn } from "@/lib/utils";
import { LogoFull } from "@/components/LogoFull";
import { applyBrandingTheme } from "@/lib/branding-utils";

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
    string,
    {
        label: string;
        description: string;
        banner: string;
        badge: string;
        dot: string;
        isValid: boolean;
    }
> = {
    active: {
        label: "Active",
        description: "This pass is authorised for gate entry",
        banner: "bg-emerald-600",
        badge: "bg-emerald-50 border-emerald-200 text-emerald-700",
        dot: "bg-emerald-500",
        isValid: true,
    },
    checked_in: {
        label: "Checked In",
        description: "Visitor has entered the premises",
        banner: "bg-blue-600",
        badge: "bg-blue-50 border-blue-200 text-blue-700",
        dot: "bg-blue-500",
        isValid: true,
    },
    checked_out: {
        label: "Checked Out",
        description: "Visitor has left the premises",
        banner: "bg-violet-600",
        badge: "bg-violet-50 border-violet-200 text-violet-700",
        dot: "bg-violet-500",
        isValid: false,
    },
    completed: {
        label: "Completed",
        description: "Visit has been completed",
        banner: "bg-slate-500",
        badge: "bg-slate-100 border-slate-300 text-slate-600",
        dot: "bg-slate-400",
        isValid: false,
    },
    expired: {
        label: "Expired",
        description: "This pass is no longer valid",
        banner: "bg-amber-600",
        badge: "bg-amber-50 border-amber-200 text-amber-700",
        dot: "bg-amber-500",
        isValid: false,
    },
    revoked: {
        label: "Revoked",
        description: "This pass has been revoked by the issuer",
        banner: "bg-red-600",
        badge: "bg-red-50 border-red-200 text-red-700",
        dot: "bg-red-500",
        isValid: false,
    },
    pending: {
        label: "Pending",
        description: "This pass is pending approval from the issuer",
        banner: "bg-yellow-600",
        badge: "bg-yellow-50 border-yellow-200 text-yellow-700",
        dot: "bg-yellow-500",
        isValid: false,
    }
};

function getStatusConfig(status: string) {
    return STATUS_CONFIG[status] ?? STATUS_CONFIG.expired;
}

// ─── Main page ────────────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export default function PublicGatePassPage() {
    const searchParams = useSearchParams();
    const code = searchParams?.get("code");

    const [gatePass, setGatePass] = useState<GatePass | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedQR, setExpandedQR] = useState(false);
    const [branding, setBranding] = useState<Partial<BrandingTheme> | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const fetchAll = async () => {
        // Fetch gate pass
            try {
                if (!code) {
                    setError("Invalid gate pass link. Missing pass code.");
                    setLoading(false);
                    return;
                }
                const response = await generalService.getPublicGatePass(code);
                if (response.success && response.data) {
                    setGatePass(response.data);
                } else {
                    setError(response.message || "Failed to load gate pass. Please check the link.");
                }
            } catch (err: any) {
                setError(err?.response?.data?.message || "Gate pass not found or has expired.");
            } finally {
                setLoading(false);
            }

            // Fetch active branding without X-Organization header (public global branding)
            try {
                const res = await fetch(`${API_URL}/admin/branding/theme/active`);
                if (res.ok) {
                    const json = await res.json();
                    const theme: Partial<BrandingTheme> = json?.data ?? json;
                    if (theme?.primary_color) {
                        setBranding(theme);
                        // Apply brand CSS vars (--brand-primary, --brand-secondary) globally
                        // so all rgb(var(--brand-primary)) Tailwind usages on this page react
                        applyBrandingTheme(theme as import("@/types").BrandingTheme);
                    }
                }
            } catch {
                // branding is non-critical — silently ignore
            }
        };
        fetchAll();
    }, [code]);

    // ── Share helpers ────────────────────────────────────────────────────────

    const shareUrl = typeof window !== "undefined" ? window.location.href : "";
    const shareTitle = gatePass
        ? `Gate Pass — ${gatePass.residency?.name ?? "Visitor Access"}`
        : "Gate Pass";
    const shareText = gatePass
        ? `Here is your visitor gate pass for ${gatePass.residency?.name ?? "the property"}. Code: ${gatePass.code}`
        : "Here is your visitor gate pass.";

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch { }
    };

    const handleNativeShare = async () => {
        try {
            if (typeof navigator !== "undefined" && navigator.share) {
                await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
            }
        } catch { }
    };

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`;

    const canNativeShare =
        typeof navigator !== "undefined" && typeof navigator.share === "function";

    // ── Loading ──────────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
                <Loader size={32} colour="brand-primary" className="animate-spin" />
                <p className="text-sm text-slate-500">Verifying pass…</p>
            </div>
        );
    }

    // ── Error ────────────────────────────────────────────────────────────────

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm max-w-sm w-full p-8 text-center space-y-4"
                >
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 border border-red-100">
                        <XCircle className="h-6 w-6 text-red-500" />
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-base font-bold text-slate-900">Pass Not Found</h1>
                        <p className="text-sm text-slate-500 leading-relaxed">{error}</p>
                    </div>
                    <p className="text-xs text-slate-400 border-t border-slate-100 pt-4">
                        Contact the pass issuer or resident for a new link.
                    </p>
                </motion.div>
            </div>
        );
    }

    if (!gatePass) return null;

    const status = getStatusConfig(gatePass.status);
    const usesRemaining = gatePass.max_uses != null ? gatePass.max_uses - gatePass.uses_count : null;
    const validToDate = gatePass.valid_to ? new Date(gatePass.valid_to) : null;
    const validFromDate = gatePass.valid_from ? new Date(gatePass.valid_from) : null;
    const isExpiredTime = validToDate ? isPast(validToDate) : false;

    // brandColor is used for inline style overrides where Tailwind classes alone
    // can't express the dynamic value (e.g. the status banner on valid passes).
    const brandColor = branding?.primary_color ?? null;

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col">

            {/* ── Status banner ─────────────────────────────────────────────── */}
            <div
                className={cn("w-full py-2.5 px-4 text-white text-center text-xs font-semibold tracking-wide flex items-center justify-center gap-2", !brandColor || !status.isValid ? status.banner : "")}
                style={brandColor && status.isValid ? { backgroundColor: brandColor } : undefined}
            >
                <span className="h-1.5 w-1.5 rounded-full bg-white/60 animate-pulse" />
                {status.description}
            </div>

            {/* ── Navbar ────────────────────────────────────────────────────── */}
            <header className="bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between shadow-sm">
                {/* Brand logo — org logo if available, else VMS Core logo */}
                <div className="flex items-center gap-2.5">
                    {branding?.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={branding.logo_url}
                            alt="Organization logo"
                            className="h-8 w-auto object-contain"
                        />
                    ) : (
                        <LogoFull width={100} height={26} className="text-foreground" />
                    )}
                    {gatePass.residency?.name && (
                        <div className="border-l border-slate-200 pl-2.5 ml-0.5">
                            <p className="text-xs font-bold text-slate-900 leading-none">
                                {gatePass.residency.name}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Visitor Access Pass</p>
                        </div>
                    )}
                </div>
                <div className={cn(
                    "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                    status.badge
                )}>
                    <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />
                    {status.label}
                </div>
            </header>

            {/* ── Main content ──────────────────────────────────────────────── */}
            <main className="flex-1 py-6 px-4 sm:px-6">
                <div className="max-w-2xl mx-auto space-y-4">

                    {/* ── Primary card ──────────────────────────────────────── */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35 }}
                        className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                    >
                        {/* Top accent */}
                        <div
                            className={cn("h-1 w-full", !brandColor || !status.isValid ? status.banner : "")}
                            style={brandColor ? { backgroundColor: brandColor } : undefined}
                        />

                        {/* QR + Pass Code split */}
                        <div className="flex flex-col sm:flex-row gap-0">
                            {/* QR column */}
                            <div className="flex flex-col items-center justify-center gap-3 px-8 py-8 sm:w-56 sm:flex-shrink-0 sm:border-r border-b sm:border-b-0 border-slate-100">
                                {gatePass.qr_code_url ? (
                                    <>
                                        <button
                                            onClick={() => setExpandedQR(true)}
                                            className="group relative cursor-zoom-in"
                                            aria-label="Expand QR code"
                                        >
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={gatePass.qr_code_url}
                                                alt="Gate pass QR code"
                                                width={160}
                                                height={160}
                                                className="block rounded-lg border border-slate-200 group-hover:scale-[1.02] transition-transform duration-200"
                                            />
                                            <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="bg-black/60 rounded p-1 backdrop-blur-sm">
                                                    <Maximize2 className="h-3 w-3 text-white" />
                                                </div>
                                            </div>
                                        </button>
                                        <p className="text-[10px] text-slate-400 flex items-center gap-1">
                                            <QrCode className="h-2.5 w-2.5" />
                                            Tap to enlarge
                                        </p>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="flex h-20 w-20 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50">
                                            <QrCode className="h-8 w-8 text-slate-300" />
                                        </div>
                                        <p className="text-[10px] text-slate-400">QR not available</p>
                                    </div>
                                )}
                            </div>

                            {/* Info column */}
                            <div className="flex-1 px-6 py-6 space-y-5">
                                {/* Pass code */}
                                <div>
                                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">
                                        Pass Code
                                    </p>
                                    <p className="font-mono text-2xl font-black tracking-[0.12em] text-slate-900">
                                        {gatePass.code}
                                    </p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">Manual entry if QR fails</p>
                                </div>

                                {/* Property */}
                                {gatePass.residency && (
                                    <div className="flex items-start gap-2">
                                        <MapPin className="h-3.5 w-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-0.5">Property</p>
                                            <p className="text-sm font-semibold text-slate-800">{gatePass.residency.name}</p>
                                            {gatePass.residency.address && (
                                                <p className="text-xs text-slate-500">{gatePass.residency.address}</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Validity window */}
                                {(validFromDate || validToDate) && (
                                    <div>
                                        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">Validity Window</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {validFromDate && (
                                                <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
                                                    <p className="text-[9px] text-slate-400 uppercase tracking-wider font-medium mb-0.5">From</p>
                                                    <p className="text-xs font-bold text-slate-700">{format(validFromDate, "MMM d, yyyy")}</p>
                                                    <p className="text-[10px] text-slate-500">{format(validFromDate, "HH:mm")}</p>
                                                </div>
                                            )}
                                            {validToDate && (
                                                <div className={cn(
                                                    "rounded-lg border px-3 py-2",
                                                    isExpiredTime
                                                        ? "bg-amber-50 border-amber-100"
                                                        : "bg-slate-50 border-slate-100"
                                                )}>
                                                    <p className="text-[9px] text-slate-400 uppercase tracking-wider font-medium mb-0.5">Until</p>
                                                    <p className={cn("text-xs font-bold", isExpiredTime ? "text-amber-700" : "text-slate-700")}>
                                                        {format(validToDate, "MMM d, yyyy")}
                                                    </p>
                                                    <p className="text-[10px] text-slate-500">
                                                        {isExpiredTime
                                                            ? "Expired"
                                                            : formatDistanceToNow(validToDate, { addSuffix: true })}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Entry uses bar */}
                        {gatePass.max_uses != null && (
                            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                                <div className="flex items-center justify-between mb-1.5">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 flex items-center gap-1.5">
                                        <Zap className="h-3 w-3" />
                                        Entry Uses
                                    </p>
                                    <p className="text-[10px] font-bold text-slate-600">
                                        {gatePass.uses_count} / {gatePass.max_uses} used
                                        {usesRemaining !== null && usesRemaining > 0 && (
                                            <span className="text-emerald-600 ml-1.5">· {usesRemaining} remaining</span>
                                        )}
                                        {usesRemaining === 0 && (
                                            <span className="text-amber-600 ml-1.5">· exhausted</span>
                                        )}
                                    </p>
                                </div>
                                <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                                    <div
                                        className={cn(
                                            "h-full rounded-full transition-all",
                                            usesRemaining === 0 ? "bg-amber-400" : "bg-[rgb(var(--brand-primary))]"
                                        )}
                                        style={{ width: `${Math.min(100, (gatePass.uses_count / gatePass.max_uses) * 100)}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </motion.div>

                    {/* ── Visitors card ─────────────────────────────────────── */}
                    {gatePass.visitors && gatePass.visitors.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.12, duration: 0.3 }}
                            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                        >
                            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
                                <Users className="h-3.5 w-3.5 text-slate-400" />
                                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Authorized Visitors
                                </p>
                                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 px-1.5">
                                    {gatePass.visitors.length}
                                </span>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {gatePass.visitors.map((visitor, i) => (
                                    <motion.div
                                        key={visitor.id}
                                        initial={{ opacity: 0, x: -8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.18 + i * 0.04 }}
                                        className="flex items-center gap-3 px-5 py-3.5"
                                    >
                                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[rgb(var(--brand-primary))]/10 text-[rgb(var(--brand-primary))] text-sm font-bold border border-[rgb(var(--brand-primary))]/15">
                                            {visitor.name?.charAt(0).toUpperCase() ?? "?"}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-slate-900 truncate">{visitor.name}</p>
                                            {visitor.email && (
                                                <p className="text-xs text-slate-400 truncate">{visitor.email}</p>
                                            )}
                                        </div>
                                        <div className="ml-auto flex-shrink-0">
                                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                                Authorized
                                            </span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* ── Social share card ─────────────────────────────────── */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.16, duration: 0.3 }}
                        className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                    >
                        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
                            <Share2 className="h-3.5 w-3.5 text-slate-400" />
                            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Share This Pass
                            </p>
                        </div>
                        <div className="px-5 py-4 flex flex-wrap gap-2.5">
                            {/* WhatsApp */}
                            <a
                                href={whatsappUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-colors"
                            >
                                <MessageCircle className="h-3.5 w-3.5 text-[#25d366]" />
                                WhatsApp
                            </a>

                            {/* Copy link */}
                            <button
                                onClick={handleCopyLink}
                                className={cn(
                                    "flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition-colors",
                                    copied
                                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                        : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:border-slate-300"
                                )}
                            >
                                {copied ? (
                                    <><Check className="h-3.5 w-3.5" /> Copied!</>
                                ) : (
                                    <><Copy className="h-3.5 w-3.5" /> Copy Link</>
                                )}
                            </button>

                            {/* Native share — only shown on devices that support it */}
                            {canNativeShare && (
                                <button
                                    onClick={handleNativeShare}
                                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-colors"
                                >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    More options
                                </button>
                            )}
                        </div>
                        <p className="px-5 pb-3.5 text-[10px] text-slate-400">
                            Share this link only with the authorized visitor.
                        </p>
                    </motion.div>

                    {/* ── Instructions card ─────────────────────────────────── */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.3 }}
                        className={cn(
                            "rounded-2xl border px-5 py-4 flex items-start gap-3",
                            status.isValid
                                ? "bg-emerald-50 border-emerald-200"
                                : "bg-slate-50 border-slate-200"
                        )}
                    >
                        {status.isValid ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                        ) : (
                            <Info className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="space-y-0.5">
                            <p className={cn("text-sm font-semibold", status.isValid ? "text-emerald-900" : "text-slate-700")}>
                                {status.isValid
                                    ? "Present this pass at the gate entry point"
                                    : "This pass is no longer valid for entry"}
                            </p>
                            <p className={cn("text-xs leading-relaxed", status.isValid ? "text-emerald-700" : "text-slate-500")}>
                                {status.isValid
                                    ? "Show this page or request a QR code scan from authorized security personnel."
                                    : "Contact the resident or property manager to request a new pass."}
                            </p>
                        </div>
                    </motion.div>

                    {/* ── Footer ────────────────────────────────────────────── */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-center space-y-3 py-4"
                    >
                        {/* Powered by */}
                        <div className="flex items-center justify-center gap-1.5">
                            <span className="text-[10px] text-slate-400">Powered by</span>
                            <LogoFull width={64} height={16} className="text-slate-400 opacity-70" />
                        </div>
                        <p className="text-[10px] font-mono text-slate-400">
                            Pass ID: {gatePass.id}
                        </p>
                        <p className="text-[10px] text-slate-400">
                            Do not share this link with unauthorized persons
                        </p>
                    </motion.div>
                </div>
            </main>

            {/* ── Expanded QR modal ─────────────────────────────────────────── */}
            <AnimatePresence>
                {expandedQR && gatePass.qr_code_url && (
                    <>
                        <motion.div
                            key="backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setExpandedQR(false)}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                        />
                        <motion.div
                            key="modal"
                            initial={{ opacity: 0, scale: 0.94, y: 12 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.94, y: 12 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-4 flex items-center justify-center z-50 pointer-events-none"
                        >
                            <div className="pointer-events-auto w-full max-w-xs rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
                                {/* Modal header */}
                                <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
                                    <div>
                                        {branding?.logo_url ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={branding.logo_url} alt="Logo" className="h-6 w-auto object-contain" />
                                        ) : (
                                            <LogoFull width={80} height={20} className="text-foreground" />
                                        )}
                                        <p className="text-[10px] text-slate-400 mt-0.5">Present to gate security</p>
                                    </div>
                                    <button
                                        onClick={() => setExpandedQR(false)}
                                        className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
                                    >
                                        <X className="h-3.5 w-3.5 text-slate-500" />
                                    </button>
                                </div>
                                {/* QR image — plain img tag avoids next/image hostname restriction */}
                                <div className="flex justify-center p-6">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={gatePass.qr_code_url}
                                        alt="Gate pass QR code expanded"
                                        width={280}
                                        height={280}
                                        className="block rounded-xl border border-slate-200"
                                    />
                                </div>
                                {/* Modal footer */}
                                <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50 text-center">
                                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                                        Pass Code
                                    </p>
                                    <p className="font-mono text-base font-black tracking-[0.12em] text-slate-900 mt-0.5">
                                        {gatePass.code}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}


