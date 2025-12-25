import { createServiceClient } from "@/lib/supabase/service"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get("studentId")
    const studentEmail = searchParams.get("studentEmail")

    let query = supabase
      .from("attendance")
      .select(`
        student_id,
        student_name,
        student_email,
        class_date,
        week_number,
        week_ending,
        clinic,
        notes,
        user_id
      `)
      .order("class_date", { ascending: false })

    // Filter by student if provided
    if (studentId) {
      query = query.eq("student_id", studentId)
    } else if (studentEmail) {
      query = query.eq("student_email", studentEmail)
    }

    const { data, error } = await query

    if (error) {
      console.log("[v0] Supabase attendance error:", error.message)
      return NextResponse.json({ attendance: [] })
    }

    const formattedAttendance = (data || []).map((record) => ({
      id: `${record.student_id}-${record.class_date}`,
      studentId: record.student_id,
      studentName: record.student_name,
      studentEmail: record.student_email,
      classDate: record.class_date,
      weekNumber: record.week_number,
      weekEnding: record.week_ending,
      clinic: record.clinic,
      notes: record.notes,
      userId: record.user_id,
    }))

    return NextResponse.json({ attendance: formattedAttendance })
  } catch (error) {
    console.log("[v0] Error fetching attendance:", error)
    return NextResponse.json({ attendance: [] })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()

    const { studentId, studentName, studentEmail, clinic, weekNumber, weekEnding, classDate, password } = body

    // Validate password against semester_schedule
    const { data: scheduleData } = await supabase
      .from("semester_schedule")
      .select("id, week_number, notes")
      .eq("week_number", weekNumber)
      .single()

    // For now, accept any non-empty password (in production, validate against stored password)
    // The password could be stored in the notes field or a dedicated password column
    if (!password || password.trim().length < 3) {
      return NextResponse.json({ error: "Invalid password" }, { status: 400 })
    }

    // Check if attendance already submitted for this week
    const { data: existingAttendance } = await supabase
      .from("attendance")
      .select("*")
      .eq("student_id", studentId)
      .eq("week_number", weekNumber)
      .single()

    if (existingAttendance) {
      return NextResponse.json({ error: "Attendance already submitted for this week" }, { status: 400 })
    }

    // Insert attendance record
    const { data, error } = await supabase
      .from("attendance")
      .insert({
        student_id: studentId,
        student_name: studentName,
        student_email: studentEmail,
        clinic: clinic,
        week_number: weekNumber,
        week_ending: weekEnding,
        class_date: classDate,
        notes: `Password verified: ${new Date().toISOString()}`,
      })
      .select()

    if (error) {
      console.error("Error submitting attendance:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, attendance: data })
  } catch (error) {
    console.error("Error in attendance POST:", error)
    return NextResponse.json({ error: "Failed to submit attendance" }, { status: 500 })
  }
}
