import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { getCachedData, setCachedData } from "@/lib/api-cache"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const semesterId = searchParams.get("semesterId")
    const includeAll = searchParams.get("includeAll") === "true"

    const cacheKey = `org-chart-${semesterId || "active"}-${includeAll}`
    const cached = getCachedData(cacheKey)
    if (cached) {
      console.log("[v0] Org-chart API - Returning cached response")
      return NextResponse.json(cached)
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Missing Supabase configuration" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get active semester if not specified and not including all
    let activeSemesterId = semesterId
    if (!activeSemesterId && !includeAll) {
      const { data: activeSemester } = await supabase
        .from("semester_config")
        .select("id")
        .eq("is_active", true)
        .maybeSingle()
      activeSemesterId = activeSemester?.id || null
    }

    // Fetch base entities - stagger in pairs to avoid rate limiting
    const [clinicsRes, directorsRes] = await Promise.all([
      supabase.from("clinics").select("*").order("name"),
      supabase.from("directors_current").select("*").order("full_name"),
    ])

    const [studentsRes, clientsRes] = await Promise.all([
      supabase.from("students_current").select("*").order("last_name"),
      supabase.from("clients_current").select("*").order("name"),
    ])

    for (const [name, res] of [["Clinics", clinicsRes], ["Directors", directorsRes], ["Students", studentsRes], ["Clients", clientsRes]] as const) {
      if (res.error) {
        console.error(`[v0] ${name} error:`, res.error)
        return NextResponse.json({ error: res.error.message }, { status: 500 })
      }
    }

    // Fetch junction tables - stagger in pairs
    const [clinicDirectorsRes, clinicStudentsRes] = await Promise.all([
      supabase.from("clinic_directors_current").select("*"),
      supabase.from("clinic_students_current").select("*"),
    ])

    const [clinicClientsRes, clientAssignmentsRes] = await Promise.all([
      supabase.from("clinic_clients_current").select("*"),
      supabase.from("client_assignments").select("*"),
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

    // Cache the result for 30 seconds
    setCachedData(cacheKey, result)
    console.log("[v0] Org-chart API - Fetched and cached data")

    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] Org chart API error:", error)
    return NextResponse.json({ error: "Failed to fetch org chart data" }, { status: 500 })
  }
}
