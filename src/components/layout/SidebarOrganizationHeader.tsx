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
                            className="h-10 w-10 rounded-xl object-cover ring-2 ring-zinc-200 transition-all group-hover:ring-zinc-300 dark:ring-zinc-700/50 dark:group-hover:ring-zinc-600"
                        />
                    ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted ring-2 ring-zinc-200 transition-all group-hover:ring-zinc-300 dark:bg-gradient-to-br dark:from-zinc-700 dark:to-zinc-800 dark:ring-zinc-700/50 dark:group-hover:ring-zinc-600">
                                <Building2 className="h-5 w-5 text-zinc-500 dark:text-zinc-300" />
                        </div>
                    )}
                    {/* Status dot */}
                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-background dark:ring-zinc-900" />
                </button>

                {/* Expand Button */}
                {onToggleCollapse && (
                    <button
                        onClick={onToggleCollapse}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-background/80 transition-colors hover:bg-muted dark:border-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                        aria-label="Expand sidebar"
                    >
                        <ChevronRight className="h-4 w-4 text-muted-foreground dark:text-zinc-400" />
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col border-b border-border/60 bg-background/95 backdrop-blur dark:border-zinc-800/60 dark:bg-zinc-900">
            {/* Main Header Row */}
            <div className="flex items-center gap-2 p-3">
                {/* Organization Button - takes most space */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={cn(
                        "flex-1 flex items-center gap-3 p-2 rounded-xl transition-all duration-200 min-w-0",
                        isExpanded
                            ? "bg-muted/80 dark:bg-zinc-800/80"
                            : "hover:bg-muted/70 dark:hover:bg-zinc-800/60"
                    )}
                >
                    {/* Logo */}
                    <div className="relative flex-shrink-0">
                        {organization?.logo_url ? (
                            <img
                                src={organization.logo_url}
                                alt={organization.name}
                                className="h-10 w-10 rounded-xl object-cover ring-2 ring-zinc-200 dark:ring-zinc-700/60"
                            />
                        ) : (
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted ring-2 ring-zinc-200 dark:bg-gradient-to-br dark:from-zinc-700 dark:to-zinc-800 dark:ring-zinc-700/60">
                                    <Building2 className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
                            </div>
                        )}
                        {/* Status dot */}
                        <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-background dark:ring-zinc-900" />
                    </div>

                    {/* Name and Details */}
                    <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center gap-1.5">
                            <h3 className="truncate text-sm font-semibold text-foreground dark:text-white">
                                {organization?.name || "Organization"}
                            </h3>
                            {shortId && (
                                <span className="hidden rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline dark:bg-zinc-800/80 dark:text-zinc-500">
                                    #{shortId}
                                </span>
                            )}
                        </div>
                        <p className="truncate text-xs text-muted-foreground dark:text-zinc-500">
                            {user?.email || "user@example.com"}
                        </p>
                    </div>

                    {/* Chevron */}
                    <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex-shrink-0"
                    >
                        <ChevronDown className="h-4 w-4 text-muted-foreground dark:text-zinc-500" />
                    </motion.div>
                </button>

                {/* Action Buttons */}
                <div className="flex items-center gap-1 flex-shrink-0">
                    {/* Collapse Button (Desktop) */}
                    {!isMobile && onToggleCollapse && (
                        <button
                            onClick={onToggleCollapse}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-background/80 transition-colors hover:bg-muted dark:border-zinc-800 dark:bg-zinc-800/60 dark:hover:bg-zinc-800"
                            aria-label="Collapse sidebar"
                        >
                            <ChevronLeft className="h-4 w-4 text-muted-foreground dark:text-zinc-400" />
                        </button>
                    )}

                    {/* Close Button (Mobile) */}
                    {isMobile && onMobileClose && (
                        <button
                            onClick={onMobileClose}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-background/80 transition-colors hover:bg-muted dark:border-zinc-800 dark:bg-zinc-800/60 dark:hover:bg-zinc-800"
                            aria-label="Close menu"
                        >
                            <X className="h-4 w-4 text-muted-foreground dark:text-zinc-400" />
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
                        className="overflow-hidden border-t border-border/60 dark:border-zinc-800/60"
                    >
                        {/* Current Organization */}
                        <div className="px-3 pt-3 pb-2">
                            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground dark:text-zinc-500">
                                Current
                            </p>
                            <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-[rgb(var(--brand-primary)/0.2)] px-2 py-2 dark:border-zinc-700/30 dark:bg-zinc-800/50">
                                {organization?.logo_url ? (
                                    <img
                                        src={organization.logo_url}
                                        alt={organization.name}
                                        className="h-7 w-7 rounded-lg object-cover"
                                    />
                                ) : (
                                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted dark:bg-zinc-700">
                                            <Building2 className="h-3.5 w-3.5 text-muted-foreground dark:text-zinc-400" />
                                    </div>
                                )}
                                <span className="flex-1 truncate text-sm font-medium text-foreground dark:text-white">
                                    {organization?.name}
                                </span>
                                <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                            </div>
                        </div>

                        {/* Other Organizations Section */}
                        {otherOrganizations.length > 0 && (
                            <div className="px-3 pb-2">
                                <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground dark:text-zinc-500">
                                    Switch to
                                </p>
                                <div className="space-y-0.5">
                                    {otherOrganizations.map((org) => (
                                        <button
                                            key={org.id}
                                            onClick={() => handleSwitchOrganization(org.slug)}
                                            className="group flex w-full items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/60 dark:hover:bg-zinc-800/60"
                                        >
                                            {org.logo_url ? (
                                                <img
                                                    src={org.logo_url}
                                                    alt={org.name}
                                                    className="h-7 w-7 rounded-lg object-cover opacity-80 transition-opacity group-hover:opacity-100"
                                                />
                                            ) : (
                                                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted transition-colors group-hover:bg-zinc-200 dark:bg-zinc-800 dark:group-hover:bg-zinc-700">
                                                        <Building2 className="h-3.5 w-3.5 text-muted-foreground dark:text-zinc-500" />
                                                </div>
                                            )}
                                            <span className="truncate text-sm text-muted-foreground transition-colors group-hover:text-foreground dark:text-zinc-400 dark:group-hover:text-zinc-200">
                                                {org.name}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Divider */}
                        <div className="mx-3 border-t border-border/60 dark:border-zinc-800/60" />

                        {/* Add Organization */}
                        <div className="p-3">
                            <button
                                onClick={handleAddOrganization}
                                className="group flex w-full items-center gap-3 rounded-lg border border-dashed border-border/70 px-2 py-2 transition-all hover:border-zinc-300 hover:bg-muted/40 dark:border-zinc-700/60 dark:hover:border-zinc-600 dark:hover:bg-zinc-800/40"
                            >
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted transition-colors group-hover:bg-zinc-200 dark:bg-zinc-800 dark:group-hover:bg-zinc-700">
                                    <Plus className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground dark:text-zinc-500 dark:group-hover:text-zinc-400" />
                                </div>
                                <span className="text-sm text-muted-foreground transition-colors group-hover:text-foreground dark:text-zinc-500 dark:group-hover:text-zinc-400">
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
