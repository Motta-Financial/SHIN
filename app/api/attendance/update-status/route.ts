import { type NextRequest, NextResponse } from "next/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"

// Service role client for admin operations (bypasses RLS after authorization check)
function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.supabase_SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase credentials for service client")
  }
  
  return createServiceClient(supabaseUrl, serviceRoleKey)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { attendanceId, isPresent, userEmail, studentId, classDate, semesterId } = body

    // Support both old attendanceId format and new composite key format
    if (isPresent === undefined || !userEmail) {
      return NextResponse.json(
        { error: "Missing required fields: isPresent and userEmail are required" },
        { status: 400 },
      )
    }

    const serviceClient = getServiceClient()

    // Check if user is a director (case-insensitive email match)
    const { data: directors } = await serviceClient
      .from("directors")
      .select("id, email, full_name")
      .ilike("email", userEmail)
      .limit(1)
    
    const director = directors?.[0]
    const isDirector = !!director

    if (!isDirector) {
      return NextResponse.json(
        { error: "Only directors can update attendance status" },
        { status: 403 },
      )
    }

    // Update the attendance record using composite key (student_id + class_date + semester_id)
    // The attendance table doesn't have an 'id' column
    let query = serviceClient
      .from("attendance")
      .update({ is_present: isPresent })
    
    if (studentId && classDate) {
      // Use composite key approach
      query = query.eq("student_id", studentId).eq("class_date", classDate)
      if (semesterId) {
        query = query.eq("semester_id", semesterId)
      }
    } else if (attendanceId) {
      // Try parsing the attendanceId if it contains student_id and date info
      // Format might be: "studentId-date" e.g., "uuid-2026-01-12"
      const parts = attendanceId.split("-")
      if (parts.length >= 4) {
        // Likely format: uuid (5 parts) + date (3 parts) = studentId-YYYY-MM-DD
        const dateStr = parts.slice(-3).join("-") // Last 3 parts are the date
        const studentIdStr = parts.slice(0, -3).join("-") // Everything before is the student ID
        query = query.eq("student_id", studentIdStr).eq("class_date", dateStr)
      } else {
        return NextResponse.json(
          { error: "Invalid attendance identifier format" },
          { status: 400 },
        )
      }
    } else {
      return NextResponse.json(
        { error: "Either attendanceId or (studentId + classDate) are required" },
        { status: 400 },
      )
    }

    const { data, error } = await query.select().single()

    if (error) {
      console.error("[v0] Error updating attendance status:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("[v0] Unexpected error updating attendance status:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error occurred" },
      { status: 500 },
    )
  }
}
