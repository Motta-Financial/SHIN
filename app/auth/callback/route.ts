// app/auth/callback/route.ts
// Fallback redirect -- forwards any params to /auth/loading (client page)
// so the browser client can handle the PKCE code exchange directly.
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const origin = url.origin

  // Forward all query params (code, error, etc.) to the client page
  const params = url.searchParams.toString()
  const target = params
    ? `${origin}/auth/loading?${params}`
    : `${origin}/auth/loading`

  return NextResponse.redirect(target)
}
