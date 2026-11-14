"use client";

import { VisitorsRegister } from "@/features/visitors/VisitorsRegister";

import { CommercialShell } from "./CommercialShell";

/**
 * Visitors across a commercial property.
 *
 * A business tenant receives guests at its suite exactly as a resident does, so
 * the office needs the same register it has for residential. Employee access
 * lives beside this on the same route group: employees are who may enter, this
 * is who did.
 */
export default function CommercialVisitors() {
  return (
    <CommercialShell
      title="Visitors"
      description="Every visitor invited by a tenant on this property. Open a visitor to follow their journey and scans; employee access is managed separately."
    >
      <VisitorsRegister tableLabel="Commercial visitor register" />
    </CommercialShell>
  );
}
