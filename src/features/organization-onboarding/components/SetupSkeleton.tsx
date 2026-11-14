import { Header } from "@/components/layout/Header";
import { Skeleton } from "@/components/ui/Skeleton";

const FIELD_ROWS = 3;
const CAPABILITY_ROWS = 3;

/**
 * Loading state shaped like the onboarding shell: progress rail, form card and
 * an explanation column. Keeping the silhouette means the real content does not
 * jump when the data arrives.
 */
export function SetupSkeleton({
    label = "Loading setup step",
}: {
    label?: string;
}) {
    return (
        <div className="min-h-screen bg-[var(--vms-canvas)] text-[var(--vms-ink)]">
            <Header type="select" />
            <main
                role="status"
                aria-busy="true"
                aria-live="polite"
                className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12"
            >
                <span className="sr-only">{label}</span>

                <Skeleton className="h-4 w-32" />

                <div className="mt-7 space-y-3">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-9 w-[24rem] max-w-full" />
                    <Skeleton className="h-3.5 w-full max-w-xl" />
                </div>

                <div
                    aria-hidden="true"
                    className="mt-7 grid gap-1 rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-1.5 sm:grid-cols-3"
                >
                    {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="flex items-center gap-2.5 px-3 py-2.5">
                            <Skeleton className="h-7 w-7 rounded-full" />
                            <div className="space-y-1.5">
                                <Skeleton className="h-3 w-24" />
                                <Skeleton className="h-2.5 w-14" />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-6 grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="min-w-0 space-y-5">
                        <div className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-5 sm:p-7">
                            <div className="flex items-start gap-3 border-b border-[var(--vms-line)] pb-5">
                                <Skeleton className="h-10 w-10 rounded-[var(--vms-radius-control)]" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-40" />
                                    <Skeleton className="h-3 w-full max-w-sm" />
                                </div>
                            </div>
                            <div className="mt-5 space-y-5">
                                {Array.from({ length: FIELD_ROWS }).map((_, index) => (
                                    <div key={index} className="space-y-2">
                                        <Skeleton className="h-3 w-28" />
                                        <Skeleton className="h-11 w-full" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-5 sm:p-7">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between gap-3">
                                    <Skeleton className="h-4 w-36" />
                                    <Skeleton className="h-3 w-20" />
                                </div>
                                {Array.from({ length: CAPABILITY_ROWS }).map((_, index) => (
                                    <div key={index} className="space-y-2">
                                        <Skeleton className="h-3 w-24" />
                                        <div className="flex flex-wrap gap-2">
                                            <Skeleton className="h-6 w-32 rounded-full" />
                                            <Skeleton className="h-6 w-24 rounded-full" />
                                            <Skeleton className="h-6 w-28 rounded-full" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div aria-hidden="true" className="hidden space-y-4 xl:block">
                        <div className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-5">
                            <Skeleton className="h-4 w-32" />
                            <div className="mt-4 space-y-4">
                                {Array.from({ length: 3 }).map((_, index) => (
                                    <div key={index} className="flex gap-3">
                                        <Skeleton className="h-6 w-6 rounded-full" />
                                        <div className="flex-1 space-y-1.5">
                                            <Skeleton className="h-3 w-24" />
                                            <Skeleton className="h-2.5 w-full" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-5">
                            <Skeleton className="h-3 w-full" />
                            <Skeleton className="mt-2 h-3 w-2/3" />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
