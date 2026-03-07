import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Residency, BrandingConfig, Organization } from "@/types";
import { deleteCookie, setCookie } from "@/lib/cookies";

interface AppState {
    organization: Organization | null;
    selectedResidency: Residency | null;
    branding: BrandingConfig | null;
    setSelectedResidency: (residency: Residency | null) => void;
    setBranding: (branding: BrandingConfig) => void;
    setSelectedOrganization: (organization: Organization | null) => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
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
                set({ organization: organization });
            },
            setBranding: (branding) => set({ branding }),
        }),
        {
            name: "app-storage",
        }
    )
);

