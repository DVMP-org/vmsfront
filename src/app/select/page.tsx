"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/app-store";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Sparkles,
  CheckCircle2,
  Home,
  ShieldCheck,
  Plus,
  KeyRound,
  ArrowRight,
  Building2,
  Briefcase,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import type { Residency } from "@/types";
import { cn } from "@/lib/utils";
import { useRequireEmailVerification } from "@/hooks/use-email-verification-guard";
import { useAuthStore } from "@/store/auth-store";
import { useResidentDashboardSelect } from "@/hooks/use-resident";
import { useAdminProfile } from "@/hooks/use-admin";

export default function SelectPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { setSelectedResidency } = useAppStore();
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

  useRequireEmailVerification(true);

  const { data: dashboardData, isLoading: isDashboardLoading } = useResidentDashboardSelect();
  const { data: adminProfile, isLoading: isAdminLoading, isError: isAdminError } = useAdminProfile();

  const residencies = useMemo<Residency[]>(() => dashboardData?.residencies ?? [], [dashboardData]);
  const isAdmin = useMemo(() => !!adminProfile && !isAdminError, [adminProfile, isAdminError]);
  const isLoading = isDashboardLoading || isAdminLoading;

  const residencySummary = useMemo(() => {
    if (!residencies.length) return "No residencies assigned yet";
    return `${residencies.length} ${residencies.length === 1 ? "Residency" : "Residencies"}`;
  }, [residencies]);

  const handleSelectResidency = (residency: Residency) => {
    const cardId = `residency-${residency.id}`;
    setSelectedCard(cardId);
    setSelectedResidency(residency);
    router.push(`/residency/${residency.id}`);
  };

  const handleSelectAdmin = () => {
    setSelectedCard("admin");
    setSelectedResidency(null);
    router.push("/admin");
  };

  const noDestinations = !isLoading && residencies.length === 0 && !isAdmin;

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
                Welcome back, {user?.first_name || 'Resident'}
              </h1>
              <p className="text-lg text-zinc-500 dark:text-zinc-400 font-medium">
                Select a workspace to manage your estate operations.
              </p>
            </div>
          </motion.div>

          {isLoading ? (
            <div className="space-y-6">
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-10">
              {/* Properties Section */}
              {residencies.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 px-1">
                    <div className="h-5 w-1 rounded-full bg-[rgb(var(--brand-primary,#213928))]" />
                    <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
                      Authorized Properties
                    </h2>
                    <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800/50 ml-2" />
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {residencies.map((residency, index) => {
                      const cardId = `residency-${residency.id}`;
                      return (
                        <motion.div
                          key={cardId}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, delay: index * 0.1 }}
                        >
                          <DashboardCard
                            icon={
                              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[rgb(var(--brand-primary,#213928))]/10 to-[rgb(var(--brand-primary,#213928))]/5 text-[rgb(var(--brand-primary,#213928))] shadow-inner border border-[rgb(var(--brand-primary,#213928))]/10">
                                <Home className="h-6 w-6" />
                              </div>
                            }
                            title={residency.name}
                            subtitle={residency.address}
                            selected={selectedCard === cardId}
                            onClick={() => handleSelectResidency(residency)}
                          />
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Management Section */}
              {isAdmin && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 px-1">
                    <div className="h-5 w-1 rounded-full bg-indigo-600" />
                    <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
                      Operations & Management
                    </h2>
                    <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800/50 ml-2" />
                  </div>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: residencies.length * 0.1 }}
                  >
                    <DashboardCard
                      icon={
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 text-indigo-600 shadow-inner border border-indigo-500/10">
                          <Shield className="h-6 w-6" />
                        </div>
                      }
                      title="Admin Console"
                      subtitle="Full access to estate operations and community analytics."
                      selected={selectedCard === "admin"}
                      onClick={handleSelectAdmin}
                    >
                      <div className="flex items-center gap-2 mt-2 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 w-fit">
                        <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
                        <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">
                          Administrator Access
                        </span>
                      </div>
                    </DashboardCard>
                  </motion.div>
                </div>
              )}
            </div>
          )}

          {noDestinations && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-xl text-center"
            >
              <EmptyState
                icon={KeyRound}
                title="No Access Found"
                description="Your account isn't associated with any properties or administrative roles currently."
              />
              <div className="mt-8 pt-8 border-t border-zinc-100 dark:border-zinc-800">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Think this is a mistake? Reach out to <span className="text-zinc-900 dark:text-zinc-100 font-semibold underline decoration-[rgb(var(--brand-primary,#213928))]/30">IT Support</span>
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      <footer className="py-8 text-center text-xs text-zinc-400 dark:text-zinc-600 relative z-10">
        <p>&copy; {new Date().getFullYear()} VMS Core. Enterprise Estate Management.</p>
      </footer>
    </div>
  );
}

interface DashboardCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  badge?: string;
  selected?: boolean;
  onClick: () => void;
  children?: React.ReactNode;
}

function DashboardCard({
  icon,
  title,
  subtitle,
  badge,
  selected = false,
  onClick,
  children,
}: DashboardCardProps) {
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


