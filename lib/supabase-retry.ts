// Server-side retry wrapper for Supabase queries that handles rate limiting
// Supabase can return "Too Many Requests" as plain text which crashes the JS client

type SupabaseQueryResult<T> = {
  data: T | null
  error: { message: string; code?: string } | null
}

function isRateLimitError(msg: string): boolean {
  return (
    msg.includes("Too Many R") ||
    msg.includes("rate limit") ||
    msg.includes("Unexpected token")
  )
}

/**
 * Execute a Supabase query with automatic retry on rate limit errors.
 * Uses short delays (500ms, 1s, 1.5s) to recover fast.
 */
export async function supabaseQueryWithRetry<T>(
  queryFn: () => PromiseLike<SupabaseQueryResult<T>>,
  maxRetries = 3,
  label = "query",
): Promise<SupabaseQueryResult<T>> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await queryFn()

      if (result.error && isRateLimitError(result.error.message || "")) {
        const wait = 500 * (attempt + 1)
        await new Promise((r) => setTimeout(r, wait))
        continue
      }

      return result
    } catch (error: any) {
      const msg = error?.message || ""
      if (isRateLimitError(msg)) {
        const wait = 500 * (attempt + 1)
        await new Promise((r) => setTimeout(r, wait))
        continue
      }
      return { data: null, error: { message: msg || "Unknown error" } }
    }
  }

  return {
    data: null,
    error: { message: `Rate limit exceeded after ${maxRetries} retries for ${label}` },
  }
}
