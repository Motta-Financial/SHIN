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

    if (authError || !user) {
      return NextResponse.json({ role: null, error: "Not authenticated" }, { status: 401 })
    }

    const userEmail = user.email

    // Query v_complete_mapping to determine user role based on email
    // Check directors
    const { data: directorData } = await supabase
      .from("v_complete_mapping")
      .select("clinic_director_email, client_director_email")
      .or(`clinic_director_email.eq.${userEmail},client_director_email.eq.${userEmail}`)
      .limit(1)
      .maybeSingle()

    if (directorData) {
      return NextResponse.json({
        role: "director",
        email: userEmail,
        userId: user.id,
      })
    }

    // Check students
    const { data: studentData } = await supabase
      .from("v_complete_mapping")
      .select("student_email, student_name, student_clinic_id, student_clinic_name")
      .eq("student_email", userEmail)
      .limit(1)
      .maybeSingle()

    if (studentData) {
      return NextResponse.json({
        role: "student",
        email: userEmail,
        userId: user.id,
        fullName: studentData.student_name,
        clinicId: studentData.student_clinic_id,
        clinicName: studentData.student_clinic_name,
      })
    }

    // Check clients
    const { data: clientData } = await supabase
      .from("clients")
      .select("id, name, email")
      .eq("email", userEmail)
      .limit(1)
      .maybeSingle()

    if (clientData) {
      return NextResponse.json({
        role: "client",
        email: userEmail,
        userId: user.id,
        fullName: clientData.name,
      })
    }

    // No role found
    return NextResponse.json(
      {
        role: null,
        error: "User not found in system",
        email: userEmail,
      },
      { status: 404 },
    )
  } catch (error) {
    console.error("[v0] Error fetching user role:", error)
    return NextResponse.json({ role: null, error: "Internal server error" }, { status: 500 })
  }
}
