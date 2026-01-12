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
  const weekNumber = searchParams.get("week_number")
  const includeAll = searchParams.get("includeAll") === "true"

  try {
    let activeSemesterId = semesterId

    if (!activeSemesterId && !includeAll) {
      const { data: activeSemester } = await supabase
        .from("semester_config")
        .select("id")
        .eq("is_active", true)
        .maybeSingle()
      activeSemesterId = activeSemester?.id || null
    }

    let query = supabase.from("class_recordings").select("*").order("week_number", { ascending: false })

    if (activeSemesterId) {
      query = query.eq("semester_id", activeSemesterId)
    }

    if (weekNumber) {
      query = query.eq("week_number", Number.parseInt(weekNumber))
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ success: true, recordings: data || [] })
  } catch (error) {
    console.error("Error fetching recordings:", error)
    return NextResponse.json({ success: false, recordings: [] })
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

    const { data, error } = await supabase
      .from("class_recordings")
      .insert({
        title: body.title,
        description: body.description,
        video_url: body.video_url,
        thumbnail_url: body.thumbnail_url,
        week_number: body.week_number,
        semester_id: body.semester_id,
        duration_minutes: body.duration_minutes,
        recorded_at: body.recorded_at,
        uploaded_by: body.uploaded_by,
        uploader_name: body.uploader_name,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, recording: data })
  } catch (error) {
    console.error("Error adding recording:", error)
    return NextResponse.json({ success: false, error: "Failed to add recording" }, { status: 500 })
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
    return NextResponse.json({ success: false, error: "Recording ID is required" }, { status: 400 })
  }

  try {
    const { error } = await supabase.from("class_recordings").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting recording:", error)
    return NextResponse.json({ success: false, error: "Failed to delete recording" }, { status: 500 })
  }
}
