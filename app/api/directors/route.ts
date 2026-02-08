import { createServiceClient } from "@/lib/supabase/service"
import { NextResponse } from "next/server"
import { getCached, setCache, getCacheKey, LONG_TTL } from "@/lib/api-cache"
import { supabaseQueryWithRetry } from "@/lib/supabase-retry"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const semesterId = searchParams.get("semesterId")
    const includeAll = searchParams.get("includeAll") === "true"

    const cacheKey = getCacheKey("directors", {
      semesterId: semesterId || undefined,
      includeAll: includeAll.toString(),
    })
    const cached = getCached<{ directors: any[] }>(cacheKey)
    if (cached) {
      console.log("[v0] Directors API - Returning cached response")
      return NextResponse.json(cached)
    }

    const supabase = createServiceClient()

    // If includeAll is true, return all directors without semester filtering
    if (includeAll) {
      const { data: directors, error } = await supabase
        .from("directors")
        .select("id, full_name, email, job_title, role, clinic_id, clinic:clinics(name)")
        .order("full_name")

      if (error) {
        console.error("[v0] Error fetching all directors:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      const formattedDirectors = (directors || []).map((d: any) => ({
        id: d.id,
        full_name: d.full_name,
        email: d.email,
        job_title: d.job_title,
        role: d.role,
        clinic_id: d.clinic_id,
        clinic: d.clinic?.name || "Unknown Clinic",
      }))

      const response = { directors: formattedDirectors }
      setCache(cacheKey, response)
      return NextResponse.json(response)
    }

    // Get active semester if not provided
    let activeSemesterId = semesterId
    if (!activeSemesterId) {
      const { data: activeSemester } = await supabase
        .from("semester_config")
        .select("id")
        .eq("is_active", true)
        .maybeSingle()

      activeSemesterId = activeSemester?.id
    }

    // Fetch directors filtered by clinic_directors for the active semester
    if (activeSemesterId) {
      const { data: clinicDirectors, error: cdError } = await supabaseQueryWithRetry(
        () => supabase
          .from("clinic_directors")
          .select(`
            director_id,
            clinic_id,
            role,
            directors!inner(id, full_name, email, job_title, role),
            clinics!inner(id, name)
          `)
          .eq("semester_id", activeSemesterId),
        3,
        "clinic_directors",
      )

      if (cdError) {
        console.error("[v0] Error fetching clinic_directors:", cdError)
        return NextResponse.json({ error: cdError.message }, { status: 500 })
      }

      // Deduplicate directors (a director may have multiple clinic assignments)
      const directorMap = new Map()
      for (const cd of clinicDirectors || []) {
        const director = cd.directors as any
        const clinic = cd.clinics as any
        if (!directorMap.has(director.id)) {
          directorMap.set(director.id, {
            id: director.id,
            full_name: director.full_name,
            email: director.email,
            job_title: director.job_title,
            role: cd.role || director.role,
            clinic_id: clinic.id,
            clinic: clinic.name,
          })
        }
      }

      const formattedDirectors = Array.from(directorMap.values()).sort((a, b) => a.full_name.localeCompare(b.full_name))

      console.log("[v0] Fetched directors for semester:", activeSemesterId, "count:", formattedDirectors.length)

      const response = { directors: formattedDirectors }
      setCache(cacheKey, response, LONG_TTL)
      return NextResponse.json(response)
    }

    // Fallback: return all directors if no active semester found
    const { data: directors, error } = await supabase
      .from("directors")
      .select("id, full_name, email, job_title, role, clinic_id, clinic:clinics(name)")
      .order("full_name")

    if (error) {
      console.error("[v0] Error fetching directors:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const formattedDirectors = (directors || []).map((d: any) => ({
      id: d.id,
      full_name: d.full_name,
      email: d.email,
      job_title: d.job_title,
      role: d.role,
      clinic_id: d.clinic_id,
      clinic: d.clinic?.name || "Unknown Clinic",
    }))

    console.log("[v0] Fetched all directors (no active semester):", formattedDirectors?.length)

    const response = { directors: formattedDirectors }
    setCache(cacheKey, response)
    return NextResponse.json(response)
  } catch (error) {
    console.error("[v0] Error in directors API:", error)
    return NextResponse.json({ error: "Failed to fetch directors" }, { status: 500 })
  }
}
