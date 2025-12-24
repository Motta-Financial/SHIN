import { createServiceClient } from "@/lib/supabase/service"
import { NextResponse } from "next/server"

// API endpoint for v_student_overview Supabase view
export async function GET() {
  try {
    const supabase = createServiceClient()

    const { data, error } = await supabase.from("v_student_overview").select("*")

    if (error) {
      console.log("[v0] Supabase v_student_overview error:", error.message)
      return NextResponse.json({ students: [] })
    }

    console.log("[v0] Fetched v_student_overview count:", data?.length || 0)
    return NextResponse.json({ students: data || [] })
  } catch (error) {
    console.log("[v0] Error fetching v_student_overview:", error)
    return NextResponse.json({ students: [] })
  }
}
