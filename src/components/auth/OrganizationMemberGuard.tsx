"use client";

import { useMemo } from "react";
import { useMyOrganizations } from "@/hooks/use-organization";
import { useCurrentOrganization } from "@/hooks/use-organization";
import { Building2, Home, ArrowLeft, RefreshCw } from "lucide-react";
import {
  PageSkeleton,
  StandalonePageSkeleton,
} from "@/components/ui/Skeleton";
import { Button } from "../ui/Button";
import Link from "next/link";
import { getApiErrorStatus } from "@/lib/error-utils";
interface OrganizationMemberGuardProps {
  children: React.ReactNode;
  /**
   * Routes that render their own chrome (lobby, plans, place workspace) need a
   * full-page skeleton; routes inside a shell need only the content area.
   */
  standalone?: boolean;
}

export function OrganizationMemberGuard({
  children,
  standalone = false,
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
    return standalone ? (
      <StandalonePageSkeleton label="Loading organization" />
    ) : (
      <PageSkeleton label="Loading organization" />
    );
  }

  if (verificationFailed) {
    return (
      <div className="flex min-h-[60vh] flex-col bg-[var(--vms-canvas)]">
        <div className="flex flex-1 items-center justify-center px-4 py-8">
          <div className="flex max-w-md flex-col items-center justify-center text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-[var(--vms-radius-surface)] bg-[var(--vms-warning-subtle)] text-[var(--vms-warning)]">
              <RefreshCw className="h-10 w-10" />
            </div>
            <h1 className="mb-2 text-2xl font-semibold tracking-tight text-[var(--vms-ink)] sm:text-3xl">
              Unable to verify access
            </h1>
            <p className="mb-8 text-[var(--vms-ink-muted)]">
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
      <div className="flex min-h-[60vh] flex-col bg-[var(--vms-canvas)]">
        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="flex flex-col items-center justify-center text-center max-w-md">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-[var(--vms-radius-surface)] bg-[var(--vms-danger-subtle)] text-[var(--vms-danger)]">
              <Building2 className="h-10 w-10" />
            </div>
            <h1 className="mb-2 text-2xl font-semibold tracking-tight text-[var(--vms-ink)] sm:text-3xl">
              Access Denied
            </h1>
            <p className="mb-8 text-[var(--vms-ink-muted)]">
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
