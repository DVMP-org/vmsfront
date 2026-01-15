"use client";

import { useParams, useRouter } from "next/navigation";
import { useAdminHouseDue } from "@/hooks/use-admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
    ArrowLeft,
    Building2,
    Receipt,
    CheckCircle2,
    Clock,
    AlertCircle
} from "lucide-react";
import { formatCurrency, titleCase } from "@/lib/utils";
import { HouseDueStatus } from "@/types";

export default function HouseDueDetailPage() {
    const params = useParams();
    const router = useRouter();
    const dueId = params?.id as string;
    const houseId = params?.houseId as string;

    const { data: houseDue, isLoading, error } = useAdminHouseDue(dueId, houseId);

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-32" />
                <div className="grid gap-6 md:grid-cols-2">
                    <Skeleton className="h-48" />
                    <Skeleton className="h-48" />
                </div>
            </div>
        );
    }

    if (error || !houseDue) {
        return (
            <div className="flex h-full flex-col items-center justify-center space-y-4 py-12">
                <AlertCircle className="h-12 w-12 text-destructive" />
                <h2 className="text-xl font-semibold text-destructive">House Due record not found</h2>
                <Button onClick={() => router.push(`/admin/dues/${dueId}/houses`)}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to List
                </Button>
            </div>
        );
    }

    const { due, house, status, amount, balance, paid_amount } = houseDue;

    return (
        <div className="space-y-6 pb-12">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/admin/dues/${dueId}/houses`)}
                    className="-ml-2 h-8 hover:bg-transparent hover:underline px-2"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to House List
                </Button>
            </div>

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold">{due?.name} - {house?.name}</h1>
                    <p className="text-muted-foreground">{house?.address}</p>
                </div>
                <div className="flex items-center gap-2">
                    {status === HouseDueStatus.PAID ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 uppercase py-1 px-3">
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Fully Paid
                        </Badge>
                    ) : status === HouseDueStatus.PARTIALLY_PAID ? (
                        <Badge variant="secondary" className="uppercase py-1 px-3">
                            <Clock className="h-4 w-4 mr-2" />
                            Partially Paid
                        </Badge>
                    ) : (
                        <Badge variant="danger" className="uppercase py-1 px-3">
                            <AlertCircle className="h-4 w-4 mr-2" />
                            Unpaid
                        </Badge>
                    )}
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Target Amount</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(amount)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Paid</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{formatCurrency(paid_amount)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding Balance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">{formatCurrency(balance)}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Receipt className="h-5 w-5" />
                            Due Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-muted-foreground">Due Name</span>
                            <span className="font-medium">{due?.name}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-muted-foreground">Type</span>
                            <span className="capitalize">{due?.recurring ? "Recurring" : "One-time"}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-muted-foreground">Billing Tenure</span>
                            <span className="capitalize">{titleCase(due?.tenure_length || "")}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5" />
                            House Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-muted-foreground">House Name</span>
                            <span className="font-medium">{house?.name}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-muted-foreground">Address</span>
                            <span className="font-medium">{house?.address}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-muted-foreground">Slug</span>
                            <span className="font-medium">{house?.slug}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
