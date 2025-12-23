"use client"

import { Suspense, useState, useEffect } from "react"
import { MainNavigation } from "@/components/main-navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { StudentHours } from "@/components/student-hours"
import { StudentQuestions } from "@/components/student-questions"
import { StudentPerformance } from "@/components/student-performance"
import { DetailedDebriefs } from "@/components/detailed-debriefs"
import { Badge } from "@/components/ui/badge"

function getWeekEnding(date: Date): string {
  const day = date.getDay()
  const diff = 6 - day
  const weekEnding = new Date(date)
  weekEnding.setDate(date.getDate() + diff)
  return weekEnding.toISOString().split("T")[0]
}

async function getAvailableWeeks(): Promise<string[]> {
  try {
    const response = await fetch("/api/supabase/weeks")
    const data = await response.json()

    if (data.success && data.weeks) {
      return data.weeks
    }
    return []
  } catch (error) {
    console.error("Error fetching available weeks:", error)
    return []
  }
}

export default function StudentProgressPage() {
  const [availableWeeks, setAvailableWeeks] = useState<string[]>([])
  const [selectedWeeks, setSelectedWeeks] = useState<string[]>(["2025-09-14"])
  const [selectedClinic, setSelectedClinic] = useState<string>("all")

  useEffect(() => {
    getAvailableWeeks().then((weeks) => {
      setAvailableWeeks(weeks)
      if (weeks.length > 0 && !weeks.includes(selectedWeeks[0])) {
        setSelectedWeeks([weeks[0]])
      }
    })
  }, [])

  return (
    <div className="min-h-screen bg-background pt-[48px] pl-12">
      <MainNavigation />

      <div className="bg-gradient-to-br from-blue-50/40 via-background to-blue-100/30">
        <div className="container mx-auto px-4 pt-4">
          <div className="flex items-center gap-2">
            <Badge className="bg-primary text-primary-foreground">Student Progress</Badge>
            <span className="text-xs text-muted-foreground">Track student performance and activity</span>
          </div>
        </div>

        <DashboardHeader
          selectedWeeks={selectedWeeks}
          onWeeksChange={setSelectedWeeks}
          availableWeeks={availableWeeks}
          selectedClinic={selectedClinic}
          onClinicChange={setSelectedClinic}
        />

        <main className="container mx-auto px-4 py-8 space-y-8">
          {selectedWeeks.length > 0 && (
            <>
              <Suspense fallback={<div>Loading student hours...</div>}>
                <StudentHours selectedWeeks={selectedWeeks} selectedClinic={selectedClinic} />
              </Suspense>

              <Suspense fallback={<div>Loading student questions...</div>}>
                <StudentQuestions selectedWeeks={selectedWeeks} selectedClinic={selectedClinic} />
              </Suspense>

              <Suspense fallback={<div>Loading student performance...</div>}>
                <StudentPerformance selectedWeeks={selectedWeeks} selectedClinic={selectedClinic} />
              </Suspense>

              <Suspense fallback={<div>Loading debrief submissions...</div>}>
                <DetailedDebriefs selectedWeeks={selectedWeeks} selectedClinic={selectedClinic} />
              </Suspense>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
