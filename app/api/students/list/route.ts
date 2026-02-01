import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

export async function GET(request: Request) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const semesterId = searchParams.get("semesterId")
    const includeAll = searchParams.get("includeAll") === "true"

    // Use students_current view which already filters by current semester via app_settings
    // No need to manually filter by semester_id or status
    const { data: students, error } = await supabase
      .from("students_current")
      .select("id, full_name, email, clinic, status, semester_id")
      .order("full_name")

    if (error) throw error

    return NextResponse.json({
      success: true,
      students: students || [],
    })
  } catch (error) {
    console.error("Error fetching students:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch students" }, { status: 500 })
  }
}
