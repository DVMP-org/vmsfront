"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/app-store";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Home as HomeIcon } from "lucide-react";

export default function HouseIndexPage() {
  const router = useRouter();
  const { selectedHouse } = useAppStore();

  useEffect(() => {
    if (selectedHouse?.id) {
      router.replace(`/house/${selectedHouse.id}`);
    }
  }, [selectedHouse?.id, router]);

  return (
    <>
      <Card>
        <CardContent className="p-10">
          <EmptyState
            icon={HomeIcon}
            title="Select a house to continue"
            description="Choose a house from the dashboard selector to access your passes, visitors, and analytics."
            action={{
              label: "Choose House",
              onClick: () => router.push("/select"),
            }}
          />
        </CardContent>
      </Card>
    </>
  );
}
