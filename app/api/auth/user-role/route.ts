import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    console.log("[v0] user-role API - Auth check:", { user: user?.email, authError })

    if (authError || !user) {
      console.log("[v0] user-role API - Not authenticated")
      return NextResponse.json({ role: null, error: "Not authenticated" }, { status: 401 })
    }

    const userEmail = user.email?.toLowerCase() || ""

    console.log("[v0] user-role API - Checking role for email:", userEmail)

    const { data: directorData, error: directorError } = await supabase
      .from("directors")
      .select("id, email, role, full_name, clinic_id")
      .ilike("email", userEmail)
      .maybeSingle()

    console.log("[v0] user-role API - Director check:", { directorData, directorError })

    if (directorData) {
      console.log("[v0] user-role API - Found director role")
      return NextResponse.json({
        role: directorData.role || "director",
        email: userEmail,
        userId: user.id,
        fullName: directorData.full_name,
        clinicId: directorData.clinic_id,
      })
    }

    const { data: studentData, error: studentError } = await supabase
      .from("students")
      .select("id, email, full_name, clinic_id, clinic")
      .ilike("email", userEmail)
      .maybeSingle()

    console.log("[v0] user-role API - Student check:", { studentData, studentError })

    if (studentData) {
      console.log("[v0] user-role API - Found student role")
      return NextResponse.json({
        role: "student",
        email: userEmail,
        userId: user.id,
        fullName: studentData.full_name,
        clinicId: studentData.clinic_id,
        clinicName: studentData.clinic,
      })
    }

    const { data: clientData, error: clientError } = await supabase
      .from("clients")
      .select("id, name, email")
      .ilike("email", userEmail)
      .maybeSingle()

    console.log("[v0] user-role API - Client check:", { clientData, clientError })

    if (clientData) {
      console.log("[v0] user-role API - Found client role")
      return NextResponse.json({
        role: "client",
        email: userEmail,
        userId: user.id,
        fullName: clientData.name,
      })
    }

    // No role found
    console.log("[v0] user-role API - No role found for user:", userEmail)
    return NextResponse.json(
      {
        role: null,
        error: "User not found in system",
        email: userEmail,
      },
      { status: 404 },
    )
  } catch (error) {
    console.error("[v0] user-role API - Error:", error)
    return NextResponse.json({ role: null, error: "Internal server error" }, { status: 500 })
  }
}
