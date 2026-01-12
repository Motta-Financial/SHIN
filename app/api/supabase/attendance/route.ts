import { createServiceClient } from "@/lib/supabase/service"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get("studentId")
    const studentEmail = searchParams.get("studentEmail")
    const semesterId = searchParams.get("semesterId") || "a1b2c3d4-e5f6-7890-abcd-202601120000" // Default to Spring 2026

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
        user_id,
        semester_id
      `)
      .eq("semester_id", semesterId) // Filter by semester
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
      semesterId: record.semester_id, // Include semester_id in the response
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

    const semesterId = "a1b2c3d4-e5f6-7890-abcd-202601120000"

    const { data: passwordData, error: passwordError } = await supabase
      .from("attendance_passwords")
      .select("password, id")
      .eq("week_number", weekNumber)
      .eq("semester_id", semesterId)
      .single()

    if (passwordError || !passwordData) {
      return NextResponse.json(
        { error: "No attendance password set for this week. Please contact your instructor." },
        { status: 400 },
      )
    }

    // Validate the provided password matches the stored password
    if (password !== passwordData.password) {
      return NextResponse.json(
        { error: "Invalid password. Please check the password shared in class." },
        { status: 400 },
      )
    }

    // Check if attendance already submitted for this week
    const { data: existingAttendance } = await supabase
      .from("attendance")
      .select("*")
      .eq("student_id", studentId)
      .eq("week_number", weekNumber)
      .eq("semester_id", semesterId) // Check for current semester only
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
        semester_id: semesterId, // Store semester_id with attendance
        notes: `Submitted at ${new Date().toISOString()}`,
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
