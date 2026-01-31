import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const searchParams = request.nextUrl.searchParams
    const studentId = searchParams.get("studentId")
    const clinic = searchParams.get("clinic")
    const status = searchParams.get("status")

    let query = supabase.from("meeting_requests").select("*").order("created_at", { ascending: false })

    if (studentId) {
      query = query.eq("student_id", studentId)
    }

    if (clinic) {
      query = query.ilike("clinic", `%${clinic}%`)
    }

    if (status) {
      query = query.eq("status", status)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching meeting requests:", error.message)
      return NextResponse.json({ requests: [] })
    }

    const formattedRequests = (data || []).map((r) => ({
      id: r.id,
      studentId: r.student_id,
      studentName: r.student_name,
      studentEmail: r.student_email,
      clinic: r.clinic,
      subject: r.subject,
      message: r.message,
      preferredDates: r.preferred_dates,
      status: r.status,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }))

    return NextResponse.json({ requests: formattedRequests })
  } catch (error) {
    console.error("Error in meeting-requests API:", error)
    return NextResponse.json({ requests: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()

    const { studentId, studentName, studentEmail, clinic, subject, message, preferredDates } = body

    const { data, error } = await supabase
      .from("meeting_requests")
      .insert({
        student_id: studentId,
        student_name: studentName,
        student_email: studentEmail,
        clinic: clinic,
        subject: subject,
        message: message,
        preferred_dates: preferredDates || [],
        status: "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating meeting request:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Create notification for the student's clinic director
    try {
      // Get the student's clinic and director info
      const { data: clinicData } = await supabase
        .from("clinics")
        .select("id, director_id")
        .ilike("name", `%${clinic}%`)
        .limit(1)
        .maybeSingle()

      if (clinicData?.director_id) {
        await supabase.from("notifications").insert({
          type: "meeting_request",
          title: `${studentName} requested a meeting`,
          message: subject ? `Subject: ${subject}` : "Meeting request submitted",
          student_id: studentId,
          student_name: studentName,
          student_email: studentEmail,
          clinic_id: clinicData.id,
          director_id: clinicData.director_id,
          related_id: data.id,
          is_read: false,
          created_at: new Date().toISOString(),
        })
      }
    } catch (notifError) {
      // Don't fail the meeting request creation if notification fails
      console.log("[v0] Error creating meeting request notification:", notifError)
    }

    return NextResponse.json({ success: true, request: data })
  } catch (error) {
    console.error("Error in meeting-requests POST:", error)
    return NextResponse.json({ error: "Failed to create meeting request" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()
    const { id, status, notes } = body

    const { error } = await supabase
      .from("meeting_requests")
      .update({
        status,
        notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to update meeting request" }, { status: 500 })
  }
}
