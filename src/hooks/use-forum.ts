"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { residentService } from "@/services/resident-service";
import {
  ForumCategory,
  ForumCategoryPayload,
  ForumCategoryUpdatePayload,
  ForumTopic,
  ForumTopicCreatePayload,
  ForumTopicUpdatePayload,
  ForumPost,
  ForumPostCreatePayload,
  ForumPostUpdatePayload,
  PaginatedResponse,
} from "@/types";
import { toast } from "sonner";

export function useForumTopics(
  residencyId: string | null,
  params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    filters?: string;
    sort?: string;
  }
) {
  return useQuery<PaginatedResponse<ForumTopic>>({
    queryKey: [
      "forum",
      "topics",
      residencyId,
      params
    ],
    queryFn: async () => {
      if (!residencyId) throw new Error("Residency ID is required");
      const response = await residentService.getForumTopics(residencyId, {
        page: params?.page,
        pageSize: params?.pageSize,
        search: params?.search,
        filters: params?.filters,
        sort: params?.sort,
      });
      return response.data;
    },
    enabled: !!residencyId,
    // @ts-expect-error 
    keepPreviousData: true,
  });
}

export function useForumTopic(
  residencyId: string | null,
  topicId: string | null
) {
  return useQuery<ForumTopic>({
    queryKey: ["forum", "topic", residencyId, topicId],
    queryFn: async () => {
      if (!residencyId || !topicId) throw new Error("IDs are required");
      const response = await residentService.getForumTopic(residencyId, topicId);
      return response.data;
    },
    enabled: !!residencyId && !!topicId,
  });
}

export function useForumCategory(
  residencyId: string | null,
  categoryId: string | null
) {
  return useQuery<ForumCategory>({
    queryKey: ["forum", "category", residencyId, categoryId],
    queryFn: async () => {
      if (!residencyId || !categoryId) throw new Error("IDs are required");
      const response = await residentService.getForumCategory(
        residencyId,
        categoryId
      );
      return response.data;
    },
    enabled: !!residencyId && !!categoryId,
  });
}

export function useForumCategoriesList(
  residencyId: string | null,
  params: {
    page: number;
    pageSize: number;
    search?: string;
    filters?: string;
    sort?: string;
  }
) {
  return useQuery<PaginatedResponse<ForumCategory>>({
    queryKey: ["forum", "categories", residencyId, params],
    queryFn: async () => {
      if (!residencyId) throw new Error("Residency ID is required");
      const response = await residentService.getForumCategories(residencyId, {
        page: params.page,
        pageSize: params.pageSize,
        search: params.search,
        filters: params.filters,
        sort: params.sort,
      });
      return response.data;
    },
    enabled: !!residencyId,
    // @ts-expect-error 
    keepPreviousData: true,
  });
}

export function useForumPosts(
  residencyId: string | null,
  topicId: string | null,
  params: {
    page: number;
    pageSize: number;
    search?: string;
    filters?: string;
    sort?: string;
  }
) {
  return useQuery<PaginatedResponse<ForumPost>>({
    queryKey: ["forum", "posts", residencyId, topicId, params],
    queryFn: async () => {
      if (!residencyId || !topicId) throw new Error("IDs are required");
      const response = await residentService.getForumPosts(
        residencyId,
        topicId,
        {
          page: params.page,
          pageSize: params.pageSize,
          search: params.search,
          filters: params.filters,
          sort: params.sort,
        }
      );
      return response.data;
    },
    enabled: !!residencyId && !!topicId,
    // @ts-expect-error
    keepPreviousData: true,
  });
}

export function useCreateForumCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ForumCategoryPayload) =>
      residentService.createForumCategory(data),
    onSuccess: (response, variables) => {
      toast.success("Category created successfully.");
      queryClient.invalidateQueries({
        queryKey: ["forum", "topics", variables.residency_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["forum", "categories", variables.residency_id],
      });
      return response;
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.detail || "Failed to create forum category."
      );
    },
  });
}

export function useUpdateForumCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: {
      residencyId: string;
      categoryId: string;
      data: ForumCategoryUpdatePayload;
    }) =>
      residentService.updateForumCategory(
        variables.residencyId,
        variables.categoryId,
        variables.data
      ),
    onSuccess: (_, variables) => {
      toast.success("Category updated.");
      queryClient.invalidateQueries({
        queryKey: ["forum", "topics", variables.residencyId],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "forum",
          "category",
          variables.residencyId,
          variables.categoryId,
        ],
      });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.detail || "Failed to update forum category."
      );
    },
  });
}

export function useDeleteForumCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: { residencyId: string; categoryId: string }) =>
      residentService.deleteForumCategory(
        variables.residencyId,
        variables.categoryId
      ),
    onSuccess: (_, variables) => {
      toast.success("Category deleted.");
      queryClient.invalidateQueries({
        queryKey: ["forum", "topics", variables.residencyId],
      });
      queryClient.invalidateQueries({
        queryKey: ["forum", "category", variables.residencyId],
      });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.detail || "Failed to delete forum category."
      );
    },
  });
}

export function useCreateForumTopic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ForumTopicCreatePayload) =>
      residentService.createForumTopic(data),
    onSuccess: (response, variables) => {
      toast.success("Topic created!");
      queryClient.invalidateQueries({
        queryKey: ["forum", "topics", variables.residency_id],
      });
      return response;
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Failed to create topic.");
    },
  });
}

export function useUpdateForumTopic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: {
      residencyId: string;
      topicId: string;
      data: ForumTopicUpdatePayload;
    }) =>
      residentService.updateForumTopic(
        variables.residencyId,
        variables.topicId,
        variables.data
      ),
    onSuccess: (_, variables) => {
      toast.success("Topic updated.");
      queryClient.invalidateQueries({
        queryKey: ["forum", "topics", variables.residencyId],
      });
      queryClient.invalidateQueries({
        queryKey: ["forum", "topic", variables.residencyId, variables.topicId],
      });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Failed to update topic.");
    },
  });
}

export function useDeleteForumTopic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: { residencyId: string; topicId: string }) =>
      residentService.deleteForumTopic(
        variables.residencyId,
        variables.topicId
      ),
    onSuccess: (_, variables) => {
      toast.success("Topic deleted.");
      queryClient.invalidateQueries({
        queryKey: ["forum", "topics", variables.residencyId],
      });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Failed to delete topic.");
    },
  });
}

export function useCreateForumPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: {
      residencyId: string;
      data: ForumPostCreatePayload;
    }) => residentService.createForumPost(variables.residencyId, variables.data),
    onSuccess: (response, variables) => {
      toast.success("Reply posted!");
      queryClient.invalidateQueries({
        queryKey: ["forum", "posts", variables.residencyId, variables.data.topic_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["forum", "topic", variables.residencyId, variables.data.topic_id],
      });
      return response;
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Failed to post reply.");
    },
  });
}

export function useUpdateForumPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: {
      residencyId: string;
      topicId: string;
      postId: string;
      data: ForumPostUpdatePayload;
    }) =>
      residentService.updateForumPost(
        variables.residencyId,
        variables.topicId,
        variables.postId,
        variables.data
      ),
    onSuccess: (_, variables) => {
      toast.success("Post updated.");
      queryClient.invalidateQueries({
        queryKey: ["forum", "posts", variables.residencyId, variables.topicId],
      });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Failed to update post.");
    },
  });
}
