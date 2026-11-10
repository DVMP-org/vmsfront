"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";

import { getInitials } from "@/lib/utils";

const MAX_BYTES = 2 * 1024 * 1024;
const ACCEPTED = ["image/png", "image/jpeg", "image/webp"];

/**
 * Profile photo with an inline upload control.
 *
 * The image belongs to the User, so SiteAdmins and Parties share the same
 * photo everywhere they appear.
 */
export function ProfileAvatar({
  name,
  avatarUrl,
  uploading = false,
  onSelect,
  onClear,
}: {
  name: string;
  avatarUrl?: string | null;
  uploading?: boolean;
  onSelect: (file: File) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  function choose(file: File | undefined) {
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      setError("Choose a PNG, JPEG or WebP image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Profile images must be 2 MB or smaller.");
      return;
    }
    setError(null);
    onSelect(file);
  }

  return (
    <div className="flex items-center gap-4">
      <span className="relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full bg-[var(--vms-action)] text-xl font-semibold text-[var(--vms-on-action)]">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- user-provided storage URL
          <img
            src={avatarUrl}
            alt={`${name} profile photo`}
            className="h-full w-full object-cover"
          />
        ) : (
          <span aria-hidden="true">{getInitials(name, "")}</span>
        )}
        {uploading ? (
          <span className="absolute inset-0 grid place-items-center bg-black/45 text-white">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          </span>
        ) : null}
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[var(--vms-line-strong)] bg-[var(--vms-surface)] px-3 text-xs font-semibold text-[var(--vms-ink)] transition hover:bg-[var(--vms-surface-subtle)] disabled:opacity-50"
          >
            <Camera className="h-3.5 w-3.5" aria-hidden="true" />
            {avatarUrl ? "Change photo" : "Add photo"}
          </button>
          {avatarUrl ? (
            <button
              type="button"
              disabled={uploading}
              onClick={onClear}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-[var(--vms-danger)] transition hover:bg-[var(--vms-danger-subtle)] disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              Remove
            </button>
          ) : null}
        </div>
        <p className="mt-1.5 text-[11px] text-[var(--vms-ink-muted)]">
          PNG, JPEG or WebP · up to 2 MB. Used across your account.
        </p>
        {error ? (
          <p role="alert" className="mt-1 text-[11px] text-[var(--vms-danger)]">
            {error}
          </p>
        ) : null}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(",")}
          className="sr-only"
          onChange={(event) => {
            choose(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
