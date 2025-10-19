"use client"

import { Suspense, useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { OverviewCards } from "@/components/overview-cards"
import { ClinicPerformance } from "@/components/clinic-performance"
import { ClientEngagements } from "@/components/client-engagements"
import { RecentActivity } from "@/components/recent-activity"
import { StudentHours } from "@/components/student-hours"

function getWeekEnding(date: Date): string {
  const day = date.getDay()
  const diff = 6 - day // Days until Saturday
  const weekEnding = new Date(date)
  weekEnding.setDate(date.getDate() + diff)
  return weekEnding.toISOString().split("T")[0]
}

async function getAvailableWeeks(): Promise<string[]> {
  try {
    const response = await fetch("/api/airtable/debriefs")
    const data = await response.json()

    const weeks = new Set<string>()
    data.records?.forEach((record: any) => {
      const weekEnding = record.fields["END DATE (from WEEK (from SEED | Schedule))"]?.[0]
      const dateSubmitted = record.fields["Date Submitted"]

      if (weekEnding) {
        weeks.add(weekEnding)
      } else if (dateSubmitted) {
        weeks.add(getWeekEnding(new Date(dateSubmitted)))
      }
    })

    return Array.from(weeks).sort((a, b) => b.localeCompare(a)) // Most recent first
  } catch (error) {
    console.error("[v0] Error fetching available weeks:", error)
    return [getWeekEnding(new Date())] // Default to current week
  }
}

export default function DashboardPage() {
  const [selectedWeek, setSelectedWeek] = useState<string>(getWeekEnding(new Date()))
  const [availableWeeks, setAvailableWeeks] = useState<string[]>([])

  useEffect(() => {
    getAvailableWeeks().then(setAvailableWeeks)
  }, [])

  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardHeader selectedWeek={selectedWeek} onWeekChange={setSelectedWeek} availableWeeks={availableWeeks} />

      <main className="container mx-auto px-4 py-8 space-y-8">
        <Suspense fallback={<div>Loading overview...</div>}>
          <OverviewCards selectedWeek={selectedWeek} />
        </Suspense>

        <div className="grid gap-8 lg:grid-cols-2">
          <Suspense fallback={<div>Loading clinic performance...</div>}>
            <ClinicPerformance selectedWeek={selectedWeek} />
          </Suspense>

          <Suspense fallback={<div>Loading student hours...</div>}>
            <StudentHours selectedWeek={selectedWeek} />
          </Suspense>
        </div>

        <Suspense fallback={<div>Loading client engagements...</div>}>
          <ClientEngagements selectedWeek={selectedWeek} />
        </Suspense>

        <Suspense fallback={<div>Loading recent activity...</div>}>
          <RecentActivity selectedWeek={selectedWeek} />
        </Suspense>
      </main>
    </div>
  )
}
