"use client";

import { useOperationsAttention } from "@/hooks/use-admin";

import { AttentionQueue } from "./AttentionQueue";

/**
 * Self-fetching attachment point for dashboards that own their own queries.
 *
 * The canonical operations dashboard receives every section's data as props so
 * it can be rendered in a test without a network. The domain dashboards fetch
 * their own data with query hooks, so they get this wrapper instead of four
 * copies of the same query wiring.
 */
export function AttentionQueueSection({
  useCase,
  propertyName,
}: {
  useCase: string;
  propertyName: string;
}) {
  const attention = useOperationsAttention();

  return (
    <AttentionQueue
      queue={attention.data}
      useCase={useCase}
      propertyName={propertyName}
      isLoading={attention.isPending}
      isError={attention.isError}
      isRetrying={attention.isFetching}
      onRetry={() => attention.refetch()}
    />
  );
}
