"use client";

import { useQuery } from "@tanstack/react-query";

import { contextApi } from "@/features/context/api";

/**
 * Operating types and the capabilities each one brings. Shared by the first
 * Site step so the screen never fetches on its own.
 */
export function useUseCaseCatalog() {
    return useQuery({
        queryKey: ["context-catalog"],
        queryFn: contextApi.catalog,
        staleTime: 5 * 60_000,
    });
}
