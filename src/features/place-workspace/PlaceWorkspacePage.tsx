"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  History,
  MapPin,
  Megaphone,
  Plus,
  ReceiptText,
  Search,
  Ticket,
  UserRound,
  Users,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Drawer } from "@/components/ui/Drawer";
import { Modal } from "@/components/ui/Modal";
import { Avatar } from "@/components/ui/Avatar";
import { Field, fieldControlClassName } from "@/components/ui/form/Field";
import { FormDrawer, FormRecordSummary } from "@/components/ui/form/FormDrawer";
import { FormSection } from "@/components/ui/form/FormSection";
import { domainExperience } from "@/config/domains";
import { AccessWorkspace } from "@/features/access-journey/AccessWorkspace";
import { accessJourneyApi } from "@/features/access-journey/api";
import { myChargesApi } from "@/features/charges/my-charges/api";
import { GuestStayDashboard } from "@/features/guest-stay/GuestStayDashboard";
import { PlaceSettingsPage } from "@/features/place-settings/PlaceSettingsPage";
import { ProfilePage } from "@/features/profile/ProfilePage";
import { qualifiedPlaceName, roleLabel } from "@/features/workspaces/catalog";
import { useMediaQuery } from "@/hooks/use-media-query";
import { parseApiError } from "@/lib/error-utils";
import { cn } from "@/lib/utils";
import { MovementsSection } from "./MovementsSection";
import { PartyBadgeStrip } from "./PartyBadgeStrip";
import { VisitorsSection } from "./VisitorsSection";
import {
  placeWorkspaceApi,
  type Announcement,
  type MaintenanceInput,
  type PersonalMaintenance,
  type PlaceCharge,
} from "./api"; import { usePlaceWorkspace } from "./PlaceWorkspaceShell";
import {
  placeWorkspaceNavigation,
  workspaceSectionAllowed,
} from "./navigation";
import {
  EmptyRow,
  IconTile,
  PageHeading,
  PlaceRowSkeleton,
  SectionCard,
  StatusPill,
  Tabs,
  formatMoney,
  listRowClass,
  surfaceClass,
  surfacePad,
  titleCaseStatus,
} from "./ui";

const date = (value: string) =>
  new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
const day = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
const time = (value: string) =>
  new Date(value).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

const cadenceLabels: Record<string, string> = {
  one_time: "One-off",
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  biannual: "Twice yearly",
  yearly: "Yearly",
};

/** Cadences ordered from finest to coarsest, matching the server allow-list. */
const cadenceOrder = [
  "one_time",
  "daily",
  "weekly",
  "monthly",
  "quarterly",
  "biannual",
  "yearly",
];

function cadenceLabel(value?: string | null) {
  if (!value) return "—";
  return cadenceLabels[value] ?? titleCaseStatus(value);
}

/** A payer may only acknowledge the same cadence or a coarser one. */
function allowedCadences(baseline?: string | null) {
  const index = cadenceOrder.indexOf(baseline ?? "");
  if (index < 0 || baseline === "one_time") return ["one_time"];
  return cadenceOrder.slice(index).filter((item) => item !== "one_time");
}

const announcementPriorities = ["low", "normal", "high", "urgent"] as const;
type AnnouncementPriority = (typeof announcementPriorities)[number];

const maintenanceSteps = [
  "Reported",
  "Assigned",
  "In progress",
  "Resolved",
] as const;

function maintenanceStep(status: string) {
  if (status === "resolved" || status === "closed") return 3;
  if (status === "in_progress") return 2;
  if (status === "assigned" || status === "triaged") return 1;
  return 0;
}

function maintenanceBucket(status: string) {
  if (status === "resolved" || status === "closed") return "resolved";
  if (status === "in_progress") return "in_progress";
  return "open";
}

/** Short human reference for a request id, e.g. MR-4F2A. */
function ticketRef(id: string) {
  return `MR-${id.replace(/[^0-9a-zA-Z]/g, "").slice(-4).toUpperCase()}`;
}

function announcementTone(priority?: string | null): AnnouncementPriority {
  const value = (priority ?? "normal") as AnnouncementPriority;
  return announcementPriorities.includes(value) ? value : "normal";
}

function announcementPriorityRank(priority?: string | null) {
  return announcementPriorities.indexOf(announcementTone(priority));
}

function announcementPriorityLabel(priority?: string | null) {
  const labels: Record<AnnouncementPriority, string> = {
    low: "FYI",
    normal: "Notice",
    high: "Important",
    urgent: "Urgent",
  };
  return labels[announcementTone(priority)];
}

const announcementStyles: Record<
  AnnouncementPriority,
  {
    row: string;
    border: string;
    accentText: string;
    icon: string;
    badge: "neutral" | "info" | "warning" | "danger";
    Icon: typeof Megaphone;
  }
> = {
  low: {
    row: "bg-[var(--vms-surface-subtle)]",
    border: "border-[var(--vms-line)]",
    accentText: "text-[var(--vms-ink-muted)]",
    icon: "bg-white text-[var(--vms-ink-muted)]",
    badge: "neutral",
    Icon: Megaphone,
  },
  normal: {
    row: "bg-[var(--vms-surface)]",
    border: "border-[var(--vms-line)]",
    accentText: "text-[var(--vms-info)]",
    icon: "bg-[var(--vms-surface-subtle)] text-[var(--vms-action)]",
    badge: "info",
    Icon: Megaphone,
  },
  high: {
    row: "bg-[var(--vms-coral-soft)]",
    border: "border-[color-mix(in_srgb,var(--vms-warning-accent)_35%,white)]",
    accentText: "text-[var(--vms-focus)]",
    icon: "bg-white/70 text-[var(--vms-focus)]",
    badge: "warning",
    Icon: AlertTriangle,
  },
  urgent: {
    row: "bg-[var(--vms-danger-subtle)]",
    border: "border-[var(--vms-danger)]",
    accentText: "text-[var(--vms-danger)]",
    icon: "bg-white text-[var(--vms-danger)]",
    badge: "danger",
    Icon: AlertTriangle,
  },
};

const announcementShadows = [
  "shadow-[0_12px_28px_-16px_rgba(15,27,49,0.32)]",
  "shadow-[0_7px_18px_-13px_rgba(15,27,49,0.24)]",
  "shadow-[0_4px_12px_-10px_rgba(15,27,49,0.18)]",
] as const;

function AnnouncementAlert({
  tone,
  title,
  meta,
  href,
  depth = 0,
  onDismiss,
}: {
  tone: AnnouncementPriority;
  title: string;
  meta: string;
  href: string;
  /** 0 = foreground card; higher values are recessed layers. */
  depth?: number;
  onDismiss?: () => void;
}) {
  const style = announcementStyles[tone];
  const Icon = style.Icon;
  return (
    <div
      data-priority={tone}
      className={cn(
        "relative flex min-h-12 items-center gap-2.5",
        "rounded-[10px] border px-3 py-2",
        announcementShadows[Math.min(depth, announcementShadows.length - 1)],
        "transition-all duration-200",
        style.row,
        style.border,
      )}
    >
      <Icon
        aria-hidden
        className={cn("h-4 w-4 shrink-0", style.accentText)}
      />
      <Badge variant={style.badge}>{announcementPriorityLabel(tone)}</Badge>
      <p className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--vms-ink)]">
        {title}
      </p>
      <span className="hidden shrink-0 text-[11px] text-[var(--vms-ink-muted)] sm:block">
        {meta}
      </span>
      <Link
        href={href}
        className="shrink-0 text-[11px] font-semibold text-[var(--vms-ink)] underline decoration-[var(--vms-line-strong)] underline-offset-4 hover:decoration-[var(--vms-ink)]"
      >
        View more
      </Link>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label={`Dismiss ${title}`}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-[var(--vms-ink-muted)] transition hover:bg-white/70 hover:text-[var(--vms-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]"
        >
          <span aria-hidden className="text-base leading-none">
            ×
          </span>
        </button>
      ) : null}
    </div>
  );
}
const relative = (value: string) => {
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return day(value);
  const minutes = Math.round((Date.now() - then) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} d ago`;
  return day(value);
};
/** Dismissed announcement ids survive reloads for this Party + Place. */
function readDismissedAnnouncements(key: string): string[] {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

const initials = (value: string) =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "V";
/** Friendly bucket label used by the dashboard activity feed. */
const dayBucket = (value: string) => {
  const target = new Date(value);
  if (Number.isNaN(target.getTime())) return "Earlier";
  const startOfDay = (date: Date) => {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    return copy.getTime();
  };
  const diff = Math.round(
    (startOfDay(new Date()) - startOfDay(target)) / 86_400_000,
  );
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return target.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
};
/** `Starting now`, `in 3 h`, `in 2 days` for the upcoming visits card. */
function visitCountdown(value: string) {
  const diff = new Date(value).getTime() - Date.now();
  if (diff <= 0) return "Starting now";
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `in ${Math.max(1, minutes)} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `in ${hours} h`;
  const days = Math.floor(hours / 24);
  return `in ${days} day${days === 1 ? "" : "s"}`;
}
function State({
  query,
  children,
  rows = 3,
}: {
  query: {
    isPending: boolean;
    isError: boolean;
    error: unknown;
    refetch: () => unknown;
  };
  children: React.ReactNode;
  rows?: number;
}) {
  if (query.isPending) return <PlaceRowSkeleton rows={rows} />;
  if (query.isError)
    return (
      <div
        role="alert"
        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--vms-danger)] bg-[var(--vms-danger-subtle)] px-3 py-2.5 text-sm text-[var(--vms-danger)]"
      >
        <p className="min-w-0">{parseApiError(query.error).message}</p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            void query.refetch();
          }}
        >
          Retry
        </Button>
      </div>
    );
  return <>{children}</>;
}
function Pagination({
  page,
  more,
  onPage,
  total,
}: {
  page: number;
  more: boolean;
  onPage: (page: number) => void;
  total?: number;
}) {
  if (page === 1 && !more) return null;
  return (
    <div className="mt-3 flex items-center justify-between gap-2 border-t border-[var(--vms-line)] pt-3">
      <Button
        size="sm"
        variant="outline"
        disabled={page === 1}
        onClick={() => onPage(page - 1)}
      >
        Previous
      </Button>
      <span className="text-xs text-[var(--vms-ink-muted)]">
        Page {page}
        {typeof total === "number" ? ` · ${total} total` : ""}
      </span>
      <Button
        size="sm"
        variant="outline"
        disabled={!more}
        onClick={() => onPage(page + 1)}
      >
        Next
      </Button>
    </div>
  );
}
const sectionDescription: Record<string, (placeName: string) => string> = {
  overview: (placeName) => `Everything happening at ${placeName} today.`,
  invitations: (placeName) =>
    `Create and manage visitor invitations for ${placeName}.`,
  visitors: () => "People on your invitations and the state of their access.",
  movements: () => "Entry and exit activity recorded for your visitors.",
  announcements: (placeName) => `Notices published for ${placeName}.`,
  charges: (placeName) =>
    `Charges and payment records for ${placeName}.`,
  maintenance: () => "Requests you raised and their current progress.",
  profile: () => "Your shared identity, contact details and profile photo.",
  settings: (placeName) => `Preferences for ${placeName}.`,
};

export function PlaceWorkspacePage({ section }: { section: string }) {
  const context = usePlaceWorkspace();
  const navigation = placeWorkspaceNavigation(context);
  const placeName = qualifiedPlaceName(context.place);
  const title =
    navigation
      .flatMap((group) => group.items)
      .find(
        (item) =>
          item.href.split("/").at(-1) === section ||
          (section === "overview" &&
            item.href === `/workspace/${context.place.id}`),
      )?.label ?? "Workspace";
  if (!workspaceSectionAllowed(context, section))
    return (
      <div className={cn(surfaceClass, surfacePad)}>
        <EmptyRow
          icon={Building2}
          title="Page unavailable"
          description="This page is not available for your Place relationship or the modules enabled at this property."
          action={
            <Button asChild variant="outline" className="mt-2">
              <Link href={`/workspace/${context.place.id}`}>
                Back to overview
              </Link>
            </Button>
          }
        />
      </div>
    );
  const relationship = context.relationships[0];
  return (
    <div className="space-y-5">
      <PageHeading
        eyebrow={context.place.name}
        title={title}
        description={(sectionDescription[section] ?? (() => undefined))(
          placeName,
        )}
      />
      {section === "overview" && <Overview />}
      {section === "invitations" && (
        <AccessWorkspace
          relationship={relationship}
          partyName={context.party.display_name}
          partyEmail={context.party.email}
          siteId={context.site_id}
        />
      )}
      {section === "visitors" && <Visitors />}
      {section === "movements" && <Movements />}
      {section === "announcements" && <Announcements />}
      {section === "charges" && <Charges />}
      {section === "maintenance" && <Maintenance />}
      {section === "profile" && <ProfilePage audience="resident" />}
      {section === "settings" && <PlaceSettingsPage />}
    </div>
  );
}
function Overview() {
  const context = usePlaceWorkspace();
  const { place, party } = context;
  const dismissedKey = `vms.announcements.dismissed.${party.id}.${place.id}`;
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  // Load after hydration so the server and first client render agree.
  useEffect(() => {
    setDismissedAlerts(readDismissedAnnouncements(dismissedKey));
  }, [dismissedKey]);
  function dismissAnnouncement(id: string) {
    setDismissedAlerts((current) => {
      if (current.includes(id)) return current;
      const next = [...current, id];
      try {
        window.localStorage.setItem(dismissedKey, JSON.stringify(next));
      } catch {
        // Storage can be unavailable; the in-memory dismissal still applies.
      }
      return next;
    });
  }
  const definition = domainExperience(context.effective_use_case);
  const announcements = useQuery({
    queryKey: ["place-announcements", place.id, party.id],
    queryFn: () => placeWorkspaceApi.announcements(place.id),
    retry: false,
  });
  const charges = useQuery({
    queryKey: ["place-charges", place.id, party.id, 1],
    queryFn: () => placeWorkspaceApi.charges(place.id, 1),
    retry: false,
  });
  const invitations = useQuery({
    queryKey: ["workspace", "visit-authorizations", place.id, party.id],
    queryFn: () => accessJourneyApi.list(place.id),
    retry: false,
  });
  const maintenance = useQuery({
    queryKey: ["place-maintenance", place.id, 1],
    queryFn: () => placeWorkspaceApi.maintenance(place.id, 1),
    retry: false,
  });
  const movements = useQuery({
    queryKey: ["place-movements", place.id, party.id, 1],
    queryFn: () => placeWorkspaceApi.movements(place.id, 1),
    retry: false,
  });

  const nextDue = useMemo(
    () =>
      (charges.data?.items ?? [])
        .filter((item) => Number(item.balance) > 0)
        .sort(
          (left, right) =>
            new Date(left.due_date).getTime() -
            new Date(right.due_date).getTime(),
        )[0],
    [charges.data],
  );
  const alerts = useMemo(
    () =>
      [...(announcements.data ?? [])]
        .filter((item) => !dismissedAlerts.includes(item.id))
        .sort((left, right) => {
          const rank =
            announcementPriorityRank(right.priority) -
            announcementPriorityRank(left.priority);
          if (rank !== 0) return rank;
          return (
            new Date(right.published_at).getTime() -
            new Date(left.published_at).getTime()
          );
        })
        .slice(0, 3),
    [announcements.data, dismissedAlerts],
  );
  const upcoming = useMemo(() => {
    const now = Date.now();
    const terminal = new Set([
      "declined",
      "cancelled",
      "revoked",
      "expired",
    ]);
    return (invitations.data?.items ?? [])
      .filter((item) => {
        // Approval status is not the signal: a visitor who is already on site
        // is excluded, and only visits with time left are "upcoming".
        const effective = item.display_status ?? item.status;
        if (terminal.has(item.status) || effective === "expired") return false;
        if (effective === "active") return false;
        return new Date(item.valid_to).getTime() >= now;
      })
      .sort(
        (left, right) =>
          new Date(left.valid_from).getTime() -
          new Date(right.valid_from).getTime(),
      )
      .slice(0, 3);
  }, [invitations.data]);
  // A request the party has closed stays out of the dashboard for good.
  const requests = (maintenance.data?.items ?? [])
    .filter((item) => item.status !== "closed")
    .slice(0, 2);
  const openCharges = useMemo(
    () =>
      (charges.data?.items ?? [])
        .filter((item) => Number(item.balance) > 0)
        .sort(
          (left, right) =>
            new Date(left.due_date).getTime() -
            new Date(right.due_date).getTime(),
        ),
    [charges.data],
  );
  const outstanding = openCharges.reduce(
    (total, item) => total + Number(item.balance),
    0,
  );
  const chargeCurrency = charges.data?.items[0]?.currency;
  const overdueCount = openCharges.filter(
    (item) => new Date(item.due_date).getTime() < Date.now(),
  ).length;
  const payNext = useMutation({
    mutationFn: myChargesApi.pay,
    onSuccess: (checkout) => window.location.assign(checkout.authorization_url),
  });
  const activity = useMemo(() => {
    const entries = [
      ...(movements.data?.items ?? []).slice(0, 3).map((item) => ({
        id: `movement-${item.id}`,
        icon: History,
        title: `${item.person_name ?? "Visitor"} · ${item.direction === "entry" ? "entry" : "exit"
          } ${item.outcome}`,
        meta: `${item.gate_name} · ${titleCaseStatus(item.reason_code)}`,
        when: item.occurred_at,
        tone: (item.outcome === "allowed" ? "success" : "danger") as
          | "success"
          | "danger",
      })),
      ...(maintenance.data?.items ?? []).slice(0, 2).map((item) => ({
        id: `request-${item.id}`,
        icon: Wrench,
        title: item.title,
        meta: `Maintenance · ${titleCaseStatus(item.status)}`,
        when: item.created_at,
        tone: "neutral" as const,
      })),
      ...(charges.data?.items ?? []).slice(0, 2).map((item) => ({
        id: `charge-${item.id}`,
        icon: ReceiptText,
        title: item.title,
        meta: `Charge · ${formatMoney(item.balance, item.currency)} ${Number(item.balance) > 0 ? "outstanding" : "settled"
          }`,
        when: item.due_date,
        tone: (Number(item.balance) > 0 ? "warning" : "success") as
          | "warning"
          | "success",
      })),
      ...(invitations.data?.items ?? []).slice(0, 2).map((item) => ({
        id: `invitation-${item.id}`,
        icon: Ticket,
        title: `Invitation for ${item.guests[0]?.display_name_snapshot ?? "a visitor"
          }`,
        meta: `Invitation · ${titleCaseStatus(item.status)}`,
        when: item.requested_at,
        tone: "info" as const,
      })),
    ];
    return entries
      .filter((entry) => Boolean(entry.when))
      .sort(
        (left, right) =>
          new Date(right.when).getTime() - new Date(left.when).getTime(),
      )
      .slice(0, 6);
  }, [charges.data, invitations.data, maintenance.data, movements.data]);
  const activityGroups = useMemo(() => {
    const groups = new Map<string, typeof activity>();
    for (const entry of activity) {
      const label = dayBucket(entry.when);
      groups.set(label, [...(groups.get(label) ?? []), entry]);
    }
    return Array.from(groups.entries());
  }, [activity]);

  const roleNames = Array.from(
    new Set(context.relationships.map((item) => roleLabel(item.role))),
  );

  return (
    <div className="space-y-4">
      {alerts.length ? (
        <ol
          aria-label="Announcements"
          className="isolate flex flex-col items-center pb-1"
        >
          {alerts.map((item, index) => {
            const layered = alerts.length > 1;
            // Foreground card is widest; each layer behind is narrower,
            // tucked under the previous one, and carries a softer shadow.
            const depth = layered ? index : 0;
            const inset = Math.min(depth, 2) * 20;
            return (
              <li
                key={item.id}
                style={{
                  width: inset ? `calc(100% - ${inset}px)` : "100%",
                  zIndex: alerts.length - index,
                  marginTop: depth > 0 ? "-38px" : undefined,
                  transform: depth > 0 ? `translateY(${depth * 2}px)` : undefined,
                }}
                className="relative"
              >
                <AnnouncementAlert
                  tone={announcementTone(item.priority)}
                  title={item.title}
                  meta={relative(item.published_at)}
                  href={`/workspace/${place.id}/announcements`}
                  depth={depth}
                  onDismiss={() => dismissAnnouncement(item.id)}
                />
              </li>
            );
          })}
        </ol>
      ) : null}

      <section className={cn(surfaceClass, "overflow-hidden")}>
        <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-center lg:gap-6">
          <div className="flex min-w-0 items-center gap-3.5">
            <div
              aria-hidden
              className="relative grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-lg bg-[linear-gradient(135deg,#2b3844,#46586a)] text-white"
            >
              <Building2 className="h-7 w-7 opacity-90" />
              <span className="absolute bottom-1.5 w-full text-center text-[8px] font-bold uppercase tracking-[0.14em] text-white/70">
                {titleCaseStatus(context.place.kind)}
              </span>
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-xl font-semibold tracking-[-0.02em] text-[var(--vms-ink)]">
                {context.place.name}
              </h2>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {roleNames.map((role) => (
                  <Badge key={role} variant="neutral">
                    {role}
                  </Badge>
                ))}
                <Badge variant="success">Active</Badge>
              </div>
              <p className="mt-1.5 flex items-start gap-1.5 text-xs leading-5 text-[var(--vms-ink-muted)]">
                <MapPin aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span className="break-words">
                  {context.place.address?.trim() ||
                    qualifiedPlaceName(context.place)}
                </span>
              </p>
              <PartyBadgeStrip />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:border-l lg:border-[var(--vms-line)] lg:pl-6">
            {charges.isPending ? (
              <div className="sm:col-span-2">
                <PlaceRowSkeleton rows={2} />
              </div>
            ) : (
              <>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--vms-ink-muted)]">
                    {outstanding > 0 ? "Outstanding balance" : "Account balance"}
                  </p>
                  {outstanding > 0 ? (
                    <p className="mt-0.5 text-[26px] font-semibold leading-tight tracking-[-0.02em] text-[var(--vms-ink)]">
                      {formatMoney(outstanding, chargeCurrency)}
                    </p>
                  ) : (
                    <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-[var(--vms-success)]">
                      <CheckCircle2 aria-hidden className="h-4 w-4" />
                      Nothing outstanding
                    </p>
                  )}
                  {openCharges.length ? (
                    <p className="mt-1 truncate text-[11px] leading-4 text-[var(--vms-ink-muted)]">
                      {openCharges
                        .slice(0, 2)
                        .map((item) => item.title)
                        .join(" · ")}
                      {openCharges.length > 2
                        ? ` · +${openCharges.length - 2} more`
                        : ""}
                    </p>
                  ) : null}
                  {overdueCount > 0 ? (
                    <span className="mt-1.5 inline-flex rounded-full bg-[var(--vms-danger-subtle)] px-2 py-0.5 text-[10px] font-semibold text-[var(--vms-danger)]">
                      {overdueCount} overdue
                    </span>
                  ) : null}
                </div>

                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--vms-ink-muted)]">
                    Next payment
                  </p>
                  {nextDue ? (
                    <>
                      <p className="mt-0.5 text-lg font-semibold leading-tight tabular-nums tracking-[-0.02em] text-[var(--vms-ink)]">
                        {formatMoney(nextDue.balance, nextDue.currency)}
                      </p>
                      <p className="mt-0.5 text-[11px] leading-4 text-[var(--vms-ink-muted)]">
                        Due {day(nextDue.due_date)} ·{" "}
                        {cadenceLabel(
                          nextDue.acknowledged_cadence ?? nextDue.recurrence,
                        )}
                        {nextDue.is_recurring ? " · recurring" : " · one-off"}
                      </p>
                      {nextDue.is_flexible ? (
                        <p className="text-[11px] leading-4 text-[var(--vms-ink-muted)]">
                          Baseline {cadenceLabel(nextDue.recurrence)}
                          {nextDue.acknowledged_cadence
                            ? ` · acknowledged ${cadenceLabel(nextDue.acknowledged_cadence)}`
                            : " · not acknowledged"}
                        </p>
                      ) : null}
                    </>
                  ) : (
                    <p className="mt-1 text-sm text-[var(--vms-ink-muted)]">
                      Nothing scheduled
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
                  {nextDue &&
                    nextDue.can_pay &&
                    nextDue.status === "scheduled" ? (
                    <Button
                      onClick={() => payNext.mutate(nextDue.id)}
                      isLoading={payNext.isPending}
                    >
                      Pay {formatMoney(nextDue.balance, nextDue.currency)}
                    </Button>
                  ) : null}
                  <Button
                    asChild
                    variant={
                      nextDue && nextDue.can_pay && nextDue.status === "scheduled"
                        ? "outline"
                        : "primary"
                    }
                  >
                    <Link href={`/workspace/${place.id}/charges`}>
                      View all charges
                      <ArrowRight aria-hidden className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                {payNext.isError ? (
                  <p
                    role="alert"
                    className="text-[11px] text-[var(--vms-danger)] sm:col-span-2"
                  >
                    {parseApiError(payNext.error).message}
                  </p>
                ) : null}
              </>
            )}
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          title="Quick actions"
          description="The things residents do most, one tap away."
        >
          <div className="grid gap-2">
            {[
              {
                href: `/workspace/${place.id}/invitations`,
                icon: Plus,
                title: "Invite visitor",
                detail: "Give someone access",
                primary: true,
              },
              {
                href: `/workspace/${place.id}/maintenance`,
                icon: Wrench,
                title: "Request maintenance",
                detail: "Report an issue",
                primary: false,
              },
              {
                href: `/workspace/${place.id}/visitors`,
                icon: Users,
                title: "View visitors",
                detail: "Access and history",
                primary: false,
              },
            ].map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className={cn(
                    "group flex min-h-[4.5rem] min-w-0 items-start gap-3 rounded-[var(--vms-radius-control)] border px-3 py-3 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)] focus-visible:ring-offset-2",
                    action.primary
                      ? "border-[var(--vms-action)] bg-[var(--vms-action)] text-[var(--vms-on-action)] hover:bg-[var(--vms-action-hover)]"
                      : "border-[var(--vms-line)] bg-[var(--vms-surface)] text-[var(--vms-ink)] hover:border-[var(--vms-line-strong)] hover:bg-[var(--vms-surface-subtle)]",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "grid h-9 w-9 shrink-0 place-items-center rounded-lg",
                      action.primary
                        ? "bg-white/15 text-[var(--vms-on-action)]"
                        : "bg-[var(--vms-surface-subtle)] text-[var(--vms-ink)]",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block break-words text-[13px] font-semibold leading-5">
                      {action.title}
                    </span>
                    <span
                      className={cn(
                        "mt-0.5 block break-words text-[11px] leading-4",
                        action.primary
                          ? "text-white/70"
                          : "text-[var(--vms-ink-muted)]",
                      )}
                    >
                      {action.detail}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard
          title="Upcoming visits"
          actionHref={`/workspace/${place.id}/invitations`}
          actionLabel="All visits"
        >
          <State query={invitations} rows={2}>
            {upcoming.length ? (
              <ul>
                {upcoming.map((invitation) => {
                  const guest = invitation.guests[0];
                  const extra = invitation.guests.length - 1;
                  return (
                    <li key={invitation.id} className={listRowClass}>
                      <Avatar
                        name={guest?.display_name_snapshot || "Visitor"}
                        size="md"
                        tone="ink"
                        decorative
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[var(--vms-ink)]">
                          {guest?.display_name_snapshot || "Visitor"}
                          {extra > 0 ? (
                            <span className="font-normal text-[var(--vms-ink-muted)]">
                              {" "}
                              +{extra} more
                            </span>
                          ) : null}
                        </p>
                        <p className="mt-0.5 text-xs text-[var(--vms-ink-muted)]">
                          <span className="font-semibold text-[var(--vms-ink)]">
                            {visitCountdown(invitation.valid_from)}
                          </span>{" "}
                          · {day(invitation.valid_from)} ·{" "}
                          {time(invitation.valid_from)}
                        </p>
                      </div>
                      <StatusPill status={invitation.status} />
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyRow
                icon={Ticket}
                title="No upcoming visits"
                description="Invite a visitor and they will appear here once approved."
              />
            )}
          </State>
        </SectionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          title="Recent activity"
          actionHref={`/workspace/${place.id}/movements`}
          actionLabel="View all"
        >
          {movements.isPending && maintenance.isPending ? (
            <PlaceRowSkeleton rows={3} />
          ) : activityGroups.length ? (
            <div className="space-y-4">
              {activityGroups.map(([label, entries]) => (
                <div key={label}>
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--vms-ink-muted)]">
                    {label}
                  </p>
                  <ul>
                    {entries.map((entry) => (
                      <li
                        key={entry.id}
                        className="flex flex-wrap items-start gap-3 border-b border-[var(--vms-line)] py-2.5 last:border-b-0"
                      >
                        <IconTile
                          icon={entry.icon}
                          tone={
                            entry.tone === "neutral"
                              ? "neutral"
                              : (entry.tone as
                                | "success"
                                | "warning"
                                | "danger"
                                | "info")
                          }
                        />
                        <div className="min-w-0 flex-1">
                          <p className="break-words text-[13px] font-semibold leading-5 text-[var(--vms-ink)]">
                            {entry.title}
                          </p>
                          <p className="mt-0.5 truncate text-[11px] text-[var(--vms-ink-muted)]">
                            {entry.meta}
                          </p>
                        </div>
                        <span className="shrink-0 pt-0.5 text-[11px] tabular-nums text-[var(--vms-ink-muted)]">
                          {relative(entry.when)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <EmptyRow
              icon={Clock3}
              title="Nothing recorded yet"
              description="Visitor movements, requests, invitations and charges will show up here."
            />
          )}
        </SectionCard>

        <SectionCard
          title="Maintenance requests"
          actionHref={`/workspace/${place.id}/maintenance`}
          actionLabel="All requests"
        >
          <State query={maintenance} rows={2}>
            {requests.length ? (
              <ul>
                {requests.map((item) => (
                  <li key={item.id} className={listRowClass}>
                    <IconTile
                      icon={Wrench}
                      tone={
                        item.status === "resolved" || item.status === "closed"
                          ? "success"
                          : "coral"
                      }
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[var(--vms-ink)]">
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--vms-ink-muted)]">
                        Raised {day(item.created_at)} ·{" "}
                        {titleCaseStatus(item.category)}
                      </p>
                    </div>
                    <StatusPill status={item.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyRow
                icon={Wrench}
                title="No maintenance requests"
                description="Report an issue and track how it is resolved."
                action={
                  <Button asChild variant="outline" className="mt-2">
                    <Link href={`/workspace/${place.id}/maintenance`}>
                      Make a request
                    </Link>
                  </Button>
                }
              />
            )}
          </State>
        </SectionCard>
      </div>

      {definition?.workspace_dashboard.some((item) => item.section === "stay") &&
        context.relationships.some(
          (item) => item.role === "guest" || item.role === "guest_of",
        ) ? (
        <GuestStayDashboard placeId={context.place.id} />
      ) : null}
    </div>
  );
}
function Announcements() {
  const { place, party } = usePlaceWorkspace();
  const [tab, setTab] = useState<"all" | "important" | "notice" | "fyi">("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ["place-announcements", place.id, party.id],
    queryFn: () => placeWorkspaceApi.announcements(place.id),
    retry: false,
  });
  const items = useMemo(() => query.data ?? [], [query.data]);
  const matches = (item: Announcement, bucket: typeof tab) => {
    const tone = announcementTone(item.priority);
    if (bucket === "all") return true;
    if (bucket === "important") return tone === "high" || tone === "urgent";
    if (bucket === "notice") return tone === "normal";
    return tone === "low";
  };
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter(
      (item) =>
        matches(item, tab) &&
        (!term ||
          item.title.toLowerCase().includes(term) ||
          item.body.toLowerCase().includes(term)),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, tab, search]);
  const selected =
    filtered.find((item) => item.id === selectedId) ?? filtered[0] ?? null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs
          label="Announcement filters"
          value={tab}
          onChange={(value) => {
            setTab(value);
            setSelectedId(null);
          }}
          tabs={[
            { value: "all", label: "All", count: items.length },
            {
              value: "important",
              label: "Important",
              count: items.filter((item) => matches(item, "important")).length,
            },
            {
              value: "notice",
              label: "Notices",
              count: items.filter((item) => matches(item, "notice")).length,
            },
            {
              value: "fyi",
              label: "FYI",
              count: items.filter((item) => matches(item, "fyi")).length,
            },
          ]}
        />
        <div className="flex items-center gap-2 rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] bg-[var(--vms-surface)] px-3 lg:w-72">
          <Search
            aria-hidden
            className="h-4 w-4 shrink-0 text-[var(--vms-ink-muted)]"
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search announcements…"
            aria-label="Search announcements"
            className="min-h-10 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--vms-ink-muted)]"
          />
        </div>
      </div>

      <State query={query} rows={4}>
        {!filtered.length ? (
          <EmptyRow
            icon={Megaphone}
            title={search ? "No matching announcements" : "No announcements yet"}
            description={
              search
                ? "Try a different word, or clear the search to see every notice."
                : "Notices published for this Place will appear here."
            }
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-start">
            <ul className="min-w-0 space-y-2.5">
              {filtered.map((item) => {
                const tone = announcementTone(item.priority);
                const style = announcementStyles[tone];
                const active = selected?.id === item.id;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(item.id)}
                      aria-current={active ? "true" : undefined}
                      className={cn(
                        "w-full rounded-xl border px-4 py-3.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]",
                        active
                          ? "border-[var(--vms-action)] bg-[var(--vms-surface)] shadow-[0_1px_2px_rgba(15,27,49,0.06)]"
                          : "border-[var(--vms-line)] bg-[var(--vms-surface)] hover:border-[var(--vms-line-strong)]",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <Badge variant={style.badge}>
                          {announcementPriorityLabel(item.priority)}
                        </Badge>
                        <span className="shrink-0 text-[11px] text-[var(--vms-ink-muted)]">
                          {relative(item.published_at)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-[var(--vms-ink)]">
                        {item.title}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--vms-ink-muted)]">
                        {item.body}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>

            {selected ? (
              <aside className="min-w-0 lg:sticky lg:top-4">
                <article
                  className={cn(
                    surfaceClass,
                    "px-4 py-4 sm:px-5 sm:py-5",
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={announcementStyles[announcementTone(selected.priority)].badge}>
                      {announcementPriorityLabel(selected.priority)}
                    </Badge>
                    {selected.is_pinned ? (
                      <Badge variant="neutral">Pinned</Badge>
                    ) : null}
                  </div>
                  <h2 className="mt-2 text-lg font-semibold leading-6 tracking-[-0.01em] text-[var(--vms-ink)]">
                    {selected.title}
                  </h2>
                  <p className="mt-1 text-xs text-[var(--vms-ink-muted)]">
                    Published {date(selected.published_at)} · by{" "}
                    {qualifiedPlaceName(place)} management
                  </p>
                  <div className="mt-4 space-y-3 border-t border-[var(--vms-line)] pt-4 text-sm leading-6 text-[var(--vms-ink)]">
                    {selected.body
                      .split(/\n{2,}/)
                      .filter(Boolean)
                      .map((paragraph, index) => (
                        <p
                          key={index}
                          className="whitespace-pre-wrap break-words"
                        >
                          {paragraph}
                        </p>
                      ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedId(null)}
                    className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[var(--vms-ink)] underline underline-offset-4 lg:hidden"
                  >
                    Back to the list
                  </button>
                </article>
              </aside>
            ) : null}
          </div>
        )}
      </State>
    </div>
  );
}
function Visitors() {
  return <VisitorsSection />;
}
function Movements() {
  return <MovementsSection />;
}
function Charges() {
  const { place, party } = usePlaceWorkspace();
  const [definitionId, setDefinitionId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<"outstanding" | "paid" | "all">("outstanding");
  const [period, setPeriod] = useState("all");
  const [type, setType] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [acknowledging, setAcknowledging] = useState<PlaceCharge | null>(null);
  const definitions = useQuery({
    queryKey: ["place-charge-definitions", place.id, party.id],
    queryFn: () => placeWorkspaceApi.chargeDefinitions(place.id),
    retry: false,
  });
  const query = useQuery({
    queryKey: ["place-charges", place.id, party.id, definitionId, page],
    queryFn: () =>
      placeWorkspaceApi.charges(place.id, page, definitionId ?? undefined),
    retry: false,
    enabled: definitionId !== null,
  });
  const pay = useMutation({
    mutationFn: myChargesApi.pay,
    onSuccess: (checkout) => window.location.assign(checkout.authorization_url),
  });
  const items = useMemo(() => query.data?.items ?? [], [query.data]);
  const definitionRows = useMemo(
    () => definitions.data?.items ?? [],
    [definitions.data],
  );
  const openDefinition = definitionRows.find(
    (row) => row.definition_id === definitionId,
  );
  const currency = items[0]?.currency ?? definitionRows[0]?.currency;
  const isOpen = (item: PlaceCharge) =>
    Number(item.balance) > 0 && item.status !== "void";
  const openItems = items.filter(isOpen);
  const outstanding = openItems.reduce(
    (total, item) => total + Number(item.balance),
    0,
  );
  const nextDue = [...openItems].sort(
    (left, right) =>
      new Date(left.due_date).getTime() - new Date(right.due_date).getTime(),
  )[0];
  const periods = Array.from(
    new Set(items.map((item) => String(new Date(item.due_date).getFullYear()))),
  ).sort();
  const types = Array.from(
    new Set(items.map((item) => item.recurrence).filter(Boolean)),
  ) as string[];
  const filtered = items.filter((item) => {
    const matchesTab =
      tab === "all" ? true : tab === "outstanding" ? isOpen(item) : !isOpen(item);
    const matchesPeriod =
      period === "all" ||
      String(new Date(item.due_date).getFullYear()) === period;
    const matchesType = type === "all" || item.recurrence === type;
    return matchesTab && matchesPeriod && matchesType;
  });
  const selected = filtered.find((item) => item.id === selectedId) ?? filtered[0] ?? null;
  const owed = (item: PlaceCharge) => Number(item.amount) - Number(item.balance);
  const canPayItem = (item: PlaceCharge) =>
    item.can_pay && item.status === "scheduled" && Number(item.balance) > 0;
  const definitionOutstanding = definitionRows.reduce(
    (total, row) => total + Number(row.outstanding || 0),
    0,
  );
  const openDefinitionCount = definitionRows.filter(
    (row) => Number(row.outstanding || 0) > 0,
  ).length;

  if (!definitionId) {
    return (
      <div className="space-y-4">
        <div
          className={cn(
            surfaceClass,
            "flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5",
          )}
        >
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--vms-ink-muted)]">
              Outstanding balance
            </p>
            <p className="mt-1 text-2xl font-semibold tracking-[-0.02em] text-[var(--vms-ink)]">
              {formatMoney(definitionOutstanding, currency)}
            </p>
            <p className="mt-0.5 text-xs text-[var(--vms-ink-muted)]">
              across {openDefinitionCount} charge definition
              {openDefinitionCount === 1 ? "" : "s"}
            </p>
          </div>
          <p className="max-w-xs text-xs leading-5 text-[var(--vms-ink-muted)]">
            Open a charge to see its due dates, balance and payment history.
          </p>
        </div>

        <State query={definitions} rows={4}>
          {!definitionRows.length ? (
            <div className={cn(surfaceClass, "py-2")}>
              <EmptyRow
                icon={ReceiptText}
                title="No charges assigned"
                description="Bills raised against this Place will appear here."
              />
            </div>
          ) : (
            <div className={cn(surfaceClass, "overflow-x-auto")}>
              <table className="w-full min-w-[38rem] border-collapse text-sm">
                <caption className="sr-only">
                  Charge definitions for {qualifiedPlaceName(place)}
                </caption>
                <thead>
                  <tr className="border-b border-[var(--vms-line)] text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--vms-ink-muted)]">
                    <th scope="col" className="px-3 py-2.5">
                      Charge
                    </th>
                    <th scope="col" className="px-3 py-2.5 text-right">
                      Outstanding
                    </th>
                    <th scope="col" className="hidden px-3 py-2.5 sm:table-cell">
                      Next due
                    </th>
                    <th
                      scope="col"
                      className="hidden px-3 py-2.5 text-center md:table-cell"
                    >
                      Schedules
                    </th>
                    <th scope="col" className="px-3 py-2.5">
                      Status
                    </th>
                    <th scope="col" className="w-8 px-1 py-2.5">
                      <span className="sr-only">Open</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {definitionRows.map((row) => (
                    <tr
                      key={row.definition_id}
                      onClick={() => {
                        setDefinitionId(row.definition_id);
                        setPage(1);
                        setSelectedId(null);
                        setTab("outstanding");
                        setPeriod("all");
                        setType("all");
                      }}
                      className="cursor-pointer border-b border-[var(--vms-line)] transition last:border-b-0 hover:bg-[var(--vms-surface-subtle)]"
                    >
                      <td className="min-w-0 px-3 py-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            setDefinitionId(row.definition_id);
                            setPage(1);
                            setSelectedId(null);
                            setTab("outstanding");
                            setPeriod("all");
                            setType("all");
                          }}
                          className="block max-w-[16rem] truncate text-left font-semibold text-[var(--vms-ink)] underline-offset-4 hover:underline"
                        >
                          {row.title}
                        </button>
                        <span className="mt-0.5 block text-[11px] text-[var(--vms-ink-muted)]">
                          {cadenceLabel(
                            row.is_flexible
                              ? (row.acknowledged_cadence ?? row.recurrence)
                              : row.recurrence,
                          )}
                          {row.is_flexible ? " · acknowledged" : ""}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right font-semibold tabular-nums text-[var(--vms-ink)]">
                        {formatMoney(row.outstanding, row.currency)}
                      </td>
                      <td className="hidden whitespace-nowrap px-3 py-2.5 text-xs text-[var(--vms-ink-muted)] sm:table-cell">
                        {row.next_due_date ? day(row.next_due_date) : "—"}
                      </td>
                      <td className="hidden whitespace-nowrap px-3 py-2.5 text-center text-xs text-[var(--vms-ink-muted)] md:table-cell">
                        {`${row.open_count} open / ${row.schedule_count}`}
                      </td>
                      <td className="px-3 py-2.5">
                        <StatusPill status={row.status} />
                      </td>
                      <td className="px-1 py-2.5 text-right text-[var(--vms-ink-muted)]">
                        <ChevronRight aria-hidden className="ml-auto h-4 w-4" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </State>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => {
            setDefinitionId(null);
            setPage(1);
            setSelectedId(null);
          }}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-[var(--vms-radius-control)] px-2 text-xs font-semibold text-[var(--vms-ink-muted)] transition-colors hover:bg-[var(--vms-surface-subtle)] hover:text-[var(--vms-ink)]"
        >
          <ArrowLeft aria-hidden className="h-3.5 w-3.5" />
          All charges
        </button>
        <p className="text-xs text-[var(--vms-ink-muted)]">
          {openDefinition?.title ?? "Charge detail"} ·{" "}
          {cadenceLabel(
            openDefinition?.is_flexible
              ? (openDefinition.acknowledged_cadence ??
                openDefinition.recurrence)
              : (openDefinition?.recurrence ?? items[0]?.recurrence),
          )}
        </p>
      </div>
      <div
        className={cn(
          surfaceClass,
          "flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5",
        )}
      >
        <div className="flex flex-wrap items-center gap-x-10 gap-y-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--vms-ink-muted)]">
              Outstanding balance
            </p>
            <p className="mt-1 text-2xl font-semibold tracking-[-0.02em] text-[var(--vms-ink)]">
              {formatMoney(outstanding, currency)}
            </p>
            <p className="mt-0.5 text-xs text-[var(--vms-ink-muted)]">
              across {openItems.length} charge{openItems.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="border-l border-[var(--vms-line)] pl-5 sm:pl-10">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--vms-ink-muted)]">
              Next due
            </p>
            <p className="mt-1 text-lg font-semibold tracking-[-0.02em] text-[var(--vms-ink)]">
              {nextDue ? day(nextDue.due_date) : "Nothing scheduled"}
            </p>
            {nextDue ? (
              <>
                <p className="mt-0.5 text-xs text-[var(--vms-ink-muted)]">
                  Next payment{" "}
                  {formatMoney(nextDue.balance, nextDue.currency)} ·{" "}
                  {cadenceLabel(
                    nextDue.acknowledged_cadence ?? nextDue.recurrence,
                  )}
                  {nextDue.is_recurring ? " · recurring" : " · one-off"}
                </p>
                {nextDue.is_flexible ? (
                  <p className="mt-0.5 text-[11px] leading-4 text-[var(--vms-ink-muted)]">
                    Baseline {cadenceLabel(nextDue.recurrence)} ·{" "}
                    {nextDue.acknowledged_cadence
                      ? `acknowledged ${cadenceLabel(nextDue.acknowledged_cadence)}`
                      : "not acknowledged yet"}
                  </p>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
        {nextDue && canPayItem(nextDue) ? (
          <Button
            isLoading={pay.isPending && pay.variables === nextDue.id}
            onClick={() => pay.mutate(nextDue.id)}
          >
            Pay now
          </Button>
        ) : null}
      </div>

      {pay.isError ? (
        <p
          role="alert"
          className="rounded-lg border border-[var(--vms-danger)] bg-[var(--vms-danger-subtle)] px-3 py-2 text-sm text-[var(--vms-danger)]"
        >
          {parseApiError(pay.error).message}
        </p>
      ) : null}

      <Tabs
        label="Charge filters"
        value={tab}
        onChange={(value) => {
          setTab(value);
          setSelectedId(null);
        }}
        tabs={[
          { value: "outstanding", label: "Outstanding", count: openItems.length },
          {
            value: "paid",
            label: "Paid",
            count: items.length - openItems.length,
          },
          { value: "all", label: "All", count: items.length },
        ]}
      />

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="flex items-center gap-2 rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] bg-[var(--vms-surface)] px-3 sm:w-56">
          <Clock3
            aria-hidden
            className="h-4 w-4 shrink-0 text-[var(--vms-ink-muted)]"
          />
          <select
            value={period}
            aria-label="Filter by period"
            onChange={(event) => setPeriod(event.target.value)}
            className="min-h-10 min-w-0 flex-1 bg-transparent text-sm outline-none"
          >
            <option value="all">All periods</option>
            {periods.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] bg-[var(--vms-surface)] px-3 sm:w-56">
          <ReceiptText
            aria-hidden
            className="h-4 w-4 shrink-0 text-[var(--vms-ink-muted)]"
          />
          <select
            value={type}
            aria-label="Filter by charge type"
            onChange={(event) => setType(event.target.value)}
            className="min-h-10 min-w-0 flex-1 bg-transparent text-sm outline-none"
          >
            <option value="all">All types</option>
            {types.map((option) => (
              <option key={option} value={option}>
                {cadenceLabel(option)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <State query={query} rows={4}>
        {!items.length ? (
          <div className={cn(surfaceClass, "py-2")}>
            <EmptyRow
              icon={ReceiptText}
              title="No due dates yet"
              description="This charge has no scheduled due dates for this Place."
            />
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,23rem)] lg:items-start">
            <div className={cn(surfaceClass, "min-w-0 overflow-x-auto")}>
              <table className="w-full min-w-[40rem] border-collapse text-sm">
                <caption className="sr-only">
                  Charges for {qualifiedPlaceName(place)}
                </caption>
                <thead>
                  <tr className="border-b border-[var(--vms-line)] text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--vms-ink-muted)]">
                    <th scope="col" className="hidden px-3 py-2.5 sm:table-cell">
                      Period
                    </th>
                    <th scope="col" className="px-3 py-2.5">
                      Due date
                    </th>
                    <th scope="col" className="px-3 py-2.5 text-right">
                      Amount
                    </th>
                    <th scope="col" className="hidden px-3 py-2.5 text-right md:table-cell">
                      Paid
                    </th>
                    <th scope="col" className="px-3 py-2.5 text-right">
                      Balance
                    </th>
                    <th scope="col" className="px-3 py-2.5">
                      Status
                    </th>
                    <th scope="col" className="w-8 px-1 py-2.5">
                      <span className="sr-only">Open</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length ? (
                    filtered.map((item) => {
                      const active = selected?.id === item.id;
                      return (
                        <tr
                          key={item.id}
                          onClick={() => setSelectedId(item.id)}
                          className={cn(
                            "cursor-pointer border-b border-[var(--vms-line)] transition last:border-b-0",
                            active
                              ? "bg-[var(--vms-surface-subtle)]"
                              : "hover:bg-[var(--vms-surface-subtle)]",
                          )}
                        >
                          <td className="hidden whitespace-nowrap px-3 py-2.5 text-xs text-[var(--vms-ink-muted)] sm:table-cell">
                            {new Date(item.due_date).toLocaleDateString(
                              undefined,
                              { month: "short", year: "numeric" },
                            )}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2.5 text-xs text-[var(--vms-ink-muted)]">
                            {day(item.due_date)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-[var(--vms-ink)]">
                            {formatMoney(item.amount, item.currency)}
                          </td>
                          <td className="hidden whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-[var(--vms-ink-muted)] md:table-cell">
                            {formatMoney(owed(item), item.currency)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2.5 text-right font-semibold tabular-nums text-[var(--vms-ink)]">
                            {formatMoney(item.balance, item.currency)}
                          </td>
                          <td className="px-3 py-2.5">
                            <StatusPill status={item.status} />
                          </td>
                          <td className="px-1 py-2.5 text-right text-[var(--vms-ink-muted)]">
                            <ChevronRight aria-hidden className="ml-auto h-4 w-4" />
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-3 py-6 text-center text-xs text-[var(--vms-ink-muted)]"
                      >
                        No due dates match these filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="px-3 pb-2">
                <Pagination
                  page={page}
                  more={page * 20 < (query.data?.total ?? 0)}
                  onPage={setPage}
                  total={query.data?.total}
                />
              </div>
            </div>

            {selected ? (
              <aside className="min-w-0 lg:sticky lg:top-4">
                <div className={cn(surfaceClass, "px-4 py-4 sm:px-5 sm:py-5")}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-semibold leading-6 tracking-[-0.01em] text-[var(--vms-ink)]">
                        {selected.title}
                      </h2>
                      <p className="mt-0.5 text-xs text-[var(--vms-ink-muted)]">
                        {cadenceLabel(selected.recurrence)} ·{" "}
                        {qualifiedPlaceName(place)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedId(null)}
                      aria-label="Close charge details"
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-[var(--vms-ink-muted)] hover:bg-[var(--vms-surface-subtle)] hover:text-[var(--vms-ink)]"
                    >
                      ×
                    </button>
                  </div>
                  <div className="mt-2">
                    <StatusPill status={selected.status} />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-lg border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] px-3 py-2.5">
                      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--vms-ink-muted)]">
                        Balance due
                      </p>
                      <p className="mt-0.5 text-base font-semibold tabular-nums text-[var(--vms-ink)]">
                        {formatMoney(selected.balance, selected.currency)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] px-3 py-2.5">
                      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--vms-ink-muted)]">
                        Due date
                      </p>
                      <p className="mt-0.5 text-base font-semibold text-[var(--vms-ink)]">
                        {day(selected.due_date)}
                      </p>
                    </div>
                  </div>

                  <dl className="mt-4 space-y-1.5 border-t border-[var(--vms-line)] pt-3 text-xs">
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-[var(--vms-ink-muted)]">
                        Charge amount
                      </dt>
                      <dd className="font-semibold tabular-nums text-[var(--vms-ink)]">
                        {formatMoney(selected.amount, selected.currency)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-[var(--vms-ink-muted)]">Amount paid</dt>
                      <dd className="font-semibold tabular-nums text-[var(--vms-ink)]">
                        {formatMoney(owed(selected), selected.currency)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-3 border-t border-[var(--vms-line)] pt-1.5">
                      <dt className="font-semibold text-[var(--vms-ink)]">
                        Balance due
                      </dt>
                      <dd className="font-semibold tabular-nums text-[var(--vms-ink)]">
                        {formatMoney(selected.balance, selected.currency)}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-4 border-t border-[var(--vms-line)] pt-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--vms-ink-muted)]">
                      Billing frequency
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-[var(--vms-ink)]">
                      {cadenceLabel(selected.recurrence)}
                      {selected.is_recurring ? " · recurring" : " · one-off"}
                    </p>
                    {selected.is_flexible ? (
                      <p className="mt-1 text-[11px] leading-4 text-[var(--vms-ink-muted)]">
                        Baseline {cadenceLabel(selected.recurrence)}
                        {selected.acknowledged_cadence
                          ? ` · acknowledged ${cadenceLabel(selected.acknowledged_cadence)}`
                          : " · frequency not acknowledged"}
                        <button
                          type="button"
                          onClick={() => setAcknowledging(selected)}
                          className="ml-2 font-semibold text-[var(--vms-action)] underline underline-offset-4"
                        >
                          {selected.acknowledged_cadence
                            ? "Change frequency"
                            : "Acknowledge frequency"}
                        </button>
                      </p>
                    ) : null}
                  </div>

                  {canPayItem(selected) ? (
                    <Button
                      className="mt-4 w-full"
                      isLoading={pay.isPending && pay.variables === selected.id}
                      onClick={() => pay.mutate(selected.id)}
                    >
                      Pay {formatMoney(selected.balance, selected.currency)}
                    </Button>
                  ) : null}

                  <div className="mt-4 border-t border-[var(--vms-line)] pt-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--vms-ink-muted)]">
                      Payments
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[var(--vms-ink-muted)]">
                      {Number(owed(selected)) > 0
                        ? `${formatMoney(owed(selected), selected.currency)} received against this charge.`
                        : "No payments recorded for this charge yet."}
                    </p>
                  </div>
                </div>
              </aside>
            ) : null}
          </div>
        )}
      </State>

      {acknowledging ? (
        <ChargeCadenceModal
          placeId={place.id}
          charge={acknowledging}
          onClose={() => setAcknowledging(null)}
        />
      ) : null}
    </div>
  );
}

function ChargeCadenceModal({
  placeId,
  charge,
  onClose,
}: {
  placeId: string;
  charge: PlaceCharge;
  onClose: () => void;
}) {
  const client = useQueryClient();
  const options = allowedCadences(charge.recurrence);
  const [cadence, setCadence] = useState(
    charge.acknowledged_cadence ?? charge.recurrence ?? options[0],
  );
  const [note, setNote] = useState("");
  const mutation = useMutation({
    mutationFn: () =>
      placeWorkspaceApi.acknowledgeCharge(placeId, charge.assignment_id!, {
        cadence,
        note: note.trim() || null,
      }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["place-charges"] });
      client.invalidateQueries({ queryKey: ["place-charge-definitions"] });
      onClose();
    },
  });
  const changed = cadence !== charge.acknowledged_cadence;

  return (
    <Modal
      isOpen
      onClose={onClose}
      size="sm"
      title="Acknowledge this fee"
      description={`${charge.title} is billed ${cadenceLabel(charge.recurrence).toLowerCase()} at ${formatMoney(charge.amount, charge.currency)}.`}
    >
      <div className="space-y-4">
        <div className="rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] px-3 py-2.5 text-xs leading-5">
          <span className="text-[var(--vms-ink-muted)]">Baseline </span>
          <span className="font-semibold text-[var(--vms-ink)]">
            {cadenceLabel(charge.recurrence)}
          </span>
          <span className="text-[var(--vms-ink-muted)]"> · Acknowledged </span>
          <span className="font-semibold text-[var(--vms-ink)]">
            {cadenceLabel(cadence)}
          </span>
        </div>
        <Field
          id="charge-cadence"
          label="How often will you pay?"
          description="Only the same or a longer cycle than the baseline is allowed."
          required
        >
          {(control) => (
            <select
              {...control}
              value={cadence}
              onChange={(event) => setCadence(event.target.value)}
              className={fieldControlClassName}
            >
              {options.map((option) => (
                <option key={option} value={option}>
                  {cadenceLabel(option)}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field
          id="charge-cadence-note"
          label="Note"
          description="Optional. Visible to the place administrator."
        >
          {(control) => (
            <textarea
              {...control}
              rows={2}
              maxLength={500}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Anything the administrator should know"
              className={fieldControlClassName}
            />
          )}
        </Field>
        {mutation.isError ? (
          <p role="alert" className="text-xs text-[var(--vms-danger)]">
            {parseApiError(mutation.error).message}
          </p>
        ) : null}
        <div className="flex flex-col-reverse gap-2 border-t border-[var(--vms-line)] pt-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => mutation.mutate()}
            isLoading={mutation.isPending}
            disabled={!changed}
          >
            {changed
              ? `Acknowledge ${cadenceLabel(cadence)}`
              : "Already acknowledged"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
function Maintenance() {
  const context = usePlaceWorkspace();
  const { place } = context;
  const client = useQueryClient();
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"open" | "in_progress" | "resolved" | "all">(
    "open",
  );
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  // The details sidebar is only visible from xl up, so the drawer must not
  // mount on those screens or the same request appears twice.
  const hasSidebar = useMediaQuery("(min-width: 1280px)");
  const categories = context.maintenance_categories;
  const [input, setInput] = useState<MaintenanceInput>({
    title: "",
    description: "",
    category: categories[0],
    priority: "normal",
  });
  const query = useQuery({
    queryKey: ["place-maintenance", place.id, page],
    queryFn: () => placeWorkspaceApi.maintenance(place.id, page),
    retry: false,
  });
  const save = useMutation({
    mutationFn: () => placeWorkspaceApi.requestMaintenance(place.id, input),
    onSuccess: () => {
      void client.invalidateQueries({
        queryKey: ["place-maintenance", place.id],
      });
      setOpen(false);
      setInput({ ...input, title: "", description: "" });
    },
  });
  const rows = useMemo(() => query.data?.items ?? [], [query.data]);
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter(
      (item) =>
        (tab === "all" || maintenanceBucket(item.status) === tab) &&
        (category === "all" || item.category === category) &&
        (!term ||
          item.title.toLowerCase().includes(term) ||
          item.description.toLowerCase().includes(term)),
    );
  }, [rows, tab, category, search]);
  const bucketCount = (bucket: "open" | "in_progress" | "resolved") =>
    rows.filter((item) => maintenanceBucket(item.status) === bucket).length;
  const selected = filtered.find((item) => item.id === selectedId) ?? null;
  const openRequest = (id: string) => {
    setSelectedId(id);
    if (!hasSidebar) setDetailsOpen(true);
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          label="Maintenance status"
          value={tab}
          onChange={(value) => {
            setTab(value);
            setSelectedId(null);
            setDetailsOpen(false);
          }}
          tabs={[
            { value: "open", label: "Open", count: bucketCount("open") },
            {
              value: "in_progress",
              label: "In progress",
              count: bucketCount("in_progress"),
            },
            {
              value: "resolved",
              label: "Resolved",
              count: bucketCount("resolved"),
            },
            { value: "all", label: "All", count: rows.length },
          ]}
        />
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" aria-hidden />
          Report an issue
        </Button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] bg-[var(--vms-surface)] px-3">
          <Search
            aria-hidden
            className="h-4 w-4 shrink-0 text-[var(--vms-ink-muted)]"
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search requests…"
            aria-label="Search maintenance requests"
            className="min-h-10 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--vms-ink-muted)]"
          />
        </div>
        <div className="flex items-center gap-2 rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] bg-[var(--vms-surface)] px-3 sm:w-52">
          <Wrench
            aria-hidden
            className="h-4 w-4 shrink-0 text-[var(--vms-ink-muted)]"
          />
          <select
            value={category}
            aria-label="Filter by category"
            onChange={(event) => setCategory(event.target.value)}
            className="min-h-10 min-w-0 flex-1 bg-transparent text-sm outline-none"
          >
            <option value="all">All categories</option>
            {categories.map((option) => (
              <option key={option} value={option}>
                {roleLabel(option)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <State query={query} rows={4}>
        {!filtered.length ? (
          <div className={cn(surfaceClass, "py-2")}>
            <EmptyRow
              icon={Wrench}
              title={rows.length ? "Nothing in this view" : "No maintenance requests"}
              description={
                rows.length
                  ? "Try another status, category or search term."
                  : "Report a fault and property management will pick it up from here."
              }
            />
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] xl:items-start">
            <div className={cn(surfaceClass, "min-w-0 overflow-x-auto")}>
              <table className="w-full min-w-[34rem] border-collapse text-sm">
                <caption className="sr-only">
                  Maintenance requests for {place.name}
                </caption>
                <thead>
                  <tr className="border-b border-[var(--vms-line)] text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--vms-ink-muted)]">
                    <th scope="col" className="px-3 py-2.5">
                      Ticket
                    </th>
                    <th scope="col" className="px-3 py-2.5">
                      Issue
                    </th>
                    <th scope="col" className="hidden px-3 py-2.5 sm:table-cell">
                      Category
                    </th>
                    <th scope="col" className="hidden px-3 py-2.5 md:table-cell">
                      Reported
                    </th>
                    <th scope="col" className="px-3 py-2.5">
                      Status
                    </th>
                    <th scope="col" className="w-8 px-1 py-2.5">
                      <span className="sr-only">Open</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => {
                    const active = selected?.id === item.id;
                    return (
                      <tr
                        key={item.id}
                        className={cn(
                          "cursor-pointer border-b border-[var(--vms-line)] transition last:border-b-0",
                          active
                            ? "bg-[var(--vms-surface-subtle)]"
                            : "hover:bg-[var(--vms-surface-subtle)]",
                        )}
                        onClick={() => openRequest(item.id)}
                      >
                        <td className="whitespace-nowrap px-3 py-2.5 text-xs font-semibold text-[var(--vms-ink-muted)]">
                          {ticketRef(item.id)}
                        </td>
                        <td className="min-w-0 px-3 py-2.5">
                          <button
                            type="button"
                            onClick={() => openRequest(item.id)}
                            className="block max-w-[16rem] truncate text-left font-semibold text-[var(--vms-ink)] underline-offset-4 hover:underline"
                          >
                            {item.title}
                          </button>
                        </td>
                        <td className="hidden px-3 py-2.5 text-xs text-[var(--vms-ink-muted)] sm:table-cell">
                          {titleCaseStatus(item.category)}
                        </td>
                        <td className="hidden whitespace-nowrap px-3 py-2.5 text-xs text-[var(--vms-ink-muted)] md:table-cell">
                          {date(item.created_at)}
                        </td>
                        <td className="px-3 py-2.5">
                          <StatusPill status={item.status} />
                        </td>
                        <td className="px-1 py-2.5 text-right text-[var(--vms-ink-muted)]">
                          <ChevronRight aria-hidden className="ml-auto h-4 w-4" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="px-3 pb-2">
                <Pagination
                  page={page}
                  more={page * 20 < (query.data?.total ?? 0)}
                  onPage={setPage}
                  total={query.data?.total}
                />
              </div>
            </div>

            {selected ? (
              <aside className="hidden min-w-0 xl:sticky xl:top-4 xl:block">
                <MaintenanceDetails
                  request={selected}
                  onClose={() => setSelectedId(null)}
                />
              </aside>
            ) : null}
          </div>
        )}
      </State>
      {hasSidebar ? null : (
        <Drawer
          isOpen={detailsOpen}
          onClose={() => setDetailsOpen(false)}
          side="right"
          className="sm:max-w-md"
          title="Maintenance request"
          description="Progress, priority and updates for this request."
          contentClassName="p-0"
        >
          <MaintenanceDetails
            request={selected}
            onClose={() => setDetailsOpen(false)}
          />
        </Drawer>
      )}
      <FormDrawer
        isOpen={open}
        onClose={() => {
          if (!save.isPending) setOpen(false);
        }}
        title="New maintenance request"
        description={`Report an issue at ${place.name}. Property management triages every request.`}
        onSubmit={(event) => {
          event.preventDefault();
          save.mutate();
        }}
        submitLabel="Submit request"
        isSubmitting={save.isPending}
        error={save.isError ? parseApiError(save.error).message : null}
        footerNote="You will be notified when the request changes status."
      >
        <FormRecordSummary
          title={qualifiedPlaceName(context.place)}
          meta={`Category defaults to ${roleLabel(categories[0] ?? "plumbing")}`}
        />
        <FormSection
          title="What is wrong?"
          description="Describe the fault so the right trade can be assigned."
        >
          <Field
            id="request-title"
            label="Title"
            required
            description="A short summary, e.g. “Kitchen tap leaking”."
          >
            {(control) => (
              <input
                {...control}
                className={fieldControlClassName}
                required
                minLength={3}
                maxLength={180}
                value={input.title}
                onChange={(event) =>
                  setInput({ ...input, title: event.target.value })
                }
              />
            )}
          </Field>
          <Field
            id="request-description"
            label="Describe the issue"
            required
            description={`${input.description.length} of 10000 characters`}
          >
            {(control) => (
              <textarea
                {...control}
                className={fieldControlClassName}
                required
                minLength={10}
                maxLength={10000}
                rows={5}
                value={input.description}
                onChange={(event) =>
                  setInput({ ...input, description: event.target.value })
                }
              />
            )}
          </Field>
        </FormSection>
        <FormSection
          title="Classification"
          description="Used for routing, response targets and reporting."
        >
          <Field id="request-category" label="Category" required>
            {(control) => (
              <select
                {...control}
                className={fieldControlClassName}
                value={input.category}
                onChange={(event) =>
                  setInput({ ...input, category: event.target.value })
                }
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {roleLabel(category)}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field
            id="request-priority"
            label="Priority"
            required
            description="Urgent requests page the on-call caretaker."
          >
            {(control) => (
              <select
                {...control}
                className={fieldControlClassName}
                value={input.priority}
                onChange={(event) =>
                  setInput({
                    ...input,
                    priority: event.target
                      .value as MaintenanceInput["priority"],
                  })
                }
              >
                {["low", "normal", "high", "urgent"].map((priority) => (
                  <option key={priority} value={priority}>
                    {roleLabel(priority)}
                  </option>
                ))}
              </select>
            )}
          </Field>
        </FormSection>
      </FormDrawer>
    </div>
  );
}
function MaintenanceDetails({
  request,
  onClose,
}: {
  request: PersonalMaintenance | null;
  onClose?: () => void;
}) {
  if (!request) return null;
  return (
    <div className={cn(surfaceClass, "px-4 py-4 sm:px-5 sm:py-5")}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--vms-ink-muted)]">
          {ticketRef(request.id)}
        </p>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close request details"
            className="grid h-8 w-8 place-items-center rounded-md text-[var(--vms-ink-muted)] hover:bg-[var(--vms-surface-subtle)] hover:text-[var(--vms-ink)]"
          >
            ×
          </button>
        ) : null}
      </div>
      <h2 className="mt-1 text-lg font-semibold leading-6 tracking-[-0.01em] text-[var(--vms-ink)]">
        {request.title}
      </h2>
      <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--vms-ink-muted)]">
        <span className="inline-flex items-center gap-1">
          <Wrench aria-hidden className="h-3.5 w-3.5" />
          {titleCaseStatus(request.category)}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock3 aria-hidden className="h-3.5 w-3.5" />
          Reported {date(request.created_at)}
        </span>
      </p>

      <ol className="mt-4 flex items-center gap-1" aria-label="Progress">
        {maintenanceSteps.map((step, index) => {
          const reached = index <= maintenanceStep(request.status);
          return (
            <li key={step} className="flex flex-1 items-center gap-1">
              <span
                className={cn(
                  "grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[10px] font-bold",
                  reached
                    ? "border-[var(--vms-success)] bg-[var(--vms-success)] text-white"
                    : "border-[var(--vms-line-strong)] text-[var(--vms-ink-muted)]",
                )}
              >
                {reached ? "✓" : index + 1}
              </span>
              <span className="min-w-0 truncate text-[10px] font-medium text-[var(--vms-ink-muted)]">
                {step}
              </span>
              {index < maintenanceSteps.length - 1 ? (
                <span
                  aria-hidden
                  className={cn(
                    "h-px flex-1",
                    reached ? "bg-[var(--vms-success)]" : "bg-[var(--vms-line)]",
                  )}
                />
              ) : null}
            </li>
          );
        })}
      </ol>

      <div className="mt-4 rounded-lg border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] px-3 py-2.5">
        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--vms-ink-muted)]">
          Priority
        </p>
        <p className="mt-0.5 text-sm font-semibold capitalize text-[var(--vms-ink)]">
          {titleCaseStatus(request.priority)}
        </p>
      </div>

      <div className="mt-4 border-t border-[var(--vms-line)] pt-4">
        <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--vms-ink-muted)]">
          What you reported
        </h3>
        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[var(--vms-ink)]">
          {request.description}
        </p>
      </div>

      <div className="mt-4 border-t border-[var(--vms-line)] pt-4">
        <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--vms-ink-muted)]">
          Updates
        </h3>
        <ol className="mt-2.5 space-y-3">
          <li className="flex gap-2.5">
            <span
              aria-hidden
              className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--vms-action)]"
            />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-[var(--vms-ink)]">
                {date(request.created_at)}
              </p>
              <p className="mt-0.5 text-xs leading-5 text-[var(--vms-ink-muted)]">
                Request received and logged for this Place.
              </p>
            </div>
          </li>
          <li className="flex gap-2.5">
            <span
              aria-hidden
              className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--vms-line-strong)]"
            />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-[var(--vms-ink)]">
                Current status · {titleCaseStatus(request.status)}
              </p>
              <p className="mt-0.5 text-xs leading-5 text-[var(--vms-ink-muted)]">
                Property management updates this request as work progresses.
              </p>
            </div>
          </li>
        </ol>
      </div>
    </div>
  );
}
