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
import { Scan, CheckCircle, XCircle, LogIn, LogOut, QrCode } from "lucide-react";
import { Visitor } from "@/types";
import { titleCase } from "@/lib/utils";
import { title } from "process";

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

function GateConsoleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Pass Code</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {visitors.map((visitor) => (
                          <TableRow key={visitor.id}>
                            <TableCell className="font-medium">{visitor.name}</TableCell>
                            <TableCell className="text-muted-foreground">{visitor.email}</TableCell>
                            <TableCell className="font-mono text-sm">{visitor?.gate_pass_code + '-' + visitor?.pass_code_suffix || "N/A"}</TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant={scanType === "checkin" ? "primary" : "outline"}
                                onClick={() => handleVisitorAction(visitor, scanType)}
                                disabled={isLoading}
                                className="gap-1"
                              >
                                {scanType === "checkin" ? (
                                  <>
                                    <LogIn className="h-4 w-4" />
                                    Check In
                                  </>
                                ) : (
                                  <>
                                    <LogOut className="h-4 w-4" />
                                    Check Out
                                  </>
                                )}
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
            {errorResult && (
              <div className="p-4 rounded-lg border-2 border-red-500 bg-red-50 dark:bg-red-900/20">
                <div className="flex items-start gap-3">
                  <XCircle className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1 text-red-900 dark:text-red-100">
                      Error
                    </h3>
                    <p className="text-sm text-red-800 dark:text-red-200">
                      {errorResult.message}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setErrorResult(null)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/40"
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Success Result */}
            {lastResult && (
              <div
                className={`p-4 rounded-lg border-2 ${lastResult.status === "checked_in" || lastResult.status === "checked_out"
                  ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                  : lastResult.status === "select_visitor"
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-red-500 bg-red-50 dark:bg-red-900/20"
                  }`}
              >
                <div className="flex items-start gap-3">
                  {(lastResult.status === "checked_in" || lastResult.status === "checked_out") ? (
                    <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
                  ) : lastResult.status === "select_visitor" ? (
                    <XCircle className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-1" />
                  )}
                  <div className="flex-1">
                    <h3 className={`font-semibold text-lg mb-1 ${lastResult.status === "checked_in" || lastResult.status === "checked_out"
                      ? "text-green-900 dark:text-green-100"
                      : lastResult.status === "select_visitor"
                        ? "text-blue-900 dark:text-blue-100"
                        : "text-red-900 dark:text-red-100"
                      }`}>
                      {lastResult.message}
                    </h3>
                    {lastResult.gate_pass && (
                      <div className="space-y-1 text-sm">
                        <p>
                          <span className="font-medium">Pass Code:</span>{" "}
                          {lastResult.gate_pass.code}
                        </p>
                        <p>
                          <span className="font-medium">Status:</span>{" "}
                          <Badge
                            variant={
                              lastResult.gate_pass.status === "checked_in" ||
                                lastResult.gate_pass.status === "active"
                                ? "success"
                                : "danger"
                            }
                          >
                            {titleCase(lastResult.gate_pass.status.replace("_", " "))}
                          </Badge>
                        </p>
                        {lastResult.owner && (
                          <p>
                            <span className="font-medium">Owner:</span>{" "}
                            {titleCase(lastResult.owner.name)}
                          </p>
                        )}
                        {lastResult.uses_count && (
                          <p>
                            <span className="font-medium">Uses Count:</span>{" "}
                            {lastResult.uses_count}
                          </p>
                        )}
                        {lastResult.gate_pass.max_uses && (
                          <p>
                            <span className="font-medium">Max Uses:</span>{" "}
                            {lastResult.gate_pass.max_uses}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
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
        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• Select whether you want to check in or check out</p>
            <p>• Enter the pass code manually or click the QR icon to scan a QR code</p>
            <p>• QR scanner uses your device camera - grant camera permissions when prompted</p>
            <p>• For 2-part codes (GATE-XXXXX), select a visitor from the list</p>
            <p>• For 3-part codes (GATE-XXXXX-001), check-in/out happens automatically</p>
            <p>• The system will validate the pass and log the event</p>
            <p>• Approved passes will show in green, denied in red</p>
          </CardContent>
        </Card>
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
