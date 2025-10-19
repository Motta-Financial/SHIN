"use client"

import { Suspense, useState, useEffect } from "react"
import { MainNavigation } from "@/components/main-navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { OverviewCards } from "@/components/overview-cards"
import { ClinicPerformance } from "@/components/clinic-performance"
import { ClientEngagements } from "@/components/client-engagements"
import { RecentActivity } from "@/components/recent-activity"
import { StudentHours } from "@/components/student-hours"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StudentQuestions } from "@/components/student-questions"
import { DetailedDebriefs } from "@/components/detailed-debriefs"
import { ClinicGoals } from "@/components/clinic-goals"
import { StudentPerformance } from "@/components/student-performance"
import { ExportData } from "@/components/export-data"

function getWeekEnding(date: Date): string {
  const day = date.getDay()
  const diff = 6 - day
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
  const [selectedClinic, setSelectedClinic] = useState<string>("all")

  useEffect(() => {
    getAvailableWeeks().then((weeks) => {
      setAvailableWeeks(weeks)
      if (weeks.length > 0) {
        setSelectedWeek(weeks[0])
      }
    })
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <MainNavigation />

      <div className="bg-muted/30">
        <DashboardHeader
          selectedWeek={selectedWeek}
          onWeekChange={setSelectedWeek}
          availableWeeks={availableWeeks}
          selectedClinic={selectedClinic}
          onClinicChange={setSelectedClinic}
        />

        <main className="container mx-auto px-4 py-8 space-y-8">
          {selectedWeek && (
            <>
              <Suspense fallback={<div>Loading overview...</div>}>
                <OverviewCards selectedWeek={selectedWeek} selectedClinic={selectedClinic} />
              </Suspense>

              <Tabs defaultValue="dashboard" className="w-full">
                <TabsList className="grid w-full max-w-4xl grid-cols-5">
                  <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                  <TabsTrigger value="clients">Clients</TabsTrigger>
                  <TabsTrigger value="students">Students</TabsTrigger>
                  <TabsTrigger value="goals">Goals</TabsTrigger>
                  <TabsTrigger value="export">Export</TabsTrigger>
                </TabsList>

                <TabsContent value="dashboard" className="space-y-8 mt-6">
                  <div className="grid gap-8 lg:grid-cols-2">
                    <Suspense fallback={<div>Loading clinic performance...</div>}>
                      <ClinicPerformance selectedWeek={selectedWeek} selectedClinic={selectedClinic} />
                    </Suspense>

                    <Suspense fallback={<div>Loading student hours...</div>}>
                      <StudentHours selectedWeek={selectedWeek} selectedClinic={selectedClinic} />
                    </Suspense>
                  </div>

                  <Suspense fallback={<div>Loading recent activity...</div>}>
                    <RecentActivity selectedWeek={selectedWeek} selectedClinic={selectedClinic} />
                  </Suspense>
                </TabsContent>

                <TabsContent value="clients" className="space-y-8 mt-6">
                  <Suspense fallback={<div>Loading client engagements...</div>}>
                    <ClientEngagements selectedWeek={selectedWeek} selectedClinic={selectedClinic} />
                  </Suspense>
                </TabsContent>

                <TabsContent value="students" className="space-y-8 mt-6">
                  <Suspense fallback={<div>Loading student questions...</div>}>
                    <StudentQuestions selectedWeek={selectedWeek} selectedClinic={selectedClinic} />
                  </Suspense>

                  <Suspense fallback={<div>Loading student performance...</div>}>
                    <StudentPerformance selectedWeek={selectedWeek} selectedClinic={selectedClinic} />
                  </Suspense>

                  <Suspense fallback={<div>Loading debrief submissions...</div>}>
                    <DetailedDebriefs selectedWeek={selectedWeek} selectedClinic={selectedClinic} />
                  </Suspense>
                </TabsContent>

                <TabsContent value="goals" className="mt-6">
                  <Suspense fallback={<div>Loading clinic goals...</div>}>
                    <ClinicGoals selectedWeek={selectedWeek} selectedClinic={selectedClinic} />
                  </Suspense>
                </TabsContent>

                <TabsContent value="export" className="mt-6">
                  <Suspense fallback={<div>Loading export options...</div>}>
                    <ExportData selectedWeek={selectedWeek} selectedClinic={selectedClinic} />
                  </Suspense>
                </TabsContent>
              </Tabs>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
