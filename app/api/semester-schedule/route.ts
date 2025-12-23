import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
    },
  })

  const { searchParams } = new URL(request.url)
  const semester = searchParams.get("semester") || "Fall 2025"

  try {
    const { data, error } = await supabase
      .from("semester_schedule")
      .select("*")
      .eq("semester", semester)
      .order("week_number", { ascending: true })

    if (error) throw error

    return NextResponse.json({ schedules: data || [] })
  } catch (error) {
    console.error("Error fetching semester schedule:", error)
    return NextResponse.json({ error: "Failed to fetch schedule" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
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
        semester: semester || "Fall 2025",
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
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
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

    // Add updated_at timestamp
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
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
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
