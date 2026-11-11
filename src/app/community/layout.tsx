import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { RouteGuard } from "@/components/auth/RouteGuard";
export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RouteGuard>
      <div className="min-h-screen bg-[var(--vms-canvas)] text-[var(--vms-ink)]">
        <Header type="select" />
        <main className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-6">
          <Link
            href="/?lobby=1"
            className="inline-flex min-h-11 items-center text-sm text-[var(--vms-ink-muted)] hover:underline"
          >
            Back to workspaces
          </Link>
          {children}
        </main>
      </div>
    </RouteGuard>
  );
}
