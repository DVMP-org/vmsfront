"use client";

import { useParams } from "next/navigation";

import { GuestDetailsScreen } from "@/features/hospitality/components/GuestDetailsScreen";

/**
 * One guest at their own address, so the desk can link a returning guest to a
 * colleague instead of describing how to find them in the register.
 */
export default function HospitalityGuestDetailPage() {
    const params = useParams<{ guestId: string }>();
    const guestId = typeof params.guestId === "string" ? params.guestId : "";

    if (!guestId) {
        return null;
    }

    return <GuestDetailsScreen guestId={guestId} />;
}
