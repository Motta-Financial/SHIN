import { createServiceClient } from "@/lib/supabase/service"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get("studentId")

    let query = supabase
      .from("students")
      .select(`
        id,
        first_name,
        last_name,
        full_name,
        email,
        university_id,
        clinic,
        client_team,
        client_id,
        education,
        academic_level,
        business_experience,
        linkedin_profile,
        status,
        semester,
        is_team_leader,
        clients!students_client_id_fkey(id, name)
      `)
      .order("full_name", { ascending: true })

    if (studentId) {
      query = query.eq("id", studentId)
    }

    const { data: students, error } = await query

    if (error) {
      console.log("[v0] Supabase roster error:", error.message)
      return NextResponse.json({ students: [] })
    }

    let debriefsQuery = supabase.from("debriefs").select("student_id, hours_worked")
    let attendanceQuery = supabase.from("attendance").select("student_id")

    if (studentId) {
      debriefsQuery = debriefsQuery.eq("student_id", studentId)
      attendanceQuery = attendanceQuery.eq("student_id", studentId)
    }

    const { data: debriefs } = await debriefsQuery
    const { data: attendance } = await attendanceQuery

    // Calculate total hours per student
    const hoursByStudent = (debriefs || []).reduce(
      (acc, d) => {
        if (d.student_id) {
          acc[d.student_id] = (acc[d.student_id] || 0) + (d.hours_worked || 0)
        }
        return acc
      },
      {} as Record<string, number>,
    )

    const attendanceByStudent = (attendance || []).reduce(
      (acc, a) => {
        if (a.student_id) {
          acc[a.student_id] = (acc[a.student_id] || 0) + 1
        }
        return acc
      },
      {} as Record<string, number>,
    )

    const formattedStudents = (students || []).map((student) => ({
      id: student.id,
      firstName: student.first_name,
      lastName: student.last_name,
      fullName: student.full_name,
      email: student.email,
      universityId: student.university_id,
      clinic: student.clinic,
      clientTeam: student.client_team,
      clientId: student.clients?.id || student.client_id,
      clientName: student.clients?.name || student.client_team,
      education: student.education,
      academicLevel: student.academic_level,
      businessExperience: student.business_experience,
      linkedinProfile: student.linkedin_profile,
      status: student.status,
      semester: student.semester,
      isTeamLeader: student.is_team_leader,
      totalHours: hoursByStudent[student.id] || 0,
      attendanceCount: attendanceByStudent[student.id] || 0,
    }))

    return NextResponse.json({ students: formattedStudents })
  } catch (error) {
    console.log("[v0] Error fetching roster:", error)
    return NextResponse.json({ students: [] })
  }
}
