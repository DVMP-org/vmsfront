"use client";

import Link from "next/link";
import { ArrowUpRight, Plus } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";

export function OrganizationHeader({
  name,
  description,
  canCreate,
  onCreate,
}: {
  name: string;
  description?: string | null;
  canCreate: boolean;
  onCreate: () => void;
}) {
  return (
    <PageHeader
      eyebrow="Organization"
      title={name}
      description={description || "Manage Sites, members and shared services."}
      secondaryActions={
        <Button asChild variant="outline">
          <Link href="/">
            Open Workspaces
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      }
      primaryAction={
        canCreate ? (
          <Button onClick={onCreate}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Create Site
          </Button>
        ) : undefined
      }
    />
  );
}
