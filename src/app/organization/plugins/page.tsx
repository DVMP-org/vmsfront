import { Suspense } from "react";

import PageLoader from "@/components/ui/PageLoader";
import { OrgAdminPluginsPage } from "@/features/organization-plugins/OrgAdminPluginsPage";

export default function OrgAdminPluginsRoute() {
  return (
    <Suspense fallback={<PageLoader message="Loading plugins…" />}>
      <OrgAdminPluginsPage />
    </Suspense>
  );
}
