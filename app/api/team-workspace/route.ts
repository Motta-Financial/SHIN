import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(req.url)
    const email = searchParams.get("email")
    const studentId = searchParams.get("studentId")
    const includeDebriefs = searchParams.get("includeDebriefs") === "true"

    // Find the student in students_current
    let studentRecord: any = null
    if (studentId && studentId !== "undefined") {
      const { data } = await supabase
        .from("students_current")
        .select("id, full_name, email, clinic_id, clinic, client_id, is_team_leader, semester_id")
        .eq("id", studentId)
        .maybeSingle()
      studentRecord = data
    } else if (email && email !== "undefined") {
      const { data } = await supabase
        .from("students_current")
        .select("id, full_name, email, clinic_id, clinic, client_id, is_team_leader, semester_id")
        .ilike("email", email)
        .maybeSingle()
      studentRecord = data
    } else {
      return NextResponse.json({ success: false, error: "Valid studentId or email required" }, { status: 400 })
    }

    if (!studentRecord) {
      return NextResponse.json({
        success: true,
        teamMembers: [],
        clientName: "",
        notes: [],
        debriefs: [],
        deliverables: [],
        totalHours: 0,
      })
    }

    const clientId = studentRecord.client_id

    // Fetch client data
    let clientData: any = null
    if (clientId) {
      const { data } = await supabase.from("clients_current").select("*").eq("id", clientId).maybeSingle()
      clientData = data
    }

    // Get ALL team members for this client from students_current
    let teamStudents: any[] = []
    if (clientId) {
      const { data } = await supabase
        .from("students_current")
        .select("id, full_name, email, clinic_id, clinic, is_team_leader")
        .eq("client_id", clientId)
      teamStudents = data || []
    } else {
      teamStudents = [studentRecord]
    }

    const teamMemberMap = new Map<string, any>()
    for (const s of teamStudents) {
      if (s.id && !teamMemberMap.has(s.id)) {
        teamMemberMap.set(s.id, {
          id: s.id,
          full_name: s.full_name || "",
          email: s.email || "",
          role: s.is_team_leader ? "Team Leader" : "Team Member",
          clinic: s.clinic || "",
          totalHours: 0,
          debriefCount: 0,
        })
      }
    }

    const teamMembers = Array.from(teamMemberMap.values())

    // Get directors for this student's clinic
    let clinicDirectorId: string | null = null
    let clinicDirectorName: string | null = null
    let clientDirectorId: string | null = null
    let clientDirectorName: string | null = null

    if (studentRecord.clinic_id) {
      const { data: clinicDir } = await supabase
        .from("directors_current")
        .select("id, full_name")
        .eq("clinic_id", studentRecord.clinic_id)
        .maybeSingle()
      if (clinicDir) {
        clinicDirectorId = clinicDir.id
        clinicDirectorName = clinicDir.full_name
      }
    }

    if (clientData?.primary_director_id) {
      const { data: clientDir } = await supabase
        .from("directors_current")
        .select("id, full_name")
        .eq("id", clientData.primary_director_id)
        .maybeSingle()
      if (clientDir) {
        clientDirectorId = clientDir.id
        clientDirectorName = clientDir.full_name
      }
    }

    let debriefs: any[] = []
    let totalHours = 0

    if (includeDebriefs && teamMembers.length > 0) {
      const teamStudentIds = teamMembers.map((m) => m.id)

      const { data: teamDebriefs } = await supabase
        .from("debriefs")
        .select("*")
        .in("student_id", teamStudentIds)
        .order("created_at", { ascending: false })

      if (teamDebriefs) {
        debriefs = teamDebriefs.map((d) => {
          const member = teamMemberMap.get(d.student_id)
          return {
            id: d.id,
            studentName: member?.full_name || d.student_email || "Unknown",
            studentEmail: d.student_email,
            studentId: d.student_id,
            hoursWorked: d.hours_worked || 0,
            workSummary: d.work_summary || "",
            questions: d.questions,
            weekEnding: d.week_ending,
            weekNumber: d.week_number,
            clinic: d.clinic,
            clientName: d.client_name,
            createdAt: d.created_at,
          }
        })

        const memberHours = new Map<string, { hours: number; count: number }>()
        for (const d of teamDebriefs) {
          totalHours += d.hours_worked || 0
          const existing = memberHours.get(d.student_id) || { hours: 0, count: 0 }
          existing.hours += d.hours_worked || 0
          existing.count += 1
          memberHours.set(d.student_id, existing)
        }

        for (const member of teamMembers) {
          const stats = memberHours.get(member.id) || { hours: 0, count: 0 }
          member.totalHours = stats.hours
          member.debriefCount = stats.count
        }
      }
    }

    let deliverables: any[] = []
    if (clientId) {
      const { data: clientDeliverables } = await supabase
        .from("documents")
        .select(`
          *,
          document_reviews (
            id, grade, comment, director_name, created_at
          )
        `)
        .eq("client_id", clientId)
        .order("uploaded_at", { ascending: false })

      if (clientDeliverables) {
        deliverables = clientDeliverables.map((d) => ({
          id: d.id,
          fileName: d.file_name,
          fileUrl: d.file_url,
          fileType: d.file_type,
          fileSize: d.file_size,
          submissionType: d.submission_type,
          studentName: d.student_name,
          studentId: d.student_id,
          clientName: d.client_name,
          uploadedAt: d.uploaded_at,
          uploadedBy: d.student_name,
          status: d.document_reviews?.length > 0 ? (d.document_reviews[0].grade ? "graded" : "reviewed") : "submitted",
          grade: d.document_reviews?.[0]?.grade || null,
          comment: d.document_reviews?.[0]?.comment || null,
          reviewedBy: d.document_reviews?.[0]?.director_name || null,
          reviewedAt: d.document_reviews?.[0]?.created_at || null,
        }))
      }
    }

    return NextResponse.json({
      success: true,
      teamMembers,
      clientName: clientData?.name || "",
      clientEmail: clientData?.email || "",
      projectType: clientData?.project_type || "",
      status: clientData?.status || "active",
      clientId,
      clinicId: studentRecord.clinic_id,
      clinicName: studentRecord.clinic,
      clinicDirectorId,
      clinicDirectorName,
      clientDirectorId,
      clientDirectorName,
      notes: [],
      debriefs,
      deliverables,
      totalHours,
      sowProgress: buildSowProgress(debriefs.length, totalHours),
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

function buildSowProgress(debriefCount: number, totalHours: number) {
  return {
    phase: debriefCount > 5 ? "Execution" : debriefCount > 2 ? "Planning" : "Discovery",
    percentComplete: Math.min(Math.round((totalHours / 100) * 100), 100),
    milestones: [
      { name: "Client Kickoff Meeting", completed: debriefCount > 0 },
      { name: "Initial Research & Analysis", completed: totalHours >= 10 },
      { name: "Strategy Development", completed: totalHours >= 30 },
      { name: "Implementation", completed: totalHours >= 60 },
      { name: "Final Deliverable", completed: totalHours >= 90, dueDate: "2026-04-20" },
    ],
  }
}
