import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Fetch all SEED data (using *_current views for current semester)
    const [studentsRes, directorsRes, clientsRes, assignmentsRes] = await Promise.all([
      supabase.from("students_current").select("*").order("last_name"),
      supabase.from("directors_current").select("*").order("full_name"),
      supabase
        .from("clients_current")
        .select(`
        *,
        primary_director:directors(full_name, email, clinic)
      `)
        .order("name"),
      supabase.from("client_assignments").select(`
        *,
        student:students_current(full_name, email, clinic),
        client:clients_current(name)
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
    const supabase = await createClient()

    let query = supabase.from("students_current").select("*")

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
