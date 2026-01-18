import { useEffect, useMemo, useState, ReactElement } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { useGatePass, useRevokeGatePass } from "@/hooks/use-resident";
import { useAppStore } from "@/store/app-store";
import { useProfile } from "@/hooks/use-auth";
import { Button } from "@/components/ui/Button";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { QRCodeSVG } from "qrcode.react";
import { formatDateTime, getPassStatusColor, titleCase } from "@/lib/utils";
import { ArrowLeft, Ban, Home as HomeIcon, Copy, Check } from "lucide-react";
import { GatePassStatus } from "@/types";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { RouteGuard } from "@/components/auth/RouteGuard";

export default function PassDetailPage() {
    const router = useRouter();
    const { houseId, passId } = router.query;
    const hId = useMemo(() => (Array.isArray(houseId) ? houseId[0] : houseId) || "", [houseId]);
    const pId = useMemo(() => (Array.isArray(passId) ? passId[0] : passId) || "", [passId]);

    const { selectedHouse, setSelectedHouse } = useAppStore();
    const { data: profile } = useProfile();
    const effectiveHouseId = hId || selectedHouse?.id || null;

    const { data: pass, isLoading } = useGatePass(effectiveHouseId, pId || null);
    const revokePassMutation = useRevokeGatePass(effectiveHouseId);
    const [copied, setCopied] = useState(false);
    const [suffixCopied, setSuffixCopied] = useState(false);

    useEffect(() => {
        if (!hId || !profile?.houses) return;
        if (selectedHouse?.id === hId) return;
        const match = profile.houses.find((h) => h.id === hId);
        if (match) setSelectedHouse(match);
    }, [hId, profile?.houses, selectedHouse?.id, setSelectedHouse]);

    const handleCopyCode = async () => {
        if (pass?.code) {
            await navigator.clipboard.writeText(pass.code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleCopySuffix = async (suffix: string) => {
        if (pass?.code && suffix) {
            await navigator.clipboard.writeText(`${pass.code}-${suffix}`);
            setSuffixCopied(true);
            setTimeout(() => setSuffixCopied(false), 2000);
        }
    };

    if (!router.isReady) return null;

    if (!effectiveHouseId || !pId) {
        return <div className="border border-zinc-200 rounded bg-white p-8"><EmptyState icon={HomeIcon} title="Select a house" description="Choose a house to view pass details." action={{ label: "Choose House", onClick: () => router.push("/select") }} /></div>;
    }

    if (isLoading) return <CardSkeleton />;

    if (!pass) return <div className="text-center py-12"><p className="text-sm text-zinc-500">Pass not found</p></div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={() => router.back()} className="h-8 px-2"><ArrowLeft className="h-4 w-4" /></Button>
                    <h1 className="text-lg font-semibold text-zinc-900">Gate Pass Details</h1>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPassStatusColor(pass.status)}`}>{titleCase(pass.status)}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                    <Section title="Visitor Information">
                        <div className="divide-y divide-zinc-100">
                            {pass.visitors.length === 0 ? <div className="px-3 py-4 text-sm text-zinc-500">No visitors assigned</div> : pass.visitors.map((visitor) => (
                                <div key={visitor.id} className="px-3 py-2.5">
                                    <div className="text-sm font-medium text-zinc-900">{visitor.name}</div>
                                    {visitor.email && <div className="text-xs text-zinc-500 mt-0.5">{visitor.email}</div>}
                                    {visitor.phone && <div className="text-xs text-zinc-500">{visitor.phone}</div>}
                                    {visitor.pass_code_suffix && (
                                        <span className="flex items-center gap-2 text-xs text-zinc-500 mt-1 font-mono">
                                            <span className="font-bold">{pass.code}-{visitor.pass_code_suffix}</span>
                                            <Copy className="h-3 w-3 cursor-pointer hover:text-primary transition-colors" onClick={() => handleCopySuffix(visitor.pass_code_suffix)} />
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </Section>

                    <Section title="Access Rules">
                        <div className="divide-y divide-zinc-100">
                            <Rule label="Pass Code" value={<code>{pass.code}</code>} action={<button onClick={handleCopyCode} className="p-1 hover:bg-zinc-100 rounded">{copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}</button>} />
                            <Rule label="Usage Limit" value={pass.max_uses ? `${pass.uses_count} / ${pass.max_uses} uses` : "Unlimited"} />
                            <Rule label="Current Usage" value={`${pass.uses_count} scans`} />
                        </div>
                    </Section>

                    <Section title="Validity Window">
                        <div className="divide-y divide-zinc-100">
                            <Rule label="Valid From" value={<span className="text-xs">{formatDateTime(pass.valid_from || "")}</span>} />
                            <Rule label="Valid To" value={<span className="text-xs">{formatDateTime(pass.valid_to || "")}</span>} />
                        </div>
                    </Section>
                </div>

                <div className="space-y-4">
                    <Section title="QR Code">
                        <div className="p-4 flex flex-col items-center gap-4">
                            {pass.qr_code_url ? <Image src={pass.qr_code_url} alt="QR" width={200} height={200} unoptimized className="w-full max-w-[180px] h-auto object-contain" /> : <div className="bg-white p-2 rounded border shadow-sm"><QRCodeSVG value={pass.code} size={180} /></div>}
                            <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider text-center">Share with visitors for entry</p>
                        </div>
                    </Section>

                    <Section title="Actions">
                        <div className="p-3 space-y-2">
                            {pass.status === GatePassStatus.CHECKED_IN && (
                                <Button variant="destructive" size="sm" className="w-full" onClick={() => confirm("Revoke pass?") && revokePassMutation.mutate(pId)} isLoading={revokePassMutation.isPending}><Ban className="h-3.5 w-3.5 mr-2" />Revoke Pass</Button>
                            )}
                            <Button variant="outline" size="sm" className="w-full" onClick={() => router.push(`/house/${effectiveHouseId}/passes`)}>Back to Passes</Button>
                        </div>
                    </Section>
                </div>
            </div>
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="border border-zinc-200 rounded bg-white overflow-hidden shadow-sm">
            <div className="border-b border-zinc-200 bg-zinc-50/50 px-3 py-2">
                <h2 className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">{title}</h2>
            </div>
            {children}
        </div>
    );
}

function Rule({ label, value, action }: { label: string; value: React.ReactNode; action?: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between px-3 py-2.5">
            <span className="text-sm text-zinc-600">{label}</span>
            <div className="flex items-center gap-2 font-medium text-zinc-900 text-sm">
                {value}
                {action}
            </div>
        </div>
    );
}

PassDetailPage.getLayout = function getLayout(page: ReactElement) {
    return (
        <RouteGuard>
            <DashboardLayout type="resident">
                {page}
            </DashboardLayout>
        </RouteGuard>
    );
};
