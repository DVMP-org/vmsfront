import { useState, useMemo, useEffect, ReactElement } from "react";
import { useRouter } from "next/router";
import { useCheckinPass, useCheckoutPass, useVisitorsByPassCode } from "@/hooks/use-admin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { QRScanner } from "@/components/ui/QRScanner";
import { Scan, CheckCircle, XCircle, LogIn, LogOut, QrCode } from "lucide-react";
import { Visitor } from "@/types";
import { titleCase } from "@/lib/utils";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminPermissionGuard } from "@/components/auth/AdminPermissionGuard";
import { RouteGuard } from "@/components/auth/RouteGuard";

// Helper function to check if pass code is 2-part or 3-part
function getPassCodeParts(code: string): { baseCode: string; suffix: string | null; isThreePart: boolean } {
    const normalized = code.trim().toUpperCase();
    const parts = normalized.split("-");
    if (parts.length >= 3) {
        const suffix = parts[parts.length - 1];
        const baseCode = parts.slice(0, -1).join("-");
        return { baseCode, suffix, isThreePart: true };
    } else if (parts.length === 2) {
        return { baseCode: normalized, suffix: null, isThreePart: false };
    }
    return { baseCode: normalized, suffix: null, isThreePart: false };
}

function shouldDirectScan(code: string, parts?: ReturnType<typeof getPassCodeParts>) {
    const normalized = code.trim().toUpperCase();
    const resolvedParts = parts ?? getPassCodeParts(normalized);
    const isResidentPass = normalized.startsWith("RES-");
    const isGateThreePart = normalized.startsWith("GATE-") && resolvedParts.isThreePart;
    return isResidentPass || isGateThreePart;
}

export default function GateConsolePage() {
    const router = useRouter();
    const [code, setCode] = useState("");
    const [scanType, setScanType] = useState<"checkin" | "checkout">("checkin");
    const [lastResult, setLastResult] = useState<any>(null);
    const [errorResult, setErrorResult] = useState<{ message: string; status?: string } | null>(null);
    const [selectedPassCode, setSelectedPassCode] = useState<string | null>(null);
    const [showQRScanner, setShowQRScanner] = useState(false);

    const checkinMutation = useCheckinPass();
    const checkoutMutation = useCheckoutPass();

    useEffect(() => {
        if (!router.isReady) return;
        const codeParam = router.query.code;
        const normalizedParam = Array.isArray(codeParam) ? codeParam[0] : codeParam;

        if (normalizedParam && normalizedParam !== code) {
            const normalized = normalizedParam.toUpperCase();
            setCode(normalized);
            const parts = getPassCodeParts(normalized);
            if (!shouldDirectScan(normalized, parts)) {
                setSelectedPassCode(normalized);
            } else {
                setSelectedPassCode(null);
            }
        }
    }, [router.isReady, router.query.code]);

    const updateUrlCode = (newCode: string) => {
        const newQuery = { ...router.query };
        if (newCode.trim()) {
            newQuery.code = newCode.trim().toUpperCase();
        } else {
            delete newQuery.code;
        }
        router.replace({ pathname: router.pathname, query: newQuery }, undefined, { shallow: true, scroll: false });
    };

    const codeParts = useMemo(() => getPassCodeParts(code), [code]);
    const shouldAutoMutate = useMemo(() => shouldDirectScan(code, codeParts), [code, codeParts]);

    const { data: visitors, isLoading: isLoadingVisitors } = useVisitorsByPassCode(
        shouldAutoMutate ? null : codeParts.baseCode
    );

    const handleScan = (codeToScan?: string) => {
        const codeToUse = codeToScan || code;
        if (!codeToUse.trim()) return;

        const trimmedCode = codeToUse.trim().toUpperCase();
        const parts = getPassCodeParts(trimmedCode);
        const useMutationDirectly = shouldDirectScan(trimmedCode, parts);

        if (useMutationDirectly) {
            const mutation = scanType === "checkin" ? checkinMutation : checkoutMutation;
            mutation.mutate({ code: trimmedCode }, {
                onSuccess: (response) => {
                    if (response.data.status && response.data.status !== "checked_in" && response.data.status !== "checked_out" && response.data.status !== "select_visitor") {
                        setErrorResult({ message: response.data.message || "An error occurred", status: response.data.status });
                        setLastResult(null);
                    } else {
                        setLastResult(response.data);
                        setErrorResult(null);
                    }
                    setCode("");
                    updateUrlCode("");
                    setSelectedPassCode(null);
                },
                onError: (err: any) => {
                    setErrorResult({ message: err.response?.data?.detail || err.response?.data?.message || "An error occurred", status: "error" });
                    setLastResult(null);
                },
            });
        } else {
            setSelectedPassCode(trimmedCode);
            setLastResult(null);
        }
    };

    const handleQRScan = (scannedCode: string) => {
        const trimmedCode = scannedCode.trim().toUpperCase();
        setCode(trimmedCode);
        updateUrlCode(trimmedCode);
        setShowQRScanner(false);
        setLastResult(null);
        setErrorResult(null);
        if (shouldDirectScan(trimmedCode)) {
            handleScan(trimmedCode);
        } else {
            setSelectedPassCode(trimmedCode);
        }
    };

    const handleVisitorAction = (visitor: Visitor, action: "checkin" | "checkout") => {
        const passCodeFromVisitor = visitor.pass_code || (visitor.gate_pass_code && visitor.pass_code_suffix ? `${visitor.gate_pass_code}-${visitor.pass_code_suffix}` : null) || (selectedPassCode && visitor.pass_code_suffix ? `${selectedPassCode}-${visitor.pass_code_suffix}` : selectedPassCode);
        if (!passCodeFromVisitor) return;
        const mutation = action === "checkin" ? checkinMutation : checkoutMutation;
        mutation.mutate({ code: passCodeFromVisitor }, {
            onSuccess: (response) => {
                if (response.data.status && response.data.status !== "checked_in" && response.data.status !== "checked_out" && response.data.status !== "select_visitor") {
                    setErrorResult({ message: response.data.message || "An error occurred", status: response.data.status });
                    setLastResult(null);
                } else {
                    setLastResult(response.data);
                    setErrorResult(null);
                }
                setCode("");
                updateUrlCode("");
                setSelectedPassCode(null);
            },
            onError: (err: any) => {
                setErrorResult({ message: err.response?.data?.detail || err.response?.data?.message || "An error occurred", status: "error" });
                setLastResult(null);
            },
        });
    };

    const isLoading = checkinMutation.isPending || checkoutMutation.isPending;

    if (!router.isReady) return null;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Gate Console</h1>
                <p className="text-muted-foreground">Scan visitor passes and resident badges</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Scan className="h-5 w-5" /> Scan Code</CardTitle>
                    <CardDescription>Enter or scan a pass code to verify entry/exit</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex gap-2">
                        <Button variant={scanType === "checkin" ? "primary" : "outline"} onClick={() => setScanType("checkin")} className="flex-1">Check In</Button>
                        <Button variant={scanType === "checkout" ? "primary" : "outline"} onClick={() => setScanType("checkout")} className="flex-1">Check Out</Button>
                    </div>

                    <div className="flex gap-2">
                        <div className="flex-1 relative">
                            <Input
                                placeholder="Enter pass code or scan QR code"
                                value={code}
                                onChange={(e) => {
                                    const val = e.target.value.toUpperCase();
                                    setCode(val);
                                    updateUrlCode(val);
                                    setSelectedPassCode(null);
                                    setLastResult(null);
                                    setErrorResult(null);
                                }}
                                onKeyPress={(e) => e.key === "Enter" && handleScan()}
                                className="font-mono text-lg pr-10"
                            />
                            <Button variant="ghost" size="sm" onClick={() => setShowQRScanner(true)} className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0" title="Scan QR Code">
                                <QrCode className="h-4 w-4" />
                            </Button>
                        </div>
                        <Button onClick={() => handleScan()} isLoading={isLoading}><Scan className="h-5 w-5 mr-2" /> Scan</Button>
                    </div>

                    {selectedPassCode && !shouldDirectScan(selectedPassCode) && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-lg">Select Visitor</h3>
                                <Button variant="outline" size="sm" onClick={() => { setSelectedPassCode(null); setCode(""); updateUrlCode(""); }}>Clear</Button>
                            </div>
                            {isLoadingVisitors ? <div className="text-center py-8">Loading...</div> : visitors && visitors.length > 0 ? (
                                <div className="border rounded-lg overflow-hidden">
                                    <Table>
                                        <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Pass Code</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                                        <TableBody>
                                            {visitors.map((v: any) => (
                                                <TableRow key={v.id}>
                                                    <TableCell className="font-medium">{v.name}</TableCell>
                                                    <TableCell>{v.email}</TableCell>
                                                    <TableCell className="font-mono">{v.gate_pass_code}-{v.pass_code_suffix}</TableCell>
                                                    <TableCell>
                                                        <Button size="sm" variant={scanType === "checkin" ? "primary" : "outline"} onClick={() => handleVisitorAction(v, scanType)} disabled={isLoading}>
                                                            {scanType === "checkin" ? <LogIn className="h-4 w-4 mr-1" /> : <LogOut className="h-4 w-4 mr-1" />} {scanType === "checkin" ? "Check In" : "Check Out"}
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : <div className="text-center py-8">No visitors found</div>}
                        </div>
                    )}

                    {errorResult && (
                        <div className="p-4 rounded-lg border-2 border-red-500 bg-red-50 dark:bg-red-900/20 flex gap-3">
                            <XCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
                            <div><h3 className="font-semibold text-red-900">Error</h3><p className="text-sm text-red-800">{errorResult.message}</p></div>
                        </div>
                    )}

                    {lastResult && (
                        <div className={`p-4 rounded-lg border-2 ${lastResult.status === "checked_in" || lastResult.status === "checked_out" ? "border-green-500 bg-green-50" : "border-blue-500 bg-blue-50"}`}>
                            <div className="flex gap-3">
                                {lastResult.status === "checked_in" || lastResult.status === "checked_out" ? <CheckCircle className="h-6 w-6 text-green-600" /> : <XCircle className="h-6 w-6 text-blue-600" />}
                                <div>
                                    <h3 className="font-semibold text-lg">{lastResult.message}</h3>
                                    {lastResult.gate_pass && (
                                        <div className="text-sm space-y-1">
                                            <p><span className="font-medium">Pass Code:</span> {lastResult.gate_pass.code}</p>
                                            <p><span className="font-medium">Status:</span> <Badge variant="success">{titleCase(lastResult.gate_pass.status.replace("_", " "))}</Badge></p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {showQRScanner && <QRScanner onScan={handleQRScan} onError={(e) => console.error(e)} onClose={() => setShowQRScanner(false)} />}

            <Card>
                <CardHeader><CardTitle>Instructions</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p>• Select whether you want to check in or check out</p>
                    <p>• Enter the pass code manually or scan a QR code</p>
                    <p>• For 2-part codes (GATE-XXXXX), select a visitor from the list</p>
                    <p>• For 3-part codes (GATE-XXXXX-001), check-in/out happens automatically</p>
                </CardContent>
            </Card>
        </div>
    );
}

GateConsolePage.getLayout = function getLayout(page: ReactElement) {
    return (
        <RouteGuard>
            <DashboardLayout type="admin">
                <AdminPermissionGuard>
                    {page}
                </AdminPermissionGuard>
            </DashboardLayout>
        </RouteGuard>
    );
};
