import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types";

export interface ForumScope {
  type: "site" | "place";
  id: string;
}
export interface Category {
  id: string;
  name: string;
  description: string;
  topic_count: number;
}
export interface ForumContext {
  site_id: string;
  site_name: string;
  user_id: string;
  is_admin: boolean;
  can_manage_categories: boolean;
  can_moderate_topics: boolean;
  can_delete_topics: boolean;
  can_moderate_posts: boolean;
  can_review_reports: boolean;
  categories: Category[];
}
export interface Topic {
  id: string;
  category_id: string;
  category_name: string;
  title: string;
  author_id: string;
  author_name: string;
  is_pinned: boolean;
  is_locked: boolean;
  posts_count: number;
  created_at: string;
  last_post_at: string;
  is_unread?: boolean;
}
export interface Post {
  id: string;
  author_id: string;
  author_name: string;
  content: string;
  is_deleted: boolean;
  posted_by_admin: boolean;
  created_at: string;
  edited_at: string | null;
}
export interface Report {
  post_page: number;
  id: string;
  reason: string;
  post_id: string;
  topic_id: string;
  title: string;
  content: string;
  created_at: string;
}
export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}
export interface Thread extends Page<Post> {
  topic: Topic;
}
export const forumPath = (scope: ForumScope) =>
  scope.type === "site"
    ? `/sites/${encodeURIComponent(scope.id)}/forum`
    : `/workspace/places/${encodeURIComponent(scope.id)}/forum`;
export function forumApi(scope: ForumScope) {
  const path = forumPath(scope);
  const get = async <T>(suffix: string, params?: object) =>
    (await apiClient.get<ApiResponse<T>>(`${path}${suffix}`, { params })).data;
  const post = async (suffix: string, body: object) =>
    (
      await apiClient.post<ApiResponse<{ id: string }>>(
        `${path}${suffix}`,
        body,
      )
    ).data;
  const patch = async (suffix: string, body: object) =>
    (
      await apiClient.patch<ApiResponse<{ id: string }>>(
        `${path}${suffix}`,
        body,
      )
    ).data;
  const remove = async (suffix: string) =>
    (await apiClient.delete<ApiResponse<{ id: string }>>(`${path}${suffix}`))
      .data;
  return {
    context: () => get<ForumContext>("/context"),
    topics: (params: object) => get<Page<Topic>>("/topics", params),
    thread: (id: string, page: number) =>
      get<Thread>(`/topics/${encodeURIComponent(id)}/posts`, {
        page,
        page_size: 20,
      }),
    createCategory: (body: { name: string; description: string }) =>
      post("/categories", body),
    createTopic: (body: {
      title: string;
      content: string;
      category_id: string;
    }) => post("/topics", body),
    editTopic: (id: string, body: { title: string; category_id: string }) =>
      patch(`/topics/${id}`, body),
    moderate: (
      id: string,
      body: { is_pinned?: boolean; is_locked?: boolean },
    ) => patch(`/topics/${id}/moderation`, body),
    deleteTopic: (id: string) => remove(`/topics/${id}`),
    reply: (id: string, content: string) =>
      post(`/topics/${id}/posts`, { content }),
    editPost: (topicId: string, id: string, content: string) =>
      patch(`/topics/${topicId}/posts/${id}`, { content }),
    deletePost: (topicId: string, id: string) =>
      remove(`/topics/${topicId}/posts/${id}`),
    report: (topicId: string, id: string, reason: string) =>
      post(`/topics/${topicId}/posts/${id}/reports`, { reason }),
    read: (topicId: string, id: string) =>
      apiClient.put(`${path}/topics/${topicId}/read/${id}`),
    reports: (page: number) =>
      get<Page<Report>>("/reports", { page, page_size: 20 }),
    review: (id: string, status: "reviewed" | "rejected") =>
      patch(`/reports/${id}`, { status }),
  };
}
