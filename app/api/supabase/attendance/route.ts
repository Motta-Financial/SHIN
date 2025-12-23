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
