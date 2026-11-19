import { API_URL, apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types";

import type {
    Attachment,
    AttachmentCategory,
    AttachmentEntityType,
    AttachmentList,
    UploadAttachmentOptions,
} from "./types";

/** Make a server-returned path usable as an `img`/link URL. */
export function attachmentUrl(path: string | null | undefined): string | null {
    if (!path) return null;
    if (/^https?:\/\//.test(path)) return path;
    return `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export const fileApi = {
    list: async (
        entityType: AttachmentEntityType,
        entityId: string,
        category?: AttachmentCategory,
    ) => {
        const response = await apiClient.get<ApiResponse<AttachmentList>>(
            `/attachments/${entityType}/${entityId}`,
            { params: category ? { category } : undefined },
        );
        return response.data.items;
    },

    summaries: async (
        entityType: AttachmentEntityType,
        entityIds: string[],
    ): Promise<Record<string, Attachment>> => {
        if (!entityIds.length) return {};
        const response = await apiClient.get<
            ApiResponse<{ items: { entity_id: string; attachment: Attachment }[] }>
        >("/attachments/summaries/preferred", {
            params: { entity_type: entityType, entity_ids: entityIds },
        });
        return Object.fromEntries(
            response.data.items.map((row) => [row.entity_id, row.attachment]),
        );
    },

    upload: async (
        entityType: AttachmentEntityType,
        entityId: string,
        file: File,
        options: UploadAttachmentOptions & {
            onProgress?: (percent: number) => void;
        } = {},
    ) => {
        const form = new FormData();
        form.append("file", file);
        form.append("category", options.category ?? "image");
        if (options.caption) form.append("caption", options.caption);
        form.append("is_public", String(Boolean(options.isPublic)));
        form.append("make_primary", String(Boolean(options.makePrimary)));

        const response = await apiClient.post<ApiResponse<Attachment>>(
            `/attachments/${entityType}/${entityId}`,
            form,
            {
                headers: { "Content-Type": "multipart/form-data" },
                onUploadProgress: (event) => {
                    if (!options.onProgress) return;
                    const total = event.total ?? file.size;
                    if (!total) return;
                    options.onProgress(Math.min(100, Math.round((event.loaded / total) * 100)));
                },
            },
        );
        return response.data;
    },

    reorder: async (
        entityType: AttachmentEntityType,
        entityId: string,
        attachmentIds: string[],
        category?: AttachmentCategory,
    ) => {
        const response = await apiClient.put<ApiResponse<AttachmentList>>(
            `/attachments/${entityType}/${entityId}/order`,
            { attachment_ids: attachmentIds, category },
        );
        return response.data.items;
    },

    setPrimary: async (
        entityType: AttachmentEntityType,
        entityId: string,
        attachmentId: string,
    ) =>
        (
            await apiClient.post<ApiResponse<Attachment>>(
                `/attachments/${entityType}/${entityId}/${attachmentId}/primary`,
            )
        ).data,

    remove: async (
        entityType: AttachmentEntityType,
        entityId: string,
        attachmentId: string,
    ) => {
        await apiClient.delete(
            `/attachments/${entityType}/${entityId}/${attachmentId}`,
        );
    },
};
