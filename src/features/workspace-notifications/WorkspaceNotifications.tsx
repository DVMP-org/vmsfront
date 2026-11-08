"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Bell,
  Check,
  CircleAlert,
  RefreshCw,
} from "lucide-react";
import { useMarkAsRead, useNotifications } from "@/hooks/use-notifications";
import { parseApiError } from "@/lib/error-utils";

export function WorkspaceNotifications({ userId }: { userId: string }) {
  const notifications = useNotifications(userId, { page: 1, pageSize: 5 });
  const markAsRead = useMarkAsRead();
  const items = notifications.data?.items || [];
  const unread = items.filter((item) => !item.is_read).length;

  return (
    <section
      aria-labelledby="workspace-notifications-title"
      className="mt-4 overflow-hidden rounded-xl border border-[#dce3ee] bg-white shadow-[0_1px_2px_rgba(15,27,49,0.04)]"
    >
      <header className="flex flex-col gap-3 border-b border-[#edf0f5] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#f1f6ff] text-[#2563eb]">
            <Bell className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <h2
              id="workspace-notifications-title"
              className="text-base font-semibold"
            >
              Account activity
            </h2>
            <p className="mt-0.5 text-xs text-[#667085]">
              Invitations, payments and property updates for your account.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
          {unread > 0 ? (
            <span className="rounded-full bg-[#edf3ff] px-2.5 py-1 text-[10px] font-bold text-[#1d4ed8]">
              {unread} unread
            </span>
          ) : null}
          <Link
            href="/notifications"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563eb] hover:underline"
          >
            View all
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </header>

      {notifications.isPending ? (
        <div role="status" className="space-y-3 px-5 py-5">
          <span className="sr-only">Loading account activity</span>
          <div className="h-9 animate-pulse rounded-md bg-slate-100" />
          <div className="h-9 animate-pulse rounded-md bg-slate-100" />
        </div>
      ) : notifications.isError ? (
        <div
          role="alert"
          className="flex flex-col gap-3 px-5 py-5 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between"
        >
          <span className="flex items-start gap-2">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Account activity could not be loaded.
              <span className="mt-1 block text-xs">
                {parseApiError(notifications.error).message}
              </span>
            </span>
          </span>
          <button
            type="button"
            onClick={() => notifications.refetch()}
            className="inline-flex items-center gap-2 self-start rounded-md border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-800 hover:bg-red-50 sm:self-auto"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Retry
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="px-5 py-7 text-center">
          <p className="text-sm font-semibold">No account activity yet</p>
          <p className="mt-1 text-xs text-[#667085]">
            New invitations, payments and property updates will appear here.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-[#edf0f5]">
          {items.map((notification) => (
            <li
              key={notification.id}
              className="flex items-start justify-between gap-4 px-5 py-3.5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {notification.payload.title}
                </p>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#667085]">
                  {notification.payload.message}
                </p>
                <time
                  dateTime={notification.created_at}
                  className="mt-1 block text-[10px] font-medium uppercase tracking-[0.08em] text-[#98a2b3]"
                >
                  {formatRelativeDate(notification.created_at)}
                </time>
              </div>
              {notification.is_read ? (
                <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#98a2b3]">
                  Read
                </span>
              ) : (
                <button
                  type="button"
                  aria-label={`Mark ${notification.payload.title} as read`}
                  disabled={markAsRead.isPending}
                  onClick={() => markAsRead.mutate([notification.id])}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-[#dce3ee] px-2.5 py-1.5 text-[10px] font-semibold text-[#475467] hover:bg-[#f8faff] disabled:opacity-50"
                >
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  Read
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function formatRelativeDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";

  const elapsed = Date.now() - date.getTime();
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
