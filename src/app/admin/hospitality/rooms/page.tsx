"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BedDouble, Pencil, Sparkles, UsersRound, Wrench } from "lucide-react";

import { Button } from "@/components/ui/Button";
import {
  DataTable,
  type BulkAction,
  type Column,
} from "@/components/ui/DataTable";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { parseApiError } from "@/lib/error-utils";
import { hospitalityApi } from "@/features/hospitality/api";
import { HousekeepingDrawer } from "@/features/hospitality/components/HousekeepingDrawer";
import { RoomEditor } from "@/features/hospitality/components/RoomEditor";
import {
  HospitalityAdminPage,
  ModuleMetrics,
  ModulePanel,
  RoomStatus,
  displayDate,
  money,
} from "@/features/hospitality/HospitalityAdminPage";
import type {
  HospitalityRoom,
  RoomOperationalStatus,
} from "@/features/hospitality/contracts";
import { useHousekeepingAssignees } from "@/features/hospitality/queries";
import { useHospitalityAccess } from "@/features/hospitality/use-hospitality-access";

const roomStatusOptions: Array<{
  value: RoomOperationalStatus;
  label: string;
}> = [
  { value: "available", label: "Available" },
  { value: "reserved", label: "Reserved" },
  { value: "occupied", label: "Occupied" },
  { value: "cleaning", label: "Cleaning" },
  { value: "out_of_service", label: "Out of service" },
];

export default function HospitalityRoomsPage() {
  const access = useHospitalityAccess();
  const client = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<HospitalityRoom | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [housekeepingRoomId, setHousekeepingRoomId] = useState<string | null>(
    null,
  );
  const [notice, setNotice] = useState("");
  const rooms = useQuery({
    queryKey: ["hospitality-rooms", access.contextKey],
    queryFn: () => hospitalityApi.rooms.list(),
    enabled: !!access.organization?.id && access.allowed("list"),
  });
  const assignees = useHousekeepingAssignees(
    access.contextKey,
    !!access.organization?.id && access.allowed("list"),
  );
  const statusMutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: RoomOperationalStatus;
    }) => hospitalityApi.rooms.setStatus(id, status),
    onSuccess: async (_, variables) => {
      setNotice(
        `Room status changed to ${variables.status.replaceAll("_", " ")}.`,
      );
      await client.invalidateQueries({
        queryKey: ["hospitality-rooms", access.contextKey],
      });
    },
  });
  const data = useMemo(() => rooms.data ?? [], [rooms.data]);
  const summary = useMemo(
    () => ({
      available: data.filter((room) => room.status === "available").length,
      occupied: data.filter((room) => room.status === "occupied").length,
      attention: data.filter(
        (room) =>
          room.housekeeping_status === "dirty" ||
          room.housekeeping_status === "in_progress",
      ).length,
      maintenance: data.reduce(
        (total, room) => total + (room.maintenance_open || 0),
        0,
      ),
    }),
    [data],
  );
  const columns: Column<HospitalityRoom>[] = [
    {
      key: "name",
      header: "Room",
      sortable: true,
      minWidth: 180,
      accessor: (room) => (
        <div className="min-w-0">
          <strong className="block truncate">{room.name}</strong>
          <span className="text-xs text-[var(--vms-ink-muted)]">
            {room.room_number}
            {room.floor ? ` · Floor ${room.floor}` : ""}
          </span>
        </div>
      ),
    },
    {
      key: "room_type",
      header: "Type",
      sortable: true,
      responsiveHide: "xl",
      minWidth: 120,
      accessor: (room) => (
        // show room category here instead of room_type
        <div>
          <span className="block capitalize">{room.room_type}</span>
          <span className="text-xs text-[var(--vms-ink-muted)]">
            Sleeps {room.capacity}
          </span>
        </div>
      ),
    },
    {
      key: "base_rate",
      header: "Nightly rate",
      sortable: true,
      responsiveHide: "xl",
      accessor: (room) => money(room.base_rate, room.currency),
    },
    {
      key: "status",
      header: "Operational state",
      sortable: true,
      minWidth: 155,
      accessor: (room) => (
        <RoomStatus
          status={room.status}
          housekeeping={room.housekeeping_status}
        />
      ),
    },
    {
      key: "guest",
      header: "Guest / next arrival",
      minWidth: 145,
      accessor: (room) => (
        <div className="max-w-44">
          <span className="block truncate">
            {room.current_guest_name || "No current guest"}
          </span>
          <span className="text-xs text-[var(--vms-ink-muted)]">
            {room.next_arrival
              ? `${room.next_guest_name ? `${room.next_guest_name} · ` : "Next "}${displayDate(room.next_arrival)}`
              : "No upcoming arrival"}
          </span>
        </div>
      ),
    },
    {
      key: "maintenance_open",
      header: "Issues",
      sortable: true,
      responsiveHide: "xl",
      minWidth: 80,
      accessor: (room) =>
        room.maintenance_open ? (
          <span className="font-semibold text-[var(--vms-danger)]">
            {room.maintenance_open} open
          </span>
        ) : (
          <span className="text-[var(--vms-ink-muted)]">Clear</span>
        ),
    },
    {
      key: "actions",
      header: "Actions",
      minWidth: 150,
      mobileHide: true,
      accessor: (room) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Open housekeeping for ${room.name}`}
            tooltip="Housekeeping history, assignment and actions"
            onClick={() => setHousekeepingRoomId(room.id)}
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`View ${room.name} details`}
            tooltip="Room details, rate and amenities"
            onClick={() => {
              setEditing(room);
              setFormOpen(true);
            }}
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      ),
    },
  ];
  const bulkActions: BulkAction[] = [
    {
      label: "Mark available",
      variant: "secondary",
      onClick: (ids) => {
        void Promise.all(
          ids.map((id) =>
            statusMutation.mutateAsync({ id, status: "available" }),
          ),
        ).then(() => setSelected(new Set()));
      },
    },
    {
      label: "Out of service",
      variant: "destructive",
      requiresConfirmation: true,
      confirmationMessage:
        "Take the selected rooms out of inventory? Current stays are not changed.",
      onClick: (ids) => {
        void Promise.all(
          ids.map((id) =>
            statusMutation.mutateAsync({ id, status: "out_of_service" }),
          ),
        ).then(() => setSelected(new Set()));
      },
    },
  ];
  return (
    <HospitalityAdminPage
      access={access}
      title="Room inventory"
      description="Manage sellable rooms, capacity, rates and the operational state used by every arrival."
      primaryAction={
        access.allowed("create") ? (
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            Add room
          </Button>
        ) : null
      }
    >
      <div className="space-y-5">
        <ModuleMetrics
          items={[
            {
              label: "Sellable rooms",
              value: data.length,
              detail: `${summary.available} available now`,
              icon: BedDouble,
            },
            {
              label: "In house",
              value: summary.occupied,
              detail: "Rooms with an active stay",
              icon: UsersRound,
            },
            {
              label: "Housekeeping",
              value: summary.attention,
              detail: "Rooms needing attention",
              icon: Sparkles,
            },
            {
              label: "Open issues",
              value: summary.maintenance,
              detail: "Room-linked maintenance",
              icon: Wrench,
            },
          ]}
        />
        {notice ? (
          <InlineAlert tone="success" title={notice} className="mb-0" />
        ) : null}
        {statusMutation.isError ? (
          <InlineAlert tone="danger" title="Room status was not changed">
            {parseApiError(statusMutation.error).message}
          </InlineAlert>
        ) : null}
        <ModulePanel
          title="All rooms"
          description="Search and filter inventory, then apply operational changes in bulk."
        >
          <DataTable
            data={data}
            columns={columns}
            tableLabel="Hospitality rooms"
            searchPlaceholder="Search room, type or guest"
            searchable
            selectable={access.allowed("update")}
            selectedRows={selected}
            onSelectionChange={setSelected}
            getRowId={(room) => room.id}
            bulkActions={bulkActions}
            availableFilters={[
              {
                field: "status",
                label: "Room status",
                type: "select",
                options: roomStatusOptions,
                isSearchable: true,
              },
              {
                field: "housekeeping_status",
                label: "Housekeeping",
                type: "select",
                options: [
                  { value: "clean", label: "Clean" },
                  { value: "dirty", label: "Dirty" },
                  { value: "in_progress", label: "In progress" },
                  { value: "inspected", label: "Inspected" },
                ],
              },
              {
                field: "room_type",
                label: "Room type",
                type: "select",
                operator: "ilike",
                options: Array.from(
                  new Set(data.map((room) => room.room_type).filter(Boolean)),
                ).map((type) => ({ value: type, label: type })),
              },
            ]}
            isLoading={rooms.isPending}
            isStale={rooms.isError && !!rooms.data}
            onRetry={() => rooms.refetch()}
            errorMessage={
              rooms.isError && !rooms.data
                ? parseApiError(rooms.error).message
                : null
            }
            emptyMessage="No rooms have been added to this hospitality property."
            mobileSummary={(room) => (
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <strong className="block">
                      {room.name}{" "}
                      <span className="font-normal text-[var(--vms-ink-muted)]">
                        {room.room_number}
                      </span>
                    </strong>
                    <span className="text-xs capitalize text-[var(--vms-ink-muted)]">
                      {room.room_type} · sleeps {room.capacity} ·{" "}
                      {money(room.base_rate, room.currency)}
                    </span>
                  </div>
                  <RoomStatus
                    status={room.status}
                    housekeeping={room.housekeeping_status}
                  />
                </div>
                {room.current_guest_name ? (
                  <p className="text-xs text-[var(--vms-ink-muted)]">
                    In house: {room.current_guest_name}
                  </p>
                ) : null}
                {!room.current_guest_name && room.next_arrival ? (
                  <p className="text-xs text-[var(--vms-ink-muted)]">
                    Arriving: {room.next_guest_name ?? "Guest"} ·{" "}
                    {displayDate(room.next_arrival)}
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label={`Open housekeeping for ${room.name}`}
                    tooltip="Housekeeping history, assignment and actions"
                    onClick={() => setHousekeepingRoomId(room.id)}
                  >
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label={`View ${room.name} details`}
                    tooltip="Room details, rate and amenities"
                    onClick={() => {
                      setEditing(room);
                      setFormOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            )}
          />
        </ModulePanel>
      </div>
      <HousekeepingDrawer
        roomId={housekeepingRoomId}
        contextKey={access.contextKey}
        onClose={() => setHousekeepingRoomId(null)}
        canEdit={access.allowed("update")}
        assignees={assignees}
      />
      <RoomEditor
        key={editing?.id || "new-room"}
        open={formOpen}
        room={editing}
        canEdit={access.allowed(editing ? "update" : "create")}
        onClose={() => setFormOpen(false)}
        onSaved={async (message) => {
          setNotice(message);
          setFormOpen(false);
          await client.invalidateQueries({
            queryKey: ["hospitality-rooms", access.contextKey],
          });
        }}
      />
    </HospitalityAdminPage>
  );
}
