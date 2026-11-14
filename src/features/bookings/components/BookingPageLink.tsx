"use client";

import { useEffect, useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { publicBookingUrl } from "../lib";

/**
 * The Site's own public booking page, as something an administrator can share.
 *
 * The address exists whether or not this is shown — the page is served on the
 * organization's subdomain from the Site's slug — but until now nothing in the
 * administration could tell anyone what it was. A booking page nobody can find
 * is a booking page that does not work.
 *
 * The link is built from the origin the reader is already on, because the page
 * only exists on that host. Clipboard access is asynchronous and can be refused,
 * so the copy button reports success only after the write resolves, and falls
 * back to a selectable input if it is unavailable.
 */
export function BookingPageLink({ siteSlug }: { siteSlug: string | null }) {
  const [origin, setOrigin] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // `window` is not available during the server render, and reading it in state
  // after mount is what keeps the markup identical on both sides.
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const url = origin ? publicBookingUrl(siteSlug, origin) : null;

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  if (!siteSlug) {
    return (
      <p className="text-xs text-[var(--vms-ink-muted)]">
        This Site has no public address yet, so there is no booking page to
        share.
      </p>
    );
  }

  if (!url) {
    return null;
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-[var(--vms-border)] px-3 py-2">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--vms-ink-muted)]">
        Public booking page
      </span>
      <div className="flex flex-wrap items-center gap-2">
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="min-h-11 min-w-0 flex-1 truncate text-xs text-[var(--vms-ink)] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-accent)]"
        >
          {url}
          <ExternalLink aria-hidden className="ml-1 inline size-3" />
        </a>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => void copy()}
          aria-label={copied ? "Booking link copied" : "Copy booking link"}
        >
          {copied ? (
            <Check aria-hidden className="size-4" />
          ) : (
            <Copy aria-hidden className="size-4" />
          )}
          <span className="ml-1">{copied ? "Copied" : "Copy link"}</span>
        </Button>
      </div>
    </div>
  );
}
