
import { cn } from "@/lib/utils";

interface PageLoaderProps {
  message?: string;
  className?: string;
}

export default function PageLoader({ message, className }: PageLoaderProps) {
  return (
    <div
      className={cn(
        "my-6 flex min-h-32 flex-col items-center justify-center gap-3 px-4 text-center",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span
        className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--vms-line-strong)] border-t-[var(--vms-action)] motion-reduce:animate-none"
        aria-hidden="true"
      />
      <p className="text-sm text-[var(--vms-ink-muted)]">
        {message || "Loading…"}
      </p>
    </div>
  );
}
