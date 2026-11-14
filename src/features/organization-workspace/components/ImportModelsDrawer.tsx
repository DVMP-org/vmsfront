"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
    CheckCircle2,
    Download,
    FileSpreadsheet,
    Upload,
    XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { Field, fieldControlClassName } from "@/components/ui/form/Field";
import { FormDrawer } from "@/components/ui/form/FormDrawer";
import { FormSection } from "@/components/ui/form/FormSection";
import { cn } from "@/lib/utils";
import { parseApiError } from "@/lib/error-utils";

import type {
    OrganizationImportModel,
    OrganizationImportResult,
} from "../api";
import {
    importModelDescriptions,
    importModelLabels,
    importTemplateCsv,
    importTemplateFileName,
} from "../lib";
import {
    useImportOrganizationModels,
    useImportSiteModels,
} from "../queries";

const organizationModels: OrganizationImportModel[] = [
    "sites",
    "places",
    "units",
];
const siteModels: OrganizationImportModel[] = [
    "places",
    "units",
    "parties",
];

function downloadTemplate(
    model: OrganizationImportModel,
    scope: "organization" | "site",
) {
    const blob = new Blob(["\uFEFF", importTemplateCsv(model, scope)], {
        type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = importTemplateFileName(model, scope);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

function ImportResultPanel({ result }: { result: OrganizationImportResult }) {
    const failures = result.results.filter((row) => !row.success);

    return (
        <div className="space-y-3">
            <InlineAlert
                tone={result.failed > 0 ? "warning" : "success"}
                title={
                    result.failed > 0
                        ? `${result.successful} imported, ${result.failed} failed`
                        : `${result.successful} row${result.successful === 1 ? "" : "s"} imported`
                }
            >
                {result.total} row{result.total === 1 ? "" : "s"} processed. Successful rows
                are already saved.
            </InlineAlert>

            {failures.length > 0 ? (
                <div className="rounded-[var(--vms-radius-control)] border border-[var(--vms-line)]">
                    <p className="border-b border-[var(--vms-line)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--vms-ink-muted)]">
                        Row errors
                    </p>
                    <ul className="divide-y divide-[var(--vms-line)]">
                        {failures.slice(0, 8).map((failure) => (
                            <li
                                key={`${failure.row}-${failure.name}`}
                                className="flex gap-2 px-3 py-2 text-xs leading-5"
                            >
                                <XCircle
                                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--vms-danger)]"
                                    aria-hidden="true"
                                />
                                <span className="min-w-0">
                                    <span className="font-semibold text-[var(--vms-ink)]">
                                        Row {failure.row}
                                        {failure.name ? ` · ${failure.name}` : ""}
                                    </span>
                                    <span className="block text-[var(--vms-ink-muted)]">
                                        {failure.error || "Import failed"}
                                    </span>
                                </span>
                            </li>
                        ))}
                    </ul>
                    {failures.length > 8 ? (
                        <p className="border-t border-[var(--vms-line)] px-3 py-2 text-[11px] text-[var(--vms-ink-muted)]">
                            {failures.length - 8} more row error
                            {failures.length - 8 === 1 ? "" : "s"} not shown.
                        </p>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}

/**
 * Organization portfolio import.
 *
 * One drawer covers the three importable models. Templates are generated in the
 * browser so the columns, samples and back-end parser stay in sync at release
 * time; rows are applied independently and return row-level errors.
 */
export function ImportModelsDrawer({
    isOpen,
    onClose,
    slug,
    siteId,
    scope = "organization",
    models,
    onImported,
}: {
    isOpen: boolean;
    onClose: () => void;
    slug?: string | null;
    siteId?: string | null;
    scope?: "organization" | "site";
    models?: OrganizationImportModel[];
    onImported?: (result: OrganizationImportResult) => void;
}) {
    const organizationImport = useImportOrganizationModels(
        scope === "organization" ? slug : null,
    );
    const siteImport = useImportSiteModels(scope === "site" ? siteId : null);
    const mutation = scope === "site" ? siteImport : organizationImport;
    const availableModels =
        models ?? (scope === "site" ? siteModels : organizationModels);
    const [model, setModel] = useState<OrganizationImportModel>(
        availableModels[0],
    );
    const [file, setFile] = useState<File | null>(null);
    const [result, setResult] = useState<OrganizationImportResult | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        setFile(null);
        setResult(null);
        mutation.reset();
        if (inputRef.current) inputRef.current.value = "";
        // Reset only when the drawer opens or the model changes; the mutation
        // object is not a meaningful dependency for this reset.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, model]);

    useEffect(() => {
        if (!availableModels.includes(model)) {
            setModel(availableModels[0]);
        }
        // The model list is a short, stable array; compare its contents.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [availableModels.join("|"), model]);

    const label = importModelLabels[model];
    const description = importModelDescriptions[model];
    const canSubmit =
        Boolean((scope === "site" ? siteId : slug) && file) && !mutation.isPending;
    const errorMessage = mutation.isError
        ? parseApiError(mutation.error).message
        : null;

    const selectedFileSize = useMemo(() => {
        if (!file) return "";
        const kilobytes = file.size / 1024;
        return kilobytes >= 1024
            ? `${(kilobytes / 1024).toFixed(1)} MB`
            : `${Math.max(1, Math.round(kilobytes))} KB`;
    }, [file]);

    function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!file) return;
        if (scope === "site" ? !siteId : !slug) return;
        mutation.mutate(
            { model, file },
            {
                onSuccess: (imported) => {
                    setResult(imported);
                    onImported?.(imported);
                    if (inputRef.current) inputRef.current.value = "";
                },
            },
        );
    }

    return (
        <FormDrawer
            isOpen={isOpen}
            onClose={onClose}
            title={scope === "site" ? `Import into this Site` : "Import portfolio data"}
            description={
                scope === "site"
                    ? "Bring places, units or parties into the Site you manage."
                    : "Bring Sites, places or units into this organization from a CSV file."
            }
            onSubmit={submit}
            submitLabel={file ? `Import ${label}` : "Choose a file first"}
            isSubmitting={mutation.isPending}
            canSubmit={canSubmit}
            error={errorMessage}
            footerNote="Each row imports independently. Failed rows are reported without rolling back successful rows."
            size="lg"
        >
            <div
                role="tablist"
                aria-label="Import model"
                className="grid grid-cols-3 gap-1 rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] p-1"
            >
                {availableModels.map((item) => {
                    const selected = item === model;
                    return (
                        <button
                            key={item}
                            type="button"
                            role="tab"
                            aria-selected={selected}
                            onClick={() => setModel(item)}
                            className={cn(
                                "min-h-11 rounded-[var(--vms-radius-control)] px-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]",
                                selected
                                    ? "bg-[var(--vms-surface)] text-[var(--vms-ink)] shadow-[var(--vms-shadow-raised)]"
                                    : "text-[var(--vms-ink-muted)] hover:text-[var(--vms-ink)]",
                            )}
                        >
                            {importModelLabels[item]}
                        </button>
                    );
                })}
            </div>

            <div role="tabpanel" aria-label={label} className="mt-5 space-y-5">
                <FormSection
                    title="1. Download the template"
                    description={description}
                >
                    <div className="rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] p-4">
                        <p className="flex items-center gap-2 text-sm font-semibold text-[var(--vms-ink)]">
                            <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
                            {label} CSV template
                        </p>
                        <p className="mt-1 text-xs leading-5 text-[var(--vms-ink-muted)]">
                            Keep the header row. Parent references accept a Site or Place name,
                            slug, or ID. Delete the sample rows before importing.
                        </p>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="mt-3"
                            onClick={() => downloadTemplate(model, scope)}
                        >
                            <Download className="h-4 w-4" aria-hidden="true" />
                            Download template
                        </Button>
                    </div>
                </FormSection>

                <FormSection
                    title="2. Upload the completed file"
                    description="Only UTF-8 CSV files are accepted."
                >
                    <Field
                        id="import-file"
                        label={`${label} CSV file`}
                        description={
                            file
                                ? `${file.name} · ${selectedFileSize}`
                                : "Choose the completed template or your own CSV with the required columns."
                        }
                    >
                        {(control) => (
                            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[var(--vms-radius-control)] border border-dashed border-[var(--vms-line-strong)] bg-[var(--vms-surface)] px-3 text-sm text-[var(--vms-ink-muted)] transition-colors hover:bg-[var(--vms-surface-subtle)] focus-within:ring-2 focus-within:ring-[var(--vms-focus)]">
                                <Upload className="h-4 w-4 shrink-0" aria-hidden="true" />
                                <span className="min-w-0 truncate">
                                    {file ? file.name : "Choose a CSV file"}
                                </span>
                                <input
                                    {...control}
                                    ref={inputRef}
                                    id="import-file"
                                    type="file"
                                    accept=".csv,text/csv"
                                    className="sr-only"
                                    onChange={(event) => {
                                        setFile(event.target.files?.[0] ?? null);
                                        setResult(null);
                                    }}
                                    disabled={mutation.isPending}
                                />
                            </label>
                        )}
                    </Field>
                    {file ? (
                        <p className="flex items-center gap-1.5 text-xs text-[var(--vms-ink-muted)]">
                            <CheckCircle2
                                className="h-3.5 w-3.5 text-[var(--vms-success)]"
                                aria-hidden="true"
                            />
                            Ready to import {label.toLowerCase()} from {file.name}.
                        </p>
                    ) : null}
                </FormSection>

                {result ? <ImportResultPanel result={result} /> : null}
            </div>
        </FormDrawer>
    );
}
