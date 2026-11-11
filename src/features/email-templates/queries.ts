"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { parseApiError } from "@/lib/error-utils";

import {
  emailTemplatesApi,
  type EmailTemplatePayload,
} from "./api";

export const emailTemplateKeys = {
  list: (slug: string) => ["email-templates", slug, "list"] as const,
  detail: (slug: string, name: string | null) =>
    ["email-templates", slug, "detail", name] as const,
};

export function useEmailTemplates(slug?: string | null) {
  return useQuery({
    queryKey: emailTemplateKeys.list(slug ?? "unknown"),
    queryFn: () => emailTemplatesApi.list(slug as string),
    enabled: Boolean(slug),
    staleTime: 30_000,
  });
}

export function useEmailTemplate(slug?: string | null, name?: string | null) {
  return useQuery({
    queryKey: emailTemplateKeys.detail(slug ?? "unknown", name ?? null),
    queryFn: () => emailTemplatesApi.get(slug as string, name as string),
    enabled: Boolean(slug && name),
  });
}

function invalidate(
  queryClient: ReturnType<typeof useQueryClient>,
  slug: string,
) {
  queryClient.invalidateQueries({ queryKey: ["email-templates", slug] });
}

export function useSaveEmailTemplate(slug?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      name,
      payload,
    }: {
      name: string;
      payload: EmailTemplatePayload;
    }) => emailTemplatesApi.save(slug as string, name, payload),
    onSuccess: (template) => {
      if (slug) invalidate(queryClient, slug);
      queryClient.invalidateQueries({
        queryKey: emailTemplateKeys.detail(slug ?? "unknown", template.name),
      });
      toast.success(`${template.label} template saved`);
    },
    onError: (error) => {
      toast.error(parseApiError(error).message);
    },
  });
}

export function useResetEmailTemplate(slug?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name }: { name: string }) =>
      emailTemplatesApi.reset(slug as string, name),
    onSuccess: () => {
      if (slug) invalidate(queryClient, slug);
      toast.success("Template reset to the packaged default");
    },
    onError: (error) => {
      toast.error(parseApiError(error).message);
    },
  });
}
