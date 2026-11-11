"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Mail, Pencil, Plug } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { useAdminProfile } from "@/hooks/use-admin";
import { useCurrentOrganization } from "@/hooks/use-organization";
import { hasAdminPermission } from "@/lib/permissions";
import { parseApiError } from "@/lib/error-utils";
import { formatDateTime } from "@/lib/datetime";

import type { EmailTemplateSummary } from "../api";
import { useEmailTemplates } from "../queries";
import { EmailTemplateDrawer } from "./EmailTemplateDrawer";

export function EmailTemplatesSection() {
  const current = useCurrentOrganization();
  const slug = current.organization?.slug ?? null;
  const templates = useEmailTemplates(slug);
  const profile = useAdminProfile();
  const [selected, setSelected] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState("");

  const canEdit =
    profile.isSuccess &&
    !profile.isError &&
    hasAdminPermission(profile.data, "organizations.update");
  const items = useMemo(() => templates.data ?? [], [templates.data]);

  const columns = useMemo<Column<EmailTemplateSummary>[]>(
    () => [
      {
        key: "template",
        header: "Template",
        sortable: true,
        accessor: (template) => (
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] text-[var(--vms-ink-muted)]">
              <Mail className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{template.label}</p>
              <p className="mt-0.5 truncate font-mono text-[11px] text-[var(--vms-ink-muted)]">
                {template.name}
              </p>
            </div>
          </div>
        ),
      },
      {
        key: "status",
        header: "Status",
        accessor: (template) => (
          <Badge variant={template.has_override ? "info" : "neutral"}>
            {template.has_override ? "Customized" : "Packaged default"}
          </Badge>
        ),
      },
      {
        key: "subject",
        header: "Subject",
        accessor: (template) =>
          template.subject ? (
            <span className="line-clamp-2 text-xs text-[var(--vms-ink)]">
              {template.subject}
            </span>
          ) : (
            <span className="text-xs text-[var(--vms-ink-muted)]">
              Event default
            </span>
          ),
      },
      {
        key: "updated",
        header: "Updated",
        sortable: true,
        accessor: (template) => (
          <span className="text-xs text-[var(--vms-ink-muted)]">
            {template.has_override ? formatDateTime(template.updated_at) : "—"}
          </span>
        ),
      },
      {
        key: "actions",
        header: "Action",
        mobileHide: true,
        accessor: (template) => (
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSelected(template.name);
                setDrawerOpen(true);
              }}
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              {canEdit ? "Edit" : "View"}
            </Button>
          </div>
        ),
      },
    ],
    [canEdit],
  );

  return (
    <div className="space-y-4">


      {profile.isError ? (
        <InlineAlert
          tone="danger"
          title="Template permissions could not be loaded"
          action={
            <Button size="sm" variant="outline" onClick={() => profile.refetch()}>
              Retry
            </Button>
          }
        >
          {parseApiError(profile.error).message}
        </InlineAlert>
      ) : null}

      <DataTable
        data={items}
        columns={columns}
        tableLabel="Transactional email templates"
        searchPlaceholder="Search templates"
        initialSearch={search}
        onSearchChange={setSearch}
        isLoading={templates.isPending}
        errorMessage={
          templates.isError ? parseApiError(templates.error).message : undefined
        }
        onRetry={() => templates.refetch()}
        emptyMessage="No email templates are available"
        showPagination={false}
        mobileSummary={(template) => (
          <span>
            <strong className="block">{template.label}</strong>
            <span className="mt-0.5 block text-xs text-[var(--vms-ink-muted)]">
              {template.has_override ? "Customized" : "Packaged default"} ·{" "}
              {template.subject || "Event default subject"}
            </span>
          </span>
        )}
      />

      <EmailTemplateDrawer
        isOpen={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelected(null);
        }}
        slug={slug}
        templateName={selected}
        canEdit={canEdit}
      />
    </div>
  );
}
