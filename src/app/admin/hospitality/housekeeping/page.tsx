"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Clock3, Sparkles, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/Button";
import {
  DataTable,
  type BulkAction,
  type Column,
} from "@/components/ui/DataTable";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { parseApiError } from "@/lib/error-utils";
import { hospitalityApi } from "@/features/hospitality/api";
import {
  HospitalityAdminPage,
  ModuleMetrics,
  ModulePanel,
  StatusPill,
  displayDate,
} from "@/features/hospitality/HospitalityAdminPage";
import type {
  HousekeepingStatus,
  HousekeepingTask,
} from "@/features/hospitality/contracts";
import { hospitalityPeopleApi } from "@/features/hospitality/people-api";
import { useHospitalityAccess } from "@/features/hospitality/use-hospitality-access";

const statusOptions: Array<{ value: HousekeepingStatus; label: string }> = [
  { value: "dirty", label: "Dirty" },
  { value: "in_progress", label: "In progress" },
  { value: "clean", label: "Clean" },
  { value: "inspected", label: "Inspected" },
];

function nextAction(status: HousekeepingStatus) {
  if (status === "dirty")
    return { label: "Start cleaning", status: "in_progress" as const };
  if (status === "in_progress")
    return { label: "Mark clean", status: "clean" as const };
  if (status === "clean")
    return { label: "Mark inspected", status: "inspected" as const };
  return null;
}

export default function HospitalityHousekeepingPage() {
  const access = useHospitalityAccess();
  const client = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState("");
  const tasks = useQuery({
    queryKey: ["hospitality-housekeeping", access.contextKey],
    queryFn: () => hospitalityApi.housekeeping.list(),
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
      body: Parameters<typeof hospitalityApi.housekeeping.update>[1];
    }) => hospitalityApi.housekeeping.update(id, body),
    onSuccess: async (_, variables) => {
      setNotice(
        variables.body.status
          ? `Task moved to ${variables.body.status.replaceAll("_", " ")}.`
          : "Housekeeping assignment updated.",
      );
      await client.invalidateQueries({
        queryKey: ["hospitality-housekeeping", access.contextKey],
      });
      await client.invalidateQueries({
        queryKey: ["hospitality-rooms", access.contextKey],
      });
    },
  });
  const data = useMemo(() => tasks.data ?? [], [tasks.data]);
  const summary = useMemo(
    () => ({
      dirty: data.filter((task) => task.status === "dirty").length,
      active: data.filter((task) => task.status === "in_progress").length,
      ready: data.filter(
        (task) => task.status === "clean" || task.status === "inspected",
      ).length,
      urgent: data.filter(
        (task) =>
          task.priority === "urgent" &&
          task.status !== "clean" &&
          task.status !== "inspected",
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
  const columns: Column<HousekeepingTask>[] = [
    {
      key: "room_name",
      header: "Room",
      sortable: true,
      accessor: (task) => (
        <div>
          <strong className="block">{task.room_name}</strong>
          <span className="text-xs capitalize text-[var(--vms-ink-muted)]">
            {task.priority} priority
          </span>
        </div>
      ),
    },
    {
      key: "status",
      header: "State",
      sortable: true,
      accessor: (task) => (
        <StatusPill
          tone={
            task.status === "dirty"
              ? "warning"
              : task.status === "in_progress"
                ? "info"
                : "success"
          }
        >
          {task.status.replaceAll("_", " ")}
        </StatusPill>
      ),
    },
    {
      key: "assigned_to",
      header: "Assignee",
      sortable: true,
      accessor: (task) => (
        <select
          aria-label={`Assign ${task.room_name} housekeeping task`}
          value={task.assigned_to || ""}
          disabled={!access.allowed("update") || update.isPending}
          onChange={(event) =>
            update.mutate({
              id: task.id,
              body: { assigned_to: event.currentTarget.value || null },
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
      key: "due_at",
      header: "Due",
      sortable: true,
      accessor: (task) => displayDate(task.due_at, true),
    },
    {
      key: "notes",
      header: "Notes",
      accessor: (task) => (
        <span className="line-clamp-2 max-w-64 text-[var(--vms-ink-muted)]">
          {task.notes || "No notes"}
        </span>
      ),
    },
    {
      key: "updated_at",
      header: "Updated",
      sortable: true,
      responsiveHide: "lg",
      accessor: (task) => displayDate(task.updated_at, true),
    },
    {
      key: "actions",
      header: "",
      mobileHide: true,
      accessor: (task) => {
        const action = nextAction(task.status);
        return action ? (
          <Button
            variant="ghost"
            size="sm"
            disabled={!access.allowed("update") || update.isPending}
            onClick={() =>
              update.mutate({ id: task.id, body: { status: action.status } })
            }
          >
            {action.label}
          </Button>
        ) : (
          <BadgeCheck
            className="h-4 w-4 text-[var(--vms-success)]"
            aria-label="Housekeeping complete"
          />
        );
      },
    },
  ];
  const bulkActions: BulkAction[] = [
    {
      label: "Mark clean",
      variant: "secondary",
      onClick: (ids) => {
        void Promise.all(
          ids.map((id) =>
            update.mutateAsync({ id, body: { status: "clean" } }),
          ),
        ).then(() => setSelected(new Set()));
      },
    },
    {
      label: "Mark inspected",
      variant: "primary",
      onClick: (ids) => {
        void Promise.all(
          ids.map((id) =>
            update.mutateAsync({ id, body: { status: "inspected" } }),
          ),
        ).then(() => setSelected(new Set()));
      },
    },
  ];
  return (
    <HospitalityAdminPage
      access={access}
      title="Housekeeping"
      description="Move rooms through cleaning and inspection while keeping assignment and urgency visible to the front desk."
    >
      <div className="space-y-5">
        <ModuleMetrics
          items={[
            {
              label: "Dirty",
              value: summary.dirty,
              detail: "Waiting to start",
              icon: Sparkles,
            },
            {
              label: "In progress",
              value: summary.active,
              detail: "Assigned and underway",
              icon: Clock3,
            },
            {
              label: "Ready",
              value: summary.ready,
              detail: "Clean or inspected",
              icon: BadgeCheck,
            },
            {
              label: "Urgent",
              value: summary.urgent,
              detail: "Needs immediate attention",
              icon: TriangleAlert,
            },
          ]}
        />
        {notice ? <InlineAlert tone="success" title={notice} /> : null}
        {update.isError ? (
          <InlineAlert tone="danger" title="Housekeeping task was not updated">
            {parseApiError(update.error).message}
          </InlineAlert>
        ) : null}
        <ModulePanel
          title="Room turnaround"
          description="Assignment changes are saved immediately. Use bulk actions after selecting adjacent-ready rooms."
        >
          <DataTable
            data={data}
            columns={columns}
            tableLabel="Housekeeping tasks"
            searchPlaceholder="Search room, assignee or notes"
            availableFilters={[
              {
                field: "status",
                label: "State",
                type: "select",
                options: statusOptions,
                isSearchable: true,
              },
              {
                field: "priority",
                label: "Priority",
                type: "select",
                options: [
                  { value: "normal", label: "Normal" },
                  { value: "high", label: "High" },
                  { value: "urgent", label: "Urgent" },
                ],
              },
            ]}
            selectable={access.allowed("update")}
            selectedRows={selected}
            onSelectionChange={setSelected}
            getRowId={(task) => task.id}
            bulkActions={bulkActions}
            isLoading={tasks.isPending}
            isStale={tasks.isError && !!tasks.data}
            errorMessage={
              tasks.isError && !tasks.data
                ? parseApiError(tasks.error).message
                : null
            }
            onRetry={() => tasks.refetch()}
            emptyMessage="No housekeeping tasks are queued for this property."
            mobileSummary={(task) => (
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <strong className="block">{task.room_name}</strong>
                    <span className="text-xs text-[var(--vms-ink-muted)]">
                      Due {displayDate(task.due_at, true)}
                    </span>
                  </div>
                  <StatusPill
                    tone={
                      task.status === "dirty"
                        ? "warning"
                        : task.status === "in_progress"
                          ? "info"
                          : "success"
                    }
                  >
                    {task.status.replaceAll("_", " ")}
                  </StatusPill>
                </div>
                {nextAction(task.status) ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!access.allowed("update") || update.isPending}
                    onClick={() =>
                      update.mutate({
                        id: task.id,
                        body: {
                          status: nextAction(task.status)!.status,
                        },
                      })
                    }
                  >
                    {nextAction(task.status)!.label}
                  </Button>
                ) : null}
              </div>
            )}
          />
        </ModulePanel>
      </div>
    </HospitalityAdminPage>
  );
}
