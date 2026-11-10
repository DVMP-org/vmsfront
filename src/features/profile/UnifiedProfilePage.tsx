"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Skeleton } from "@/components/ui/Skeleton";
import { adminService } from "@/services/admin-service";
import { ProfilePage } from "./ProfilePage";

/**
 * One profile route for every signed-in principal.
 *
 * The shell follows the context the page was opened from (`?context=admin`
 * from the admin navigation, `?context=resident` from the resident one), so a
 * badge-holder who also manages a site keeps the menus they clicked through.
 * Opening `/profile` directly falls back to the account's role.
 */
export function UnifiedProfilePage() {
  const requested = useSearchParams().get("context");
  const context = requested === "admin" || requested === "resident" ? requested : null;
  const admin = useQuery({
    queryKey: ["profile", "admin"],
    queryFn: async () => (await adminService.getAdminProfile()).data,
    retry: false,
    staleTime: 60_000,
    enabled: context === null,
  });

  if (context === null && admin.isPending) {
    return (
      <DashboardLayout type="resident">
        <div className="space-y-4" role="status" aria-label="Loading profile">
          <Skeleton className="h-10 w-52" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  const isAdmin = context === "admin" || (context === null && admin.isSuccess);
  return (
    <DashboardLayout type={isAdmin ? "admin" : "resident"}>
      <ProfilePage audience={isAdmin ? "admin" : "resident"} />
    </DashboardLayout>
  );
}
