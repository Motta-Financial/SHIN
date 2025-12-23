import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(req.url)
    const email = searchParams.get("email")
    const includeDebriefs = searchParams.get("includeDebriefs") === "true"

    if (!email || email === "undefined") {
      return NextResponse.json({ success: false, error: "Valid email required" }, { status: 400 })
    }

    // This view links: students -> clients -> clinics -> directors
    const { data: allTeamData, error: viewError } = await supabase.from("v_student_client_team_clinics").select("*")

    if (viewError) {
      console.error("[v0] Error fetching from view:", viewError)
      return NextResponse.json({ success: false, error: viewError.message }, { status: 500 })
    }

    // Find the student's record(s) in the view
    const studentRecords = (allTeamData || []).filter((r) => r.student_email?.toLowerCase() === email.toLowerCase())

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
    const teamRecords = (allTeamData || []).filter((r) => r.client_id === clientId)

    // Build unique team members list (dedupe by student_id)
    const teamMemberMap = new Map<string, any>()
    for (const m of teamRecords) {
      if (m.student_id && !teamMemberMap.has(m.student_id)) {
        teamMemberMap.set(m.student_id, {
          id: m.student_id,
          full_name: m.student_name || "",
          email: m.student_email || "",
          role: m.team_role || "Team Member",
          clinic: m.clinic_name || "",
          totalHours: 0,
          debriefCount: 0,
        })
      }
    }

    const teamMembers = Array.from(teamMemberMap.values())

    let debriefs: any[] = []
    let totalHours = 0

    if (includeDebriefs && teamMembers.length > 0) {
      const teamEmails = teamMembers.map((m) => m.email)

      const { data: teamDebriefs } = await supabase
        .from("debriefs")
        .select("*")
        .in("student_email", teamEmails)
        .order("created_at", { ascending: false })

      if (teamDebriefs) {
        debriefs = teamDebriefs.map((d) => ({
          id: d.id,
          studentName: d.student_name,
          studentEmail: d.student_email,
          hoursWorked: d.hours_worked || 0,
          workSummary: d.work_summary || "",
          questions: d.questions,
          weekEnding: d.week_ending,
          weekNumber: d.week_number,
          clinic: d.clinic,
          clientName: d.client_name,
          createdAt: d.created_at,
        }))

        // Calculate total hours and per-member stats
        const memberHours = new Map<string, { hours: number; count: number }>()
        for (const d of teamDebriefs) {
          totalHours += d.hours_worked || 0
          const existing = memberHours.get(d.student_email) || { hours: 0, count: 0 }
          existing.hours += d.hours_worked || 0
          existing.count += 1
          memberHours.set(d.student_email, existing)
        }

        // Add hours to team members
        for (const member of teamMembers) {
          const stats = memberHours.get(member.email) || { hours: 0, count: 0 }
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
