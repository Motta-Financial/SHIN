import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const clinicId = searchParams.get("clinicId")
  const directorId = searchParams.get("directorId")
  const semesterId = searchParams.get("semesterId")
  const weekNumber = searchParams.get("weekNumber")

  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
    },
  })

  try {
    let query = supabase.from("clinic_agendas").select("*").order("week_number", { ascending: true })

    if (clinicId) {
      query = query.eq("clinic_id", clinicId)
    }
    if (directorId) {
      query = query.eq("director_id", directorId)
    }
    if (semesterId) {
      query = query.eq("semester_id", semesterId)
    }
    if (weekNumber) {
      query = query.eq("week_number", Number.parseInt(weekNumber))
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ agendas: data || [] })
  } catch (error) {
    console.error("Error fetching clinic agendas:", error)
    return NextResponse.json({ error: "Failed to fetch clinic agendas" }, { status: 500 })
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
      clinic_id,
      director_id,
      week_number,
      semester_id,
      title,
      description,
      agenda_items,
      start_time,
      end_time,
      room_assignment,
      zoom_link,
      notes,
    } = body

    const { data, error } = await supabase
      .from("clinic_agendas")
      .insert({
        clinic_id,
        director_id,
        week_number,
        semester_id,
        title,
        description,
        agenda_items: agenda_items || [],
        start_time,
        end_time,
        room_assignment,
        zoom_link,
        notes,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ agenda: data })
  } catch (error) {
    console.error("Error creating clinic agenda:", error)
    return NextResponse.json({ error: "Failed to create clinic agenda" }, { status: 500 })
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

    const { data, error } = await supabase.from("clinic_agendas").update(updates).eq("id", id).select().single()

    if (error) throw error

    return NextResponse.json({ agenda: data })
  } catch (error) {
    console.error("Error updating clinic agenda:", error)
    return NextResponse.json({ error: "Failed to update clinic agenda" }, { status: 500 })
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
    const { error } = await supabase.from("clinic_agendas").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting clinic agenda:", error)
    return NextResponse.json({ error: "Failed to delete clinic agenda" }, { status: 500 })
  }
}
