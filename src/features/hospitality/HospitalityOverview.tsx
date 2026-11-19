"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { useAuthStore } from "@/store/auth-store";
import { adminService } from "@/services/admin-service";
import { hasAdminPermission } from "@/lib/permissions";
import { parseApiError } from "@/lib/error-utils";
import { FacetItem, FacetPicker } from "@/components/facets/FacetPicker";
import { Button } from "@/components/ui/Button";
import {
  DataTable,
  type BulkAction,
  type Column,
} from "@/components/ui/DataTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatDateTime } from "@/lib/datetime";
import { AttentionQueueSection } from "@/features/dashboard/AttentionQueueSection";
import { contextApi } from "@/features/context/api";
import { hospitalityApi } from "@/features/hospitality/api";
import { HospitalityMetricStrip } from "@/features/hospitality/HospitalityMetricStrip";
import { HotelArrivalsPanel } from "@/features/hospitality/HotelArrivalsPanel";
import { RoomReadinessPanel } from "@/features/hospitality/RoomReadinessPanel";
import { StayReviewDrawer } from "@/features/hospitality/StayReviewDrawer";
import { StayStatusBadge } from "@/features/hospitality/components/StayStatusBadge";
import { useHospitalitySiteRooms } from "@/features/hospitality/queries";
import { guestName, Stay, statusLabel } from "@/features/hospitality/contracts";
import "@/app/admin/hospitality/styles.css";
import PageLoader from "@/components/ui/PageLoader";

const RoomOperationsAnalytics = dynamic(
  () =>
    import("@/features/hospitality/RoomOperationsAnalytics").then(
      (module) => module.RoomOperationsAnalytics,
    ),
  {
    ssr: false,
    loading: () => (
      <div
        role="status"
        aria-label="Loading room operations chart"
        className="mt-4 min-h-64 animate-pulse rounded-[var(--vms-radius-surface)] bg-[var(--vms-surface-subtle)] motion-reduce:animate-none"
      />
    ),
  },
);

export default function HospitalityOverview() {
  const organization = useAppStore((s) => s.organization);
  const selectedSite = useAppStore((s) => s.selectedSite);
  const user = useAuthStore((s) => s.user);
  const context = `${organization?.id}:${selectedSite?.id}:${user?.id}`;
  return (
    <HospitalityWorkspace
      key={context}
      context={context}
      enabled={!!organization?.id && !!user?.id}
      propertyId={selectedSite?.id}
      propertyName={selectedSite?.name}
    />
  );
}
function HospitalityWorkspace({
  context,
  enabled,
  propertyId,
  propertyName,
}: {
  context: string;
  enabled: boolean;
  propertyId?: string;
  propertyName?: string;
}) {
  const client = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const profile = useQuery({
    queryKey: ["hospitality-profile", context],
    queryFn: async () => (await adminService.getAdminProfile()).data,
    enabled,
    staleTime: 0,
    refetchOnMount: "always",
  });
  const allowed = (action: string) =>
    profile.isFetchedAfterMount &&
    !profile.isError &&
    hasAdminPermission(profile.data, `hospitality_stays.${action}`);
  const list = useQuery({
    queryKey: ["hospitality", context, "list", page, status],
    queryFn: () => hospitalityApi.list(page, status),
    enabled: allowed("list"),
  });
  const reserved = useQuery({
    queryKey: ["hospitality", context, "list", 1, "reserved"],
    queryFn: () => hospitalityApi.list(1, "reserved"),
    enabled: allowed("list"),
  });
  const checkedIn = useQuery({
    queryKey: ["hospitality", context, "list", 1, "checked_in"],
    queryFn: () => hospitalityApi.list(1, "checked_in"),
    enabled: allowed("list"),
  });
  const detail = useQuery({
    queryKey: ["hospitality", context, "detail", selected],
    queryFn: () => hospitalityApi.get(selected!),
    enabled: !!selected && allowed("show"),
  });
  const rooms = useHospitalitySiteRooms(context, allowed("list"));
  const workspaceContext = useQuery({
    queryKey: ["hospitality", context, "workspace-context", propertyId],
    queryFn: () => contextApi.workspace(propertyId!),
    enabled: enabled && !!propertyId && allowed("list"),
    retry: false,
  });
  const changed = async (stay: Stay, message: string) => {
    setNotice(message);
    client.setQueryData(["hospitality", context, "detail", stay.id], stay);
    await client.invalidateQueries({ queryKey: ["hospitality", context] });
  };
  if (!enabled || profile.isPending || !profile.isFetchedAfterMount)
    return (
      <main className="w-full pb-10 pt-3 text-[var(--vms-ink)]">
        <PageLoader message="Loading hospitality permissions…" />
      </main>
    );
  if (profile.isError)
    return (
      <div
        role="alert"
        className="rounded-[var(--vms-radius-surface)] border border-[color-mix(in_srgb,var(--vms-danger)_35%,white)] bg-[var(--vms-danger-subtle)] p-5 text-sm text-[var(--vms-ink)]"
      >
        <p>Could not verify your hospitality permissions.</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => profile.refetch()}
        >
          Retry
        </Button>
      </div>
    );
  if (!allowed("list"))
    return (
      <p role="alert">You do not have permission to view hospitality stays.</p>
    );
  const stayColumns: Column<Stay>[] = [
    {
      key: "guest",
      header: "Guest",
      sortable: true,
      accessor: (stay) => (
        <div className="min-w-0">
          <strong className="block truncate text-sm">{guestName(stay)}</strong>
          <span className="text-xs text-[var(--vms-ink-muted)]">
            {stay.guests.length} guest{stay.guests.length === 1 ? "" : "s"}
          </span>
        </div>
      ),
    },
    {
      key: "planned_check_in",
      header: "Stay",
      sortable: true,
      accessor: (stay) => (
        <span className="text-sm">
          {formatDateTime(stay.planned_check_in)} →{" "}
          {formatDateTime(stay.planned_check_out)}
        </span>
      ),
    },
    {
      key: "room",
      header: "Room",
      sortable: true,
      accessor: (stay) => (
        <span className="text-sm text-[var(--vms-ink-muted)]">
          {stay.room_assignments.at(-1)?.room.name || "Unassigned"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      accessor: (stay) => <StayStatusBadge status={stay.status} />,
    },
    {
      key: "actions",
      header: "",
      mobileHide: true,
      accessor: (stay) => (
        <Button
          variant="ghost"
          size="sm"
          disabled={!allowed("show")}
          aria-label={`Review stay for ${guestName(stay)}`}
          onClick={() => {
            setSelected(stay.id);
            setNotice("");
          }}
        >
          Review stay
        </Button>
      ),
    },
  ];
  const stayBulkActions: BulkAction[] = [
    {
      label: "Export selected",
      icon: Download,
      onClick: (ids) => {
        const selectedStays =
          list.data?.items.filter((stay) => ids.includes(stay.id)) ?? [];
        const rows = [
          ["Guest", "Check in", "Check out", "Room", "Status"],
          ...selectedStays.map((stay) => [
            guestName(stay),
            new Date(stay.planned_check_in).toISOString(),
            new Date(stay.planned_check_out).toISOString(),
            stay.room_assignments.at(-1)?.room.name || "",
            statusLabel(stay.status),
          ]),
        ];
        const csv = rows
          .map((row) =>
            row
              .map((value) => `"${String(value).replaceAll('"', '""')}"`)
              .join(","),
          )
          .join("\n");
        const url = URL.createObjectURL(
          new Blob([csv], { type: "text/csv;charset=utf-8" }),
        );
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "hospitality-stays.csv";
        anchor.click();
        URL.revokeObjectURL(url);
      },
    },
  ];
  return (
    <main className="stay-workspace">
      <PageHeader
        eyebrow="Operations Hub / Hospitality"
        title="Hotel operations"
        description={
          propertyName
            ? `Manage ${propertyName}, its people, room assignments, stays and guest arrivals.`
            : "Manage the selected site, its people, room assignments, stays and guest arrivals."
        }
      />

      <div className="mt-5">
        <HospitalityMetricStrip
          rooms={rooms.data ?? []}
          reservedCount={reserved.data?.total ?? 0}
          checkedInCount={checkedIn.data?.total ?? 0}
          roomsLoading={rooms.isPending}
          roomsError={rooms.isError}
          staysLoading={reserved.isPending}
          staysError={reserved.isError}
          checkedInLoading={checkedIn.isPending}
          checkedInError={checkedIn.isError}
        />
      </div>
      <div className="mt-4 mb-2">
        <AttentionQueueSection
          useCase="hospitality"
          propertyName={propertyName || "this property"}
        />
      </div>
      {notice && (
        <p role="status" className="stay-notice">
          {notice}
        </p>
      )}
      <div className="grid gap-4 xl:grid-cols-2">
        <HotelArrivalsPanel
          authorityMode={workspaceContext.data?.management?.mode}
          authoritativeSiteName={
            workspaceContext.data?.management?.authoritative_site?.name
          }
          stays={reserved.data?.items || []}
          isLoading={reserved.isPending}
          error={
            reserved.isError ? parseApiError(reserved.error).message : null
          }
          onRetry={() => void reserved.refetch()}
          onOpenStay={(id) => {
            setSelected(id);
            setNotice("");
          }}
        />
        <RoomReadinessPanel
          rooms={rooms.data ?? []}
          isLoading={rooms.isPending}
          error={rooms.isError ? parseApiError(rooms.error).message : null}
          onRetry={() => void rooms.refetch()}
        />
      </div>
      <RoomOperationsAnalytics
        rooms={rooms.data ?? []}
        isLoading={rooms.isPending}
        error={rooms.isError ? parseApiError(rooms.error).message : null}
        onRetry={() => void rooms.refetch()}
      />
      <div className="stay-layout">
        <section
          id="stays"
          tabIndex={-1}
          className="stay-panel"
          aria-label="Stay list"
        >
          <div className="stay-list-heading">
            <h2>Stays</h2>
            <label>
              Status
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All statuses</option>
                {[
                  "reserved",
                  "checked_in",
                  "checked_out",
                  "cancelled",
                  "no_show",
                ].map((s) => (
                  <option key={s} value={s}>
                    {statusLabel(s)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <DataTable
            data={list.data?.items ?? []}
            columns={stayColumns}
            tableLabel="Hospitality stays"
            searchable={false}
            serverSide
            total={list.data?.total ?? 0}
            currentPage={page}
            onPageChange={setPage}
            pageSize={10}
            pageSizeOptions={[10]}
            isLoading={list.isPending}
            errorMessage={
              list.isError && !list.data
                ? parseApiError(list.error).message
                : undefined
            }
            isStale={list.isError && !!list.data}
            onRetry={() => list.refetch()}
            emptyMessage={
              status ? "No stays match this status" : "No stays yet"
            }
            selectable
            getRowId={(stay) => stay.id}
            bulkActions={stayBulkActions}
            mobileSummary={(stay) => (
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <strong className="block text-sm">{guestName(stay)}</strong>
                    <span className="text-xs text-[var(--vms-ink-muted)]">
                      {formatDateTime(stay.planned_check_in)} →{" "}
                      {formatDateTime(stay.planned_check_out)}
                    </span>
                  </div>
                  <StayStatusBadge status={stay.status} />
                </div>
                <p className="mt-2 text-xs text-[var(--vms-ink-muted)]">
                  {stay.room_assignments.at(-1)?.room.name
                    ? `Room ${stay.room_assignments.at(-1)?.room.name}`
                    : "Room unassigned"}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  disabled={!allowed("show")}
                  aria-label={`Review stay for ${guestName(stay)}`}
                  onClick={() => {
                    setSelected(stay.id);
                    setNotice("");
                  }}
                >
                  Review stay
                </Button>
              </div>
            )}
          />
        </section>
      </div>
      <StayReviewDrawer
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        stay={detail.data}
        isLoading={detail.isPending}
        error={detail.isError ? parseApiError(detail.error).message : null}
        onRetry={() => void detail.refetch()}
        canCheckIn={allowed("checkin")}
        canCheckOut={allowed("checkout")}
        canUpdate={allowed("update")}
        onChanged={changed}
      />
    </main>
  );
}
