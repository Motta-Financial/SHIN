"use client"

import { Suspense, useState, useEffect } from "react"
import { MainNavigation } from "@/components/main-navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { StudentHours } from "@/components/student-hours"
import { StudentQuestions } from "@/components/student-questions"
import { StudentPerformance } from "@/components/student-performance"
import { DetailedDebriefs } from "@/components/detailed-debriefs"
import { Badge } from "@/components/ui/badge"

interface WeekScheduleInfo {
  weekStart: string
  weekEnd: string
}

async function getAvailableWeeks(): Promise<{ weeks: string[]; schedule: WeekScheduleInfo[] }> {
  try {
    const response = await fetch("/api/supabase/weeks")
    const data = await response.json()

    if (data.success && data.weeks) {
      const schedule = (data.schedule || []).map((s: any) => ({
        weekStart: s.weekStart,
        weekEnd: s.weekEnd,
      }))
      return { weeks: data.weeks, schedule }
    }
    return { weeks: [], schedule: [] }
  } catch (error) {
    console.error("Error fetching available weeks:", error)
    return { weeks: [], schedule: [] }
  }
}

export default function StudentProgressPage() {
  const [availableWeeks, setAvailableWeeks] = useState<string[]>([])
  const [selectedWeeks, setSelectedWeeks] = useState<string[]>([])
  const [weekSchedule, setWeekSchedule] = useState<WeekScheduleInfo[]>([])
  const [selectedClinics, setSelectedClinics] = useState<string[]>([])
  const [selectedClients, setSelectedClients] = useState<string[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    getAvailableWeeks().then(({ weeks, schedule }) => {
      setAvailableWeeks(weeks)
      setWeekSchedule(schedule)
      // Set initial selected week to include ALL weeks to show all data
      if (weeks.length > 0) {
        setSelectedWeeks(weeks)
      }
      setIsInitialized(true)
    })
  }, [])

  const selectedClinic = selectedClinics.length > 0 ? selectedClinics[0] : "all"

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-52 border-r bg-card z-40">
        <MainNavigation />
      </aside>

      <div className="pl-52 pt-14">
        <DashboardHeader
          selectedWeeks={selectedWeeks}
          onWeeksChange={setSelectedWeeks}
          availableWeeks={availableWeeks}
          selectedClinics={selectedClinics}
          onClinicsChange={setSelectedClinics}
          selectedClients={selectedClients}
          onClientsChange={setSelectedClients}
        />

        <main className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Badge className="bg-primary text-primary-foreground">Student Progress</Badge>
            <span className="text-xs text-muted-foreground">Track student performance and activity</span>
          </div>

          {!isInitialized ? (
            <div className="flex items-center justify-center h-[200px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : selectedWeeks.length > 0 ? (
            <>
              <Suspense fallback={<div>Loading student hours...</div>}>
                <StudentHours selectedWeeks={selectedWeeks} selectedClinic={selectedClinic} />
              </Suspense>

              <Suspense fallback={<div>Loading student questions...</div>}>
                <StudentQuestions selectedWeeks={selectedWeeks} selectedClinic={selectedClinic} weekSchedule={weekSchedule} />
              </Suspense>

              <Suspense fallback={<div>Loading student performance...</div>}>
                <StudentPerformance selectedWeeks={selectedWeeks} selectedClinic={selectedClinic} />
              </Suspense>

              <Suspense fallback={<div>Loading debrief submissions...</div>}>
                <DetailedDebriefs selectedWeeks={selectedWeeks} selectedClinic={selectedClinic} weekSchedule={weekSchedule} />
              </Suspense>
            </>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No weeks available. Please check the semester configuration.
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
