import { MovementJourneyPage } from "@/features/place-workspace/MovementJourneyPage";

export default function WorkspaceMovementVisitor({
  params,
}: {
  params: { visitorKey: string };
}) {
  return (
    <MovementJourneyPage visitorKey={decodeURIComponent(params.visitorKey)} />
  );
}
