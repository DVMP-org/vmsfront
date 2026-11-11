import { PlaceDetailsPage } from "@/features/places/PlaceDetailsPage";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const routeParams = await params;
  return <PlaceDetailsPage key={routeParams.id} placeId={routeParams.id} />;
}
