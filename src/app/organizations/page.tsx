"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    Building2,
    Plus,
    Sparkles,
    CheckCircle2,
    ArrowRight,
    Users,
    Crown,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { useMyOrganizations, useSelectOrganization } from "@/hooks/use-organization";
import type { Organization, OrganizationMembership } from "@/types";

export default function OrganizationsPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [selectedCard, setSelectedCard] = useState<string | null>(null);

    const { data: organizations, isLoading } = useMyOrganizations();
    const { selectOrganization } = useSelectOrganization();

    const handleSelectOrganization = (organization: Organization) => {
        setSelectedCard(`org-${organization.slug}`);
        selectOrganization(organization);
    };

    const handleCreateOrganization = () => {
        router.push("/organizations/create");
    };

    const noOrganizations = !isLoading && (!organizations || organizations.length === 0);


    return (
        <div className="min-h-screen bg-slate-50 dark:bg-background relative overflow-hidden flex flex-col">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 -translate-y-1/2 w-[500px] h-[500px] bg-[rgb(var(--brand-primary,#213928))]/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -translate-x-1/2 w-[400px] h-[400px] bg-[rgb(var(--brand-primary,#213928))]/5 rounded-full blur-3xl pointer-events-none" />

            <Header type="select" />

            <main className="flex-1 relative z-10 flex flex-col items-center">
                <div className="w-full max-w-2xl mx-auto py-12 px-6 sm:py-20 lg:px-8 space-y-10">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center space-y-4"
                    >
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white dark:bg-zinc-900 shadow-xl border border-zinc-200/50 dark:border-zinc-800/50">
                            <Sparkles className="h-8 w-8 text-[rgb(var(--brand-primary,#213928))]" />
                        </div>
                        <div className="space-y-1">
                            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
                                Welcome, {user?.first_name || "User"}
                            </h1>
                            <p className="text-lg text-zinc-500 dark:text-zinc-400 font-medium">
                                Select an organization to continue
                            </p>
                        </div>
                    </motion.div>

                    {isLoading ? (
                        <div className="space-y-6">
                            <CardSkeleton />
                            <CardSkeleton />
                        </div>
                    ) : noOrganizations ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-xl text-center"
                        >
                            <EmptyState
                                icon={Building2}
                                title="No Organizations Yet"
                                description="You're not a member of any organizations. Create your first organization to get started."
                            />
                            <div className="mt-8">
                                <button
                                    onClick={handleCreateOrganization}
                                    className={cn(
                                        "inline-flex items-center gap-2 px-6 py-3 rounded-xl",
                                        "bg-[rgb(var(--brand-primary,#213928))] text-white",
                                        "font-semibold transition-all duration-300",
                                        "hover:shadow-lg hover:-translate-y-0.5",
                                        "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand-primary,#213928))]/50"
                                    )}
                                >
                                    <Plus className="h-5 w-5" />
                                    Create Your First Organization
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="space-y-6">
                            {/* Create Organization Button */}
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4 }}
                                className="flex justify-end"
                            >
                                <button
                                    onClick={handleCreateOrganization}
                                    className={cn(
                                        "inline-flex items-center gap-2 px-4 py-2 rounded-xl",
                                        "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800",
                                        "text-sm font-medium text-zinc-700 dark:text-zinc-300",
                                        "transition-all duration-300",
                                        "hover:shadow-md hover:border-[rgb(var(--brand-primary,#213928))]/30",
                                        "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand-primary,#213928))]/50"
                                    )}
                                >
                                    <Plus className="h-4 w-4" />
                                    New Organization
                                </button>
                            </motion.div>

                            {/* Organizations Section */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 px-1">
                                    <div className="h-5 w-1 rounded-full bg-[rgb(var(--brand-primary,#213928))]" />
                                    <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
                                        Your Organizations
                                    </h2>
                                    <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800/50 ml-2" />
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    {organizations?.map((organization, index) => {
                                        const cardId = `org-${organization.id}`;

                                        return (
                                            <motion.div
                                                key={cardId}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.4, delay: index * 0.1 }}
                                            >
                                                <OrganizationCard
                                                    icon={
                                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[rgb(var(--brand-primary,#213928))]/10 to-[rgb(var(--brand-primary,#213928))]/5 text-[rgb(var(--brand-primary,#213928))] shadow-inner border border-[rgb(var(--brand-primary,#213928))]/10">
                                                            <Building2 className="h-6 w-6" />
                                                        </div>
                                                    }
                                                    title={organization.name}
                                                    subtitle={organization.slug}
                                                    selected={selectedCard === cardId}
                                                    onClick={() => handleSelectOrganization(organization)}
                                                >

                                                </OrganizationCard>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <footer className="py-8 text-center text-xs text-zinc-400 dark:text-zinc-600 relative z-10">
                <p>&copy; {new Date().getFullYear()} VMS Core. Enterprise Estate Management.</p>
            </footer>
        </div>
    );
}

interface OrganizationCardProps {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    selected?: boolean;
    onClick: () => void;
    children?: React.ReactNode;
}

function OrganizationCard({
    icon,
    title,
    subtitle,
    selected = false,
    onClick,
    children,
}: OrganizationCardProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "w-full text-left group relative",
                "flex items-center justify-between rounded-3xl border p-5 sm:p-6",
                "transition-all duration-300 ease-out",
                "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm",
                "hover:shadow-xl hover:-translate-y-1 hover:border-[rgb(var(--brand-primary,#213928))]/30 dark:hover:border-[rgb(var(--brand-primary,#213928))]/20",
                selected && "ring-2 ring-[rgb(var(--brand-primary,#213928))] bg-[rgb(var(--brand-primary,#213928))]/5 border-[rgb(var(--brand-primary,#213928))]/50"
            )}
        >
            <div className="flex gap-5 items-center min-w-0">
                <div className="flex-shrink-0 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
                    {icon}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50 leading-tight truncate">
                            {title}
                        </p>
                    </div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-1 font-medium italic">
                        {subtitle}
                    </p>
                    {children}
                </div>
            </div>
            <div className="flex items-center gap-4 shrink-0">
                <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 dark:border-zinc-800 transition-all duration-300",
                    "group-hover:border-[rgb(var(--brand-primary,#213928))]/50 group-hover:bg-[rgb(var(--brand-primary,#213928))]/10",
                    selected ? "bg-[rgb(var(--brand-primary,#213928))] border-[rgb(var(--brand-primary,#213928))]" : "bg-zinc-50 dark:bg-zinc-800/50"
                )}>
                    {selected ? (
                        <CheckCircle2 className="h-5 w-5 text-white" />
                    ) : (
                        <ArrowRight className="h-5 w-5 text-zinc-300 group-hover:text-[rgb(var(--brand-primary,#213928))] transition-transform group-hover:translate-x-0.5" />
                    )}
                </div>
            </div>
        </button>
    );
}
