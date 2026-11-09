import PropertiesWorkspace from "@/features/properties/PropertiesWorkspace";

export default function NewOrganizationPropertyPage({
  searchParams,
}: {
  searchParams: { parent?: string };
}) {
  return (
    <PropertiesWorkspace
      basePath="/organization/properties"
      route={{ action: "new", parentId: searchParams.parent }}
    />
  );
}
