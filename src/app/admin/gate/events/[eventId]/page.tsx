"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, Activity, Clock3, MapPin, Fingerprint } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAdminGateEvent } from "@/hooks/use-admin";
import { titleCase } from "@/lib/utils";

export default function AdminGateEventDetailPage() {
  const router = useRouter();
  const params = useParams<{ eventId?: string }>();
  const eventId = Array.isArray(params?.eventId) ? params?.eventId[0] : params?.eventId ?? null;

  const { data, isLoading } = useAdminGateEvent(eventId);

  const timeline = useMemo(() => {
    if (!data) return [];
    const entries = [];
    if (data.checkin_time) {
      entries.push({
        label: "Checked in",
        timestamp: data.checkin_time,
      });
    }
    if (data.checkout_time) {
      entries.push({
        label: "Checked out",
        timestamp: data.checkout_time,
      });
    }
    return entries;
  }, [data]);

  return (
    <DashboardLayout type="admin">
      <div className="space-y-6">
        <ButtonRow onBack={() => router.push("/admin/gate/events")} />

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-48 w-full rounded-3xl" />
            <Skeleton className="h-64 w-full rounded-3xl" />
          </div>
        ) : !data ? (
          <EmptyState
            icon={Activity}
            title="Event not found"
            description="This gate event might have been archived."
            action={{
              label: "Back to events",
              onClick: () => router.push("/admin/gate/events"),
            }}
          />
        ) : (
          <>
            <section className="rounded-3xl border border-border/60 bg-card shadow-sm">
              <div className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-wide text-muted-foreground">
                    Gate event
                  </p>
                  <h1 className="text-3xl font-semibold">{titleCase(data.owner_type) ?? "Scan"}</h1>
                  <p className="text-muted-foreground">
                    Linked Pass ID <span className="font-semibold">{data.gate_pass?.code ?? "—"}</span>
                  </p>
                </div>
                <Badge variant="secondary" className="bg-indigo-50 text-indigo-700">
                  {data.gate_pass?.house?.name ? `${data.gate_pass?.house?.name}` : "Unknown house"}
                </Badge>
              </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Event metadata</CardTitle>
                  <CardDescription>Key identifiers for auditing.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <DetailTile label="Event ID" value={data.id} />
                  <DetailTile label="Pass code" value={data?.gate_pass?.code ?? "—"} />
                  <DetailTile
                    label="Created"
                    value={
                      data.created_at
                        ? format(new Date(data.created_at), "MMM d, yyyy HH:mm")
                        : "—"
                    }
                  />
                  <DetailTile
                    label="Scanner ID"
                    value={data?.scanned_by?.name ?? "—"}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Location</CardTitle>
                  <CardDescription>Where this scan was registered.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[var(--brand-primary,#2563eb)]" />
                        {data?.gate_pass?.house_id ?? "No house ID"}
                  </p>
                  <p className="flex items-center gap-2">
                    <Fingerprint className="h-4 w-4 text-[var(--brand-primary,#2563eb)]" />
                        Owner type: {titleCase(data.owner_type) ?? "Unknown"}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Timeline</CardTitle>
                <CardDescription>Entry and exit timestamps.</CardDescription>
              </CardHeader>
              <CardContent>
                {timeline.length === 0 ? (
                  <EmptyState
                    icon={Clock3}
                    title="No timeline entries"
                    description="We do not have timestamps associated with this scan yet."
                  />
                ) : (
                  <div className="space-y-3">
                    {timeline.map((entry) => (
                      <div
                        key={entry.label}
                        className="flex items-center justify-between rounded-2xl border border-border/60 px-4 py-3"
                      >
                        <span className="font-semibold text-foreground">
                          {entry.label}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(entry.timestamp), "PPpp")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

function ButtonRow({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-primary,#2563eb)] transition hover:text-[var(--brand-primary,#2563eb)]/80"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to events
      </button>
    </div>
  );
}

function DetailTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/60 p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-base font-semibold text-foreground break-all">{value}</p>
    </div>
  );
}
