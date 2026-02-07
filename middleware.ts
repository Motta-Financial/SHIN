import { type NextRequest, NextResponse } from "next/server"
import { updateSession } from "@/utils/supabase/middleware"

export async function middleware(request: NextRequest) {
  // Only refresh Supabase session for main page navigations (not API, auth, or sign-in).
  // The Supabase client handles session refresh automatically on the client side,
  // so middleware refresh is only needed to sync cookies for server components.
  const { pathname } = request.nextUrl
  const isPageNavigation =
    !pathname.startsWith("/api/") &&
    !pathname.startsWith("/sign-in") &&
    !pathname.startsWith("/auth/") &&
    !pathname.startsWith("/_next/")

  let response: NextResponse
  if (isPageNavigation) {
    try {
      response = await updateSession(request)
    } catch {
      // If session refresh fails (rate limit, network), just pass through
      response = NextResponse.next({ request: { headers: request.headers } })
    }
  } else {
    response = NextResponse.next({ request: { headers: request.headers } })
  }

  // Add security headers
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")

  // CSP header for XSS protection
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https: wss:;",
  )

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
