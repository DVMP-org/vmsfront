import PropertiesWorkspace from "@/features/properties/PropertiesWorkspace";

export default async function NewOrganizationPropertyPage({
  searchParams,
}: {
  searchParams: Promise<{ parent?: string }>;
}) {
  const query = await searchParams;
  return (
    <PropertiesWorkspace
      basePath="/organization/properties"
      route={{ action: "new", parentId: query.parent }}
    />
  );
}
