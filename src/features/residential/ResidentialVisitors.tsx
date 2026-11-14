"use client";

import { VisitorsRegister } from "@/features/visitors/VisitorsRegister";

import { ResidentialShell } from "./ResidentialShell";

/**
 * Visitors at a residential property: every guest, one row each.
 *
 * The register itself is shared with the other domains; this screen only
 * supplies the residential frame and wording.
 */
export function ResidentialVisitors() {
  return (
    <ResidentialShell
      title="Visitors & access"
      description="Every visitor at this property, one row each. Search by their invitation ID or suffix, then open the visitor to follow their journey and scans."
    >
      <VisitorsRegister tableLabel="Residential visitor register" />
    </ResidentialShell>
  );
}
