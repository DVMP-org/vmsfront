import PropertiesWorkspace from "@/features/properties/PropertiesWorkspace";
export default function Page({
  searchParams,
}: {
  searchParams: { parent?: string; setup?: string };
}) {
  return (
    <PropertiesWorkspace
      route={{
        action: "new",
        parentId: searchParams.parent,
        setup: searchParams.setup === "first-place" ? "first-place" : undefined,
      }}
    />
  );
}
