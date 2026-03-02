// app/auth/callback/route.ts
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { createClient as createServiceClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic" // ensure per-request server execution

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const origin = url.origin

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

  let data: any = null

  if (code) {
    // Fresh SSO login -- exchange the code for a session
    const result = await supabase.auth.exchangeCodeForSession(code)
    if (result.error) {
      return NextResponse.redirect(
        `${origin}/sign-in?error=${encodeURIComponent(result.error.message)}`
      )
    }
    data = result.data
  } else {
    // No code -- user may already be authenticated (Duo remembered them).
    // Check for an existing session before bouncing to sign-in.
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      return NextResponse.redirect(`${origin}/sign-in`)
    }
    data = { session: { user: userData.user } }
  }

  // Detect user role server-side and redirect to the correct dashboard
  const userEmail = data.session?.user?.email
  if (userEmail) {
    try {
      const serviceSupabase = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      // Check if admin
      const userId = data.session.user.id
      const { data: profile } = await serviceSupabase
        .from("profiles")
        .select("is_admin, role")
        .eq("id", userId)
        .single()

      if (profile?.is_admin) {
        return NextResponse.redirect(`${origin}/admin`)
      }

      // Check if director
      const { data: director } = await serviceSupabase
        .from("directors")
        .select("id")
        .eq("email", userEmail)
        .limit(1)
        .single()

      if (director) {
        return NextResponse.redirect(`${origin}/director`)
      }

      // Check if student
      const { data: student } = await serviceSupabase
        .from("students")
        .select("id")
        .eq("email", userEmail)
        .limit(1)
        .single()

      if (student) {
        return NextResponse.redirect(`${origin}/students`)
      }

      // Check if client
      const { data: client } = await serviceSupabase
        .from("clients")
        .select("id")
        .eq("email", userEmail)
        .limit(1)
        .single()

      if (client) {
        return NextResponse.redirect(`${origin}/client-portal`)
      }
    } catch {
      // If role detection fails, fall through to loading page
    }
  }

  // Fallback: send to loading page which handles role detection client-side
  return NextResponse.redirect(`${origin}/auth/loading`)
}
