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

    const clinicsRes = await supabase.from("clinics").select("*").order("name")
    if (clinicsRes.error) {
      console.error("[v0] Clinics error:", clinicsRes.error)
      return NextResponse.json({ error: clinicsRes.error.message }, { status: 500 })
    }

    // Small delay between requests
    await new Promise((resolve) => setTimeout(resolve, 100))

    const directorsRes = await supabase.from("directors").select("*").order("full_name")
    if (directorsRes.error) {
      console.error("[v0] Directors error:", directorsRes.error)
      return NextResponse.json({ error: directorsRes.error.message }, { status: 500 })
    }

    await new Promise((resolve) => setTimeout(resolve, 100))

    let studentsQuery = supabase.from("students").select("*").eq("status", "active").order("last_name")
    if (activeSemesterId) {
      studentsQuery = studentsQuery.eq("semester_id", activeSemesterId)
    }
    const studentsRes = await studentsQuery
    if (studentsRes.error) {
      console.error("[v0] Students error:", studentsRes.error)
      return NextResponse.json({ error: studentsRes.error.message }, { status: 500 })
    }

    await new Promise((resolve) => setTimeout(resolve, 100))

    let clientsQuery = supabase.from("clients").select("*").order("name")
    if (activeSemesterId) {
      clientsQuery = clientsQuery.eq("semester_id", activeSemesterId)
    }
    const clientsRes = await clientsQuery
    if (clientsRes.error) {
      console.error("[v0] Clients error:", clientsRes.error)
      return NextResponse.json({ error: clientsRes.error.message }, { status: 500 })
    }

    const result = {
      clinics: clinicsRes.data || [],
      directors: directorsRes.data || [],
      students: studentsRes.data || [],
      clients: clientsRes.data || [],
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
