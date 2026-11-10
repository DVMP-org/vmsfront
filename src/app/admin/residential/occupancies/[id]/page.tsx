import { ResidentProfile } from "@/features/residential/ResidentProfile";

export default function Page({ params }: { params: { id: string } }) {
  return <ResidentProfile relationshipId={params.id} />;
}
