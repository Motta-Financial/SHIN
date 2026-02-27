// app/auth/callback/route.ts
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

export const dynamic = "force-dynamic" // ensure per-request server execution

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const origin = url.origin
  const next = url.searchParams.get("next") || "/"

  if (!code) {
    // No code from IdP -> back to sign-in
    return NextResponse.redirect(`${origin}/sign-in`)
  }

  const cookieStore = cookies()

  // Create a Supabase *server* client that can set auth cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: "", ...options })
        },
      },
    }
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    // Bubble error to UI if needed
    return NextResponse.redirect(
      `${origin}/sign-in?error=${encodeURIComponent(error.message)}`
    )
  }

  // Success → send user to your app (change to /dashboard if you prefer)
  return NextResponse.redirect(`${origin}${next}`)
}
