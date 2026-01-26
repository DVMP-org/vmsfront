"use client";

import { useState, useRef, useEffect, memo, useMemo } from "react";
import Link from "next/link";
import { Bell, CheckCircle2, Info, AlertTriangle, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn, formatDateTime } from "@/lib/utils";
import { useMarkAsRead, useNotifications } from "@/hooks/use-notifications";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { useAuthStore } from "@/store/auth-store";

export function NotificationDropdown() {
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const user = useAuthStore((state) => state.user);
    const { data, isLoading } = useNotifications(user.id, { page: 1, pageSize: 10 });

    const notifications = useMemo(() => data?.items ?? [], [data])
    const unreadCount = useMemo(() => notifications.filter(n => !n.is_read).length, [notifications])

    const markAsReadMutation = useMarkAsRead();

    const hasUnread = unreadCount > 0;

    useEffect(() => {
        if (!open) return;
        const handleClick = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        window.addEventListener("click", handleClick);
        return () => window.removeEventListener("click", handleClick);
    }, [open]);

    const handleMarkAllRead = () => {
        const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
        if (unreadIds.length > 0) {
            markAsReadMutation.mutate(unreadIds);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setOpen(!open)}
                className={cn(
                    "h-9 w-9 p-0 relative rounded-full hover:bg-muted/50 transition-colors",
                    open && "bg-muted/50"
                )}
                aria-label="Notifications"
            >
                <Bell className="h-5 w-5 text-muted-foreground" />
                {hasUnread && (
                    <span className="absolute top-2 right-2 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                )}
            </Button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl border border-border/60 bg-background p-2 shadow-2xl z-50 ring-1 ring-black/5"
                    >
                        <div className="flex items-center justify-between px-3 py-2 border-b border-border/40 mb-1">
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold text-foreground">Notifications</h3>
                                {hasUnread && (
                                    <Badge variant="secondary" className="px-1.5 py-0 text-[10px] h-4 min-w-[16px] flex justify-center">
                                        {unreadCount}
                                    </Badge>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                {hasUnread && (
                                    <button
                                        onClick={handleMarkAllRead}
                                        className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        Mark all read
                                    </button>
                                )}
                                <Link
                                    href="/notifications"
                                    onClick={() => setOpen(false)}
                                    className="text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--brand-primary))] hover:underline"
                                >
                                    View All
                                </Link>
                            </div>
                        </div>

                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar space-y-1">
                            {isLoading ? (
                                <div className="py-8 text-center">
                                    <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                    <p className="text-xs text-muted-foreground">Loading...</p>
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="py-8 text-center">
                                    <Bell className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                                    <p className="text-xs text-muted-foreground">No notifications yet</p>
                                </div>
                            ) : (
                                notifications.slice(0, 8).map((notification) => (
                                    <NotificationItem
                                        key={notification.id}
                                        notification={notification}
                                        onClick={() => setOpen(false)}
                                    />
                                ))
                            )}
                        </div>

                        {notifications.length > 8 && (
                            <Link
                                href="/notifications"
                                onClick={() => setOpen(false)}
                                className="flex items-center justify-center gap-2 py-2 mt-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-lg transition-colors"
                            >
                                Show all {notifications.length} notifications
                                <ArrowRight className="h-3 w-3" />
                            </Link>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

const NotificationItem = memo(function NotificationItem({
    notification,
    onClick
}: {
    notification: any;
    onClick: () => void;
}) {
    const { payload, created_at, is_read, id } = notification;
    const { mutateAsync: markAsRead } = useMarkAsRead();

    const handleItemClick = () => {
        if (!is_read) {
            markAsRead([id]);
        }
        onClick();
    };

    return (
        <div
            className={cn(
                "flex gap-3 p-3 rounded-xl transition-colors cursor-pointer relative group",
                is_read ? "hover:bg-muted/30" : "bg-muted/20 hover:bg-muted/40"
            )}
            onClick={handleItemClick}
        >
            {!is_read && (
                <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-[rgb(var(--brand-primary))] opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
            <div className="mt-0.5 flex-shrink-0">
                <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                    is_read ? "bg-muted/50" : "bg-[rgb(var(--brand-primary))]/10"
                )}>
                    {payload.intent === "success" && <CheckCircle2 className={cn("h-4 w-4", is_read ? "text-green-500/50" : "text-green-500")} />}
                    {payload.intent === "warning" && <AlertTriangle className={cn("h-4 w-4", is_read ? "text-amber-500/50" : "text-amber-500")} />}
                    {payload.intent === "info" && <Info className={cn("h-4 w-4", is_read ? "text-blue-500/50" : "text-blue-500")} />}
                    {!["success", "warning", "info"].includes(payload.intent?.toLowerCase()) && (
                        <Bell className={cn("h-4 w-4", is_read ? "text-muted-foreground/50" : "text-muted-foreground")} />
                    )}
                </div>
            </div>
            <div className="min-w-0 flex-1">
                <p className={cn(
                    "text-sm font-bold leading-tight mb-0.5",
                    is_read ? "text-foreground/70" : "text-foreground"
                )}>
                    {payload.title}
                </p>
                <p className={cn(
                    "text-xs line-clamp-2 mb-1.5",
                    is_read ? "text-muted-foreground/70" : "text-muted-foreground"
                )}>
                    {payload.message}
                </p>
                <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-tight">
                    {formatDateTime(created_at)}
                </span>
            </div>
        </div>
    );
});
