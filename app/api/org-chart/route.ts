import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Missing Supabase configuration" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch all data in parallel
    const [clinicsRes, directorsRes, studentsRes, clientsRes] = await Promise.all([
      supabase.from("clinics").select("*").order("name"),
      supabase.from("directors").select("*").order("full_name"),
      supabase.from("students").select("*").eq("status", "active").order("last_name"),
      supabase.from("clients").select("*").order("name"),
    ])

    if (clinicsRes.error) {
      console.error("[v0] Clinics error:", clinicsRes.error)
      return NextResponse.json({ error: clinicsRes.error.message }, { status: 500 })
    }
    if (directorsRes.error) {
      console.error("[v0] Directors error:", directorsRes.error)
      return NextResponse.json({ error: directorsRes.error.message }, { status: 500 })
    }
    if (studentsRes.error) {
      console.error("[v0] Students error:", studentsRes.error)
      return NextResponse.json({ error: studentsRes.error.message }, { status: 500 })
    }
    if (clientsRes.error) {
      console.error("[v0] Clients error:", clientsRes.error)
      return NextResponse.json({ error: clientsRes.error.message }, { status: 500 })
    }

    return NextResponse.json({
      clinics: clinicsRes.data || [],
      directors: directorsRes.data || [],
      students: studentsRes.data || [],
      clients: clientsRes.data || [],
    })
  } catch (error) {
    console.error("[v0] Org chart API error:", error)
    return NextResponse.json({ error: "Failed to fetch org chart data" }, { status: 500 })
  }
}
