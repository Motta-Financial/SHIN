import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const searchParams = request.nextUrl.searchParams
    const studentId = searchParams.get("studentId")
    const clinic = searchParams.get("clinic")
    const status = searchParams.get("status")
    const clientId = searchParams.get("clientId")
    const forQueue = searchParams.get("forQueue") // For director queue view

    let query = supabase.from("meeting_requests").select("*")
    
    // For queue view, sort by created_at ascending (first come first serve)
    if (forQueue === "true") {
      query = query.order("created_at", { ascending: true })
    } else {
      query = query.order("created_at", { ascending: false })
    }

    if (studentId) {
      query = query.eq("student_id", studentId)
    }

    if (clinic) {
      query = query.ilike("clinic", `%${clinic}%`)
    }

    if (status) {
      query = query.eq("status", status)
    }

    if (clientId) {
      query = query.eq("client_id", clientId)
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
      notes: r.notes,
      debriefNotes: r.debrief_notes,
      clientId: r.client_id,
      clientName: r.client_name,
      startedAt: r.started_at,
      completedAt: r.completed_at,
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

    const { studentId, studentName, studentEmail, clinic, subject, message, preferredDates, clientId, clientName } = body

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
        client_id: clientId || null,
        client_name: clientName || null,
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

    // Create notification for the student's clinic director(s)
    try {
      // Get the student's clinic info
      const { data: clinicData } = await supabase
        .from("clinics")
        .select("id")
        .ilike("name", `%${clinic}%`)
        .limit(1)
        .maybeSingle()

      if (clinicData?.id) {
        // Get directors assigned to this clinic
        const { data: clinicDirectors } = await supabase
          .from("clinic_directors")
          .select("director_id")
          .eq("clinic_id", clinicData.id)

        if (clinicDirectors && clinicDirectors.length > 0) {
          // Create notification for each clinic director
          const notifications = clinicDirectors.map((cd) => ({
            type: "meeting_request",
            title: `Meeting Request from ${studentName}`,
            message: `[${clinic}] ${subject || "Meeting request submitted"}`,
            student_id: studentId,
            student_name: studentName,
            student_email: studentEmail,
            clinic_id: clinicData.id,
            director_id: cd.director_id,
            related_id: data.id,
            is_read: false,
            created_at: new Date().toISOString(),
          }))

          await supabase.from("notifications").insert(notifications)
        }
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
    const { id, status, notes, debriefNotes } = body

    // Build the update object dynamically
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (status !== undefined) {
      updateData.status = status
      
      // Set timestamps based on status
      if (status === "in_progress") {
        updateData.started_at = new Date().toISOString()
      } else if (status === "completed") {
        updateData.completed_at = new Date().toISOString()
      }
    }

    if (notes !== undefined) {
      updateData.notes = notes
    }

    if (debriefNotes !== undefined) {
      updateData.debrief_notes = debriefNotes
    }

    const { data: updatedRequest, error } = await supabase
      .from("meeting_requests")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // If status changed to in_progress, notify the next group in queue that they're next
    if (status === "in_progress" && updatedRequest) {
      try {
        // Get the next pending request (after the current one by created_at)
        const { data: nextInQueue } = await supabase
          .from("meeting_requests")
          .select("*")
          .eq("status", "pending")
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle()

        if (nextInQueue) {
          // Notify the next group they're up next
          await supabase.from("notifications").insert({
            type: "meeting_queue",
            title: "You're Next in the Meeting Queue",
            message: `Your group is next in line for a meeting with the director. Please be prepared.`,
            student_id: nextInQueue.student_id,
            student_name: nextInQueue.student_name,
            student_email: nextInQueue.student_email,
            related_id: nextInQueue.id,
            target_audience: "students",
            is_read: false,
            created_at: new Date().toISOString(),
          })
        }
      } catch (notifError) {
        console.error("Error creating queue notification:", notifError)
      }
    }

    // If meeting completed with debrief notes, create activity record for My Team
    if (status === "completed" && debriefNotes && updatedRequest) {
      try {
        // Create a notification/activity for the student team
        await supabase.from("notifications").insert({
          type: "meeting_debrief",
          title: "Meeting Debrief Notes Available",
          message: debriefNotes.substring(0, 200) + (debriefNotes.length > 200 ? "..." : ""),
          student_id: updatedRequest.student_id,
          student_name: updatedRequest.student_name,
          student_email: updatedRequest.student_email,
          client_id: updatedRequest.client_id,
          related_id: updatedRequest.id,
          target_audience: "students",
          is_read: false,
          created_at: new Date().toISOString(),
        })
      } catch (activityError) {
        console.error("Error creating debrief activity:", activityError)
      }
    }

    return NextResponse.json({ success: true, request: updatedRequest })
  } catch (error) {
    console.error("Error in meeting-requests PATCH:", error)
    return NextResponse.json({ error: "Failed to update meeting request" }, { status: 500 })
  }
}
