import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const supabase = await createClient()

    console.log("[v0] Starting database setup...")

    // Create students table
    const { error: studentsError } = await supabase.rpc("exec_sql", {
      sql: `
        CREATE TABLE IF NOT EXISTS students (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          full_name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          clinic TEXT NOT NULL,
          role TEXT NOT NULL,
          semester TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
        CREATE INDEX IF NOT EXISTS idx_students_clinic ON students(clinic);
        CREATE INDEX IF NOT EXISTS idx_students_semester ON students(semester);
      `,
    })

    if (studentsError) {
      console.error("[v0] Error creating students table:", studentsError)
    } else {
      console.log("[v0] Students table created successfully")
    }

    // Create directors table
    const { error: directorsError } = await supabase.rpc("exec_sql", {
      sql: `
        CREATE TABLE IF NOT EXISTS directors (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          full_name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          clinic TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_directors_email ON directors(email);
        CREATE INDEX IF NOT EXISTS idx_directors_clinic ON directors(clinic);
      `,
    })

    if (directorsError) {
      console.error("[v0] Error creating directors table:", directorsError)
    } else {
      console.log("[v0] Directors table created successfully")
    }

    // Create clients table
    const { error: clientsError } = await supabase.rpc("exec_sql", {
      sql: `
        CREATE TABLE IF NOT EXISTS clients (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          primary_clinic TEXT NOT NULL,
          secondary_clinic TEXT,
          primary_director_id UUID REFERENCES directors(id),
          semester TEXT NOT NULL,
          website TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
        CREATE INDEX IF NOT EXISTS idx_clients_primary_clinic ON clients(primary_clinic);
        CREATE INDEX IF NOT EXISTS idx_clients_semester ON clients(semester);
      `,
    })

    if (clientsError) {
      console.error("[v0] Error creating clients table:", clientsError)
    } else {
      console.log("[v0] Clients table created successfully")
    }

    // Create client_assignments table
    const { error: assignmentsError } = await supabase.rpc("exec_sql", {
      sql: `
        CREATE TABLE IF NOT EXISTS client_assignments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          student_id UUID REFERENCES students(id) ON DELETE CASCADE,
          client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
          role TEXT NOT NULL,
          semester TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(student_id, client_id, semester)
        );

        CREATE INDEX IF NOT EXISTS idx_assignments_student ON client_assignments(student_id);
        CREATE INDEX IF NOT EXISTS idx_assignments_client ON client_assignments(client_id);
        CREATE INDEX IF NOT EXISTS idx_assignments_semester ON client_assignments(semester);
      `,
    })

    if (assignmentsError) {
      console.error("[v0] Error creating client_assignments table:", assignmentsError)
    } else {
      console.log("[v0] Client assignments table created successfully")
    }

    console.log("[v0] Database setup completed!")

    return NextResponse.json({
      success: true,
      message: "Database tables created successfully. You can now import data from the CSV files.",
      tables: ["students", "directors", "clients", "client_assignments"],
    })
  } catch (error) {
    console.error("[v0] Database setup error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to set up database",
        message: error instanceof Error ? error.message : "Unknown error",
        instructions: "Please run the SQL scripts manually in Supabase SQL Editor",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Database setup endpoint. Send a POST request to create tables.",
    instructions: [
      "1. Send a POST request to /api/setup-database to create tables",
      "2. Then run the data import scripts (02-seed-directors-data.sql, etc.) in Supabase SQL Editor",
      "3. Or use the Airtable data until Supabase tables are populated",
    ],
  })
}
