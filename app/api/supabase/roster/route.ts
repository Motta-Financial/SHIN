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

    let query = supabase.from("v_complete_mapping").select("*").order("student_name", { ascending: true })

    if (studentId) {
      query = query.eq("student_id", studentId)
    }

    if (activeSemesterId && !studentId) {
      query = query.eq("semester_id", activeSemesterId)
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

    const formattedStudents = (students || []).map((student: any) => ({
      id: student.student_id,
      firstName: student.student_name?.split(" ")[0] || "",
      lastName: student.student_name?.split(" ").slice(1).join(" ") || "",
      fullName: student.student_name,
      email: student.student_email,
      universityId: null, // Not in v_complete_mapping
      clinic: student.student_clinic_name,
      clinicId: student.student_clinic_id,
      clientId: student.client_id,
      clientName: student.client_name,
      education: null, // Not in v_complete_mapping
      academicLevel: null, // Not in v_complete_mapping
      businessExperience: null, // Not in v_complete_mapping
      linkedinProfile: null, // Not in v_complete_mapping
      status: null, // Not in v_complete_mapping
      semesterId: student.semester_id,
      isTeamLeader: null, // Not in v_complete_mapping
      totalHours: hoursByStudent[student.student_id] || 0,
      attendanceCount: attendanceByStudent[student.student_id] || 0,
    }))

    return NextResponse.json({ students: formattedStudents })
  } catch (error) {
    console.log("[v0] Error fetching roster:", error)
    return NextResponse.json({ students: [] })
  }
}
