import { CheckpointRecord } from "@/features/checkpoints/CheckpointPages";
export default async function Page({
  params,
}: {
  params: Promise<{ gateId: string; eventId: string }>;
}) {
  const routeParams = await params;
  return (
    <CheckpointRecord
      gateId={routeParams.gateId}
      eventId={routeParams.eventId}
    />
  );
}
