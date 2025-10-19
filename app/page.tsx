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
  const diff = 6 - day // Days until Saturday (6 = Saturday)
  const weekEnding = new Date(date)
  weekEnding.setDate(date.getDate() + diff)
  return weekEnding.toISOString().split("T")[0]
}

async function getAvailableWeeks(): Promise<string[]> {
  try {
    console.log("[v0] Fetching available weeks...")
    const response = await fetch("/api/airtable/debriefs")
    const data = await response.json()

    const weeks = new Set<string>()
    data.records?.forEach((record: any) => {
      const dateSubmitted = record.fields["Date Submitted"]

      if (dateSubmitted) {
        const weekEnding = getWeekEnding(new Date(dateSubmitted))
        weeks.add(weekEnding)
      }
    })

    const sortedWeeks = Array.from(weeks).sort((a, b) => b.localeCompare(a))
    console.log("[v0] Available weeks:", sortedWeeks)
    return sortedWeeks
  } catch (error) {
    console.error("[v0] Error fetching available weeks:", error)
    return []
  }
}

export default function DashboardPage() {
  const [availableWeeks, setAvailableWeeks] = useState<string[]>([])
  const [selectedWeek, setSelectedWeek] = useState<string>("")

  useEffect(() => {
    getAvailableWeeks().then((weeks) => {
      setAvailableWeeks(weeks)
      if (weeks.length > 0) {
        setSelectedWeek(weeks[0])
      }
    })
  }, [])

  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardHeader selectedWeek={selectedWeek} onWeekChange={setSelectedWeek} availableWeeks={availableWeeks} />

      <main className="container mx-auto px-4 py-8 space-y-8">
        {selectedWeek && (
          <>
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
          </>
        )}
      </main>
    </div>
  )
}
