"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/app-store";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Home as HomeIcon } from "lucide-react";

export default function ResidencyIndexPage() {
  const router = useRouter();
  const { selectedResidency } = useAppStore();

  useEffect(() => {
    if (selectedResidency?.id) {
      router.replace(`/residency/${selectedResidency.id}`);
    }
  }, [selectedResidency?.id, router]);

  return (
    <>
      <Card>
        <CardContent className="p-10">
          <EmptyState
            icon={HomeIcon}
            title="Select a residency to continue"
            description="Choose a residency from the dashboard selector to access your passes, visitors, and analytics."
            action={{
              label: "Choose Residency",
              onClick: () => router.push("/select"),
            }}
          />
        </CardContent>
      </Card>
    </>
  );
}
