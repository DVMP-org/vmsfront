import axios, { AxiosError } from "axios";

export interface ParsedApiError {
  message: string;
  fieldErrors: Record<string, string>;
}

const FALLBACK_ERROR_MESSAGE = "Something went wrong. Please try again.";

export function parseApiError(error: unknown): ParsedApiError {
  let message = FALLBACK_ERROR_MESSAGE;
  const fieldErrors: Record<string, string> = {};

  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<any>;
    const responseData = axiosError.response?.data;

    const responseMessage =
      responseData?.message ||
      (typeof responseData?.detail === "string" ? responseData.detail : null);

    if (responseMessage) {
      message = responseMessage;
    } else if (axiosError.message) {
      message = axiosError.message;
    }

    // FastAPI validation errors come through in detail as an array
    if (Array.isArray(responseData?.detail)) {
      responseData.detail.forEach((item: any) => {
        const path = Array.isArray(item?.loc) ? item.loc.at(-1) : null;
        if (typeof path === "string" && item?.msg) {
          fieldErrors[path] = item.msg;
        }
      });
    }

    // Custom error payloads
    if (responseData?.errors && typeof responseData.errors === "object") {
      Object.entries(responseData.errors).forEach(([key, value]) => {
        if (Array.isArray(value) && value.length > 0) {
          fieldErrors[key] = String(value[0]);
        } else if (value) {
          fieldErrors[key] = String(value);
        }
      });
    }
  } else if (error instanceof Error && error.message) {
    message = error.message;
  }

  return { message, fieldErrors };
}
