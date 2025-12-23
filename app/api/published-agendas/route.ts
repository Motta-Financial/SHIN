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
      .from("published_agendas")
      .select("*")
      .eq("is_current", true)
      .order("published_at", { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== "PGRST116") throw error

    return NextResponse.json(data || null)
  } catch (error) {
    console.error("Error fetching published agenda:", error)
    return NextResponse.json(null)
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

    // Mark all existing as not current
    await supabase.from("published_agendas").update({ is_current: false }).eq("is_current", true)

    // Insert new agenda
    const { data, error } = await supabase
      .from("published_agendas")
      .insert({
        schedule_date: body.schedule_date,
        director_name: body.director_name,
        zoom_link: body.zoom_link,
        schedule_data: body.schedule_data,
        notes: body.notes,
        published_by: body.published_by,
        is_current: true,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error publishing agenda:", error)
    return NextResponse.json({ error: "Failed to publish agenda" }, { status: 500 })
  }
}
