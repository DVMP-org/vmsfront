"use client";

import { useParams, useRouter } from "next/navigation";
import {
    useAdminResidencyDue,
    useAdminDueSchedules,
    useAdminDuePayments
} from "@/hooks/use-admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
    ArrowLeft,
    Building2,
    Receipt,
    History,
    Calendar,
    BadgeCheck,
    CreditCard,
    Wallet,
    AlertCircle,
} from "lucide-react";
import { formatCurrency, formatDate, titleCase, cn } from "@/lib/utils";
import { ResidencyDueStatus, DueSchedule, DuePayment } from "@/types";
import { useState, useMemo } from "react";
import { DataTable, Column, FilterConfig, FilterDefinition } from "@/components/ui/DataTable";
import { formatFiltersForAPI } from "@/lib/table-utils";

export default function ResidencyDueDetailPage() {
    const params = useParams();
    const router = useRouter();
    const dueId = params?.id as string;
    const residencyId = params?.residencyId as string;

    const { data: residencyDue, isLoading, error } = useAdminResidencyDue(dueId, residencyId);

    // Pagination states
    const [schedulePage, setSchedulePage] = useState(1);
    const [paymentsPage, setPaymentsPage] = useState(1);
    const pageSize = 10;

    const [scheduleFilters, setScheduleFilters] = useState<FilterConfig[]>([]);
    const [paymentFilters, setPaymentFilters] = useState<FilterConfig[]>([]);

    const { data: schedulesData, isLoading: isLoadingSchedules, isFetching: isFetchingSchedules } = useAdminDueSchedules(
        dueId,
        residencyId,
        schedulePage,
        pageSize,
        formatFiltersForAPI(scheduleFilters));
    const { data: paymentsData, isLoading: isLoadingPayments, isFetching: isFetchingPayments } = useAdminDuePayments(
        dueId,
        residencyId,
        paymentsPage,
        pageSize,
        formatFiltersForAPI(paymentFilters));

    const availableScheduleFilters: FilterDefinition[] = useMemo(() => [
        {
            field: "payment_date",
            label: "Payment Date",
            type: "date-range",
        }
    ], [])
    const availablePaymentFilters: FilterDefinition[] = useMemo(() => [
        {
            field: "payment_date",
            label: "Payment Date",
            type: "date-range",
        }
    ], [])
    if (isLoading) {
        return (
            <div className="space-y-4 max-w-7xl px-4 py-6">
                <div className="flex items-center gap-2 mb-4">
                    <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-40 w-full rounded-lg" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Skeleton className="h-24 w-full rounded-lg" />
                    <Skeleton className="h-24 w-full rounded-lg" />
                    <Skeleton className="h-24 w-full rounded-lg" />
                </div>
            </div>
        );
    }

    if (error || !residencyDue) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center rounded-lg border border-dashed border-border/60 max-w-2xl mx-auto mt-20">
                <AlertCircle className="h-10 w-10 text-destructive/40 mb-4" />
                <h2 className="text-xl font-bold text-foreground">Residency Due record not found</h2>
                <p className="text-sm text-muted-foreground mt-2 mb-6">The requested residency assessment record could not be found or may have been removed.</p>
                <Button variant="outline" className="font-bold text-xs uppercase" onClick={() => router.back()}>
                    <ArrowLeft className="h-3.5 w-3.5 mr-2" />
                    Back to Residency List
                </Button>
            </div>
        );
    }

    const { due, residency, status, amount, balance, paid_amount } = residencyDue;

    const scheduleColumns: Column<DueSchedule>[] = [
        {
            key: "period",
            header: "Billing Period",
            accessor: (row) => (
                <div className="space-y-0.5">
                    <p className="text-xs font-bold text-foreground">Installment</p>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase ">
                        Due: {formatDate(row.payment_date)}
                    </p>
                </div>
            )
        },
        {
            key: "amount",
            header: "Target Amount",
            accessor: (row) => <span className="text-xs font-bold tabular-nums text-foreground">{formatCurrency(row.amount)}</span>
        },
        {
            key: "status",
            header: "State",
            accessor: (row) => (
                <Badge
                    variant={row.is_paid ? "success" : "secondary"}
                    className="text-[9px] font-black uppercase border-none h-4 px-1.5"
                >
                    {row.is_paid ? "PAID" : "PENDING"}
                </Badge>
            )
        }
    ];

    const paymentColumns: Column<DuePayment>[] = [
        {
            key: "date",
            header: "Transaction Date",
            accessor: (row) => (
                <div className="space-y-0.5">
                    <p className="text-xs font-medium text-foreground">{formatDate(row.payment_date)}</p>
                    <p className="text-[9px] font-mono text-muted-foreground/50 uppercase">REF: {row.id.split('-')[0]}</p>
                </div>
            )
        },
        {
            key: "amount",
            header: "Amount Processed",
            accessor: (row) => <span className="text-xs font-bold tabular-nums text-emerald-600">+{formatCurrency(row.amount)}</span>
        },
        {
            key: "status",
            header: "",
            accessor: (row) => (
                <div className="flex items-center gap-1 text-[8px] font-black uppercase  text-emerald-500">
                    <BadgeCheck className="h-2.5 w-2.5" />
                    Confirmed
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* VMS Action Bar */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => router.push(`/admin/dues/${dueId}/residencies`)}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                >
                    <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                    Back to Residency List
                </button>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-[10px] uppercase border-border/40">
                        RID: {residencyDue.id.split('-')[0]}
                    </Badge>
                </div>
            </div>

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/60 pb-6">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <Building2 className="h-5.5 w-5.5 text-brand-primary" />
                        {residency?.name} — {due?.name}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Specific assessment record and payment history for {residency?.address}.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge
                        variant={status === ResidencyDueStatus.PAID ? "success" : status === ResidencyDueStatus.PARTIALLY_PAID ? "secondary" : "danger"}
                        className="h-7 px-3 text-[10px] font-black uppercase tracking-widest border-none shadow-sm"
                    >
                        {status === ResidencyDueStatus.PAID ? "Paid" : status === ResidencyDueStatus.PARTIALLY_PAID ? "Partially Paid" : "Unpaid"}
                    </Badge>
                </div>
            </div>

            {/* Financial Summary Ribbon */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FinancialMetric
                    label="Total Amount"
                    value={formatCurrency(amount)}
                    description="Total value"
                    icon={CreditCard}
                />
                <FinancialMetric
                    label="Amount Paid"
                    value={formatCurrency(paid_amount)}
                    description="Payments made"
                    icon={BadgeCheck}
                    className="text-emerald-600"
                />
                <FinancialMetric
                    label="Balance Remaining"
                    value={formatCurrency(balance)}
                    description="Outstanding balance"
                    icon={Wallet}
                    className={balance > 0 ? "text-red-600" : "text-emerald-600"}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Assessment Context */}
                    <Card className="rounded-lg shadow-none border-border/60 overflow-hidden">
                        <CardHeader className="py-3 px-5 border-b bg-muted/20">
                            <CardTitle className="text-[11px] font-bold uppercase text-muted-foreground flex items-center gap-2">
                                <Receipt className="h-3.5 w-3.5" />
                                Due Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 grid grid-cols-2 md:grid-cols-4 gap-6">
                            <DetailItem label="Due Name" value={due?.name || "N/A"} />
                            <DetailItem label="Billing Cycle" value={titleCase(due?.tenure_length || "One-time")} />
                            <DetailItem label="Recurring" value={due?.recurring ? "True" : "False"} />
                            <DetailItem label="Payment Breakdown" value={titleCase(residencyDue?.payment_breakdown) || "N/A"} />
                            <DetailItem label="Property" value={residency?.name || "N/A"} />
                        </CardContent>
                    </Card>

                    {/* Payment Schedule */}
                    <Card className="rounded-lg overflow-hidden">
                        <CardHeader className="py-3 px-5 border-b bg-muted/20">
                            <CardTitle className="text-[11px] font-bold uppercase text-muted-foreground flex items-center gap-2">
                                <Calendar className="h-3.5 w-3.5" />
                                Payment Schedule
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <DataTable
                                data={schedulesData?.items || []}
                                columns={scheduleColumns}
                                pageSize={pageSize}
                                serverSide={true}
                                total={schedulesData?.total || 0}
                                currentPage={schedulePage}
                                onPageChange={setSchedulePage}
                                availableFilters={availableScheduleFilters}
                                onFiltersChange={(filters) => {
                                    setScheduleFilters(filters);
                                    setSchedulePage(1);
                                }}
                                className="border-none"
                                showPagination={true}
                                emptyMessage="No payment schedule generated yet."
                                disableClientSideFiltering={true}
                                isLoading={isLoadingSchedules || isFetchingSchedules}
                            />
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    {/* Recent Transactions */}
                    <Card className="rounded-lg shadow-none border-border/60 overflow-hidden">
                        <CardHeader className="py-3 px-5 border-b bg-muted/20">
                            <CardTitle className="text-[11px] font-bold uppercase  text-muted-foreground flex items-center gap-2">
                                <History className="h-3.5 w-3.5" />
                                Payments
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <DataTable
                                data={paymentsData?.items || []}
                                columns={paymentColumns}
                                pageSize={pageSize}
                                serverSide={true}
                                total={paymentsData?.total || 0}
                                currentPage={paymentsPage}
                                onPageChange={setPaymentsPage}
                                availableFilters={availablePaymentFilters}
                                onFiltersChange={(filters) => {
                                    setPaymentFilters(filters);
                                    setPaymentsPage(1);
                                }}
                                className=""
                                showPagination={true}
                                emptyMessage="No payments detected."
                                disableClientSideFiltering={true}
                                isLoading={isLoadingPayments || isFetchingPayments}
                            />
                        </CardContent>
                    </Card>

                    {/* Admin Actions/Notice */}
                    <Card className="rounded-lg shadow-none border-blue-200 bg-blue-50/50 dark:border-blue-900/30 dark:bg-blue-900/10">
                        <CardContent className="p-4 space-y-3">
                            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest">
                                <Receipt className="h-3.5 w-3.5" />
                                Finance Audit
                            </div>
                            <p className="text-[11px] leading-relaxed text-blue-800/70 dark:text-blue-400/70 font-medium">
                                Audit record of all billing increments and payment history for this property unit.
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full h-8 text-[10px] font-bold uppercase border-blue-200 hover:bg-blue-100 dark:border-blue-800 dark:hover:bg-blue-900/50"
                                onClick={() => window.print()}
                            >
                                Download Report
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function FinancialMetric({ label, value, description, icon: Icon, className }: {
    label: string,
    value: string,
    description: string,
    icon: any,
    className?: string
}) {
    return (
        <Card className="rounded-lg shadow-none border-border/60 p-4 group hover:border-border transition-colors relative overflow-hidden">
            <div className="absolute right-4 top-4 text-muted-foreground/10 group-hover:text-muted-foreground/20 transition-colors">
                <Icon className="h-8 w-8" />
            </div>
            <p className="text-[10px] font-bold uppercase  text-muted-foreground/70 mb-1">{label}</p>
            <p className={cn("text-xl font-black  mb-0.5", className)}>{value}</p>
            <p className="text-[10px] text-muted-foreground/60 font-medium">{description}</p>
        </Card>
    );
}

function DetailItem({ label, value }: { label: string; value: string }) {
    return (
        <div className="space-y-0.5">
            <p className="text-[9px] uppercase font-bold text-muted-foreground/60">{label}</p>
            <p className="text-xs font-bold text-foreground truncate">{value}</p>
        </div>
    );
}
