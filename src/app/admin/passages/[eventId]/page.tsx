import { AccessEventDetail } from "@/features/passages/AccessEventDetail";

export default async function AccessEventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const routeParams = await params;
  return <AccessEventDetail eventId={routeParams.eventId} />;
}
