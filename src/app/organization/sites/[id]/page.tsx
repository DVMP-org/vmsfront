import { OrganizationSiteDetail } from "@/features/organization-workspace/components/OrganizationSiteDetail";

export default async function OrganizationSitePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const routeParams = await params;
  return <OrganizationSiteDetail siteId={routeParams.id} />;
}
