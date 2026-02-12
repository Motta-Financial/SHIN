import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { cache } from "react"

/**
 * Custom fetch that retries on 429 (rate limit) with exponential backoff.
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

    if (!response.ok && attempt < maxRetries) {
      const cloned = response.clone()
      try {
        const text = await cloned.text()
        if (text.includes("Too Many R") || text.includes("rate limit")) {
          const wait = 800 * Math.pow(2, attempt) + Math.random() * 300
          await new Promise((r) => setTimeout(r, wait))
          continue
        }
      } catch { /* ignore */ }
    }

    return response
  }
  return fetch(input, init)
}

export const createClient = cache(async () => {
  const cookieStore = await cookies()
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase credentials")
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // The `setAll` method was called from a Server Component.
        }
      },
    },
    global: {
      fetch: fetchWithRetry,
    },
  })
})
