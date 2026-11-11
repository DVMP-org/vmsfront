import { OrganizationSiteMove } from "@/features/organization-workspace/components/OrganizationSiteMove";

export default function MoveOrganizationSitePage({
  params,
}: {
  params: { id: string };
}) {
  return <OrganizationSiteMove siteId={params.id} />;
}
