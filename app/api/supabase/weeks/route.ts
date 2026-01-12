import { createServiceClient } from "@/lib/supabase/service"
import { NextResponse } from "next/server"
import { getCachedData, setCachedData } from "@/lib/api-cache"

const SPRING_2026_WEEKS = [
  { week_start: "2026-01-12", week_end: "2026-01-18", week_label: "Week 1", week_number: 1, is_break: false },
  { week_start: "2026-01-19", week_end: "2026-01-25", week_label: "Week 2", week_number: 2, is_break: false },
  { week_start: "2026-01-26", week_end: "2026-02-01", week_label: "Week 3", week_number: 3, is_break: false },
  { week_start: "2026-02-02", week_end: "2026-02-08", week_label: "Week 4", week_number: 4, is_break: false },
  { week_start: "2026-02-09", week_end: "2026-02-15", week_label: "Week 5", week_number: 5, is_break: false },
  {
    week_start: "2026-02-16",
    week_end: "2026-02-22",
    week_label: "Week 6-Spring Break",
    week_number: 6,
    is_break: true,
  },
  { week_start: "2026-02-23", week_end: "2026-03-01", week_label: "Week 7", week_number: 7, is_break: false },
  { week_start: "2026-03-02", week_end: "2026-03-08", week_label: "Week 8", week_number: 8, is_break: false },
  { week_start: "2026-03-09", week_end: "2026-03-15", week_label: "Week 9", week_number: 9, is_break: false },
  { week_start: "2026-03-16", week_end: "2026-03-22", week_label: "Week 10", week_number: 10, is_break: false },
  { week_start: "2026-03-23", week_end: "2026-03-29", week_label: "Week 11", week_number: 11, is_break: false },
  { week_start: "2026-03-30", week_end: "2026-04-05", week_label: "Week 12", week_number: 12, is_break: false },
  { week_start: "2026-04-06", week_end: "2026-04-12", week_label: "Week 13", week_number: 13, is_break: false },
  { week_start: "2026-04-13", week_end: "2026-04-19", week_label: "Week 14", week_number: 14, is_break: false },
]

function findCurrentWeek(schedule: typeof SPRING_2026_WEEKS): string | null {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (const week of schedule) {
    const weekStart = new Date(week.week_start)
    const weekEnd = new Date(week.week_end)
    weekStart.setHours(0, 0, 0, 0)
    weekEnd.setHours(23, 59, 59, 999)

    if (today >= weekStart && today <= weekEnd) {
      return week.week_start
    }
  }

  // If no current week found, return the first week that hasn't started yet
  for (const week of schedule) {
    const weekStart = new Date(week.week_start)
    if (today < weekStart) {
      return week.week_start
    }
  }

  // If all weeks are past, return the last week
  return schedule.length > 0 ? schedule[schedule.length - 1].week_start : null
}

export async function GET() {
  const cacheKey = "weeks:active"
  const cached = getCachedData(cacheKey)
  if (cached) {
    console.log("[v0] Weeks API - Returning cached response")
    return NextResponse.json(cached)
  }

  try {
    const supabase = createServiceClient()

    let schedule: typeof SPRING_2026_WEEKS | null = null

    try {
      const { data: semesterConfig } = await supabase
        .from("semester_config")
        .select("id, semester")
        .eq("is_active", true)
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
      schedule = SPRING_2026_WEEKS
    }

    const weeks = schedule.map((week) => week.week_start)
    const currentWeek = findCurrentWeek(schedule)

    const response = {
      success: true,
      weeks,
      currentWeek,
      schedule: schedule.map((w) => ({
        value: w.week_start, // Use week_start as the value
        label: w.week_label,
        weekNumber: w.week_number,
        isBreak: w.is_break,
        weekStart: w.week_start,
        weekEnd: w.week_end,
      })),
      source: schedule === SPRING_2026_WEEKS ? "hardcoded" : "database",
    }

    setCachedData(cacheKey, response)
    return NextResponse.json(response)
  } catch (error) {
    console.error("[v0] Error fetching weeks:", error)

    const currentWeek = findCurrentWeek(SPRING_2026_WEEKS)

    return NextResponse.json({
      success: true,
      weeks: SPRING_2026_WEEKS.map((w) => w.week_start),
      currentWeek,
      schedule: SPRING_2026_WEEKS.map((w) => ({
        value: w.week_start,
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
