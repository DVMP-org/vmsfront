"use client";

import type { QueryContext } from "@/lib/query-keys";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Building2,
  CalendarDays,
  Clock3,
  MapPin,
  Pencil,
  ReceiptText,
  UserPlus,
  Users,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { PropertyImage } from "@/components/ui/PropertyImage";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Assignment } from "@/features/charges/api";
import type { Place } from "@/features/places/api";
import { useSiteAccess } from "@/features/context/use-site-access";
import type { WorkspaceRelationship } from "@/types";
import { residentialApi } from "./api";
import { titleCase } from "./contracts";

export type ResidentialUnitRow = Place & {
  building_id: string;
  building_name: string;
  status: string;
  occupancy_status: string;
  residents: string;
};

const detailTabs = ["Overview", "Residents", "Charges"] as const;
type DetailTab = (typeof detailTabs)[number];

function dateLabel(value?: string | null) {
  if (!value || !Number.isFinite(Date.parse(value))) return "Not recorded";
  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function DetailSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Building2;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4 border-b border-[var(--vms-line)] px-5 py-5 last:border-0 sm:px-6">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <Icon
          className="h-4 w-4 text-[var(--vms-ink-muted)]"
          aria-hidden="true"
        />
        {title}
      </h3>
      {children}
    </section>
  );
}

export function ResidentialUnitDetail({
  unit,
  relationships,
  contextKey,
  siteId,
  canManageUnits,
  canManagePeople,
  onClose,
  onEdit,
  onAssign,
}: {
  unit?: ResidentialUnitRow;
  relationships: WorkspaceRelationship[];
  contextKey: QueryContext;
  siteId: string;
  canManageUnits: boolean;
  canManagePeople: boolean;
  onClose: () => void;
  onEdit: (unit: ResidentialUnitRow) => void;
  onAssign: (id: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<DetailTab>("Overview");
  const tabId = useId();
  useEffect(() => {
    if (unit?.id) setActiveTab("Overview");
  }, [unit?.id]);
  // Retain the selected record during dismissal so the exit never collapses.
  const retained = useRef(unit);
  if (unit) retained.current = unit;
  const current = unit || retained.current;
  const { allowed } = useSiteAccess();
  const canReadCharges = allowed("charges.list");
  const charges = useQuery({
    queryKey: ["residential", contextKey, "charge-assignments", siteId],
    queryFn: residentialApi.chargeAssignments,
    enabled: !!unit && !!siteId && canReadCharges,
    retry: false,
  });
  if (!current) return null;
  const residents = relationships.filter(
    (row) => row.place.id === current.id && row.status === "active",
  );
  const assignments = (charges.data || []).filter(
    (row) => row.target_place.id === current.id,
  );
  const activity = [
    {
      id: "updated",
      title: "Unit record updated",
      date: current.updated_at,
      detail: current.name,
    },
    ...residents.map((row) => ({
      id: row.id,
      title: "Relationship recorded",
      date: row.created_at,
      detail: `${row.party.display_name} · ${titleCase(row.role)}`,
    })),
  ]
    .filter((row) => row.date && Number.isFinite(Date.parse(row.date)))
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
    .slice(0, 4);
  const unitType = current.building_type
    ? titleCase(current.building_type)
    : "Unit";

  return (
    <Drawer
      isOpen={!!unit}
      onClose={onClose}
      title={current.name}
      description={`${current.building_name} · ${unitType}`}
      eyebrow="Unit details"
      icon={Building2}
      className="sm:max-w-[480px]"
      contentClassName="p-0 sm:p-0"
      footer={
        <Button asChild variant="outline" className="w-full">
          <Link href={`/admin/places/${encodeURIComponent(current.id)}`}>
            View unit
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      }
    >
      <div className="space-y-4 border-b border-[var(--vms-line)] px-5 py-5 sm:px-6">

        <div className="flex flex-wrap gap-2">
          <StatusBadge
            tone={
              current.occupancy_status === "occupied" ? "success" : "neutral"
            }
            icon={
              <span
                className="h-1.5 w-1.5 rounded-full bg-current"
                aria-hidden="true"
              />
            }
          >
            {current.occupancy_status === "occupied" ? "Occupied" : "Vacant"}
          </StatusBadge>
          <StatusBadge tone={current.is_active ? "neutral" : "warning"}>
            {current.is_active ? "Active" : "Archived"}
          </StatusBadge>
        </div>
        {(canManageUnits || canManagePeople) && (
          <div className="flex flex-wrap gap-2">
            {canManageUnits && (
              <Button
                variant="outline"
                onClick={() => onEdit(current)}
                className="flex-1"
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
                Edit unit
              </Button>
            )}
            {canManagePeople && (
              <Button onClick={() => onAssign(current.id)} className="flex-1">
                <UserPlus className="h-4 w-4" aria-hidden="true" />
                Assign resident
              </Button>
            )}
          </div>
        )}
      </div>
      <div
        role="tablist"
        aria-label="Unit detail sections"
        className="sticky top-0 z-10 flex border-b border-[var(--vms-line)] bg-[var(--vms-surface)] px-5 sm:px-6"
      >
        {detailTabs.map((tab, index) => (
          <button
            key={tab}
            type="button"
            role="tab"
            id={`${tabId}-tab-${tab}`}
            aria-controls={`${tabId}-panel-${tab}`}
            aria-selected={activeTab === tab}
            tabIndex={activeTab === tab ? 0 : -1}
            onClick={() => setActiveTab(tab)}
            onKeyDown={(event) => {
              let next = index;
              if (event.key === "ArrowRight")
                next = (index + 1) % detailTabs.length;
              else if (event.key === "ArrowLeft")
                next = (index + detailTabs.length - 1) % detailTabs.length;
              else if (event.key === "Home") next = 0;
              else if (event.key === "End") next = detailTabs.length - 1;
              else return;
              event.preventDefault();
              setActiveTab(detailTabs[next]);
              document
                .getElementById(`${tabId}-tab-${detailTabs[next]}`)
                ?.focus();
            }}
            className={`min-h-11 flex-1 border-b-2 px-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--vms-focus)] ${activeTab === tab ? "border-[var(--vms-ink)] text-[var(--vms-ink)]" : "border-transparent text-[var(--vms-ink-muted)] hover:text-[var(--vms-ink)]"}`}
          >
            {tab}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`${tabId}-panel-Overview`}
        aria-labelledby={`${tabId}-tab-Overview`}
        hidden={activeTab !== "Overview"}
        tabIndex={0}
        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--vms-focus)]"
      >
        <DetailSection title="Unit information" icon={Building2}>
          <dl className="grid grid-cols-2 gap-x-5 gap-y-4 text-sm">
            {[
              ["Unit type", unitType],
              ["Building", current.building_name],
              ["Status", current.is_active ? "Active" : "Archived"],
              ["Last updated", dateLabel(current.updated_at)],
            ].map(([label, value]) => (
              <div key={label} className="min-w-0">
                <dt className="text-xs text-[var(--vms-ink-muted)]">{label}</dt>
                <dd className="mt-1 break-words font-medium">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="flex items-start gap-2 border-t border-[var(--vms-line)] pt-4">
            <MapPin
              className="mt-0.5 h-4 w-4 shrink-0 text-[var(--vms-ink-muted)]"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p className="text-xs text-[var(--vms-ink-muted)]">Address</p>
              <p className="mt-1 break-words text-sm">
                {current.address || "No address recorded"}
              </p>
            </div>
          </div>
          {current.description && (
            <div>
              <p className="text-xs text-[var(--vms-ink-muted)]">Description</p>
              <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6">
                {current.description}
              </p>
            </div>
          )}
        </DetailSection>
        <DetailSection title="Recorded activity" icon={Clock3}>
          {activity.length ? (
            <ol className="ml-1.5 space-y-4 border-l border-[var(--vms-line)] pl-5">
              {activity.map((row) => (
                <li key={row.id} className="relative">
                  <span
                    className="absolute -left-[25px] top-1.5 h-2 w-2 rounded-full border border-[var(--vms-ink-muted)] bg-[var(--vms-surface)]"
                    aria-hidden="true"
                  />
                  <p className="text-sm font-medium">{row.title}</p>
                  <p className="mt-1 break-words text-xs text-[var(--vms-ink-muted)]">
                    {row.detail}
                  </p>
                  <time
                    dateTime={row.date}
                    className="mt-1 block text-xs tabular-nums text-[var(--vms-ink-muted)]"
                  >
                    {dateLabel(row.date)}
                  </time>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-[var(--vms-ink-muted)]">
              No activity timestamps recorded.
            </p>
          )}
        </DetailSection>
      </div>
      <div
        role="tabpanel"
        id={`${tabId}-panel-Residents`}
        aria-labelledby={`${tabId}-tab-Residents`}
        hidden={activeTab !== "Residents"}
        tabIndex={0}
        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--vms-focus)]"
      >
        <DetailSection title="Residents" icon={Users}>
          {!residents.length ? (
            <p className="text-sm text-[var(--vms-ink-muted)]">
              No active household. Assign a resident to connect this unit to its
              occupants.
            </p>
          ) : (
            <ul className="space-y-4">
              {residents.map((row) => (
                <li key={row.id} className="flex items-start gap-3">
                  <Avatar name={row.party.display_name} decorative />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/residential/occupancies/${encodeURIComponent(row.id)}`}
                      className="inline-flex max-w-full items-center gap-1 text-sm font-semibold underline-offset-4 hover:underline"
                    >
                      <span className="truncate">{row.party.display_name}</span>
                      <ArrowUpRight
                        className="h-3.5 w-3.5 shrink-0 text-[var(--vms-ink-muted)]"
                        aria-hidden="true"
                      />
                    </Link>
                    <p className="mt-0.5 text-xs text-[var(--vms-ink-muted)]">
                      {titleCase(row.role)}
                      {row.effective_from
                        ? ` · Since ${dateLabel(row.effective_from)}`
                        : ""}
                    </p>
                    {row.party.email && (
                      <p className="mt-1 break-all text-xs text-[var(--vms-ink-muted)]">
                        {row.party.email}
                      </p>
                    )}
                    {row.effective_to && (
                      <p className="mt-1 text-xs text-[var(--vms-ink-muted)]">
                        Until {dateLabel(row.effective_to)}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </DetailSection>
      </div>
      <div
        role="tabpanel"
        id={`${tabId}-panel-Charges`}
        aria-labelledby={`${tabId}-tab-Charges`}
        hidden={activeTab !== "Charges"}
        tabIndex={0}
        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--vms-focus)]"
      >
        <DetailSection title="Charges & balance" icon={ReceiptText}>
          {!canReadCharges ? (
            <p className="text-sm text-[var(--vms-ink-muted)]">
              Charge information is not available with your access.
            </p>
          ) : charges.isPending ? (
            <p role="status" className="text-sm text-[var(--vms-ink-muted)]">
              Loading charges…
            </p>
          ) : charges.isError ? (
            <div role="alert" className="space-y-2">
              <p className="text-sm text-[var(--vms-danger)]">
                Could not load charges.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void charges.refetch()}
              >
                Retry charges
              </Button>
            </div>
          ) : (
            <UnitCharges assignments={assignments} />
          )}
        </DetailSection>
      </div>
    </Drawer>
  );
}

function money(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

function UnitCharges({ assignments }: { assignments: Assignment[] }) {
  if (!assignments.length)
    return (
      <p className="text-sm text-[var(--vms-ink-muted)]">
        No charges assigned to this unit.
      </p>
    );
  const totals = new Map<string, number>();
  for (const item of assignments) {
    const currency = item.charge_definition.currency;
    totals.set(
      currency,
      (totals.get(currency) || 0) + Number(item.outstanding_amount || 0),
    );
  }
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] p-4">
        <p className="text-xs font-medium text-[var(--vms-ink-muted)]">
          Outstanding balance
        </p>
        {Array.from(totals).map(([currency, total]) => (
          <p
            key={currency}
            className="mt-1 break-words text-2xl font-semibold tracking-tight tabular-nums"
          >
            {money(total, currency)}
          </p>
        ))}
      </div>
      <ul className="divide-y divide-[var(--vms-line)]">
        {assignments.map((item) => (
          <li key={item.id} className="space-y-2 py-3 first:pt-0 last:pb-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="break-words text-sm font-medium">
                  {item.charge_definition.name}
                </p>
                <p className="mt-1 text-xs text-[var(--vms-ink-muted)]">
                  {money(
                    Number(item.charge_definition.amount),
                    item.charge_definition.currency,
                  )}{" "}
                  · {titleCase(item.charge_definition.recurrence)}
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold tabular-nums">
                {money(
                  Number(item.outstanding_amount || 0),
                  item.charge_definition.currency,
                )}
              </span>
            </div>
            {item.next_due_date && (
              <p className="flex items-center gap-1.5 text-xs text-[var(--vms-ink-muted)]">
                <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                Next due {dateLabel(item.next_due_date)}
              </p>
            )}
            {item.current_responsibility && (
              <p className="text-xs text-[var(--vms-ink-muted)]">
                Responsible:{" "}
                {item.current_responsibility.responsible_party.display_name}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
