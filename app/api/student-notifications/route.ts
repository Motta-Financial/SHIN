import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function getSupabaseClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

function isValidUUID(str: string | null): boolean {
  if (!str) return false
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentIdParam = searchParams.get("studentId")
    const clinicIdParam = searchParams.get("clinicId")

    const studentId = isValidUUID(studentIdParam) ? studentIdParam : null
    const clinicId = isValidUUID(clinicIdParam) ? clinicIdParam : null

    // Don't cache student notifications to ensure fresh data

    const supabase = getSupabaseClient()

    // Build the query to fetch notifications for:
    // 1. Broadcast notifications (student_id IS NULL AND clinic_id IS NULL)
    // 2. Student-specific notifications (student_id = studentId)
    // 3. Clinic-specific notifications (clinic_id = clinicId)
    let query = supabase
      .from("notifications")
      .select("*")
      .eq("target_audience", "students")
      .order("created_at", { ascending: false })
      .limit(50)

    // Build OR filter for different notification types
    const filters: string[] = []
    
    // Always include broadcast notifications (both student_id and clinic_id are null)
    filters.push("and(student_id.is.null,clinic_id.is.null)")
    
    if (studentId) {
      filters.push(`student_id.eq.${studentId}`)
    }
    if (clinicId) {
      filters.push(`clinic_id.eq.${clinicId}`)
    }
    
    console.log("[v0] Student-notifications API - Filters:", filters.join(","))
    
    if (filters.length > 0) {
      query = query.or(filters.join(","))
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Student-notifications API - Error:", error.message, error.code)
      return NextResponse.json({ notifications: [] })
    }
    
    console.log("[v0] Student-notifications API - Query successful, count:", data?.length || 0)

    const response = { notifications: data || [] }
    console.log(`[v0] Student-notifications API - Fetched notifications count: ${data?.length || 0}`)

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error in student-notifications GET:", error)
    return NextResponse.json({ notifications: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    const body = await request.json()
    const { studentId, clinicId, title, message, type, createdByUserId } = body

    const { data, error } = await supabase
      .from("notifications")
      .insert({
        student_id: studentId || null,
        clinic_id: clinicId || null,
        title,
        message,
        type: type || "announcement",
        target_audience: "students",
        created_by_user_id: createdByUserId || null,
        is_read: false,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating notification:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, notification: data })
  } catch (error) {
    console.error("Error in student-notifications POST:", error)
    return NextResponse.json({ error: "Failed to create notification" }, { status: 500 })
  }
}
