import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types";

export interface CurrentCharge {
  id: string;
  target_place_id: string;
  due_date: string;
  amount: string;
  amount_paid: string;
  balance: string;
  currency: string;
  status: "scheduled" | "paid" | "void";
  charge_definition: {
    id: string;
    name: string;
    description: string | null;
    recurrence: string;
  };
  target_place: {
    id: string;
    name: string;
    kind: string;
  };
}

export interface ChargeCheckout {
  access_code: string;
  reference: string;
  authorization_url: string;
  status: string;
}

export const myChargesApi = {
  list: async () =>
    (
      await apiClient.get<ApiResponse<CurrentCharge[]>>("/charges")
    ).data,
  pay: async (scheduleId: string) =>
    (
      await apiClient.post<ApiResponse<ChargeCheckout>>(
        `/charges/schedules/${scheduleId}/pay`,
      )
    ).data,
};
