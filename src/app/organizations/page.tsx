"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Plus,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";
import { resolvePostAuthDestination } from "@/lib/post-auth-routing";
import { useAuthStore } from "@/store/auth-store";
import { useProfile } from "@/hooks/use-auth";
import { useMyOrganizations, useSelectOrganization } from "@/hooks/use-organization";
import type { Organization, OrganizationMembership } from "@/types";

export default function OrganizationsPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const profile = useProfile();
    const authUser = profile.data ?? user;
    const [selectedCard, setSelectedCard] = useState<string | null>(null);

    const { data: organizations, isLoading } = useMyOrganizations();
    const { selectOrganization } = useSelectOrganization();

    // A single-organization account has nothing to choose between. Opening the
    // workspace directly avoids a dead-end chooser after login and keeps the
    // post-auth destination logic in one place.
    const singleOrganization =
        !isLoading && organizations?.length === 1 ? organizations[0] : null;

    useEffect(() => {
        if (!singleOrganization) return;
        const destination = resolvePostAuthDestination([singleOrganization]);

        // A relative destination is handled by the router; only the tenant
        // subdomain handoff needs a full navigation.
        if (destination.startsWith("/")) return;

        const target = new URL(destination, window.location.origin);
        if (target.origin === window.location.origin) {
            router.replace(`${target.pathname}${target.search}`);
            return;
        }

        // If the tenant host rejects this session it bounces straight back
        // here. Handing off again each time would reload this page forever, so
        // allow one handoff per destination inside a short window and otherwise
        // stay put and let the user pick an organization.
        const key = "vms:tenant-handoff";
        const lastHandoff = Number(window.sessionStorage.getItem(key) ?? 0);
        if (Date.now() - lastHandoff < 10_000) return;

        window.sessionStorage.setItem(key, String(Date.now()));
        window.location.replace(destination);
    }, [singleOrganization, router]);

    const handleSelectOrganization = (organization: Organization) => {
        setSelectedCard(`org-${organization.slug}`);
        selectOrganization(organization);
    };

    const handleCreateOrganization = () => {
        router.push("/organizations/create");
    };

    const noOrganizations = !isLoading && (!organizations || organizations.length === 0);
    const displayName =
        authUser?.first_name ||
        authUser?.email?.split("@")[0] ||
        "";


  return (
    <div className="flex min-h-screen flex-col bg-[var(--vms-canvas)] text-[var(--vms-ink)]">
      <Header type="select" />

      <main className="flex flex-1 flex-col items-center">
        <div className="mx-auto w-full max-w-3xl space-y-8 px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
                  <header className="flex flex-col gap-4 border-b border-[var(--vms-line)] pb-6 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--vms-ink-muted)]">
                              Account / Organizations
                          </p>
                          <h1 className="mt-2 text-[28px] font-semibold leading-9 tracking-[-0.035em] sm:text-[32px]">
                              {singleOrganization
                                  ? `Opening ${singleOrganization.name}`
                                  : displayName
                                      ? `Welcome, ${displayName}`
                                      : "Choose an organization"}
                          </h1>
                          <p className="mt-1 text-sm leading-6 text-[var(--vms-ink-muted)]">
                              {singleOrganization
                                  ? "Taking you into your organization workspace."
                                  : "Choose the organization whose administration or workspaces you need. Organization access does not create a property workspace."}
                          </p>
                      </div>
                      {authUser ? (
                          <div className="flex min-h-11 shrink-0 items-center gap-3 rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] bg-[var(--vms-surface)] px-2.5 py-2">
                              <Avatar
                                  name={displayName || authUser.email}
                                  src={authUser.avatar_url}
                                  size="md"
                                  tone="coral"
                              />
                              <span className="hidden min-w-0 text-left sm:block">
                                  <span className="block max-w-40 truncate text-sm font-semibold text-[var(--vms-ink)]">
                                      {displayName || "Your profile"}
                                  </span>
                                  <span className="block max-w-40 truncate text-xs text-[var(--vms-ink-muted)]">
                                      {authUser.email}
                                  </span>
                              </span>
                          </div>
                      ) : (
                          <span
                              aria-hidden="true"
                              className="h-11 w-11 shrink-0 animate-pulse rounded-full border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)]"
                          />
                      )}
          </header>

                  {isLoading || singleOrganization ? (
                      <div role="status" className="space-y-4">
                          <span className="sr-only">
                              {singleOrganization
                                  ? `Opening ${singleOrganization.name}`
                                  : "Loading organizations"}
                          </span>
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
