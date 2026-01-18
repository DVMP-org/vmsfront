import { useEffect, useMemo, useState, ReactElement } from "react";
import { useRouter } from "next/router";
import { format } from "date-fns";
import { ArrowLeft, Mail, Phone, Clock3, QrCode, Check, Copy } from "lucide-react";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useVisitor } from "@/hooks/use-resident";
import { useAppStore } from "@/store/app-store";
import { useProfile } from "@/hooks/use-auth";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { RouteGuard } from "@/components/auth/RouteGuard";

export default function VisitorDetailPage() {
    const router = useRouter();
    const { houseId, visitorId } = router.query;
    const hId = useMemo(() => (Array.isArray(houseId) ? houseId[0] : houseId) || "", [houseId]);
    const vId = useMemo(() => (Array.isArray(visitorId) ? visitorId[0] : visitorId) || "", [visitorId]);

    const { selectedHouse, setSelectedHouse } = useAppStore();
    const { data: profile } = useProfile();
    const [copiedVisitorGatePass, setVisitorCopiedGatePass] = useState(false);
    const [copiedGatePass, setCopiedGatePass] = useState(false);

    const effectiveHouseId = hId || selectedHouse?.id || null;

    useEffect(() => {
        if (!hId || !profile?.houses) return;
        if (selectedHouse?.id === hId) return;
        const match = profile.houses.find((h) => h.id === hId);
        if (match) setSelectedHouse(match);
    }, [hId, profile?.houses, selectedHouse?.id, setSelectedHouse]);

    const { data: visitor, isLoading } = useVisitor(effectiveHouseId, vId || null);

    const parseImageUrl = (url: string) => {
        try {
            new URL(url);
            return url;
        } catch {
            return `https://api.vmscore.test/${url}`;
        }
    };

    if (!router.isReady) return null;

    if (!effectiveHouseId) {
        return <Card><CardContent className="p-10"><EmptyState icon={QrCode} title="Select a house" description="Choose a house to view visitor details." action={{ label: "Choose House", onClick: () => router.push("/select") }} /></CardContent></Card>;
    }

    if (isLoading) return <div className="space-y-4"><Skeleton className="h-48 w-full rounded-2xl" /><Skeleton className="h-64 w-full rounded-2xl" /></div>;

    if (!visitor) {
        return <EmptyState icon={QrCode} title="Visitor not found" description="They might have been removed." action={{ label: "Back to visitors", onClick: () => router.push(`/house/${effectiveHouseId}/visitors`) }} />;
    }

    const passCode = visitor.pass_code ?? visitor.gate_pass_code ?? "—";

    return (
        <div className="space-y-6">
            <button onClick={() => router.push(`/house/${effectiveHouseId}/visitors`)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft className="h-4 w-4" />Back to visitors</button>

            <section className="rounded-xl border border-border/60 shadow-lg bg-card overflow-hidden">
                <div className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between bg-muted/20">
                    <div>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground/60">Visitor</p>
                        <h1 className="text-3xl font-bold tracking-tight">{visitor.name || "Visitor"}</h1>
                        <p className="text-sm text-muted-foreground">{visitor.email}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground/60 mb-1">Pass Code</p>
                        <p className="font-mono text-2xl font-black text-primary">{passCode}</p>
                    </div>
                </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader><CardTitle>Contact & Metadata</CardTitle><CardDescription>Information about this visitor account.</CardDescription></CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        <InfoTile icon={Mail} label="Email" value={visitor.email || "Not Provided"} />
                        <InfoTile icon={Phone} label="Phone" value={visitor.phone || "Not Provided"} />
                        <InfoTile icon={Clock3} label="Created" value={visitor.created_at ? format(new Date(visitor.created_at), "PPpp") : "—"} />
                        <InfoTile icon={Clock3} label="Updated" value={visitor.updated_at ? format(new Date(visitor.updated_at), "PPpp") : "—"} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Gate Access</CardTitle><CardDescription>Linked pass and QR entry.</CardDescription></CardHeader>
                    <CardContent className="space-y-6">
                        <div className="rounded-xl border p-4 bg-muted/10 relative group">
                            <p className="text-[10px] uppercase font-bold text-muted-foreground/60 mb-2">Main Pass Code</p>
                            <div className="flex items-center justify-between cursor-pointer" onClick={() => { navigator.clipboard.writeText(passCode); setVisitorCopiedGatePass(true); toast.success("Copied!"); setTimeout(() => setVisitorCopiedGatePass(false), 2000); }}>
                                <span className="font-mono text-xl font-bold">{passCode}</span>
                                {copiedVisitorGatePass ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4 text-muted-foreground opacity-50 group-hover:opacity-100" />}
                            </div>
                        </div>

                        {visitor.qr_code_url && (
                            <div className="flex justify-center flex-col items-center gap-2">
                                <div className="p-4 bg-white rounded-2xl border shadow-sm"><Image src={parseImageUrl(visitor.qr_code_url)} alt="QR" width={160} height={160} className="h-40 w-40 object-contain" /></div>
                                <p className="text-[10px] text-muted-foreground font-medium uppercase">Scan at entry</p>
                            </div>
                        )}

                        {visitor.gate_pass_id && <Button variant="outline" className="w-full" onClick={() => router.push(`/house/${effectiveHouseId}/passes/${visitor.gate_pass_id}`)}>View Related Pass</Button>}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function InfoTile({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
    return (
        <div className="rounded-xl border border-border/60 p-4 bg-muted/5">
            <p className="text-[10px] uppercase font-bold text-muted-foreground/60 flex items-center gap-2 mb-2"><Icon className="h-3 w-3" />{label}</p>
            <p className="text-sm font-semibold break-all">{value}</p>
        </div>
    );
}

VisitorDetailPage.getLayout = function getLayout(page: ReactElement) {
    return (
        <RouteGuard>
            <DashboardLayout type="resident">
                {page}
            </DashboardLayout>
        </RouteGuard>
    );
};
