import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { newPassword } = body

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Update password
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      console.error("[v0] Password update error:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: "Password updated successfully" })
  } catch (error) {
    console.error("[v0] Error changing password:", error)
    return NextResponse.json({ error: "Failed to change password" }, { status: 500 })
  }
}
