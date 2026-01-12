import { createServiceClient } from "@/lib/supabase/service"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get("studentId")
    const semesterId = searchParams.get("semesterId")
    const includeAll = searchParams.get("includeAll") === "true"

    let activeSemesterId = semesterId

    if (!activeSemesterId && !includeAll && !studentId) {
      const { data: activeSemester } = await supabase
        .from("semester_config")
        .select("id")
        .eq("is_active", true)
        .single()

      activeSemesterId = activeSemester?.id
    }

    let query = supabase
      .from("students")
      .select(`
        id,
        first_name,
        last_name,
        full_name,
        email,
        university_id,
        clinic_id,
        client_id,
        education,
        academic_level,
        business_experience,
        linkedin_profile,
        status,
        semester_id,
        is_team_leader,
        clients!students_client_id_fkey(id, name)
      `)
      .order("full_name", { ascending: true })

    if (studentId) {
      query = query.eq("id", studentId)
    }

    if (activeSemesterId && !studentId) {
      query = query.eq("semester_id", activeSemesterId)
    }

    const { data: students, error } = await query

    if (error) {
      console.log("[v0] Supabase roster error:", error.message)
      return NextResponse.json({ students: [] })
    }

    // ... existing code for debriefs and attendance ...
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
      clinicId: student.clinic_id,
      clientId: student.clients?.id || student.client_id,
      clientName: student.clients?.name,
      education: student.education,
      academicLevel: student.academic_level,
      businessExperience: student.business_experience,
      linkedinProfile: student.linkedin_profile,
      status: student.status,
      semesterId: student.semester_id,
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
