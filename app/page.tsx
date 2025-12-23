"use client"

import { Suspense, useState, useEffect } from "react"
import { MainNavigation } from "@/components/main-navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { OverviewCards } from "@/components/overview-cards"
import { ClinicPerformance } from "@/components/clinic-performance"
import { RecentActivity } from "@/components/recent-activity"
import { DirectorNotifications } from "@/components/director-notifications"
import { AgendaWidget } from "@/components/agenda-widget"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface WeekSchedule {
  value: string
  label: string
  weekNumber: number
  isBreak: boolean
  weekStart: string
  weekEnd: string
}

async function getAvailableWeeksAndSchedule(): Promise<{ weeks: string[]; schedule: WeekSchedule[] }> {
  try {
    const response = await fetch("/api/supabase/weeks")
    const data = await response.json()
    if (data.success) {
      return {
        weeks: data.weeks || [],
        schedule: data.schedule || [],
      }
    }
    return { weeks: [], schedule: [] }
  } catch (error) {
    console.error("Error fetching available weeks:", error)
    return { weeks: [], schedule: [] }
  }
}

function LoadingSkeleton({ height = "h-48" }: { height?: string }) {
  return (
    <Card className="border-border">
      <CardContent className={`${height} flex items-center justify-center`}>
        <div className="space-y-3 w-full p-4">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const [availableWeeks, setAvailableWeeks] = useState<string[]>([])
  const [weekSchedule, setWeekSchedule] = useState<WeekSchedule[]>([])
  const [selectedWeeks, setSelectedWeeks] = useState<string[]>([])
  const [selectedClinic, setSelectedClinic] = useState<string>("all")

  useEffect(() => {
    getAvailableWeeksAndSchedule().then(({ weeks, schedule }) => {
      setAvailableWeeks(weeks)
      setWeekSchedule(schedule)
      // Don't auto-select a week - keep empty to show all data
    })
  }, [])

  return (
    <div className="min-h-screen bg-background pt-[48px] pl-12">
      <MainNavigation />

      <DashboardHeader
        selectedWeeks={selectedWeeks}
        onWeeksChange={setSelectedWeeks}
        availableWeeks={availableWeeks}
        selectedClinic={selectedClinic}
        onClinicChange={setSelectedClinic}
      />

      <main className="container mx-auto px-6 py-6 space-y-6">
        <>
          {/* Overview Cards - Full Width */}
          <Suspense fallback={<LoadingSkeleton height="h-32" />}>
            <OverviewCards selectedWeeks={selectedWeeks} selectedClinic={selectedClinic} weekSchedule={weekSchedule} />
          </Suspense>

          {/* Notifications - Full Width */}
          <Suspense fallback={null}>
            <DirectorNotifications selectedClinic={selectedClinic} compact />
          </Suspense>

          {/* Two Column Layout: Performance + Agenda */}
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Suspense fallback={<LoadingSkeleton height="h-96" />}>
                <ClinicPerformance
                  selectedWeeks={selectedWeeks}
                  selectedClinic={selectedClinic}
                  weekSchedule={weekSchedule}
                />
              </Suspense>
            </div>

            <div className="lg:col-span-1">
              <Suspense fallback={<LoadingSkeleton height="h-96" />}>
                <AgendaWidget selectedClinic={selectedClinic} selectedWeeks={selectedWeeks} />
              </Suspense>
            </div>
          </div>

          {/* Recent Activity - Full Width */}
          <Suspense fallback={<LoadingSkeleton height="h-64" />}>
            <RecentActivity selectedWeeks={selectedWeeks} selectedClinic={selectedClinic} />
          </Suspense>
        </>
      </main>
    </div>
  )
}
