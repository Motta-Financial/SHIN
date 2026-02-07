import { createServiceClient } from "@/lib/supabase/service"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get("studentId")
    const semesterId = searchParams.get("semesterId")
    const includeAll = searchParams.get("includeAll") === "true"

    // Determine which semester to query
    let targetSemesterId = semesterId

    // For a specific student, query students_current (no semester filter needed - view handles it)
    // For listing all students without a semesterId, also use students_current
    // For a specific past semester, query the base students table with semester filter

    const isCurrentSemester = !targetSemesterId && !includeAll

    if (isCurrentSemester || studentId) {
      // === Use students_current view (current semester) ===
      let query = supabase
        .from("students_current")
        .select("id, first_name, last_name, full_name, email, university_id, clinic, clinic_id, client_id, education, academic_level, business_experience, linkedin_profile, status, semester_id, is_team_leader, phone, bio, profile_picture_url")
        .order("full_name", { ascending: true })

      if (studentId) {
        query = query.eq("id", studentId)
      }

      const { data: students, error } = await query

      if (error) {
        const msg = error.message || ""
        if (msg.includes("Too Many R") || msg.includes("rate limit")) {
          return NextResponse.json({ students: [] }, { status: 429 })
        }
        return NextResponse.json({ students: [] })
      }

      // Get client names for students that have client_id
      const clientIds = [...new Set((students || []).map(s => s.client_id).filter(Boolean))]
      let clientMap: Record<string, string> = {}
      if (clientIds.length > 0) {
        const { data: clients } = await supabase
          .from("clients_current")
          .select("id, name")
          .in("id", clientIds)
        if (clients) {
          clientMap = Object.fromEntries(clients.map(c => [c.id, c.name]))
        }
      }

      // Get hours and attendance
      let debriefsQuery = supabase.from("debriefs").select("student_id, hours_worked")
      let attendanceQuery = supabase.from("attendance").select("student_id, is_present")
      if (studentId) {
        debriefsQuery = debriefsQuery.eq("student_id", studentId)
        attendanceQuery = attendanceQuery.eq("student_id", studentId)
      }
      const { data: debriefs } = await debriefsQuery
      const { data: attendance } = await attendanceQuery

      const hoursByStudent = (debriefs || []).reduce((acc, d) => {
        if (d.student_id) acc[d.student_id] = (acc[d.student_id] || 0) + (d.hours_worked || 0)
        return acc
      }, {} as Record<string, number>)

      const attendanceByStudent = (attendance || []).reduce((acc, a) => {
        if (a.student_id && a.is_present) acc[a.student_id] = (acc[a.student_id] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const formattedStudents = (students || []).map((s) => ({
        id: s.id,
        firstName: s.first_name || s.full_name?.split(" ")[0] || "",
        lastName: s.last_name || s.full_name?.split(" ").slice(1).join(" ") || "",
        fullName: s.full_name,
        email: s.email,
        universityId: s.university_id,
        clinic: s.clinic,
        clinicId: s.clinic_id,
        clientId: s.client_id,
        clientName: s.client_id ? (clientMap[s.client_id] || null) : null,
        education: s.education,
        academicLevel: s.academic_level,
        businessExperience: s.business_experience,
        linkedinProfile: s.linkedin_profile,
        status: s.status,
        semesterId: s.semester_id,
        isTeamLeader: s.is_team_leader,
        phone: s.phone,
        bio: s.bio,
        profilePictureUrl: s.profile_picture_url,
        totalHours: hoursByStudent[s.id] || 0,
        attendanceCount: attendanceByStudent[s.id] || 0,
      }))

      return NextResponse.json({ students: formattedStudents })

    } else {
      // === Past semester or includeAll: use base students table with semester filter ===
      if (!targetSemesterId && !includeAll) {
        const { data: activeSemester } = await supabase
          .from("semester_config")
          .select("id")
          .eq("is_active", true)
          .single()
        targetSemesterId = activeSemester?.id
      }

      let query = supabase
        .from("students")
        .select("id, first_name, last_name, full_name, email, university_id, clinic, clinic_id, client_id, education, academic_level, business_experience, linkedin_profile, status, semester_id, is_team_leader, phone, bio, profile_picture_url")
        .order("full_name", { ascending: true })

      if (targetSemesterId) {
        query = query.eq("semester_id", targetSemesterId)
      }

      const { data: students, error } = await query

      if (error) {
        const msg = error.message || ""
        if (msg.includes("Too Many R") || msg.includes("rate limit")) {
          return NextResponse.json({ students: [] }, { status: 429 })
        }
        return NextResponse.json({ students: [] })
      }

      // Get client names
      const clientIds = [...new Set((students || []).map(s => s.client_id).filter(Boolean))]
      let clientMap: Record<string, string> = {}
      if (clientIds.length > 0) {
        const { data: clients } = await supabase
          .from("clients")
          .select("id, name")
          .in("id", clientIds)
        if (clients) {
          clientMap = Object.fromEntries(clients.map(c => [c.id, c.name]))
        }
      }

      const { data: debriefs } = await supabase.from("debriefs").select("student_id, hours_worked")
      const { data: attendance } = await supabase.from("attendance").select("student_id, is_present")

      const hoursByStudent = (debriefs || []).reduce((acc, d) => {
        if (d.student_id) acc[d.student_id] = (acc[d.student_id] || 0) + (d.hours_worked || 0)
        return acc
      }, {} as Record<string, number>)

      const attendanceByStudent = (attendance || []).reduce((acc, a) => {
        if (a.student_id && a.is_present) acc[a.student_id] = (acc[a.student_id] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const formattedStudents = (students || []).map((s) => ({
        id: s.id,
        firstName: s.first_name || s.full_name?.split(" ")[0] || "",
        lastName: s.last_name || s.full_name?.split(" ").slice(1).join(" ") || "",
        fullName: s.full_name,
        email: s.email,
        universityId: s.university_id,
        clinic: s.clinic,
        clinicId: s.clinic_id,
        clientId: s.client_id,
        clientName: s.client_id ? (clientMap[s.client_id] || null) : null,
        education: s.education,
        academicLevel: s.academic_level,
        businessExperience: s.business_experience,
        linkedinProfile: s.linkedin_profile,
        status: s.status,
        semesterId: s.semester_id,
        isTeamLeader: s.is_team_leader,
        phone: s.phone,
        bio: s.bio,
        profilePictureUrl: s.profile_picture_url,
        totalHours: hoursByStudent[s.id] || 0,
        attendanceCount: attendanceByStudent[s.id] || 0,
      }))

      return NextResponse.json({ students: formattedStudents })
    }
  } catch (error: any) {
    const msg = error?.message || ""
    if (msg.includes("Too Many R") || msg.includes("Unexpected token") || msg.includes("rate limit")) {
      return NextResponse.json({ students: [] }, { status: 429 })
    }
    console.error("Error fetching roster:", error)
    return NextResponse.json({ students: [] })
  }
}
