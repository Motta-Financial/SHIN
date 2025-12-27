import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_supabase_SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.supabase_SUPABASE_SERVICE_ROLE_KEY || ""

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q") || ""
  const portal = searchParams.get("portal") || "director"
  const filtersParam = searchParams.get("filters") || ""

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] })
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  const searchTerm = `%${query.toLowerCase()}%`
  const activeFilters = filtersParam.split(",").filter(Boolean)

  const results: any[] = []

  try {
    // Search Documents
    if (activeFilters.includes("documents")) {
      const { data: documents } = await supabase
        .from("documents")
        .select("id, file_name, description, student_name, client_name, clinic, uploaded_at, submission_type")
        .or(
          `file_name.ilike.${searchTerm},description.ilike.${searchTerm},student_name.ilike.${searchTerm},client_name.ilike.${searchTerm}`,
        )
        .order("uploaded_at", { ascending: false })
        .limit(10)

      if (documents) {
        results.push(
          ...documents.map((doc) => ({
            id: doc.id,
            type: "document",
            title: doc.file_name || "Untitled Document",
            subtitle: `${doc.student_name || "Unknown"} • ${doc.client_name || "No Client"}`,
            description: doc.description,
            date: doc.uploaded_at,
            url: "/documents",
            metadata: { status: doc.submission_type, clinic: doc.clinic },
          })),
        )
      }
    }

    // Search Debriefs
    if (activeFilters.includes("debriefs")) {
      const { data: debriefs } = await supabase
        .from("debriefs")
        .select("id, student_email, client_name, clinic, work_summary, questions, status, week_ending, hours_worked")
        .or(
          `work_summary.ilike.${searchTerm},questions.ilike.${searchTerm},client_name.ilike.${searchTerm},student_email.ilike.${searchTerm}`,
        )
        .order("week_ending", { ascending: false })
        .limit(10)

      if (debriefs) {
        results.push(
          ...debriefs.map((debrief) => ({
            id: debrief.id,
            type: "debrief",
            title: `Week ${debrief.week_ending ? new Date(debrief.week_ending).toLocaleDateString() : "Unknown"}`,
            subtitle: `${debrief.student_email || "Unknown"} • ${debrief.client_name || "No Client"} • ${debrief.hours_worked || 0}h`,
            description: debrief.work_summary?.substring(0, 100),
            date: debrief.week_ending,
            url: portal === "student" ? "/students?tab=attendance" : "/student-progress",
            metadata: { status: debrief.status, clinic: debrief.clinic },
          })),
        )
      }
    }

    // Search Students (director only)
    if (activeFilters.includes("students") && portal === "director") {
      const { data: students } = await supabase
        .from("students")
        .select("id, full_name, email, clinic, client_team, status, academic_level")
        .or(`full_name.ilike.${searchTerm},email.ilike.${searchTerm},clinic.ilike.${searchTerm}`)
        .limit(10)

      if (students) {
        results.push(
          ...students.map((student) => ({
            id: student.id,
            type: "student",
            title: student.full_name || "Unknown Student",
            subtitle: `${student.email || "No email"} • ${student.clinic || "No Clinic"}`,
            description: student.client_team ? `Team: ${student.client_team}` : undefined,
            url: "/student-progress",
            metadata: { status: student.status, level: student.academic_level },
          })),
        )
      }
    }

    // Search Clients (director only)
    if (activeFilters.includes("clients") && portal === "director") {
      const { data: clients } = await supabase
        .from("clients")
        .select("id, name, contact_name, email, project_type, status")
        .or(`name.ilike.${searchTerm},contact_name.ilike.${searchTerm},email.ilike.${searchTerm}`)
        .limit(10)

      if (clients) {
        results.push(
          ...clients.map((client) => ({
            id: client.id,
            type: "client",
            title: client.name || "Unknown Client",
            subtitle: `${client.contact_name || "No Contact"} • ${client.email || "No email"}`,
            description: client.project_type ? `Project: ${client.project_type}` : undefined,
            url: "/client-engagements",
            metadata: { status: client.status },
          })),
        )
      }
    }

    // Search Attendance
    if (activeFilters.includes("attendance")) {
      const { data: attendance } = await supabase
        .from("attendance")
        .select("student_id, student_name, student_email, class_date, week_number, clinic, notes")
        .or(`student_name.ilike.${searchTerm},student_email.ilike.${searchTerm},notes.ilike.${searchTerm}`)
        .order("class_date", { ascending: false })
        .limit(10)

      if (attendance) {
        results.push(
          ...attendance.map((att) => ({
            id: `${att.student_id}-${att.class_date}`,
            type: "attendance",
            title: `${att.student_name || att.student_email || "Unknown"} - Week ${att.week_number || "?"}`,
            subtitle: `${att.clinic || "No Clinic"} • ${att.class_date ? new Date(att.class_date).toLocaleDateString() : "No date"}`,
            description: att.notes,
            date: att.class_date,
            url: portal === "student" ? "/students?tab=attendance" : "/student-progress",
            metadata: { clinic: att.clinic },
          })),
        )
      }
    }

    // Search Meeting Requests
    if (activeFilters.includes("meetings")) {
      const { data: meetings } = await supabase
        .from("meeting_requests")
        .select("id, student_name, student_email, subject, message, status, created_at, clinic")
        .or(`student_name.ilike.${searchTerm},subject.ilike.${searchTerm},message.ilike.${searchTerm}`)
        .order("created_at", { ascending: false })
        .limit(10)

      if (meetings) {
        results.push(
          ...meetings.map((meeting) => ({
            id: meeting.id,
            type: "meeting",
            title: meeting.subject || "Meeting Request",
            subtitle: `${meeting.student_name || meeting.student_email || "Unknown"} • ${meeting.clinic || "No Clinic"}`,
            description: meeting.message?.substring(0, 100),
            date: meeting.created_at,
            url: portal === "student" ? "/students?tab=questions" : "/student-progress",
            metadata: { status: meeting.status },
          })),
        )
      }
    }

    // Search Notifications
    if (activeFilters.includes("notifications")) {
      const { data: notifications } = await supabase
        .from("notifications")
        .select("id, title, message, type, created_at, is_read")
        .or(`title.ilike.${searchTerm},message.ilike.${searchTerm}`)
        .order("created_at", { ascending: false })
        .limit(10)

      if (notifications) {
        results.push(
          ...notifications.map((notif) => ({
            id: notif.id,
            type: "notification",
            title: notif.title || "Notification",
            subtitle: notif.type || "General",
            description: notif.message?.substring(0, 100),
            date: notif.created_at,
            url: portal === "student" ? "/students" : "/",
            metadata: { status: notif.is_read ? "Read" : "Unread" },
          })),
        )
      }
    }

    // Sort results by date (most recent first)
    results.sort((a, b) => {
      if (!a.date && !b.date) return 0
      if (!a.date) return 1
      if (!b.date) return -1
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    })

    return NextResponse.json({ results: results.slice(0, 50) })
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json({ results: [], error: "Search failed" }, { status: 500 })
  }
}
