import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types";

export interface EmailTemplateSummary {
  name: string;
  label: string;
  subject: string | null;
  has_override: boolean;
  updated_at: string | null;
}

export interface EmailTemplateDetail extends EmailTemplateSummary {
  default_html_body: string;
  html_body: string;
}

export interface EmailTemplatePayload {
  subject: string | null;
  html_body: string;
}

const base = (slug: string) => `/organizations/${slug}/email-templates`;

export const emailTemplatesApi = {
  list: async (slug: string) => {
    const response = await apiClient.get<ApiResponse<EmailTemplateSummary[]>>(
      base(slug),
    );
    return response.data;
  },
  get: async (slug: string, name: string) => {
    const response = await apiClient.get<ApiResponse<EmailTemplateDetail>>(
      `${base(slug)}/${encodeURIComponent(name)}`,
    );
    return response.data;
  },
  save: async (slug: string, name: string, payload: EmailTemplatePayload) => {
    const response = await apiClient.put<ApiResponse<EmailTemplateDetail>>(
      `${base(slug)}/${encodeURIComponent(name)}`,
      payload,
    );
    return response.data;
  },
  reset: async (slug: string, name: string) => {
    await apiClient.delete(`${base(slug)}/${encodeURIComponent(name)}`);
  },
};
