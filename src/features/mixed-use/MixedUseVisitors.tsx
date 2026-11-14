"use client";

import { VisitorsRegister } from "@/features/visitors/VisitorsRegister";

import { MixedUseShell } from "./MixedUseShell";

/** Visitors across a mixed-use property, whichever part of it they visit. */
export default function MixedUseVisitors() {
  return (
    <MixedUseShell
      title="Visitors"
      description="Every visitor invited anywhere on this property. Open a visitor to follow their journey and scans."
    >
      <VisitorsRegister tableLabel="Mixed-use visitor register" />
    </MixedUseShell>
  );
}
