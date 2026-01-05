"use client";
import { useEffect } from "react";
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
  ArrowRight,
  CalendarClock,
  Clock3,
  Home as HomeIcon,
  MessageCircle,
  Plus,
  Sparkles,
  Ticket,
  Users as UsersIcon,
  Wallet,
} from "lucide-react";
import { formatDateTime, getPassStatusColor, titleCase } from "@/lib/utils";
import { GatePassStatus, type GateEvent, type GatePass } from "@/types";

export default function ResidentDashboardPage() {
  const router = useRouter();
  const params = useParams<{ houseId?: string }>();
  const rawHouseId = params?.houseId;
  const routeHouseId = Array.isArray(rawHouseId) ? rawHouseId[0] : rawHouseId;
  const { selectedHouse, setSelectedHouse } = useAppStore();
  const effectiveHouseId = routeHouseId ?? selectedHouse?.id ?? null;
  const { data: dashboard, isLoading } = useResidentDashboard(effectiveHouseId);
  const { data: wallet } = useWallet();

  useEffect(() => {
    if (dashboard?.house) {
      setSelectedHouse(dashboard.house);
    }
  }, [dashboard?.house, setSelectedHouse]);

  if (!effectiveHouseId) {
    return (
      <>
        <Card>
          <CardContent className="p-10">
            <EmptyState
              icon={HomeIcon}
              title="Select a house to continue"
              description="Choose a house from the dashboard selector to view resident analytics, passes, and visitor activity."
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

  const house = dashboard.house ?? selectedHouse;
  const houseBase = `/house/${effectiveHouseId}`;

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
      pass.max_uses !== null && pass.max_uses !== undefined
        ? `${pass.uses_count}/${pass.max_uses}`
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
      filterable: true,
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
      filterable: true,
      filterType: "select",
      filterOptions: [
        { value: "active", label: "Active" },
        { value: "expired", label: "Expired" },
        { value: "revoked", label: "Revoked" },
        { value: "draft", label: "Draft" },
      ],
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
          onClick={() => router.push(`${houseBase}/passes/${row.id}`)}
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
    statusLabel: "Approved",
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
      filterable: true,
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
      accessor: (row) => <Badge variant="success">{row.statusLabel}</Badge>,
    },
  ];

  type ForumOption = {
    label: string;
    description: string;
    icon: LucideIcon;
  };

  const forumOptions: ForumOption[] = [
    {
      label: "Ask for help",
      description: "Get quick answers from neighbours and estate staff.",
      icon: MessageCircle,
    },
    {
      label: "Share updates",
      description: "Post maintenance alerts, deliveries, or safety notes.",
      icon: Sparkles,
    },
    {
      label: "Plan together",
      description: "Coordinate events, home services, or group buys.",
      icon: UsersIcon,
    },
  ];

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <HomeIcon className="h-4 w-4" />
              <span className="text-sm tracking-wide uppercase">Resident Dashboard</span>
            </div>
            <h1 className="text-3xl font-bold leading-tight">{house?.name ?? "House Dashboard"}</h1>
            {house?.address && (
              <p className="text-sm text-muted-foreground">{house.address}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => router.push(`${houseBase}/passes`)}
            >
              <Ticket className="h-4 w-4" />
              View Passes
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => router.push(`${houseBase}/visitors`)}
            >
              <UsersIcon className="h-4 w-4" />
              Manage Visitors
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => router.push(`${houseBase}/forum`)}
            >
              <MessageCircle className="h-4 w-4" />
              Community Forum
            </Button>
            <Button className="gap-2" onClick={() => router.push(`${houseBase}/passes/create`)}>
              <Plus className="h-4 w-4" />
              Create Pass
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Card
            className="border border-primary/10 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push("/wallet")}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Wallet Balance</p>
                  <p className="text-3xl font-semibold mt-1">
                    {wallet ? new Intl.NumberFormat("en-NG", {
                      style: "currency",
                      currency: "NGN",
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(wallet.balance) : "₦0"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">Click to manage</p>
                </div>
                <div className="rounded-full bg-primary/10 p-3">
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

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
                  <Ticket className="h-5 w-5 text-[var(--brand-primary,#213928)]" />
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
                  <UsersIcon className="h-5 w-5 text-[var(--brand-primary,#213928)]" />
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
                  <Activity className="h-5 w-5 text-[var(--brand-primary,#213928)]" />
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
                  <Clock3 className="h-5 w-5 text-[var(--brand-primary,#213928)]" />
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
                  <CalendarClock className="h-5 w-5 text-[var(--brand-primary,#213928)]" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last gate activity</p>
                  <p className="text-base font-medium">{lastActivity}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <Ticket className="h-5 w-5 text-[var(--brand-primary,#213928)]" />
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

        {/* Forum CTA */}
        <Card className="border border-primary/20 bg-primary/5">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-[var(--brand-primary,#213928)]" />
              <CardTitle>Community Forum</CardTitle>
            </div>
            <CardDescription>
              Coordinate with neighbours, share recommendations, and keep everyone in the loop.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              {forumOptions.map((option) => (
                <div
                  key={option.label}
                  className="flex gap-3 rounded-lg border border-dashed border-primary/30 bg-background/80 p-3"
                >
                  <option.icon className="h-5 w-5 text-[var(--brand-primary,#213928)]" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{option.label}</p>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button className="gap-2" onClick={() => router.push(`${houseBase}/forum`)}>
                <MessageCircle className="h-4 w-4" />
                Visit forum
              </Button>
              <Button
                variant="secondary"
                className="gap-2"
                onClick={() => router.push(`${houseBase}/forum`)}
              >
                <Sparkles className="h-4 w-4" />
                Share an update
              </Button>
            </div>
          </CardContent>
        </Card>

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
                  onClick: () => router.push(`${houseBase}/passes/create`),
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
