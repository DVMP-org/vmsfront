import { useRouter } from "next/router";
import {
    useHouseDue,
    useDueSchedules,
    useDuePayments,
    useScheduleHouseDue,
    usePayDueSchedule,
    useTransaction
} from "@/hooks/use-resident";
import { openPaymentPopup } from "@/lib/payment-popup";
import { formatCurrency, formatDate, titleCase, cn, formatDateTime } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { ArrowLeft, Receipt, Clock, ShieldCheck, History, CreditCard, ArrowRight, BadgeCheck, Calendar, Wallet, Loader2 } from "lucide-react";
import { HouseDueStatus, DuePayment, DueSchedule } from "@/types";
import { useState, useEffect, useMemo, ReactElement } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { DataTable, Column, FilterDefinition, FilterConfig } from "@/components/ui/DataTable";
import { formatFiltersForAPI } from "@/lib/table-utils";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { RouteGuard } from "@/components/auth/RouteGuard";

const PAGE_SIZE = 10;

export default function ResidentDueDetailPage() {
    const router = useRouter();
    const { houseId, dueId } = router.query;
    const hId = useMemo(() => (Array.isArray(houseId) ? houseId[0] : houseId) || "", [houseId]);
    const dId = useMemo(() => (Array.isArray(dueId) ? dueId[0] : dueId) || "", [dueId]);

    const { data: houseDue, isLoading } = useHouseDue(hId, dId);

    // Pagination and Filter states
    const [schedulePage, setSchedulePage] = useState(1);
    const [paymentsPage, setPaymentsPage] = useState(1);
    const pageSize = 10;

    const [scheduleFilters, setScheduleFilters] = useState<FilterConfig[]>([]);
    const [paymentFilters, setPaymentFilters] = useState<FilterConfig[]>([]);

    const { data: schedulesData, isLoading: isLoadingSchedules } = useDueSchedules(
        hId,
        dId,
        schedulePage,
        pageSize,
        formatFiltersForAPI(scheduleFilters)
    );
    const { data: paymentsData, isLoading: isLoadingPayments } = useDuePayments(
        hId,
        dId,
        paymentsPage,
        pageSize,
        formatFiltersForAPI(paymentFilters)
    );

    const availableScheduleFilters: FilterDefinition[] = [
        {
            field: "payment_date",
            label: "Due Date",
            type: "date-range",
        }
    ];

    const availablePaymentFilters: FilterDefinition[] = [
        {
            field: "payment_date",
            label: "Paid Date",
            type: "date-range",
        }
    ];

    const scheduleMutation = useScheduleHouseDue(hId, dId);
    const payScheduleMutation = usePayDueSchedule(hId, dId);
    const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
    const [paymentReference, setPaymentReference] = useState<string | null>(null);
    const { data: transaction } = useTransaction(paymentReference);
    const queryClient = useQueryClient();

    const schedules = schedulesData?.items || [];
    const payments = paymentsData?.items || [];

    useEffect(() => {
        if (transaction && paymentReference) {
            if (transaction.status === "success") {
                toast.success("Payment successful!");
                setPaymentReference(null);
                queryClient.invalidateQueries({ queryKey: ["resident", "house-due", hId, dId] });
                queryClient.invalidateQueries({ queryKey: ["resident", "due-schedules", hId, dId] });
                queryClient.invalidateQueries({ queryKey: ["resident", "due-payments", hId, dId] });
            } else if (transaction.status === "failed") {
                toast.error("Payment failed. Please try again.");
                setPaymentReference(null);
            }
        }
    }, [transaction, paymentReference, queryClient, hId, dId]);

    if (isLoading) {
        return (
            <div className="space-y-4 max-w-7xl px-4 py-6">
                <div className="flex items-center gap-2 mb-4">
                    <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-32 w-full rounded-lg" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-4">
                        <Skeleton className="h-64 w-full rounded-lg" />
                    </div>
                    <Skeleton className="h-64 w-full rounded-lg" />
                </div>
            </div>
        );
    }

    if (!houseDue) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Receipt className="h-10 w-10 text-muted-foreground/20 mb-4" />
                <h2 className="text-lg font-bold">Due Not Found</h2>
                <p className="text-sm text-muted-foreground mt-1">This record might have been moved or deleted.</p>
                <Button variant="outline" className="mt-6" onClick={() => router.push(`/house/${hId}/dues`)}>
                    Back to Dues
                </Button>
            </div>
        );
    }

    const { due } = houseDue;
    const isActivated = houseDue.payment_breakdown !== null;

    const handleActivate = () => {
        if (!selectedStrategy) return;
        scheduleMutation.mutate({ payment_breakdown: selectedStrategy });
    };

    const handlePaySchedule = async (scheduleId: string) => {
        try {
            const response = await payScheduleMutation.mutateAsync(scheduleId);
            if (response.data?.authorization_url && response.data?.reference) {
                setPaymentReference(response.data.reference);

                openPaymentPopup(
                    response.data.authorization_url,
                    response.data.reference,
                    (ref) => {
                        console.log("Payment popup closed, polling transaction:", ref);
                    },
                    (error) => {
                        toast.error(error || "Payment cancelled");
                        setPaymentReference(null);
                    }
                );
            }
        } catch (error) {
            // Error handled by mutation
        }
    };

    const scheduleColumns: Column<DueSchedule>[] = [
        {
            key: "period",
            header: "Installment",
            accessor: (row) => (
                <div className="space-y-1">
                    <p className="text-xs font-bold text-foreground/80 uppercase tracking-tight">Due Date</p>
                    <p className="text-xs text-muted-foreground tabular-nums flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        {formatDate(row.payment_date)}
                    </p>
                </div>
            )
        },
        {
            key: "amount",
            header: "Amount",
            accessor: (row) => <span className="font-bold tabular-nums text-foreground">{formatCurrency(row.amount)}</span>
        },
        {
            key: "status",
            header: "Status",
            accessor: (row) => (
                <Badge
                    variant={row.is_paid ? "success" : "secondary"}
                    className="text-[9px] font-black uppercase border-none h-4 px-1.5"
                >
                    {row.is_paid ? "PAID" : "PENDING"}
                </Badge>
            )
        },
        {
            key: "actions",
            header: "",
            accessor: (row) => (
                <div className="flex justify-end">
                    {row.is_payable && !row.is_paid && (
                        <Button
                            size="sm"
                            className=" h-8 px-4 text-[10px] font-bold shadow-none"
                            disabled={payScheduleMutation.isPending || !!paymentReference}
                            onClick={() => handlePaySchedule(row.id)}
                        >
                            {payScheduleMutation.isPending && payScheduleMutation.variables === row.id ? (
                                <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                            ) : (
                                <CreditCard className="h-3 w-3 mr-2" />
                            )}
                            Make Payment
                        </Button>
                    )}
                </div>
            )
        }
    ];

    const paymentColumns: Column<DuePayment>[] = [
        {
            key: "date",
            header: "Payment Date",
            accessor: (row) => (
                <div className="space-y-1">
                    <p className="text-xs font-medium text-foreground tabular-nums">{formatDate(row.payment_date)}</p>
                    <p className="text-[8px] font-black uppercase tracking-tighter text-muted-foreground/40">Ref: {row.id.split('-')[0]}</p>
                </div>
            )
        },
        {
            key: "amount",
            header: "Amount",
            accessor: (row) => <span className="text-xs font-bold tabular-nums text-emerald-600">+{formatCurrency(row.amount)}</span>
        },
        {
            key: "status",
            header: "",
            accessor: (row) => (
                <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-tighter text-emerald-500">
                    <BadgeCheck className="h-2 w-2" />
                    Paid
                </span>
            )
        }
    ];

    return (
        <div className="space-y-6 max-w-7xl animate-in fade-in duration-500">
            {/* VMS Action Bar */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => router.push(`/house/${hId}/dues`)}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                >
                    <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                    Back to My Dues
                </button>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-[10px] uppercase border-border/40">
                        RID: {houseDue.id.split('-')[0]}
                    </Badge>
                </div>
            </div>

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <Receipt className="h-5 w-5 text-muted-foreground" />
                        {due?.name || "Due Details"}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Statement for property fees and dues.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-10 px-4 border-border/60"
                        onClick={() => window.print()}
                    >
                        Download Report
                    </Button>
                </div>
            </div>

            {/* Financial Summary Ribbon */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FinancialMetric
                    label="Total Amount"
                    value={formatCurrency(houseDue.amount)}
                    subValue="Due for this unit"
                    icon={CreditCard}
                />
                <FinancialMetric
                    label="Amount Paid"
                    value={formatCurrency(houseDue.paid_amount)}
                    subValue="Processed payments"
                    icon={BadgeCheck}
                    className=""
                />
                <FinancialMetric
                    label="Balance Remaining"
                    value={formatCurrency(houseDue.balance)}
                    subValue="Outstanding amount"
                    icon={Wallet}
                // className={houseDue.balance > 0 ? "text-red-500" : "text-emerald-600"}
                />
            </div>

            {/* Due Details Info Card */}
            <Card className="rounded-lg shadow-none border-border/40 overflow-hidden bg-muted/20">
                <CardHeader className="py-3 border-b bg-muted/30">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-muted-foreground" />
                        Due Details
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                    <div className="space-y-3">
                        <div>
                            <p className="text-[10px] uppercase font-bold text-muted-foreground/60 mb-1">Assessment Name</p>
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold">{due?.name || "N/A"}</p>
                                {/* <p className="text-[10px] uppercase font-bold text-muted-foreground/60 mb-1">Status</p> */}
                                <Badge variant={
                                    houseDue.status == HouseDueStatus.PAID ? "secondary" : HouseDueStatus.PARTIALLY_PAID ? "warning" : "danger"
                                }>
                                    {titleCase(houseDue.status)}
                                </Badge>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {due?.description && (
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground/60 mb-1">Description</p>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {due.description}
                                    </p>
                                </div>
                            )}

                        </div>

                        <div className="flex gap-6">
                            <div>
                                <p className="text-[10px] uppercase font-bold text-muted-foreground/60 mb-1">Tenure</p>
                                <p className="text-xs font-medium capitalize">{titleCase(due?.tenure_length) || "N/A"}</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-bold text-muted-foreground/60 mb-1">Minimum Payment Breakdown</p>
                                <p className="text-xs font-medium">{titleCase(due?.minimum_payment_breakdown)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-bold text-muted-foreground/60 mb-1">Payment Breakdown</p>
                                <p className="text-xs font-medium">{titleCase(houseDue?.payment_breakdown)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-bold text-muted-foreground/60 mb-1">Next Schedule Date</p>
                                <p className="text-xs font-medium">{formatDateTime(houseDue?.next_schedule.payment_date)}</p>
                            </div>


                        </div>

                    </div>
                </CardContent>
            </Card>

            {!isActivated ? (
                <div className="space-y-6">
                    {/* Activation Area */}
                    <Card className="rounded-lg shadow-none border-brand-primary border-2 bg-brand-primary/[0.02] overflow-hidden">
                        <CardHeader className="py-4 border-b border-brand-primary/10">
                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-brand-primary">
                                <Clock className="h-4 w-4" />
                                Select Payment Plan
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                To begin settling this assessment, please select your preferred payment strategy. Once activated, your payment schedule will be generated automatically.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {houseDue.payment_breakdown_options?.map((option) => (
                                    <button
                                        key={option.payment_breakdown}
                                        onClick={() => setSelectedStrategy(option.payment_breakdown)}
                                        className={cn(
                                            "p-4 rounded-lg border-2 text-left transition-all relative overflow-hidden",
                                            selectedStrategy === option.payment_breakdown
                                                ? "border-brand-primary bg-brand-primary/5 ring-1 ring-brand-primary"
                                                : "border-border hover:border-brand-primary/40"
                                        )}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <p className="text-xs font-bold uppercase tracking-wider">
                                                {titleCase(option.payment_breakdown)}
                                            </p>
                                            {selectedStrategy === option.payment_breakdown && (
                                                <BadgeCheck className="h-4 w-4 text-brand-primary" />
                                            )}
                                        </div>
                                        <p className="text-lg font-black text-foreground">
                                            {option.amount}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground mt-1">
                                            Per {titleCase(option.payment_breakdown)} installment
                                        </p>
                                    </button>
                                ))}
                            </div>

                            <div className="flex justify-end pt-2">
                                <Button
                                    className=" text-white font-bold h-11 px-8 shadow-none"
                                    disabled={!selectedStrategy || scheduleMutation.isPending}
                                    onClick={handleActivate}
                                >
                                    {scheduleMutation.isPending ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <ArrowRight className="h-4 w-4 mr-2" />
                                    )}
                                    Start Payment Plan
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Security Notice */}
                    <Card className="rounded-lg shadow-none border-brand-primary/20 bg-brand-primary/[0.03]">
                        <CardContent className="p-4 space-y-3 font-medium">
                            <div className="flex items-center gap-2 text-brand-primary text-xs font-bold uppercase tracking-wider">
                                <ShieldCheck className="h-4 w-4" />
                                Security Notice
                            </div>
                            <p className="text-[11px] leading-relaxed text-muted-foreground">
                                This statement is a secure record of your account. All payments are tracked and protected.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Payment Schedule */}
                        <Card className="rounded-lg shadow-none border-border/60 overflow-hidden">
                            <CardHeader className="py-4 border-b h-14 bg-muted/20">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground " />
                                    Payment Schedule
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <DataTable
                                    data={schedules}
                                    columns={scheduleColumns}
                                    pageSize={pageSize}
                                    serverSide={true}
                                    total={schedulesData?.total || 0}
                                    currentPage={schedulePage}
                                    onPageChange={setSchedulePage}
                                    className="border-none"
                                    showPagination={true}
                                    availableFilters={availableScheduleFilters}
                                    onFiltersChange={(filters) => {
                                        setSchedulePage(1);
                                        setScheduleFilters(filters);
                                    }}
                                    disableClientSideFiltering={true}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        {/* Recent Payments */}
                        <Card className="rounded-lg shadow-none border-border/60 flex flex-col">
                            <CardHeader className="py-4 border-b h-14">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <History className="h-4 w-4 text-muted-foreground" />
                                    Recent Payments
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <DataTable
                                    data={payments}
                                    columns={paymentColumns}
                                    pageSize={pageSize}
                                    serverSide={true}
                                    total={paymentsData?.total || 0}
                                    currentPage={paymentsPage}
                                    onPageChange={setPaymentsPage}
                                    className="border-none"
                                    showPagination={true}
                                    emptyMessage="No payments made"
                                    availableFilters={availablePaymentFilters}
                                    onFiltersChange={(filters) => {
                                        setPaymentsPage(1);
                                        setPaymentFilters(filters);
                                    }}
                                    disableClientSideFiltering={true}
                                />
                            </CardContent>
                        </Card>

                        {/* Security Notice */}
                        <Card className="rounded-lg shadow-none border-brand-primary/20 bg-brand-primary/[0.03]">
                            <CardContent className="p-4 space-y-3 font-medium">
                                <div className="flex items-center gap-2 text-brand-primary text-xs font-bold uppercase tracking-wider">
                                    <ShieldCheck className="h-4 w-4" />
                                    Security Notice
                                </div>
                                <p className="text-[11px] leading-relaxed text-muted-foreground">
                                    This statement is a secure record of your account. All payments are tracked and protected.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}

function FinancialMetric({
    label,
    value,
    subValue,
    icon: Icon,
    className
}: {
    label: string;
    value: string;
    subValue: string;
    icon: any;
    className?: string;
}) {
    return (
        <Card className="rounded-lg shadow-none border-border/60 p-4 relative overflow-hidden group">
            <div className="absolute right-4 top-4 text-muted-foreground/10 group-hover:text-muted-foreground/20 transition-colors">
                <Icon className="h-8 w-8" />
            </div>
            <p className="text-[10px] uppercase font-bold  text-muted-foreground/70 mb-1">{label}</p>
            <p className={cn("text-xl font-black mb-1", className)}>
                {value}
            </p>
            <p className="text-xs text-muted-foreground font-medium">{subValue}</p>
        </Card>
    );
}

ResidentDueDetailPage.getLayout = function getLayout(page: ReactElement) {
    return (
        <RouteGuard>
            <DashboardLayout type="resident">
                {page}
            </DashboardLayout>
        </RouteGuard>
    );
};
