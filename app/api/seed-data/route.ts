import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Fetch all SEED data
    const [studentsRes, directorsRes, clientsRes, assignmentsRes] = await Promise.all([
      supabase.from("students").select("*").order("last_name"),
      supabase.from("directors").select("*").order("full_name"),
      supabase
        .from("clients")
        .select(`
        *,
        primary_director:directors(full_name, email, clinic)
      `)
        .order("name"),
      supabase.from("client_assignments").select(`
        *,
        student:students(full_name, email, clinic),
        client:clients(name)
      `),
    ])

    if (studentsRes.error) throw studentsRes.error
    if (directorsRes.error) throw directorsRes.error
    if (clientsRes.error) throw clientsRes.error
    if (assignmentsRes.error) throw assignmentsRes.error

    return NextResponse.json({
      students: studentsRes.data,
      directors: directorsRes.data,
      clients: clientsRes.data,
      assignments: assignmentsRes.data,
      stats: {
        totalStudents: studentsRes.data?.length || 0,
        totalDirectors: directorsRes.data?.length || 0,
        totalClients: clientsRes.data?.length || 0,
        totalAssignments: assignmentsRes.data?.length || 0,
      },
    })
  } catch (error) {
    console.error("[v0] Error fetching SEED data:", error)
    return NextResponse.json({ error: "Failed to fetch SEED data" }, { status: 500 })
  }
}

// Get students by clinic
export async function POST(request: Request) {
  try {
    const { clinic, clientName } = await request.json()
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    let query = supabase.from("students").select("*")

    if (clinic) {
      query = query.eq("clinic", clinic)
    }

    if (clientName) {
      query = query.eq("client_team", clientName)
    }

    const { data, error } = await query.order("last_name")

    if (error) throw error

    return NextResponse.json({ students: data })
  } catch (error) {
    console.error("[v0] Error fetching filtered students:", error)
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 })
  }
}
