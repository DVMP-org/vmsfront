"use client";

import { useState, useEffect, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { organizationService } from "@/services/organization-service";
import { useAppStore } from "@/store/app-store";
import { buildSubdomainUrl, getSubdomain } from "@/lib/subdomain-utils";
import {
  Organization,
  OrganizationMembership,
  CreateOrganizationRequest,
} from "@/types";
import { toast } from "sonner";
import { parseApiError } from "@/lib/error-utils";

/**
 * Hook to fetch all organizations the current user belongs to
 */
export function useMyOrganizations() {
  return useQuery({
    queryKey: ["organizations", "me"],
    queryFn: async () => {
      const response = await organizationService.getMyOrganizations();
      return response.data;
    },
  });
}

/**
 * Hook to fetch a specific organization by slug
 */
export function useOrganization(slug: string | null) {
  return useQuery({
    queryKey: ["organization", slug],
    queryFn: async () => {
      if (!slug) throw new Error("No slug provided");
      const response = await organizationService.getOrganization(slug);
      return response.data;
    },
    enabled: !!slug,
  });
}

/**
 * Hook to get the current organization from subdomain
 */
export function useCurrentOrganization() {
  const subdomain = getSubdomain();
  const { organization, setSelectedOrganization } = useAppStore();

  const query = useOrganization(subdomain);

  // Update app store when org data is fetched
  useEffect(() => {
    if (query.data && (!organization || organization.slug !== query.data.slug)) {
      setSelectedOrganization(query.data);
    }
  }, [query.data, organization, setSelectedOrganization]);

  return {
    ...query,
    currentSlug: subdomain,
    organization: query.data || organization,
  };
}

/**
 * Hook to create a new organization
 */
export function useCreateOrganization() {
  const queryClient = useQueryClient();
  const { setSelectedOrganization } = useAppStore();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: (data: CreateOrganizationRequest) =>
      organizationService.createOrganization(data),
    onMutate: () => {
      setError(null);
      setFieldErrors({});
    },
    onSuccess: (response) => {
      const org = response.data;
      setSelectedOrganization(org);
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      toast.success("Organization created successfully!");

      // Redirect to the new organization's subdomain
      const redirectUrl = buildSubdomainUrl(org.slug, "/select");
      window.location.href = redirectUrl;
    },
    onError: (err: any) => {
      const parsedError = parseApiError(err);
      setError(parsedError.message);
      setFieldErrors(parsedError.fieldErrors);
      toast.error(parsedError.message);
    },
  });

  return {
    createOrganization: mutation.mutate,
    createOrganizationAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error,
    fieldErrors,
    reset: () => {
      setError(null);
      setFieldErrors({});
      mutation.reset();
    },
  };
}

/**
 * Hook to check if a slug is available
 */
export function useCheckSlugAvailability() {
  const [isChecking, setIsChecking] = useState(false);

  const checkSlug = useCallback(async (slug: string): Promise<boolean> => {
    if (!slug || slug.length < 2) return false;
    
    setIsChecking(true);
    try {
      const response = await organizationService.checkSlugAvailability(slug);
      return response.data.available;
    } catch {
      return false;
    } finally {
      setIsChecking(false);
    }
  }, []);

  return { checkSlug, isChecking };
}

/**
 * Hook to handle organization selection and redirect
 */
export function useSelectOrganization() {
  const { setSelectedOrganization } = useAppStore();

  const selectOrganization = (organization: Organization): void => {
    setSelectedOrganization(organization);

    // Redirect to the organization's subdomain
    const redirectUrl = buildSubdomainUrl(organization.slug, "/select");
    window.location.href = redirectUrl;
  };

  return { selectOrganization };
}

/**
 * Utility to generate a slug from organization name
 */
export function generateSlugFromName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Remove consecutive hyphens
    .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
}
