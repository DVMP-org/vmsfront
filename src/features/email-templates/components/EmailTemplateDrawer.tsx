"use client";

import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, fieldControlClassName } from "@/components/ui/form/Field";
import { FormDrawer, FormRecordSummary } from "@/components/ui/form/FormDrawer";
import { FormSection } from "@/components/ui/form/FormSection";
import { formatDateTime } from "@/lib/datetime";
import { parseApiError } from "@/lib/error-utils";
import { cn } from "@/lib/utils";

import { useEmailTemplate, useResetEmailTemplate, useSaveEmailTemplate } from "../queries";

export function EmailTemplateDrawer({
  isOpen,
  onClose,
  slug,
  templateName,
  canEdit,
}: {
  isOpen: boolean;
  onClose: () => void;
  slug?: string | null;
  templateName: string | null;
  canEdit: boolean;
}) {
  const detail = useEmailTemplate(slug, templateName);
  const save = useSaveEmailTemplate(slug);
  const reset = useResetEmailTemplate(slug);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setSubject(detail.data?.subject ?? "");
    setBody(detail.data?.html_body ?? "");
    setDirty(false);
    save.reset();
    reset.reset();
    // Reset only when the drawer opens or the selected template changes so a
    // background refetch cannot overwrite unsaved edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, detail.data?.name]);

  const mutationError = save.isError
    ? parseApiError(save.error).message
    : reset.isError
      ? parseApiError(reset.error).message
      : null;

  return (
    <FormDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={detail.data?.label || "Email template"}
      description="Customize the subject and HTML body. Blank subjects keep the event's default subject."
      submitLabel="Save template"
      isSubmitting={save.isPending}
      canSubmit={canEdit && dirty && body.trim().length > 0}
      onSubmit={(event) => {
        event.preventDefault();
        if (!templateName || !canEdit) return;
        save.mutate(
          {
            name: templateName,
            payload: {
              subject: subject.trim() || null,
              html_body: body,
            },
          },
          { onSuccess: () => setDirty(false) },
        );
      }}
      error={mutationError}
      footerNote={
        detail.data?.has_override
          ? `Organization override · updated ${formatDateTime(detail.data.updated_at)}`
          : "Using the packaged default template"
      }
      secondaryAction={
        detail.data?.has_override && canEdit ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (!templateName) return;
              reset.mutate(
                { name: templateName },
                {
                  onSuccess: () => {
                    setSubject("");
                    setBody(detail.data?.default_html_body ?? "");
                    setDirty(false);
                  },
                },
              );
            }}
            disabled={reset.isPending || save.isPending}
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Reset to default
          </Button>
        ) : null
      }
    >
      {detail.isPending ? (
        <div role="status" className="space-y-3">
          <span className="sr-only">Loading email template</span>
          <div className="h-10 animate-pulse rounded bg-[var(--vms-surface-subtle)]" />
          <div className="h-64 animate-pulse rounded bg-[var(--vms-surface-subtle)]" />
        </div>
      ) : detail.isError ? (
        <p role="alert" className="text-sm text-[var(--vms-danger)]">
          {parseApiError(detail.error).message}
        </p>
      ) : detail.data ? (
        <div className="space-y-6">
          <FormRecordSummary
            title={detail.data.label}
            meta={detail.data.name}
            trailing={
              <Badge
                variant={detail.data.has_override ? "info" : "neutral"}
              >
                {detail.data.has_override ? "Customized" : "Packaged default"}
              </Badge>
            }
          />

          <FormSection
            title="Subject"
            description="Leave blank to keep the subject defined by the event."
          >
            <Field
              id="email-template-subject"
              label="Subject override"
              description={`${subject.trim().length}/255 characters`}
            >
              {(control) => (
                <input
                  {...control}
                  className={fieldControlClassName}
                  value={subject}
                  onChange={(event) => {
                    setSubject(event.target.value);
                    setDirty(true);
                  }}
                  disabled={!canEdit}
                  maxLength={255}
                  placeholder="Use the event subject"
                />
              )}
            </Field>
          </FormSection>

          <FormSection
            title="HTML body"
            description="Jinja expressions and the shared branding variables are available."
          >
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[var(--vms-ink-muted)]">
                  Template source
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={!canEdit || !detail.data.default_html_body}
                  onClick={() => {
                    setBody(detail.data?.default_html_body ?? "");
                    setDirty(true);
                  }}
                >
                  Restore packaged body
                </Button>
              </div>
              <label htmlFor="email-template-body" className="sr-only">
                HTML body
              </label>
              <textarea
                id="email-template-body"
                value={body}
                onChange={(event) => {
                  setBody(event.target.value);
                  setDirty(true);
                }}
                disabled={!canEdit}
                rows={18}
                spellCheck={false}
                className={cn(
                  fieldControlClassName,
                  "min-h-[22rem] resize-y font-mono text-xs leading-5",
                )}
              />
            </div>
          </FormSection>

          {!canEdit ? (
            <p className="text-xs text-[var(--vms-ink-muted)]">
              Your role can view templates but cannot change organization
              configuration.
            </p>
          ) : null}
        </div>
      ) : null}
    </FormDrawer>
  );
}
