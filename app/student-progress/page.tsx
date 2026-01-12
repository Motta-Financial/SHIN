"use client"

import { Suspense, useState, useEffect } from "react"
import { MainNavigation } from "@/components/main-navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { StudentHours } from "@/components/student-hours"
import { StudentQuestions } from "@/components/student-questions"
import { StudentPerformance } from "@/components/student-performance"
import { DetailedDebriefs } from "@/components/detailed-debriefs"
import { Badge } from "@/components/ui/badge"

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
  const [selectedWeeks, setSelectedWeeks] = useState<string[]>(["2026-01-18"])
  const [selectedClinics, setSelectedClinics] = useState<string[]>([])
  const [selectedClients, setSelectedClients] = useState<string[]>([])

  useEffect(() => {
    getAvailableWeeks().then((weeks) => {
      setAvailableWeeks(weeks)
      if (weeks.length > 0 && !weeks.includes(selectedWeeks[0])) {
        setSelectedWeeks([weeks[0]])
      }
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
