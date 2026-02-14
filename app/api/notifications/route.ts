import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"

function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

export async function GET(request: NextRequest) {
  try {
    // Use service client to bypass RLS for reads
    const serviceSupabase = createServiceClient()
    // Also get the authenticated user so we can scope director queries
    const authSupabase = await createClient()
    const { data: { user } } = await authSupabase.auth.getUser()

    const searchParams = request.nextUrl.searchParams
    const clinic = searchParams.get("clinic")
    const directorId = searchParams.get("directorId")
    const studentId = searchParams.get("studentId")
    const targetAudience = searchParams.get("target_audience")

    // Retry wrapper for Supabase rate limits
    async function queryWithRetry(buildQuery: () => any, maxRetries = 3): Promise<{ data: any[]; error: any }> {
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const result = await buildQuery()
          if (result.error) {
            const msg = result.error?.message?.toLowerCase() || ""
            if ((msg.includes("too many") || msg.includes("rate limit")) && attempt < maxRetries - 1) {
              await new Promise((r) => setTimeout(r, (attempt + 1) * 1500))
              continue
            }
          }
          return result
        } catch (err: any) {
          const msg = err?.message?.toLowerCase() || ""
          if ((msg.includes("too many") || msg.includes("unexpected token")) && attempt < maxRetries - 1) {
            await new Promise((r) => setTimeout(r, (attempt + 1) * 1500))
            continue
          }
          return { data: null, error: err }
        }
      }
      return { data: null, error: "Max retries" }
    }

    // If fetching for a specific student
    if (studentId && isValidUUID(studentId)) {
      const { data: notifications, error } = await queryWithRetry(() =>
        serviceSupabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(50)
          .eq("student_id", studentId).eq("target_audience", "students")
      )
      if (error) {
        return NextResponse.json({ notifications: [] })
      }
      return NextResponse.json({ notifications: notifications || [] })
    }

    // Resolve the effective director ID:
    // 1. Use explicit directorId param if it's a valid UUID
    // 2. Otherwise fall back to the authenticated user's ID
    let effectiveDirectorId: string | null = null
    if (directorId && directorId !== "all" && directorId !== "undefined" && isValidUUID(directorId)) {
      effectiveDirectorId = directorId
    } else if (user?.id) {
      effectiveDirectorId = user.id
    }

    // Build query for director/general views
    const { data: notifications, error } = await queryWithRetry(() => {
      let q = serviceSupabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(50)

      if (!studentId || targetAudience === "directors") {
        q = q.eq("target_audience", "directors")
      }

      // Always scope to the director's own notifications
      if (effectiveDirectorId) {
        q = q.eq("director_id", effectiveDirectorId)
      }

      // Additionally filter by clinic if provided
      if (clinic && clinic !== "all" && clinic !== "undefined" && isValidUUID(clinic)) {
        q = q.eq("clinic_id", clinic)
      }

      return q
    })

    if (error) {
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
    
    // Get current semester ID for filtering director assignments
    let currentSemesterId: string | null = null
    const { data: appSettings } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "current_semester_id")
      .maybeSingle()
    currentSemesterId = appSettings?.value || null

    // For client questions, find directors assigned to the client
    if (questionType === "client" && body.clientId) {
      let clientDirQuery = supabase
        .from("client_directors")
        .select("director_id")
        .eq("client_id", body.clientId)
      if (currentSemesterId) clientDirQuery = clientDirQuery.eq("semester_id", currentSemesterId)
      const { data: clientDirectors } = await clientDirQuery
      
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
      let clinicDirQuery = supabase
        .from("clinic_directors")
        .select("director_id")
        .eq("clinic_id", resolvedClinicId)
      if (currentSemesterId) clinicDirQuery = clinicDirQuery.eq("semester_id", currentSemesterId)
      const { data: clinicDirectors } = await clinicDirQuery
      
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
