import { queryClient } from "@/lib/query-client";
import { mailerService } from "@/services/mailer-service";
import { MailerSettings, UpdateMailerSettingsRequest } from "@/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

export function useMailerSettings() {
  return useQuery<MailerSettings>({
    queryKey: ["mailer-settings"],
    queryFn: async () => {
      const response = await mailerService.getMailerSettings();
      return response.data;
    },
  });
}

export function useUpdateMailerSettings() {
  return useMutation({
    mutationFn: async (data: UpdateMailerSettingsRequest) => {
      return mailerService.updateMailerSettings(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mailer-settings"] });
      toast.success("Mailer settings updated successfully");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to update mailer settings");
    },
  });
}
