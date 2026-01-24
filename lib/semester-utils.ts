// Utility functions for semester calculations based on elapsed weeks/classes

export interface ClassSession {
  id: string
  class_number: number
  class_label: string
  class_date: string
  semester_schedule_id: string
}

export interface SemesterWeek {
  id: string
  week_number: number
  week_label: string
  week_start: string
  week_end: string
  is_break: boolean
  class_number?: string
  class_session_id?: string
}

/**
 * Get the current week number based on today's date
 */
export function getCurrentWeekNumber(schedule: SemesterWeek[]): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (const week of schedule) {
    const weekStart = new Date(week.week_start)
    const weekEnd = new Date(week.week_end)
    weekStart.setHours(0, 0, 0, 0)
    weekEnd.setHours(23, 59, 59, 999)

    if (today >= weekStart && today <= weekEnd) {
      return week.week_number
    }
  }

  // If before semester starts, return 0
  if (schedule.length > 0) {
    const firstWeek = schedule.reduce((min, w) => (w.week_number < min.week_number ? w : min))
    if (today < new Date(firstWeek.week_start)) {
      return 0
    }
    // If after semester ends, return last week
    const lastWeek = schedule.reduce((max, w) => (w.week_number > max.week_number ? w : max))
    if (today > new Date(lastWeek.week_end)) {
      return lastWeek.week_number
    }
  }

  return 0
}

/**
 * Get the number of elapsed class sessions (classes that have already occurred)
 * This counts only non-break weeks where the class date has passed
 */
export function getElapsedClassCount(schedule: SemesterWeek[]): number {
  const today = new Date()
  today.setHours(23, 59, 59, 999) // End of today

  return schedule.filter((week) => {
    if (week.is_break) return false
    const classDate = new Date(week.week_start) // Classes are on Mondays (week_start)
    classDate.setHours(19, 30, 0, 0) // Class ends at 7:30 PM
    return classDate <= today
  }).length
}

/**
 * Get the total number of class sessions for the semester (excluding breaks)
 */
export function getTotalClassCount(schedule: SemesterWeek[]): number {
  return schedule.filter((week) => !week.is_break).length
}

/**
 * Calculate attendance rate based on elapsed classes
 * Only counts records where notes === "Present" (not "Absent")
 * @returns { attended: number, total: number, rate: number }
 */
export function calculateAttendanceRate(
  attendanceRecords: any[],
  schedule: SemesterWeek[],
  useElapsed = true,
): { attended: number; total: number; rate: number } {
  // Only count records where notes === "Present"
  const attended = attendanceRecords.filter((r) => r.notes === "Present").length
  const total = useElapsed ? getElapsedClassCount(schedule) : getTotalClassCount(schedule)
  const rate = total > 0 ? Math.round((attended / total) * 100) : 0

  return { attended, total, rate }
}

/**
 * Get weeks that require debriefs (all weeks, including breaks for work tracking)
 * vs weeks that require attendance (only non-break weeks)
 */
export function getWeeksRequiringAttendance(schedule: SemesterWeek[]): SemesterWeek[] {
  return schedule.filter((week) => !week.is_break)
}

export function getElapsedWeeksRequiringDebrief(schedule: SemesterWeek[]): SemesterWeek[] {
  const today = new Date()
  today.setHours(23, 59, 59, 999)

  return schedule.filter((week) => {
    const weekEnd = new Date(week.week_end)
    return weekEnd <= today
  })
}

/**
 * Get the expected number of debriefs for a student (one per elapsed week)
 */
export function getExpectedDebriefCount(schedule: SemesterWeek[]): number {
  return getElapsedWeeksRequiringDebrief(schedule).length
}

/**
 * Calculate debrief completion rate based on elapsed weeks
 */
export function calculateDebriefRate(
  debriefRecords: any[],
  schedule: SemesterWeek[],
): { submitted: number; total: number; rate: number } {
  const submitted = debriefRecords.length
  const total = getExpectedDebriefCount(schedule)
  const rate = total > 0 ? Math.round((submitted / total) * 100) : 0

  return { submitted, total, rate }
}

/**
 * Check if a specific week's class has occurred
 */
export function hasClassOccurred(week: SemesterWeek): boolean {
  if (week.is_break) return false

  const today = new Date()
  const classDate = new Date(week.week_start)
  classDate.setHours(19, 30, 0, 0) // Class ends at 7:30 PM ET

  return today > classDate
}

/**
 * Get class status for a week
 * Only considers records where notes === "Present" as attended
 */
export function getClassStatus(
  week: SemesterWeek,
  attendanceRecords: any[],
): "attended" | "missed" | "upcoming" | "break" {
  if (week.is_break) return "break"

  // Only count as attended if notes === "Present" (not "Absent")
  const hasAttended = attendanceRecords.some(
    (a) => Number(a.weekNumber || a.week_number) === week.week_number && a.notes === "Present",
  )

  if (hasAttended) return "attended"
  if (hasClassOccurred(week)) return "missed"
  return "upcoming"
}
