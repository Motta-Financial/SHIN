import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const semesterId = searchParams.get("semesterId")
  const weekNumber = searchParams.get("weekNumber")
  const clientId = searchParams.get("clientId")
  const directorId = searchParams.get("directorId")

  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
    },
  })

  try {
    let query = supabase
      .from("scheduled_client_meetings")
      .select("*")
      .order("week_number", { ascending: true })
      .order("start_time", { ascending: true })

    // Apply filters
    if (semesterId) {
      query = query.eq("semester_id", semesterId)
    }
    if (weekNumber) {
      query = query.eq("week_number", Number.parseInt(weekNumber))
    }
    if (clientId) {
      query = query.eq("client_id", clientId)
    }
    if (directorId) {
      query = query.eq("primary_director_id", directorId)
    }

    const { data, error } = await query

    if (error) {
      const msg = error?.message?.toLowerCase() || ""
      if (msg.includes("too many") || msg.includes("rate limit")) {
        return NextResponse.json({ meetings: [] }, { status: 429 })
      }
      throw error
    }

    return NextResponse.json({ meetings: data || [] })
  } catch (error: any) {
    const msg = error?.message?.toLowerCase() || ""
    if (msg.includes("too many") || msg.includes("rate limit") || msg.includes("unexpected token")) {
      return NextResponse.json({ meetings: [] }, { status: 429 })
    }
    console.error("Error fetching scheduled client meetings:", error)
    return NextResponse.json({ meetings: [] }, { status: 500 })
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
      semester_schedule_id,
      semester_id,
      week_number,
      week_label,
      week_start,
      week_end,
      client_name,
      client_id,
      primary_director_id,
      start_time,
      end_time,
      minutes,
      room_assignment,
      zoom_link,
      notes,
    } = body

    const { data, error } = await supabase
      .from("scheduled_client_meetings")
      .insert({
        semester_schedule_id,
        semester_id,
        week_number,
        week_label,
        week_start,
        week_end,
        client_name,
        client_id,
        primary_director_id,
        start_time,
        end_time,
        minutes,
        room_assignment,
        zoom_link,
        notes,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ meeting: data })
  } catch (error) {
    console.error("Error creating scheduled client meeting:", error)
    return NextResponse.json({ error: "Failed to create meeting" }, { status: 500 })
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

    updates.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from("scheduled_client_meetings")
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ meeting: data })
  } catch (error) {
    console.error("Error updating scheduled client meeting:", error)
    return NextResponse.json({ error: "Failed to update meeting" }, { status: 500 })
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
    const { error } = await supabase.from("scheduled_client_meetings").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting scheduled client meeting:", error)
    return NextResponse.json({ error: "Failed to delete meeting" }, { status: 500 })
  }
}
