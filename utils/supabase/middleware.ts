import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // Auth not configured yet, just return response with headers
    return response
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  // Refresh session if expired - this is important for SSR
  try {
    const { error } = await supabase.auth.getUser()

    if (error?.code === "session_not_found" || error?.message?.includes("session_not_found")) {
      // Clear all Supabase auth cookies to force re-authentication
      const cookieNames = request.cookies.getAll().map((c) => c.name)
      const supabaseCookies = cookieNames.filter((name) => name.startsWith("sb-") || name.includes("supabase"))

      supabaseCookies.forEach((name) => {
        response.cookies.delete(name)
      })

      // Redirect to sign-in page if not already there
      const pathname = request.nextUrl.pathname
      if (!pathname.startsWith("/sign-in") && !pathname.startsWith("/sign-up")) {
        const signInUrl = new URL("/sign-in", request.url)
        return NextResponse.redirect(signInUrl)
      }
    }
  } catch {
    // Auth may not be set up yet, ignore errors
  }

  return response
}
