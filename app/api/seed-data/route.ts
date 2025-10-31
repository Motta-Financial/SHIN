import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // This prevents fetch errors from being logged when tables don't exist
    const tablesReady = process.env.SUPABASE_TABLES_READY === "true"

    if (!tablesReady) {
      console.log("[v0] Supabase tables not yet configured. Using Airtable as data source.")
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
          "Supabase tables not configured. Visit /admin/setup to create tables, or set SUPABASE_TABLES_READY=true in environment variables after running SQL scripts.",
      })
    }

    const supabase = await createClient()

    console.log("[v0] Fetching SEED data from Supabase...")

    const studentsRes = await supabase
      .from("students")
      .select("*")
      .order("last_name")
      .then(
        (res) => res,
        (err) => ({ data: null, error: err }),
      )

    const directorsRes = await supabase
      .from("directors")
      .select("*")
      .order("full_name")
      .then(
        (res) => res,
        (err) => ({ data: null, error: err }),
      )

    const clientsRes = await supabase
      .from("clients")
      .select(`
        *,
        primary_director:directors(full_name, email, clinic)
      `)
      .order("name")
      .then(
        (res) => res,
        (err) => ({ data: null, error: err }),
      )

    const assignmentsRes = await supabase
      .from("client_assignments")
      .select(`
        *,
        student:students(full_name, email, clinic),
        client:clients(name)
      `)
      .then(
        (res) => res,
        (err) => ({ data: null, error: err }),
      )

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
        students: [],
        directors: [],
        clients: [],
        assignments: [],
        setupRequired: true,
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
