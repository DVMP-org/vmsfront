"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronLeft, ChevronRight, Plus, Building2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentOrganization, useMyOrganizations } from "@/hooks/use-organization";
import { useAuthStore } from "@/store/auth-store";
import { buildSubdomainUrl } from "@/lib/subdomain-utils";
import { Button } from "@/components/ui/Button";

interface SidebarOrganizationHeaderProps {
    collapsed?: boolean;
    onToggleCollapse?: () => void;
    onMobileClose?: () => void;
    isMobile?: boolean;
}

export function SidebarOrganizationHeader({
    collapsed = false,
    onToggleCollapse,
    onMobileClose,
    isMobile = false
}: SidebarOrganizationHeaderProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const router = useRouter();
    const { organization } = useCurrentOrganization();
    const { data: myOrganizations, isLoading: orgsLoading } = useMyOrganizations();
    const user = useAuthStore((state) => state.user);

    // Filter out current organization from list
    const otherOrganizations = myOrganizations?.filter(
        (org) => org.slug !== organization?.slug
    ) || [];

    const handleSwitchOrganization = (slug: string) => {
        const url = buildSubdomainUrl(slug, "/admin");
        window.location.href = url;
    };

    const handleAddOrganization = () => {
        router.push("/organizations/new");
    };

    // Generate a short ID from organization id
    const shortId = organization?.id?.slice(0, 6).toUpperCase() || "";
    const hasMultipleOrgs = otherOrganizations.length > 0;

    if (collapsed) {
        return (
            <div className="relative flex flex-col items-center py-4 px-2">
                {/* Logo */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="relative group mb-3"
                >
                    {organization?.logo_url ? (
                        <img
                            src={organization.logo_url}
                            alt={organization.name}
                            className="h-10 w-10 rounded-xl object-cover ring-2 ring-zinc-700/50 group-hover:ring-zinc-600 transition-all"
                        />
                    ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-zinc-700 to-zinc-800 ring-2 ring-zinc-700/50 group-hover:ring-zinc-600 transition-all">
                            <Building2 className="h-5 w-5 text-zinc-300" />
                        </div>
                    )}
                    {/* Status dot */}
                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-zinc-900" />
                </button>

                {/* Expand Button */}
                {onToggleCollapse && (
                    <button
                        onClick={onToggleCollapse}
                        className="flex items-center justify-center h-8 w-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
                        aria-label="Expand sidebar"
                    >
                        <ChevronRight className="h-4 w-4 text-zinc-400" />
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col bg-zinc-900">
            {/* Main Header Row */}
            <div className="flex items-center gap-2 p-3">
                {/* Organization Button - takes most space */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={cn(
                        "flex-1 flex items-center gap-3 p-2 rounded-xl transition-all duration-200 min-w-0",
                        isExpanded
                            ? "bg-zinc-800/80"
                            : "hover:bg-zinc-800/60"
                    )}
                >
                    {/* Logo */}
                    <div className="relative flex-shrink-0">
                        {organization?.logo_url ? (
                            <img
                                src={organization.logo_url}
                                alt={organization.name}
                                className="h-10 w-10 rounded-xl object-cover ring-2 ring-zinc-700/60"
                            />
                        ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-zinc-700 to-zinc-800 ring-2 ring-zinc-700/60">
                                <Building2 className="h-5 w-5 text-zinc-400" />
                            </div>
                        )}
                        {/* Status dot */}
                        <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-zinc-900" />
                    </div>

                    {/* Name and Details */}
                    <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center gap-1.5">
                            <h3 className="text-sm font-semibold text-white truncate">
                                {organization?.name || "Organization"}
                            </h3>
                            {shortId && (
                                <span className="text-[10px] font-mono text-zinc-500 bg-zinc-800/80 px-1.5 py-0.5 rounded hidden sm:inline">
                                    #{shortId}
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-zinc-500 truncate">
                            {user?.email || "user@example.com"}
                        </p>
                    </div>

                    {/* Chevron */}
                    <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex-shrink-0"
                    >
                        <ChevronDown className="h-4 w-4 text-zinc-500" />
                    </motion.div>
                </button>

                {/* Action Buttons */}
                <div className="flex items-center gap-1 flex-shrink-0">
                    {/* Collapse Button (Desktop) */}
                    {!isMobile && onToggleCollapse && (
                        <button
                            onClick={onToggleCollapse}
                            className="flex items-center justify-center h-9 w-9 rounded-lg bg-zinc-800/60 hover:bg-zinc-800 transition-colors"
                            aria-label="Collapse sidebar"
                        >
                            <ChevronLeft className="h-4 w-4 text-zinc-400" />
                        </button>
                    )}

                    {/* Close Button (Mobile) */}
                    {isMobile && onMobileClose && (
                        <button
                            onClick={onMobileClose}
                            className="flex items-center justify-center h-9 w-9 rounded-lg bg-zinc-800/60 hover:bg-zinc-800 transition-colors"
                            aria-label="Close menu"
                        >
                            <X className="h-4 w-4 text-zinc-400" />
                        </button>
                    )}
                </div>
            </div>

            {/* Dropdown Content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="overflow-hidden border-t border-zinc-800/60"
                    >
                        {/* Current Organization */}
                        <div className="px-3 pt-3 pb-2">
                            <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider px-2 mb-2">
                                Current
                            </p>
                            <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700/30">
                                {organization?.logo_url ? (
                                    <img
                                        src={organization.logo_url}
                                        alt={organization.name}
                                        className="h-7 w-7 rounded-lg object-cover"
                                    />
                                ) : (
                                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-700">
                                        <Building2 className="h-3.5 w-3.5 text-zinc-400" />
                                    </div>
                                )}
                                <span className="text-sm text-white font-medium truncate flex-1">
                                    {organization?.name}
                                </span>
                                <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                            </div>
                        </div>

                        {/* Other Organizations Section */}
                        {otherOrganizations.length > 0 && (
                            <div className="px-3 pb-2">
                                <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider px-2 mb-2">
                                    Switch to
                                </p>
                                <div className="space-y-0.5">
                                    {otherOrganizations.map((org) => (
                                        <button
                                            key={org.id}
                                            onClick={() => handleSwitchOrganization(org.slug)}
                                            className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-zinc-800/60 transition-colors group"
                                        >
                                            {org.logo_url ? (
                                                <img
                                                    src={org.logo_url}
                                                    alt={org.name}
                                                    className="h-7 w-7 rounded-lg object-cover opacity-70 group-hover:opacity-100 transition-opacity"
                                                />
                                            ) : (
                                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-800 group-hover:bg-zinc-700 transition-colors">
                                                    <Building2 className="h-3.5 w-3.5 text-zinc-500" />
                                                </div>
                                            )}
                                            <span className="text-sm text-zinc-400 group-hover:text-zinc-200 truncate transition-colors">
                                                {org.name}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Divider */}
                        <div className="mx-3 border-t border-zinc-800/60" />

                        {/* Add Organization */}
                        <div className="p-3">
                            <button
                                onClick={handleAddOrganization}
                                className="w-full flex items-center gap-3 px-2 py-2 rounded-lg border border-dashed border-zinc-700/60 hover:border-zinc-600 hover:bg-zinc-800/40 transition-all group"
                            >
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-800 group-hover:bg-zinc-700 transition-colors">
                                    <Plus className="h-3.5 w-3.5 text-zinc-500 group-hover:text-zinc-400" />
                                </div>
                                <span className="text-sm text-zinc-500 group-hover:text-zinc-400 transition-colors">
                                    Add organization
                                </span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
