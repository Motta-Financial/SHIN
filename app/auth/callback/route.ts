// app/auth/callback/route.ts
// Handles the PKCE code exchange server-side after SAML SSO.
// The code_verifier is stored in browser cookies by createBrowserClient
// and the server can read those cookies to complete the exchange.
import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const error = url.searchParams.get("error")
  const errorDescription = url.searchParams.get("error_description")
  const origin = url.origin

  if (error) {
    const msg = errorDescription || error
    return NextResponse.redirect(
      `${origin}/sign-in?error=${encodeURIComponent(msg)}`
    )
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/sign-in`)
  }

  // Exchange the code for a session using a server client that can
  // read the PKCE code_verifier from cookies AND set session cookies
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll may fail in some edge cases, but the session
            // will still be available via getAll on the next request
          }
        },
      },
    }
  )

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    return NextResponse.redirect(
      `${origin}/sign-in?error=${encodeURIComponent(exchangeError.message)}`
    )
  }

  // Session cookies are now set -- redirect to loading page for role detection
  return NextResponse.redirect(`${origin}/auth/loading`)
}
