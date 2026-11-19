"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { parseApiError } from "@/lib/error-utils";

import { fileApi } from "./api";
import type {
    AttachmentCategory,
    AttachmentEntityType,
    UploadAttachmentOptions,
} from "./types";

export const fileKeys = {
    all: ["files"] as const,
    list: (
        entityType: AttachmentEntityType,
        entityId: string,
        category?: AttachmentCategory,
    ) => ["files", entityType, entityId, category ?? "all"] as const,
    summaries: (entityType: AttachmentEntityType, ids: string[]) =>
        ["files", "summaries", entityType, ids.join(",")] as const,
};

export function useAttachments(
    entityType: AttachmentEntityType,
    entityId: string | null | undefined,
    category?: AttachmentCategory,
) {
    return useQuery({
        queryKey: fileKeys.list(entityType, entityId ?? "unknown", category),
        queryFn: () => fileApi.list(entityType, entityId as string, category),
        enabled: Boolean(entityId),
        staleTime: 20_000,
    });
}

export function useAttachmentSummaries(
    entityType: AttachmentEntityType,
    entityIds: string[],
) {
    return useQuery({
        queryKey: fileKeys.summaries(entityType, entityIds),
        queryFn: () => fileApi.summaries(entityType, entityIds),
        enabled: entityIds.length > 0,
        staleTime: 30_000,
    });
}

function useInvalidate(entityType: AttachmentEntityType, entityId: string) {
    const queryClient = useQueryClient();
    return () =>
        Promise.all([
            queryClient.invalidateQueries({
                queryKey: ["files", entityType, entityId],
            }),
            queryClient.invalidateQueries({
                queryKey: ["files", "summaries", entityType],
            }),
        ]);
}

export function useUploadAttachment(
    entityType: AttachmentEntityType,
    entityId: string,
) {
    const invalidate = useInvalidate(entityType, entityId);
    return useMutation({
        mutationFn: ({
            file,
            options,
        }: {
            file: File;
            options?: UploadAttachmentOptions & {
                onProgress?: (percent: number) => void;
            };
        }) => fileApi.upload(entityType, entityId, file, options),
        onSuccess: async () => {
            await invalidate();
        },
        onError: (error) => {
            toast.error(parseApiError(error).message);
        },
    });
}

export function useReorderAttachments(
    entityType: AttachmentEntityType,
    entityId: string,
) {
    const invalidate = useInvalidate(entityType, entityId);
    return useMutation({
        mutationFn: ({
            attachmentIds,
            category,
        }: {
            attachmentIds: string[];
            category?: AttachmentCategory;
        }) => fileApi.reorder(entityType, entityId, attachmentIds, category),
        onSuccess: invalidate,
        onError: (error) => toast.error(parseApiError(error).message),
    });
}

export function useSetPrimaryAttachment(
    entityType: AttachmentEntityType,
    entityId: string,
) {
    const invalidate = useInvalidate(entityType, entityId);
    return useMutation({
        mutationFn: (attachmentId: string) =>
            fileApi.setPrimary(entityType, entityId, attachmentId),
        onSuccess: invalidate,
        onError: (error) => toast.error(parseApiError(error).message),
    });
}

export function useRemoveAttachment(
    entityType: AttachmentEntityType,
    entityId: string,
) {
    const invalidate = useInvalidate(entityType, entityId);
    return useMutation({
        mutationFn: (attachmentId: string) =>
            fileApi.remove(entityType, entityId, attachmentId),
        onSuccess: invalidate,
        onError: (error) => toast.error(parseApiError(error).message),
    });
}
