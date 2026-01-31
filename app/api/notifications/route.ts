import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"

function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const clinic = searchParams.get("clinic")
    const directorId = searchParams.get("directorId")

    let query = supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(50)

    if (directorId && directorId !== "all" && directorId !== "undefined" && isValidUUID(directorId)) {
      query = query.eq("director_id", directorId)
    } else if (clinic && clinic !== "all" && clinic !== "undefined") {
      query = query.ilike("clinic", `%${clinic}%`)
    }

    const { data: notifications, error } = await query

    if (error) {
      console.error("Error fetching notifications:", error.message)
      return NextResponse.json({ notifications: [] })
    }

    return NextResponse.json({ notifications: notifications || [] })
  } catch (error) {
    console.error("Error in notifications API:", error)
    return NextResponse.json({ notifications: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()

    const { 
      type, 
      title, 
      message, 
      studentId, 
      studentName, 
      studentEmail, 
      clinic, 
      clinicId,
      questionType,
      targetAudience,
      relatedId,
      createdByUserId,
      directorId 
    } = body

    // If this is a student-targeted notification, create it directly
    if (targetAudience === "students") {
      const { data, error } = await supabase.from("notifications").insert({
        type,
        title,
        message,
        student_id: studentId,
        student_name: studentName,
        student_email: studentEmail,
        clinic_id: clinicId || null,
        target_audience: "students",
        related_id: relatedId,
        created_by_user_id: createdByUserId,
        is_read: false,
        created_at: new Date().toISOString(),
      }).select()

      if (error) {
        console.error("Error creating student notification:", error.message)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, notifications: data })
    }

    // Director-targeted notifications
    // Get clinic ID for matching
    let resolvedClinicId = clinicId
    if (!resolvedClinicId && clinic) {
      const { data: clinicData } = await supabase.from("clinics").select("id, name").ilike("name", `%${clinic}%`).single()
      resolvedClinicId = clinicData?.id
    }

    // Create notification for each relevant director based on question type
    const notifications = []
    
    // For client questions, find directors assigned to the client
    if (questionType === "client" && body.clientId) {
      const { data: clientDirectors } = await supabase
        .from("client_directors")
        .select("director_id")
        .eq("client_id", body.clientId)
      
      if (clientDirectors && clientDirectors.length > 0) {
        for (const cd of clientDirectors) {
          notifications.push({
            type,
            title,
            message,
            student_id: studentId,
            student_name: studentName,
            student_email: studentEmail,
            clinic_id: resolvedClinicId || null,
            director_id: cd.director_id,
            target_audience: targetAudience || "directors",
            related_id: relatedId,
            created_by_user_id: createdByUserId,
            is_read: false,
            created_at: new Date().toISOString(),
          })
        }
      }
    }
    
    // For clinic questions, find directors assigned to the clinic
    if (questionType === "clinic" && resolvedClinicId) {
      const { data: clinicDirectors } = await supabase
        .from("clinic_directors")
        .select("director_id")
        .eq("clinic_id", resolvedClinicId)
      
      if (clinicDirectors && clinicDirectors.length > 0) {
        for (const cd of clinicDirectors) {
          notifications.push({
            type,
            title,
            message,
            student_id: studentId,
            student_name: studentName,
            student_email: studentEmail,
            clinic_id: resolvedClinicId,
            director_id: cd.director_id,
            target_audience: targetAudience || "directors",
            related_id: relatedId,
            created_by_user_id: createdByUserId,
            is_read: false,
            created_at: new Date().toISOString(),
          })
        }
      }
    }
    
    // Fallback: If no specific directors found via relationships, use the old logic
    if (notifications.length === 0) {
      const { data: directors } = await supabase
        .from("directors")
        .select("id, full_name, email, clinic_id")
        .order("full_name")
      
      if (directors && directors.length > 0) {
        for (const director of directors) {
          // Only notify directors of the same clinic
          const shouldNotify = !resolvedClinicId || director.clinic_id === resolvedClinicId || !director.clinic_id

          if (shouldNotify) {
            notifications.push({
              type,
              title,
              message,
              student_id: studentId,
              student_name: studentName,
              student_email: studentEmail,
              clinic_id: resolvedClinicId || null,
              director_id: directorId || director.id,
              target_audience: targetAudience || "directors",
              related_id: relatedId,
              created_by_user_id: createdByUserId,
              is_read: false,
              created_at: new Date().toISOString(),
            })
          }
        }
      }
    }

    // If no specific directors found, create a general notification
    if (notifications.length === 0) {
      notifications.push({
        type,
        title,
        message,
        student_id: studentId,
        student_name: studentName,
        student_email: studentEmail,
        clinic_id: resolvedClinicId || null,
        target_audience: targetAudience || "directors",
        related_id: relatedId,
        created_by_user_id: createdByUserId,
        is_read: false,
        created_at: new Date().toISOString(),
      })
    }

    const { data, error } = await supabase.from("notifications").insert(notifications).select()

    if (error) {
      console.error("Error creating notification:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, notifications: data })
  } catch (error) {
    console.error("Error in notifications POST:", error)
    return NextResponse.json({ error: "Failed to create notification" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { id, is_read } = body

    const { error } = await supabase.from("notifications").update({ is_read }).eq("id", id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 })
  }
}
