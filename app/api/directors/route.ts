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
      .select("id, full_name, email, job_title, role, clinic_id, clinic:clinics(name)")
      .order("full_name")

    if (error) {
      console.error("[v0] Error fetching directors:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const formattedDirectors = (directors || []).map((d: any) => ({
      id: d.id,
      full_name: d.full_name,
      email: d.email,
      job_title: d.job_title,
      role: d.role,
      clinic_id: d.clinic_id,
      clinic: d.clinic?.name || "Unknown Clinic",
    }))

    console.log("[v0] Fetched directors:", formattedDirectors?.length)

    return NextResponse.json({ directors: formattedDirectors })
  } catch (error) {
    console.error("[v0] Error in directors API:", error)
    return NextResponse.json({ error: "Failed to fetch directors" }, { status: 500 })
  }
}
