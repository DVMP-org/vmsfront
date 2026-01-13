"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft,
  Mail,
  Phone,
  Clock3,
  QrCode,
} from "lucide-react";
import Image from "next/image";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useVisitor } from "@/hooks/use-resident";
import { useAppStore } from "@/store/app-store";
import { useProfile } from "@/hooks/use-auth";

export default function VisitorDetailPage() {
  const router = useRouter();
  const params = useParams<{ houseId?: string; visitorId?: string }>();
  const { selectedHouse, setSelectedHouse } = useAppStore();
  const { data: profile } = useProfile();

  const rawHouseId = params?.houseId;
  const houseId = Array.isArray(rawHouseId) ? rawHouseId[0] : rawHouseId;
  const rawVisitorId = params?.visitorId;
  const visitorId = Array.isArray(rawVisitorId) ? rawVisitorId[0] : rawVisitorId;
  const effectiveHouseId = houseId ?? selectedHouse?.id ?? null;

  useEffect(() => {
    if (!houseId || !profile?.houses) return;
    if (selectedHouse?.id === houseId) return;
    const match = profile.houses.find((house) => house.id === houseId);
    if (match) {
      setSelectedHouse(match);
    }
  }, [houseId, profile?.houses, selectedHouse?.id, setSelectedHouse]);

  const { data: visitor, isLoading } = useVisitor(effectiveHouseId, visitorId ?? null);

  if (!effectiveHouseId) {
    return (
      <>
        <Card>
          <CardContent className="p-10">
            <EmptyState
              icon={QrCode}
              title="Select a house to continue"
              description="Choose a house from the dashboard selector to view visitor details."
              action={{
                label: "Choose House",
                onClick: () => router.push("/select"),
              }}
            />
          </CardContent>
        </Card>
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-3xl" />
          <Skeleton className="h-64 w-full rounded-3xl" />
        </div>
      </>
    );
  }

  if (!visitor) {
    return (
      <>
        <EmptyState
          icon={QrCode}
          title="Visitor not found"
          description="We couldn't load this visitor. They might have been removed."
          action={{
            label: "Back to visitors",
            onClick: () => router.push(`/house/${effectiveHouseId}/visitors`),
          }}
        />
      </>
    );
  }

  const passId = visitor.gate_pass_id;
  const passCode = visitor.pass_code ?? visitor.gate_pass_code ?? "—";

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/house/${effectiveHouseId}/visitors`)}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to visitors
          </Button>
        </div>

        <section className="rounded-3xl bg-gradient-to-br from-[var(--brand-primary,#213928)] to-indigo-700 text-white shadow-xl">
          <div className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-wide text-white/70">Visitor</p>
              <h1 className="text-3xl font-semibold">{visitor.name ?? "Visitor"}</h1>
              <p className="text-white/80">{visitor.email}</p>
            </div>
            <div className="grid gap-2 text-right text-sm">
              <span className="text-white/70">Pass code</span>
              <span className="font-mono text-lg tracking-wide">{passCode}</span>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Contact & metadata</CardTitle>
              <CardDescription>Who this visitor is and when they were created.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <InfoTile icon={Mail} label="Email" value={visitor.email ?? "—"} />
              <InfoTile icon={Phone} label="Phone" value={visitor.phone ?? "—"} />
              <InfoTile
                icon={Clock3}
                label="Created"
                value={visitor.created_at ? format(new Date(visitor.created_at), "PPpp") : "—"}
              />
              <InfoTile
                icon={Clock3}
                label="Updated"
                value={visitor.updated_at ? format(new Date(visitor.updated_at), "PPpp") : "—"}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pass</CardTitle>
              <CardDescription>Linked gate pass and QR code.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-border/60 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Pass code
                </p>
                <p className="font-mono text-lg">{passCode}</p>
                {visitor.gate_pass?.code && (
                  <Badge variant="secondary" className="mt-2">
                    {visitor.gate_pass.code}
                  </Badge>
                )}
              </div>
              {visitor.qr_code_url && (
                <Image
                  src={visitor.qr_code_url}
                  alt="Visitor QR code"
                  width={160}
                  height={160}
                  className="mx-auto h-40 w-40 rounded-2xl border border-border/60 bg-white p-3 shadow-sm object-contain"
                />
              )}
              {passId && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    router.push(`/house/${effectiveHouseId}/passes/${passId}`)
                  }
                >
                  View full pass
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-2">
        <Icon className="h-4 w-4 text-[var(--brand-primary,#213928)]" />
        {label}
      </p>
      <p className="mt-1 text-base font-semibold text-foreground break-all">{value}</p>
    </div>
  );
}
