import { Skeleton } from "@/components/ui/Skeleton";

/** Card silhouette that mirrors `PlanCard` while plans load. */
export function PlanCardSkeleton() {
    return (
        <div
            aria-hidden="true"
            className="flex flex-col rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-5"
        >
            <Skeleton className="h-5 w-32" />
            <Skeleton className="mt-2 h-3 w-full" />
            <Skeleton className="mt-8 h-8 w-24" />
            <div className="mt-6 flex-1 space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4 rounded-full" />
                        <Skeleton className="h-3 flex-1" />
                    </div>
                ))}
            </div>
            <Skeleton className="mt-6 h-10 w-full" />
        </div>
    );
}
