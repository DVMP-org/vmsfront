import { PlaceWorkspacePage } from "@/features/place-workspace/PlaceWorkspacePage";
export default function WorkspaceSection({
  params,
}: {
  params: { section: string };
}) {
  return <PlaceWorkspacePage section={params.section} />;
}
