// Server-side retry wrapper for Supabase queries that handles rate limiting
// Supabase can return "Too Many Requests" as plain text which crashes the JS client

type SupabaseQueryResult<T> = {
  data: T | null
  error: { message: string; code?: string } | null
}

function isRateLimitError(msg: string): boolean {
  const lower = msg.toLowerCase()
  return (
    msg.includes("Too Many R") ||
    lower.includes("rate limit") ||
    msg.includes("Unexpected token") ||
    msg.includes("is not valid JSON") ||
    msg.includes("SyntaxError") ||
    lower.includes("too many requests")
  )
}

/**
 * Execute a Supabase query with automatic retry on rate limit errors.
 * Uses exponential backoff (800ms, 1.6s, 3.2s) to let rate limits clear.
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
        if (attempt < maxRetries - 1) {
          const wait = 800 * Math.pow(2, attempt) + Math.random() * 300
          await new Promise((r) => setTimeout(r, wait))
          continue
        }
      }

      return result
    } catch (error: any) {
      const msg = error?.message || String(error) || ""
      if (isRateLimitError(msg) && attempt < maxRetries - 1) {
        const wait = 800 * Math.pow(2, attempt) + Math.random() * 300
        await new Promise((r) => setTimeout(r, wait))
        continue
      }
      // On final attempt or non-rate-limit error, return gracefully
      return { data: null, error: { message: msg || "Unknown error" } }
    }
  }

  return {
    data: null,
    error: { message: `Rate limit exceeded after ${maxRetries} retries for ${label}` },
  }
}
