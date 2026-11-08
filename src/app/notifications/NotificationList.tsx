"use client";

import { useState, useMemo } from "react";
import { useMarkAsRead, useNotifications } from "@/hooks/use-notifications";
import {
    Bell,
    CheckCircle2,
    Info,
    AlertTriangle,
    Check,
    Search,
} from "lucide-react";
import { formatDateTime, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAuthStore } from "@/store/auth-store";

export function NotificationList() {
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const user = useAuthStore((state) => state.user);
    const [filter, setFilter] = useState<"all" | "unread">("all");
    const { mutateAsync: markAsRead } = useMarkAsRead();

    const {
        data,
        isLoading,
        refetch,
    } = useNotifications(user?.id || "", { page, pageSize: 5 });

    const notifications = useMemo(() => data?.items ?? [], [data]);
    const unreadCount = useMemo(() => notifications.filter(n => !n.is_read).length, [notifications]);


    const filteredNotifications = useMemo(() => {
        return notifications
            .filter(n => {
                if (filter === "unread") return !n.is_read;
                return true;
            })
            .filter(n => {
                const searchLower = searchTerm.toLowerCase();
                return (
                    n.payload.title.toLowerCase().includes(searchLower) ||
                    n.payload.message.toLowerCase().includes(searchLower) ||
                    n.event.toLowerCase().includes(searchLower)
                );
            });
    }, [notifications, searchTerm, filter]);

    const handleMarkAllRead = () => {
        const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
        if (unreadIds.length > 0) {
            markAsRead(unreadIds);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-16 w-full animate-pulse rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] motion-reduce:animate-none" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow="Account activity"
                title="Notifications"
                description="Review approvals, access changes and operating events that need your attention."
                primaryAction={
                    unreadCount > 0 ? (
                        <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
                            <Check className="h-3.5 w-3.5" />
                            Mark all read
                        </Button>
                    ) : undefined
                }
                secondaryActions={
                    <Button variant="outline" size="sm" onClick={() => refetch()}>
                        Refresh
                    </Button>
                }
            />

            <Card className="overflow-hidden border-[var(--vms-line)]">
                <div className="flex flex-wrap items-center gap-4 border-b border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] p-4">
                    <div className="relative min-w-[200px] flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--vms-ink-muted)]" />
                        <Input
                            aria-label="Filter notifications"
                            placeholder="Filter notifications..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <div className="flex items-center rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-1">
                        <button
                            onClick={() => setFilter("all")}
                            className={cn(
                                "min-h-8 rounded px-3 py-1.5 text-xs font-semibold transition-colors",
                                filter === "all" ? "bg-[var(--vms-action)] text-[var(--vms-on-action)]" : "text-[var(--vms-ink-muted)] hover:bg-[var(--vms-surface-subtle)]"
                            )}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFilter("unread")}
                            className={cn(
                                "flex min-h-8 items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold transition-colors",
                                filter === "unread" ? "bg-[var(--vms-action)] text-[var(--vms-on-action)]" : "text-[var(--vms-ink-muted)] hover:bg-[var(--vms-surface-subtle)]"
                            )}
                        >
                            Unread
                            {unreadCount > 0 && (
                                <Badge variant="secondary" className="min-w-[14px] px-1 py-0 text-[9px]">
                                    {unreadCount}
                                </Badge>
                            )}
                        </button>
                    </div>
                </div>

                <div className="divide-y divide-[var(--vms-line)]">
                    <AnimatePresence mode="popLayout">
                        {filteredNotifications.length === 0 ? (
                            <EmptyState
                                icon={Bell}
                                title="No notifications found"
                                description={searchTerm ? "Try adjusting your search or filters." : "You're all caught up."}
                            />
                        ) : (
                            filteredNotifications.map((notification) => (
                                <div key={notification.id}>
                                    <NotificationRow notification={notification} />
                                </div>
                            ))
                        )}
                    </AnimatePresence>
                </div>

                {data?.total_pages || 0 > 1 && (
                    <div className="border-t border-[var(--vms-line)] p-4">
                        <PaginationBar
                            page={data?.page || 1}
                            pageSize={data?.page_size || 10}
                            total={data?.total || 0}
                            totalPages={data?.total_pages || 0}
                            hasNext={data?.has_next || false}
                            hasPrevious={data?.has_previous || false}
                            onChange={(nextPage) => setPage(nextPage)}
                            isFetching={isLoading}
                            resourceLabel="notifications"
                        />
                    </div>
                )}
            </Card>
        </div>
    );
}

function NotificationRow({ notification }: { notification: any }) {
    const { payload, created_at, event, is_read, id } = notification;
    const { mutateAsync: markAsRead } = useMarkAsRead();

    const handleMarkRead = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!is_read) markAsRead([id]);
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
                "group relative flex cursor-pointer items-center gap-4 border-b border-[var(--vms-line)] p-4 transition-colors hover:bg-[var(--vms-surface-subtle)]",
                !is_read && "bg-[var(--vms-surface-subtle)]"
            )}
        >
            <div className={cn("absolute inset-y-0 left-0 w-1 bg-[var(--vms-active-accent)]", is_read && "hidden")} />

            <div className={cn("flex-shrink-0 relative")}>

                <div className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-[var(--vms-radius-control)] border transition-colors",
                    is_read ? "border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] text-[var(--vms-ink-muted)]" :
                        payload.intent === "success" ? "border-[color-mix(in_srgb,var(--vms-success)_35%,white)] bg-[var(--vms-success-subtle)] text-[var(--vms-success)]" :
                            payload.intent === "warning" ? "border-[color-mix(in_srgb,var(--vms-warning)_35%,white)] bg-[var(--vms-warning-subtle)] text-[var(--vms-warning)]" :
                                "border-[var(--vms-line)] bg-[var(--vms-surface)] text-[var(--vms-action)]"
                )}>
                    {payload.intent === "success" ? <CheckCircle2 className="h-4 w-4" /> :
                        payload.intent === "warning" ? <AlertTriangle className="h-4 w-4" /> :
                            <Info className="h-4 w-4" />}
                </div>
            </div>

            <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex items-center gap-2">
                    <h3 className={cn(
                        "text-sm font-bold truncate",
                        is_read ? "text-[var(--vms-ink-muted)]" : "text-[var(--vms-ink)]"
                    )}>
                        {payload.title}
                    </h3>
                    <Badge variant="outline" className="h-4 px-1 py-0 text-[9px] uppercase tracking-widest">
                        {event.replace(/_/g, " ")}
                    </Badge>
                </div>
                <p className={cn(
                    "text-xs line-clamp-1 font-medium",
                    is_read ? "text-[var(--vms-ink-muted)]" : "text-[var(--vms-ink-muted)]"
                )}>
                    {payload.message}
                </p>
            </div>

            <div className="flex-shrink-0 flex items-center gap-4 text-right">
                <div className="hidden sm:flex flex-col items-end gap-0.5 min-w-[80px]">
                    <span className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-widest text-[var(--vms-ink-muted)]">
                        {formatDateTime(created_at).split(',')[0]}
                    </span>
                    <span className="text-[10px] text-[var(--vms-ink-muted)]">
                        {formatDateTime(created_at).split(',')[1]}
                    </span>
                </div>

                <div className="transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                    {!is_read ? (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleMarkRead}
                            className="h-11 w-11 p-0 sm:h-8 sm:w-8"
                            aria-label={`Mark ${payload.title} as read`}
                        >
                            <Check className="h-4 w-4" />
                        </Button>
                    ) : (
                        <div className="flex h-8 w-8 items-center justify-center text-[var(--vms-ink-muted)]">
                            <CheckCircle2 className="h-4 w-4 opacity-20" />
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
