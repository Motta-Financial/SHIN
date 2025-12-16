import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

async function checkTableExists(supabase: any, tableName: string): Promise<boolean> {
  try {
    const { error } = await supabase.from(tableName).select("id").limit(1)
    return !error || error.code !== "PGRST205"
  } catch {
    return false
  }
}

export async function GET() {
  try {
    const supabase = await createClient()

    // Auto-detect if tables exist instead of relying on env var
    const [studentsExist, directorsExist, clientsExist] = await Promise.all([
      checkTableExists(supabase, "students"),
      checkTableExists(supabase, "directors"),
      checkTableExists(supabase, "clients"),
    ])

    const tablesReady = studentsExist && directorsExist && clientsExist

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
        tablesStatus: {
          students: studentsExist,
          directors: directorsExist,
          clients: clientsExist,
        },
        message: "Some Supabase tables not configured. Visit /admin/setup to create tables.",
      })
    }

    console.log("[v0] Fetching SEED data from Supabase...")

    const [studentsRes, directorsRes, clientsRes, assignmentsRes] = await Promise.all([
      supabase.from("students").select("*").order("last_name"),
      supabase.from("directors").select("*").order("full_name"),
      supabase.from("clients").select(`*, primary_director:directors(full_name, email, clinic)`).order("name"),
      supabase.from("client_assignments").select(`*, student:students(full_name, email, clinic), client:clients(name)`),
    ])

    // Check for errors but don't throw - return partial data
    const errors = []
    if (studentsRes.error) errors.push({ table: "students", error: studentsRes.error.message })
    if (directorsRes.error) errors.push({ table: "directors", error: directorsRes.error.message })
    if (clientsRes.error) errors.push({ table: "clients", error: clientsRes.error.message })
    if (assignmentsRes.error) errors.push({ table: "assignments", error: assignmentsRes.error.message })

    return NextResponse.json({
      students: studentsRes.data || [],
      directors: directorsRes.data || [],
      clients: clientsRes.data || [],
      assignments: assignmentsRes.data || [],
      stats: {
        totalStudents: studentsRes.data?.length || 0,
        totalDirectors: directorsRes.data?.length || 0,
        totalClients: clientsRes.data?.length || 0,
        totalAssignments: assignmentsRes.data?.length || 0,
      },
      setupRequired: false,
      errors: errors.length > 0 ? errors : undefined,
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
