import { create } from "zustand";
import { persist } from "zustand/middleware";
import { UserProfile } from "@/types";
import { setCookie, deleteCookie } from "@/lib/cookies";

interface AuthState {
    user: UserProfile | null;
    token: string | null;
    isAuthenticated: boolean;
    _hasHydrated: boolean;
    setAuth: (user: UserProfile, token: string) => void;
    clearAuth: () => void;
    updateUser: (user: Partial<UserProfile>) => void;
    setHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            _hasHydrated: false,
            setAuth: (user, token) => {
                setCookie("auth-token", token, 7);
                set({ user, token, isAuthenticated: true });
            },
            clearAuth: () => {
                deleteCookie("auth-token");
                set({ user: null, token: null, isAuthenticated: false });
            },
            updateUser: (userData) =>
                set((state) => ({
                    user: state.user ? { ...state.user, ...userData } : null,
                })),
            setHydrated: (state) => set({ _hasHydrated: state }),
        }),
        {
            name: "auth-storage",
            onRehydrateStorage: () => (state) => {
                state?.setHydrated(true);
            },
        }
    )
);
