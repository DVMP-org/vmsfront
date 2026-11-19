"use client";

import { useQuery } from "@tanstack/react-query";

import {
  checkpointsApi,
  type AccessEventFilters,
} from "@/features/checkpoints/api";

export function useMovementQueries({
  siteId,
  page,
  pageSize,
  search,
  filters,
  dayStart,
}: {
  siteId?: string | null;
  page: number;
  pageSize: number;
  search: string;
  filters: AccessEventFilters;
  dayStart: string;
}) {
  const scope = siteId ?? "none";
  const enabled = Boolean(siteId);
  const gates = useQuery({
    queryKey: ["movement-gate-options", scope],
    queryFn: () => checkpointsApi.gates(1, ""),
    enabled,
    staleTime: 60_000,
  });
  const events = useQuery({
    queryKey: ["access-events", scope, page, pageSize, search, filters],
    queryFn: () =>
      checkpointsApi.accessEvents({
        ...filters,
        page,
        page_size: pageSize,
        search: search.trim() || undefined,
        sort: "occurred_at:desc",
      }),
    enabled,
  });
  const presence = useQuery({
    queryKey: ["access-presence", scope, filters.place_id, filters.gate_id],
    queryFn: () =>
      checkpointsApi.presence({
        place_id: filters.place_id,
        gate_id: filters.gate_id,
      }),
    enabled,
  });
  const entriesToday = useQuery({
    queryKey: ["movement-kpi", scope, "entry", dayStart],
    queryFn: () =>
      checkpointsApi.accessEvents({
        direction: "entry",
        occurred_from: dayStart,
        page: 1,
        page_size: 1,
      }),
    enabled,
  });
  const exitsToday = useQuery({
    queryKey: ["movement-kpi", scope, "exit", dayStart],
    queryFn: () =>
      checkpointsApi.accessEvents({
        direction: "exit",
        occurred_from: dayStart,
        page: 1,
        page_size: 1,
      }),
    enabled,
  });
  const deniedToday = useQuery({
    queryKey: ["movement-kpi", scope, "denied", dayStart],
    queryFn: () =>
      checkpointsApi.accessEvents({
        outcome: "denied",
        occurred_from: dayStart,
        page: 1,
        page_size: 1,
      }),
    enabled,
  });

  return { gates, events, presence, entriesToday, exitsToday, deniedToday };
}
