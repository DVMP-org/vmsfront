"use client";

import { useMemo } from "react";
import { useMyOrganizations } from "@/hooks/use-organization";
import { useCurrentOrganization } from "@/hooks/use-organization";
import { Building2, Home, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "../ui/Button";
import { Header } from "../layout/Header";
import Link from "next/link";
import { getApiErrorStatus } from "@/lib/error-utils";
interface OrganizationMemberGuardProps {
  children: React.ReactNode;
}

export function OrganizationMemberGuard({
  children,
}: OrganizationMemberGuardProps) {
  // Fetch current organization from subdomain
  const {
    data: currentOrg,
    isLoading: orgLoading,
    error: currentOrganizationError,
    refetch: refetchCurrentOrganization,
  } = useCurrentOrganization();

  // Fetch user's organizations
  const {
    data: userOrganizations,
    isLoading: orgsLoading,
    error: userOrganizationsError,
    refetch: refetchUserOrganizations,
  } = useMyOrganizations();

  // Check if user is a member of the current organization
  const isMember = useMemo(() => {
    if (!currentOrg || !userOrganizations) return false;

    return userOrganizations.some((org) => org.id === currentOrg.id);
  }, [currentOrg, userOrganizations]);

  // Determine if organization exists
  const orgExists = useMemo(() => {
    return !!currentOrg;
  }, [currentOrg]);

  // Check if loading
  const isLoading = orgLoading || orgsLoading;

  const currentOrganizationStatus = getApiErrorStatus(currentOrganizationError);
  const isMissingOrganization = currentOrganizationStatus === 404;
  const isMembershipDenied =
    currentOrganizationStatus === 403 || (!!currentOrg && !isMember);
  const verificationFailed =
    !isMissingOrganization &&
    !isMembershipDenied &&
    (!!currentOrganizationError || !!userOrganizationsError);

  // Check authorization: both org must exist AND user must be a member
  const hasAccess = orgExists && isMember;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-background flex flex-col">
        <Header type="select" />
        <div className="flex flex-1 items-center justify-center px-4 py-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-[rgb(var(--brand-primary,#213928))]" />
            <p className="text-sm font-medium text-muted-foreground">
              Verifying organization access...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (verificationFailed) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-background relative overflow-hidden flex flex-col">
        <Header type="select" />
        <div className="flex flex-1 items-center justify-center px-4 py-8">
          <div className="flex max-w-md flex-col items-center justify-center text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
              <RefreshCw className="h-10 w-10" />
            </div>
            <h1 className="mb-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Unable to verify access
            </h1>
            <p className="mb-8 text-muted-foreground">
              We could not confirm your organization access. Your session or the
              API connection may be unavailable.
            </p>
            <Button
              onClick={() => {
                void refetchCurrentOrganization();
                void refetchUserOrganizations();
              }}
              className="w-full sm:w-auto"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-background relative overflow-hidden flex flex-col">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 -translate-y-1/2 w-[500px] h-[500px] bg-[rgb(var(--brand-primary,#213928))]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -translate-x-1/2 w-[400px] h-[400px] bg-[rgb(var(--brand-primary,#213928))]/5 rounded-full blur-3xl pointer-events-none" />

        <Header type="select" />

        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="flex flex-col items-center justify-center text-center max-w-md">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <Building2 className="h-10 w-10" />
            </div>
            <h1 className="mb-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Access Denied
            </h1>
            <p className="mb-8 text-muted-foreground">
              {isMissingOrganization
                ? "The organization you're trying to access does not exist."
                : "You are not a member of this organization. Please contact an administrator to request access."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <Button variant="outline" asChild className="flex-1">
                <Link href="/organizations">
                  <Home className="mr-2 h-4 w-4" />
                  View My Organizations
                </Link>
              </Button>
              <Button onClick={() => window.history.back()} className="flex-1">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
