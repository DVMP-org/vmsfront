"use client";

import { useRouter } from "next/navigation";
import { useAdminDashboard } from "@/hooks/use-admin";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { Building2, Users, CreditCard, Activity, ArrowUpRight, ShieldCheck, Sparkles } from "lucide-react";
import { GatePassStatus } from "@/types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatDate, getFullName, getInitials } from "@/lib/utils";

export default function AdminDashboardPage() {
  const { data: dashboard, isLoading } = useAdminDashboard();
  const router = useRouter();


  if (isLoading) {
    return (
      <DashboardLayout type="admin">
        <div className="grid gap-4 md:grid-cols-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </DashboardLayout>
    );
  }

  const houses = dashboard?.houses || [];
  const residents = dashboard?.residents || [];

  const totalResidents = dashboard?.residents?.length || 0;
  const totalHouses = dashboard?.houses?.length || 0;
  const totalGatePasses = dashboard?.gate_passes?.length || 0;
  const totalGateEvents = dashboard?.gate_events?.length || 0;
  const activeGatePasses = dashboard?.gate_passes?.filter(p => p.status === GatePassStatus.CHECKED_IN).length || 0;

  return (
    <DashboardLayout type="admin">
      <div className="space-y-6">
        <div className="space-y-4 rounded-3xl border bg-gradient-to-br from-[var(--brand-primary,#213928)]/10 via-white to-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-dashed border-[var(--brand-primary,#213928)]/40 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--brand-primary,#213928)]">
                <Sparkles className="h-3.5 w-3.5" />
                Control Tower
              </div>
              <h1 className="mt-3 text-2xl sm:text-xl font-bold text-slate-900">Admin Dashboard</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Monitor occupancy, visitor activity, and admin operations in real time.
              </p>
            </div>
            <div className="flex flex-col gap-2 xs:flex-row">
              <Button variant="outline" onClick={() => router.push("/admin/analytics")}>
                View analytics
              </Button>
              <Button
                type="button"
                className="border-[var(--brand-primary,#213928)] gap-2 text-white bg-[var(--brand-primary,#213928)] hover:bg-[var(--brand-primary,#213928)/90]"
                onClick={() => router.push("/admin/admins/create")}
              >
                Onboard admin
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                title: "Houses",
                value: totalHouses,
                description: "Managed properties",
                icon: Building2,
                accentStart: "rgba(56,189,248,0.22)",
                accentEnd: "rgba(56,189,248,0.08)",
              },
              {
                title: "Residents",
                value: totalResidents,
                description: "Active profiles",
                icon: Users,
                accentStart: "rgba(167,139,250,0.22)",
                accentEnd: "rgba(167,139,250,0.08)",
              },
              {
                title: "Active Passes",
                value: activeGatePasses,
                description: `${totalGatePasses} total issued`,
                icon: CreditCard,
                accentStart: "rgba(251,191,36,0.22)",
                accentEnd: "rgba(251,191,36,0.08)",
              },
              {
                title: "Gate Events",
                value: totalGateEvents,
                description: "Latest scans",
                icon: Activity,
                accentStart: "rgba(16,185,129,0.22)",
                accentEnd: "rgba(16,185,129,0.08)",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Card
                  key={item.title}
                  className="border-none bg-gradient-to-br shadow-none"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${item.accentStart}, ${item.accentEnd})`,
                  }}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{item.title}</CardTitle>
                    <span className="rounded-full bg-white/80 p-2 text-[var(--brand-primary,#213928)] shadow-sm">
                      <Icon className="h-4 w-4" />
                    </span>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-semibold text-slate-900">{item.value}</div>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-dashed">
            <CardHeader className="space-y-1">
              <CardTitle>Operational insight</CardTitle>
              <CardDescription>Live snapshot of access flow</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex items-center justify-between rounded-2xl border bg-muted/60 px-4 py-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Pass utilization</p>
                  <p className="text-2xl font-semibold">{totalGatePasses ? Math.round((activeGatePasses / totalGatePasses) * 100) : 0}%</p>
                  <p className="text-xs text-muted-foreground">Currently checked-in vs issued</p>
                </div>
                <ShieldCheck className="h-10 w-10 text-emerald-500" />
              </div>
              <div className="grid gap-3 text-sm text-muted-foreground">
                <span className="flex items-center justify-between rounded-xl border px-3 py-2">
                  <span>Total gate passes issued</span>
                  <strong className="text-base text-foreground">{totalGatePasses}</strong>
                </span>
                <span className="flex items-center justify-between rounded-xl border px-3 py-2">
                  <span>Active check-ins</span>
                  <strong className="text-base text-foreground">{activeGatePasses}</strong>
                </span>
                <span className="flex items-center justify-between rounded-xl border px-3 py-2">
                  <span>Residents per house</span>
                  <strong className="text-base text-foreground">
                    {totalHouses ? Math.round(totalResidents / totalHouses) : 0}
                  </strong>
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-dashed">
            <CardHeader className="space-y-1">
              <CardTitle>Quick actions</CardTitle>
              <CardDescription>Jump into common admin tasks</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {[
                { label: "Create house", action: () => router.push("/admin/houses"), hint: "Add a property profile" },
                { label: "Add resident", action: () => router.push("/admin/residents/create"), hint: "Link a user to houses" },
                { label: "Issue gate pass", action: () => router.push("/admin/gate"), hint: "Manage visitor access" },
              ].map((cta) => (
                <Button
                  key={cta.label}
                  variant="outline"
                  className="justify-between text-left py-6 rounded-md hover:text-white/80"
                  onClick={cta.action}
                >
                  <span className="">
                    <span className="block font-semibold">{cta.label}</span>
                    <span className="text-xs text-muted-foreground hover:text-white/80">{cta.hint}</span>
                  </span>
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-col gap-1">
              <CardTitle>Recent houses</CardTitle>
              <CardDescription>Latest properties added</CardDescription>
            </CardHeader>
            <CardContent>
              {!houses || houses.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No houses yet
                </p>
              ) : (
                <div className="space-y-3">
                  {houses.slice(0, 5).map((house) => (
                    <article
                      key={house.id}
                      className="flex items-center gap-3 rounded-2xl border px-3 py-3 transition hover:border-[var(--brand-primary,#213928)]/50"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-slate-900">{house.name}</p>
                        <p className="truncate text-sm text-muted-foreground">{house.address}</p>
                      </div>
                      {house.created_at && (
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Added</p>
                          <p className="text-xs font-medium text-foreground">{formatDate(house.created_at)}</p>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-col gap-1">
              <CardTitle>Recent residents</CardTitle>
              <CardDescription>Latest residents added</CardDescription>
            </CardHeader>
            <CardContent>
              {!residents || residents.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No residents yet
                </p>
              ) : (
                <div className="space-y-3">
                  {residents.slice(0, 5).map((resident) => (
                    <article
                      key={resident.user.id}
                      className="flex items-center gap-3 rounded-2xl border px-3 py-3 transition hover:border-[var(--brand-primary,#213928)]/50"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-primary,#213928)]/10 text-[var(--brand-primary,#213928)] font-semibold">
                        {getInitials(resident.user.first_name, resident.user.last_name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-slate-900">
                          {getFullName(resident.user.first_name, resident.user.last_name)}
                        </p>
                        <p className="truncate text-sm text-muted-foreground">{resident.user.email}</p>
                      </div>
                      <Badge variant="secondary">
                        {resident.houses?.length || 0} houses
                      </Badge>
                    </article>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
