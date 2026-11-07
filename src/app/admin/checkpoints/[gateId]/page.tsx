import { CheckpointConsole } from "@/features/checkpoints/CheckpointPages";
export default function Page({ params }: { params: { gateId: string } }) {
  return <CheckpointConsole gateId={params.gateId} />;
}
