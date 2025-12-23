import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// GET - Fetch meeting requests for a student
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get("studentId")

    const supabase = await createClient()

    let query = supabase
      .from("meeting_requests")
      .select(`
        id,
        student_id,
        student_name,
        student_email,
        clinic,
        subject,
        message,
        preferred_dates,
        status,
        created_at,
        updated_at
      `)
      .order("created_at", { ascending: false })

    if (studentId) {
      query = query.eq("student_id", studentId)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching meeting requests:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, meetingRequests: data || [] })
  } catch (error) {
    console.error("[v0] Error in meeting requests API:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch meeting requests" }, { status: 500 })
  }
}

// POST - Create a new meeting request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { studentId, studentName, studentEmail, clinic, subject, message, preferredDates } = body

    if (!studentId || !studentName || !subject) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from("meeting_requests")
      .insert({
        student_id: studentId,
        student_name: studentName,
        student_email: studentEmail,
        clinic,
        subject,
        message,
        preferred_dates: preferredDates || [],
        status: "pending",
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating meeting request:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, meetingRequest: data })
  } catch (error) {
    console.error("[v0] Error in meeting request POST:", error)
    return NextResponse.json({ success: false, error: "Failed to create meeting request" }, { status: 500 })
  }
}
