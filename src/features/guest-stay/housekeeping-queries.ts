"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { parseApiError } from "@/lib/error-utils";
import type { GuestHousekeepingRequest } from "@/features/hospitality/contracts";
import { guestStayApi } from "./api";
import { guestStayKeys } from "./queries";

/**
 * The guest's own room housekeeping controls.
 *
 * A request is state, not a message: "service needed" and "no service needed"
 * are the two things the guest controls, and the same state is what the desk
 * sees on the rooms register. The room cache is refreshed too, so a request
 * raised here shows up for housekeeping without a reload.
 */
export function useGuestStayHousekeeping(stayId: string, enabled = true) {
    return useQuery({
        queryKey: guestStayKeys.housekeeping(stayId),
        queryFn: () => guestStayApi.housekeeping(stayId),
        enabled,
        retry: false,
    });
}

export function useSetGuestHousekeeping(stayId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (status: GuestHousekeepingRequest) =>
            guestStayApi.setHousekeeping(stayId, status),
        onSuccess: async (state) => {
            toast.success(
                state.status === "dirty"
                    ? "Housekeeping has been notified"
                    : "We told housekeeping you do not need service",
            );
            queryClient.setQueryData(guestStayKeys.housekeeping(stayId), state);
            await queryClient.invalidateQueries({ queryKey: ["hospitality", "rooms"] });
            await queryClient.invalidateQueries({
                queryKey: ["hospitality-housekeeping-room"],
            });
        },
        onError: (error) => {
            toast.error(parseApiError(error).message);
        },
    });
}
