import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get student
    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("*")
      .eq("id", id)
      .maybeSingle()

    if (studentError) throw studentError
    if (!student) {
      return NextResponse.json({ success: false, error: "Student not found" }, { status: 404 })
    }

    // Get assigned clients
    const { data: clientAssignments } = await supabase
      .from("client_assignments")
      .select(`
        clients:client_id (
          id,
          name
        )
      `)
      .eq("student_id", id)

    const clients =
      clientAssignments
        ?.map((ca: any) => ({
          id: ca.clients?.id,
          name: ca.clients?.name,
        }))
        .filter((c: any) => c.id) || []

    // Get directors from the student's clinic
    const { data: clinicDirectors } = await supabase
      .from("directors")
      .select("id, full_name")
      .eq("clinic", student.clinic)

    const directors =
      clinicDirectors?.map((d: any) => ({
        id: d.id,
        name: d.full_name,
      })) || []

    return NextResponse.json({
      success: true,
      data: {
        id: student.id,
        full_name: student.full_name,
        first_name: student.first_name,
        last_name: student.last_name,
        email: student.email,
        clinic: student.clinic,
        client_team: student.client_team,
        is_team_leader: student.is_team_leader,
        academic_level: student.academic_level,
        education: student.education,
        linkedin_profile: student.linkedin_profile,
        business_experience: student.business_experience,
        semester: student.semester,
        status: student.status,
        clients,
        directors,
      },
    })
  } catch (error) {
    console.error("Error fetching student:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch student" }, { status: 500 })
  }
}
