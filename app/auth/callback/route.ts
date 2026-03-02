// app/auth/callback/route.ts
// This server route receives the auth code from Supabase after SAML SSO.
// It redirects to the client-side loading page where the PKCE code exchange
// happens in the browser (where the code_verifier is stored in localStorage).
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const error = url.searchParams.get("error")
  const errorDescription = url.searchParams.get("error_description")
  const origin = url.origin

  if (error) {
    // SAML validation failed -- redirect to sign-in with error
    const msg = errorDescription || error
    return NextResponse.redirect(
      `${origin}/sign-in?error=${encodeURIComponent(msg)}`
    )
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/sign-in`)
  }

  // Pass the code to the client-side auth/loading page where the PKCE
  // code_verifier exists in browser localStorage and can complete the exchange
  return NextResponse.redirect(`${origin}/auth/loading?code=${code}`)
}
