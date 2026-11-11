"use client";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { parseApiError } from "@/lib/error-utils";
export function ForumStatus({
  loading,
  error,
  retry,
  message,
}: {
  loading?: boolean;
  error?: unknown;
  retry?: () => void;
  message?: string;
}) {
  if (loading)
    return (
      <div role="status" aria-busy="true" className="space-y-4">
        <span className="sr-only">Loading forum</span>
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  return (
    <div
      role={error ? "alert" : "status"}
      className="rounded-lg border border-[var(--vms-line)] bg-[var(--vms-surface)] p-8 text-center"
    >
      <MessageSquare className="mx-auto mb-3 h-7 w-7 text-[var(--vms-ink-muted)]" />
      <h2 className="text-lg font-semibold">
        {error ? "Forum could not be loaded" : "Community forum"}
      </h2>
      <p className="my-3 text-sm text-[var(--vms-ink-muted)]">
        {error ? parseApiError(error).message : message}
      </p>
      {retry && (
        <Button variant="outline" onClick={retry}>
          Try again
        </Button>
      )}
    </div>
  );
}
