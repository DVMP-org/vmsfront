"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Download,
  FileText,
  Image as ImageIcon,
  Star,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/datetime";
import { parseApiError } from "@/lib/error-utils";
import { cn } from "@/lib/utils";

import { attachmentUrl } from "../api";
import { fileExtension, formatFileSize, reorderIds } from "../lib";
import {
  useAttachments,
  useRemoveAttachment,
  useReorderAttachments,
  useSetPrimaryAttachment,
  useUploadAttachment,
} from "../queries";
import type {
  Attachment,
  AttachmentCategory,
  AttachmentEntityType,
} from "../types";
import { FileUploader } from "./FileUploader";
import { ImageCropper } from "./ImageCropper";

type Variant = "gallery" | "single" | "avatar" | "cover" | "documents";

function uploadError(error: unknown): Error {
  return new Error(parseApiError(error).message);
}

/**
 * The shared attachment editor.
 *
 * A screen chooses a variant, not an implementation: a gallery gets ordering
 * and a cover, an avatar gets one cropped image, and documents get a list with
 * metadata. All of them use the same endpoints and the same permission rules.
 */
export function AttachmentManager({
  entityType,
  entityId,
  category,
  variant = "gallery",
  isPublic = false,
  title,
  description,
  allowCrop = false,
  aspect = "square",
  emptyLabel,
}: {
  entityType: AttachmentEntityType;
  entityId: string | null | undefined;
  category: AttachmentCategory;
  variant?: Variant;
  isPublic?: boolean;
  title?: string;
  description?: string;
  allowCrop?: boolean;
  aspect?: "square" | "wide";
  emptyLabel?: string;
}) {
  if (!entityId) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] px-4 py-6 text-center text-sm text-[var(--vms-ink-muted)]">
        Save this record first, then add files.
      </div>
    );
  }
  return (
    <AttachmentBody
      entityType={entityType}
      entityId={entityId}
      category={category}
      variant={variant}
      isPublic={isPublic}
      title={title}
      description={description}
      allowCrop={allowCrop}
      aspect={aspect}
      emptyLabel={emptyLabel}
    />
  );
}

function AttachmentBody({
  entityType,
  entityId,
  category,
  variant,
  isPublic,
  title,
  description,
  allowCrop,
  aspect,
  emptyLabel,
}: {
  entityType: AttachmentEntityType;
  entityId: string;
  category: AttachmentCategory;
  variant: Variant;
  isPublic: boolean;
  title?: string;
  description?: string;
  allowCrop: boolean;
  aspect: "square" | "wide";
  emptyLabel?: string;
}) {
  const query = useAttachments(entityType, entityId, category);
  const upload = useUploadAttachment(entityType, entityId);
  const reorder = useReorderAttachments(entityType, entityId);
  const primary = useSetPrimaryAttachment(entityType, entityId);
  const remove = useRemoveAttachment(entityType, entityId);
  const [cropFile, setCropFile] = useState<File | null>(null);

  const attachments = query.data ?? [];
  const isDocuments = variant === "documents";
  const isGallery = variant === "gallery";
  const single = !isGallery && !isDocuments;
  const current = attachments.find((row) => row.is_primary) ?? attachments[0];

  async function uploadFile(
    file: File,
    onProgress: (percent: number) => void,
  ) {
    try {
      const created = await upload.mutateAsync({
        file,
        options: { category, isPublic, onProgress, makePrimary: single },
      });
      if (single) {
        // A single-image slot replaces rather than accumulates: keeping the old
        // file attached would leave it in storage with nothing pointing at it.
        for (const old of attachments) {
          if (old.id !== created.id) {
            await remove.mutateAsync(old.id);
          }
        }
      }
    } catch (error) {
      throw uploadError(error);
    }
  }

  function pickForCrop(file: File | undefined) {
    if (!file) return;
    setCropFile(file);
  }

  return (
    <section className="space-y-4">
      {title || description ? (
        <header>
          {title ? (
            <h3 className="text-sm font-semibold text-[var(--vms-ink)]">
              {title}
            </h3>
          ) : null}
          {description ? (
            <p className="mt-1 text-xs text-[var(--vms-ink-muted)]">
              {description}
            </p>
          ) : null}
        </header>
      ) : null}

      {query.isError ? (
        <p role="alert" className="text-sm text-[var(--vms-danger)]">
          {parseApiError(query.error).message}
        </p>
      ) : null}

      {isGallery ? (
        <GalleryGrid
          attachments={attachments}
          onMove={(from, to) =>
            reorder.mutate({
              attachmentIds: reorderIds(attachments, from, to),
              category,
            })
          }
          onPrimary={(id) => primary.mutate(id)}
          onRemove={(id) => remove.mutate(id)}
          emptyLabel={emptyLabel}
        />
      ) : null}

      {single ? (
        <SingleImage
          attachment={current}
          variant={variant}
          aspect={aspect}
          onRemove={() => current && remove.mutate(current.id)}
          onPick={pickForCrop}
          allowCrop={allowCrop}
          upload={uploadFile}
        />
      ) : null}

      {isDocuments ? (
        <DocumentList
          attachments={attachments}
          onRemove={(id) => remove.mutate(id)}
          emptyLabel={emptyLabel}
        />
      ) : null}

      {!single && !isDocuments ? (
        <FileUploader
          kind="image"
          label="Add images"
          helper="Drag images here, or browse. The first image becomes the cover."
          buttonLabel="Add images"
          onUpload={uploadFile}
        />
      ) : null}

      {isDocuments ? (
        <FileUploader
          kind="document"
          label="Add documents"
          helper="PDF, Word, Excel, PowerPoint, CSV or text. Files stay private unless the page is public."
          buttonLabel="Add documents"
          onUpload={uploadFile}
        />
      ) : null}

      {cropFile ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-[var(--vms-line)] bg-[var(--vms-surface)] p-5 shadow-xl">
            <ImageCropper
              file={cropFile}
              aspect={aspect}
              onCancel={() => setCropFile(null)}
              onCropped={(file) => {
                setCropFile(null);
                void uploadFile(file, () => undefined);
              }}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}

function GalleryGrid({
  attachments,
  onMove,
  onPrimary,
  onRemove,
  emptyLabel,
}: {
  attachments: Attachment[];
  onMove: (from: number, to: number) => void;
  onPrimary: (id: string) => void;
  onRemove: (id: string) => void;
  emptyLabel?: string;
}) {
  if (!attachments.length) {
    return (
      <p className="rounded-xl border border-dashed border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] px-4 py-6 text-center text-sm text-[var(--vms-ink-muted)]">
        {emptyLabel ?? "No images yet."}
      </p>
    );
  }
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {attachments.map((attachment, index) => {
        const src = attachmentUrl(attachment.thumbnail_url);
        return (
          <li
            key={attachment.id}
            className="group relative overflow-hidden rounded-xl border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)]"
          >
            <div className="relative aspect-square">
              {src ? (
                // eslint-disable-next-line @next/next/no-img-element -- signed API content, not an optimizable asset
                <img
                  src={src}
                  alt={attachment.caption ?? attachment.original_name}
                  loading="lazy"
                  className="size-full object-cover"
                />
              ) : (
                <span className="grid size-full place-items-center text-[var(--vms-ink-muted)]">
                  <ImageIcon aria-hidden="true" className="size-6" />
                </span>
              )}
              {attachment.is_primary ? (
                <span className="absolute left-2 top-2 rounded-full bg-[var(--vms-active-accent)] px-2 py-0.5 text-[11px] font-medium text-white">
                  Cover
                </span>
              ) : null}
            </div>
            <div className="flex items-center justify-between gap-1 border-t border-[var(--vms-line)] bg-[var(--vms-surface)] px-1 py-1">
              <div className="flex items-center">
                <button
                  type="button"
                  aria-label="Move image earlier"
                  disabled={index === 0}
                  onClick={() => onMove(index, index - 1)}
                  className="grid size-9 place-items-center rounded-lg text-[var(--vms-ink-muted)] hover:bg-[var(--vms-surface-subtle)] disabled:opacity-40"
                >
                  <ArrowLeft aria-hidden="true" className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label="Move image later"
                  disabled={index === attachments.length - 1}
                  onClick={() => onMove(index, index + 1)}
                  className="grid size-9 place-items-center rounded-lg text-[var(--vms-ink-muted)] hover:bg-[var(--vms-surface-subtle)] disabled:opacity-40"
                >
                  <ArrowRight aria-hidden="true" className="size-4" />
                </button>
              </div>
              <div className="flex items-center">
                <button
                  type="button"
                  aria-label={
                    attachment.is_primary
                      ? "This image is the cover"
                      : "Use as cover"
                  }
                  aria-pressed={attachment.is_primary}
                  disabled={attachment.is_primary}
                  onClick={() => onPrimary(attachment.id)}
                  className={cn(
                    "grid size-9 place-items-center rounded-lg hover:bg-[var(--vms-surface-subtle)]",
                    attachment.is_primary
                      ? "text-[var(--vms-active-accent)]"
                      : "text-[var(--vms-ink-muted)]",
                  )}
                >
                  <Star
                    aria-hidden="true"
                    className={cn(
                      "size-4",
                      attachment.is_primary && "fill-current",
                    )}
                  />
                </button>
                <button
                  type="button"
                  aria-label="Remove image"
                  onClick={() => onRemove(attachment.id)}
                  className="grid size-9 place-items-center rounded-lg text-[var(--vms-ink-muted)] hover:bg-[var(--vms-danger-subtle)] hover:text-[var(--vms-danger)]"
                >
                  <Trash2 aria-hidden="true" className="size-4" />
                </button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function SingleImage({
  attachment,
  variant,
  aspect,
  onRemove,
  onPick,
  allowCrop,
  upload,
}: {
  attachment: Attachment | undefined;
  variant: Variant;
  aspect: "square" | "wide";
  onRemove: () => void;
  onPick: (file: File | undefined) => void;
  allowCrop: boolean;
  upload: (file: File, onProgress: (percent: number) => void) => Promise<void>;
}) {
  const [progress, setProgress] = useState<number | null>(null);
  const src = attachmentUrl(attachment?.thumbnail_url ?? attachment?.url);
  const isRound = variant === "avatar";
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div
        className={cn(
          "relative overflow-hidden border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)]",
          isRound ? "size-20 rounded-full" : "rounded-xl",
          !isRound && aspect === "square" && "size-28",
          !isRound && aspect === "wide" && "h-24 w-44",
        )}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element -- signed API content
          <img
            src={src}
            alt={attachment?.caption ?? attachment?.original_name ?? "Image"}
            className="size-full object-cover"
          />
        ) : (
          <span className="grid size-full place-items-center text-[var(--vms-ink-muted)]">
            <ImageIcon aria-hidden="true" className="size-6" />
          </span>
        )}
        {progress !== null ? (
          <span className="absolute inset-x-0 bottom-0 h-1 bg-[var(--vms-active-accent)] transition-[width]" style={{ width: `${progress}%` }} />
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {allowCrop ? (
          <label className="inline-flex min-h-11 cursor-pointer items-center rounded-lg border border-[var(--vms-line)] px-3 text-sm font-medium text-[var(--vms-ink)] hover:bg-[var(--vms-surface-subtle)]">
            {attachment ? "Replace" : "Upload"}
            <input
              type="file"
              className="sr-only"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => {
                onPick(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
          </label>
        ) : (
          <FileUploader
            kind="image"
            multiple={false}
            label={attachment ? "Replace image" : "Upload image"}
            buttonLabel={attachment ? "Replace" : "Upload"}
            onUpload={async (file, onProgress) => {
              setProgress(0);
              try {
                await upload(file, (percent) => {
                  setProgress(percent);
                  onProgress(percent);
                });
              } finally {
                setProgress(null);
              }
            }}
          />
        )}
        {attachment ? (
          <Button type="button" variant="ghost" onClick={onRemove}>
            <Trash2 aria-hidden="true" className="size-4" />
            Remove
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function DocumentList({
  attachments,
  onRemove,
  emptyLabel,
}: {
  attachments: Attachment[];
  onRemove: (id: string) => void;
  emptyLabel?: string;
}) {
  if (!attachments.length) {
    return (
      <p className="rounded-xl border border-dashed border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] px-4 py-6 text-center text-sm text-[var(--vms-ink-muted)]">
        {emptyLabel ?? "No documents yet."}
      </p>
    );
  }
  return (
    <ul className="divide-y divide-[var(--vms-line)] overflow-hidden rounded-xl border border-[var(--vms-line)] bg-[var(--vms-surface)]">
      {attachments.map((attachment) => {
        const url = attachmentUrl(attachment.url);
        return (
          <li
            key={attachment.id}
            className="flex flex-wrap items-center gap-3 px-4 py-3"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[var(--vms-surface-subtle)] text-[var(--vms-ink-muted)]">
              <FileText aria-hidden="true" className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[var(--vms-ink)]">
                {attachment.original_name}
              </p>
              <p className="mt-0.5 text-xs text-[var(--vms-ink-muted)]">
                {fileExtension(attachment.original_name)} ·{" "}
                {formatFileSize(attachment.size_bytes)}
                {attachment.uploaded_at
                  ? ` · ${formatDate(attachment.uploaded_at)}`
                  : ""}
                {attachment.uploaded_by_name
                  ? ` · ${attachment.uploaded_by_name}`
                  : ""}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {url ? (
                <>
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-[var(--vms-ink)] hover:bg-[var(--vms-surface-subtle)]"
                  >
                    Preview
                  </a>
                  <a
                    href={url}
                    download={attachment.original_name}
                    className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-[var(--vms-ink)] hover:bg-[var(--vms-surface-subtle)]"
                  >
                    <Download aria-hidden="true" className="size-4" />
                    <span className="sr-only">Download</span>
                  </a>
                </>
              ) : null}
              <button
                type="button"
                aria-label={`Remove ${attachment.original_name}`}
                onClick={() => onRemove(attachment.id)}
                className="grid size-11 place-items-center rounded-lg text-[var(--vms-ink-muted)] hover:bg-[var(--vms-danger-subtle)] hover:text-[var(--vms-danger)]"
              >
                <Trash2 aria-hidden="true" className="size-4" />
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
