import { createBrowserClient } from "@supabase/ssr"

let client: ReturnType<typeof createBrowserClient> | undefined
let refreshInterval: ReturnType<typeof setInterval> | undefined

// Session refresh interval: 10 minutes
// The default Supabase JWT expires in 1 hour (3600s).
// Refreshing every 10 minutes ensures the token never goes stale
// while the page is open, even without user interaction.
const SESSION_REFRESH_INTERVAL_MS = 10 * 60 * 1000

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
  keysToRemove.forEach((key) => localStorage.removeItem(key))

  // Clear cookies related to Supabase
  document.cookie.split(";").forEach((cookie) => {
    const name = cookie.split("=")[0].trim()
    if (name.startsWith("sb-") || name.includes("supabase")) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
    }
  })
}

// Proactive session refresh - keeps the session alive while the tab is open
function startSessionRefresh(supabase: ReturnType<typeof createBrowserClient>) {
  if (typeof window === "undefined") return

  // Clear any existing interval
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }

  // Periodic refresh every 10 minutes
  refreshInterval = setInterval(async () => {
    try {
      const { data, error } = await supabase.auth.getSession()
      if (data?.session) {
        // Session still valid - proactively refresh the token
        await supabase.auth.refreshSession()
      } else if (error) {
        console.error("Session refresh failed:", error.message)
      }
    } catch {
      // Silently fail - the next interval or user action will retry
    }
  }, SESSION_REFRESH_INTERVAL_MS)

  // Refresh session when the tab becomes visible again (user returns from another tab/app)
  document.addEventListener("visibilitychange", async () => {
    if (document.visibilityState === "visible") {
      try {
        const { data } = await supabase.auth.getSession()
        if (data?.session) {
          await supabase.auth.refreshSession()
        }
      } catch {
        // Silently fail
      }
    }
  })

  // Refresh session on window focus (user clicks back into the browser window)
  window.addEventListener("focus", async () => {
    try {
      const { data } = await supabase.auth.getSession()
      if (data?.session) {
        await supabase.auth.refreshSession()
      }
    } catch {
      // Silently fail
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
    throw new Error("Missing Supabase credentials")
  }

  client = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
    },
  })

  // Handle auth state changes and start proactive session refresh
  if (typeof window !== "undefined") {
    client.auth.onAuthStateChange((event, session) => {
      if (event === "TOKEN_REFRESHED" && !session) {
        clearAuthData()
      }
      if (event === "SIGNED_OUT") {
        clearAuthData()
        // Stop the refresh interval when signed out
        if (refreshInterval) {
          clearInterval(refreshInterval)
          refreshInterval = undefined
        }
      }
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        // Ensure refresh loop is running when a session is active
        if (session && !refreshInterval) {
          startSessionRefresh(client!)
        }
      }
    })

    // Start the proactive session refresh loop immediately
    startSessionRefresh(client)
  }

  return client
}
