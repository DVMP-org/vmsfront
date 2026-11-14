import { PublicBookingForm } from "@/features/bookings/components/PublicBookingForm";

/**
 * A Site's public booking page, served on the organization's own subdomain.
 *
 * The Site is identified by slug and resolved inside whichever organization the
 * host belongs to, so the same slug at another organization is a different page
 * and nothing here has to think about tenancy.
 */
export default async function PublicBookingPage({
  params,
}: {
  params: Promise<{ siteSlug: string }>;
}) {
  const { siteSlug } = await params;
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <PublicBookingForm siteSlug={siteSlug} />
    </main>
  );
}
