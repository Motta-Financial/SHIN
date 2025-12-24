import { createServiceClient } from "@/lib/supabase/service"
import { NextResponse } from "next/server"

const FALL_2025_WEEKS = [
  { week_start: "2025-09-08", week_end: "2025-09-14", week_label: "Week 1", week_number: 1, is_break: false },
  { week_start: "2025-09-15", week_end: "2025-09-21", week_label: "Week 2", week_number: 2, is_break: false },
  { week_start: "2025-09-22", week_end: "2025-09-28", week_label: "Week 3", week_number: 3, is_break: false },
  { week_start: "2025-09-29", week_end: "2025-10-05", week_label: "Week 4", week_number: 4, is_break: false },
  { week_start: "2025-10-06", week_end: "2025-10-12", week_label: "Week 5", week_number: 5, is_break: false },
  { week_start: "2025-10-13", week_end: "2025-10-19", week_label: "Oct Break", week_number: 6, is_break: true },
  { week_start: "2025-10-20", week_end: "2025-10-26", week_label: "Week 6", week_number: 7, is_break: false },
  { week_start: "2025-10-27", week_end: "2025-11-02", week_label: "Week 7", week_number: 8, is_break: false },
  { week_start: "2025-11-03", week_end: "2025-11-09", week_label: "Week 8", week_number: 9, is_break: false },
  { week_start: "2025-11-10", week_end: "2025-11-16", week_label: "Week 9", week_number: 10, is_break: false },
  { week_start: "2025-11-17", week_end: "2025-11-23", week_label: "Week 10", week_number: 11, is_break: false },
  { week_start: "2025-11-24", week_end: "2025-11-30", week_label: "Week 11", week_number: 12, is_break: false },
  { week_start: "2025-12-01", week_end: "2025-12-07", week_label: "Week 12", week_number: 13, is_break: false },
  { week_start: "2025-12-08", week_end: "2025-12-14", week_label: "Week 13", week_number: 14, is_break: false },
]

export async function GET() {
  try {
    const supabase = createServiceClient()

    let schedule: typeof FALL_2025_WEEKS | null = null

    try {
      const { data: semesterConfig } = await supabase
        .from("semester_config")
        .select("id, semester")
        .or("is_active.eq.true,semester.ilike.%Fall 2025%")
        .limit(1)
        .single()

      if (semesterConfig?.id) {
        const { data, error } = await supabase
          .from("semester_schedule")
          .select("week_start, week_end, week_label, week_number, is_break")
          .eq("semester_id", semesterConfig.id)
          .order("week_start", { ascending: true })

        if (!error && data && data.length > 0) {
          schedule = data
        }
      }

      if (!schedule || schedule.length === 0) {
        const { data, error } = await supabase
          .from("semester_schedule")
          .select("week_start, week_end, week_label, week_number, is_break")
          .order("week_start", { ascending: true })

        if (!error && data && data.length > 0) {
          schedule = data
        }
      }
    } catch (e) {
      console.log("[v0] semester_schedule table not found, using hardcoded weeks")
    }

    if (!schedule || schedule.length === 0) {
      schedule = FALL_2025_WEEKS
    }

    const weeks = schedule.map((week) => week.week_end)

    return NextResponse.json({
      success: true,
      weeks,
      schedule: schedule.map((w) => ({
        value: w.week_end,
        label: w.week_label,
        weekNumber: w.week_number,
        isBreak: w.is_break,
        weekStart: w.week_start,
        weekEnd: w.week_end,
      })),
      source: schedule === FALL_2025_WEEKS ? "hardcoded" : "database",
    })
  } catch (error) {
    console.error("[v0] Error fetching weeks:", error)

    return NextResponse.json({
      success: true,
      weeks: FALL_2025_WEEKS.map((w) => w.week_end),
      schedule: FALL_2025_WEEKS.map((w) => ({
        value: w.week_end,
        label: w.week_label,
        weekNumber: w.week_number,
        isBreak: w.is_break,
        weekStart: w.week_start,
        weekEnd: w.week_end,
      })),
      source: "fallback",
    })
  }
}
