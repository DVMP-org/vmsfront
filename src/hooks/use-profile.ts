"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { residentService } from "@/services/resident-service";
import { adminService } from "@/services/admin-service";
import { useAuthStore } from "@/store/auth-store";
import type {
  Resident,
  Admin,
  ResidentProfileUpdatePayload,
  AdminProfileUpdatePayload,
} from "@/types";

export function useResidentProfileDetails() {
  return useQuery<Resident>({
    queryKey: ["profile", "resident"],
    queryFn: async () => {
      const response = await residentService.getResident();
      return response.data;
    },
  });
}

export function useUpdateResidentProfile() {
  const queryClient = useQueryClient();
  const { updateUser } = useAuthStore();

  return useMutation({
    mutationFn: (data: ResidentProfileUpdatePayload) =>
      residentService.updateResidentProfile(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["profile", "resident"] });
      const nextUser = response.data?.user;
      if (nextUser) {
        updateUser(nextUser);
      }
      toast.success("Profile updated successfully");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.detail ??
          "Unable to update resident profile right now."
      );
    },
  });
}

export function useAdminProfileDetails() {
  return useQuery<Admin>({
    queryKey: ["profile", "admin"],
    queryFn: async () => {
      const response = await adminService.getAdminProfile();
      return response.data;
    },
  });
}

export function useUpdateAdminProfile() {
  const queryClient = useQueryClient();
  const { updateUser } = useAuthStore();

  return useMutation({
    mutationFn: (data: AdminProfileUpdatePayload) =>
      adminService.updateAdminProfile(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["profile", "admin"] });
      if (response.data?.user) {
        updateUser(response.data.user);
      }
      toast.success("Admin profile updated.");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.detail ??
          "Unable to update admin profile right now."
      );
    },
  });
}
