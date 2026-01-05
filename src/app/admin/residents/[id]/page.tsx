"use client";

import { useParams, useRouter } from "next/navigation";
import { useAdminResident } from "@/hooks/use-admin";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { ArrowLeft, Mail, Phone, MapPin, Hash, Home, Calendar, User, Shield } from "lucide-react";
import { getFullName, getInitials, cn, formatDate } from "@/lib/utils";

export default function ResidentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const residentId = params?.id as string;
    const { data: residentData, isLoading, error } = useAdminResident(residentId);

    if (isLoading) {
        return (
            <>
                <div className="space-y-6">
                    <Skeleton className="h-8 w-64" />
                    <div className="grid gap-6 lg:grid-cols-3">
                        <Skeleton className="h-64 lg:col-span-2" />
                        <Skeleton className="h-64" />
                    </div>
                </div>
            </>
        );
    }

    if (error || !residentData) {
        return (
            <>
                <div className="flex h-full flex-col items-center justify-center space-y-4 py-12">
                    <h2 className="text-lg font-semibold">Resident not found</h2>
                    <Button onClick={() => router.push("/admin/residents")}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Residents
                    </Button>
                </div>
            </>
        );
    }

    const { user, resident, houses } = residentData;
    const fullName = getFullName(user.first_name, user.last_name);
    const initials = getInitials(user.first_name, user.last_name);

    return (
        <>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => router.push("/admin/residents")} className="-ml-3 text-muted-foreground">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                </div>

                <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary ring-4 ring-background shadow-lg">
                            {initials}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">{fullName}</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant={user.is_active ? "success" : "secondary"}>
                                    {user.is_active ? "Active" : "Inactive"}
                                </Badge>
                                <span className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Shield className="h-3.5 w-3.5" />
                                    ID: <span className="font-mono text-xs">{resident.id.split('-')[0]}</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button >Edit Profile</Button>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Left Column: Personal Info & Houses */}
                    <div className="space-y-6 lg:col-span-2">

                        <div className="grid gap-6 md:grid-cols-2">
                            <Card>
                                <CardContent className="p-6 space-y-4">
                                    <h3 className="font-semibold flex items-center gap-2">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        Personal Information
                                    </h3>
                                    <div className="space-y-3 text-sm">
                                        <div className="grid grid-cols-[100px_1fr] items-center">
                                            <span className="text-muted-foreground">Email:</span>
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-3.5 w-3.5 text-muted-foreground/70" />
                                                <span>{user.email}</span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-[100px_1fr] items-center">
                                            <span className="text-muted-foreground">Phone:</span>
                                            <div className="flex items-center gap-2">
                                                <Phone className="h-3.5 w-3.5 text-muted-foreground/70" />
                                                <span>{user.phone || "—"}</span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-[100px_1fr] items-start">
                                            <span className="text-muted-foreground mt-0.5">Address:</span>
                                            <div className="flex items-start gap-2">
                                                <MapPin className="h-3.5 w-3.5 mt-0.5 text-muted-foreground/70" />
                                                <span>{user.address || "—"}</span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-6 space-y-4">
                                    <h3 className="font-semibold flex items-center gap-2">
                                        <Shield className="h-4 w-4 text-muted-foreground" />
                                        Security & Access
                                    </h3>
                                    <div className="space-y-4 text-sm">
                                        <div>
                                            <span className="text-xs font-medium text-muted-foreground block mb-1.5">Pass Code</span>
                                            <div className="flex items-center gap-2 bg-muted/40 p-2 rounded-md border border-border/50">
                                                <Hash className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-mono text-lg tracking-wider">{resident.pass_code || "—"}</span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-[100px_1fr] items-center">
                                            <span className="text-muted-foreground">Member Since:</span>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-3.5 w-3.5 text-muted-foreground/70" />
                                                <span>{formatDate(resident.created_at)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Linked Houses */}
                        <Card>
                            <CardContent className="p-0 overflow-hidden">
                                <div className="p-6 border-b border-border bg-muted/5">
                                    <h3 className="font-semibold flex items-center gap-2">
                                        <Home className="h-4 w-4 text-muted-foreground" />
                                        Linked Residences ({houses.length})
                                    </h3>
                                </div>
                                {houses.length === 0 ? (
                                    <div className="p-6 text-center text-muted-foreground text-sm">
                                        No houses linked to this resident yet.
                                    </div>
                                ) : (
                                    <div className="divide-y divide-border">
                                        {houses.map(house => (
                                            <div key={house.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                                                <div className="space-y-1">
                                                    <div className="font-medium">{house.name}</div>
                                                    <div className="text-xs text-muted-foreground">{house.address}</div>
                                                </div>
                                                <Badge variant="outline" className={cn("text-xs font-normal", house.is_active ? "text-emerald-600 bg-emerald-50 border-emerald-200" : "text-muted-foreground")}>
                                                    {house.is_active ? "Active" : "Inactive"}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                    </div>

                    {/* Right Column: Badge & Stats */}
                    <div className="space-y-6">
                        {resident.badge_url && (
                            <Card className="overflow-hidden">
                                <div className="bg-gradient-to-br from-primary/5 to-primary/10 border-b border-border p-6 flex flex-col items-center justify-center text-center space-y-4">
                                    <div className="h-48 w-48 bg-white rounded-xl shadow-sm p-4">
                                        <img src={resident.badge_url} alt="Badge" className="h-full w-full object-contain" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-foreground">Digital Entry Badge</p>
                                        <p className="text-xs text-muted-foreground">Scan at gate for entry</p>
                                    </div>
                                </div>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </ >
    );
}
