"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Archive, Megaphone, Pencil, Pin, Plus, Send } from "lucide-react";
import { format } from "date-fns/format";

import { Button } from "@/components/ui/Button";
import {
  DataTable,
  type BulkAction,
  type Column,
  type FilterDefinition,
} from "@/components/ui/DataTable";
import { Field, fieldControlClassName } from "@/components/ui/form/Field";
import { FormErrorSummary } from "@/components/ui/form/FormErrorSummary";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { parseApiError } from "@/lib/error-utils";
import { ResidentialShell, useResidentialAccess } from "./ResidentialShell";
import { residentialApi } from "./api";
import {
  announcementPriorities,
  titleCase,
  type Announcement,
  type AnnouncementAudience,
  type AnnouncementPriority,
} from "./contracts";

const audiences: AnnouncementAudience[] = [
  "all_residents",
  "owners",
  "tenants",
  "staff",
];

export default function ResidentialAnnouncements() {
  const { contextKey, selectedProperty, canManageAnnouncements } =
    useResidentialAccess();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [active, setActive] = useState<Announcement | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const placeId = selectedProperty?.id || "";
  const announcements = useQuery({
    queryKey: ["residential", contextKey, "announcements", placeId],
    queryFn: () => residentialApi.announcements({}),
    enabled: !!placeId,
  });
  const rows = announcements.data?.items || [];
  const update = useMutation({
    mutationFn: ({
      ids,
      body,
    }: {
      ids: string[];
      body: Parameters<typeof residentialApi.updateAnnouncement>[1];
    }) =>
      Promise.all(ids.map((id) => residentialApi.updateAnnouncement(id, body))),
    onSuccess: async (updated, variables) => {
      setSelected(new Set());
      setActive((current) =>
        current
          ? updated.find((announcement) => announcement.id === current.id) ||
            current
          : current,
      );
      await queryClient.invalidateQueries({
        queryKey: ["residential", contextKey, "announcements"],
      });
      toast.success(
        `${updated.length} announcement${updated.length === 1 ? "" : "s"} ${
          variables.body.status ? `marked ${variables.body.status}` : "updated"
        }.`,
      );
    },
    onError: (error) => toast.error(parseApiError(error).message),
  });
  const columns: Column<Announcement>[] = [
    {
      key: "title",
      header: "Announcement",
      sortable: true,
      accessor: (announcement) => (
        <span>
          <button
            type="button"
            onClick={() => setActive(announcement)}
            className="flex items-center gap-2 text-left font-semibold underline-offset-4 hover:underline"
          >
            {announcement.is_pinned ? (
              <Pin
                className="h-3.5 w-3.5 text-[var(--vms-coral)]"
                aria-label="Pinned"
              />
            ) : null}
            {announcement.title}
          </button>
          <span className="mt-1 block max-w-xl truncate text-xs text-[var(--vms-ink-muted)]">
            {announcement.body}
          </span>
        </span>
      ),
    },
    {
      key: "audience",
      header: "Audience",
      sortable: true,
      accessor: (announcement) => titleCase(announcement.audience),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      accessor: (announcement) => (
        <StatusBadge tone={announcementTone(announcement.status)}>
          {titleCase(announcement.status)}
        </StatusBadge>
      ),
    },
    {
      key: "published_at",
      header: "Published",
      sortable: true,
      accessor: (announcement) =>
        announcement.published_at
          ? format(new Date(announcement.published_at), "d MMM yyyy")
          : "—",
    },
    {
      key: "expires_at",
      header: "Expires",
      sortable: true,
      accessor: (announcement) =>
        announcement.expires_at
          ? format(new Date(announcement.expires_at), "d MMM yyyy")
          : "No expiry",
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      mobileHide: true,
      accessor: (announcement) =>
        canManageAnnouncements ? (
          <div className="flex justify-end gap-1">
            {announcement.status !== "published" ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  update.mutate({
                    ids: [announcement.id],
                    body: { status: "published" },
                  })
                }
              >
                Publish
              </Button>
            ) : null}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setActive(announcement);
                setFormOpen(true);
              }}
              aria-label={`Edit ${announcement.title}`}
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        ) : null,
    },
  ];
  const filters: FilterDefinition[] = [
    {
      field: "audience",
      label: "Audience",
      type: "select",
      options: audiences.map((audience) => ({
        value: audience,
        label: titleCase(audience),
      })),
    },
    {
      field: "status",
      label: "Status",
      type: "select",
      options: ["draft", "published", "archived"].map((status) => ({
        value: status,
        label: titleCase(status),
      })),
    },
  ];
  const bulkActions: BulkAction[] = canManageAnnouncements
    ? [
        {
          label: "Publish",
          icon: Send,
          onClick: (ids) =>
            update.mutate({ ids, body: { status: "published" } }),
        },
        {
          label: "Archive",
          icon: Archive,
          variant: "destructive",
          requiresConfirmation: true,
          confirmationMessage:
            "Archive the selected announcements? They will no longer be visible to residents.",
          onClick: (ids) =>
            update.mutate({ ids, body: { status: "archived" } }),
        },
      ]
    : [];
  const published = rows.filter(
    (announcement) => announcement.status === "published",
  ).length;

  return (
    <ResidentialShell
      title="Announcements"
      description="Targeted resident communication for the selected property, including drafts, published notices and expiry."
      primaryAction={
        canManageAnnouncements ? (
          <Button
            onClick={() => {
              setActive(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            New announcement
          </Button>
        ) : undefined
      }
    >
      <section className="grid overflow-hidden rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] sm:grid-cols-3">
        <Summary
          label="All notices"
          value={String(rows.length)}
          detail="Drafts and published announcements"
        />
        <Summary
          label="Published"
          value={String(published)}
          detail="Visible to their selected audience"
        />
        <Summary
          label="Pinned"
          value={String(rows.filter((row) => row.is_pinned).length)}
          detail="Priority notices for residents"
        />
      </section>
      <section className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-3 sm:p-4">
        <DataTable
          data={rows}
          columns={columns}
          availableFilters={filters}
          searchPlaceholder="Search announcement titles and content"
          selectable={canManageAnnouncements}
          selectedRows={selected}
          onSelectionChange={setSelected}
          bulkActions={bulkActions}
          isLoading={announcements.isPending}
          errorMessage={
            announcements.isError
              ? parseApiError(announcements.error).message
              : null
          }
          isStale={announcements.isError && rows.length > 0}
          onRetry={() => announcements.refetch()}
          emptyMessage="No announcements yet. Create a draft to communicate with residents."
          tableLabel="Residential announcements"
          scrollHint="Scroll horizontally to compare audience, publication and expiry."
          mobileSummary={(announcement) => (
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <strong>{announcement.title}</strong>
                <StatusBadge tone={announcementTone(announcement.status)}>
                  {titleCase(announcement.status)}
                </StatusBadge>
              </div>
              <p className="line-clamp-2 text-xs text-[var(--vms-ink-muted)]">
                {announcement.body}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setActive(announcement);
                  setFormOpen(true);
                }}
              >
                {canManageAnnouncements ? "Edit announcement" : "Read notice"}
              </Button>
            </div>
          )}
        />
      </section>
      <AnnouncementModal
        key={`${formOpen}:${active?.id || "new"}`}
        open={formOpen}
        announcement={active}
        readOnly={!canManageAnnouncements}
        onClose={() => {
          setFormOpen(false);
          setActive(null);
        }}
        onSaved={() => {
          setFormOpen(false);
          setActive(null);
          void queryClient.invalidateQueries({
            queryKey: ["residential", contextKey, "announcements"],
          });
        }}
      />
    </ResidentialShell>
  );
}

function AnnouncementModal({
  open,
  announcement,
  readOnly,
  onClose,
  onSaved,
}: {
  open: boolean;
  announcement: Announcement | null;
  readOnly: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(announcement?.title || "");
  const [body, setBody] = useState(announcement?.body || "");
  const [audience, setAudience] = useState<AnnouncementAudience>(
    announcement?.audience || "all_residents",
  );
  const [isPinned, setIsPinned] = useState(announcement?.is_pinned || false);
  const [priority, setPriority] = useState<AnnouncementPriority>(
    announcement?.priority || "normal",
  );
  const [expiresAt, setExpiresAt] = useState(
    announcement?.expires_at?.slice(0, 10) || "",
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const save = useMutation({
    mutationFn: () => {
      const input = {
        title: title.trim(),
        body: body.trim(),
        audience,
        priority,
        is_pinned: isPinned,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      };
      return announcement
        ? residentialApi.updateAnnouncement(announcement.id, input)
        : residentialApi.createAnnouncement(input);
    },
    onSuccess: () => {
      toast.success(
        announcement ? "Announcement updated." : "Announcement draft created.",
      );
      onSaved();
    },
    onError: (error) => setErrors({ form: parseApiError(error).message }),
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    if (readOnly) return;
    const next: Record<string, string> = {};
    if (title.trim().length < 3)
      next.title = "Enter a clear announcement title.";
    if (body.trim().length < 10)
      next.body = "Write the resident-facing announcement.";
    setErrors(next);
    if (Object.keys(next).length) return;
    save.mutate();
  }

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={
        announcement
          ? readOnly
            ? announcement.title
            : `Edit ${announcement.title}`
          : "New resident announcement"
      }
      description="Announcements are scoped to the selected property and audience."
      size="lg"
    >
      {readOnly ? (
        <article className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone={announcementTone(announcement!.status)}>
              {titleCase(announcement!.status)}
            </StatusBadge>
            <StatusBadge tone="neutral">
              {titleCase(announcement!.audience)}
            </StatusBadge>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-6">
            {announcement!.body}
          </p>
        </article>
      ) : (
        <form className="space-y-4" onSubmit={submit} noValidate>
          <FormErrorSummary errors={errors} />
          <Field
            id="announcement-title"
            label="Title"
            required
            error={errors.title}
          >
            {(control) => (
              <input
                {...control}
                className={fieldControlClassName}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                autoComplete="off"
              />
            )}
          </Field>
          <Field
            id="announcement-body"
            label="Message"
            required
            error={errors.body}
          >
            {(control) => (
              <textarea
                {...control}
                className={`${fieldControlClassName} min-h-40 py-2`}
                value={body}
                onChange={(event) => setBody(event.target.value)}
              />
            )}
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="announcement-audience" label="Audience">
              {(control) => (
                <select
                  {...control}
                  className={fieldControlClassName}
                  value={audience}
                  onChange={(event) =>
                    setAudience(event.target.value as AnnouncementAudience)
                  }
                >
                  {audiences.map((option) => (
                    <option key={option} value={option}>
                      {titleCase(option)}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            <Field id="announcement-expiry" label="Expires">
              {(control) => (
                <input
                  {...control}
                  type="date"
                  className={fieldControlClassName}
                  value={expiresAt}
                  onChange={(event) => setExpiresAt(event.target.value)}
                />
              )}
            </Field>
          </div>
          <Field
            id="announcement-priority"
            label="Priority"
            description="Sets the badge and tone residents see on their dashboard."
          >
            {(control) => (
              <select
                {...control}
                className={fieldControlClassName}
                value={priority}
                onChange={(event) =>
                  setPriority(event.target.value as AnnouncementPriority)
                }
              >
                {announcementPriorities.map((option) => (
                  <option key={option} value={option}>
                    {titleCase(option)}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <label className="flex min-h-11 items-center gap-3 rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] px-3 text-sm">
            <input
              type="checkbox"
              checked={isPinned}
              onChange={(event) => setIsPinned(event.target.checked)}
            />
            Pin this announcement above other notices
          </label>
          <div className="flex flex-col-reverse gap-2 border-t border-[var(--vms-line)] pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending
                ? "Saving…"
                : announcement
                  ? "Save announcement"
                  : "Create draft"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

function announcementTone(status: Announcement["status"]) {
  if (status === "published") return "success" as const;
  if (status === "draft") return "warning" as const;
  return "neutral" as const;
}

function Summary({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="border-b border-[var(--vms-line)] p-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--vms-ink-muted)]">
        <Megaphone className="h-4 w-4 text-[var(--vms-coral)]" aria-hidden />
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-[var(--vms-ink-muted)]">{detail}</p>
    </div>
  );
}
