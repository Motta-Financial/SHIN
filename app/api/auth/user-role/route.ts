import { createClient } from "@/lib/supabase/server"
import { NextResponse, type NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const emailParam = searchParams.get("email")

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

    const userEmail = emailParam || user.email || ""

    console.log("[v0] user-role API - Checking role for email:", userEmail)

    // Check directors first
    const { data: directorData, error: directorError } = await supabase
      .from("directors")
      .select("id, email, role, full_name, clinic_id")
      .filter("email", "ilike", userEmail)
      .maybeSingle()

    console.log("[v0] user-role API - Director check:", { directorData, directorError })

    if (directorError) {
      console.error("[v0] user-role API - Director query error:", directorError)
    }

    if (directorData) {
      console.log("[v0] user-role API - Found director role")
      return NextResponse.json({
        role: directorData.role || "director",
        email: userEmail,
        userId: user.id,
        directorId: directorData.id,
        fullName: directorData.full_name,
        clinicId: directorData.clinic_id,
      })
    }

    // Check students
    const { data: studentData, error: studentError } = await supabase
      .from("students")
      .select("id, email, full_name, clinic_id, clinic")
      .filter("email", "ilike", userEmail)
      .maybeSingle()

    console.log("[v0] user-role API - Student check:", { studentData, studentError })

    if (studentError) {
      console.error("[v0] user-role API - Student query error:", studentError)
    }

    if (studentData) {
      console.log("[v0] user-role API - Found student role")
      return NextResponse.json({
        role: "student",
        email: userEmail,
        userId: user.id,
        studentId: studentData.id,
        fullName: studentData.full_name,
        clinicId: studentData.clinic_id,
        clinicName: studentData.clinic,
      })
    }

    // Check clients
    const { data: clientData, error: clientError } = await supabase
      .from("clients")
      .select("id, name, email")
      .filter("email", "ilike", userEmail)
      .maybeSingle()

    console.log("[v0] user-role API - Client check:", { clientData, clientError })

    if (clientError) {
      console.error("[v0] user-role API - Client query error:", clientError)
    }

    if (clientData) {
      console.log("[v0] user-role API - Found client role")
      return NextResponse.json({
        role: "client",
        email: userEmail,
        userId: user.id,
        clientId: clientData.id,
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
