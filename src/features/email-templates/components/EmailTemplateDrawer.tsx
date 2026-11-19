"use client";

import { useEffect, useState } from "react";
import { Code2, Monitor, RotateCcw, Smartphone } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, fieldControlClassName } from "@/components/ui/form/Field";
import { FormDrawer, FormRecordSummary } from "@/components/ui/form/FormDrawer";
import { FormSection } from "@/components/ui/form/FormSection";
import { useConfirmAction } from "@/components/ui/useConfirmAction";
import { formatDateTime } from "@/lib/datetime";
import { parseApiError } from "@/lib/error-utils";
import { cn } from "@/lib/utils";

import {
  useEmailTemplate,
  useResetEmailTemplate,
  useSaveEmailTemplate,
} from "../queries";

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
  const { confirmAction, confirmationDialog } = useConfirmAction();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [dirty, setDirty] = useState(false);
  const [bodyView, setBodyView] = useState<"source" | "preview">("source");
  const [previewWidth, setPreviewWidth] = useState<"desktop" | "mobile">(
    "desktop",
  );

  useEffect(() => {
    if (!isOpen) return;
    setSubject(detail.data?.subject ?? "");
    setBody(detail.data?.html_body ?? "");
    setDirty(false);
    setBodyView("source");
    setPreviewWidth("desktop");
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
              confirmAction({
                title: "Reset email template?",
                description: `This removes the organization override for ${detail.data?.label || templateName} and restores the packaged subject and body.`,
                confirmLabel: "Reset template",
                onConfirm: async () => {
                  await reset.mutateAsync({ name: templateName });
                  setSubject("");
                  setBody(detail.data?.default_html_body ?? "");
                  setDirty(false);
                },
              });
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
              <Badge variant={detail.data.has_override ? "info" : "neutral"}>
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
                  {bodyView === "source"
                    ? "Template source"
                    : "Rendered sample"}
                </span>
                <div className="flex flex-wrap items-center gap-1">
                  <div
                    role="group"
                    aria-label="Email body view"
                    className="flex rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] p-0.5"
                  >
                    <Button
                      type="button"
                      size="sm"
                      variant={bodyView === "source" ? "secondary" : "ghost"}
                      aria-pressed={bodyView === "source"}
                      onClick={() => setBodyView("source")}
                    >
                      <Code2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Source
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={bodyView === "preview" ? "secondary" : "ghost"}
                      aria-pressed={bodyView === "preview"}
                      onClick={() => setBodyView("preview")}
                    >
                      Preview
                    </Button>
                  </div>
                  {bodyView === "source" ? (
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
                  ) : (
                    <div className="flex rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] p-0.5">
                      <Button
                        type="button"
                        size="sm"
                        variant={
                          previewWidth === "desktop" ? "secondary" : "ghost"
                        }
                        aria-pressed={previewWidth === "desktop"}
                        onClick={() => setPreviewWidth("desktop")}
                        aria-label="Desktop preview"
                      >
                        <Monitor className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={
                          previewWidth === "mobile" ? "secondary" : "ghost"
                        }
                        aria-pressed={previewWidth === "mobile"}
                        onClick={() => setPreviewWidth("mobile")}
                        aria-label="Mobile preview"
                      >
                        <Smartphone
                          className="h-3.5 w-3.5"
                          aria-hidden="true"
                        />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              {bodyView === "source" ? (
                <>
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
                </>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs leading-5 text-[var(--vms-ink-muted)]">
                    Example values replace simple template variables.
                    Conditional branches are not evaluated and may appear
                    together. Preview scripts and external resources are
                    blocked.
                  </p>
                  <div className="rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] p-3 sm:p-4">
                    <div
                      className="mx-auto w-full transition-[max-width] duration-150"
                      style={{
                        maxWidth: previewWidth === "mobile" ? 390 : 680,
                      }}
                    >
                      <div className="mb-2 truncate rounded-t-md border border-b-0 border-[var(--vms-line)] bg-[var(--vms-surface)] px-3 py-2 text-xs text-[var(--vms-ink-muted)]">
                        {subject.trim() ||
                          detail.data.subject ||
                          "Event default subject"}
                      </div>
                      {body.trim() ? (
                        <iframe
                          title={`${detail.data.label} email preview`}
                          sandbox=""
                          srcDoc={emailPreviewDocument(body)}
                          className="block h-[30rem] w-full rounded-b-md border border-[var(--vms-line)] bg-white"
                        />
                      ) : (
                        <div className="grid h-48 place-items-center rounded-b-md border border-[var(--vms-line)] bg-[var(--vms-surface)] px-5 text-center text-sm text-[var(--vms-ink-muted)]">
                          Add an HTML body in Source view to preview this email.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
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
      {confirmationDialog}
    </FormDrawer>
  );
}

function emailPreviewDocument(body: string) {
  const sampleValues: Record<string, string> = {
    name: "Amina Okafor",
    first_name: "Amina",
    last_name: "Okafor",
    email: "amina@example.com",
    organization: "Harbour View Group",
    site: "Harbour View Residences",
    property: "Harbour View Residences",
    url: "#",
    link: "#",
    code: "VMS-1042",
    reference: "VMS-1042",
    amount: "NGN 85,000",
    date: "19 Nov 2026",
  };
  const html = body
    .replace(/{%[\s\S]*?%}/g, "")
    .replace(/{{\s*([^{}]+?)\s*}}/g, (_match, expression: string) => {
      const normalized = expression.trim().toLowerCase();
      const key = normalized.split(/[.|]/).at(-1)?.trim() || "";
      const value = normalized.includes("organization")
        ? sampleValues.organization
        : normalized.includes("site") || normalized.includes("property")
          ? sampleValues.site
          : sampleValues[key] || "Sample value";
      return value.replace(
        /[&<>"']/g,
        (character) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          })[character]!,
      );
    });
  const head =
    "<meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'none'; img-src data:; style-src 'unsafe-inline'; font-src data:; base-uri 'none'; form-action 'none'\">";
  if (/<html[\s>]/i.test(html)) {
    return /<head[\s>]/i.test(html)
      ? html.replace(/<head([^>]*)>/i, (match) => `${match}${head}`)
      : html.replace(
          /<html([^>]*)>/i,
          (match) => `${match}<head>${head}</head>`,
        );
  }
  return `<!doctype html><html><head>${head}<meta name="viewport" content="width=device-width, initial-scale=1"></head><body>${html}</body></html>`;
}
