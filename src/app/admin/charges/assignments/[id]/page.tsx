import ChargesWorkspace from "@/features/charges/ChargesWorkspace";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const routeParams = await params;
  return <ChargesWorkspace action="assignment" id={routeParams.id} />;
}
