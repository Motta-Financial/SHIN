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
  const semesterId = searchParams.get("semester_id")
  const weekStart = searchParams.get("week_start")
  const weekEnd = searchParams.get("week_end")

  try {
    let query = supabase.from("published_agendas").select("*").order("published_at", { ascending: false })

    if (semesterId) {
      query = query.eq("semester_id", semesterId)
    }

    if (weekStart && weekEnd) {
      query = query.gte("schedule_date", weekStart).lte("schedule_date", weekEnd)
    }

    // Default to current agenda if no filters
    if (!weekStart && !weekEnd) {
      query = query.eq("is_current", true).limit(1)
    }

    const { data, error } = await query

    if (error && error.code !== "PGRST116") throw error

    // Return single or array based on query type
    if (!weekStart && !weekEnd) {
      return NextResponse.json({ success: true, agenda: data?.[0] || null })
    }

    return NextResponse.json({ success: true, agendas: data || [] })
  } catch (error) {
    console.error("Error fetching published agenda:", error)
    return NextResponse.json({ success: false, agenda: null, agendas: [] })
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

    // Mark all existing as not current
    await supabase.from("published_agendas").update({ is_current: false }).eq("is_current", true)

    const { data, error } = await supabase
      .from("published_agendas")
      .insert({
        schedule_date: body.schedule_date,
        director_name: body.director_name,
        zoom_link: body.zoom_link,
        schedule_data: body.schedule_data,
        notes: body.notes,
        published_by: body.published_by,
        semester_id: body.semester_id,
        is_current: true,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, agenda: data })
  } catch (error) {
    console.error("Error publishing agenda:", error)
    return NextResponse.json({ success: false, error: "Failed to publish agenda" }, { status: 500 })
  }
}
