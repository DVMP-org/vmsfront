"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BedDouble, Sparkles, Wrench, UsersRound } from "lucide-react";

import { Button } from "@/components/ui/Button";
import {
  DataTable,
  type BulkAction,
  type Column,
} from "@/components/ui/DataTable";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { Input } from "@/components/ui/Input";
import { SlideOver } from "@/components/ui/SlideOver";
import { parseApiError } from "@/lib/error-utils";
import { hospitalityApi } from "@/features/hospitality/api";
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

const emptyRoom = {
  name: "",
  room_number: "",
  room_type: "",
  floor: "",
  capacity: "2",
  base_rate: "",
  currency: "USD",
};

export default function HospitalityRoomsPage() {
  const access = useHospitalityAccess();
  const client = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<HospitalityRoom | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const rooms = useQuery({
    queryKey: ["hospitality-rooms", access.contextKey],
    queryFn: () => hospitalityApi.rooms.list(),
    enabled: !!access.organization?.id && access.allowed("list"),
  });
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
      accessor: (room) => (
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
      accessor: (room) => money(room.base_rate, room.currency),
    },
    {
      key: "status",
      header: "Operational state",
      sortable: true,
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
      accessor: (room) => (
        <div className="max-w-44">
          <span className="block truncate">
            {room.current_guest_name || "No current guest"}
          </span>
          <span className="text-xs text-[var(--vms-ink-muted)]">
            {room.next_arrival
              ? `Next ${displayDate(room.next_arrival)}`
              : "No upcoming arrival"}
          </span>
        </div>
      ),
    },
    {
      key: "maintenance_open",
      header: "Issues",
      sortable: true,
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
      header: "",
      mobileHide: true,
      accessor: (room) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            disabled={!access.allowed("update")}
            onClick={() => {
              setEditing(room);
              setFormOpen(true);
            }}
          >
            Edit
          </Button>
          {room.status !== "out_of_service" && room.status !== "occupied" ? (
            <Button
              variant="ghost"
              size="sm"
              disabled={!access.allowed("update") || statusMutation.isPending}
              onClick={() =>
                statusMutation.mutate({
                  id: room.id,
                  status: "out_of_service",
                })
              }
            >
              Block
            </Button>
          ) : room.status === "out_of_service" ? (
            <Button
              variant="ghost"
              size="sm"
              disabled={!access.allowed("update") || statusMutation.isPending}
              onClick={() =>
                statusMutation.mutate({ id: room.id, status: "available" })
              }
            >
              Return
            </Button>
          ) : null}
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
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!access.allowed("update")}
                  onClick={() => {
                    setEditing(room);
                    setFormOpen(true);
                  }}
                >
                  Edit room
                </Button>
              </div>
            )}
          />
        </ModulePanel>
      </div>
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

function RoomEditor({
  open,
  room,
  canEdit,
  onClose,
  onSaved,
}: {
  open: boolean;
  room: HospitalityRoom | null;
  canEdit: boolean;
  onClose: () => void;
  onSaved: (message: string) => Promise<void>;
}) {
  const [values, setValues] = useState(
    room
      ? {
          name: room.name,
          room_number: room.room_number,
          room_type: room.room_type,
          floor: room.floor || "",
          capacity: String(room.capacity),
          base_rate: room.base_rate,
          currency: room.currency,
          status: room.status,
        }
      : { ...emptyRoom, status: "available" as RoomOperationalStatus },
  );
  const [validation, setValidation] = useState("");
  const mutation = useMutation({
    mutationFn: async () => {
      const capacity = Number(values.capacity);
      const baseRate = Number(values.base_rate);
      if (!values.name.trim() || !values.room_number.trim()) {
        throw new Error("Room name and room number are required.");
      }
      if (!values.room_type.trim()) throw new Error("Room type is required.");
      if (!Number.isInteger(capacity) || capacity < 1) {
        throw new Error("Capacity must be a whole number of at least 1.");
      }
      if (!Number.isFinite(baseRate) || baseRate < 0) {
        throw new Error("Nightly rate must be zero or greater.");
      }
      if (!/^[A-Z]{3}$/.test(values.currency)) {
        throw new Error("Use a three-letter ISO currency code.");
      }
      const body = {
        name: values.name.trim(),
        room_number: values.room_number.trim(),
        room_type: values.room_type.trim(),
        floor: values.floor.trim() || null,
        capacity,
        base_rate: baseRate.toFixed(2),
        currency: values.currency,
      };
      return room
        ? hospitalityApi.rooms.update(room.id, {
            ...body,
            status: values.status,
          })
        : hospitalityApi.rooms.create(body);
    },
    onSuccess: () => onSaved(room ? "Room updated." : "Room added."),
  });
  function submit(event: FormEvent) {
    event.preventDefault();
    setValidation("");
    mutation.mutate();
  }
  return (
    <SlideOver
      isOpen={open}
      onClose={onClose}
      title={room ? "Edit room" : "Add room"}
      description="These details feed reservations, availability and housekeeping."
    >
      <form onSubmit={submit} className="space-y-4">
        {!canEdit ? (
          <InlineAlert tone="warning">
            You can review this form but do not have permission to save it.
          </InlineAlert>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Room name"
            required
            value={values.name}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                name: event.currentTarget.value,
              }))
            }
          />
          <Input
            label="Room number"
            required
            value={values.room_number}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                room_number: event.currentTarget.value,
              }))
            }
          />
          <Input
            label="Room type"
            required
            placeholder="Suite, king, twin…"
            value={values.room_type}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                room_type: event.currentTarget.value,
              }))
            }
          />
          <Input
            label="Floor"
            value={values.floor}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                floor: event.currentTarget.value,
              }))
            }
          />
          <Input
            label="Capacity"
            type="number"
            min={1}
            max={50}
            required
            value={values.capacity}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                capacity: event.currentTarget.value,
              }))
            }
          />
          <Input
            label="Nightly rate"
            type="number"
            min={0}
            step="0.01"
            required
            value={values.base_rate}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                base_rate: event.currentTarget.value,
              }))
            }
          />
          <label className="space-y-1.5 text-sm font-medium">
            <span>Currency</span>
            <select
              className="h-[var(--vms-control-height)] w-full rounded-[var(--vms-radius-control)] border border-[var(--vms-line-strong)] bg-[var(--vms-surface)] px-3 text-base sm:text-sm"
              value={values.currency}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  currency: event.currentTarget.value.toUpperCase(),
                }))
              }
            >
              {["USD", "EUR", "GBP", "NGN", "KES", "ZAR", "AED"].map(
                (currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ),
              )}
            </select>
          </label>
          {room ? (
            <label className="space-y-1.5 text-sm font-medium">
              <span>Operational status</span>
              <select
                className="h-[var(--vms-control-height)] w-full rounded-[var(--vms-radius-control)] border border-[var(--vms-line-strong)] bg-[var(--vms-surface)] px-3 text-base capitalize sm:text-sm"
                value={values.status}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    status: event.currentTarget.value as RoomOperationalStatus,
                  }))
                }
              >
                {roomStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
        {(validation || mutation.isError) && (
          <InlineAlert tone="danger" title="Room was not saved">
            {validation || parseApiError(mutation.error).message}
          </InlineAlert>
        )}
        <div className="flex flex-col-reverse gap-2 border-t border-[var(--vms-line)] pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!canEdit}
            isLoading={mutation.isPending}
          >
            {room ? "Save room" : "Add room"}
          </Button>
        </div>
      </form>
    </SlideOver>
  );
}
