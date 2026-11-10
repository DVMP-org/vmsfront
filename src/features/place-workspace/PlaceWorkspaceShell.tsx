"use client";
import { createContext, useContext, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAppStore } from "@/store/app-store";
import { useAuthStore } from "@/store/auth-store";
import { qualifiedPlaceName } from "@/features/workspaces/catalog";
import { parseApiError } from "@/lib/error-utils";
import { placeWorkspaceApi, type PlaceContext } from "./api";
import { PlaceSidebar } from "./PlaceSidebar";
const Context = createContext<PlaceContext | null>(null);
export function usePlaceWorkspace() {
  const context = useContext(Context);
  if (!context) throw new Error("Place workspace context is required");
  return context;
}
export function PlaceWorkspaceShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { placeId } = useParams<{ placeId: string }>();
  const user = useAuthStore((state) => state.user);
  const organization = useAppStore((state) => state.organization);
  const [open, setOpen] = useState(false);
  const query = useQuery({
    queryKey: ["place-workspace", organization?.id, user?.id, placeId],
    queryFn: () => placeWorkspaceApi.context(placeId),
    retry: false,
    staleTime: 0,
  });
  const context = query.data;
  const sidebar = (
    <PlaceSidebar
      placeId={placeId}
      placeName={context ? qualifiedPlaceName(context.place) : undefined}
      context={context}
      onNavigate={() => setOpen(false)}
    />
  );
  return (
    <div className="min-h-screen bg-[var(--vms-canvas)] text-[var(--vms-ink)]">
      <Header
        type="select"
        onMenuClick={() => setOpen(true)}
        sidebarOpen={open}
      />
      <div className="lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
        <aside className="sticky top-14 hidden h-[calc(100dvh-56px)] overflow-y-auto border-r border-[var(--vms-line)] bg-[var(--vms-surface)] lg:block">
          {!open && sidebar}
        </aside>
        <main
          id="place-workspace-content"
          className="min-w-0 px-4 py-5 sm:px-6 lg:px-8 lg:py-7"
        >
          <div className="mx-auto max-w-6xl">
            {query.isPending ? (
              <PlaceContentSkeleton />
            ) : query.isError ? (
              <section
                role="alert"
                className="max-w-xl space-y-4 rounded-xl border border-[var(--vms-danger)] bg-[var(--vms-danger-subtle)] p-5 text-sm"
              >
                <h1 className="text-lg font-semibold">
                  Workspace access unavailable
                </h1>
                <p>{parseApiError(query.error).message}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Button onClick={() => query.refetch()}>Retry</Button>
                  <Button asChild variant="outline">
                    <Link href="/organization/workspaces">
                      All workspaces
                    </Link>
                  </Button>
                </div>
              </section>
            ) : context ? (
              <Context.Provider value={context}>{children}</Context.Provider>
            ) : null}
          </div>
        </main>
      </div>
      <Drawer
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Place workspace"
        side="left"
        className="max-w-[17rem]"
        contentClassName="p-0 overflow-y-auto"
      >
        {sidebar}
      </Drawer>
    </div>
  );
}

/**
 * Content-area skeleton. The shell stays mounted so the sidebar, header and
 * workspace switcher never unmount or resize while Place context resolves.
 */
export function PlaceContentSkeleton() {
  return (
    <div className="space-y-5" role="status" aria-busy="true">
      <span className="sr-only">Loading Place workspace</span>
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <Skeleton className="h-36 w-full rounded-xl" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-44 w-full rounded-xl" />
        <Skeleton className="h-44 w-full rounded-xl" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-52 w-full rounded-xl" />
        <Skeleton className="h-52 w-full rounded-xl" />
      </div>
    </div>
  );
}
