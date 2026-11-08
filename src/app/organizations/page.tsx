"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Plus,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
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
    <div className="flex min-h-screen flex-col bg-[var(--vms-canvas)] text-[var(--vms-ink)]">
      <Header type="select" />

      <main className="flex flex-1 flex-col items-center">
        <div className="mx-auto w-full max-w-3xl space-y-8 px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
          <header className="border-b border-[var(--vms-line)] pb-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--vms-ink-muted)]">
              Account / Organizations
            </p>
            <h1 className="mt-2 text-[28px] font-semibold leading-9 tracking-[-0.035em] sm:text-[32px]">
              Welcome, {user?.first_name || "User"}
            </h1>
            <p className="mt-1 text-sm leading-6 text-[var(--vms-ink-muted)]">
              Choose the organization whose administration or workspaces you
              need. Organization access does not create a property workspace.
            </p>
          </header>

                    {isLoading ? (
                        <div className="space-y-4">
                            <CardSkeleton />
                            <CardSkeleton />
                        </div>
                    ) : noOrganizations ? (
                        <div className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-6 text-center">
                            <EmptyState
                                icon={Building2}
                                title="No organizations yet"
                                description="Create the first organization to start setting up its properties and administration."
                            />
                            <div className="mt-8">
                                <Button
                                    onClick={handleCreateOrganization}
                                    size="lg"
                                >
                                    <Plus className="h-4 w-4" aria-hidden="true" />
                                    Create your first organization
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-base font-semibold">
                                        Your organizations
                                    </h2>
                                    <p className="mt-1 text-sm text-[var(--vms-ink-muted)]">
                                        {organizations?.length || 0} available
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={handleCreateOrganization}
                                >
                                    <Plus className="h-4 w-4" aria-hidden="true" />
                                    New organization
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                    {organizations?.map((organization, index) => {
                                        const cardId = `org-${organization.id}`;

                                        return (
                                            <div key={cardId}>
                                                <OrganizationCard
                                                    icon={
                                                        <div className="flex h-11 w-11 items-center justify-center rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] text-[var(--vms-action)]">
                                                            <Building2 className="h-6 w-6" />
                                                        </div>
                                                    }
                                                    title={organization.name}
                                                    subtitle={organization.slug}
                                                    selected={selectedCard === cardId}
                                                    onClick={() => handleSelectOrganization(organization)}
                                                >

                                                </OrganizationCard>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    )}
        </div>
      </main>

      <footer className="border-t border-[var(--vms-line)] px-4 py-6 text-center text-xs text-[var(--vms-ink-muted)]">
        &copy; {new Date().getFullYear()} VMSCore
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
                "group relative flex w-full items-center justify-between gap-4 rounded-[var(--vms-radius-surface)] border p-4 text-left transition-colors sm:p-5",
                "border-[var(--vms-line)] bg-[var(--vms-surface)] hover:border-[var(--vms-line-strong)] hover:bg-[var(--vms-surface-subtle)]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)] focus-visible:ring-offset-2",
                selected && "border-[var(--vms-focus)] bg-[var(--vms-surface-subtle)]"
            )}
        >
            <div className="flex min-w-0 items-center gap-4">
                <div className="shrink-0">
                    {icon}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <p className="truncate text-base font-semibold leading-6 text-[var(--vms-ink)]">
                            {title}
                        </p>
                    </div>
                    <p className="mt-1 truncate text-sm text-[var(--vms-ink-muted)]">
                        {subtitle}
                    </p>
                    {children}
                </div>
            </div>
            <div className="flex items-center gap-4 shrink-0">
                <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border border-[var(--vms-line)]",
                    selected ? "bg-[var(--vms-action)] text-[var(--vms-on-action)]" : "bg-[var(--vms-surface-subtle)] text-[var(--vms-ink-muted)]"
                )}>
                    {selected ? (
                        <CheckCircle2 className="h-5 w-5" />
                    ) : (
                        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                    )}
                </div>
            </div>
        </button>
    );
}
