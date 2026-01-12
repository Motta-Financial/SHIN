import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getCachedData, setCachedData } from "@/lib/api-cache"

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

    const cacheKey = `student-notifications:${studentId || "all"}:${clinicId || "all"}`
    const cached = getCachedData(cacheKey)
    if (cached) {
      console.log("[v0] Student-notifications API - Returning cached response")
      return NextResponse.json(cached)
    }

    const supabase = getSupabaseClient()

    let query = supabase
      .from("notifications")
      .select("*")
      .eq("target_audience", "students")
      .order("created_at", { ascending: false })
      .limit(20)

    if (studentId && clinicId) {
      query = query.or(`student_id.eq.${studentId},student_id.is.null,clinic_id.eq.${clinicId}`)
    } else if (studentId) {
      query = query.or(`student_id.eq.${studentId},student_id.is.null`)
    } else if (clinicId) {
      query = query.or(`clinic_id.eq.${clinicId},clinic_id.is.null`)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching student notifications:", error)
      return NextResponse.json({ notifications: [] })
    }

    const response = { notifications: data || [] }
    setCachedData(cacheKey, response)
    console.log(`[v0] Student-notifications API - Fetched and cached notifications count: ${data?.length || 0}`)

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
    const { studentId, clinicId, title, message, type, createdBy, createdById } = body

    const { data, error } = await supabase
      .from("notifications")
      .insert({
        student_id: studentId || null,
        clinic_id: clinicId || null,
        title,
        message,
        type: type || "announcement",
        target_audience: "students",
        created_by: createdBy,
        created_by_id: createdById,
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
