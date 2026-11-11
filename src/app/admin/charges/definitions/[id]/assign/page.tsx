import { redirect } from "next/navigation";

/**
 * Assigning now happens in a drawer on the definition screen. Keep the old deep
 * link working by sending it back to the record it belongs to.
 */
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const routeParams = await params;
  redirect(`/admin/charges/definitions/${routeParams.id}`);
}
