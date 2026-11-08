"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAdminTransaction } from "@/hooks/use-admin";
import { formatCurrency, formatDate, titleCase } from "@/lib/utils";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import {
    ArrowLeft,
    CreditCard,
    ShieldCheck,
    Clock,
    Calendar,
    ChevronRight,
    Search,
    Code,
    Activity,
    Server,
    FileText,
    Copy,
    RefreshCcw,
} from "lucide-react";
import { toast } from "sonner";

export default function TransactionDetailPage() {
    const params = useParams();
    const router = useRouter();
    const transactionId = params?.transactionId as string;

    const {
        data: transaction,
        isLoading,
        isError,
        refetch,
    } = useAdminTransaction(transactionId);

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard`);
    };

    if (isLoading) {
        return (
            <div className="space-y-4 pb-10 text-[var(--vms-ink)]">
                <PageHeader
                    eyebrow="Finance / Transactions"
                    title="Transaction"
                    description="Loading transaction details."
                />
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-6">
                        <Skeleton className="h-48 w-full" />
                        <Skeleton className="h-96 w-full" />
                    </div>
                    <div className="space-y-6">
                        <Skeleton className="h-64 w-full" />
                    </div>
                </div>
            </div>
        );
    }

    if (!transaction) {
        return (
            <div className="space-y-4 pb-10 text-[var(--vms-ink)]">
                <PageHeader
                    eyebrow="Finance / Transactions"
                    title="Transaction record"
                    description="The requested transaction could not be loaded."
                />
                <div className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)]">
                    <EmptyState
                        icon={Search}
                        title={isError ? "Transaction data is unavailable" : "Transaction not found"}
                        description={
                            isError
                                ? "The transaction service did not return this record. Retry before treating it as missing."
                                : "The requested transaction does not exist in the current property context."
                        }
                        action={
                            isError ? (
                                <Button onClick={() => refetch()} variant="outline">
                                    <RefreshCcw className="h-4 w-4" aria-hidden />
                                    Retry
                                </Button>
                            ) : {
                                label: "Back to transactions",
                                onClick: () => router.push("/admin/transactions"),
                            }
                        }
                    />
                </div>
            </div>
        );
    }

    const statusVariants: Record<string, "success" | "warning" | "danger" | "secondary"> = {
        success: "success",
        pending: "warning",
        failed: "danger",
    };

    return (
        <div className="space-y-4 pb-10 text-[var(--vms-ink)]">
            <PageHeader
                breadcrumbs={
                    <nav
                        aria-label="Breadcrumb"
                        className="mb-3 flex items-center gap-2 text-xs text-[var(--vms-ink-muted)]"
                    >
                        <Button asChild variant="ghost" size="sm">
                            <Link href="/admin/transactions">
                                <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
                                Transactions
                            </Link>
                        </Button>
                        <ChevronRight className="h-3 w-3" aria-hidden />
                        <span>Transaction details</span>
                    </nav>
                }
                eyebrow={
                    <span className="inline-flex items-center gap-2">
                        <CreditCard className="h-3.5 w-3.5" aria-hidden />
                        Finance / Transaction
                    </span>
                }
                title={
                    <span className="inline-flex flex-wrap items-center gap-2">
                        {transaction.reference}
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Copy transaction reference"
                            onClick={() =>
                                handleCopy(transaction.reference, "Reference")
                            }
                        >
                            <Copy className="h-4 w-4" aria-hidden />
                        </Button>
                    </span>
                }
                description={`Transaction ID ${transaction.id}`}
                metadata={
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge
                            variant={
                                statusVariants[transaction.status] || "secondary"
                            }
                        >
                            {titleCase(transaction.status)}
                        </Badge>
                        <span className="text-xs text-[var(--vms-ink-muted)]">
                            Created {formatDate(transaction.created_at)}
                        </span>
                    </div>
                }
                primaryAction={
                    <Button
                        variant="secondary"
                        onClick={() => refetch()}
                    >
                        <RefreshCcw className="h-4 w-4" aria-hidden />
                        Refresh
                    </Button>
                }
            />

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                {/* Main Content Area */}
                <div className="space-y-4 lg:col-span-2">
                    {/* Summary Metrics */}
                    <Card>
                        <div className="grid grid-cols-1 border-b border-[var(--vms-line)] md:grid-cols-2 md:divide-x md:divide-[var(--vms-line)]">
                            <div className="p-5 sm:p-6">
                                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--vms-ink-muted)]">
                                    Amount
                                </p>
                                <div className="flex items-baseline gap-2">
                                    <span className="mt-3 text-4xl font-semibold tabular-nums tracking-[-0.04em]">
                                        {formatCurrency(transaction.amount)}
                                    </span>
                                    <span className="text-xs font-semibold uppercase text-[var(--vms-ink-muted)]">
                                        {transaction.currency}
                                    </span>
                                </div>
                            </div>
                            <div className="border-t border-[var(--vms-line)] p-5 sm:p-6 md:border-t-0">
                                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--vms-ink-muted)]">
                                    Processor
                                </p>
                                <div className="flex items-center gap-3">
                                    <div className="mt-3 grid h-10 w-10 place-items-center rounded-[var(--vms-radius-control)] bg-[var(--vms-surface-subtle)]">
                                        <Server className="h-5 w-5 text-[var(--vms-ink-muted)]" />
                                    </div>
                                    <span className="mt-3 text-base font-semibold capitalize">
                                        {transaction.processor || "Standard"}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-5 bg-[var(--vms-surface-subtle)] p-5 sm:grid-cols-3 sm:p-6">
                            <div className="flex items-center gap-3">
                                <Activity className="h-4 w-4 text-[var(--vms-ink-muted)]" />
                                <div>
                                    <p className="text-[11px] uppercase text-[var(--vms-ink-muted)]">Type</p>
                                    <p className="text-xs font-semibold">{titleCase(transaction.type)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Calendar className="h-4 w-4 text-[var(--vms-ink-muted)]" />
                                <div>
                                    <p className="text-[11px] uppercase text-[var(--vms-ink-muted)]">Date created</p>
                                    <p className="text-xs font-semibold">{formatDate(transaction.created_at)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Clock className="h-4 w-4 text-[var(--vms-ink-muted)]" />
                                <div>
                                    <p className="text-[11px] uppercase text-[var(--vms-ink-muted)]">Paid at</p>
                                    <p className="text-xs font-semibold">{transaction.paid_at ? formatDate(transaction.paid_at) : "—"}</p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Data Display Sections */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 px-1">
                            <Code className="h-5 w-5 text-[var(--vms-ink-muted)]" />
                            <h2 className="text-base font-semibold">Technical data</h2>
                        </div>

                        <Card>
                            <CardHeader className="border-b border-[var(--vms-line)]">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-xs uppercase tracking-[0.08em] text-[var(--vms-ink-muted)]">Payload response</CardTitle>
                                    <Badge variant="outline">JSON</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="group relative max-h-[400px] overflow-auto bg-[var(--vms-surface-subtle)] p-5 font-mono text-xs leading-relaxed">
                                    <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        onClick={() => handleCopy(JSON.stringify(transaction.payload, null, 2), "Payload")}
                                        className="absolute right-3 top-3 opacity-70 group-hover:opacity-100"
                                        aria-label="Copy transaction payload"
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                    <pre className="whitespace-pre-wrap break-words text-[var(--vms-ink)]">
                                        {transaction.payload ? JSON.stringify(transaction.payload, null, 4) : "// No payload data available"}
                                    </pre>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="border-b border-[var(--vms-line)]">
                                <CardTitle className="text-xs uppercase tracking-[0.08em] text-[var(--vms-ink-muted)]">Metadata</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="min-h-24 bg-[var(--vms-surface-subtle)] p-5 font-mono text-xs leading-relaxed">
                                    <pre className="whitespace-pre-wrap break-words text-[var(--vms-ink)]">
                                        {transaction.metadata ? JSON.stringify(transaction.metadata, null, 4) : "// No metadata attached"}
                                    </pre>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-4">
                    <Card className="lg:sticky lg:top-4">
                        <CardHeader className="border-b border-[var(--vms-line)]">
                            <CardTitle className="flex items-center gap-2 text-sm">
                                <FileText className="h-4 w-4 text-[var(--vms-ink-muted)]" />
                                Description
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <p className="text-sm leading-6 text-[var(--vms-ink-muted)]">
                                {transaction.description || "No specific description provided for this transaction."}
                            </p>

                            <div className="space-y-4 border-t border-[var(--vms-line)] pt-4">
                                <div className="space-y-1">
                                    <p className="text-[11px] uppercase text-[var(--vms-ink-muted)]">Record ID</p>
                                    <p className="break-all rounded-[var(--vms-radius-control)] bg-[var(--vms-surface-subtle)] p-2 font-mono text-xs">
                                        {transaction.id}
                                    </p>
                                </div>

                                <div className="space-y-2 rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] p-4">
                                    <div className="flex items-center gap-2 font-semibold">
                                        <ShieldCheck className="h-4 w-4" />
                                        <span className="text-xs uppercase tracking-[0.08em]">Audit context</span>
                                    </div>
                                    <p className="text-xs leading-5 text-[var(--vms-ink-muted)]">
                                        Provider payloads and metadata are shown for operational traceability. This page does not mutate the transaction.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
