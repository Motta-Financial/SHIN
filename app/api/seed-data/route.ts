import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    console.log("[v0] Fetching SEED data from Supabase...")

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

    const tablesNotFound =
      studentsRes.error?.code === "PGRST205" ||
      directorsRes.error?.code === "PGRST205" ||
      clientsRes.error?.code === "PGRST205" ||
      assignmentsRes.error?.code === "PGRST205"

    if (tablesNotFound) {
      console.log("[v0] SEED tables not found in Supabase. Please run the SQL scripts to create them.")
      return NextResponse.json({
        students: [],
        directors: [],
        clients: [],
        assignments: [],
        stats: {
          totalStudents: 0,
          totalDirectors: 0,
          totalClients: 0,
          totalAssignments: 0,
        },
        setupRequired: true,
        message:
          "SEED tables not found. Please run the SQL scripts (01-create-seed-tables.sql through 05-seed-client-assignments.sql) in your Supabase SQL editor to set up the database.",
      })
    }

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
      setupRequired: false,
    })
  } catch (error) {
    console.error("[v0] Error fetching SEED data:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch SEED data",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// Get students by clinic
export async function POST(request: Request) {
  try {
    const { clinic, clientName } = await request.json()
    const supabase = await createClient()

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
