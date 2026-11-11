import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Residency, BrandingConfig, Organization } from "@/types";
import { deleteCookie, setCookie } from "@/lib/cookies";

interface AppState {
    selectedSite: {id:string;name:string} | null;
    setSelectedSite: (site: {id:string;name:string} | null) => void;
    organization: Organization | null;
    selectedResidency: Residency | null;
    branding: BrandingConfig | null;
    setSelectedResidency: (residency: Residency | null) => void;
    setBranding: (branding: BrandingConfig) => void;
    setSelectedOrganization: (organization: Organization | null) => void;
    resetTenantContext: () => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            selectedSite: null,
            setSelectedSite: (selectedSite) => set({selectedSite}),
            organization: null,
            selectedResidency: null,
            branding: null,
            setSelectedResidency: (residency) => set({ selectedResidency: residency }),
            setSelectedOrganization: (organization) => {
                if (organization?.slug) {
                    setCookie("selected-organization", organization.slug, 30);
                } else {
                    deleteCookie("selected-organization");
                }
                set({ organization, selectedSite: null });
            },
            setBranding: (branding) => set({ branding }),
            resetTenantContext: () => {
                deleteCookie("selected-organization");
                if (typeof window !== "undefined") {
                    localStorage.removeItem("app-storage");
                }
                set({
                    selectedSite: null,
                    organization: null,
                    selectedResidency: null,
                    branding: null,
                });
            },
        }),
        {
            name: "app-storage",
        }
    )
);

