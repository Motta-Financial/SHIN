import { createServiceClient } from "@/lib/supabase/service"
import { NextResponse } from "next/server"

// API endpoint for fetching students from the students table
export async function GET() {
  try {
    const supabase = createServiceClient()

    // Using students_current view for current semester data
    const { data, error } = await supabase
      .from("students_current")
      .select(`
        id,
        first_name,
        last_name,
        email,
        status,
        is_team_leader,
        clinic_id,
        clinics:clinic_id (
          id,
          name
        )
      `)
      .eq("status", "active")
      .order("last_name", { ascending: true })

    if (error) {
      console.error("[v0] Supabase students error:", error.message)
      return NextResponse.json({ students: [] })
    }

    const students = (data || []).map((student: any) => ({
      id: student.id,
      first_name: student.first_name,
      last_name: student.last_name,
      email: student.email,
      status: student.status,
      is_team_leader: student.is_team_leader,
      clinic_id: student.clinic_id,
      clinic_name: student.clinics?.name || "Unknown Clinic",
    }))

    console.log("[v0] Fetched students count:", students.length)
    return NextResponse.json({ students })
  } catch (error) {
    console.error("[v0] Error fetching students:", error)
    return NextResponse.json({ students: [] })
  }
}
