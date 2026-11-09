"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, CircleDot, Clock3, Wrench } from "lucide-react";

import { Button } from "@/components/ui/Button";
import {
  DataTable,
  type BulkAction,
  type Column,
} from "@/components/ui/DataTable";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { parseApiError } from "@/lib/error-utils";
import { hospitalityApi } from "@/features/hospitality/api";
import {
  HospitalityAdminPage,
  ModuleMetrics,
  ModulePanel,
  StatusPill,
  displayDate,
} from "@/features/hospitality/HospitalityAdminPage";
import type { HospitalityMaintenanceRequest } from "@/features/hospitality/contracts";
import { hospitalityPeopleApi } from "@/features/hospitality/people-api";
import { useHospitalityAccess } from "@/features/hospitality/use-hospitality-access";

const lifecycle: Record<
  HospitalityMaintenanceRequest["status"],
  HospitalityMaintenanceRequest["status"] | null
> = {
  open: "assigned",
  assigned: "in_progress",
  in_progress: "resolved",
  resolved: "closed",
  closed: null,
};

const priorityTone = {
  low: "neutral",
  normal: "info",
  high: "warning",
  urgent: "danger",
} as const;

export default function HospitalityMaintenancePage() {
  const access = useHospitalityAccess();
  const client = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [createOpen, setCreateOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const requests = useQuery({
    queryKey: ["hospitality-maintenance", access.contextKey],
    queryFn: () => hospitalityApi.maintenance.list(),
    enabled: !!access.organization?.id && access.allowed("list"),
  });
  const rooms = useQuery({
    queryKey: ["hospitality-rooms", access.contextKey],
    queryFn: () => hospitalityApi.rooms.list(),
    enabled: !!access.organization?.id && access.allowed("list"),
  });
  const people = useQuery({
    queryKey: ["hospitality-people", access.contextKey],
    queryFn: hospitalityPeopleApi.list,
    enabled: !!access.organization?.id && access.allowed("list"),
  });
  const update = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: Parameters<typeof hospitalityApi.maintenance.update>[1];
    }) => hospitalityApi.maintenance.update(id, body),
    onSuccess: async (_, variables) => {
      setNotice(
        variables.body.status
          ? `Maintenance request moved to ${variables.body.status.replaceAll("_", " ")}.`
          : "Maintenance assignment updated.",
      );
      await client.invalidateQueries({
        queryKey: ["hospitality-maintenance", access.contextKey],
      });
      await client.invalidateQueries({
        queryKey: ["hospitality-rooms", access.contextKey],
      });
    },
  });
  const data = useMemo(() => requests.data ?? [], [requests.data]);
  const summary = useMemo(
    () => ({
      open: data.filter((request) => request.status === "open").length,
      active: data.filter(
        (request) =>
          request.status === "assigned" || request.status === "in_progress",
      ).length,
      resolved: data.filter((request) => request.status === "resolved").length,
      urgent: data.filter(
        (request) =>
          request.priority === "urgent" &&
          request.status !== "resolved" &&
          request.status !== "closed",
      ).length,
    }),
    [data],
  );
  const assignees = useMemo(() => {
    const unique = new Map<string, string>();
    for (const relationship of people.data?.items ?? []) {
      if (relationship.party?.id) {
        unique.set(relationship.party.id, relationship.party.display_name);
      }
    }
    return Array.from(unique, ([value, label]) => ({ value, label }));
  }, [people.data?.items]);
  const columns: Column<HospitalityMaintenanceRequest>[] = [
    {
      key: "title",
      header: "Issue",
      sortable: true,
      accessor: (request) => (
        <div className="max-w-72">
          <strong className="block truncate">{request.title}</strong>
          <span className="block truncate text-xs text-[var(--vms-ink-muted)]">
            {request.room_name || "Property-wide"} · {request.description}
          </span>
        </div>
      ),
    },
    {
      key: "priority",
      header: "Priority",
      sortable: true,
      accessor: (request) => (
        <StatusPill tone={priorityTone[request.priority]}>
          {request.priority}
        </StatusPill>
      ),
    },
    {
      key: "status",
      header: "State",
      sortable: true,
      accessor: (request) => (
        <StatusPill
          tone={
            request.status === "resolved" || request.status === "closed"
              ? "success"
              : request.status === "in_progress"
                ? "info"
                : "warning"
          }
        >
          {request.status.replaceAll("_", " ")}
        </StatusPill>
      ),
    },
    {
      key: "assigned_to",
      header: "Assignee",
      sortable: true,
      accessor: (request) => (
        <select
          aria-label={`Assign ${request.title}`}
          value={request.assigned_to || ""}
          disabled={!access.allowed("update") || update.isPending}
          onChange={(event) =>
            update.mutate({
              id: request.id,
              body: {
                assigned_to: event.currentTarget.value || null,
                ...(request.status === "open" && event.currentTarget.value
                  ? { status: "assigned" }
                  : {}),
              },
            })
          }
          className="h-9 max-w-48 rounded-[var(--vms-radius-control)] border border-[var(--vms-line-strong)] bg-[var(--vms-surface)] px-2 text-sm"
        >
          <option value="">Unassigned</option>
          {assignees.map((person) => (
            <option key={person.value} value={person.value}>
              {person.label}
            </option>
          ))}
        </select>
      ),
    },
    {
      key: "reported_by",
      header: "Reported by",
      sortable: true,
      responsiveHide: "lg",
      accessor: (request) => request.reported_by,
    },
    {
      key: "created_at",
      header: "Opened",
      sortable: true,
      accessor: (request) => displayDate(request.created_at, true),
    },
    {
      key: "actions",
      header: "",
      mobileHide: true,
      accessor: (request) => {
        const next = lifecycle[request.status];
        return next ? (
          <Button
            variant="ghost"
            size="sm"
            disabled={!access.allowed("update") || update.isPending}
            onClick={() =>
              update.mutate({ id: request.id, body: { status: next } })
            }
          >
            Mark {next.replaceAll("_", " ")}
          </Button>
        ) : (
          <CheckCircle2
            className="h-4 w-4 text-[var(--vms-success)]"
            aria-label="Maintenance closed"
          />
        );
      },
    },
  ];
  const bulkActions: BulkAction[] = [
    {
      label: "Start work",
      variant: "secondary",
      onClick: (ids) => {
        void Promise.all(
          ids.map((id) =>
            update.mutateAsync({ id, body: { status: "in_progress" } }),
          ),
        ).then(() => setSelected(new Set()));
      },
    },
    {
      label: "Mark resolved",
      variant: "primary",
      onClick: (ids) => {
        void Promise.all(
          ids.map((id) =>
            update.mutateAsync({ id, body: { status: "resolved" } }),
          ),
        ).then(() => setSelected(new Set()));
      },
    },
  ];
  return (
    <HospitalityAdminPage
      access={access}
      title="Room maintenance"
      description="Keep room-linked repairs visible from report through resolution so inventory state stays trustworthy."
      primaryAction={
        access.allowed("create") ? (
          <Button onClick={() => setCreateOpen(true)}>Report issue</Button>
        ) : null
      }
    >
      <div className="space-y-5">
        <ModuleMetrics
          items={[
            {
              label: "Open",
              value: summary.open,
              detail: "Not yet assigned",
              icon: CircleDot,
            },
            {
              label: "In progress",
              value: summary.active,
              detail: "Assigned work",
              icon: Clock3,
            },
            {
              label: "Resolved",
              value: summary.resolved,
              detail: "Awaiting close",
              icon: CheckCircle2,
            },
            {
              label: "Urgent",
              value: summary.urgent,
              detail: "Needs immediate action",
              icon: Wrench,
            },
          ]}
        />
        {notice ? <InlineAlert tone="success" title={notice} /> : null}
        {update.isError ? (
          <InlineAlert tone="danger" title="Request was not updated">
            {parseApiError(update.error).message}
          </InlineAlert>
        ) : null}
        <ModulePanel
          title="Maintenance queue"
          description="Select requests for bulk lifecycle changes or assign an owner inline."
        >
          <DataTable
            data={data}
            columns={columns}
            tableLabel="Hospitality maintenance requests"
            searchPlaceholder="Search issue, room or assignee"
            availableFilters={[
              {
                field: "status",
                label: "State",
                type: "select",
                options: [
                  { value: "open", label: "Open" },
                  { value: "assigned", label: "Assigned" },
                  { value: "in_progress", label: "In progress" },
                  { value: "resolved", label: "Resolved" },
                  { value: "closed", label: "Closed" },
                ],
                isSearchable: true,
              },
              {
                field: "priority",
                label: "Priority",
                type: "select",
                options: [
                  { value: "low", label: "Low" },
                  { value: "normal", label: "Normal" },
                  { value: "high", label: "High" },
                  { value: "urgent", label: "Urgent" },
                ],
              },
            ]}
            selectable={access.allowed("update")}
            selectedRows={selected}
            onSelectionChange={setSelected}
            getRowId={(request) => request.id}
            bulkActions={bulkActions}
            isLoading={requests.isPending}
            isStale={requests.isError && !!requests.data}
            errorMessage={
              requests.isError && !requests.data
                ? parseApiError(requests.error).message
                : null
            }
            onRetry={() => requests.refetch()}
            emptyMessage="No maintenance issues are open for this property."
            mobileSummary={(request) => (
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <strong className="block">{request.title}</strong>
                    <span className="text-xs text-[var(--vms-ink-muted)]">
                      {request.room_name || "Property-wide"} ·{" "}
                      {displayDate(request.created_at, true)}
                    </span>
                  </div>
                  <StatusPill tone={priorityTone[request.priority]}>
                    {request.priority}
                  </StatusPill>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <StatusPill
                    tone={
                      request.status === "resolved" ||
                      request.status === "closed"
                        ? "success"
                        : "warning"
                    }
                  >
                    {request.status.replaceAll("_", " ")}
                  </StatusPill>
                  {lifecycle[request.status] ? (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!access.allowed("update") || update.isPending}
                      onClick={() =>
                        update.mutate({
                          id: request.id,
                          body: { status: lifecycle[request.status]! },
                        })
                      }
                    >
                      Mark {lifecycle[request.status]!.replaceAll("_", " ")}
                    </Button>
                  ) : null}
                </div>
              </div>
            )}
          />
        </ModulePanel>
      </div>
      <MaintenanceComposer
        open={createOpen}
        rooms={rooms.data ?? []}
        canCreate={access.allowed("create")}
        onClose={() => setCreateOpen(false)}
        onCreated={async (message) => {
          setNotice(message);
          setCreateOpen(false);
          await client.invalidateQueries({
            queryKey: ["hospitality-maintenance", access.contextKey],
          });
          await client.invalidateQueries({
            queryKey: ["hospitality-rooms", access.contextKey],
          });
        }}
      />
    </HospitalityAdminPage>
  );
}

function MaintenanceComposer({
  open,
  rooms,
  canCreate,
  onClose,
  onCreated,
}: {
  open: boolean;
  rooms: Awaited<ReturnType<typeof hospitalityApi.rooms.list>>;
  canCreate: boolean;
  onClose: () => void;
  onCreated: (message: string) => Promise<void>;
}) {
  const [roomId, setRoomId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("normal");
  const [validation, setValidation] = useState("");
  const create = useMutation({
    mutationFn: () => {
      if (!title.trim() || !description.trim()) {
        throw new Error("Add a title and description.");
      }
      return hospitalityApi.maintenance.create({
        room_id: roomId || null,
        title: title.trim(),
        description: description.trim(),
        priority,
      });
    },
    onSuccess: () => onCreated("Maintenance issue reported."),
  });
  function submit(event: FormEvent) {
    event.preventDefault();
    setValidation("");
    create.mutate();
  }
  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Report maintenance issue"
      description="Link the issue to a room when guest inventory is affected."
      size="md"
    >
      <form onSubmit={submit} className="space-y-4">
        <label className="space-y-1.5 text-sm font-medium">
          <span>Room (optional)</span>
          <select
            value={roomId}
            onChange={(event) => setRoomId(event.currentTarget.value)}
            className="h-[var(--vms-control-height)] w-full rounded-[var(--vms-radius-control)] border border-[var(--vms-line-strong)] bg-[var(--vms-surface)] px-3 text-base sm:text-sm"
          >
            <option value="">Property-wide issue</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name} · {room.room_number}
              </option>
            ))}
          </select>
        </label>
        <Input
          label="Issue title"
          required
          value={title}
          placeholder="Air conditioning not cooling"
          onChange={(event) => setTitle(event.currentTarget.value)}
        />
        <label className="space-y-1.5 text-sm font-medium">
          <span>Description</span>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(event) => setDescription(event.currentTarget.value)}
            className="w-full rounded-[var(--vms-radius-control)] border border-[var(--vms-line-strong)] bg-[var(--vms-surface)] px-3 py-2 text-base sm:text-sm"
          />
        </label>
        <label className="space-y-1.5 text-sm font-medium">
          <span>Priority</span>
          <select
            value={priority}
            onChange={(event) => setPriority(event.currentTarget.value)}
            className="h-[var(--vms-control-height)] w-full rounded-[var(--vms-radius-control)] border border-[var(--vms-line-strong)] bg-[var(--vms-surface)] px-3 text-base sm:text-sm"
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </label>
        {(validation || create.isError) && (
          <InlineAlert tone="danger" title="Issue was not reported">
            {validation || parseApiError(create.error).message}
          </InlineAlert>
        )}
        <div className="flex flex-col-reverse gap-2 border-t border-[var(--vms-line)] pt-4 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!canCreate}
            isLoading={create.isPending}
          >
            Report issue
          </Button>
        </div>
      </form>
    </Modal>
  );
}
