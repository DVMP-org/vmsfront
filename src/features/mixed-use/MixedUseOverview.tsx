"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Building2,
  Calculator,
  Receipt,
  Share2,
  Users,
  Wrench,
} from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { AttentionQueueSection } from "@/features/dashboard/AttentionQueueSection";
import {
  placesApi,
  type PlaceTreeNode,
} from "@/features/places/api";
import { useAppStore } from "@/store/app-store";
import { mixedUseApi } from "./api";
import { MixedUseShell } from "./MixedUseShell";

const modules = [
  {
    href: "/admin/places",
    label: "Buildings & spaces",
    description: "Unified building, unit, room and common-space inventory.",
    icon: Building2,
  },
  {
    href: "/admin/people",
    label: "Occupancy & tenancies",
    description: "Residents, tenants, businesses, staff and guests by space.",
    icon: Users,
  },
  {
    href: "/admin/charges",
    label: "Revenue & charges",
    description: "Consolidated profile charges, balances and collections.",
    icon: Receipt,
  },
  {
    href: "/admin/mixed-use/maintenance",
    label: "Facilities & maintenance",
    description: "Shared infrastructure and domain-classified work orders.",
    icon: Wrench,
  },
  {
    href: "/admin/mixed-use/facilities",
    label: "Shared facilities",
    description: "Amenities and capacity shared across property domains.",
    icon: Share2,
  },
  {
    href: "/admin/mixed-use/expenses",
    label: "Expense allocation",
    description: "Recoverable shared costs allocated by domain or space.",
    icon: Calculator,
  },
];

export function MixedUseOverview() {
  const selectedSite = useAppStore((state) => state.selectedSite);
  const facilities = useQuery({
    queryKey: ["mixed-use-overview-facilities", selectedSite?.id],
    queryFn: () =>
      mixedUseApi.listFacilities(selectedSite!.id, {
        page: 1,
        page_size: 100,
        active: true,
      }),
    enabled: !!selectedSite?.id,
    retry: false,
  });
  const allocations = useQuery({
    queryKey: ["mixed-use-overview-allocations", selectedSite?.id],
    queryFn: () =>
      mixedUseApi.listAllocations(selectedSite!.id, {
        page: 1,
        page_size: 100,
      }),
    enabled: !!selectedSite?.id,
    retry: false,
  });
  const tree = useQuery({
    queryKey: ["mixed-use-overview-tree"],
    queryFn: () =>
      selectedSite?.id
        ? placesApi.tree(selectedSite.id)
        : Promise.resolve([]),
    retry: false,
  });
  const selectedTree = findNode(tree.data ?? [], selectedSite?.id);
  const spaceCount = selectedTree ? countDescendants(selectedTree) : 0;
  const approvedAllocations =
    allocations.data?.items.filter((item) => item.status === "approved")
      .length ?? 0;

  return (
    <MixedUseShell
      title="Place operations"
      description="One operating view across residential, commercial, hospitality and shared spaces."
      primaryAction={
        <Badge variant="success">
          {selectedSite?.name || "Mixed-use property"}
        </Badge>
      }
    >
      <section
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Mixed-use operating summary"
      >
        <Metric label="Spaces in scope" value={spaceCount} />
        <Metric
          label="Shared facilities"
          value={facilities.data?.total ?? 0}
          unavailable={facilities.isError}
        />
        <Metric
          label="Approved allocations"
          value={approvedAllocations}
          unavailable={allocations.isError}
        />
        <article className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--vms-ink-muted)]">
            Context
          </p>
          <p className="mt-3 text-lg font-semibold">Mixed-use</p>
          <p className="mt-1 text-xs text-[var(--vms-ink-muted)]">
            Domain classification follows each space and occupancy.
          </p>
        </article>
      </section>

      <AttentionQueueSection
        useCase="mixed_use"
        propertyName={selectedSite?.name || "this property"}
      />

      <section className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)]">
        <header className="border-b border-[var(--vms-line)] p-5">
          <h2 className="text-lg font-semibold">Place modules</h2>
          <p className="mt-1 text-sm text-[var(--vms-ink-muted)]">
            One cohesive property-management experience, backed by shared
            operational services.
          </p>
        </header>
        <div className="grid gap-px bg-[var(--vms-line)] sm:grid-cols-2 xl:grid-cols-3">
          {modules.map(({ href, label, description, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="group bg-[var(--vms-surface)] p-5 transition-colors hover:bg-[var(--vms-surface-subtle)]"
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <h3 className="mt-3 font-semibold">{label}</h3>
              <p className="mt-1 text-sm leading-5 text-[var(--vms-ink-muted)]">
                {description}
              </p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--vms-action)]">
                Open module
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </MixedUseShell>
  );
}

function Metric({
  label,
  value,
  unavailable = false,
}: {
  label: string;
  value: number;
  unavailable?: boolean;
}) {
  return (
    <article className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--vms-ink-muted)]">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold">
        {unavailable ? "Unavailable" : value}
      </p>
    </article>
  );
}

function findNode(
  nodes: PlaceTreeNode[],
  selectedId?: string,
): PlaceTreeNode | null {
  if (!selectedId) return null;
  for (const node of nodes) {
    if (node.id === selectedId) return node;
    const child = findNode(node.children, selectedId);
    if (child) return child;
  }
  return null;
}

function countDescendants(node: PlaceTreeNode): number {
  return (node.children ?? []).reduce(
    (total, child) => total + 1 + countDescendants(child),
    0,
  );
}
