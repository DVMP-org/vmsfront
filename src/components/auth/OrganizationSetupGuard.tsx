"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCurrentOrganization } from "@/hooks/use-organization";

const FIRST_PLACE_PATH = "/admin/properties/new";

export function OrganizationSetupGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { organization, isPending } = useCurrentOrganization();
  const isCreatingFirstPlace = pathname?.startsWith(FIRST_PLACE_PATH) === true;
  const requiresFirstPlace =
    !isPending &&
    organization?.needs_first_site === true &&
    !isCreatingFirstPlace;

  useEffect(() => {
    if (!requiresFirstPlace) return;
    router.replace(`${FIRST_PLACE_PATH}?setup=first-place`);
  }, [requiresFirstPlace, router]);

  if (requiresFirstPlace) {
    return (
      <p role="status" className="sr-only">
        Opening the required first property setup.
      </p>
    );
  }

  return <>{children}</>;
}
