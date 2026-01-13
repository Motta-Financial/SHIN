import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function getSupabaseClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const semesterId = searchParams.get("semesterId")
    const classNumber = searchParams.get("classNumber")
    const includeSchedule = searchParams.get("includeSchedule") === "true"

    const supabase = getSupabaseClient()

    // If no semesterId, get the active semester
    let activeSemesterId = semesterId
    if (!activeSemesterId) {
      const { data: activeSemester } = await supabase
        .from("semester_config")
        .select("id")
        .eq("is_active", true)
        .maybeSingle()
      activeSemesterId = activeSemester?.id || null
    }

    let query = supabase
      .from("class_sessions")
      .select(
        includeSchedule
          ? `
        *,
        semester_schedule!class_sessions_semester_schedule_id_fkey(
          id, week_number, week_label, week_start, week_end, is_break, session_focus
        )
      `
          : "*",
      )
      .order("class_number", { ascending: true })

    if (activeSemesterId) {
      query = query.eq("semester_id", activeSemesterId)
    }

    if (classNumber) {
      query = query.eq("class_number", Number(classNumber))
    }

    const { data, error } = await query

    if (error) {
      console.log("[v0] Class-sessions API error:", error)
      throw error
    }

    // Calculate elapsed classes (classes that have already occurred)
    const now = new Date()
    const elapsedSessions = data?.filter((session) => new Date(session.class_date) < now) || []

    return NextResponse.json({
      sessions: data || [],
      totalClasses: data?.length || 0,
      elapsedClasses: elapsedSessions.length,
      currentDate: now.toISOString(),
    })
  } catch (error: any) {
    const errorMessage = error?.message || String(error)
    console.log("[v0] Class-sessions API error:", errorMessage)

    if (errorMessage.includes("Too Many") || errorMessage.includes("rate limit") || errorMessage.includes("429")) {
      return NextResponse.json(
        { sessions: [], error: "Rate limited, please retry", rateLimited: true },
        { status: 429 },
      )
    }

    return NextResponse.json({ sessions: [], error: errorMessage }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseClient()
    const body = await request.json()

    const { semester_schedule_id, semester_id, class_number, class_label, class_date, location, is_cancelled } = body

    const { data, error } = await supabase
      .from("class_sessions")
      .insert({
        semester_schedule_id,
        semester_id,
        class_number,
        class_label: class_label || `Class ${class_number}`,
        class_date,
        location: location || "TBD",
        is_cancelled: is_cancelled || false,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ session: data })
  } catch (error: any) {
    console.log("[v0] Class-sessions POST error:", error)
    return NextResponse.json({ error: error?.message || "Failed to create class session" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = getSupabaseClient()
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }

    updates.updated_at = new Date().toISOString()

    const { data, error } = await supabase.from("class_sessions").update(updates).eq("id", id).select().single()

    if (error) throw error

    return NextResponse.json({ session: data })
  } catch (error: any) {
    console.log("[v0] Class-sessions PATCH error:", error)
    return NextResponse.json({ error: error?.message || "Failed to update class session" }, { status: 500 })
  }
}
