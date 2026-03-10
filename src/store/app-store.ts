import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
    Residency,
    BrandingConfig,
    Organization,
    ResidencyWorkspaceRole,
} from "@/types";
import { deleteCookie, setCookie } from "@/lib/cookies";

interface AppState {
    organization: Organization | null;
    selectedResidency: Residency | null;
    selectedResidencyRole: ResidencyWorkspaceRole;
    branding: BrandingConfig | null;
    setSelectedResidency: (residency: Residency | null) => void;
    setSelectedResidencyRole: (role: ResidencyWorkspaceRole) => void;
    setBranding: (branding: BrandingConfig) => void;
    setSelectedOrganization: (organization: Organization | null) => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            organization: null,
            selectedResidency: null,
            selectedResidencyRole: "resident",
            branding: null,
            setSelectedResidency: (residency) => set({ selectedResidency: residency }),
            setSelectedResidencyRole: (role) => set({ selectedResidencyRole: role }),
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

