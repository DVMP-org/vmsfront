"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FlaskConical } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, fieldControlClassName } from "@/components/ui/form/Field";
import { FormErrorSummary } from "@/components/ui/form/FormErrorSummary";
import { FormSection } from "@/components/ui/form/FormSection";
import { Modal } from "@/components/ui/Modal";
import { PermissionSelector } from "@/components/admin/PermissionSelector";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAdminPermissions, useAdminRoles } from "@/hooks/use-admin";
import { parseApiError } from "@/lib/error-utils";
import { OrganizationAdminHeader } from "@/features/organization-admin/OrganizationAdminHeader";

type RoleDraft = {
  name: string;
  code: string;
  description: string;
  permissions: string[];
};

const emptyDraft: RoleDraft = {
  name: "",
  code: "",
  description: "",
  permissions: [],
};

export default function RoleDraftPage() {
  const searchParams = useSearchParams();
  const roleId = searchParams.get("role");
  const roles = useAdminRoles({ page: 1, pageSize: 100 });
  const permissions = useAdminPermissions();
  const [draft, setDraft] = useState<RoleDraft>(emptyDraft);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [previewOpen, setPreviewOpen] = useState(false);

  const sourceRole = useMemo(
    () => roles.data?.items.find((role) => role.id === roleId),
    [roleId, roles.data?.items],
  );

  useEffect(() => {
    if (!sourceRole) return;
    setDraft({
      name: sourceRole.name,
      code: sourceRole.code,
      description: sourceRole.description || "",
      permissions: sourceRole.permissions_parsed,
    });
  }, [sourceRole]);

  function validate() {
    const next: Record<string, string> = {};
    if (!draft.name.trim()) next.role_name = "Enter a role name.";
    if (!/^[a-z][a-z0-9_]{2,49}$/.test(draft.code.trim())) {
      next.role_code = "Use 3–50 lowercase letters, numbers or underscores.";
    }
    if (!draft.permissions.length) {
      next.role_permissions = "Select at least one permission.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function preview(event: React.FormEvent) {
    event.preventDefault();
    if (validate()) setPreviewOpen(true);
  }

  return (
    <div className="space-y-5">
      <OrganizationAdminHeader
        eyebrow="Organization administration / Prototype"
        title={
          sourceRole
            ? `Inspect ${sourceRole.name}`
            : "Draft an organization role"
        }
        description="Explore how a role is composed. This prototype does not create, update, assign or delete any role."
        backHref="/organization/roles"
        backLabel="Roles & permissions"
      />

      <div className="flex gap-3 rounded-[var(--vms-radius-surface)] border border-[var(--vms-info)] bg-[color-mix(in_srgb,var(--vms-info)_9%,white)] p-4 text-sm text-[var(--vms-info)]">
        <FlaskConical
          className="mt-0.5 h-4 w-4 shrink-0"
          aria-hidden="true"
        />
        <div>
          <p className="font-semibold">No changes are saved</p>
          <p className="mt-1 leading-5">
            Use this screen for review and interaction design only. Backend role
            mutation remains deferred to RBAC work.
          </p>
        </div>
      </div>

      <form
        onSubmit={preview}
        noValidate
        className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-4 sm:p-6"
      >
        <FormErrorSummary errors={errors} />
        <div className="mt-4 space-y-6">
          <FormSection
            title="Role identity"
            description="Use a recognizable organization-level name and a stable code for future contracts."
          >
            <Field
              id="role_name"
              label="Role name"
              required
              error={errors.role_name}
            >
              {(control) => (
                <input
                  {...control}
                  value={draft.name}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  className={fieldControlClassName}
                />
              )}
            </Field>
            <Field
              id="role_code"
              label="Role code"
              required
              description="Lowercase letters, numbers and underscores; 3–50 characters."
              error={errors.role_code}
            >
              {(control) => (
                <input
                  {...control}
                  value={draft.code}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      code: event.target.value.toLowerCase(),
                    }))
                  }
                  className={fieldControlClassName}
                />
              )}
            </Field>
            <Field
              id="role_description"
              label="Description"
              description="Optional context for future administrators."
            >
              {(control) => (
                <textarea
                  {...control}
                  rows={3}
                  maxLength={500}
                  value={draft.description}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  className={fieldControlClassName}
                />
              )}
            </Field>
          </FormSection>

          <FormSection
            title="Permission scope"
            description="Select the grants this draft would combine. Organization use-case and workspace authority still apply independently."
          >
            {permissions.isPending ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-48 w-full" />
              </div>
            ) : permissions.isError ? (
              <div
                role="alert"
                className="rounded-[var(--vms-radius-control)] border border-[var(--vms-danger)] bg-[var(--vms-danger-subtle)] p-4 text-sm text-[var(--vms-danger)]"
              >
                <p>{parseApiError(permissions.error).message}</p>
                <Button
                  variant="secondary"
                  className="mt-3"
                  onClick={() => permissions.refetch()}
                >
                  Retry
                </Button>
              </div>
            ) : (
              <>
                {errors.role_permissions ? (
                  <p
                    role="alert"
                    className="text-sm font-semibold text-[var(--vms-danger)]"
                  >
                    {errors.role_permissions}
                  </p>
                ) : null}
                <PermissionSelector
                  permissions={permissions.data || {}}
                  value={draft.permissions}
                  onChange={(next) =>
                    setDraft((current) => ({
                      ...current,
                      permissions: next,
                    }))
                  }
                />
              </>
            )}
          </FormSection>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--vms-line)] pt-5">
          <p className="text-xs text-[var(--vms-ink-muted)]">
            {draft.permissions.length} permission
            {draft.permissions.length === 1 ? "" : "s"} selected
          </p>
          <Button type="submit">Preview draft</Button>
        </div>
      </form>

      <Modal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="Role draft preview"
        description="This is a local prototype preview. No role data was sent to the server."
        size="md"
      >
        <div className="space-y-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold">{draft.name}</h3>
              <Badge variant="info">Prototype</Badge>
            </div>
            <p className="mt-1 text-sm text-[var(--vms-ink-muted)]">
              {draft.code}
            </p>
            {draft.description ? (
              <p className="mt-3 text-sm leading-6">{draft.description}</p>
            ) : null}
          </div>
          <div className="rounded-[var(--vms-radius-control)] bg-[var(--vms-surface-subtle)] p-4">
            <p className="text-sm font-semibold">
              {draft.permissions.length} permissions
            </p>
            <p className="mt-1 text-xs text-[var(--vms-ink-muted)]">
              Permission labels are shown in the editor. Nothing has been
              persisted.
            </p>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setPreviewOpen(false)}>
              Close preview
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
