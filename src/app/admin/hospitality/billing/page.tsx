import { Suspense } from "react";

import PageLoader from "@/components/ui/PageLoader";
import { BillingWorkspace } from "@/features/hospitality/BillingWorkspace";

export default function HospitalityBillingPage() {
  return (
    <Suspense fallback={<PageLoader message="Loading guest billing…" />}>
      <BillingWorkspace />
    </Suspense>
  );
}
