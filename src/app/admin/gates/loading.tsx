import { PageSkeleton } from "@/components/ui/Skeleton";

/**
 * Route-level fallback for the admin gates page. It renders inside the admin
 * shell, so it only fills the content area and keeps the shell geometry.
 */
export default function Loading() {
    return <PageSkeleton label="Loading gates" />;
}