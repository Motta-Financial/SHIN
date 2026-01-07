import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(req.url)
    const email = searchParams.get("email")
    const studentId = searchParams.get("studentId")
    const includeDebriefs = searchParams.get("includeDebriefs") === "true"

    const { data: allTeamData, error: viewError } = await supabase.from("v_complete_mapping").select("*")

    if (viewError) {
      console.error("[v0] Error fetching from v_complete_mapping:", viewError)
      return NextResponse.json({ success: false, error: viewError.message }, { status: 500 })
    }

    // Find the student's record(s) - prefer UUID lookup, fallback to email
    let studentRecords: any[] = []
    if (studentId && studentId !== "undefined") {
      studentRecords = (allTeamData || []).filter((r: any) => r.student_id === studentId)
    } else if (email && email !== "undefined") {
      studentRecords = (allTeamData || []).filter((r: any) => r.student_email?.toLowerCase() === email.toLowerCase())
    } else {
      return NextResponse.json({ success: false, error: "Valid studentId or email required" }, { status: 400 })
    }

    if (studentRecords.length === 0) {
      return NextResponse.json({
        success: true,
        teamMembers: [],
        clientName: "",
        notes: [],
        debriefs: [],
        totalHours: 0,
      })
    }

    // Get the client from the student's first record
    const studentData = studentRecords[0]
    const clientId = studentData.client_id
    const clientName = studentData.client_name || ""

    // Get client details
    const { data: clientData } = await supabase.from("clients").select("*").eq("id", clientId).maybeSingle()

    // Get ALL team members for this client from the view data (already fetched)
    const teamRecords = (allTeamData || []).filter((r: any) => r.client_id === clientId)

    // Build unique team members list (dedupe by student_id)
    const teamMemberMap = new Map<string, any>()
    for (const m of teamRecords) {
      if (m.student_id && !teamMemberMap.has(m.student_id)) {
        teamMemberMap.set(m.student_id, {
          id: m.student_id,
          full_name: m.student_name || "",
          email: m.student_email || "",
          role: m.student_role || "Team Member",
          clinic: m.student_clinic_name || "",
          totalHours: 0,
          debriefCount: 0,
        })
      }
    }

    const teamMembers = Array.from(teamMemberMap.values())

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

        // Calculate total hours and per-member stats
        const memberHours = new Map<string, { hours: number; count: number }>()
        for (const d of teamDebriefs) {
          totalHours += d.hours_worked || 0
          const existing = memberHours.get(d.student_id) || { hours: 0, count: 0 }
          existing.hours += d.hours_worked || 0
          existing.count += 1
          memberHours.set(d.student_id, existing)
        }

        // Add hours to team members
        for (const member of teamMembers) {
          const stats = memberHours.get(member.id) || { hours: 0, count: 0 }
          member.totalHours = stats.hours
          member.debriefCount = stats.count
        }
      }
    }

    return NextResponse.json({
      success: true,
      teamMembers,
      clientName: clientData?.name || clientName,
      clientEmail: clientData?.email || "",
      projectType: clientData?.project_type || "",
      status: clientData?.status || "active",
      clientId,
      clinicId: studentData.student_clinic_id,
      clinicName: studentData.student_clinic_name,
      clinicDirectorId: studentData.clinic_director_id,
      clinicDirectorName: studentData.clinic_director_name,
      clientDirectorId: studentData.client_director_id,
      clientDirectorName: studentData.client_director_name,
      notes: [],
      debriefs,
      totalHours,
      sowProgress: buildSowProgress(debriefs.length, totalHours),
    })
  } catch (error) {
    console.error("[v0] Team workspace error:", error)
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
      { name: "Final Deliverable", completed: totalHours >= 90, dueDate: "2025-12-15" },
    ],
  }
}
