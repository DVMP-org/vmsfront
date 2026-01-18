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
  houseId: string | null,
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
      houseId,
      params
    ],
    queryFn: async () => {
      if (!houseId) throw new Error("House ID is required");
      const response = await residentService.getForumTopics(houseId, {
        page: params?.page,
        pageSize: params?.pageSize,
        search: params?.search,
        filters: params?.filters,
        sort: params?.sort,
      });
      return response.data;
    },
    enabled: !!houseId,
    // @ts-expect-error 
    keepPreviousData: true,
  });
}

export function useForumTopic(
  houseId: string | null,
  topicId: string | null
) {
  return useQuery<ForumTopic>({
    queryKey: ["forum", "topic", houseId, topicId],
    queryFn: async () => {
      if (!houseId || !topicId) throw new Error("IDs are required");
      const response = await residentService.getForumTopic(houseId, topicId);
      return response.data;
    },
    enabled: !!houseId && !!topicId,
  });
}

export function useForumCategory(
  houseId: string | null,
  categoryId: string | null
) {
  return useQuery<ForumCategory>({
    queryKey: ["forum", "category", houseId, categoryId],
    queryFn: async () => {
      if (!houseId || !categoryId) throw new Error("IDs are required");
      const response = await residentService.getForumCategory(
        houseId,
        categoryId
      );
      return response.data;
    },
    enabled: !!houseId && !!categoryId,
  });
}

export function useForumCategoriesList(
  houseId: string | null,
  params: {
    page: number;
    pageSize: number;
    search?: string;
    filters?: string;
    sort?: string;
  }
) {
  return useQuery<PaginatedResponse<ForumCategory>>({
    queryKey: ["forum", "categories", houseId, params],
    queryFn: async () => {
      if (!houseId) throw new Error("House ID is required");
      const response = await residentService.getForumCategories(houseId, {
        page: params.page,
        pageSize: params.pageSize,
        search: params.search,
        filters: params.filters,
        sort: params.sort,
      });
      return response.data;
    },
    enabled: !!houseId,
    // @ts-expect-error 
    keepPreviousData: true,
  });
}

export function useForumPosts(
  houseId: string | null,
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
    queryKey: ["forum", "posts", houseId, topicId, params],
    queryFn: async () => {
      if (!houseId || !topicId) throw new Error("IDs are required");
      const response = await residentService.getForumPosts(
        houseId,
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
    enabled: !!houseId && !!topicId,
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
        queryKey: ["forum", "topics", variables.house_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["forum", "categories", variables.house_id],
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
      houseId: string;
      categoryId: string;
      data: ForumCategoryUpdatePayload;
    }) =>
      residentService.updateForumCategory(
        variables.houseId,
        variables.categoryId,
        variables.data
      ),
    onSuccess: (_, variables) => {
      toast.success("Category updated.");
      queryClient.invalidateQueries({
        queryKey: ["forum", "topics", variables.houseId],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "forum",
          "category",
          variables.houseId,
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
    mutationFn: (variables: { houseId: string; categoryId: string }) =>
      residentService.deleteForumCategory(
        variables.houseId,
        variables.categoryId
      ),
    onSuccess: (_, variables) => {
      toast.success("Category deleted.");
      queryClient.invalidateQueries({
        queryKey: ["forum", "topics", variables.houseId],
      });
      queryClient.invalidateQueries({
        queryKey: ["forum", "category", variables.houseId],
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
        queryKey: ["forum", "topics", variables.house_id],
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
      houseId: string;
      topicId: string;
      data: ForumTopicUpdatePayload;
    }) =>
      residentService.updateForumTopic(
        variables.houseId,
        variables.topicId,
        variables.data
      ),
    onSuccess: (_, variables) => {
      toast.success("Topic updated.");
      queryClient.invalidateQueries({
        queryKey: ["forum", "topics", variables.houseId],
      });
      queryClient.invalidateQueries({
        queryKey: ["forum", "topic", variables.houseId, variables.topicId],
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
    mutationFn: (variables: { houseId: string; topicId: string }) =>
      residentService.deleteForumTopic(
        variables.houseId,
        variables.topicId
      ),
    onSuccess: (_, variables) => {
      toast.success("Topic deleted.");
      queryClient.invalidateQueries({
        queryKey: ["forum", "topics", variables.houseId],
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
      houseId: string;
      data: ForumPostCreatePayload;
    }) => residentService.createForumPost(variables.houseId, variables.data),
    onSuccess: (response, variables) => {
      toast.success("Reply posted!");
      queryClient.invalidateQueries({
        queryKey: ["forum", "posts", variables.houseId, variables.data.topic_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["forum", "topic", variables.houseId, variables.data.topic_id],
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
      houseId: string;
      topicId: string;
      postId: string;
      data: ForumPostUpdatePayload;
    }) =>
      residentService.updateForumPost(
        variables.houseId,
        variables.topicId,
        variables.postId,
        variables.data
      ),
    onSuccess: (_, variables) => {
      toast.success("Post updated.");
      queryClient.invalidateQueries({
        queryKey: ["forum", "posts", variables.houseId, variables.topicId],
      });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Failed to update post.");
    },
  });
}
