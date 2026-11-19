"use client";

import { useCallback, useId, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, RotateCw, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

import { validateFile } from "../lib";

type Kind = "image" | "document" | "any";

interface QueueItem {
  id: string;
  file: File;
  progress: number;
  status: "uploading" | "done" | "error";
  error?: string;
}

/**
 * One upload surface for every screen.
 *
 * Validation happens before the request, progress comes from the HTTP upload,
 * and a failed item keeps its file so it can be retried instead of reselected.
 */
export function FileUploader({
  kind = "image",
  multiple = true,
  disabled = false,
  label,
  helper,
  buttonLabel = "Choose files",
  onUpload,
  onUploaded,
}: {
  kind?: Kind;
  multiple?: boolean;
  disabled?: boolean;
  label?: string;
  helper?: string;
  buttonLabel?: string;
  onUpload: (file: File, onProgress: (percent: number) => void) => Promise<void>;
  onUploaded?: () => void;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const update = useCallback((id: string, patch: Partial<QueueItem>) => {
    setQueue((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }, []);

  const run = useCallback(
    async (item: QueueItem) => {
      update(item.id, { status: "uploading", progress: 0, error: undefined });
      try {
        await onUpload(item.file, (percent) =>
          update(item.id, { progress: percent }),
        );
        update(item.id, { status: "done", progress: 100 });
        onUploaded?.();
        setQueue((current) =>
          current.filter((row) => row.id !== item.id || row.status !== "done"),
        );
      } catch (error) {
        update(item.id, {
          status: "error",
          error:
            error instanceof Error ? error.message : "The upload was rejected.",
        });
      }
    },
    [onUpload, onUploaded, update],
  );

  const accept = useCallback(
    (files: FileList | File[]) => {
      setMessage(null);
      const selected = Array.from(files);
      const accepted: QueueItem[] = [];
      for (const file of selected.slice(0, multiple ? selected.length : 1)) {
        const result = validateFile(file, kind);
        if (!result.valid) {
          setMessage(result.message ?? "That file cannot be uploaded.");
          continue;
        }
        accepted.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          file,
          progress: 0,
          status: "uploading",
        });
      }
      if (!accepted.length) return;
      setQueue((current) => [...current, ...accepted]);
      for (const item of accepted) {
        void run(item);
      }
    },
    [kind, multiple, run],
  );

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    if (disabled) return;
    if (event.dataTransfer.files.length) accept(event.dataTransfer.files);
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "rounded-xl border border-dashed px-4 py-5 text-center transition-colors",
          dragging
            ? "border-[var(--vms-active-accent)] bg-[var(--vms-coral-soft)]"
            : "border-[var(--vms-line)] bg-[var(--vms-surface-subtle)]",
          disabled && "opacity-60",
        )}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          className="sr-only"
          accept={
            kind === "image"
              ? "image/png,image/jpeg,image/webp,image/gif"
              : kind === "document"
                ? ".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.ppt,.pptx"
                : "image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
          }
          multiple={multiple}
          disabled={disabled}
          onChange={(event) => {
            if (event.target.files?.length) accept(event.target.files);
            event.target.value = "";
          }}
        />
        <div className="flex flex-col items-center gap-2">
          <span className="grid size-11 place-items-center rounded-full bg-[var(--vms-surface)] text-[var(--vms-ink-muted)] shadow-sm">
            <Upload aria-hidden="true" className="size-5" />
          </span>
          <div>
            <label
              htmlFor={inputId}
              className="cursor-pointer text-sm font-medium text-[var(--vms-ink)] underline-offset-4 hover:underline"
            >
              {label ?? "Drag files here or browse"}
            </label>
            <p className="mt-1 text-xs text-[var(--vms-ink-muted)]">
              {helper ??
                (kind === "image"
                  ? "PNG, JPEG, WebP or GIF. Images are resized for display."
                  : "PDF, Word, Excel, PowerPoint, CSV or text.")}
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            className="min-h-11"
          >
            {buttonLabel}
          </Button>
        </div>
      </div>

      {message ? (
        <p role="alert" className="text-sm text-[var(--vms-danger)]">
          {message}
        </p>
      ) : null}

      {queue.length ? (
        <ul className="space-y-2">
          {queue.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-lg border border-[var(--vms-line)] bg-[var(--vms-surface)] px-3 py-2"
            >
              <span
                aria-hidden="true"
                className="grid size-8 shrink-0 place-items-center text-[var(--vms-ink-muted)]"
              >
                {item.status === "error" ? (
                  <AlertCircle className="size-4 text-[var(--vms-danger)]" />
                ) : item.status === "done" ? (
                  <CheckCircle2 className="size-4 text-[var(--vms-success)]" />
                ) : (
                  <RotateCw className="size-4 animate-spin motion-reduce:animate-none" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-[var(--vms-ink)]">
                  {item.file.name}
                </p>
                {item.status === "error" ? (
                  <p className="text-xs text-[var(--vms-danger)]">{item.error}</p>
                ) : (
                  <div
                    className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--vms-surface-subtle)]"
                    role="progressbar"
                    aria-label={`Uploading ${item.file.name}`}
                    aria-valuenow={item.progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className="h-full rounded-full bg-[var(--vms-active-accent)] transition-[width]"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                )}
              </div>
              {item.status === "error" ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => void run(item)}
                >
                  Retry
                </Button>
              ) : null}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label={`Dismiss ${item.file.name}`}
                onClick={() =>
                  setQueue((current) =>
                    current.filter((row) => row.id !== item.id),
                  )
                }
              >
                <X aria-hidden="true" className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
