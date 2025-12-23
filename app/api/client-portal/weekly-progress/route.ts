import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const clientName = searchParams.get("clientName")
    const clientId = searchParams.get("clientId")

    const supabase = await createClient()

    let targetClientName = clientName

    // If clientId provided, get client name
    if (clientId && !clientName) {
      const { data: client } = await supabase.from("clients").select("name").eq("id", clientId).single()
      if (client) {
        targetClientName = client.name
      }
    }

    if (!targetClientName) {
      return NextResponse.json({ error: "Client name or ID required" }, { status: 400 })
    }

    // Get weekly summaries for this client
    const { data: summaries, error: summariesError } = await supabase
      .from("weekly_summaries")
      .select("*")
      .eq("client_name", targetClientName)
      .order("week_ending", { ascending: false })
      .limit(12)

    // Get recent debriefs for this client
    const { data: debriefs, error: debriefsError } = await supabase
      .from("debriefs")
      .select("*")
      .eq("client_name", targetClientName)
      .order("week_ending", { ascending: false })
      .limit(20)

    // Calculate total hours and activity
    const totalHours = (debriefs || []).reduce((sum, d) => sum + (Number(d.hours_worked) || 0), 0)
    const uniqueStudents = new Set((debriefs || []).map((d) => d.student_name)).size

    // Group debriefs by week
    const weeklyData = (debriefs || []).reduce((acc: any, d) => {
      const week = d.week_ending
      if (!acc[week]) {
        acc[week] = {
          week_ending: week,
          hours: 0,
          activities: [],
          students: new Set(),
        }
      }
      acc[week].hours += Number(d.hours_worked) || 0
      if (d.work_summary) {
        acc[week].activities.push({
          student: d.student_name,
          summary: d.work_summary,
          hours: d.hours_worked,
        })
      }
      acc[week].students.add(d.student_name)
      return acc
    }, {})

    // Convert to array
    const weeklyProgress = Object.values(weeklyData).map((week: any) => ({
      ...week,
      students: Array.from(week.students),
      studentCount: week.students.size,
    }))

    return NextResponse.json({
      success: true,
      totalHours,
      uniqueStudents,
      weeklyProgress,
      summaries: summaries || [],
      recentActivity: debriefs || [],
    })
  } catch (error) {
    console.error("Error in weekly progress API:", error)
    return NextResponse.json({ error: "Failed to fetch progress" }, { status: 500 })
  }
}
