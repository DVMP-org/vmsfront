import axios, { AxiosError } from "axios";

export interface ParsedApiError {
  message: string;
  fieldErrors: Record<string, string>;
}

const FALLBACK_ERROR_MESSAGE = "Something went wrong. Please try again.";

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

export function getApiErrorStatus(error: unknown): number | undefined {
  return axios.isAxiosError(error) ? error.response?.status : undefined;
}

export function parseApiError(error: unknown): ParsedApiError {
  let message = FALLBACK_ERROR_MESSAGE;
  const fieldErrors: Record<string, string> = {};

  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<unknown>;
    const responseData = asRecord(axiosError.response?.data);

    const responseMessage =
      (typeof responseData?.message === "string" && responseData.message) ||
      (typeof responseData?.detail === "string" && responseData.detail) ||
      null;

    if (responseMessage) {
      message = responseMessage;
    } else if (axiosError.message) {
      message = axiosError.message;
    }

    if (Array.isArray(responseData?.detail)) {
      for (const itemValue of responseData.detail) {
        const item = asRecord(itemValue);
        const location = Array.isArray(item?.loc) ? item.loc : [];
        const field = location.at(-1);
        if (typeof field === "string" && typeof item?.msg === "string") {
          fieldErrors[field] = item.msg;
        }
      }
    }

    const errors = asRecord(responseData?.errors);
    if (errors) {
      for (const [field, value] of Object.entries(errors)) {
        if (Array.isArray(value) && value.length > 0) {
          fieldErrors[field] = String(value[0]);
        } else if (value) {
          fieldErrors[field] = String(value);
        }
      }
    }
  } else if (error instanceof Error && error.message) {
    message = error.message;
  }

  return { message, fieldErrors };
}
