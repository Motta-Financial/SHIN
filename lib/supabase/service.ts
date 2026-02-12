import { createClient } from "@supabase/supabase-js"

/**
 * Custom fetch that retries on 429 (rate limit) with exponential backoff.
 * This is injected into the Supabase client so ALL queries automatically
 * get rate-limit retry protection at the transport level.
 */
async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const maxRetries = 3
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(input, init)

    if (response.status === 429 && attempt < maxRetries) {
      const wait = 800 * Math.pow(2, attempt) + Math.random() * 300
      await new Promise((r) => setTimeout(r, wait))
      continue
    }

    // Also check if body looks like a rate-limit text response for non-429 cases
    if (!response.ok && attempt < maxRetries) {
      const cloned = response.clone()
      try {
        const text = await cloned.text()
        if (text.includes("Too Many R") || text.includes("rate limit")) {
          const wait = 800 * Math.pow(2, attempt) + Math.random() * 300
          await new Promise((r) => setTimeout(r, wait))
          continue
        }
      } catch {
        // If we can't read the body, just return the response
      }
    }

    return response
  }
  // Should not reach here, but return last attempt
  return fetch(input, init)
}

// Service role client for admin operations that bypass RLS
export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.supabase_SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase service role credentials")
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    db: {
      schema: 'public',
    },
    global: {
      fetch: fetchWithRetry,
    },
  })
}
