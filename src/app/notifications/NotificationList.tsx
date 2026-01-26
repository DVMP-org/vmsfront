"use client";

import { useState, useMemo } from "react";
import { useMarkAsRead, useNotifications } from "@/hooks/use-notifications";
import {
    Bell,
    CheckCircle2,
    Info,
    AlertTriangle,
    Calendar,
    MoreVertical,
    Check,
    Trash2,
    Search,
    Filter
} from "lucide-react";
import { formatDateTime, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PaginationBar } from "@/components/ui/PaginationBar";
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
    } = useNotifications(user?.id, { page, pageSize: 5 });

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
                    <div key={i} className="h-16 w-full bg-muted/20 animate-pulse rounded-lg border border-border/40" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
                    <p className="text-sm text-muted-foreground">
                        Manage your system alerts and activity updates
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                        <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="h-9 px-3 gap-2 text-xs font-semibold">
                            <Check className="h-3.5 w-3.5" />
                            Mark all read
                        </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => refetch()} className="h-9 px-3 text-xs font-semibold text-muted-foreground">
                        Refresh
                    </Button>
                </div>
            </div>

            <Card className="border-border/40 shadow-sm overflow-hidden rounded-xl">
                <div className="p-4 border-b border-border/40 bg-muted/5 flex flex-wrap items-center gap-4">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Filter notifications..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 h-9 text-sm bg-background border-border/60"
                        />
                    </div>
                    <div className="flex items-center bg-muted/20 p-1 rounded-lg border border-border/40">
                        <button
                            onClick={() => setFilter("all")}
                            className={cn(
                                "px-3 py-1.5 text-xs font-bold rounded-md transition-all",
                                filter === "all" ? "bg-background text-foreground shadow-xs border border-border/40" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFilter("unread")}
                            className={cn(
                                "px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5",
                                filter === "unread" ? "bg-background text-foreground shadow-xs border border-border/40" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            Unread
                            {unreadCount > 0 && (
                                <Badge variant="secondary" className="px-1 py-0 h-4 text-[9px] min-w-[14px] bg-[rgb(var(--brand-primary,#213928))]/10 text-[rgb(var(--brand-primary,#213928))]">
                                    {unreadCount}
                                </Badge>
                            )}
                        </button>
                    </div>
                </div>

                <div className="divide-y divide-border/40">
                    <AnimatePresence mode="popLayout">
                        {filteredNotifications.length === 0 ? (
                            <div className="py-20 text-center">
                                <EmptyState
                                    icon={Bell}
                                    title="No notifications found"
                                    description={searchTerm ? "Try adjusting your search or filters" : "You're all caught up!"}
                                />
                            </div>
                        ) : (
                            filteredNotifications.map((notification) => (
                                <div key={notification.id} className="my-2">
                                    <NotificationRow notification={notification} />
                                </div>
                            ))
                        )}
                    </AnimatePresence>
                </div>

                {data.total_pages > 1 && (
                    <div className="p-4 border-border/40">
                        <PaginationBar
                            page={data.page}
                            pageSize={data.page_size}
                            total={data.total}
                            totalPages={data.total_pages}
                            hasNext={data.has_next}
                            hasPrevious={data.has_previous}
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
                "group flex items-center gap-4 p-4 border-b rounded-xs border-border/40 transition-all hover:bg-muted/30 cursor-pointer relative dark:bg-white/10",
                !is_read && "bg-foreground/10 dark:bg-background/10"
            )}
        >
            <div className="hidden group-hover:block absolute left-0 top-0 bottom-0 w-1 bg-[rgb(var(--brand-primary,#213928))]/40" />

            <div className={cn("flex-shrink-0 relative")}>

                <div className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg border transition-all",
                    is_read ? "bg-muted/50 border-border/40 text-muted-foreground/60 dark:border-white/20" :
                        payload.intent === "success" ? "bg-green-500/10 border-green-500/20 text-green-600 shadow-sm shadow-green-500/5" :
                            payload.intent === "warning" ? "bg-amber-500/10 border-amber-500/20 text-amber-600 shadow-sm shadow-amber-500/5" :
                                "bg-[rgb(var(--brand-primary,#213928)/0.1)] border-[rgb(var(--brand-primary,#213928)/0.2)] text-[rgb(var(--brand-primary,#213928))] shadow-sm shadow-[rgb(var(--brand-primary,#213928)/0.05)] dark:text-white/50 dark:border-white/20"
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
                        is_read ? "text-foreground/70" : "text-foreground"
                    )}>
                        {payload.title}
                    </h3>
                    <Badge variant="outline" className="text-[9px] uppercase font-black tracking-widest h-4 px-1 py-0 border-border/40 text-muted-foreground/50 bg-muted/20">
                        {event.replace(/_/g, " ")}
                    </Badge>
                </div>
                <p className={cn(
                    "text-xs line-clamp-1 font-medium",
                    is_read ? "text-muted-foreground/60" : "text-muted-foreground"
                )}>
                    {payload.message}
                </p>
            </div>

            <div className="flex-shrink-0 flex items-center gap-4 text-right">
                <div className="hidden sm:flex flex-col items-end gap-0.5 min-w-[80px]">
                    <span className="text-[10px] font-black text-muted-foreground uppercase whitespace-nowrap tracking-widest">
                        {formatDateTime(created_at).split(',')[0]}
                    </span>
                    <span className="text-[10px] text-muted-foreground/50 font-bold">
                        {formatDateTime(created_at).split(',')[1]}
                    </span>
                </div>

                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    {!is_read ? (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleMarkRead}
                            className="h-8 w-8 p-0 rounded-lg hover:bg-[rgb(var(--brand-primary,#213928))]/10 hover:text-[rgb(var(--brand-primary,#213928))] border-border/40"
                        >
                            <Check className="h-4 w-4" />
                        </Button>
                    ) : (
                        <div className="h-8 w-8 flex items-center justify-center text-muted-foreground/30">
                            <CheckCircle2 className="h-4 w-4 opacity-20" />
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
