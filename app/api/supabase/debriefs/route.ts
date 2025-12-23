import { createServiceClient } from "@/lib/supabase/service"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get("studentId")
    const studentEmail = searchParams.get("studentEmail")

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
        semester,
        status,
        created_at
      `)
      .order("week_ending", { ascending: false })

    // Filter by student if provided
    if (studentId) {
      query = query.eq("student_id", studentId)
    } else if (studentEmail) {
      query = query.eq("student_email", studentEmail)
    }

    const { data: debriefs, error } = await query

    if (error) {
      console.log("[v0] Supabase debriefs error:", error.message)
      return NextResponse.json({ debriefs: [] })
    }

    const formattedDebriefs = (debriefs || []).map((debrief) => ({
      id: debrief.id,
      studentId: debrief.student_id,
      studentName: debrief.student_name,
      studentEmail: debrief.student_email,
      clientName: debrief.client_name,
      clinic: debrief.clinic,
      hoursWorked: debrief.hours_worked || 0,
      workSummary: debrief.work_summary,
      questions: debrief.questions,
      questionType: (debrief as any).question_type || "clinic", // Default to clinic if column doesn't exist
      weekEnding: debrief.week_ending,
      semester: debrief.semester,
      status: debrief.status,
      createdAt: debrief.created_at,
    }))

    return NextResponse.json({ debriefs: formattedDebriefs })
  } catch (error) {
    console.log("[v0] Error fetching debriefs:", error)
    return NextResponse.json({ debriefs: [] })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()

    const insertData: Record<string, any> = {
      student_id: body.studentId,
      student_name: body.studentName,
      student_email: body.studentEmail,
      client_name: body.clientName,
      clinic: body.clinic,
      hours_worked: body.hoursWorked || 0,
      work_summary: body.workSummary,
      questions: body.questions,
      week_ending: body.weekEnding || new Date().toISOString().split("T")[0],
      semester: body.semester || "Fall 2025",
      status: "submitted",
    }

    const { data, error } = await supabase.from("debriefs").insert(insertData).select().single()

    if (error) {
      console.log("[v0] Error creating debrief:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, debrief: data })
  } catch (error) {
    console.log("[v0] Error in POST debriefs:", error)
    return NextResponse.json({ error: "Failed to create debrief" }, { status: 500 })
  }
}
