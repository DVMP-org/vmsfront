import PropertiesWorkspace from "@/features/properties/PropertiesWorkspace";

export default function MoveOrganizationPropertyPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <PropertiesWorkspace
      basePath="/organization/properties"
      route={{ id: params.id, action: "move" }}
    />
  );
}
