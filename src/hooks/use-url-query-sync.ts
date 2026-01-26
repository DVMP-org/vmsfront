"use client";

import { useCallback, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/router";

export interface UrlQueryConfig {
    [key: string]: {
        defaultValue?: any;
        serialize?: (value: any) => string | undefined;
        deserialize?: (value: string | null) => any;
    };
}

export interface UseUrlQuerySyncOptions {
    config: UrlQueryConfig;
    skipInitialSync?: boolean;
}

/**
 * Reusable hook for syncing component state with URL query parameters
 * Adapted for Next.js Pages Router.
 */
export function useUrlQuerySync(options: UseUrlQuerySyncOptions) {
    const router = useRouter();
    const isInitialMount = useRef(true);
    const { config, skipInitialSync = false } = options;

    const pathname = router.pathname;

    // Convert router.query to URLSearchParams-like interface if needed, 
    // but initializeFromUrl will use it directly.
    const query = router.query;

    /**
     * Initialize a state value from URL query parameter
     */
    const initializeFromUrl = useCallback((key: string) => {
        if (!router.isReady) {
            return config[key]?.defaultValue;
        }

        const paramConfig = config[key];
        if (!paramConfig) {
            console.warn(`No config found for key: ${key}`);
            return undefined;
        }

        const val = query[key];
        const paramValue = Array.isArray(val) ? val[0] : val;

        if (paramValue === undefined || paramValue === null) {
            return paramConfig.defaultValue;
        }

        if (paramConfig.deserialize) {
            return paramConfig.deserialize(paramValue);
        }

        // Default deserialization logic
        const defaultValue = paramConfig.defaultValue;

        if (typeof defaultValue === "number") {
            const parsed = parseInt(paramValue, 10);
            return isNaN(parsed) ? defaultValue : parsed;
        }

        if (typeof defaultValue === "boolean") {
            return paramValue === "true";
        }

        return paramValue;
    }, [config, query, router.isReady]);

    /**
     * Sync state values to URL query parameters
     */
    const syncToUrl = useCallback((updates: Record<string, any>) => {
        if (!router.isReady) return;

        if (skipInitialSync && isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        const params = new URLSearchParams();
        // Preserve existing query params that are not in config? 
        // Or only manage declared ones? The original implementation 
        // seemed to use searchParams.toString() as base.

        // Let's use current router.query as base
        Object.keys(query).forEach(key => {
            const val = query[key];
            if (val !== undefined) {
                if (Array.isArray(val)) {
                    val.forEach(v => params.append(key, v));
                } else {
                    params.set(key, val);
                }
            }
        });

        Object.entries(updates).forEach(([key, value]) => {
            const paramConfig = config[key];
            if (!paramConfig) {
                // Not managed by this hook, leave as is
                return;
            }

            const defaultValue = paramConfig.defaultValue;

            // Determine if we should set or delete the param
            const shouldDelete =
                value === undefined ||
                value === null ||
                value === "" ||
                value === defaultValue;

            if (shouldDelete) {
                params.delete(key);
            } else {
                // Serialize the value
                let serialized: string | undefined;

                if (paramConfig.serialize) {
                    serialized = paramConfig.serialize(value);
                } else {
                    serialized = String(value);
                }

                if (serialized !== undefined) {
                    params.set(key, serialized);
                } else {
                    params.delete(key);
                }
            }
        });

        const queryString = params.toString();
        const currentQueryString = new URLSearchParams(query as any).toString();

        if (queryString === currentQueryString) {
            return;
        }

        router.replace(
            {
                pathname: router.pathname,
                query: Object.fromEntries(params.entries()),
            },
            undefined,
            { shallow: true, scroll: false }
        );
    }, [config, query, router, skipInitialSync]);

    /**
     * Mark initial mount as complete after first render
     */
    useEffect(() => {
        if (isInitialMount.current && !skipInitialSync) {
            isInitialMount.current = false;
        }
    }, [skipInitialSync]);

    return {
        initializeFromUrl,
        syncToUrl,
        query,
        pathname,
    };
}
