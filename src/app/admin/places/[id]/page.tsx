import { PlaceDetailsPage } from "@/features/places/PlaceDetailsPage";

export default function Page({ params }: { params: { id: string } }) {
  return <PlaceDetailsPage key={params.id} placeId={params.id} />;
}
