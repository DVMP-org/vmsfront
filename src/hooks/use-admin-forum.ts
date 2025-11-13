"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminService } from "@/services/admin-service";
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

interface AdminForumCategoryParams {
  page?: number;
  pageSize?: number;
  houseId?: string;
  search?: string;
  includeLocked?: boolean;
}

interface AdminForumTopicParams {
  page?: number;
  pageSize?: number;
  houseId?: string;
  categoryId?: string;
  status?: "pinned" | "locked" | "deleted";
  search?: string;
  startDate?: string;
  endDate?: string;
  includeDeleted?: boolean;
}

export function useAdminForumCategories(params: AdminForumCategoryParams) {
  return useQuery<PaginatedResponse<ForumCategory>>({
    queryKey: ["admin", "forum", "categories", params],
    queryFn: async () => {
      const response = await adminService.getForumCategories(params);
      return response.data;
    },
  });
}

export function useAdminForumCategory(categoryId: string | null) {
  return useQuery<ForumCategory>({
    queryKey: ["admin", "forum", "category", categoryId],
    queryFn: async () => {
      if (!categoryId) throw new Error("Category ID is required");
      const response = await adminService.getForumCategory(categoryId);
      return response.data;
    },
    enabled: !!categoryId,
  });
}

export function useAdminForumTopics(
  params: AdminForumTopicParams,
  options?: { enabled?: boolean }
) {
  return useQuery<PaginatedResponse<ForumTopic>>({
    queryKey: ["admin", "forum", "topics", params],
    queryFn: async () => {
      const response = await adminService.getForumTopics(params);
      return response.data;
    },
    enabled: options?.enabled ?? true,
  });
}

export function useAdminForumTopic(topicId: string | null) {
  return useQuery<ForumTopic>({
    queryKey: ["admin", "forum", "topic", topicId],
    queryFn: async () => {
      if (!topicId) throw new Error("Topic ID is required");
      const response = await adminService.getForumTopic(topicId);
      return response.data;
    },
    enabled: !!topicId,
  });
}

export function useAdminForumPosts(
  topicId: string | null,
  params: { page?: number; pageSize?: number }
) {
  return useQuery<PaginatedResponse<ForumPost>>({
    queryKey: ["admin", "forum", "posts", topicId, params],
    queryFn: async () => {
      if (!topicId) throw new Error("Topic ID is required");
      const response = await adminService.getForumPosts(topicId, params);
      return response.data;
    },
    enabled: !!topicId,
  });
}

export function useCreateAdminForumCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ForumCategoryPayload) =>
      adminService.createForumCategory(data),
    onSuccess: () => {
      toast.success("Category created");
      queryClient.invalidateQueries({ queryKey: ["admin", "forum", "categories"] });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.detail || "Failed to create category."
      );
    },
  });
}

export function useUpdateAdminForumCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: {
      categoryId: string;
      data: ForumCategoryUpdatePayload;
    }) =>
      adminService.updateForumCategory(
        variables.categoryId,
        variables.data
      ),
    onSuccess: (_, variables) => {
      toast.success("Category updated");
      queryClient.invalidateQueries({ queryKey: ["admin", "forum", "categories"] });
      queryClient.invalidateQueries({
        queryKey: ["admin", "forum", "category", variables.categoryId],
      });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.detail || "Failed to update category."
      );
    },
  });
}

export function useDeleteAdminForumCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (categoryId: string) =>
      adminService.deleteForumCategory(categoryId),
    onSuccess: () => {
      toast.success("Category deleted");
      queryClient.invalidateQueries({ queryKey: ["admin", "forum", "categories"] });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.detail || "Failed to delete category."
      );
    },
  });
}

export function useCreateAdminForumTopic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ForumTopicCreatePayload) =>
      adminService.createForumTopic(data),
    onSuccess: (response) => {
      toast.success("Topic created");
      queryClient.invalidateQueries({ queryKey: ["admin", "forum", "topics"] });
      if (response?.data?.category_id) {
        queryClient.invalidateQueries({
          queryKey: ["admin", "forum", "categories"],
        });
      }
      return response;
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Failed to create topic.");
    },
  });
}

export function useUpdateAdminForumTopic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: {
      topicId: string;
      data: ForumTopicUpdatePayload;
    }) => adminService.updateForumTopic(variables.topicId, variables.data),
    onSuccess: (_, variables) => {
      toast.success("Topic updated");
      queryClient.invalidateQueries({ queryKey: ["admin", "forum", "topics"] });
      queryClient.invalidateQueries({
        queryKey: ["admin", "forum", "topic", variables.topicId],
      });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Failed to update topic.");
    },
  });
}

export function useDeleteAdminForumTopic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (topicId: string) => adminService.deleteForumTopic(topicId),
    onSuccess: (_, topicId) => {
      toast.success("Topic deleted");
      queryClient.invalidateQueries({ queryKey: ["admin", "forum", "topics"] });
      queryClient.invalidateQueries({
        queryKey: ["admin", "forum", "topic", topicId],
      });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Failed to delete topic.");
    },
  });
}

export function useCreateAdminForumPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ForumPostCreatePayload) =>
      adminService.createForumPost(data),
    onSuccess: (response) => {
      toast.success("Post added");
      if (response?.data?.topic_id) {
        queryClient.invalidateQueries({
          queryKey: ["admin", "forum", "posts", response.data.topic_id],
        });
        queryClient.invalidateQueries({
          queryKey: ["admin", "forum", "topic", response.data.topic_id],
        });
      }
      return response;
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Failed to add post.");
    },
  });
}

export function useUpdateAdminForumPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: {
      topicId: string;
      postId: string;
      data: ForumPostUpdatePayload;
    }) =>
      adminService.updateForumPost(
        variables.topicId,
        variables.postId,
        variables.data
      ),
    onSuccess: (_, variables) => {
      toast.success("Post updated");
      queryClient.invalidateQueries({
        queryKey: ["admin", "forum", "posts", variables.topicId],
      });
      queryClient.invalidateQueries({
        queryKey: ["admin", "forum", "topic", variables.topicId],
      });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Failed to update post.");
    },
  });
}
