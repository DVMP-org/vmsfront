import { redirect } from "next/navigation";

/**
 * Assigning now happens in a drawer on the definition screen. Keep the old deep
 * link working by sending it back to the record it belongs to.
 */
export default function Page({ params }: { params: { id: string } }) {
  redirect(`/admin/charges/definitions/${params.id}`);
}
