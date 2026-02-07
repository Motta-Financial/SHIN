import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return response
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  // Refresh session tokens if they are about to expire.
  // IMPORTANT: We NEVER redirect to sign-in from middleware. Auth redirects
  // are handled purely client-side by useUserRole + each page's useEffect.
  // This prevents the "kicked back to sign-in" bug caused by rate-limited
  // getUser() calls returning errors that look like auth failures.
  try {
    await supabase.auth.getUser()
  } catch {
    // Silently ignore all errors - rate limits, network issues, etc.
    // The client-side Supabase SDK handles token refresh automatically.
  }

  return response
}
