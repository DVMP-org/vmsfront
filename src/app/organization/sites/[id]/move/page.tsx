import { OrganizationSiteMove } from "@/features/organization-workspace/components/OrganizationSiteMove";

export default async function MoveOrganizationSitePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const routeParams = await params;
  return <OrganizationSiteMove siteId={routeParams.id} />;
}
