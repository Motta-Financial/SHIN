// middleware.ts
import { type NextRequest, NextResponse } from "next/server"
import { updateSession } from "@/utils/supabase/middleware"

export async function middleware(request: NextRequest) {
  // ✅ Skip the SAML callback so Supabase can finish exchangeCodeForSession
  if (request.nextUrl.pathname === "/auth/callback") {
    return NextResponse.next()
  }

  let response: NextResponse
  try {
    response = await updateSession(request)
  } catch {
    // If session refresh fails, just pass through - don't break navigation
    response = NextResponse.next({ request: { headers: request.headers } })
  }

  // Security headers
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https: wss:;",
  )

  return response
}

// ✅ Exclude /auth/callback from the matcher
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|auth/callback).*)",
  ],
}
