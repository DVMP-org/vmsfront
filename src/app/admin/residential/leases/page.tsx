import { LeasesDirectory } from "@/features/leases/components/LeasesDirectory";

/**
 * Residential agreements are leases too.
 *
 * This route used to render a second, relationship-derived lease screen that
 * could not show a charge plan, a term or a deposit. It now renders the one
 * lease register, so a residential tenancy and a commercial lease are the same
 * entity viewed from the same place.
 */
export default function ResidentialLeasesPage() {
  return <LeasesDirectory />;
}
