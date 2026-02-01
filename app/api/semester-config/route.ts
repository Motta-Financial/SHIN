import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { getCached, setCache, LONG_TTL, clearCache } from "@/lib/api-cache"

export async function GET() {
  try {
    // Check cache first
    const cacheKey = "semester-config"
    const cached = getCached<{ semesters: unknown[] }>(cacheKey)
    if (cached) {
      console.log("[v0] Semester config - Returning cached response")
      return NextResponse.json(cached)
    }

    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from("semester_config")
      .select("id, semester, is_active, start_date, end_date")
      .order("start_date", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching semester config:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(
      "[v0] Semester config fetched:",
      data?.map((s) => ({ id: s.id, semester: s.semester, is_active: s.is_active })),
    )

    const response = { semesters: data || [] }
    setCache(cacheKey, response, LONG_TTL)
    return NextResponse.json(response)
  } catch (error) {
    console.error("[v0] Error in semester-config API:", error)
    return NextResponse.json({ error: "Failed to fetch semester configuration" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()

    const { semester, startDate, endDate, isActive } = body

    if (!semester || !startDate || !endDate) {
      return NextResponse.json({ error: "Semester name, start date, and end date are required" }, { status: 400 })
    }

    // If this semester is being set as active, deactivate all others
    if (isActive) {
      await supabase
        .from("semester_config")
        .update({ is_active: false })
        .neq("id", "00000000-0000-0000-0000-000000000000")
    }

    const { data, error } = await supabase
      .from("semester_config")
      .insert({
        semester: semester,
        start_date: startDate,
        end_date: endDate,
        is_active: isActive || false,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating semester:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Clear cache so next GET fetches fresh data
    clearCache("semester-config")
    return NextResponse.json({ semester: data })
  } catch (error) {
    console.error("Error in semester-config POST:", error)
    return NextResponse.json({ error: "Failed to create semester" }, { status: 500 })
  }
}
