import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Residency, BrandingConfig, Organization } from "@/types";
import { deleteCookie, setCookie } from "@/lib/cookies";

interface AppState {
    selectedProperty: {id:string;name:string} | null;
    setSelectedProperty: (property: {id:string;name:string} | null) => void;
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
        (set, get) => ({
            selectedProperty: null,
            setSelectedProperty: (selectedProperty) => {
                if (selectedProperty?.id) {
                    setCookie("selected-site", selectedProperty.id, 30);
                    const slug = get().organization?.slug;
                    if (slug) setCookie("selected-site-organization", slug, 30);
                } else {
                    deleteCookie("selected-site");
                    deleteCookie("selected-site-organization");
                }
                set({ selectedProperty });
            },
            organization: null,
            selectedResidency: null,
            branding: null,
            setSelectedResidency: (residency) => set({ selectedResidency: residency }),
            setSelectedOrganization: (organization) => {
                const currentOrg = get().organization;
                const isDifferentOrg =
                    !organization || (!!currentOrg && currentOrg.id !== organization.id);
                if (organization?.slug) {
                    setCookie("selected-organization", organization.slug, 30);
                } else {
                    deleteCookie("selected-organization");
                }
                if (isDifferentOrg) {
                    deleteCookie("selected-site");
                    deleteCookie("selected-site-organization");
                }
                set((state) => ({
                    organization,
                    selectedProperty: isDifferentOrg ? null : state.selectedProperty,
                }));
            },
            setBranding: (branding) => set({ branding }),
            resetTenantContext: () => {
                deleteCookie("selected-organization");
                deleteCookie("selected-site");
                deleteCookie("selected-site-organization");
                if (typeof window !== "undefined") {
                    localStorage.removeItem("app-storage");
                }
                set({
                    selectedProperty: null,
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

