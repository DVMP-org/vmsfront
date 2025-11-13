"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useGatePass, useRevokeGatePass } from "@/hooks/use-resident";
import { useAppStore } from "@/store/app-store";
import { useProfile } from "@/hooks/use-auth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { QRCodeSVG } from "qrcode.react";
import { formatDateTime, getPassStatusColor } from "@/lib/utils";
import { ArrowLeft, Ban, Home as HomeIcon } from "lucide-react";
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

  if (!houseId || !passId) {
    return (
      <DashboardLayout type="resident">
        <Card>
          <CardContent className="p-10">
            <EmptyState
              icon={HomeIcon}
              title="Select a house to continue"
              description="Choose a house from the dashboard selector to view pass details."
              action={{
                label: "Choose House",
                onClick: () => router.push("/select"),
              }}
            />
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout type="resident">
        <CardSkeleton />
      </DashboardLayout>
    );
  }

  if (!pass) {
    return (
      <DashboardLayout type="resident">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Pass not found</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout type="resident">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Pass Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Pass Details</CardTitle>
                <Badge className={getPassStatusColor(pass.status)}>
                  {pass.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Pass Code
                </label>
                <p className="text-2xl font-mono font-bold">{pass.code}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Valid Period
                </label>
                <p className="text-sm">
                  {formatDateTime(pass.valid_from || "")}
                  <br />
                  to {formatDateTime(pass.valid_to || "")}
                </p>
              </div>

              {pass.max_uses && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Usage
                  </label>
                  <p className="text-sm">
                    {pass.uses_count} / {pass.max_uses} uses
                  </p>
                </div>
              )}

              {pass.status === GatePassStatus.CHECKED_IN && (
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleRevoke}
                  isLoading={revokePassMutation.isPending}
                >
                  <Ban className="h-4 w-4 mr-2" />
                  Revoke Pass
                </Button>
              )}
            </CardContent>
          </Card>

          {/* QR Code */}
          <Card>
            <CardHeader>
              <CardTitle>QR Code</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-8">
              {pass.qr_code_url ? (
                <Image
                  src={pass.qr_code_url}
                  alt="Pass QR Code"
                  width={256}
                  height={256}
                  unoptimized
                  className="h-64 w-64 object-contain"
                />
              ) : (
                <div className="bg-white p-4 rounded-lg">
                  <QRCodeSVG value={pass.code} size={256} />
                </div>
              )}
              <p className="text-sm text-muted-foreground mt-4 text-center">
                Share this QR code with visitors
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Visitors */}
        <Card>
          <CardHeader>
            <CardTitle>Visitors</CardTitle>
          </CardHeader>
          <CardContent>
            {pass.visitors.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No visitors assigned
              </p>
            ) : (
              <div className="space-y-3">
                {pass.visitors.map((visitor) => (
                  <div
                    key={visitor.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{visitor.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {visitor.email}
                      </p>
                      {visitor.phone && (
                        <p className="text-sm text-muted-foreground">
                          {visitor.phone}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
