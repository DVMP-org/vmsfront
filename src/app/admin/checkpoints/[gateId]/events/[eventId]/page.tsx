import { CheckpointRecord } from "@/features/checkpoints/CheckpointPages";
export default function Page({
  params,
}: {
  params: { gateId: string; eventId: string };
}) {
  return <CheckpointRecord gateId={params.gateId} eventId={params.eventId} />;
}
