import { PlaceWorkspacePage } from "@/features/place-workspace/PlaceWorkspacePage";
export default async function WorkspaceSection({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const routeParams = await params;
  return <PlaceWorkspacePage section={routeParams.section} />;
}
