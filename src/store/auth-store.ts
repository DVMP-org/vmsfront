import { create } from "zustand";
import { persist } from "zustand/middleware";
import { UserProfile } from "@/types";
import { setCookie, deleteCookie, getCookie } from "@/lib/cookies";

interface AuthState {
    user: UserProfile | null;
    token: string | null;
    isAuthenticated: boolean;
    _hasHydrated: boolean;
    setAuth: (user: UserProfile, token: string) => void;
    clearAuth: () => void;
    updateUser: (user: Partial<UserProfile>) => void;
    setHydrated: (state: boolean) => void;
    syncFromCookie: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
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
                localStorage.removeItem("vms_admin_profile")
                set({ user: null, token: null, isAuthenticated: false });
            },
            updateUser: (userData) =>
                set((state) => ({
                    user: state.user ? { ...state.user, ...userData } : null,
                })),
            setHydrated: (state) => set({ _hasHydrated: state }),
            // Sync auth state from cookie (for cross-subdomain support)
            syncFromCookie: () => {
                const cookieToken = getCookie("auth-token");
                const currentToken = get().token;
                
                // If we have a cookie token but no state token, update state
                if (cookieToken && !currentToken) {
                    set({ token: cookieToken, isAuthenticated: true });
                }
                // If no cookie token but we think we're authenticated, clear state
                else if (!cookieToken && get().isAuthenticated) {
                    set({ user: null, token: null, isAuthenticated: false });
                }
            },
        }),
        {
            name: "auth-storage",
            onRehydrateStorage: () => (state) => {
                state?.setHydrated(true);
                // After hydration, sync from cookie for cross-subdomain support
                state?.syncFromCookie();
            },
        }
    )
);
