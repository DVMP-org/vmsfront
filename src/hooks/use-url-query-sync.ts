import { useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

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
 * 
 * @example
 * const { initializeFromUrl, syncToUrl } = useUrlQuerySync({
 *   config: {
 *     page: { defaultValue: 1 },
 *     pageSize: { defaultValue: 20 },
 *     search: { defaultValue: "" },
 *     status: { defaultValue: undefined },
 *     sort: { defaultValue: null },
 *   }
 * });
 * 
 * // Initialize state from URL on mount
 * const [page, setPage] = useState(() => initializeFromUrl("page"));
 * const [search, setSearch] = useState(() => initializeFromUrl("search"));
 * 
 * // Sync state changes to URL
 * useEffect(() => {
 *   syncToUrl({ page, search, status });
 * }, [page, search, status]);
 */
export function useUrlQuerySync(options: UseUrlQuerySyncOptions) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const isInitialMount = useRef(true);
    const { config, skipInitialSync = false } = options;

    /**
     * Initialize a state value from URL query parameter
     */
    const initializeFromUrl = useCallback((key: string) => {
        const paramConfig = config[key];
        if (!paramConfig) {
            console.warn(`No config found for key: ${key}`);
            return undefined;
        }

        const paramValue = searchParams.get(key);

        if (paramValue === null) {
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
    }, [config, searchParams]);

    /**
     * Sync state values to URL query parameters
     */
    const syncToUrl = useCallback((updates: Record<string, any>) => {
        if (skipInitialSync && isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        const params = new URLSearchParams(searchParams.toString());

        Object.entries(updates).forEach(([key, value]) => {
            const paramConfig = config[key];
            if (!paramConfig) {
                console.warn(`No config found for key: ${key}`);
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
        router.replace(
            queryString ? `${pathname}?${queryString}` : pathname,
            { scroll: false }
        );
    }, [config, pathname, router, searchParams, skipInitialSync]);

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
        searchParams,
        pathname,
    };
}
