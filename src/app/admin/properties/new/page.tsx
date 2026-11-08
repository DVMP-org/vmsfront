import { redirect } from "next/navigation";

import PropertiesWorkspace from "@/features/properties/PropertiesWorkspace";
export default function Page({
  searchParams,
}: {
  searchParams: { parent?: string; setup?: string };
}) {
  if (searchParams.setup === "first-place") {
    redirect("/setup/first-place");
  }
  return (
    <PropertiesWorkspace
      route={{
        action: "new",
        parentId: searchParams.parent,
      }}
    />
  );
}
