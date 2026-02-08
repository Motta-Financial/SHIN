import { createServiceClient } from "@/lib/supabase/service"
import { NextResponse } from "next/server"

// FALL 2025 Schedule data from the CSV files
const FALL_2025_SCHEDULE = [
  {
    semester: "FALL 2025",
    week_number: 1,
    week_label: "Week 1",
    week_start: "2025-09-08",
    week_end: "2025-09-14",
    class_number: 1,
    session_focus: "On-Boarding: All Hands Lecture - Welcome to SEED, Clinic Specific Lecture 1, Meet Your Team",
    time_breakdown:
      "1 Hr - All Hands Lecture, 45 Mn - Clinic Specific Lecture, 30 Mn - Team Case Study, 45 Mn Intro to Clients & Team Assignments",
    in_class_activity: "Teams have initial meeting, exchange information, communication cadence.",
    assignments: "Research client, industry, reading materials. Due: Clinic Assignment 1",
    is_break: false,
  },
  {
    semester: "FALL 2025",
    week_number: 2,
    week_label: "Week 2",
    week_start: "2025-09-15",
    week_end: "2025-09-21",
    class_number: 2,
    session_focus: "On-Boarding: All Hands Lecture - Marketing Clinic, Clinic Specific Lecture 2, Introduction to AI",
    time_breakdown: "15 Mn - All Hands Check-in, 45 Mn All Hands Lecture, 45 Mn Clinic Lecture, 45 Mn Intro to AI",
    in_class_activity: "Introduction to AnyQuest, AI tool.",
    assignments: "Research client, industry, reading materials. Due: Clinic Assignment 2",
    is_break: false,
  },
  {
    semester: "FALL 2025",
    week_number: 3,
    week_label: "Week 3",
    week_start: "2025-09-22",
    week_end: "2025-09-28",
    class_number: 3,
    session_focus: "On-Boarding: All Hands Lecture - Lean Canvas, Clinic Specific Lecture 3, Client or Team Meeting",
    time_breakdown:
      "15 Mn - All Hands Check-in, 45 Mn All Hands Lecture, 45 Mn Clinic Lecture, 45 Client or Team Meeting",
    in_class_activity:
      "Initial Client Meeting(s), gather information to finalize the SOW. Midterm Team Assignment reviewed. Teams meet with Suffolk Research Librarian or Presentation Coach.",
    assignments: "Research client, industry, reading materials. Due: Clinic Assignment 3, Midterm Assignment.",
    is_break: false,
  },
  {
    semester: "FALL 2025",
    week_number: 4,
    week_label: "Week 4",
    week_start: "2025-09-29",
    week_end: "2025-10-05",
    class_number: 4,
    session_focus:
      "On-Boarding: All Hands Lecture - Accounting Clinic, Clinic Specific Lecture 4, Client or Team Meeting",
    time_breakdown:
      "15 Mn - All Hands Check-in, 45 Mn All Hands Lecture, 45 Mn Clinic Lecture, 45 Client or Team Meeting",
    in_class_activity:
      "Initial Client Meeting(s), gather information to finalize the SOW. Midterm Team Assignment reviewed. Teams meet with Suffolk Research Librarian or Presentation Coach.",
    assignments: "Research client, industry, reading materials. Due: Clinic Assignment 4, and Midterm Brief Due.",
    is_break: false,
  },
  {
    semester: "FALL 2025",
    week_number: 5,
    week_label: "Week 5",
    week_start: "2025-10-06",
    week_end: "2025-10-12",
    class_number: 5,
    session_focus: "On-Boarding: All Hands Lecture - Legal Clinic, Clinic Specific Lecture 5, Client or Team Meeting",
    time_breakdown:
      "15 Mn - All Hands Check-in, 45 Mn All Hands Lecture, 45 Mn Clinic Lecture, 45 Client or Team Meeting",
    in_class_activity:
      "Initial Client Meeting(s), gather information to finalize the SOW. Midterm Team Assignment reviewed. Teams meet with Suffolk Research Librarian or Presentation Coach.",
    assignments: "Research client, industry, reading materials. Due: Clinic Assignment 5",
    is_break: false,
  },
  {
    semester: "FALL 2025",
    week_number: null,
    week_label: "October Break",
    week_start: "2025-10-13",
    week_end: "2025-10-19",
    class_number: null,
    session_focus: "October Break - Continuity of Learning Assignment",
    time_breakdown: null,
    in_class_activity: "Teams meet outside class day to work on client project and midterm presentation team project.",
    assignments: "Work on Midterm Presentation & Client Project.",
    is_break: true,
  },
  {
    semester: "FALL 2025",
    week_number: 6,
    week_label: "Week 6",
    week_start: "2025-10-20",
    week_end: "2025-10-26",
    class_number: 6,
    session_focus: "Robert Wolf Day: All Hands Robert Wolf Podcast, Clinic Specific Lecture 5, Client or Team Meeting",
    time_breakdown: "60 Mn All Hands Podcast Attendance, 45 Mn Clinic Lecture, 45 Client or Team Meeting",
    in_class_activity:
      "All Hands attend Robert Wolf Podcast, Clinics Meet, Client or Clinic Director/Client Team Meeting",
    assignments: "Work on assigned client deliverables.",
    is_break: false,
  },
  {
    semester: "FALL 2025",
    week_number: 7,
    week_label: "Week 7",
    week_start: "2025-10-27",
    week_end: "2025-11-02",
    class_number: 7,
    session_focus: "Midterm Presentation: Midterm presentations (Internal). Evaluations of each team and individual.",
    time_breakdown: "2.5 Hrs - 9 clients, each team delivers a 15 Mn presentation.",
    in_class_activity: "Each Client Team presents to the Clinic Directors & other invited guests.",
    assignments: "Work on assigned client deliverables.",
    is_break: false,
  },
  {
    semester: "FALL 2025",
    week_number: 8,
    week_label: "Week 8",
    week_start: "2025-11-03",
    week_end: "2025-11-09",
    class_number: 8,
    session_focus:
      "Client Project Work: All-hands check-in, clinic meetings, and client team/clinic director meetings or team meetings or client meeting",
    time_breakdown:
      "15 Mn - All Hands Check-in, 45 Mn clinic meeting, and 45 mn client team/clinic director meeting or team meeting or client meeting.",
    in_class_activity:
      "Client teams are expected to be focused on meeting the deliverables in the SOW. Range of activities include: team work meetings, individual research, client meetings, client site visits, coaching from clinical directors, meeting with subject matter experts, working with presentation coach.",
    assignments: "Work on assignments based on the SOW and final presentation as the due date gets closer.",
    is_break: false,
  },
  {
    semester: "FALL 2025",
    week_number: 9,
    week_label: "Week 9",
    week_start: "2025-11-10",
    week_end: "2025-11-16",
    class_number: 9,
    session_focus: "Client Project Work",
    time_breakdown: null,
    in_class_activity: "Continued client project work and team meetings.",
    assignments: "Work on client deliverables and final presentation.",
    is_break: false,
  },
  {
    semester: "FALL 2025",
    week_number: 10,
    week_label: "Week 10",
    week_start: "2025-11-17",
    week_end: "2025-11-23",
    class_number: 10,
    session_focus: "Client Project Work",
    time_breakdown: null,
    in_class_activity: "Continued client project work and team meetings.",
    assignments: "Work on client deliverables and final presentation.",
    is_break: false,
  },
  {
    semester: "FALL 2025",
    week_number: 11,
    week_label: "Week 11",
    week_start: "2025-11-24",
    week_end: "2025-11-30",
    class_number: 11,
    session_focus: "Client Project Work",
    time_breakdown: null,
    in_class_activity: "Continued client project work and team meetings.",
    assignments: "Work on client deliverables and final presentation.",
    is_break: false,
  },
  {
    semester: "FALL 2025",
    week_number: 12,
    week_label: "Week 12",
    week_start: "2025-12-01",
    week_end: "2025-12-07",
    class_number: 12,
    session_focus: "Final Presentation: Final presentation of work to client",
    time_breakdown: "Each team delivers a 20 Mn presentation to client and clinic directors.",
    in_class_activity: "Each team presents and is evaluated.",
    assignments: null,
    is_break: false,
  },
  {
    semester: "FALL 2025",
    week_number: 13,
    week_label: "Week 13",
    week_start: "2025-12-08",
    week_end: "2025-12-14",
    class_number: 13,
    session_focus: "Final Presentation: Final presentation of work to client",
    time_breakdown: "Each team delivers a 20 Mn presentation to client and clinic directors.",
    in_class_activity: "Each team presents and is evaluated.",
    assignments: null,
    is_break: false,
  },
]

export async function POST() {
  const supabase = createServiceClient()

  try {
    const results = {
      inserted: 0,
      duplicates: 0,
      errors: [] as string[],
    }

    // Clear existing FALL 2025 schedule to avoid duplicates
    const { error: deleteError } = await supabase.from("semester_schedule").delete().eq("semester", "FALL 2025")

    if (deleteError) {
      console.log("[v0] Warning: Could not clear existing schedule:", deleteError.message)
    }

    // Insert all schedule records
    for (const week of FALL_2025_SCHEDULE) {
      const { error } = await supabase.from("semester_schedule").insert(week)

      if (error) {
        if (error.code === "23505") {
          results.duplicates++
        } else {
          results.errors.push(`${week.week_label}: ${error.message}`)
        }
      } else {
        results.inserted++
      }
    }

    // Verify final count
    const { count } = await supabase
      .from("semester_schedule")
      .select("*", { count: "exact", head: true })
      .eq("semester", "FALL 2025")

    return NextResponse.json({
      success: true,
      message: "Schedule imported successfully",
      results: {
        ...results,
        totalInDatabase: count,
      },
    })
  } catch (error) {
    console.error("[v0] Error importing schedule:", error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}

export async function GET() {
  const supabase = createServiceClient()

  try {
    // Fetch all weeks from semester_schedule
    const { data: schedule, error } = await supabase
      .from("semester_schedule")
      .select("*")
      .eq("semester", "FALL 2025")
      .order("week_start", { ascending: true })

    if (error) {
      throw error
    }

    // Format weeks for the dropdown (using week_end date as the key)
    const weeks = (schedule || []).map((week) => ({
      value: week.week_end,
      label: week.week_label,
      weekNumber: week.week_number,
      isBreak: week.is_break,
      sessionFocus: week.session_focus,
    }))

    return NextResponse.json({
      success: true,
      weeks,
      schedule,
    })
  } catch (error) {
    console.error("[v0] Error fetching schedule:", error)
    return NextResponse.json({ success: false, error: String(error), weeks: [] }, { status: 500 })
  }
}
