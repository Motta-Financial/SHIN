import { createServiceClient } from "@/lib/supabase/service"
import { NextResponse } from "next/server"
import { getCachedData, setCachedData, LONG_TTL } from "@/lib/api-cache"
import { supabaseQueryWithRetry } from "@/lib/supabase-retry"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const semesterId = searchParams.get("semesterId")
    const includeAll = searchParams.get("includeAll") === "true"

    const cacheKey = `org-chart-${semesterId || "active"}-${includeAll}`
    const cached = getCachedData(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    const supabase = createServiceClient()

    // Get active semester
    let activeSemesterId = semesterId
    if (!activeSemesterId && !includeAll) {
      const { data: activeSemester } = await supabaseQueryWithRetry(
        () => supabase.from("semester_config").select("id").eq("is_active", true).maybeSingle(),
        3,
        "semester_config",
      )
      activeSemesterId = activeSemester?.id || null
    }

    // Fetch base entities + junction tables in 2 parallel batches
    const [clinicsRes, directorsRes, studentsRes, clientsRes] = await Promise.all([
      supabaseQueryWithRetry(() => supabase.from("clinics").select("*").order("name"), 3, "clinics"),
      supabaseQueryWithRetry(() => supabase.from("directors_current").select("*").order("full_name"), 3, "directors"),
      supabaseQueryWithRetry(() => supabase.from("students_current").select("*").order("last_name"), 3, "students"),
      supabaseQueryWithRetry(() => supabase.from("clients_current").select("*").order("name"), 3, "clients"),
    ])

    for (const [name, res] of [
      ["Clinics", clinicsRes],
      ["Directors", directorsRes],
      ["Students", studentsRes],
      ["Clients", clientsRes],
    ] as const) {
      if (res.error) {
        console.error(`[v0] ${name} error:`, res.error)
        return NextResponse.json({ error: res.error.message }, { status: 500 })
      }
    }

    const [clinicDirectorsRes, clinicStudentsRes, clinicClientsRes, clientAssignmentsRes] = await Promise.all([
      supabaseQueryWithRetry(() => supabase.from("clinic_directors_current").select("*"), 3, "clinic_directors"),
      supabaseQueryWithRetry(() => supabase.from("clinic_students_current").select("*"), 3, "clinic_students"),
      supabaseQueryWithRetry(() => supabase.from("clinic_clients_current").select("*"), 3, "clinic_clients"),
      supabaseQueryWithRetry(() => supabase.from("client_assignments").select("*"), 3, "client_assignments"),
    ])

    const result = {
      clinics: clinicsRes.data || [],
      directors: directorsRes.data || [],
      students: studentsRes.data || [],
      clients: clientsRes.data || [],
      clinicDirectors: clinicDirectorsRes.data || [],
      clinicStudents: clinicStudentsRes.data || [],
      clinicClients: clinicClientsRes.data || [],
      clientAssignments: clientAssignmentsRes.data || [],
    }

    // Cache for 5 minutes - org chart data rarely changes
    setCachedData(cacheKey, result, LONG_TTL)

    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] Org chart API error:", error)
    return NextResponse.json({ error: "Failed to fetch org chart data" }, { status: 500 })
  }
}
