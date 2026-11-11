"use client";
import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { ForumStatus } from "./ForumStatus";
import { surface, ErrorText, Pagination } from "./ForumPrimitives";
import type { Shared } from "./types";
export function Reports({ api, queryKey, basePath, refresh }: Shared) {
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: [...queryKey, "reports", page],
    queryFn: () => api.reports(page),
    retry: false,
  });
  const review = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "reviewed" | "rejected";
    }) => api.review(id, status),
    onSuccess: refresh,
  });
  return (
    <section className={cn(surface, "min-w-0 overflow-hidden")}>
      <header className="border-b border-[var(--vms-line)] p-5">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Flag className="h-4 w-4" />
          Reported contributions
        </h2>
        <p className="mt-2 text-sm text-[var(--vms-ink-muted)]">
          Review the discussion before taking action. Resolving a report does
          not remove its message.
        </p>
        <ErrorText error={review.error} />
      </header>
      {query.isPending ? (
        <div className="p-5">
          <ForumStatus loading />
        </div>
      ) : query.isError ? (
        <ForumStatus error={query.error} retry={() => query.refetch()} />
      ) : !query.data.items.length ? (
        <p className="p-10 text-center text-sm text-[var(--vms-ink-muted)]">
          No open reports. You’re all caught up.
        </p>
      ) : (
        <ul className="divide-y divide-[var(--vms-line)]">
          {query.data.items.map((report) => (
            <li key={report.id} className="space-y-3 p-5">
              <Link
                href={`${basePath}/topic/${report.topic_id}?page=${report.post_page}#post-${report.post_id}`}
                className="break-words text-base font-semibold underline-offset-4 hover:underline"
              >
                {report.title}
              </Link>
              <p className="break-words text-sm">
                <strong className="font-medium">Report: </strong>
                {report.reason}
              </p>
              <blockquote className="whitespace-pre-wrap break-words border-l-2 border-[var(--vms-line-strong)] pl-3 text-sm text-[var(--vms-ink-muted)]">
                {report.content}
              </blockquote>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={review.isPending}
                  onClick={() =>
                    review.mutate({ id: report.id, status: "reviewed" })
                  }
                >
                  Mark reviewed
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={review.isPending}
                  onClick={() =>
                    review.mutate({ id: report.id, status: "rejected" })
                  }
                >
                  Dismiss report
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {query.data && (
        <Pagination page={page} total={query.data.total} onChange={setPage} />
      )}
    </section>
  );
}
