import { PublicBookingEntry } from "@/features/bookings/components/public/PublicBookingEntry";

/**
 * A Site's public booking page, served on the organization's own subdomain.
 *
 * The Site is identified by slug and resolved inside whichever organization the
 * host belongs to, so the same slug at another organization is a different page
 * and nothing here has to think about tenancy.
 *
 * Wider than the old single form because a hotel booking is a comparison of room
 * types, not one column of inputs.
 */
export default async function PublicBookingPage({
  params,
}: {
  params: Promise<{ siteSlug: string }>;
}) {
  const { siteSlug } = await params;
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <PublicBookingEntry siteSlug={siteSlug} />
    </main>
  );
}
