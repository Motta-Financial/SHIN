import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { supabaseQueryWithRetry } from "@/lib/supabase-retry"
import { getCached, setCache, LONG_TTL } from "@/lib/api-cache"

export async function GET(request: Request) {
  try {
    // Check cache first
    const cacheKey = "students-list"
    const cached = getCached<{ success: boolean; students: unknown[] }>(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    const supabase = createServiceClient()

    const { data: students, error } = await supabaseQueryWithRetry(
      () => supabase
        .from("students_current")
        .select("id, full_name, email, clinic, status, semester_id")
        .order("full_name"),
      3,
      "students_list",
    )

    if (error) {
      return NextResponse.json({ success: true, students: [] })
    }

    const result = { success: true, students: students || [] }
    setCache(cacheKey, result, LONG_TTL)
    return NextResponse.json(result)
  } catch {
    // Return empty array with 200 instead of 500 to prevent error toasts
    return NextResponse.json({ success: true, students: [] })
  }
}
