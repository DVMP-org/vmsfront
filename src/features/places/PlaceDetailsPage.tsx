"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Avatar } from "@/components/ui/Avatar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { useSiteAccess } from "@/features/context/use-site-access";
import { useAppStore } from "@/store/app-store";
import { parseApiError } from "@/lib/error-utils";
import type { WorkspaceRelationship } from "@/types";
import { AttachmentManager } from "@/features/files/components/AttachmentManager";
import { placeKinds, placesApi, placeRelationshipsApi } from "./api";
import { PlaceAssignmentModal } from "./PlaceAssignmentModal";
import { placeAssignmentCopyFor } from "./roles";

export function PlaceDetailsPage({ placeId }: { placeId: string }) {
  const { allowed, contextKey, workspace } = useSiteAccess();
  const site = useAppStore((state) => state.selectedSite);
  const useCase = workspace.data?.effective_use_case ?? null;
  const assignmentCopy = placeAssignmentCopyFor(useCase);
  const queryClient = useQueryClient();
  const [assignOpen, setAssignOpen] = useState(false);
  const canView = allowed(["places.show", "places.list"]);
  const canAssign = allowed(["place_relationships.create", "parties.create"]);
  const place = useQuery({
    queryKey: ["place", contextKey, placeId],
    queryFn: () => placesApi.get(placeId),
    enabled: !!site && canView && !workspace.isPending && !workspace.isError,
    retry: false,
  });
  const currentPlace =
    place.data?.site_id === site?.id ? place.data : undefined;
  const relationships = useQuery({
    queryKey: ["place-relationships", contextKey, placeId],
    queryFn: () => placeRelationshipsApi.list({ place_id: placeId }),
    enabled: !!currentPlace && allowed("place_relationships.list"),
    retry: false,
  });
  const columns: Column<WorkspaceRelationship>[] = [
    {
      key: "party.display_name",
      header: "Person",
      accessor: (row) => (
        <span className="flex items-center gap-3">
          <Avatar
            name={row.party.display_name}
            src={row.party.avatar_url}
            size="sm"
          />
          <span>{row.party.display_name}</span>
        </span>
      ),
    },
    {
      key: "role",
      header: "Relationship",
      accessor: (row) => row.role.replaceAll("_", " "),
    },
    {
      key: "status",
      header: "Status",
      accessor: (row) => (
        <StatusBadge tone={row.status === "active" ? "success" : "neutral"}>
          {row.status}
        </StatusBadge>
      ),
    },
  ];
  if (workspace.isPending) return <p role="status">Loading workspace…</p>;
  if (workspace.isError)
    return (
      <InlineAlert
        tone="danger"
        title="Workspace unavailable"
        action={<Button onClick={() => workspace.refetch()}>Retry</Button>}
      >
        {parseApiError(workspace.error).message}
      </InlineAlert>
    );
  if (!site)
    return (
      <InlineAlert tone="warning" title="Choose a workspace">
        <Link href="/?lobby=1">Select a site to view its places.</Link>
      </InlineAlert>
    );
  if (!canView)
    return (
      <InlineAlert tone="warning" title="Place access required">
        You do not have permission to view this place.
      </InlineAlert>
    );
  if (place.isPending) return <p role="status">Loading place…</p>;
  if (place.isError)
    return (
      <InlineAlert
        tone="danger"
        title="Place unavailable"
        action={<Button onClick={() => place.refetch()}>Retry</Button>}
      >
        {parseApiError(place.error).message}
      </InlineAlert>
    );
  if (!currentPlace)
    return (
      <InlineAlert tone="warning" title="Place unavailable">
        This place does not belong to the selected workspace.
      </InlineAlert>
    );
  const ancestors = [...currentPlace.ancestors].reverse();
  return (
    <main className="space-y-5 pb-10">
      <PageHeader
        title={currentPlace.name}
        description={`${placeKinds[currentPlace.kind]} · ${site.name}`}
        breadcrumbs={
          <Breadcrumbs
            className="mb-4"
            items={[
              { label: "Overview", href: "/admin" },
              { label: "Places", href: "/admin/places" },
              ...ancestors.map((ancestor) => ({
                label: ancestor.name,
                href: `/admin/places/${ancestor.id}`,
              })),
              { label: currentPlace.name },
            ]}
          />
        }
        primaryAction={
          canAssign ? (
            <Button onClick={() => setAssignOpen(true)}>
              <UserPlus className="h-4 w-4" aria-hidden />
              {assignmentCopy.action}
            </Button>
          ) : undefined
        }
        metadata={
          <StatusBadge tone={currentPlace.is_active ? "success" : "neutral"}>
            {currentPlace.is_active ? "Active" : "Archived"}
          </StatusBadge>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Place details</CardTitle>
          <CardDescription>Location and description</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-[var(--vms-ink-muted)]">Within</dt>
              <dd className="mt-1 font-medium">
                {ancestors.length ? (
                  <Link
                    href={`/admin/places/${ancestors.at(-1)!.id}`}
                    className="underline-offset-4 hover:underline"
                  >
                    {ancestors.map((ancestor) => ancestor.name).join(" / ")}
                  </Link>
                ) : (
                  site.name
                )}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--vms-ink-muted)]">
                Structure / category
              </dt>
              <dd className="mt-1 font-medium">
                {placeKinds[currentPlace.kind]}
                {currentPlace.building_type
                  ? ` · ${currentPlace.building_type.replaceAll("_", " ")}`
                  : ""}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--vms-ink-muted)]">Address</dt>
              <dd className="mt-1">
                {currentPlace.address || "No address recorded"}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--vms-ink-muted)]">Description</dt>
              <dd className="mt-1">
                {currentPlace.description || "No description recorded"}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Photos</CardTitle>
          <CardDescription>
            Images for {currentPlace.name}. The cover is used in directories
            and public listings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AttachmentManager
            entityType="place"
            entityId={currentPlace.id}
            category="gallery"
            variant="gallery"
            title="Place gallery"
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Residents &amp; relationships</CardTitle>
          <CardDescription>
            People assigned to {currentPlace.name}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allowed("place_relationships.list") ? (
            <DataTable
              data={relationships.data?.items ?? []}
              columns={columns}
              tableLabel="Place relationships"
              isLoading={relationships.isPending}
              errorMessage={
                relationships.isError
                  ? parseApiError(relationships.error).message
                  : null
              }
              onRetry={() => relationships.refetch()}
              emptyMessage="No people have been assigned to this place."
            />
          ) : (
            <p className="text-sm text-[var(--vms-ink-muted)]">
              Your role cannot list this place’s relationships.
            </p>
          )}
        </CardContent>
      </Card>
      {!!currentPlace.children?.length && (
        <Card>
          <CardHeader>
            <CardTitle>Places within {currentPlace.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-[var(--vms-line)]">
              {currentPlace.children.map((child) => (
                <li key={child.id}>
                  <Link
                    className="block py-3 text-sm font-semibold hover:underline"
                    href={`/admin/places/${child.id}`}
                  >
                    {child.name}
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
      <PlaceAssignmentModal
        key={`${placeId}:${assignOpen}`}
        open={assignOpen}
        siteId={site.id}
        places={[currentPlace]}
        defaultPlaceId={placeId}
        closedPlaceName={currentPlace.name}
        useCase={useCase}
        contextKey={contextKey}
        onClose={() => setAssignOpen(false)}
        onSaved={() => {
          setAssignOpen(false);
          void queryClient.invalidateQueries({
            queryKey: ["place-relationships", contextKey, placeId],
          });
          void queryClient.invalidateQueries({
            queryKey: ["residential", contextKey],
          });
        }}
      />
    </main>
  );
}
