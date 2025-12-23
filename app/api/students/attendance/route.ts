import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// GET - Fetch attendance for a student
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get("studentId")
    const studentEmail = searchParams.get("email")

    const supabase = await createClient()

    let query = supabase
      .from("attendance")
      .select(`
        student_id,
        student_name,
        student_email,
        week_number,
        week_ending,
        class_date,
        clinic,
        notes,
        user_id
      `)
      .order("week_ending", { ascending: false })

    if (studentId) {
      query = query.eq("student_id", studentId)
    } else if (studentEmail) {
      query = query.eq("student_email", studentEmail)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching attendance:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, attendance: data || [] })
  } catch (error) {
    console.error("[v0] Error in attendance API:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch attendance" }, { status: 500 })
  }
}

// POST - Record attendance
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { studentId, studentName, studentEmail, weekNumber, weekEnding, classDate, clinic, notes } = body

    if (!studentId || !studentName || !weekEnding) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from("attendance")
      .upsert(
        {
          student_id: studentId,
          student_name: studentName,
          student_email: studentEmail,
          week_number: weekNumber,
          week_ending: weekEnding,
          class_date: classDate,
          clinic,
          notes,
        },
        {
          onConflict: "student_id,week_ending",
        },
      )
      .select()
      .single()

    if (error) {
      console.error("[v0] Error recording attendance:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, attendance: data })
  } catch (error) {
    console.error("[v0] Error in attendance POST:", error)
    return NextResponse.json({ success: false, error: "Failed to record attendance" }, { status: 500 })
  }
}
