import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { getCachedData, setCachedData } from "@/lib/api-cache"
import { supabaseQueryWithRetry } from "@/lib/supabase-retry"

export async function GET(request: NextRequest) {
  try {
    const cacheKey = "clinics:all"

    // Check cache first
    const cached = getCachedData(cacheKey)
    if (cached) {
      console.log("[v0] Clinics API - Returning cached response")
      return NextResponse.json(cached)
    }

    const supabase = createServiceClient()
    const { data: clinics, error } = await supabaseQueryWithRetry(
      () => supabase.from("clinics").select("id, name").order("name"),
      3,
      "clinics",
    )

    if (error) {
      return NextResponse.json({ success: true, clinics: [] })
    }

    const response = { success: true, clinics: clinics || [] }

    setCachedData(cacheKey, response)
    console.log("[v0] Clinics API - Fetched and cached clinics count:", clinics?.length || 0)

    return NextResponse.json(response)
  } catch {
    return NextResponse.json({ success: false, clinics: [] })
  }
}
