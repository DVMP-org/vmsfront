import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4 xs:p-6 space-y-3 xs:space-y-4">
      <Skeleton className="h-5 xs:h-6 w-3/4" />
      <Skeleton className="h-3 xs:h-4 w-full" />
      <Skeleton className="h-3 xs:h-4 w-2/3" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2 xs:space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3 xs:space-x-4">
          <Skeleton className="h-10 w-10 xs:h-12 xs:w-12 rounded-full flex-shrink-0" />
          <div className="space-y-1.5 xs:space-y-2 flex-1 min-w-0">
            <Skeleton className="h-3 xs:h-4 w-3/4" />
            <Skeleton className="h-2.5 xs:h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

