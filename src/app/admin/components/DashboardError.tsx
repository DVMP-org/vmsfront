"use client";

import { Button } from "@/components/ui/Button";

/** Show a failed request without presenting missing data as zero. */
export function DashboardError({ isFetching, onRetry, hasCachedData = false }: {
  isFetching: boolean;
  onRetry: () => void;
  hasCachedData?: boolean;
}) {
  return (
    <section role="alert" className="rounded-lg border border-amber-500 bg-amber-50 p-4 text-amber-950 dark:bg-amber-950 dark:text-amber-50">
      <h2 className="font-semibold">{hasCachedData ? "Dashboard may be out of date" : "Dashboard unavailable"}</h2>
      <p className="mt-1 text-sm">
        {hasCachedData ? "The latest data could not be loaded. Showing the last available results." : "We couldn't load the dashboard. Please try again."}
      </p>
      <Button variant="outline" size="sm" className="mt-3" onClick={onRetry} disabled={isFetching}>
        {isFetching ? "Retrying…" : "Try again"}
      </Button>
    </section>
  );
}
