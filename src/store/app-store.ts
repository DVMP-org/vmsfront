import { create } from "zustand";
import { persist } from "zustand/middleware";
import { House, BrandingConfig } from "@/types";

interface AppState {
    selectedHouse: House | null;
    branding: BrandingConfig | null;
    setSelectedHouse: (house: House | null) => void;
    setBranding: (branding: BrandingConfig) => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            selectedHouse: null,
            branding: null,
            setSelectedHouse: (house) => set({ selectedHouse: house }),
            setBranding: (branding) => set({ branding }),
        }),
        {
            name: "app-storage",
        }
    )
);

