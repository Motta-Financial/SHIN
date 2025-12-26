"use client"

import { Suspense, useState, useEffect } from "react"
import { MainNavigation } from "@/components/main-navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { OverviewCards } from "@/components/overview-cards"
import { ClinicPerformance } from "@/components/clinic-performance"
import { Triage } from "@/components/triage"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { RecentActivity } from "@/components/recent-activity"

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

export default function DirectorPortalDashboard() {
  const [availableWeeks, setAvailableWeeks] = useState<string[]>([])
  const [weekSchedule, setWeekSchedule] = useState<WeekSchedule[]>([])
  const [selectedWeeks, setSelectedWeeks] = useState<string[]>([])
  const [selectedClinic, setSelectedClinic] = useState<string>("all")
  const [selectedClient, setSelectedClient] = useState<string>("all")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    getAvailableWeeksAndSchedule().then(({ weeks, schedule }) => {
      setAvailableWeeks(weeks)
      setWeekSchedule(schedule)
    })
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background pt-[48px] pl-12">
        <div className="container mx-auto px-6 py-6 space-y-6">
          <LoadingSkeleton height="h-32" />
          <div className="grid gap-6 lg:grid-cols-2">
            <LoadingSkeleton height="h-96" />
            <LoadingSkeleton height="h-96" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pt-[48px] pl-12">
      <MainNavigation />

      <DashboardHeader
        selectedWeeks={selectedWeeks}
        onWeeksChange={setSelectedWeeks}
        availableWeeks={availableWeeks}
        selectedClinic={selectedClinic}
        onClinicChange={setSelectedClinic}
        selectedClient={selectedClient}
        onClientChange={setSelectedClient}
      />

      <main className="container mx-auto px-6 py-6 space-y-6">
        <Suspense fallback={<LoadingSkeleton height="h-32" />}>
          <OverviewCards selectedWeeks={selectedWeeks} selectedClinic={selectedClinic} weekSchedule={weekSchedule} />
        </Suspense>

        <Suspense fallback={<LoadingSkeleton height="h-64" />}>
          <Triage userType="director" userName="" userEmail="" selectedClinic={selectedClinic} signedAgreements={[]} />
        </Suspense>

        <Suspense fallback={<LoadingSkeleton height="h-96" />}>
          <ClinicPerformance
            selectedWeeks={selectedWeeks}
            selectedClinic={selectedClinic}
            weekSchedule={weekSchedule}
          />
        </Suspense>

        <Suspense fallback={<LoadingSkeleton height="h-64" />}>
          <RecentActivity selectedWeeks={selectedWeeks} selectedClinic={selectedClinic} />
        </Suspense>
      </main>
    </div>
  )
}
