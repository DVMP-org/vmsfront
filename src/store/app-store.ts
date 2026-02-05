import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Residency, BrandingConfig } from "@/types";

interface AppState {
    selectedResidency: Residency | null;
    branding: BrandingConfig | null;
    setSelectedResidency: (residency: Residency | null) => void;
    setBranding: (branding: BrandingConfig) => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            selectedResidency: null,
            branding: null,
            setSelectedResidency: (residency) => set({ selectedResidency: residency }),
            setBranding: (branding) => set({ branding }),
        }),
        {
            name: "app-storage",
        }
    )
);

