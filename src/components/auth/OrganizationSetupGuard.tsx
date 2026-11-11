"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCurrentOrganization } from "@/hooks/use-organization";

const FIRST_SITE_PATH = "/setup/first-site";

export function OrganizationSetupGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { organization, isPending } = useCurrentOrganization();
  const normalizedPathname = pathname?.replace(/\/+$/, "") || "";
  const isCreatingFirstSite =
    normalizedPathname === FIRST_SITE_PATH ||
    normalizedPathname.startsWith(`${FIRST_SITE_PATH}/`);
  const requiresFirstSite =
    !isPending &&
    organization?.needs_first_site === true &&
    !isCreatingFirstSite;

  useEffect(() => {
    if (!requiresFirstSite) return;
    router.replace(FIRST_SITE_PATH);
  }, [requiresFirstSite, router]);

  if (requiresFirstSite) {
    return (
      <p role="status" className="sr-only">
        Opening the required first Site setup.
      </p>
    );
  }

  return <>{children}</>;
}
