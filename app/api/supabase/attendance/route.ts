import { createServiceClient } from "@/lib/supabase/service"
import { NextResponse } from "next/server"
import { getCurrentSemesterId } from "@/lib/semester"
import { getCachedData, setCachedData } from "@/lib/api-cache"

export async function GET(request: Request) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get("studentId")
    const studentEmail = searchParams.get("studentEmail")
    const defaultSemesterId = await getCurrentSemesterId()
    const semesterId = searchParams.get("semesterId") || defaultSemesterId

    // Check cache first
    const cacheKey = `attendance-${semesterId}-${studentId || "all"}-${studentEmail || "none"}`
    const cached = getCachedData(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

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
        is_present,
        attendance_notes,
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
      const msg = error.message || ""
      if (msg.includes("Too Many R") || msg.includes("rate limit")) {
        return NextResponse.json({ attendance: [] }, { status: 429 })
      }
      console.log("[v0] Supabase attendance error:", msg)
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
      is_present: record.is_present,
      attendance_notes: record.attendance_notes,
      userId: record.user_id,
      semesterId: record.semester_id, // Include semester_id in the response
    }))

    const result = { attendance: formattedAttendance }
    setCachedData(cacheKey, result, 60_000) // Cache for 60 seconds
    return NextResponse.json(result)
  } catch (error: any) {
    const msg = error?.message || ""
    if (msg.includes("Too Many R") || msg.includes("Unexpected token") || msg.includes("rate limit")) {
      return NextResponse.json({ attendance: [] }, { status: 429 })
    }
    console.log("[v0] Error fetching attendance:", error)
    return NextResponse.json({ attendance: [] })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()

    const { studentId, studentName, studentEmail, clinic, weekNumber, weekEnding, classDate, password } = body

    const semesterId = await getCurrentSemesterId()

    if (!studentId || !studentName || !studentEmail || !clinic || !weekNumber) {
      return NextResponse.json(
        { error: "Missing required fields. Please ensure you have a clinic assigned." },
        { status: 400 },
      )
    }

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

    const { data: existingAttendance } = await supabase
      .from("attendance")
      .select("*")
      .eq("student_id", studentId)
      .eq("week_number", weekNumber)
      .eq("semester_id", semesterId)
      .maybeSingle()

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
        semester_id: semesterId,
        is_present: true,
        attendance_notes: `Submitted at ${new Date().toISOString()}`,
      })
      .select()

    if (error) {
      console.error("Error submitting attendance:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Create notification for the student's clinic director
    try {
      // Get the student's clinic info from students_current, then director from directors_current
      const { data: studentRow } = await supabase
        .from("students_current")
        .select("clinic_id, clinic")
        .eq("id", studentId)
        .maybeSingle()

      // Get director for this clinic
      let studentData: any = null
      if (studentRow?.clinic_id) {
        const { data: dirRow } = await supabase
          .from("directors_current")
          .select("id")
          .eq("clinic_id", studentRow.clinic_id)
          .maybeSingle()
        studentData = {
          clinic_director_id: dirRow?.id || null,
          clinic_id: studentRow.clinic_id,
          student_clinic_name: studentRow.clinic,
        }
      }

      if (studentData?.clinic_director_id) {
        await supabase.from("notifications").insert({
          type: "attendance",
          title: `${studentName} marked attendance`,
          message: `Attendance submitted for Week ${weekNumber}`,
          student_id: studentId,
          student_name: studentName,
          student_email: studentEmail,
          clinic_id: studentData.clinic_id,
          director_id: studentData.clinic_director_id,
          is_read: false,
          created_at: new Date().toISOString(),
        })
      }
    } catch (notifError) {
      // Don't fail the attendance submission if notification fails
      console.log("[v0] Error creating attendance notification:", notifError)
    }

    return NextResponse.json({ success: true, attendance: data })
  } catch (error) {
    console.error("Error in attendance POST:", error)
    return NextResponse.json({ error: "Failed to submit attendance" }, { status: 500 })
  }
}
