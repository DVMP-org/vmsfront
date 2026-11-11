import type { forumApi, ForumContext } from "./api";
export type Shared = {
  api: ReturnType<typeof forumApi>;
  context: ForumContext;
  queryKey: unknown[];
  basePath: string;
  refresh: () => Promise<unknown>;
};
