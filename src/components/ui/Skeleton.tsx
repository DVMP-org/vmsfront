import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  "aria-hidden": ariaHidden = true,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden={ariaHidden}
      className={cn(
        "animate-pulse rounded-[var(--vms-radius-control)] bg-[var(--vms-surface-subtle)] motion-reduce:animate-none",
        className,
      )}
      {...props}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="space-y-4 rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-5">
      <Skeleton className="h-5 xs:h-6 w-3/4" />
      <Skeleton className="h-3 xs:h-4 w-full" />
      <Skeleton className="h-3 xs:h-4 w-2/3" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" role="status">
      <span className="sr-only">Loading table data</span>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3 xs:h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Dark top bar that mirrors the shared `Header`. Using it in loading states
 * keeps the chrome still while a route resolves.
 */
export function AppBarSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="sticky top-0 z-40 w-full border-b border-white/10 bg-[var(--vms-ink)]"
    >
      <div className="flex h-14 items-center justify-between gap-3 px-3 sm:px-5">
        <div className="flex items-center gap-2.5">
          <span className="h-8 w-8 animate-pulse rounded-[var(--vms-radius-control)] bg-white/20 motion-reduce:animate-none" />
          <span className="h-4 w-28 animate-pulse rounded bg-white/20 motion-reduce:animate-none" />
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <span className="h-8 w-28 animate-pulse rounded-full bg-white/15 motion-reduce:animate-none" />
          <span className="h-8 w-20 animate-pulse rounded-full bg-white/15 motion-reduce:animate-none" />
        </div>
        <span className="h-8 w-8 animate-pulse rounded-full bg-white/20 motion-reduce:animate-none" />
      </div>
    </div>
  );
}

/**
 * Page-shaped skeleton that lives *inside* whichever shell is already mounted.
 * It never sets a viewport height, so the sidebar, header and container padding
 * around it keep their geometry.
 */
export function PageSkeleton({ label = "Loading page" }: { label?: string }) {
  return (
    <div role="status" aria-busy="true" aria-label={label} className="w-full">
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-64 max-w-full" />
        <Skeleton className="h-3.5 w-full max-w-xl" />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="space-y-3 rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-4"
          >
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-6 w-24" />
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-5">
          <Skeleton className="h-4 w-40" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-2/3" />
                  <Skeleton className="h-2.5 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-5">
          <Skeleton className="h-4 w-32" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="space-y-1.5">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-2.5 w-2/3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Skeletons for routes that render their own chrome (lobby, plans, place
 * workspace, first-Site setup). The bar keeps the page from jumping when the
 * real header mounts.
 */
export function StandalonePageSkeleton({
  label = "Loading page",
}: {
  label?: string;
}) {
  return (
    <div className="min-h-screen bg-[var(--vms-canvas)] text-[var(--vms-ink)]">
      <AppBarSkeleton />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <PageSkeleton label={label} />
      </main>
    </div>
  );
}

/**
 * First paint before the client providers have hydrated. Styled and neutral:
 * it must not claim a chrome or a page shape it cannot know yet.
 */
export function BootSkeleton({ label = "Loading" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={label}
      className="flex min-h-screen flex-col bg-[var(--vms-canvas)] text-[var(--vms-ink)]"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-md">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="mt-6 h-3.5 w-full" />
          <Skeleton className="mt-2.5 h-3.5 w-4/5" />
          <Skeleton className="mt-8 h-28 w-full rounded-[var(--vms-radius-surface)]" />
        </div>
      </div>
    </div>
  );
}

