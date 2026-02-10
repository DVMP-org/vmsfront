"use client";

import { useParams, useRouter } from "next/navigation";
import { useAdminTransaction } from "@/hooks/use-admin";
import {
    formatCurrency,
    formatDate,
    titleCase,
    cn
} from "@/lib/utils";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
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
} from "lucide-react";
import { toast } from "sonner";

export default function TransactionDetailPage() {
    const params = useParams();
    const router = useRouter();
    const transactionId = params?.transactionId as string;

    const { data: transaction, isLoading } = useAdminTransaction(transactionId);

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard`);
    };

    if (isLoading) {
        return (
            <div className="space-y-6 max-w-7xl mx-auto px-4 py-8">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-24" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <Skeleton className="h-48 w-full rounded-xl" />
                        <Skeleton className="h-96 w-full rounded-xl" />
                    </div>
                    <div className="space-y-6">
                        <Skeleton className="h-64 w-full rounded-xl" />
                    </div>
                </div>
            </div>
        );
    }

    if (!transaction) {
        return (
            <div className="flex flex-col items-center justify-center py-24">
                <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-6">
                    <Search className="h-8 w-8 text-muted-foreground/40" />
                </div>
                <h2 className="text-xl font-bold">Transaction Not Found</h2>
                <p className="text-muted-foreground mt-2 max-w-xs text-center">
                    The requested transaction record could not be found or has been moved.
                </p>
                <Button variant="outline" className="mt-8 px-8" onClick={() => router.push("/admin/transactions")}>
                    Back to Transactions
                </Button>
            </div>
        );
    }

    const statusVariants: Record<string, "success" | "warning" | "danger" | "secondary"> = {
        success: "success",
        pending: "warning",
        failed: "danger",
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-12">
            {/* Header / Breadcrumbs */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                        <button
                            onClick={() => router.push("/admin/transactions")}
                            className="hover:text-foreground flex items-center gap-1 transition-colors"
                        >
                            <ArrowLeft className="h-3 w-3" />
                            Transactions
                        </button>
                        <ChevronRight className="h-3 w-3" />
                        <span className="text-foreground/60">Details</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-brand-primary/10 rounded-xl">
                            <CreditCard className="h-6 w-6 text-brand-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
                                {transaction.reference}
                                <button
                                    onClick={() => handleCopy(transaction.reference, "Reference")}
                                    className="p-1 hover:bg-muted rounded text-muted-foreground/40 hover:text-foreground transition-colors"
                                >
                                    <Copy className="h-4 w-4" />
                                </button>
                            </h1>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-0.5">
                                Transaction ID: {transaction.id}
                            </p>
                        </div>
                    </div>
                </div>
                <Badge
                    variant={statusVariants[transaction.status] || "secondary"}
                    className="px-4 py-1.5 text-xs font-black uppercase tracking-widest rounded-full"
                >
                    {transaction.status}
                </Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Summary Metrics */}
                    <Card className="rounded-2xl shadow-sm border-border/40 overflow-hidden bg-gradient-to-br from-card to-card/50">
                        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x border-b border-border/40">
                            <div className="p-8">
                                <p className="text-[10px] uppercase font-black text-muted-foreground/60 tracking-[0.2em] mb-3">Amount</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-black tabular-nums">{formatCurrency(transaction.amount)}</span>
                                    <span className="text-xs font-bold text-muted-foreground uppercase">{transaction.currency}</span>
                                </div>
                            </div>
                            <div className="p-8">
                                <p className="text-[10px] uppercase font-black text-muted-foreground/60 tracking-[0.2em] mb-3">Processor</p>
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-muted rounded-xl flex items-center justify-center">
                                        <Server className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <span className="text-lg font-bold capitalize">{transaction.processor || "Standard"}</span>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 bg-muted/30 grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div className="flex items-center gap-3">
                                <Activity className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-[9px] uppercase font-bold text-muted-foreground/60">Type</p>
                                    <p className="text-xs font-bold">{titleCase(transaction.type)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-[9px] uppercase font-bold text-muted-foreground/60">Date Created</p>
                                    <p className="text-xs font-bold">{formatDate(transaction.created_at)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-[9px] uppercase font-bold text-muted-foreground/60">Paid At</p>
                                    <p className="text-xs font-bold">{transaction.paid_at ? formatDate(transaction.paid_at) : "—"}</p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Data Display Sections */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 px-1">
                            <Code className="h-5 w-5 text-brand-primary" />
                            <h3 className="text-lg font-black tracking-tight">Technical Data</h3>
                        </div>

                        <Card className="rounded-2xl shadow-none border-border/40 overflow-hidden">
                            <CardHeader className="border-b border-border/40 px-6 py-4 bg-muted/20">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">Payload Response</CardTitle>
                                    <Badge variant="outline" className="text-[10px] font-bold">JSON</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="max-h-[400px] overflow-auto bg-zinc-950 p-6 font-mono text-xs leading-relaxed group relative">
                                    <button
                                        onClick={() => handleCopy(JSON.stringify(transaction.payload, null, 2), "Payload")}
                                        className="absolute right-4 top-4 p-2 bg-zinc-800 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg hover:text-white"
                                    >
                                        <Copy className="h-4 w-4" />
                                    </button>
                                    <pre className="text-zinc-300">
                                        {transaction.payload ? JSON.stringify(transaction.payload, null, 4) : "// No payload data available"}
                                    </pre>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-2xl shadow-none border-border/40 overflow-hidden">
                            <CardHeader className="border-b border-border/40 px-6 py-4 bg-muted/20">
                                <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">Metadata</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="bg-zinc-950 p-6 font-mono text-xs leading-relaxed min-h-[100px]">
                                    <pre className="text-zinc-300">
                                        {transaction.metadata ? JSON.stringify(transaction.metadata, null, 4) : "// No metadata attached"}
                                    </pre>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <Card className="rounded-2xl shadow-none border-border/40 overflow-hidden sticky top-8">
                        <CardHeader className="border-b border-border/40 px-6 py-5">
                            <CardTitle className="text-sm font-black flex items-center gap-2">
                                <FileText className="h-4 w-4 text-brand-primary" />
                                Description
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <p className="text-sm leading-relaxed text-muted-foreground">
                                {transaction.description || "No specific description provided for this transaction."}
                            </p>

                            <div className="pt-4 border-t border-border/40 space-y-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-widest">ID</p>
                                    <p className="text-xs font-mono break-all text-foreground/80 bg-muted/50 p-2 rounded-lg">
                                        {transaction.id}
                                    </p>
                                </div>

                                <div className="p-4 bg-brand-primary/[0.03] border border-brand-primary/10 rounded-xl space-y-3">
                                    <div className="flex items-center gap-2 text-brand-primary">
                                        <ShieldCheck className="h-4 w-4" />
                                        <span className="text-[10px] font-black uppercase tracking-wider">Audit Security</span>
                                    </div>
                                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                                        This record is immutable and digitally signed. Any manual changes will invalidate the verification seal.
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
