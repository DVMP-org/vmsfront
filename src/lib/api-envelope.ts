import type { ApiResponse } from "@/types";

/**
 * The API wraps every successful JSON body as `{ success, message, data }`.
 *
 * `apiClient` returns that body verbatim, so a caller that types a response as
 * the bare payload is wrong in a way the compiler cannot see: the types match the
 * shape the caller *wanted*, not the shape the server sent. Everything funnels
 * through here so the unwrap happens once per call and is visible in review.
 */
export function unwrap<T>(response: ApiResponse<T>): T {
  return response.data;
}
