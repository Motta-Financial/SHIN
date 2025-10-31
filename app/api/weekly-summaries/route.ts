import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const weekEnding = searchParams.get("week_ending")
    const clientName = searchParams.get("client_name")

    if (!weekEnding) {
      return NextResponse.json({ error: "week_ending is required" }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookies) => {
            cookies.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      },
    )

    let query = supabase.from("weekly_summaries").select("*").eq("week_ending", weekEnding)

    if (clientName) {
      query = query.eq("client_name", clientName)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching cached summaries:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Convert array to map for easier lookup
    const summariesMap: Record<string, any> = {}
    data?.forEach((summary) => {
      summariesMap[summary.client_name] = summary
    })

    return NextResponse.json({ summaries: summariesMap })
  } catch (error) {
    console.error("[v0] Error in weekly-summaries GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { client_name, week_ending, clinic, summary, student_count, total_hours, activity_count } = body

    if (!client_name || !week_ending || !clinic || !summary) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookies) => {
            cookies.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      },
    )

    // Upsert (insert or update if exists)
    const { data, error } = await supabase
      .from("weekly_summaries")
      .upsert(
        {
          client_name,
          week_ending,
          clinic,
          summary,
          student_count,
          total_hours,
          activity_count,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "client_name,week_ending",
        },
      )
      .select()
      .single()

    if (error) {
      console.error("[v0] Error caching summary:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("[v0] Error in weekly-summaries POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
