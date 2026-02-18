import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Residency, BrandingConfig, Organization } from "@/types";

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
            setSelectedOrganization: (organization) => set({ organization: organization }),
            setBranding: (branding) => set({ branding }),
        }),
        {
            name: "app-storage",
        }
    )
);

