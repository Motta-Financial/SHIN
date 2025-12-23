import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  const cookieStore = cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
    },
  })

  try {
    const { data, error } = await supabase
      .from("class_recordings")
      .select("*")
      .order("week_number", { ascending: false })

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("Error fetching recordings:", error)
    return NextResponse.json([])
  }
}

export async function POST(request: Request) {
  const cookieStore = cookies()
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
        semester: body.semester || "Spring 2025",
        duration_minutes: body.duration_minutes,
        recorded_at: body.recorded_at,
        uploaded_by: body.uploaded_by,
        uploader_name: body.uploader_name,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error adding recording:", error)
    return NextResponse.json({ error: "Failed to add recording" }, { status: 500 })
  }
}
