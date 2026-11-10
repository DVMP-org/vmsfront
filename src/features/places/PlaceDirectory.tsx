"use client";
import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { useSiteAccess } from "@/features/context/use-site-access";
import { useAppStore } from "@/store/app-store";
import { parseApiError } from "@/lib/error-utils";
import { placesApi, type Place } from "./api";

export function PlaceDirectory() {
  const { allowed, contextKey, workspace } = useSiteAccess();
  const site = useAppStore((state) => state.selectedProperty);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const list = useQuery({
    queryKey: ["places", contextKey, page, search],
    queryFn: () =>
      placesApi.list({ page, page_size: 20, site_id: site!.id, search }),
    enabled:
      !!site &&
      allowed("places.list") &&
      !workspace.isError &&
      !workspace.isPending,
  });
  const columns: Column<Place>[] = [
    {
      key: "name",
      header: "Place",
      accessor: (place) => (
        <Link
          className="font-semibold hover:underline"
          href={`/admin/places/${place.id}`}
        >
          {place.name}
        </Link>
      ),
    },
    { key: "kind", header: "Type" },
    { key: "address", header: "Address" },
  ];
  if (workspace.isPending) return <p role="status">Loading workspace…</p>;
  if (workspace.isError)
    return <p role="alert">{parseApiError(workspace.error).message}</p>;
  if (!site || !allowed("places.list"))
    return (
      <p role="alert">Select a workspace with permission to list places.</p>
    );
  return (
    <main className="space-y-5">
      <PageHeader
        title="Places"
        description={`Buildings, units, rooms and spaces at ${site.name}.`}
      />
      <DataTable
        data={list.data?.items ?? []}
        columns={columns}
        serverSide
        pageSize={20}
        currentPage={page}
        onPageChange={setPage}
        total={list.data?.total ?? 0}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        isLoading={list.isPending}
        errorMessage={list.isError ? parseApiError(list.error).message : null}
        onRetry={() => list.refetch()}
      />
    </main>
  );
}
