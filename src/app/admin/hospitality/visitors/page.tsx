"use client";

import { HospitalityAdminPage } from "@/features/hospitality/HospitalityAdminPage";
import { useHospitalityAccess } from "@/features/hospitality/use-hospitality-access";
import { VisitorsRegister } from "@/features/visitors/VisitorsRegister";

/**
 * Visitors across a hospitality property.
 *
 * Guests with a stay are hotel guests; this register is the other kind —
 * visitors invited by a guest or by the property, which the front desk still has
 * to see and follow.
 */
export default function HospitalityVisitorsPage() {
  const access = useHospitalityAccess();

  return (
    <HospitalityAdminPage
      access={access}
      title="Visitors"
      description="Every visitor invited on this property. Open a visitor to follow their journey and scans."
    >
      <VisitorsRegister tableLabel="Hospitality visitor register" />
    </HospitalityAdminPage>
  );
}
