import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      },
    )

    const { data: directors, error } = await supabase
      .from("directors")
      .select("id, full_name, clinic, email, job_title, role")
      .order("full_name")

    if (error) {
      console.error("[v0] Error fetching directors:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Fetched directors:", directors?.length)

    return NextResponse.json({ directors: directors || [] })
  } catch (error) {
    console.error("[v0] Error in directors API:", error)
    return NextResponse.json({ error: "Failed to fetch directors" }, { status: 500 })
  }
}
