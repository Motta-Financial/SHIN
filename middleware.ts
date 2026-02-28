// middleware.ts
import { type NextRequest, NextResponse } from "next/server"
import { updateSession } from "@/utils/supabase/middleware"

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // ✅ TEMP: allow landing on "/" without session to see ?dbg=... from callback
  if (pathname === "/") {
    return NextResponse.next()
  }

  // already skipping callback (good)
  if (pathname === "/auth/callback") {
    return NextResponse.next()
  }

  let response: NextResponse
  try {
    response = await updateSession(request)
  } catch {
    response = NextResponse.next({ request: { headers: request.headers } })
  }

  // Security headers (unchanged)
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https: wss:;"
  )
  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|auth/callback).*)",
  ],
}
