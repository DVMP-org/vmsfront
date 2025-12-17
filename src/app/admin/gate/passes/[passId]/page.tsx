"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, User, Mail, Phone, Clock3, QrCode, ChevronDown } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";
import { GatePassStatus } from "@/types";
import { useAdminGatePass, useAdminGatePassEvents } from "@/hooks/use-admin";

export default function AdminGatePassDetailPage() {
  const router = useRouter();
  const params = useParams<{ passId?: string }>();
  const passId = Array.isArray(params?.passId) ? params?.passId[0] : params?.passId ?? null;

  const INITIAL_VISIBLE = 5;
  const [visibleEvents, setVisibleEvents] = useState(INITIAL_VISIBLE);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const { data, isLoading } = useAdminGatePass(passId);
  const {
    data: events = [],
    isLoading: isEventsLoading,
  } = useAdminGatePassEvents(passId, { page: 1, pageSize: 50 });

  useEffect(() => {
    setVisibleEvents(INITIAL_VISIBLE);
    setExpandedEventId(null);
  }, [passId]);

  const timeline = useMemo(
    () => events.slice(0, visibleEvents),
    [events, visibleEvents]
  );

  const metadata = useMemo(() => {
    if (!data) return null;
    return [
      { label: "Pass code", value: data.code },
      {
        label: "Valid window",
        value:
          data.valid_from && data.valid_to
            ? `${format(new Date(data.valid_from), "MMM d, yyyy")} – ${format(
              new Date(data.valid_to),
              "MMM d, yyyy"
            )}`
            : "Flexible / on demand",
      },
      {
        label: "Uses",
        value: `${data.uses_count}/${data.max_uses ?? "∞"}`,
      },
      {
        label: "Created",
        value: data.created_at ? format(new Date(data.created_at), "MMM d, yyyy HH:mm") : "N/A",
      },
      {
        label: "Last updated",
        value: data.updated_at ? format(new Date(data.updated_at), "MMM d, yyyy HH:mm") : "N/A",
      },
    ];
  }, [data]);

  return (
    <DashboardLayout type="admin">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/admin/gate/passes")}>
            <ArrowLeft className="h-4 w-4" />
            Back to passes
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-48 w-full rounded-3xl" />
            <Skeleton className="h-64 w-full rounded-3xl" />
          </div>
        ) : !data ? (
          <EmptyState
            icon={QrCode}
            title="Pass not found"
            description="We couldn’t find that gate pass. It may have been revoked."
            action={{
              label: "Back to passes",
              onClick: () => router.push("/admin/gate/passes"),
            }}
          />
        ) : (
          <>
                <section className="rounded-3xl border border-border/60 bg-gradient-to-br from-[var(--brand-primary,#213928)]/90 to-indigo-700 text-white shadow-xl">
              <div className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-wide text-white/80">Gate pass</p>
                  <h1 className="text-3xl font-semibold">{data.code}</h1>
                  <p className="text-white/80">
                    Issued for house ID <span className="font-semibold">{data.house_id}</span>
                  </p>
                </div>
                <Badge variant="secondary" className="bg-white/20 text-white">
                  {renderStatusLabel(data.status)}
                </Badge>
              </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Pass details</CardTitle>
                  <CardDescription>Everything we know about this pass.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  {metadata?.map((item) => (
                    <div key={item.label} className="rounded-2xl border border-border/60 p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        {item.label}
                      </p>
                      <p className="text-base font-semibold text-foreground">{item.value}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Visitors linked</CardTitle>
                  <CardDescription>Recent guests tied to this pass.</CardDescription>
                </CardHeader>
                <CardContent>
                  {data.visitors?.length ? (
                    <div className="space-y-3">
                      {data.visitors.map((visitor) => (
                        <div
                          key={visitor.id}
                          className="rounded-2xl border border-border/60 p-3 text-sm"
                        >
                          <p className="font-semibold text-foreground">
                            {visitor.name ?? visitor.email}
                          </p>
                          <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                            {visitor.email && (
                              <span className="inline-flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {visitor.email}
                              </span>
                            )}
                            {visitor.phone && (
                              <span className="inline-flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {visitor.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No visitors have been attached to this pass.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Scan activity</CardTitle>
                <CardDescription>
                  Event history for this pass (check-ins, check-outs, overrides).
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isEventsLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: INITIAL_VISIBLE }).map((_, index) => (
                      <Skeleton key={index} className="h-12 w-full rounded-xl" />
                    ))}
                  </div>
                ) : timeline.length > 0 ? (
                  <>
                    <div className="space-y-3">
                      {timeline.map((event) => {
                        const isExpanded = expandedEventId === event.id;
                        return (
                        <div
                          key={event.id}
                            className="rounded-2xl border border-border/60 p-4 transition hover:border-[var(--brand-primary,#213928)]/50"
                          onClick={() =>
                            setExpandedEventId((prev) =>
                              prev === event.id ? null : event.id
                            )
                          }
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold capitalize text-foreground">
                                {event.owner_type ?? "scan"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Scanner: {event.scanned_by_id ?? "—"}
                              </p>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {event.created_at
                                ? format(new Date(event.created_at), "PPpp")
                                : "—"}
                            </span>
                            <ChevronDown
                              className={cn(
                                "h-4 w-4 text-muted-foreground transition",
                                isExpanded && "rotate-180 text-foreground"
                              )}
                            />
                          </div>
                          {isExpanded && (
                            <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                              {event.owner && (
                                <div className="rounded-xl border border-dashed border-border/60 bg-muted/30 px-3 py-2">
                                  {event.owner.name ?? event.owner.email ?? "—"}
                                </div>
                              )}
                              {event.house_id && (
                                <p className="text-xs uppercase tracking-wide">
                                  House: {event.house_id}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                      })}
                    </div>
                    <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <p className="text-xs text-muted-foreground">
                        Showing {timeline.length} of {events.length} scans
                      </p>
                      {visibleEvents < events.length && (
                        <Button
                          variant="secondary"
                          className="w-full md:w-auto"
                          onClick={() =>
                            setVisibleEvents((prev) => prev + INITIAL_VISIBLE)
                          }
                        >
                          Load older scans
                        </Button>
                      )}
                    </div>
                  </>
                ) : (
                  <EmptyState
                    icon={Clock3}
                    title="No scans yet"
                    description="When this pass is used at the gate, the event timeline will populate automatically."
                  />
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

function renderStatusLabel(status: GatePassStatus) {
  switch (status) {
    case GatePassStatus.CHECKED_IN:
      return "Checked in";
    case GatePassStatus.CHECKED_OUT:
      return "Checked out";
    case GatePassStatus.PENDING:
      return "Pending";
    case GatePassStatus.COMPLETED:
      return "Completed";
    case GatePassStatus.REVOKED:
      return "Revoked";
    case GatePassStatus.EXPIRED:
      return "Expired";
    default:
      return status;
  }
}
