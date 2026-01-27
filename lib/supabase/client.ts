import { createBrowserClient } from "@supabase/ssr"

let client: ReturnType<typeof createBrowserClient> | undefined

// Helper to clear all Supabase auth data from storage
function clearAuthData() {
  if (typeof window === "undefined") return
  
  // Clear localStorage items related to Supabase auth
  const keysToRemove: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && (key.startsWith("sb-") || key.includes("supabase") || key === "supabase-auth-token")) {
      keysToRemove.push(key)
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key))
  
  // Clear cookies related to Supabase
  document.cookie.split(";").forEach(cookie => {
    const name = cookie.split("=")[0].trim()
    if (name.startsWith("sb-") || name.includes("supabase")) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
    }
  })
}

export function createClient() {
  if (client) {
    return client
  }
  
  // Browser client uses NEXT_PUBLIC_ prefixed env vars
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[v0] createClient (browser) - Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY")
    throw new Error("Missing Supabase credentials")
  }

  client = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      storageKey: "supabase-auth-token",
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
    },
  })
  
  // Handle auth errors gracefully - clear stale tokens on refresh token errors
  if (typeof window !== "undefined") {
    client.auth.onAuthStateChange((event, session) => {
      if (event === "TOKEN_REFRESHED" && !session) {
        // Token refresh failed, clear local storage to reset auth state
        clearAuthData()
      }
      if (event === "SIGNED_OUT") {
        clearAuthData()
      }
    })
    
    // Wrap getSession to handle refresh token errors
    const originalGetSession = client.auth.getSession.bind(client.auth)
    client.auth.getSession = async () => {
      try {
        const result = await originalGetSession()
        if (result.error?.message?.includes("refresh_token_not_found") || 
            result.error?.message?.includes("Invalid Refresh Token")) {
          clearAuthData()
          return { data: { session: null }, error: null }
        }
        return result
      } catch (error: any) {
        if (error?.message?.includes("refresh_token_not_found") || 
            error?.message?.includes("Invalid Refresh Token")) {
          clearAuthData()
          return { data: { session: null }, error: null }
        }
        throw error
      }
    }
  }

  return client
}
