import { AccessEventDetail } from "@/features/passages/AccessEventDetail";

export default function AccessEventPage({
  params,
}: {
  params: { eventId: string };
}) {
  return <AccessEventDetail eventId={params.eventId} />;
}
