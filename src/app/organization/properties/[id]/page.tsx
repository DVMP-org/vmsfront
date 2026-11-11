import PropertiesWorkspace from "@/features/properties/PropertiesWorkspace";

export default async function OrganizationPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const routeParams = await params;
  return (
    <PropertiesWorkspace
      basePath="/organization/properties"
      route={{ id: routeParams.id }}
    />
  );
}
