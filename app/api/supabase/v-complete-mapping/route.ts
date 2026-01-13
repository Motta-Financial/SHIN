import { createServiceClient } from "@/lib/supabase/service"
import { NextResponse } from "next/server"
import { getCached, setCache, getCacheKey } from "@/lib/api-cache"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const clinicId = searchParams.get("clinicId")
    const clientId = searchParams.get("clientId")
    const studentId = searchParams.get("studentId")
    const directorId = searchParams.get("directorId")
    const semesterId = searchParams.get("semesterId")
    const includeAll = searchParams.get("includeAll") === "true"

    const cacheKey = getCacheKey("v-complete-mapping", {
      clinicId: clinicId || undefined,
      clientId: clientId || undefined,
      studentId: studentId || undefined,
      directorId: directorId || undefined,
      semesterId: semesterId || undefined,
      includeAll: includeAll.toString(),
    })
    const cached = getCached<{ success: boolean; data: any[]; records: any[]; mappings: any[] }>(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    const supabase = createServiceClient()

    // Get active semester if not specified and not including all
    let activeSemesterId = semesterId
    if (!activeSemesterId && !includeAll) {
      try {
        const { data: activeSemester } = await supabase
          .from("semester_config")
          .select("id")
          .eq("is_active", true)
          .maybeSingle()
        activeSemesterId = activeSemester?.id || null
      } catch (err) {
        console.error("[v0] Error fetching active semester:", err)
      }
    }

    let query = supabase.from("v_complete_mapping").select("*")

    // Apply semester filter by default (Spring 2026)
    if (activeSemesterId) {
      query = query.eq("semester_id", activeSemesterId)
    }

    // Apply filters based on provided parameters
    if (clinicId) {
      query = query.eq("student_clinic_id", clinicId)
    }
    if (clientId) {
      query = query.eq("client_id", clientId)
    }
    if (studentId) {
      query = query.eq("student_id", studentId)
    }
    if (directorId) {
      query = query.or(`clinic_director_id.eq.${directorId},client_director_id.eq.${directorId}`)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching v_complete_mapping:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const response = {
      success: true,
      data: data || [],
      records: data || [],
      mappings: data || [],
    }
    setCache(cacheKey, response)
    return NextResponse.json(response)
  } catch (err) {
    console.error("Error in v-complete-mapping route:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
