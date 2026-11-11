"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Check,
  Copy,
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";

import { Modal } from "@/components/ui/Modal";
import { profileApi } from "@/features/profile/api";
import { cn } from "@/lib/utils";

/**
 * Compact Party badge for the workspace hero strip.
 *
 * A QR thumb, badge id, copy and mask controls all sit on one line, so the
 * dashboard keeps its space. Clicking the thumb opens the full badge modal.
 */
export function PartyBadgeStrip() {
  const badge = useQuery({
    queryKey: ["party-badge"],
    queryFn: profileApi.badge,
    retry: false,
    staleTime: 5 * 60_000,
  });
  const [hidden, setHidden] = useState(false);
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const badgeId = badge.data?.badge_id ?? null;
  const name = badge.data?.display_name ?? "Party";

  if (badge.isError || !badgeId) return null;

  async function copy() {
    if (!badgeId) return;
    try {
      await navigator.clipboard.writeText(badgeId);
      setCopied(true);
    } catch {
      toast.error("Could not copy the badge id");
    }
  }

  return (
    <>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--vms-ink-muted)]">
          <ShieldCheck className="h-3 w-3" aria-hidden />

        </span>
        <button
          type="button"
          disabled={hidden}
          onClick={() => setOpen(true)}
          aria-label={hidden ? "Badge is hidden" : "Open your badge QR code"}
          className={cn(
            "grid h-8 w-8 shrink-0 place-items-center rounded-md border bg-white p-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]",
            hidden
              ? "cursor-default border-dashed border-[var(--vms-line)] bg-[var(--vms-surface-subtle)]"
              : "border-[var(--vms-line)] hover:border-[var(--vms-line-strong)]",
          )}
        >
          {hidden ? (
            <EyeOff
              className="h-3.5 w-3.5 text-[var(--vms-ink-muted)]"
              aria-hidden
            />
          ) : (
            <QRCodeSVG value={badgeId} size={24} level="M" />
          )}
        </button>
        <span
          className="font-mono text-[11px] font-semibold tracking-[0.04em] text-[var(--vms-ink)]"
          aria-hidden={hidden}
        >
          {hidden ? "••••••••" : badgeId}
        </span>
        <button
          type="button"
          disabled={hidden}
          onClick={copy}
          aria-label={copied ? "Badge id copied" : "Copy badge id"}
          className="grid h-7 w-7 place-items-center rounded-md text-[var(--vms-ink-muted)] transition hover:bg-[var(--vms-surface-subtle)] hover:text-[var(--vms-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)] disabled:opacity-40"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-[var(--vms-success)]" aria-hidden />
          ) : (
            <Copy className="h-3.5 w-3.5" aria-hidden />
          )}
        </button>
        <button
          type="button"
          aria-pressed={hidden}
          onClick={() => setHidden((current) => !current)}
          aria-label={hidden ? "Show badge" : "Hide badge"}
          className="grid h-7 w-7 place-items-center rounded-md text-[var(--vms-ink-muted)] transition hover:bg-[var(--vms-surface-subtle)] hover:text-[var(--vms-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]"
        >
          {hidden ? (
            <Eye className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <EyeOff className="h-3.5 w-3.5" aria-hidden />
          )}
        </button>
        <span role="status" aria-live="polite" className="sr-only">
          {copied ? "Badge id copied to clipboard" : ""}
        </span>
      </div>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Your badge"
        description={`${name} · scan at any checkpoint`}
        size="sm"
        ariaLabel="Party badge"
      >
        <div className="space-y-4 p-5">
          <div className="mx-auto grid h-64 w-64 place-items-center rounded-xl border border-[var(--vms-line)] bg-white p-4">
            <QRCodeSVG value={badgeId} size={220} level="M" />
          </div>
          <div className="rounded-[var(--vms-radius-control)] bg-[var(--vms-surface-subtle)] p-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--vms-ink-muted)]">
              Badge id
            </p>
            <p className="mt-1 break-all font-mono text-base font-semibold tracking-[0.08em]">
              {badgeId}
            </p>
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="min-h-10 rounded-lg border border-[var(--vms-line-strong)] px-4 text-sm font-semibold"
            >
              Close
            </button>
            <button
              type="button"
              onClick={copy}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[var(--vms-action)] px-4 text-sm font-semibold text-[var(--vms-on-action)]"
            >
              {copied ? (
                <Check className="h-4 w-4" aria-hidden />
              ) : (
                <Copy className="h-4 w-4" aria-hidden />
              )}
              {copied ? "Copied" : "Copy badge id"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
