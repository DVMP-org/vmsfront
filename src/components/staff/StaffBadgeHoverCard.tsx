"use client";

import { useState } from "react";
import Image from "next/image";
import {
    Briefcase,
    Calendar,
    CheckCircle,
    Clock3,
    Info,
    Mail,
    MapPin,
    Phone,
    User,
    XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn, formatDateTime, getFullName, titleCase } from "@/lib/utils";
import type { StaffMember, StaffResidencyAssignment } from "@/types/staff";
import type { UserProfile } from "@/types";

interface StaffBadgeHoverCardProps {
    staff: StaffMember | null | undefined;
    user: UserProfile | null | undefined;
    currentAssignment?: StaffResidencyAssignment | null;
    className?: string;
}

function getStatusColor(status: string | null | undefined) {
    switch (status?.toLowerCase()) {
        case "active":
            return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
        case "pending":
            return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
        case "suspended":
        case "revoked":
            return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
        default:
            return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
    }
}

function getStatusIcon(status: string | null | undefined) {
    switch (status?.toLowerCase()) {
        case "active":
            return <CheckCircle className="h-3 w-3" />;
        case "pending":
            return <Clock3 className="h-3 w-3" />;
        case "suspended":
        case "revoked":
            return <XCircle className="h-3 w-3" />;
        default:
            return null;
    }
}

export function StaffBadgeHoverCard({
    staff,
    user,
    currentAssignment,
    className,
}: StaffBadgeHoverCardProps) {
    const [isHovered, setIsHovered] = useState(false);

    if (!staff) return null;

    const assignment = currentAssignment ?? staff.assignment;
    const residency = assignment?.residency ?? staff.residency;

    return (
        <div
            className={cn("relative inline-block", className)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Trigger Button */}
            <Button
                variant="outline"
                size="sm"
                className="gap-2 border-[rgb(var(--brand-primary))]/30 bg-[rgb(var(--brand-primary))]/5 hover:bg-[rgb(var(--brand-primary))]/10"
            >
                <Briefcase className="h-4 w-4 text-[rgb(var(--brand-primary))]" />
                <span className="text-sm font-medium">You are also staff here</span>
                <Info className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>

            {/* Hover Card */}
            {isHovered && (
                <div className="absolute top-full left-0 z-50 mt-2 w-80 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2">
                    <div className="rounded-xl border border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl overflow-hidden">
                        {/* Header with Badge Image */}
                        <div className="relative bg-gradient-to-br from-[rgb(var(--brand-primary))]/10 to-[rgb(var(--brand-primary))]/5 p-4">
                            <div className="flex items-start gap-3">
                                {/* Avatar / Badge */}
                                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-background shadow-lg border border-border/40">
                                    {user?.avatar_url ? (
                                        <Image
                                            src={user.avatar_url}
                                            alt={getFullName(user.first_name, user.last_name)}
                                            width={48}
                                            height={48}
                                            className="h-12 w-12 rounded-lg object-cover"
                                        />
                                    ) : (
                                        <User className="h-6 w-6 text-[rgb(var(--brand-primary))]" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-foreground truncate">
                                        {getFullName(user?.first_name, user?.last_name)}
                                    </p>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Briefcase className="h-3 w-3" />
                                        {titleCase(staff.staff_type ?? "Staff")}
                                    </p>
                                    <div className="mt-1.5">
                                        <Badge className={cn("text-[10px]", getStatusColor(staff.status))}>
                                            <span className="flex items-center gap-1">
                                                {getStatusIcon(staff.status)}
                                                {titleCase(staff.status ?? "Unknown")}
                                            </span>
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Details */}
                        <div className="p-3 space-y-2">
                            {/* Contact Info */}
                            <div className="flex items-center gap-2 text-xs">
                                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-foreground truncate">{user?.email ?? "No email"}</span>
                            </div>
                            {user?.phone && (
                                <div className="flex items-center gap-2 text-xs">
                                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="text-foreground">{user.phone}</span>
                                </div>
                            )}

                            {/* Divider */}
                            <div className="border-t border-border/40 my-2" />

                            {/* Assignment Details */}
                            {assignment && (
                                <>

                                    {assignment.role_title && (
                                        <div className="flex items-center gap-2 text-xs">
                                            <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                                            <span className="text-foreground">{assignment.role_title}</span>
                                        </div>
                                    )}
                                    {assignment.sponsor_resident && (
                                        <div className="flex items-center gap-2 text-xs">
                                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                                            <span className="text-foreground">
                                                Sponsored by{" "}
                                                {getFullName(
                                                    assignment.sponsor_resident.user?.first_name,
                                                    assignment.sponsor_resident.user?.last_name
                                                )}
                                            </span>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Joined Date */}
                            {staff.created_at && (
                                <div className="flex items-center gap-2 text-xs">
                                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="text-muted-foreground">
                                        Enroled {formatDateTime(staff.created_at)}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Footer with pass code */}
                        {(staff as any).pass_code && (
                            <div className="border-t border-border/40 px-3 py-2 bg-muted/30">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                    Staff Pass Code
                                </p>
                                <p className="text-sm font-mono font-bold text-[rgb(var(--brand-primary))]">
                                    {(staff as any).pass_code}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
