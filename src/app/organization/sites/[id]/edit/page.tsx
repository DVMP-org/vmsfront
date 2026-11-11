import { OrganizationSiteEdit } from "@/features/organization-workspace/components/OrganizationSiteEdit";

export default function EditOrganizationSitePage({
  params,
}: {
  params: { id: string };
}) {
  return <OrganizationSiteEdit siteId={params.id} />;
}
