"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/hooks/use-auth";
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
import type { DashboardSelect, House } from "@/types";
import { cn } from "@/lib/utils";
import { useRequireResidentOnboarding } from "@/hooks/use-onboarding-guard";
import { useAuthStore } from "@/store/auth-store";

function determineIsAdmin(admin?: DashboardSelect["admin"] | null): boolean {
  if (!admin) return false;
  return Object.keys(admin).length > 0;
}

export default function SelectPage() {
  const router = useRouter();
  const { user } = useAuthStore()
  const { data, isLoading, isFetching } = useProfile();
  const { setSelectedHouse } = useAppStore();
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  useRequireResidentOnboarding(true);

  const houses = useMemo<House[]>(() => data?.houses ?? [], [data]);
  const isAdmin = useMemo(() => determineIsAdmin(data?.admin), [data]);
  const loading = isLoading || isFetching || !data;

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

  const noDestinations = !loading && houses.length === 0 && !isAdmin;

  return (
    <div className="min-h-screen bg-background dark:bg-gray-950">
      <Header />
      <div className="max-w-md mx-auto py-10 px-4 space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-primary,theme(colors.blue.500))]/10">
            <Sparkles className="h-6 w-6 text-[var(--brand-primary,theme(colors.blue.500))]" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {houseSummary}
            </p>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              Select your dashboard
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Tap a space to continue. Everything adapts to your brand colors.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : (
            <div className="space-y-8">
            {houses.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    My Houses
                  </p>
                  <div className="space-y-4">
                    {houses.map((house) => {
                      const cardId = `house-${house.id}`;
                      return (
                        <DashboardCard
                          key={cardId}
                          icon={
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl text-[var(--brand-primary,theme(colors.blue.500))] ">
                              <Home className="h-5 w-5" />
                            </div>
                        }
                          title={house.name}
                          subtitle={house.address}
                          badge="Resident"
                          selected={selectedCard === cardId}
                          onClick={() => handleSelectHouse(house)}
                        />
                      );
                    })}
                </div>
              </div>

            )}

              <AddNewCard onClick={() => router.push("resident/onboard/new/house")} />

            {isAdmin && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Admin Dashboard
                  </p>
                  <DashboardCard
                    icon={
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl text-[var(--brand-primary,theme(colors.blue.500))] ">
                        <Shield className="h-5 w-5" />
                      </div>
                  }
                    title="Admin Console"
                    subtitle="Manage houses, residents, passes, and analytics."
                    badge="Full access"
                    selected={selectedCard === "admin"}
                  onClick={handleSelectAdmin}
                >
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <ShieldCheck className="h-4 w-4" />
                      <span>Role detected</span>
                    </div>
                  </DashboardCard>
              </div>
            )}



              {noDestinations && (
                <EmptyState
                  icon={KeyRound}
                  title="No dashboard options available yet"
                  description="We don't see any house memberships or admin roles assigned yet. Please contact your estate administrator for access."
                />
            )}
          </div>
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
        "w-full text-left",
        "flex items-center justify-between rounded-2xl border border-gray-200 bg-white shadow-sm p-4",
        "transition-all duration-200",
        "dark:bg-[color:var(--brand-primary,#0f172a)] dark:border-[color:var(--brand-primary,#0f172a)]/30",
        selected &&
        "border-2 bg-[var(--brand-primary,theme(colors.blue.500))]/5"
      )}
    >
      <div className="flex items-center gap-4">
        {icon}
        <div>
          <p className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {subtitle}
          </p>
          {children && <div className="mt-2">{children}</div>}
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        {badge && (
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            {badge}
          </span>
        )}
        {selected && (
          <CheckCircle2 className="h-5 w-5" />
        )}
      </div>
    </button>
  );
}

function AddNewCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl border-2 border-dashed border-gray-300 text-gray-400 py-3 px-4 justify-center transition-all duration-200"
    >
      <Plus className="h-5 w-5" />
      <span className="text-sm font-medium">Add a new house</span>
    </button>
  );
}
