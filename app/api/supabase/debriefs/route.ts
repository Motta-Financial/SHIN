import { createServiceClient } from "@/lib/supabase/service"
import { NextResponse } from "next/server"
import { getCachedData, setCachedData } from "@/lib/api-cache"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get("studentId")
    const studentEmail = searchParams.get("studentEmail")
    const semesterId = searchParams.get("semesterId")
    const includeAll = searchParams.get("includeAll") === "true"

    const cacheKey = `debriefs:${studentId || ""}:${studentEmail || ""}:${semesterId || ""}:${includeAll}`
    const cached = getCachedData(cacheKey)
    if (cached) {
      console.log("[v0] Debriefs API - Returning cached response")
      return NextResponse.json(cached)
    }

    let supabase
    try {
      supabase = createServiceClient()
    } catch (credError) {
      console.log("[v0] Supabase service client error:", credError)
      return NextResponse.json({ debriefs: [], error: "Database not configured" })
    }

    let activeSemesterId = semesterId
    if (!activeSemesterId && !includeAll && !studentId && !studentEmail) {
      const { data: activeSemester } = await supabase
        .from("semester_config")
        .select("id")
        .eq("is_active", true)
        .single()
      activeSemesterId = activeSemester?.id
    }

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

    if (studentId) {
      query = query.eq("student_id", studentId)
    } else if (studentEmail) {
      query = query.eq("student_email", studentEmail)
    }

    if (activeSemesterId && !studentId && !studentEmail) {
      query = query.eq("semester_id", activeSemesterId)
    }

    const { data: debriefs, error } = await query

    if (error) {
      console.log("[v0] Supabase debriefs error:", error.message)
      return NextResponse.json({ debriefs: [] })
    }

    // Use students_current view to get student info for current semester
    const { data: studentsData, error: studentsError } = await supabase
      .from("students_current")
      .select("id, email, full_name, clinic_id, clinic")

    if (studentsError) {
      console.log("[v0] Error fetching students_current:", studentsError.message)
    }

    const studentMap = new Map<string, any>()
    if (studentsData) {
      for (const row of studentsData) {
        studentMap.set(row.id, {
          student_id: row.id,
          student_email: row.email,
          student_name: row.full_name,
          clinic_id: row.clinic_id,
          student_clinic_name: row.clinic,
        })
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
        clinicDirector: studentData?.clinic_director_name || null,
        clinicDirectorEmail: null,
        clientDirector: studentData?.client_director_name || null,
        clientDirectorEmail: null,
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

    const response = { debriefs: formattedDebriefs }

    setCachedData(cacheKey, response)
    console.log("[v0] Debriefs API - Fetched and cached debriefs count:", formattedDebriefs.length)

    return NextResponse.json(response)
  } catch (error) {
    console.log("[v0] Error fetching debriefs:", error)
    return NextResponse.json({ debriefs: [] })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()
    
    console.log("[v0] Debriefs POST - Received body:", JSON.stringify({
      studentId: body.studentId,
      studentEmail: body.studentEmail,
      clinic: body.clinic,
      questions: body.questions?.substring(0, 50),
      questionType: body.questionType,
    }))

    // Use students_current view to get student data for the current semester
    let studentData = null
    if (body.studentId) {
      const { data, error: studentError } = await supabase
        .from("students_current")
        .select("id, email, full_name, clinic_id, clinic")
        .eq("id", body.studentId)
        .maybeSingle()
      if (data) {
        studentData = {
          student_id: data.id,
          student_email: data.email,
          student_name: data.full_name,
          clinic_id: data.clinic_id,
          student_clinic_name: data.clinic,
        }
      }
      if (studentError) {
        console.log("[v0] Debriefs POST - Error fetching student:", studentError.message)
      }
      console.log("[v0] Debriefs POST - Found student data:", studentData ? "yes" : "no", "clinic_id:", studentData?.clinic_id)
    } else if (body.studentEmail) {
      const { data, error: studentError } = await supabase
        .from("students_current")
        .select("id, email, full_name, clinic_id, clinic")
        .ilike("email", body.studentEmail)
        .maybeSingle()
      if (data) {
        studentData = {
          student_id: data.id,
          student_email: data.email,
          student_name: data.full_name,
          clinic_id: data.clinic_id,
          student_clinic_name: data.clinic,
        }
      }
      if (studentError) {
        console.log("[v0] Debriefs POST - Error fetching student by email:", studentError.message)
      }
    }

    // Get current semester ID if not provided - use service client to avoid RLS issues
    let semesterId = body.semesterId
    if (!semesterId) {
      // Try to get from app_settings using the service client
      const { data: appSettings } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "current_semester_id")
        .maybeSingle()
      
      semesterId = appSettings?.value || "a1b2c3d4-e5f6-7890-abcd-202601120000"
    }
    
    if (!semesterId) {
      console.log("[v0] Error: No semester_id available for debrief creation")
      return NextResponse.json({ error: "No active semester found" }, { status: 400 })
    }

    // Get clinic_id from student data - this is REQUIRED for notifications and director visibility
    const clinicId = studentData?.clinic_id || body.clinicId || null
    
    if (!clinicId) {
      console.log("[v0] Warning: No clinic_id found for debrief - notifications won't be sent")
    }

    const insertData: Record<string, any> = {
      student_id: body.studentId || studentData?.student_id,
      student_email: studentData?.student_email || body.studentEmail,
      client_name: studentData?.client_name || body.clientName,
      clinic: studentData?.student_clinic_name || body.clinic,
      clinic_id: clinicId, // IMPORTANT: Include clinic_id so directors can see the debrief
      hours_worked: body.hoursWorked || 0,
      work_summary: body.workSummary,
      questions: body.questions,
      week_ending: body.weekEnding || new Date().toISOString().split("T")[0],
      semester_id: semesterId,
      status: "submitted",
    }
    
    console.log("[v0] Debriefs POST - Insert data:", JSON.stringify({
      student_id: insertData.student_id,
      student_email: insertData.student_email,
      clinic: insertData.clinic,
      semester_id: insertData.semester_id,
    }))

    const { data, error } = await supabase.from("debriefs").insert(insertData).select().single()

    if (error) {
      console.log("[v0] Error creating debrief:", error.message, "code:", error.code, "details:", error.details)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    console.log("[v0] Debriefs POST - Successfully created debrief:", data.id)

    // Create notifications for directors based on question type
    try {
      const studentName = studentData?.student_name || "A student"
      const clinic = studentData?.student_clinic_name || body.clinic || "Unknown"
      // Use the clinicId we already determined above (from studentData or body)
      const clientId = studentData?.client_id || body.clientId || null
      const weekEnding = body.weekEnding || new Date().toISOString().split("T")[0]
      const questionType = body.questionType || "clinic"
      const hasQuestion = body.questions && body.questions.trim().length > 0

      const notifications: Record<string, any>[] = []

      // If there's a question, notify the appropriate directors
      if (hasQuestion) {
        if (questionType === "client" && clientId) {
          // For client questions, notify client directors
          const { data: clientDirectors } = await supabase
            .from("client_directors")
            .select("director_id")
            .eq("client_id", clientId)

          if (clientDirectors && clientDirectors.length > 0) {
            for (const cd of clientDirectors) {
              notifications.push({
                type: "debrief_question",
                title: `Client Question from ${studentName}`,
                message: `[${studentData?.client_name || "Client"}] ${body.questions}`,
                student_id: insertData.student_id,
                student_name: studentName,
                student_email: insertData.student_email,
                clinic_id: clinicId,
                director_id: cd.director_id,
                is_read: false,
                related_id: data.id,
                created_at: new Date().toISOString(),
              })
            }
          }
        } else if (questionType === "clinic" && clinicId) {
          // For clinic questions, notify clinic directors
          const { data: clinicDirectors } = await supabase
            .from("clinic_directors")
            .select("director_id")
            .eq("clinic_id", clinicId)

          if (clinicDirectors && clinicDirectors.length > 0) {
            for (const cd of clinicDirectors) {
              notifications.push({
                type: "debrief_question",
                title: `Clinic Question from ${studentName}`,
                message: `[${clinic}] ${body.questions}`,
                student_id: insertData.student_id,
                student_name: studentName,
                student_email: insertData.student_email,
                clinic_id: clinicId,
                director_id: cd.director_id,
                is_read: false,
                related_id: data.id,
                created_at: new Date().toISOString(),
              })
            }
          }
        }
      }

      // Always notify the clinic director of the debrief submission (separate from questions)
      if (clinicId) {
        const { data: clinicDirectors } = await supabase
          .from("clinic_directors")
          .select("director_id")
          .eq("clinic_id", clinicId)

        if (clinicDirectors && clinicDirectors.length > 0) {
          for (const cd of clinicDirectors) {
            // Only add debrief submission notification if not already notified via question
            const alreadyNotified = notifications.some(n => n.director_id === cd.director_id)
            if (!alreadyNotified) {
              notifications.push({
                type: "debrief_submitted",
                title: `${studentName} submitted a debrief`,
                message: `Debrief for week ending ${weekEnding} - ${body.hoursWorked || 0} hours logged`,
                student_id: insertData.student_id,
                student_name: studentName,
                student_email: insertData.student_email,
                clinic_id: clinicId,
                director_id: cd.director_id,
                is_read: false,
                related_id: data.id,
                created_at: new Date().toISOString(),
              })
            }
          }
        }
      }

      // Insert all notifications
      if (notifications.length > 0) {
        await supabase.from("notifications").insert(notifications)
      }
    } catch (notifError) {
      // Don't fail the debrief creation if notification fails
      console.log("[v0] Error creating debrief notification:", notifError)
    }

    return NextResponse.json({ success: true, debrief: data })
  } catch (error) {
    console.log("[v0] Error in POST debriefs:", error)
    return NextResponse.json({ error: "Failed to create debrief" }, { status: 500 })
  }
}
