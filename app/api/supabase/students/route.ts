import { createServiceClient } from "@/lib/supabase/service"
import { NextResponse } from "next/server"
import { getCached, setCache, LONG_TTL } from "@/lib/api-cache"
import { supabaseQueryWithRetry } from "@/lib/supabase-retry"

// API endpoint for fetching students from the students table
export async function GET() {
  try {
    // Check cache first
    const cacheKey = "supabase-students"
    const cached = getCached<{ students: unknown[] }>(cacheKey)
    if (cached) {
      console.log("[v0] Students API - Returning cached response")
      return NextResponse.json(cached)
    }

    const supabase = createServiceClient()

    // Using students_current view for current semester data with retry
    const { data, error } = await supabaseQueryWithRetry(
      () => supabase
        .from("students_current")
        .select(`
          id,
          first_name,
          last_name,
          email,
          status,
          is_team_leader,
          clinic_id,
          clinics:clinic_id (
            id,
            name
          )
        `)
        .eq("status", "active")
        .order("last_name", { ascending: true }),
      3,
      "students_current",
    )

    if (error) {
      return NextResponse.json({ students: [] })
    }

    const students = (data || []).map((student: any) => ({
      id: student.id,
      first_name: student.first_name,
      last_name: student.last_name,
      email: student.email,
      status: student.status,
      is_team_leader: student.is_team_leader,
      clinic_id: student.clinic_id,
      clinic_name: student.clinics?.name || "Unknown Clinic",
    }))

    console.log("[v0] Fetched students count:", students.length)
    const response = { students }
    setCache(cacheKey, response, LONG_TTL)
    return NextResponse.json(response)
  } catch (error) {
    console.error("[v0] Error fetching students:", error)
    return NextResponse.json({ students: [] })
  }
}
