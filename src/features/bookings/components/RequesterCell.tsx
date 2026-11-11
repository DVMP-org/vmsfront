"use client";

import { Avatar } from "@/components/ui/Avatar";
import type { BookingRequester } from "../types";

/**
 * Atomic requester identity: avatar plus name and the first available contact
 * detail. The avatar is decorative here because the name is adjacent text.
 */
export function RequesterCell({ requester }: { requester: BookingRequester }) {
  const contact = requester.email ?? requester.phone;
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <Avatar name={requester.name} size="sm" decorative />
      <div className="min-w-0">
        <span className="block truncate text-sm font-medium text-[var(--vms-ink)]">
          {requester.name}
        </span>
        {contact ? (
          <span className="block truncate text-xs text-[var(--vms-ink-muted)]">
            {contact}
          </span>
        ) : null}
      </div>
    </div>
  );
}
