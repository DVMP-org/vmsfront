import type { QueryClient } from "@tanstack/react-query";
import { getCookie } from "@/lib/cookies";
import { getSubdomain } from "./subdomain-utils";

export const LOCAL_STORAGE_KEYS = {
    authStore: "auth-storage",
    appStore: "app-storage",
    legacyToken: "token",
    legacyUser: "user",
    darkMode: "darkMode",
} as const;

export const LOCAL_STORAGE_PREFIXES = {
    adminProfile: "vms_admin_profile:",
    brandingTheme: "branding-theme-cache",
    plugins: "vmscore_plugins_cache:",
    pluginsTimestamp: "vmscore_plugins_cache_timestamp:",
} as const;

const DEFAULT_ORGANIZATION_SLUG =
    process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_SLUG || "";

function normalizeOrganizationScope(scope?: string | null): string {
    return scope?.trim().toLowerCase() || "";
}

export function getOrganizationScope(): string | null {
    const scope = normalizeOrganizationScope(
        getSubdomain() ||
        getCookie("selected-organization") ||
        DEFAULT_ORGANIZATION_SLUG ||
        null
    );

    return scope || null;
}

function getAdminProfileStorageKey(scope?: string | null): string | null {
    const normalizedScope = normalizeOrganizationScope(scope);
    if (!normalizedScope) return null;

    return `${LOCAL_STORAGE_PREFIXES.adminProfile}${normalizedScope}`;
}

function getStorage(): Storage | null {
    if (typeof window === "undefined") return null;
    return window.localStorage;
}

export function readLocalStorage(key: string): string | null {
    const storage = getStorage();
    if (!storage) return null;

    try {
        return storage.getItem(key);
    } catch (error) {
        console.error(`Failed to read localStorage key: ${key}`, error);
        return null;
    }
}

export function writeLocalStorage(key: string, value: string): boolean {
    const storage = getStorage();
    if (!storage) return false;

    try {
        storage.setItem(key, value);
        return true;
    } catch (error) {
        console.error(`Failed to write localStorage key: ${key}`, error);
        return false;
    }
}

export function removeLocalStorage(key: string): void {
    const storage = getStorage();
    if (!storage) return;

    try {
        storage.removeItem(key);
    } catch (error) {
        console.error(`Failed to remove localStorage key: ${key}`, error);
    }
}

export function readLocalStorageJson<T>(key: string): T | null {
    const raw = readLocalStorage(key);
    if (!raw) return null;

    try {
        return JSON.parse(raw) as T;
    } catch (error) {
        console.error(`Failed to parse localStorage key: ${key}`, error);
        removeLocalStorage(key);
        return null;
    }
}

export function writeLocalStorageJson(key: string, value: unknown): boolean {
    try {
        return writeLocalStorage(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Failed to serialize localStorage key: ${key}`, error);
        return false;
    }
}

export function removeLocalStorageKeys(keys: string[]): void {
    keys.forEach((key) => removeLocalStorage(key));
}

export function removeLocalStorageByPrefix(prefix: string): void {
    const storage = getStorage();
    if (!storage) return;

    try {
        const keysToRemove: string[] = [];
        for (let index = 0; index < storage.length; index += 1) {
            const key = storage.key(index);
            if (key?.startsWith(prefix)) {
                keysToRemove.push(key);
            }
        }

        keysToRemove.forEach((key) => storage.removeItem(key));
    } catch (error) {
        console.error(`Failed to remove localStorage prefix: ${prefix}`, error);
    }
}

export function removeLocalStorageByPrefixes(prefixes: string[]): void {
    prefixes.forEach((prefix) => removeLocalStorageByPrefix(prefix));
}

export function getCachedAdminProfile<T>(): T | undefined {
    const storageKey = getAdminProfileStorageKey(getOrganizationScope());
    if (!storageKey) return undefined;

    return readLocalStorageJson<T>(storageKey) ?? undefined;
}

export function setCachedAdminProfile(profile: unknown): void {
    const storageKey = getAdminProfileStorageKey(getOrganizationScope());
    if (!storageKey) return;

    writeLocalStorageJson(storageKey, profile);
}

export function clearCachedAdminProfile(): void {
    removeLocalStorageByPrefix(LOCAL_STORAGE_PREFIXES.adminProfile);
}

export function clearLegacyAuthStorage(): void {
    removeLocalStorageKeys([
        LOCAL_STORAGE_KEYS.legacyToken,
        LOCAL_STORAGE_KEYS.legacyUser,
    ]);
}

export function clearPluginStorage(): void {
    removeLocalStorageByPrefixes([
        LOCAL_STORAGE_PREFIXES.plugins,
        LOCAL_STORAGE_PREFIXES.pluginsTimestamp,
    ]);
}

export function clearAuthenticatedUserLocalCache(): void {
    clearCachedAdminProfile();
    clearLegacyAuthStorage();
    clearPluginStorage();
}

export function resetAuthenticatedUserCaches(queryClient?: QueryClient): void {
    clearAuthenticatedUserLocalCache();
    queryClient?.removeQueries();
}