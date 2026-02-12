import { createBrowserClient } from "@supabase/ssr"

/**
 * Custom fetch that retries on 429 (rate limit) with exponential backoff.
 */
async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const maxRetries = 3
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await globalThis.fetch(input, init)

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
  return globalThis.fetch(input, init)
}

let client: ReturnType<typeof createBrowserClient> | undefined

export function createClient() {
  if (client) return client

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase credentials")
  }

  client = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
    },
    global: {
      fetch: fetchWithRetry,
    },
  })

  return client
}
