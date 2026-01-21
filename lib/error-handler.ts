/**
 * RLS-aware error handler utility
 * 
 * Provides consistent error messaging for authentication and authorization errors.
 * Trusts RLS for access control and surfaces clear messages for 401/403 responses.
 */

export interface ApiError extends Error {
  status?: number
  code?: string
}

/**
 * Error messages for common HTTP status codes
 */
export const ERROR_MESSAGES = {
  401: "Please sign in to access this content.",
  403: "You don't have permission to view this content.",
  404: "The requested resource was not found.",
  429: "Too many requests. Please wait a moment and try again.",
  500: "An unexpected error occurred. Please try again later.",
  default: "Failed to load data. Please try again.",
} as const

/**
 * Get a user-friendly error message based on response status or error
 */
export function getErrorMessage(error: unknown): string {
  // Handle Response objects
  if (error instanceof Response) {
    return ERROR_MESSAGES[error.status as keyof typeof ERROR_MESSAGES] || ERROR_MESSAGES.default
  }

  // Handle errors with status property
  if (error && typeof error === "object" && "status" in error) {
    const status = (error as ApiError).status
    if (status) {
      return ERROR_MESSAGES[status as keyof typeof ERROR_MESSAGES] || ERROR_MESSAGES.default
    }
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    // Check for specific error messages that indicate auth issues
    const message = error.message.toLowerCase()
    if (message.includes("unauthorized") || message.includes("401")) {
      return ERROR_MESSAGES[401]
    }
    if (message.includes("forbidden") || message.includes("403")) {
      return ERROR_MESSAGES[403]
    }
    if (message.includes("not found") || message.includes("404")) {
      return ERROR_MESSAGES[404]
    }
    if (message.includes("rate limit") || message.includes("429") || message.includes("too many")) {
      return ERROR_MESSAGES[429]
    }
    // Return the original message if it's user-friendly
    if (error.message && !error.message.includes("fetch") && error.message.length < 100) {
      return error.message
    }
  }

  return ERROR_MESSAGES.default
}

/**
 * Check if an error is an authentication error (401)
 */
export function isAuthError(error: unknown): boolean {
  if (error instanceof Response) {
    return error.status === 401
  }
  if (error && typeof error === "object" && "status" in error) {
    return (error as ApiError).status === 401
  }
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    return message.includes("unauthorized") || message.includes("401")
  }
  return false
}

/**
 * Check if an error is an authorization/permission error (403)
 */
export function isPermissionError(error: unknown): boolean {
  if (error instanceof Response) {
    return error.status === 403
  }
  if (error && typeof error === "object" && "status" in error) {
    return (error as ApiError).status === 403
  }
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    return message.includes("forbidden") || message.includes("403") || message.includes("permission")
  }
  return false
}

/**
 * Check if an error is a rate limit error (429)
 */
export function isRateLimitError(error: unknown): boolean {
  if (error instanceof Response) {
    return error.status === 429
  }
  if (error && typeof error === "object" && "status" in error) {
    return (error as ApiError).status === 429
  }
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    return message.includes("rate limit") || message.includes("429") || message.includes("too many")
  }
  return false
}

/**
 * Handle API response and throw appropriate error if not ok
 */
export async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = new Error(getErrorMessage(response)) as ApiError
    error.status = response.status
    throw error
  }
  return response.json()
}

/**
 * Create an error with status code for consistent handling
 */
export function createApiError(status: number, message?: string): ApiError {
  const error = new Error(message || getErrorMessage({ status } as Response)) as ApiError
  error.status = status
  return error
}
