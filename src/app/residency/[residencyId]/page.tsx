"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { differenceInHours, formatDistanceToNow } from "date-fns";
import { useResidentDashboard, useWallet } from "@/hooks/use-resident";
import { useAppStore } from "@/store/app-store";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataTable, Column } from "@/components/ui/DataTable";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  Clock3,
  Hash,
  Home as HomeIcon,
  MessageCircle,
  MessageSquarePlus,
  Pin,
  Plus,
  Sparkles,
  Ticket,
  TrendingUp,
  Users as UsersIcon,
  Wallet,
  Lock,
  ChevronRight,
} from "lucide-react";
import { useTriggerEmergencyResident } from "@/hooks/use-emergency";
import { TriggerEmergencyModal } from "@/components/emergencies/TriggerEmergencyModal";
import { CreateGatePassModal } from "@/components/passes/CreateGatePassModal";
import { FundWalletModal } from "@/components/ui/FundWalletModal";
import { useForumTopics } from "@/hooks/use-forum";
import { ForumTopic } from "@/types";
import { formatDateTime, getPassStatusColor, titleCase } from "@/lib/utils";
import { GatePassStatus, type GateEvent, type GatePass, type PaginatedResponse } from "@/types";

export default function ResidentDashboardPage() {
  const router = useRouter();
  const params = useParams<{ residencyId?: string }>();
  const rawResidencyId = params?.residencyId;
  const routeResidencyId = Array.isArray(rawResidencyId) ? rawResidencyId[0] : rawResidencyId;
  const { selectedResidency, setSelectedResidency } = useAppStore();
  const effectiveResidencyId = routeResidencyId ?? selectedResidency?.id ?? null;

  const { data: dashboard, isLoading } = useResidentDashboard(effectiveResidencyId);
  const { data: wallet } = useWallet();
  const [isFundModalOpen, setIsFundModalOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [isCreatePassModalOpen, setIsCreatePassModalOpen] = useState(false);
  const triggerEmergency = useTriggerEmergencyResident();
  const { data: forumData } = useForumTopics(effectiveResidencyId, {
    pageSize: 5,
    sort: "-last_post_at",
  }) as { data: import("@/types").PaginatedResponse<ForumTopic> | undefined };

  useEffect(() => {
    if (dashboard?.residency) {
      setSelectedResidency(dashboard.residency);
    }
  }, [dashboard?.residency, setSelectedResidency]);

  if (!effectiveResidencyId) {
    return (
      <>
        <Card>
          <CardContent className="p-10">
            <EmptyState
              icon={HomeIcon}
              title="Select a residency to continue"
              description="Choose a residency from the dashboard selector to view resident analytics, passes, and visitor activity."
              action={{
                label: "Choose Residency",
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
        <div className="grid gap-4 md:grid-cols-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </>
    );
  }

  if (!dashboard) {
    return (
      <>
        <div className="text-center py-12">
          <p className="text-muted-foreground">No data available</p>
        </div>
      </>
    );
  }

  const residency = dashboard.residency ?? selectedResidency;
  const residencyBase = `/residency/${effectiveResidencyId}`;

  const totalPasses = dashboard.gate_passes.length;
  const activePasses = dashboard.gate_passes.filter(p => p.status === GatePassStatus.CHECKED_IN).length;
  const totalVisitors = dashboard.gate_passes.reduce(
    (acc, pass) => acc + (pass.visitors?.length || 0),
    0
  );
  const expiringPasses = dashboard.gate_passes.filter((pass) => isExpiringSoon(pass.valid_to)).length;

  const sortedEvents = [...dashboard.gate_events].sort(
    (a, b) => new Date(b.checkin_time).getTime() - new Date(a.checkin_time).getTime()
  );
  const latestEvent = sortedEvents[0];
  const lastActivity = latestEvent
    ? formatDistanceToNow(new Date(latestEvent.checkin_time), { addSuffix: true })
    : "No activity yet";

  type PassRow = GatePass & {
    visitorNames: string;
    validWindow: string;
    statusLabel: string;
    usesSummary: string;
  };

  const passRows: PassRow[] = dashboard.gate_passes.map((pass) => ({
    ...pass,
    visitorNames: pass.visitors?.map((visitor) => visitor.name).join(", ") || "No visitors",
    validWindow: formatPassWindow(pass.valid_from, pass.valid_to),
    statusLabel: pass.status,
    usesSummary:
      pass.max_uses !== undefined
        ? `${pass.uses_count}/${pass.max_uses ?? "∞"} used`
        : `${pass.uses_count} used`,
  }));

  const passColumns: Column<PassRow>[] = [
    {
      key: "code",
      header: "Pass",
      sortable: true,
      className: "font-mono text-sm font-semibold",
    },
    {
      key: "visitorNames",
      header: "Visitors",
      sortable: true,
      accessor: (row) =>
        row.visitors && row.visitors.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {row.visitors.map((visitor) => (
              <Badge key={visitor.id} variant="secondary">
                {visitor.name}
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">No visitors</span>
        ),
    },
    {
      key: "validWindow",
      header: "Validity",
      sortable: true,
      accessor: (row) => (
        <div className="flex flex-col text-sm leading-5">
          <span>{row.validWindow}</span>
          {isExpiringSoon(row.valid_to) && (
            <span className="text-xs text-amber-600">Expiring soon</span>
          )}
        </div>
      ),
    },
    {
      key: "statusLabel",
      header: "Status",
      sortable: true,

      accessor: (row) => (
        <Badge className={getPassStatusColor(row.status)}>
          {titleCase(row.statusLabel.replace("_", " "))}
        </Badge>
      ),
    },
    {
      key: "usesSummary",
      header: "Usage",
      sortable: true,
      accessor: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.usesSummary}
        </span>
      ),
    },
    {
      key: "id",
      header: "",
      accessor: (row) => (
        <Button
          variant="ghost"
          size="sm"
          className="gap-1"
          onClick={() => router.push(`${residencyBase}/passes/${row.id}`)}
        >
          View
          <ArrowRight className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  type EventRow = GateEvent & {
    actor: string;
    eventType: string;
    checkIn: string;
    checkOut: string;
    statusLabel: string;
  };

  const eventRows: EventRow[] = dashboard.gate_events.map((event) => ({
    ...event,
    actor: getEventActor(event),
    eventType: event.checkout_time ? "Check-out" : "Check-in",
    checkIn: safeFormatDateTime(event.checkin_time) || "Unknown",
    checkOut: safeFormatDateTime(event.checkout_time) || "—",
    statusLabel: event.checkin_time ? "Approved" : "Pending",
  }));

  const eventColumns: Column<EventRow>[] = [
    {
      key: "eventType",
      header: "Activity",
      sortable: true,
      accessor: (row) => (
        <Badge variant={row.eventType === "Check-in" ? "secondary" : "default"}>
          {row.eventType}
        </Badge>
      ),
    },
    {
      key: "actor",
      header: "Person",
      sortable: true,
      accessor: (row) => <span>{titleCase(row.actor)}</span>
    },
    {
      key: "checkIn",
      header: "Check-in",
      sortable: true,
    },
    {
      key: "checkOut",
      header: "Check-out",
      sortable: true,
    },
    {
      key: "statusLabel",
      header: "Status",
      sortable: true,
      accessor: (row) => <Badge variant={row.checkin_time ? "success" : "warning"}>{row.statusLabel}</Badge>,
    },
  ];

  const recentTopics: ForumTopic[] = forumData?.items ?? [];
  const totalTopics = forumData?.total ?? 0;

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <HomeIcon className="h-4 w-4" />
              <span className="text-sm tracking-wide uppercase">Resident Dashboard</span>
            </div>
            <h1 className="text-3xl font-bold leading-tight">{residency?.name ?? "Residency Dashboard"}</h1>
            {residency?.address && (
              <p className="text-sm text-muted-foreground">{residency.address}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => router.push(`${residencyBase}/passes`)}
            >
              <Ticket className="h-4 w-4" />
              View Passes
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => router.push(`${residencyBase}/visitors`)}
            >
              <UsersIcon className="h-4 w-4" />
              Manage Visitors
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => router.push(`${residencyBase}/forum`)}
            >
              <MessageCircle className="h-4 w-4" />
              Community Forum
            </Button>
            <Button
              className="gap-2 bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700"
              onClick={() => setIsEmergencyModalOpen(true)}
            >
              <AlertTriangle className="h-4 w-4" />
              Report Emergency
            </Button>
            <Button className="gap-2" onClick={() => setIsCreatePassModalOpen(true)}>
              <Plus className="h-4 w-4" />
              Create Pass
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div
            className="relative overflow-hidden rounded-xl shadow-md cursor-pointer group col-span-1"
            style={{ background: "linear-gradient(135deg, rgb(var(--brand-primary)) 0%, rgb(var(--brand-secondary)) 100%)" }}

          >
            {/* Decorative circles */}
            <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-white/5" />
            <div className="pointer-events-none absolute right-4 bottom-0 h-20 w-20 rounded-full bg-white/5" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            <div className="relative z-10 p-6">
              {/* Card label row */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-white/15 p-1.5">
                    <Wallet className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="text-[10px] font-bold tracking-widest text-white/55 uppercase">Resident Wallet</span>
                </div>
                <div className="flex gap-0.5">
                  <div className="h-3 w-3 rounded-full bg-yellow-300/80" />
                  <div className="h-3 w-3 rounded-full bg-white/30 -ml-1" />
                </div>
              </div>
              {/* Balance */}
              <p className="text-[11px] text-white/50 mb-1">Available Balance</p>
              <p className="text-2xl font-bold text-white tracking-tight">
                {wallet ? new Intl.NumberFormat("en-NG", {
                  style: "currency",
                  currency: "NGN",
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(wallet.balance) : "₦0.00"}
              </p>
              {/* Actions */}
              <div className="flex gap-2 mt-4">
                <button
                  className="flex-1 text-[11px] font-bold text-white bg-white/20 hover:bg-white/30 transition-colors rounded-lg py-1.5 px-2"
                  onClick={() => setIsFundModalOpen(true)}
                >
                  Fund
                </button>
                <button
                  className="flex-1 text-[11px] font-semibold text-white/65 hover:text-white border border-white/20 hover:border-white/45 transition-colors rounded-lg py-1.5 px-2"
                  onClick={(e) => { e.stopPropagation(); router.push("/resident/wallet/history"); }}
                >
                  History
                </button>
              </div>
            </div>
          </div>

          <Card className="border border-primary/10 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Active Passes</p>
                  <p className="text-3xl font-semibold mt-1">{activePasses}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {totalPasses} total issued
                  </p>
                </div>
                <div className="rounded-full bg-primary/10 p-3">
                  <Ticket className="h-5 w-5 text-[var(--brand-primary)]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-primary/10 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Visitors Managed</p>
                  <p className="text-3xl font-semibold mt-1">{totalVisitors}</p>
                  <p className="text-xs text-muted-foreground mt-2">Across all passes</p>
                </div>
                <div className="rounded-full bg-primary/10 p-3">
                  <UsersIcon className="h-5 w-5 text-[var(--brand-primary)]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-primary/10 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Gate Activity</p>
                  <p className="text-3xl font-semibold mt-1">{dashboard.gate_events.length}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {dashboard.gate_events_approved} approved entries
                  </p>
                </div>
                <div className="rounded-full bg-primary/10 p-3">
                  <Activity className="h-5 w-5 text-[var(--brand-primary)]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-primary/10 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Upcoming Expirations</p>
                  <p className="text-3xl font-semibold mt-1">{expiringPasses}</p>
                  <p className="text-xs text-muted-foreground mt-2">Next 48 hours</p>
                </div>
                <div className="rounded-full bg-primary/10 p-3">
                  <Clock3 className="h-5 w-5 text-[var(--brand-primary)]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Latest Insights */}
        <Card className="border border-muted">
          <CardContent className="p-5">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <CalendarClock className="h-5 w-5 text-[var(--brand-primary)]" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last gate activity</p>
                  <p className="text-base font-medium">{lastActivity}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <Ticket className="h-5 w-5 text-[var(--brand-primary)]" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Expiring soon</p>
                  <p className="text-base font-medium">
                    {expiringPasses > 0 ? `${expiringPasses} passes` : "No passes expiring"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Forum Section */}
        <div className="rounded-xl border bg-card overflow-hidden shadow-md ring-1 ring-border/50">
          {/* Subtle top accent line */}
          <div className="h-0.5 bg-gradient-to-r from-[rgb(var(--brand-primary)/0.6)] via-[rgb(var(--brand-primary)/0.2)] to-transparent" />
          {/* Header bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-[rgb(var(--brand-primary)/0.1)] p-2">
                <MessageCircle className="h-5 w-5 text-[rgb(var(--brand-primary))]" />
              </div>
              <div>
                <h3 className="font-semibold text-base leading-tight">Community Forum</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {totalTopics > 0 ? `${totalTopics} discussion${totalTopics !== 1 ? "s" : ""}` : "Be the first to start a discussion"}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs"
                onClick={() => router.push(`${residencyBase}/forum`)}
              >
                <TrendingUp className="h-3.5 w-3.5" />
                Browse all
              </Button>
              <Button
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => router.push(`${residencyBase}/forum`)}
              >
                <MessageSquarePlus className="h-3.5 w-3.5" />
                New post
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-[1fr_300px]">
            {/* Recent topics feed */}
            <div className="divide-y">
              {recentTopics.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                  <div className="rounded-full bg-muted p-4 mb-3">
                    <MessageCircle className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="font-medium text-sm">No discussions yet</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-[220px]">
                    Start a conversation — ask a question, share an update, or plan something together.
                  </p>
                  <Button
                    size="sm"
                    className="mt-4 gap-1.5"
                    onClick={() => router.push(`${residencyBase}/forum`)}
                  >
                    <MessageSquarePlus className="h-4 w-4" />
                    Start a discussion
                  </Button>
                </div>
              ) : (
                recentTopics.map((topic) => {
                  const authorName =
                    topic.author_name ||
                    (topic.author
                      ? `${topic.author.first_name ?? ""} ${topic.author.last_name ?? ""}`.trim() ||
                      topic.author.email
                      : "Community member");
                  const timeAgo = topic.last_post_at
                    ? formatDistanceToNow(new Date(topic.last_post_at), { addSuffix: true })
                    : topic.created_at
                      ? formatDistanceToNow(new Date(topic.created_at), { addSuffix: true })
                      : null;

                  const isRecent = topic.last_post_at
                    ? differenceInHours(new Date(), new Date(topic.last_post_at)) < 24
                    : false;

                  return (
                    <button
                      key={topic.id}
                      onClick={() => router.push(`${residencyBase}/forum`)}
                      className={`w-full text-left flex items-start gap-4 px-6 py-4 hover:bg-muted/50 transition-colors group relative ${topic.is_pinned ? "border-l-2 border-[rgb(var(--brand-primary)/0.8)]" : "border-l-2 border-transparent"
                        }`}
                    >
                      {/* Avatar */}
                      <div
                        className="shrink-0 mt-0.5 h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold text-white uppercase shadow-sm ring-2 ring-background"
                        style={{ background: getAvatarGradient(authorName) }}
                      >
                        {authorName.charAt(0)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {topic.is_pinned && (
                              <Pin className="h-3 w-3 text-amber-500 shrink-0" />
                            )}
                            <p className="text-sm font-semibold leading-snug truncate group-hover:text-[rgb(var(--brand-primary))] transition-colors">
                              {topic.title}
                            </p>
                            {isRecent && (
                              <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                New
                              </span>
                            )}
                          </div>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0 bg-muted rounded-full px-2 py-0.5">
                            <MessageCircle className="h-3 w-3" />
                            {topic.posts_count}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          {topic.category && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[rgb(var(--brand-primary)/0.08)] text-[rgb(var(--brand-primary))] border border-[rgb(var(--brand-primary)/0.15)]">
                              <Hash className="h-2.5 w-2.5" />
                              {topic.category.name}
                            </span>
                          )}
                          {topic.is_locked && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-400/20">
                              <Lock className="h-2.5 w-2.5" />
                              Locked
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">{authorName}</span>
                          {timeAgo && (
                            <>
                              <span className="text-muted-foreground/40 text-xs">·</span>
                              <span className="text-xs text-muted-foreground">{timeAgo}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-[rgb(var(--brand-primary)/0.5)] transition-colors shrink-0 self-center" />
                    </button>
                  );
                })
              )}
            </div>

            {/* Right: community quick-actions panel */}
            <div className="border-l bg-muted/10 flex flex-col gap-0 divide-y">
              {/* Quick compose */}
              <div className="px-5 py-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Quick post</p>
                </div>
                <div className="flex flex-col gap-1.5">
                  {[
                    { label: "Ask for help", icon: MessageCircle, desc: "Neighbours & staff can reply" },
                    { label: "Share an update", icon: Sparkles, desc: "Alerts, deliveries, notices" },
                    { label: "Plan together", icon: UsersIcon, desc: "Events, group buys & more" },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={() => router.push(`${residencyBase}/forum`)}
                      className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5 hover:border-[rgb(var(--brand-primary)/0.35)] hover:bg-[rgb(var(--brand-primary)/0.04)] hover:shadow-sm transition-all text-left group"
                    >
                      <div className="rounded-md bg-muted p-1.5 group-hover:bg-[rgb(var(--brand-primary)/0.10)] transition-colors shrink-0">
                        <item.icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-[rgb(var(--brand-primary))] transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold leading-tight">{item.label}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{item.desc}</p>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-[rgb(var(--brand-primary)/0.5)] shrink-0 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Forum stats */}
              <div className="px-5 py-4">
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Forum stats</p>
                <div className="space-y-2">
                  {[
                    { label: "Total discussions", value: totalTopics, icon: MessageCircle },
                    { label: "Active topics", value: recentTopics.filter((t) => !t.is_locked).length, icon: TrendingUp },
                    { label: "Pinned", value: recentTopics.filter((t) => t.is_pinned).length, icon: Pin },
                    { label: "Locked", value: recentTopics.filter((t) => t.is_locked).length, icon: Lock },
                  ].map((stat) => (
                    <div key={stat.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <stat.icon className="h-3 w-3 text-muted-foreground/60" />
                        <span className="text-xs text-muted-foreground">{stat.label}</span>
                      </div>
                      <span className="text-xs font-bold tabular-nums">{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Join CTA */}
              <div className="px-5 py-4 mt-auto">
                <button
                  onClick={() => router.push(`${residencyBase}/forum`)}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-[rgb(var(--brand-primary)/0.08)] hover:bg-[rgb(var(--brand-primary)/0.14)] border border-[rgb(var(--brand-primary)/0.12)] text-[rgb(var(--brand-primary))] text-xs font-semibold py-2.5 transition-all"
                >
                  <MessageSquarePlus className="h-3.5 w-3.5" />
                  Open Community Forum
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Passes Table */}
        <Card>
          <CardHeader>
            <CardTitle>Visitor Passes</CardTitle>
            <CardDescription>Search, filter, and drill into your resident passes</CardDescription>
          </CardHeader>
          <CardContent>
            {passRows.length === 0 ? (
              <EmptyState
                icon={Ticket}
                title="No passes yet"
                description="Create your first visitor pass to welcome guests or vendors."
                action={{
                  label: "Create Pass",
                  onClick: () => setIsCreatePassModalOpen(true),
                }}
              />
            ) : (
              <DataTable
                data={passRows}
                columns={passColumns}
                searchable
                searchPlaceholder="Search passes..."
                pageSize={5}
                showPagination={passRows.length > 5}
                emptyMessage="No passes match your filters"
              />
            )}
          </CardContent>
        </Card>

        {/* Activity Table */}
        <Card>
          <CardHeader>
            <CardTitle>Gate Activity</CardTitle>
            <CardDescription>Monitor the latest check-ins and check-outs for your passes</CardDescription>
          </CardHeader>
          <CardContent>
            {eventRows.length === 0 ? (
              <EmptyState
                icon={Activity}
                title="No gate events recorded"
                description="Once your visitors are scanned at the gate, you'll see the activity here."
              />
            ) : (
              <DataTable
                data={eventRows}
                columns={eventColumns}
                searchable
                searchPlaceholder="Search activity..."
                pageSize={5}
                showPagination={eventRows.length > 5}
                emptyMessage="No activity matches your filters"
              />
            )}
          </CardContent>
        </Card>
      </div>

      <TriggerEmergencyModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
        onSubmit={(data) =>
          triggerEmergency.mutate(data, {
            onSuccess: () => setIsEmergencyModalOpen(false),
          })
        }
        isLoading={triggerEmergency.isPending}
        residencyId={effectiveResidencyId}
      />

      <CreateGatePassModal
        isOpen={isCreatePassModalOpen}
        onClose={() => setIsCreatePassModalOpen(false)}
        residencyId={effectiveResidencyId}
        onSuccess={(passId) =>
          passId
            ? router.push(`${residencyBase}/passes/${passId}`)
            : setIsCreatePassModalOpen(false)
        }
      />

      <FundWalletModal
        isOpen={isFundModalOpen}
        onClose={() => setIsFundModalOpen(false)}
      />
    </>
  );
}

function safeFormatDateTime(value?: string | null): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return formatDateTime(parsed);
}

function formatPassWindow(validFrom?: string | null, validTo?: string | null): string {
  const from = safeFormatDateTime(validFrom);
  const to = safeFormatDateTime(validTo);

  if (!from && !to) {
    return "No time limit";
  }

  if (from && to) {
    return `${from} – ${to}`;
  }

  if (from) {
    return `Starts ${from}`;
  }

  return `Ends ${to}`;
}

function isExpiringSoon(validTo?: string | null): boolean {
  if (!validTo) return false;
  const target = new Date(validTo);
  if (Number.isNaN(target.getTime())) return false;

  const hoursUntil = differenceInHours(target, new Date());
  return hoursUntil >= 0 && hoursUntil <= 48;
}

function getAvatarGradient(name: string): string {
  const gradients = [
    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
    "linear-gradient(135deg, #f7971e 0%, #ffd200 100%)",
    "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)",
  ];
  const idx = (name.charCodeAt(0) ?? 0) % gradients.length;
  return gradients[idx];
}

function getEventActor(event: GateEvent): string {
  const owner: any = event.owner;

  if (owner?.name) {
    return owner.name;
  }

  if (owner?.user?.first_name || owner?.user?.last_name) {
    const first = owner.user.first_name ?? "";
    const last = owner.user.last_name ?? "";
    const combined = `${first} ${last}`.trim();
    if (combined) {
      return combined;
    }
  }

  if (event.owner_type) {
    return event.owner_type.replace(/_/g, " ");
  }

  return "Unknown";
}
