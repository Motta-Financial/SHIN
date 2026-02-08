import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

function isValidUUID(str: string | null): boolean {
  if (!str) return false
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentIdParam = searchParams.get("studentId")
    const clinicIdParam = searchParams.get("clinicId")

    const studentId = isValidUUID(studentIdParam) ? studentIdParam : null
    const clinicId = isValidUUID(clinicIdParam) ? clinicIdParam : null

    // Don't cache student notifications to ensure fresh data

    const supabase = createServiceClient()

    // Build the query to fetch notifications for this student
    // Since notifications table requires student_id (NOT NULL), we fetch:
    // 1. Student-specific notifications (student_id = studentId)
    // 2. Clinic-specific notifications (clinic_id = clinicId AND student_id = studentId)
    let query = supabase
      .from("notifications")
      .select("*")
      .eq("target_audience", "students")
      .order("created_at", { ascending: false })
      .limit(50)

    // Filter by student_id if provided (required since student_id is NOT NULL in the table)
    if (studentId) {
      query = query.eq("student_id", studentId)
    } else {
      // If no studentId provided, return empty (can't fetch notifications without knowing the student)
      return NextResponse.json({ notifications: [] })
    }

    const { data, error } = await query

    if (error) {
      console.error("Student-notifications API error:", error.message)
      return NextResponse.json({ notifications: [] })
    }

    const response = { notifications: data || [] }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error in student-notifications GET:", error)
    return NextResponse.json({ notifications: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()
    const { studentId, clinicId, title, message, type } = body

    // student_id is required (NOT NULL constraint in the table)
    if (!studentId) {
      return NextResponse.json({ error: "studentId is required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("notifications")
      .insert({
        student_id: studentId,
        clinic_id: clinicId || null,
        title,
        message,
        type: type || "announcement",
        target_audience: "students",
        is_read: false,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating notification:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, notification: data })
  } catch (error) {
    console.error("Error in student-notifications POST:", error)
    return NextResponse.json({ error: "Failed to create notification" }, { status: 500 })
  }
}
