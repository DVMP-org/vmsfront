import { OrganizationSiteDetail } from "@/features/organization-workspace/components/OrganizationSiteDetail";

export default function OrganizationSitePage({
  params,
}: {
  params: { id: string };
}) {
  return <OrganizationSiteDetail siteId={params.id} />;
}
