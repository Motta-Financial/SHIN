// Server-side retry wrapper for Supabase queries that handles rate limiting
// Supabase returns "Too Many Requests" as plain text which crashes the JS client

type SupabaseQueryResult<T> = {
  data: T | null
  error: { message: string; code?: string } | null
}

/**
 * Execute a Supabase query with automatic retry on rate limit errors.
 * Use this in API routes when multiple queries run in sequence.
 */
export async function supabaseQueryWithRetry<T>(
  queryFn: () => PromiseLike<SupabaseQueryResult<T>>,
  maxRetries = 3,
  label = "query",
): Promise<SupabaseQueryResult<T>> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await queryFn()

      // Check if the error is a rate limit
      if (result.error) {
        const msg = result.error.message || ""
        if (
          msg.includes("Too Many R") ||
          msg.includes("rate limit") ||
          msg.includes("Unexpected token")
        ) {
          const wait = Math.pow(2, attempt + 1) * 1000
          console.log(
            `[supabase-retry] Rate limited on ${label}, waiting ${wait}ms (attempt ${attempt + 1}/${maxRetries})`,
          )
          await new Promise((r) => setTimeout(r, wait))
          continue
        }
      }

      return result
    } catch (error: any) {
      const msg = error?.message || ""
      if (
        msg.includes("Too Many R") ||
        msg.includes("rate limit") ||
        msg.includes("Unexpected token")
      ) {
        const wait = Math.pow(2, attempt + 1) * 1000
        console.log(
          `[supabase-retry] Exception rate limited on ${label}, waiting ${wait}ms (attempt ${attempt + 1}/${maxRetries})`,
        )
        await new Promise((r) => setTimeout(r, wait))
        continue
      }
      // Non-rate-limit error - return as error result
      return { data: null, error: { message: msg || "Unknown error" } }
    }
  }

  return {
    data: null,
    error: { message: `Rate limit exceeded after ${maxRetries} retries for ${label}` },
  }
}

/**
 * Execute multiple Supabase queries sequentially with retry and delay between each.
 * Prevents rate limiting by staggering queries.
 */
export async function supabaseSequentialQueries<T extends SupabaseQueryResult<any>[]>(
  queries: Array<{ fn: () => PromiseLike<any>; label: string }>,
  delayMs = 100,
): Promise<T> {
  const results: any[] = []
  for (let i = 0; i < queries.length; i++) {
    if (i > 0) {
      await new Promise((r) => setTimeout(r, delayMs))
    }
    const result = await supabaseQueryWithRetry(queries[i].fn, 3, queries[i].label)
    results.push(result)
  }
  return results as T
}
