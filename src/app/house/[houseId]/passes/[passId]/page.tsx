"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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

export default function PassDetailPage() {
  const params = useParams<{ houseId?: string | string[]; passId?: string | string[] }>();
  const router = useRouter();
  const rawHouseId = params?.houseId;
  const rawPassId = params?.passId;
  const routeHouseId = Array.isArray(rawHouseId) ? rawHouseId[0] : rawHouseId;
  const routePassId = Array.isArray(rawPassId) ? rawPassId[0] : rawPassId;
  const { selectedHouse, setSelectedHouse } = useAppStore();
  const { data: profile } = useProfile();
  const houseId = routeHouseId ?? selectedHouse?.id ?? null;
  const passId = routePassId ?? null;

  const { data: pass, isLoading } = useGatePass(houseId, passId);
  const revokePassMutation = useRevokeGatePass(houseId);
  const [copied, setCopied] = useState(false);
  const [suffixCopied, setSuffixCopied] = useState(false);

  useEffect(() => {
    if (!routeHouseId || !profile?.houses) return;
    if (selectedHouse?.id === routeHouseId) return;
    const match = profile.houses.find((house) => house.id === routeHouseId);
    if (match) {
      setSelectedHouse(match);
    }
  }, [routeHouseId, profile?.houses, selectedHouse?.id, setSelectedHouse]);

  const houseBase = houseId ? `/house/${houseId}` : "/select";

  const handleRevoke = () => {
    if (passId && confirm("Are you sure you want to revoke this pass?")) {
      revokePassMutation.mutate(passId, {
        onSuccess: () => {
          router.push(`${houseBase}/passes`);
        },
      });
    }
  };

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

  if (!houseId || !passId) {
    return (
      <>
        <div className="border border-muted rounded bg-white p-8">
          <EmptyState
            icon={HomeIcon}
            title="Select a house to continue"
            description="Choose a house from the dashboard selector to view pass details."
            action={{
              label: "Choose House",
              onClick: () => router.push("/select"),
            }}
          />
        </div>
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <CardSkeleton />
      </>
    );
  }

  if (!pass) {
    return (
      <>
        <div className="text-center py-12">
          <p className="text-sm text-zinc-500">Pass not found</p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="max-w-4xl mx-auto">
        {/* Compact Header */}
        <div className="flex items-center justify-between border-b border-muted pb-3 mb-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="h-8 px-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-white">Gate Pass Details</h1>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPassStatusColor(pass.status)}`}>
              {titleCase(pass.status)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {/* Left Column: Pass Information */}
          <div className="col-span-2 space-y-4">
            {/* Visitor Info */}
            <div className="border border-muted rounded-xs bg-background">
              <div className="border-b border-muted bg-zinc-50 dark:bg-zinc-900 px-3 py-2">
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Visitor Information</h2>
              </div>
              <div className="divide-y divide-zinc-100">
                {pass.visitors.length === 0 ? (
                  <div className="px-3 py-4 text-sm text-zinc-500">No visitors assigned</div>
                ) : (
                  pass.visitors.map((visitor) => (
                    <div key={visitor.id} className="px-3 py-2.5">
                      <div className="text-sm font-medium text-zinc-900 dark:text-white">{visitor.name}</div>
                      {visitor.email && (
                        <div className="text-xs text-zinc-500 mt-0.5 dark:text-white/50">{visitor.email}</div>
                      )}
                      {visitor.phone && (
                        <div className="text-xs text-zinc-500 dark:text-white/50">{visitor.phone}</div>
                      )}
                      {visitor.pass_code_suffix && (
                        <span className="flex items-center gap-1 text-xs text-zinc-500 dark:text-white/50">
                          <span className="font-mono font-semibold">{pass?.code}-{visitor.pass_code_suffix}</span>
                          {suffixCopied ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4 cursor-pointer" onClick={() => handleCopySuffix(visitor.pass_code_suffix)} />
                          )}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Access Rules */}
            <div className="border border-muted rounded-xs bg-background">
              <div className="border-b border-muted bg-zinc-50 dark:bg-zinc-900 px-3 py-2">
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Access Rules</h2>
              </div>
              <div className="divide-y divide-muted">
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-sm text-zinc-600 dark:text-white/50">Pass Code</span>
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono font-semibold text-zinc-900 dark:text-white">{pass.code}</code>
                    <button
                      onClick={handleCopyCode}
                      className="p-1 hover:bg-zinc-100 rounded transition-colors"
                      title="Copy code"
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5 text-zinc-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 text-zinc-600" />
                      )}
                    </button>
                  </div>
                </div>
                {pass.max_uses && (
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-sm text-zinc-600 dark:text-white/50">Usage Limit</span>
                    <span className="text-sm font-medium text-zinc-900 dark:text-white">
                      {pass.uses_count} / {pass.max_uses} uses
                    </span>
                  </div>
                )}
                {!pass.max_uses && (
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-sm text-zinc-600 dark:text-white/50">Usage Limit</span>
                    <span className="text-sm font-medium text-zinc-900 dark:text-white">Unlimited</span>
                  </div>
                )}
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-sm text-zinc-600 dark:text-white/50">Current Usage</span>
                  <span className="text-sm font-medium text-zinc-900 dark:text-white">{pass.uses_count} scans</span>
                </div>
              </div>
            </div>

            {/* Validity Window */}
            <div className="border border-muted rounded-xs bg-background">
              <div className="border-b border-muted bg-zinc-50 dark:bg-zinc-900 px-3 py-2">
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Validity Window</h2>
              </div>
              <div className="divide-y divide-muted">
                <div className="px-3 py-2">
                  <div className="text-xs text-zinc-500 mb-0.5 dark:text-white/50">Valid From</div>
                  <div className="text-sm font-medium text-zinc-900 dark:text-white">
                    {formatDateTime(pass.valid_from || "")}
                  </div>
                </div>
                <div className="px-3 py-2">
                  <div className="text-xs text-zinc-500 mb-0.5 dark:text-white/50">Valid To</div>
                  <div className="text-sm font-medium text-zinc-900 dark:text-white">
                    {formatDateTime(pass.valid_to || "")}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: QR Code & Actions */}
          <div className="space-y-4">
            {/* QR Code */}
            <div className="border border-muted rounded-xs bg-background">
              <div className="border-b border-muted bg-zinc-50 dark:bg-zinc-900 px-3 py-2">
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">QR Code</h2>
              </div>
              <div className="p-4 flex flex-col items-center">
                {pass.qr_code_url ? (
                  <Image
                    src={pass.qr_code_url}
                    alt="Pass QR Code"
                    width={200}
                    height={200}
                    unoptimized
                    className="w-full max-w-[200px] h-auto object-contain"
                  />
                ) : (
                  <div className="bg-white p-2 rounded">
                    <QRCodeSVG value={pass.code} size={200} />
                  </div>
                )}
                <p className="text-xs text-zinc-500 mt-3 text-center">
                  Share with visitors for gate access
                </p>
              </div>
            </div>

            {/* Primary Actions */}
            <div className="border border-muted rounded-xs bg-background">
              <div className="border-b border-muted bg-zinc-50 dark:bg-zinc-900 px-3 py-2">
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Actions</h2>
              </div>
              <div className="p-3 space-y-2">
                {pass.status === GatePassStatus.CHECKED_IN && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full h-9"
                    onClick={handleRevoke}
                    isLoading={revokePassMutation.isPending}
                  >
                    <Ban className="h-3.5 w-3.5 mr-2" />
                    Revoke Pass
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-9"
                  onClick={() => router.push(`${houseBase}/passes`)}
                >
                  Back to Passes
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
