import { createServiceClient } from "@/lib/supabase/service"
import { NextResponse } from "next/server"

// API endpoint for v_student_client_clinic Supabase view
export async function GET() {
  try {
    const supabase = createServiceClient()

    const { data, error } = await supabase.from("v_student_client_clinic").select("*").order("clinic")

    if (error) {
      console.log("[v0] Supabase v_student_client_clinic error:", error.message)
      return NextResponse.json({ data: [] })
    }

    console.log("[v0] Fetched v_student_client_clinic count:", data?.length || 0)
    return NextResponse.json({ data: data || [] })
  } catch (error) {
    console.log("[v0] Error fetching v_student_client_clinic:", error)
    return NextResponse.json({ data: [] })
  }
}
