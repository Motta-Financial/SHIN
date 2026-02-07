import { createServiceClient } from "@/lib/supabase/service"
import { NextResponse } from "next/server"
import { getCached, setCache, getCacheKey } from "@/lib/api-cache"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const semesterId = searchParams.get("semesterId")
    const includeAll = searchParams.get("includeAll") === "true"
    const email = searchParams.get("email")

    const cacheKey = getCacheKey("clients", {
      semesterId: semesterId || undefined,
      includeAll: includeAll.toString(),
      email: email || undefined,
    })
    const cached = getCached<{ success: boolean; clients: any[] }>(cacheKey)
    if (cached) {
      console.log("[v0] Clients API - Returning cached response")
      return NextResponse.json(cached)
    }

    const supabase = createServiceClient()

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
        console.error("Error fetching active semester:", err)
      }
    }

    let query = supabase.from("clients").select("id, name, email, contact_name, status, semester_id").order("name")

    if (activeSemesterId) {
      query = query.eq("semester_id", activeSemesterId)
    }

    if (email) {
      query = query.ilike("email", email)
    }

    let clients: any[] | null = null
    try {
      const result = await query
      if (result.error) {
        return NextResponse.json({ success: true, clients: [] })
      }
      clients = result.data
    } catch {
      return NextResponse.json({ success: true, clients: [] })
    }

    console.log(`[v0] Clients API - Fetched ${clients?.length || 0} clients for semester: ${activeSemesterId}`)

    const response = {
      success: true,
      clients: clients || [],
    }
    setCache(cacheKey, response)
    return NextResponse.json(response)
  } catch {
    return NextResponse.json({ success: true, clients: [] })
  }
}
