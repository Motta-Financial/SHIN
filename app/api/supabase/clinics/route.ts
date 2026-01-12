import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { getCachedData, setCachedData } from "@/lib/api-cache"

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
    const { data: clinics, error } = await supabase.from("clinics").select("id, name").order("name")

    if (error) {
      console.error("Error fetching clinics:", error)
      return NextResponse.json({ success: true, clinics: [] })
    }

    const response = { success: true, clinics: clinics || [] }

    // Cache for 30 seconds
    setCachedData(cacheKey, response)
    console.log("[v0] Clinics API - Fetched and cached clinics count:", clinics?.length || 0)

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error in clinics API:", error)
    return NextResponse.json({ success: false, clinics: [] })
  }
}
