"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/app-store";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Shield,
  Sparkles,
  CheckCircle2,
  Home,
  ShieldCheck,
  Plus,
  KeyRound,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import type { House } from "@/types";
import { cn } from "@/lib/utils";
import { useRequireResidentOnboarding } from "@/hooks/use-onboarding-guard";
import { useRequireEmailVerification } from "@/hooks/use-email-verification-guard";
import { useAuthStore } from "@/store/auth-store";
import { useResidentDashboardSelect } from "@/hooks/use-resident";
import { useAdminProfile } from "@/hooks/use-admin";

export default function SelectPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { setSelectedHouse } = useAppStore();
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

  useRequireEmailVerification(true);
  useRequireResidentOnboarding(true);

  const { data: dashboardData, isLoading: isDashboardLoading } = useResidentDashboardSelect();
  const { data: adminProfile, isLoading: isAdminLoading, isError: isAdminError } = useAdminProfile();

  const houses = useMemo<House[]>(() => dashboardData?.houses ?? [], [dashboardData]);
  const isAdmin = useMemo(() => !!adminProfile && !isAdminError, [adminProfile, isAdminError]);
  const isLoading = isDashboardLoading || isAdminLoading;

  const houseSummary = useMemo(() => {
    if (!houses.length) return "No houses assigned yet";
    return `${houses.length} ${houses.length === 1 ? "House" : "Houses"}`;
  }, [houses]);

  const handleSelectHouse = (house: House) => {
    const cardId = `house-${house.id}`;
    setSelectedCard(cardId);
    setSelectedHouse(house);
    router.push(`/house/${house.id}`);
  };

  const handleSelectAdmin = () => {
    setSelectedCard("admin");
    setSelectedHouse(null);
    router.push("/admin");
  };

  const noDestinations = !isLoading && houses.length === 0 && !isAdmin;

  return (
    <div className="min-h-screen bg-background dark:bg-gray-950">
      <Header type="select" />
      <div className="max-w-md mx-auto py-10 px-4 space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-primary,#213928)]/10">
            <Sparkles className="h-10 w-10 text-[var(--brand-primary,#213928)]" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[var(--brand-primary,#213928)]/60 dark:text-gray-400">
              {houseSummary}
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Welcome back
            </h1>
            <p className="text-sm text-muted-foreground">
              Choose a dashboard to continue.
            </p>
          </div>
        </div>

        {isDashboardLoading ? (
          <div className="space-y-4">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {houses.length > 0 && (
              <div className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
                  My Properties
                </p>
                <div className="space-y-3">
                  {houses.map((house) => {
                    const cardId = `house-${house.id}`;
                    return (
                      <DashboardCard
                        key={cardId}
                        icon={
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-primary,#213928)]/10 text-[var(--brand-primary,#213928)] ">
                            <Home className="h-5 w-5" />
                          </div>
                        }
                        title={house.name}
                        subtitle={house.address}
                        selected={selectedCard === cardId}
                        onClick={() => handleSelectHouse(house)}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
        {isAdminLoading ? (
          <div className="space-y-4">
            <CardSkeleton />
          </div>
        ) : (
          isAdmin && (
            <div className="space-y-3 border-t pt-8">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
                Management
              </p>
              <DashboardCard
                icon={
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-primary,#213928)]/10 text-[var(--brand-primary,#213928)] ">
                    <Shield className="h-5 w-5" />
                  </div>
                }
                title="Admin Console"
                subtitle="Manage estate operations, residents, and analytics."
                selected={selectedCard === "admin"}
                onClick={handleSelectAdmin}
              >
                <div className="flex items-center gap-1.5 text-[10px] font-medium text-[var(--brand-primary,#213928)] brightness-75 dark:text-gray-400 mt-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Authorized access</span>
                </div>
              </DashboardCard>
            </div>
          )
        )}
        {noDestinations && (
          <EmptyState
            icon={KeyRound}
            title="No Access"
            description="We couldn't find any assigned properties or admin roles for your account. Please contact management."
          />
        )}
      </div>

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
        "w-full text-left group",
        "flex items-center justify-between rounded-2xl border border-zinc-200 bg-white shadow-sm p-4",
        "transition-all duration-300",
        "hover:shadow-md hover:border-[var(--brand-primary,#213928)]/30",
        "dark:bg-zinc-900 dark:border-zinc-800",
        selected && "ring-2 ring-[var(--brand-primary,#213928)] bg-[var(--brand-primary,#213928)]/5 border-[var(--brand-primary,#213928)]/50"
      )}
    >
      <div className="flex gap-4 items-center">
        <div className="transition-transform duration-300 group-hover:scale-110">
          {icon}
        </div>
        <div>
          <p className="text-base font-bold text-gray-900 dark:text-gray-100 leading-tight">
            {title}
          </p>
          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{subtitle}</p>
          {children}
        </div>
      </div>
      <div className="flex flex-col items-end gap-2 shrink-0">
        <div className={cn(
          "flex h-6 w-6 items-center justify-center rounded-full border border-zinc-200 transition-colors",
          "group-hover:border-[var(--brand-primary,#213928)] group-hover:bg-[var(--brand-primary,#213928)]/10",
          selected && "bg-[var(--brand-primary,#213928)] border-[var(--brand-primary,#213928)]"
        )}>
          <CheckCircle2 className={cn(
            "h-3.5 w-3.5 transition-colors",
            selected ? "text-white" : "text-zinc-300 group-hover:text-[var(--brand-primary,#213928)]"
          )} />
        </div>
      </div>
    </button>
  );
}


