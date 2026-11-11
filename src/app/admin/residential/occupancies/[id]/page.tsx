import { ResidentProfile } from "@/features/residential/ResidentProfile";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const routeParams = await params;
  return <ResidentProfile relationshipId={routeParams.id} />;
}
