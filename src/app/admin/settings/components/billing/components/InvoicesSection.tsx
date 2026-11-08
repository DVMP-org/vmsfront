"use client";

import { useState } from "react";
import { useInvoices, useDownloadInvoice } from "@/hooks/use-subscription";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { PaginationBar } from "@/components/ui/PaginationBar";
import {
    Receipt,
    Download,
    ExternalLink,
    FileText,
    Calendar,
    DollarSign,
    Loader2,
} from "lucide-react";
import { Invoice, InvoiceStatus } from "@/types/subscription";

function formatDateShort(date: string | Date): string {
    return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDateLong(date: string | Date): string {
    return new Date(date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function formatCurrency(amount: number, currency: string = "USD"): string {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency.toUpperCase(),
        minimumFractionDigits: 2,
    }).format(amount / 100);
}

function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
    const config = {
        [InvoiceStatus.PAID]: { label: "Paid", variant: "success" as const },
        [InvoiceStatus.OPEN]: { label: "Open", variant: "default" as const },
        [InvoiceStatus.DRAFT]: { label: "Draft", variant: "outline" as const },
        [InvoiceStatus.OVERDUE]: { label: "Overdue", variant: "danger" as const },
        [InvoiceStatus.CANCELED]: { label: "Canceled", variant: "secondary" as const },
    };

    const { label, variant } = config[status] || { label: status, variant: "default" as const };

    return <Badge variant={variant}>{label}</Badge>;
}

function InvoiceRow({ invoice }: { invoice: Invoice }) {
    const { mutate: downloadInvoice, isPending } = useDownloadInvoice();

    return (
        <TableRow className="hover:bg-[var(--vms-surface-subtle)] ">
            <TableCell>
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--vms-surface-subtle)] ">
                        <FileText className="h-5 w-5 text-[var(--vms-ink-muted)]" />
                    </div>
                    <div>
                        <div className="font-medium text-[var(--vms-ink)] ">
                            Invoice #{invoice.id.slice(0, 8).toUpperCase()}
                        </div>
                        <div className="text-sm text-[var(--vms-ink-muted)]">
                            {invoice.period_start && invoice.period_end
                                ? `${formatDateShort(invoice.period_start)} - ${formatDateShort(invoice.period_end)}`
                                : "—"}
                        </div>
                    </div>
                </div>
            </TableCell>
            <TableCell>
                <div className="flex items-center gap-2 text-[var(--vms-ink-muted)] ">
                    <Calendar className="h-4 w-4 text-[var(--vms-ink-muted)]" />
                    {invoice.created_at ? formatDateLong(invoice.created_at) : "—"}
                </div>
            </TableCell>
            <TableCell>
                <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-[var(--vms-ink-muted)]" />
                    <span className="font-medium text-[var(--vms-ink)] ">
                        {formatCurrency(invoice.amount_due, invoice.currency)}
                    </span>
                </div>
            </TableCell>
            <TableCell>
                <InvoiceStatusBadge status={invoice.status} />
            </TableCell>
            <TableCell>
                {invoice.paid_at ? formatDateShort(invoice.paid_at) : "—"}
            </TableCell>
            <TableCell className="text-right">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => downloadInvoice(invoice.id)}
                    disabled={isPending}
                >
                    {isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <>
                            <Download className="h-4 w-4 mr-1" />
                            PDF
                        </>
                    )}
                </Button>
            </TableCell>
        </TableRow>
    );
}

function InvoiceCard({ invoice }: { invoice: Invoice }) {
    const { mutate: downloadInvoice, isPending } = useDownloadInvoice();

    return (
        <div className="p-4 rounded-lg border border-[var(--vms-line)] hover:bg-[var(--vms-surface-subtle)] transition-colors">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--vms-surface-subtle)] ">
                        <FileText className="h-5 w-5 text-[var(--vms-ink-muted)]" />
                    </div>
                    <div>
                        <div className="font-medium text-[var(--vms-ink)] ">
                            Invoice #{invoice.id.slice(0, 8).toUpperCase()}
                        </div>
                        <div className="text-sm text-[var(--vms-ink-muted)]">
                            {invoice.created_at ? formatDateShort(invoice.created_at) : "—"}
                        </div>
                    </div>
                </div>
                <InvoiceStatusBadge status={invoice.status} />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <span className="text-xs text-[var(--vms-ink-muted)] uppercase tracking-wide">Amount</span>
                    <div className="font-semibold text-[var(--vms-ink)] ">
                        {formatCurrency(invoice.amount_due, invoice.currency)}
                    </div>
                </div>
                <div>
                    <span className="text-xs text-[var(--vms-ink-muted)] uppercase tracking-wide">Period</span>
                    <div className="text-sm text-[var(--vms-ink-muted)] ">
                        {invoice.period_start && invoice.period_end
                            ? `${formatDateShort(invoice.period_start)} - ${formatDateShort(invoice.period_end)}`
                            : "—"}
                    </div>
                </div>
            </div>

            <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => downloadInvoice(invoice.id)}
                disabled={isPending}
            >
                {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                    <Download className="h-4 w-4 mr-2" />
                )}
                Download PDF
            </Button>
        </div>
    );
}

export function InvoicesSection() {
    const [page, setPage] = useState(1);
    const perPage = 10;

    const { data: invoicesData, isLoading } = useInvoices(page, perPage);

    const invoices = invoicesData?.items || [];
    const totalPages = invoicesData?.total_pages || 1;

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-72 mt-2" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <Receipt className="h-5 w-5 text-[var(--vms-ink)]" />
                        Billing History
                    </CardTitle>
                    <CardDescription>View and download your past invoices</CardDescription>
                </CardHeader>
                <CardContent>
                    {invoices.length === 0 ? (
                        <EmptyState
                            icon={Receipt}
                            title="No Invoices Yet"
                            description="Your billing history will appear here once you have active subscriptions."
                        />
                    ) : (
                        <>
                            {/* Desktop Table */}
                            <div className="hidden md:block">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Invoice</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Paid</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {invoices.map((invoice) => (
                                            <InvoiceRow key={invoice.id} invoice={invoice} />
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Mobile Cards */}
                            <div className="md:hidden space-y-4">
                                {invoices.map((invoice) => (
                                    <InvoiceCard key={invoice.id} invoice={invoice} />
                                ))}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="mt-6">
                                    <PaginationBar
                                        page={page}
                                        totalPages={totalPages}
                                        total={invoicesData?.total}
                                        pageSize={perPage}
                                        onChange={setPage}
                                    />
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
