import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// GET - Fetch debriefs for a student
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get("studentId")
    const studentEmail = searchParams.get("email")

    const supabase = await createClient()

    let query = supabase
      .from("debriefs")
      .select(`
        id,
        student_id,
        student_name,
        student_email,
        client_name,
        clinic,
        hours_worked,
        work_summary,
        questions,
        week_ending,
        week_number,
        semester,
        status,
        date_submitted,
        reviewed_at,
        reviewed_by,
        created_at,
        updated_at
      `)
      .order("week_ending", { ascending: false })

    if (studentId) {
      query = query.eq("student_id", studentId)
    } else if (studentEmail) {
      query = query.eq("student_email", studentEmail)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching debriefs:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, debriefs: data || [] })
  } catch (error) {
    console.error("[v0] Error in debriefs API:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch debriefs" }, { status: 500 })
  }
}

// POST - Create a new debrief submission
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      studentId,
      studentName,
      studentEmail,
      clientName,
      clinic,
      hoursWorked,
      workSummary,
      questions,
      weekEnding,
      semester = "Spring 2026",
    } = body

    if (!studentId || !studentName || !clientName || !hoursWorked) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()

    const semesterStart = new Date("2026-01-12")
    const weekEndDate = new Date(weekEnding)
    const diffTime = weekEndDate.getTime() - semesterStart.getTime()
    const weekNumber = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7)) + 1

    const { data, error } = await supabase
      .from("debriefs")
      .insert({
        student_id: studentId,
        student_name: studentName,
        student_email: studentEmail,
        client_name: clientName,
        clinic,
        hours_worked: hoursWorked,
        work_summary: workSummary,
        questions,
        week_ending: weekEnding,
        week_number: weekNumber > 0 ? weekNumber : 1,
        semester,
        status: "submitted",
        date_submitted: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating debrief:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, debrief: data })
  } catch (error) {
    console.error("[v0] Error in debrief POST:", error)
    return NextResponse.json({ success: false, error: "Failed to create debrief" }, { status: 500 })
  }
}
