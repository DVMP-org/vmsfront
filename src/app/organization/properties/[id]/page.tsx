import PropertiesWorkspace from "@/features/properties/PropertiesWorkspace";

export default function OrganizationPropertyPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <PropertiesWorkspace
      basePath="/organization/properties"
      route={{ id: params.id }}
    />
  );
}
