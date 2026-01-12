import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const semesterId = searchParams.get("semesterId")
    const weekNumber = searchParams.get("weekNumber")

    const supabase = createServiceClient()

    let query = supabase.from("attendance_passwords").select("*").order("week_number", { ascending: true })

    if (semesterId) {
      query = query.eq("semester_id", semesterId)
    }

    if (weekNumber) {
      query = query.eq("week_number", weekNumber)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching attendance passwords:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ passwords: data || [] })
  } catch (error: any) {
    console.error("[v0] Unexpected error in attendance-password route:", error.message)
    return NextResponse.json({ error: error.message || "Failed to fetch passwords" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { weekNumber, semesterId, password, weekStart, weekEnd, createdByName } = body

    if (!weekNumber || !semesterId || !password) {
      return NextResponse.json(
        { error: "Missing required fields: weekNumber, semesterId, and password are required" },
        { status: 400 },
      )
    }

    const supabase = createServiceClient()

    // Generate default dates if not provided (assuming Spring 2026 starts Jan 13, 2026)
    const defaultWeekStart = weekStart || new Date(2026, 0, 13 + (weekNumber - 1) * 7).toISOString().split("T")[0]
    const defaultWeekEnd = weekEnd || new Date(2026, 0, 19 + (weekNumber - 1) * 7).toISOString().split("T")[0]

    // Upsert the password (update if exists, insert if not)
    const { data, error } = await supabase
      .from("attendance_passwords")
      .upsert(
        {
          week_number: weekNumber,
          semester_id: semesterId,
          password,
          week_start: defaultWeekStart,
          week_end: defaultWeekEnd,
          created_by_name: createdByName || "Admin",
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "semester_id,week_number",
        },
      )
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating/updating attendance password:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ password: data, success: true })
  } catch (error: any) {
    console.error("[v0] Unexpected error in attendance-password POST:", error.message)
    return NextResponse.json({ error: error.message || "Failed to create password" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Missing password ID" }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { error } = await supabase.from("attendance_passwords").delete().eq("id", id)

    if (error) {
      console.error("[v0] Error deleting attendance password:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Unexpected error in attendance-password DELETE:", error.message)
    return NextResponse.json({ error: error.message || "Failed to delete password" }, { status: 500 })
  }
}
