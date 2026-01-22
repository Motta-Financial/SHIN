import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

// Helper to get Supabase URL and service role key with fallbacks
function getSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.supabase_SUPABASE_SERVICE_ROLE_KEY
  return { supabaseUrl, serviceRoleKey }
}

function isRateLimitError(error: unknown): boolean {
  if (error && typeof error === "object") {
    const err = error as { message?: string; status?: number; code?: string }
    return (
      err.status === 429 ||
      err.code === "429" ||
      err.message?.toLowerCase().includes("too many") ||
      err.message?.toLowerCase().includes("rate limit")
    )
  }
  return false
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const semester = searchParams.get("semester")
  const semesterId = searchParams.get("semesterId")
  const includeAll = searchParams.get("includeAll") === "true"
  const includeClassSessions = searchParams.get("includeClassSessions") === "true"

  const cookieStore = await cookies()
  const { supabaseUrl, serviceRoleKey } = getSupabaseConfig()
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("[v0] semester-schedule API - Missing env vars. URL:", !!supabaseUrl, "Key:", !!serviceRoleKey)
    return NextResponse.json({ schedules: [], error: "Server configuration error" }, { status: 500 })
  }
  
  const supabase = createServerClient(supabaseUrl, serviceRoleKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
    },
  })

  try {
    let activeSemesterId = semesterId

    if (!activeSemesterId && !includeAll) {
      if (semester) {
        const { data: semesterConfig, error: semesterError } = await supabase
          .from("semester_config")
          .select("id, semester")
          .eq("semester", semester)
          .maybeSingle()
        console.log("[v0] semester-schedule API - Looking for semester:", semester, "Found:", semesterConfig, "Error:", semesterError)
        activeSemesterId = semesterConfig?.id || null
      } else {
        const { data: activeSemester, error: activeError } = await supabase
          .from("semester_config")
          .select("id")
          .eq("is_active", true)
          .maybeSingle()
        console.log("[v0] semester-schedule API - Looking for active semester. Found:", activeSemester, "Error:", activeError)
        activeSemesterId = activeSemester?.id || null
      }
    }
    
    console.log("[v0] semester-schedule API - Using activeSemesterId:", activeSemesterId)

    const selectFields = includeClassSessions
      ? `*, class_sessions!semester_schedule_class_session_id_fkey(id, class_number, class_label, class_date, class_start_time, class_end_time)`
      : "*"

    let query = supabase.from("semester_schedule").select(selectFields).order("week_number", { ascending: true })

    if (activeSemesterId) {
      query = query.eq("semester_id", activeSemesterId)
    }

    const { data, error } = await query
    
    console.log("[v0] semester-schedule API - Query result count:", data?.length, "Error:", error)

    if (error) throw error

    const now = new Date()
    const elapsedWeeks = data?.filter((week) => new Date(week.week_end) < now && !week.is_break).length || 0
    const currentWeek = data?.find((week) => new Date(week.week_start) <= now && new Date(week.week_end) >= now)
    const totalClassWeeks = data?.filter((week) => !week.is_break).length || 0

    const response = {
      schedules: data || [],
      metadata: {
        totalWeeks: data?.length || 0,
        totalClassWeeks,
        elapsedClassWeeks: elapsedWeeks,
        currentWeekNumber: currentWeek?.week_number || null,
        currentWeekId: currentWeek?.id || null,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching semester schedule:", error)
    if (isRateLimitError(error)) {
      return NextResponse.json({ schedules: [], error: "Rate limited", rateLimited: true }, { status: 429 })
    }
    return NextResponse.json({ schedules: [], error: "Failed to fetch schedule" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const { supabaseUrl, serviceRoleKey } = getSupabaseConfig()
  
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
  }
  
  const supabase = createServerClient(supabaseUrl, serviceRoleKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
    },
  })

  try {
    const body = await request.json()
    const {
      week_number,
      week_label,
      week_start,
      week_end,
      session_focus,
      activities,
      assignments,
      notes,
      class_time_minutes,
      clinic_time_minutes,
      is_break,
      semester,
    } = body

    const { data: semesterConfig } = await supabase
      .from("semester_config")
      .select("id")
      .eq("semester", semester || "Spring 2026")
      .single()

    const { data, error } = await supabase
      .from("semester_schedule")
      .insert({
        week_number,
        week_label: week_label || `Week ${week_number}`,
        week_start,
        week_end,
        session_focus,
        activities: activities || [],
        assignments: assignments || [],
        notes,
        class_time_minutes: class_time_minutes || 90,
        clinic_time_minutes: clinic_time_minutes || 90,
        is_break: is_break || false,
        semester_id: semesterConfig?.id,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ schedule: data })
  } catch (error) {
    console.error("Error creating schedule:", error)
    return NextResponse.json({ error: "Failed to create schedule" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const cookieStore = await cookies()
  const { supabaseUrl, serviceRoleKey } = getSupabaseConfig()
  
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
  }
  
  const supabase = createServerClient(supabaseUrl, serviceRoleKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
    },
  })

  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }

    updates.updated_at = new Date().toISOString()

    const { data, error } = await supabase.from("semester_schedule").update(updates).eq("id", id).select().single()

    if (error) throw error

    return NextResponse.json({ schedule: data })
  } catch (error) {
    console.error("Error updating schedule:", error)
    return NextResponse.json({ error: "Failed to update schedule" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const cookieStore = await cookies()
  const { supabaseUrl, serviceRoleKey } = getSupabaseConfig()
  
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
  }
  
  const supabase = createServerClient(supabaseUrl, serviceRoleKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
    },
  })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 })
  }

  try {
    const { error } = await supabase.from("semester_schedule").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting schedule:", error)
    return NextResponse.json({ error: "Failed to delete schedule" }, { status: 500 })
  }
}
