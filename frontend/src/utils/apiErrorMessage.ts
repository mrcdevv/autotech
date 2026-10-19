import { isAxiosError } from "axios";

/**
 * Extracts the user-facing message from a backend ApiResponse error, with a fallback.
 */
export function apiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? fallback;
  }
  return fallback;
}
