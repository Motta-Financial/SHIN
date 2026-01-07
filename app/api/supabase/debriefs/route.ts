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
        student_email,
        client_name,
        clinic,
        hours_worked,
        work_summary,
        questions,
        week_ending,
        week_number,
        semester_id,
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

    const { data: mappingData, error: mappingError } = await supabase.from("v_complete_mapping").select("*")

    if (mappingError) {
      console.log("[v0] Error fetching v_complete_mapping:", mappingError.message)
    }

    const studentMap = new Map<string, any>()
    if (mappingData) {
      for (const row of mappingData) {
        // Deduplicate by student_id
        if (!studentMap.has(row.student_id)) {
          studentMap.set(row.student_id, row)
        }
      }
    }

    const formattedDebriefs = (debriefs || []).map((debrief) => {
      const studentData = studentMap.get(debrief.student_id)

      return {
        id: debrief.id,
        studentId: debrief.student_id,
        studentName: studentData?.student_name || null,
        studentEmail: studentData?.student_email || debrief.student_email,
        clientName: studentData?.client_name || debrief.client_name,
        clinic: studentData?.student_clinic_name || debrief.clinic,
        // Director info from v_complete_mapping
        clinicDirector: studentData?.clinic_director_name || null,
        clinicDirectorEmail: null, // Not available in v_complete_mapping
        clientDirector: studentData?.client_director_name || null,
        clientDirectorEmail: null, // Not available in v_complete_mapping
        // Debrief specific data
        hoursWorked: debrief.hours_worked || 0,
        workSummary: debrief.work_summary,
        questions: debrief.questions,
        questionType: (debrief as any).question_type || "clinic",
        weekEnding: debrief.week_ending,
        weekNumber: debrief.week_number,
        semester: null,
        semesterId: debrief.semester_id,
        status: debrief.status,
        createdAt: debrief.created_at,
      }
    })

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

    let studentData = null
    if (body.studentId) {
      const { data } = await supabase
        .from("v_complete_mapping")
        .select("*")
        .eq("student_id", body.studentId)
        .limit(1)
        .maybeSingle()
      studentData = data
    } else if (body.studentEmail) {
      const { data } = await supabase
        .from("v_complete_mapping")
        .select("*")
        .eq("student_email", body.studentEmail)
        .limit(1)
        .maybeSingle()
      studentData = data
    }

    const insertData: Record<string, any> = {
      student_id: body.studentId || studentData?.student_id,
      student_email: studentData?.student_email || body.studentEmail,
      client_name: studentData?.client_name || body.clientName,
      clinic: studentData?.student_clinic_name || body.clinic,
      hours_worked: body.hoursWorked || 0,
      work_summary: body.workSummary,
      questions: body.questions,
      week_ending: body.weekEnding || new Date().toISOString().split("T")[0],
      semester_id: body.semesterId || null,
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
