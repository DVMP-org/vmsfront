import { MovementJourneyPage } from "@/features/place-workspace/MovementJourneyPage";

export default async function WorkspaceMovementVisitor({
  params,
}: {
  params: Promise<{ visitorKey: string }>;
}) {
  const routeParams = await params;
  return (
    <MovementJourneyPage
      visitorKey={decodeURIComponent(routeParams.visitorKey)}
    />
  );
}
