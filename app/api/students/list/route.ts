import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

export async function GET(request: Request) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const semesterId = searchParams.get("semesterId")
    const includeAll = searchParams.get("includeAll") === "true"

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

    let query = supabase
      .from("students")
      .select("id, full_name, email, clinic, status, semester_id")
      .eq("status", "Active")
      .order("full_name")

    // Filter by active semester (Spring 2026) by default
    if (activeSemesterId) {
      query = query.eq("semester_id", activeSemesterId)
    }

    const { data: students, error } = await query

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
