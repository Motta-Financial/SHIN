import { createServiceClient } from "@/lib/supabase/service"
import { NextResponse } from "next/server"

// API endpoint for v_clinic_team Supabase view
export async function GET() {
  try {
    const supabase = createServiceClient()

    const { data, error } = await supabase.from("v_clinic_team").select("*")

    if (error) {
      console.log("[v0] Supabase v_clinic_team error:", error.message)
      return NextResponse.json({ data: [] })
    }

    console.log("[v0] Fetched v_clinic_team count:", data?.length || 0)
    return NextResponse.json({ data: data || [] })
  } catch (error) {
    console.log("[v0] Error fetching v_clinic_team:", error)
    return NextResponse.json({ data: [] })
  }
}
