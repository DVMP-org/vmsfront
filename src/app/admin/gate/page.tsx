"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCheckinPass, useCheckoutPass, useVisitorsByPassCode } from "@/hooks/use-admin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { QRScanner } from "@/components/ui/QRScanner";
import { titleCase, cn, formatPassWindow, getTimeRemaining } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock, User, Home as HomeIcon, Calendar, Check, Info,
  Scan, CheckCircle, XCircle, LogIn, LogOut, QrCode
} from "lucide-react";
import { Visitor } from "@/types";

// Helper function to check if pass code is 2-part or 3-part
function getPassCodeParts(code: string): { baseCode: string; suffix: string | null; isThreePart: boolean } {
  const normalized = code.trim().toUpperCase();
  const parts = normalized.split("-");
  if (parts.length >= 3) {
    // 3-part code: GATE-XXXXX-001
    const suffix = parts[parts.length - 1];
    const baseCode = parts.slice(0, -1).join("-");
    return { baseCode, suffix, isThreePart: true };
  } else if (parts.length === 2) {
    // 2-part code: GATE-XXXXX
    return { baseCode: normalized, suffix: null, isThreePart: false };
  }
  // Invalid format
  return { baseCode: normalized, suffix: null, isThreePart: false };
}

function shouldDirectScan(code: string, parts?: ReturnType<typeof getPassCodeParts>) {
  const normalized = code.trim().toUpperCase();
  const resolvedParts = parts ?? getPassCodeParts(normalized);
  const isResidentPass = normalized.startsWith("RES-");
  const isGateThreePart = normalized.startsWith("GATE-") && resolvedParts.isThreePart;
  return isResidentPass || isGateThreePart;
}

const ResultDisplay = ({ result, type }: { result: any, type: "checkin" | "checkout" }) => {
  if (!result) return null;

  const isSuccess = result.status === "checked_in" || result.status === "checked_out" || result.status === "active";
  const isSelectVisitor = result.status === "select_visitor";

  const statusColors = {
    success: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
    warning: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
    error: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
  };

  const currentTheme = isSuccess ? statusColors.success : isSelectVisitor ? statusColors.warning : statusColors.error;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn("mt-6 rounded-xl border-2 p-6 transition-all", currentTheme)}
    >
      <div className="flex items-start gap-4">
        <div className={cn(
          "p-3 rounded-full shrink-0",
          isSuccess ? "bg-green-100 dark:bg-green-900/40" : isSelectVisitor ? "bg-blue-100 dark:bg-blue-900/40" : "bg-red-100 dark:bg-red-900/40"
        )}>
          {isSuccess ? <Check className="h-6 w-6" /> : isSelectVisitor ? <Info className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
        </div>

        <div className="flex-1 space-y-4">
          <div>
            <h3 className="text-xl font-bold uppercase tracking-tight">
              {result.message || (isSuccess ? `${type.replace('in', '-in').replace('out', '-out')} Successful` : "Scan Failed")}
            </h3>
            {isSuccess && (
              <p className="text-sm opacity-80 font-medium">
                {type === "checkin" ? "Person granted entry at" : "Person granted exit at"}{" "}
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>

          {result.gate_pass && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Person Info */}
              <div className="bg-white/50 dark:bg-zinc-900/50 p-4 rounded-lg border border-current/10 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300 font-bold border border-zinc-200 dark:border-zinc-700">
                    {result.owner?.name?.charAt(0).toUpperCase() || <User className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{result.owner?.name || "Unknown User"}</p>
                    <p className="text-xs text-zinc-500">{result.owner?.email || result.owner?.phone || "No contact info"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                  <Badge variant="outline" className="capitalize text-[10px] py-0">{result.owner_type || "Visitor"}</Badge>

                </div>
              </div>

              {/* Pass Context */}
              <div className="bg-white/50 dark:bg-zinc-900/50 p-4 rounded-lg border border-current/10 space-y-2">
                <div className="flex justify-between items-center pb-2 border-b border-current/5">
                  <span className="text-[10px] uppercase font-bold opacity-60">Pass Details</span>
                  <code className="text-xs font-mono font-bold">{result.gate_pass.code}</code>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="opacity-70 flex items-center gap-1.5"><Clock className="h-3 w-3" /> Remaining Uses</span>
                    <span className="font-bold">
                      {result.gate_pass.max_uses
                        ? `${result.gate_pass.max_uses - (result.uses_count || 0)} / ${result.gate_pass.max_uses}`
                        : "Unlimited"}
                    </span>
                  </div>

                  {result.gate_pass.valid_to && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="opacity-70 flex items-center gap-1.5"><Calendar className="h-3 w-3" /> Validity</span>
                      <span className={cn(
                        "font-medium",
                        new Date(result.gate_pass.valid_to) < new Date() ? "text-red-500" : ""
                      )}>
                        {new Date(result.gate_pass.valid_to).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {result?.gate_pass?.residency && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="opacity-70 flex items-center gap-1.5"><HomeIcon className="h-3 w-3" /> Destination</span>
                      <span className="font-medium truncate ml-4 text-right">{result?.gate_pass?.residency?.name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {!isSuccess && !isSelectVisitor && (
            <div className="bg-white/50 dark:bg-zinc-900/50 p-4 rounded-lg border border-red-200 dark:border-red-800/20">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                Authentication failed. Please check the pass details and try again.
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

function GateConsoleContent() {
  const router = useRouter();
  const searchParams = useSearchParams() || new URLSearchParams();
  const [code, setCode] = useState("");
  const [scanType, setScanType] = useState<"checkin" | "checkout">("checkin");
  const [lastResult, setLastResult] = useState<any>(null);
  const [errorResult, setErrorResult] = useState<{ message: string; status?: string } | null>(null);
  const [selectedPassCode, setSelectedPassCode] = useState<string | null>(null);
  const [showQRScanner, setShowQRScanner] = useState(false);

  const checkinMutation = useCheckinPass();
  const checkoutMutation = useCheckoutPass();

  // Initialize code from URL query parameter on mount
  useEffect(() => {
    const codeParam = searchParams.get("code");
    if (codeParam && codeParam !== code) {
      const normalized = codeParam.toUpperCase();
      setCode(normalized);
      const parts = getPassCodeParts(normalized);
      if (!shouldDirectScan(normalized, parts)) {
        setSelectedPassCode(normalized);
      } else {
        setSelectedPassCode(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Update URL query parameter when code changes
  const updateUrlCode = useMemo(() => {
    return (newCode: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (newCode.trim()) {
        params.set("code", newCode.trim().toUpperCase());
      } else {
        params.delete("code");
      }
      router.replace(`?${params.toString()}`, { scroll: false });
    };
  }, [searchParams, router]);

  // Get pass code parts
  const codeParts = useMemo(() => getPassCodeParts(code), [code]);
  const shouldAutoMutate = useMemo(() => shouldDirectScan(code, codeParts), [code, codeParts]);

  // Fetch visitors if it's a 2-part code
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

      mutation.mutate(
        { code: trimmedCode },
        {
          onSuccess: (response) => {
            // Check if response status indicates an error
            if (response.data.status &&
              response.data.status !== "checked_in" &&
              response.data.status !== "active" &&
              response.data.status !== "checked_out" &&
              response.data.status !== "select_visitor") {
              setErrorResult({
                message: response.data.message || "An error occurred",
                status: response.data.status,
              });
              setLastResult(null);
            } else {
              setLastResult(response.data);
              setErrorResult(null);
            }
            setCode("");
            updateUrlCode("");
            setSelectedPassCode(null);
          },
          onError: (error: any) => {
            setErrorResult({
              message: error.response?.data?.detail ||
                error.response?.data?.message ||
                "An error occurred while processing your request",
              status: "error",
            });
            setLastResult(null);
          },
        }
      );
    } else {
      setSelectedPassCode(trimmedCode);
      setLastResult(null);
    }
  };

  const handleQRScan = (scannedCode: string) => {
    const trimmedCode = scannedCode.trim().toUpperCase();
    const parts = getPassCodeParts(trimmedCode);
    const useMutationDirectly = shouldDirectScan(trimmedCode, parts);
    setCode(trimmedCode);
    updateUrlCode(trimmedCode);
    setShowQRScanner(false);
    setLastResult(null);
    setErrorResult(null);

    if (useMutationDirectly) {
      handleScan(trimmedCode);
    } else {
      setSelectedPassCode(trimmedCode);
    }
  };

  const handleVisitorAction = (visitor: Visitor, action: "checkin" | "checkout") => {
    const passCodeFromVisitor =
      visitor.pass_code ||
      (visitor.gate_pass_code && visitor.pass_code_suffix
        ? `${visitor.gate_pass_code}-${visitor.pass_code_suffix}`
        : null) ||
      (selectedPassCode && visitor.pass_code_suffix
        ? `${selectedPassCode}-${visitor.pass_code_suffix}`
        : selectedPassCode);

    if (!passCodeFromVisitor) return;

    const mutation = action === "checkin" ? checkinMutation : checkoutMutation;

    mutation.mutate(
      { code: passCodeFromVisitor },
      {
        onSuccess: (response) => {
          // Check if response status indicates an error
          if (response.data.status &&
            response.data.status !== "active" &&
            response.data.status !== "checked_in" &&
            response.data.status !== "checked_out" &&
            response.data.status !== "select_visitor") {
            setErrorResult({
              message: response.data.message || "An error occurred",
              status: response.data.status,
            });
            setLastResult(null);
          } else {
            setLastResult(response.data);
            setErrorResult(null);
          }
          setCode("");
          updateUrlCode("");
          setSelectedPassCode(null);
        },
        onError: (error: any) => {
          setErrorResult({
            message: error.response?.data?.detail ||
              error.response?.data?.message ||
              "An error occurred while processing your request",
            status: "error",
          });
          setLastResult(null);
        },
      }
    );
  };

  const isLoading = checkinMutation.isPending || checkoutMutation.isPending;
  const isTwoPartCode =
    !!selectedPassCode && !shouldDirectScan(selectedPassCode);

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Gate Console</h1>
          <p className="text-muted-foreground">
            Scan visitor passes and resident badges
          </p>
        </div>

        {/* Scanner */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scan className="h-5 w-5" />
              Scan Code
            </CardTitle>
            <CardDescription>
              Enter or scan a pass code to verify entry/exit
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Scan Type Toggle */}
            <div className="flex gap-2">
              <Button
                variant={scanType === "checkin" ? "primary" : "outline"}
                onClick={() => setScanType("checkin")}
                className="flex-1 rounded-md"
              >
                Check In
              </Button>
              <Button
                variant={scanType === "checkout" ? "primary" : "outline"}
                onClick={() => setScanType("checkout")}
                className="flex-1 rounded-md"
              >
                Check Out
              </Button>
            </div>

            {/* Code Input */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  placeholder="Enter pass code or scan QR code"
                  value={code}
                  onChange={(e) => {
                    const newCode = e.target.value.toUpperCase();
                    setCode(newCode);
                    updateUrlCode(newCode);
                    setSelectedPassCode(null);
                    setLastResult(null);
                    setErrorResult(null);
                  }}
                  onKeyPress={(e) => e.key === "Enter" && handleScan()}
                  className="font-mono text-lg pr-10"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowQRScanner(true)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-accent"
                  title="Scan QR Code"
                >
                  <QrCode className="h-4 w-4" />
                </Button>
              </div>
              <Button
                onClick={() => handleScan()}
                isLoading={isLoading}
              >
                <Scan className="h-5 w-5 mr-2" />
                Scan
              </Button>
            </div>

            {/* Visitor List for 2-part codes */}
            {isTwoPartCode && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Select Visitor</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedPassCode(null);
                      setCode("");
                      updateUrlCode("");
                    }}
                  >
                    Clear
                  </Button>
                </div>

                {isLoadingVisitors ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading visitors...
                  </div>
                ) : visitors && visitors.length > 0 ? (
                  <div className="border rounded-xl overflow-hidden bg-white dark:bg-zinc-900/50 shadow-sm border-zinc-200 dark:border-zinc-800">
                    <Table>
                      <TableHeader className="bg-zinc-50 dark:bg-zinc-800/50">
                        <TableRow>
                          <TableHead className="font-bold text-xs uppercase tracking-wider">Name</TableHead>
                          <TableHead className="font-bold text-xs uppercase tracking-wider">Contact</TableHead>
                          <TableHead className="font-bold text-xs uppercase tracking-wider">Suffix</TableHead>
                          <TableHead className="text-right font-bold text-xs uppercase tracking-wider pr-6">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {visitors.map((visitor) => (
                          <TableRow key={visitor.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                            <TableCell className="py-4">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold ring-1 ring-zinc-200 dark:ring-zinc-700">
                                  {visitor.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="font-semibold text-sm">{visitor.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">{visitor.email || visitor.phone || "—"}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-mono text-[10px] py-0">
                                +{visitor.pass_code_suffix}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right pr-4">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleVisitorAction(visitor, scanType)}
                                disabled={isLoading}
                                className={cn(
                                  "rounded-full h-8 px-4 text-xs font-bold",
                                  scanType === "checkin"
                                    ? "text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                                    : "text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                                )}
                              >
                                {scanType === "checkin" ? "Check In" : "Check Out"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No visitors found for this pass code
                  </div>
                )}
              </div>
            )}

            {/* Error Result */}
            <AnimatePresence mode="wait">
              {errorResult && (
                <ResultDisplay result={errorResult} type={scanType} />
              )}

              {/* Success Result */}
              {lastResult && (
                <ResultDisplay result={lastResult} type={scanType} />
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* QR Scanner Modal */}
        {showQRScanner && (
          <QRScanner
            onScan={handleQRScan}
            onError={(error) => {
              console.error("QR Scanner error:", error);
            }}
            onClose={() => setShowQRScanner(false)}
          />
        )}

        {/* Instructions */}
        <div className="bg-zinc-50 dark:bg-zinc-900/30 rounded-xl p-6 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-4">
            <Info className="h-5 w-5 text-zinc-500" />
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100">Quick Guide</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-xs text-muted-foreground">
            <p>• Select <strong>Check In</strong> or <strong>Check Out</strong> mode</p>
            <p>• Enter pass code or use the <strong>QR icon</strong> to scan</p>
            <p>• 3-part codes (GATE-XXXXX-001) check-in automatically</p>
            <p>• 2-part codes (GATE-XXXXX) require selecting a visitor</p>
            <p>• Approved passes show in <strong>Green</strong>, denied in <strong>Red</strong></p>
            <p>• Valid passes are logged in the <strong>Gate Events</strong> history</p>
          </div>
        </div>
      </div>
    </>
  );
}

export default function GateConsolePage() {
  return (
    <Suspense fallback={
      < >
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </>
    }>
      <GateConsoleContent />
    </Suspense>
  );
}
