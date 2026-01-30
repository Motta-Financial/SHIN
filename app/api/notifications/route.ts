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

    const { type, title, message, studentId, studentName, studentEmail, clinic, questionType } = body

    // Get directors for this clinic to notify them
    const { data: directors } = await supabase
      .from("directors")
      .select("id, full_name, email, clinic_id")
      .order("full_name")

    // Get clinic ID for matching
    const { data: clinicData } = await supabase.from("clinics").select("id, name").ilike("name", `%${clinic}%`).single()

    // Create notification for each relevant director
    const notifications = []

    if (directors && directors.length > 0) {
      for (const director of directors) {
        // If question type is "clinic", notify directors of that clinic
        // If question type is "client", notify all directors
        const shouldNotify =
          questionType === "client" || !clinicData?.id || director.clinic_id === clinicData?.id || !director.clinic_id

        if (shouldNotify) {
          notifications.push({
            type,
            title,
            message,
            student_id: studentId,
            student_name: studentName,
            student_email: studentEmail,
            clinic_id: clinicData?.id || null,
            director_id: director.id,
            is_read: false,
            created_at: new Date().toISOString(),
          })
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
        clinic_id: clinicData?.id || null,
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
