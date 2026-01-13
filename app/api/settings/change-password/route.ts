import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  console.log("[v0] Change password API called")

  try {
    const body = await request.json()
    const { newPassword } = body

    if (!newPassword || newPassword.length < 6) {
      console.log("[v0] Password validation failed - too short")
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

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
              cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
            } catch {
              // Ignored in server context
            }
          },
        },
      },
    )

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    console.log("[v0] Change password - User check:", {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      error: userError?.message,
    })

    if (userError || !user) {
      console.log("[v0] Change password - Not authenticated:", userError?.message)
      return NextResponse.json({ error: "Not authenticated. Please sign in again." }, { status: 401 })
    }

    // Update password
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      console.error("[v0] Password update error:", error.message, error.status)

      // Provide more specific error messages
      if (error.message.includes("same password")) {
        return NextResponse.json(
          { error: "New password must be different from your current password" },
          { status: 400 },
        )
      }
      if (error.message.includes("weak")) {
        return NextResponse.json({ error: "Password is too weak. Please use a stronger password." }, { status: 400 })
      }

      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.log("[v0] Password updated successfully for user:", user.email)
    return NextResponse.json({ success: true, message: "Password updated successfully" })
  } catch (error: any) {
    console.error("[v0] Error changing password:", error)
    return NextResponse.json({ error: error.message || "Failed to change password" }, { status: 500 })
  }
}
