import { OrganizationSiteEdit } from "@/features/organization-workspace/components/OrganizationSiteEdit";

export default async function EditOrganizationSitePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const routeParams = await params;
  return <OrganizationSiteEdit siteId={routeParams.id} />;
}
