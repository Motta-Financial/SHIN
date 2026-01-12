"use client"

import { Suspense, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { MainNavigation } from "@/components/main-navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { OverviewCards } from "@/components/overview-cards"
import { ClinicPerformance } from "@/components/clinic-performance"
import { Triage } from "@/components/triage"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { RecentActivity } from "@/components/recent-activity"
import { useDirectors } from "@/hooks/use-directors"
import { DemoDirectorSelector, useDemoDirector } from "@/components/demo-director-selector"
import { useDemoMode } from "@/contexts/demo-mode-context"
import { useUserRole } from "@/hooks/use-user-role"

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
  const router = useRouter()
  const [availableWeeks, setAvailableWeeks] = useState<string[]>([])
  const [weekSchedule, setWeekSchedule] = useState<WeekSchedule[]>([])
  const [selectedWeeks, setSelectedWeeks] = useState<string[]>([])
  const [selectedClinics, setSelectedClinics] = useState<string[]>([])
  const [selectedClients, setSelectedClients] = useState<string[]>([])
  const [mounted, setMounted] = useState(false)

  const { directors } = useDirectors()
  const { directorId: selectedDirectorId, isReady: directorReady } = useDemoDirector()
  const { isDemoMode } = useDemoMode()
  const { role, email, fullName, isLoading: roleLoading, isAuthenticated } = useUserRole()

  useEffect(() => {
    if (roleLoading) return

    if (!isDemoMode && !isAuthenticated) {
      router.push("/login")
      return
    }

    // Redirect based on user role
    if (role === "admin" || role === "director") {
      router.push("/director")
    } else if (role === "student") {
      router.push("/students")
    } else if (role === "client") {
      router.push("/client-portal")
    } else {
      // Default to director portal if role is unclear
      router.push("/director")
    }
  }, [role, roleLoading, isAuthenticated, isDemoMode, router])

  useEffect(() => {
    setMounted(true)
    getAvailableWeeksAndSchedule().then(({ weeks, schedule }) => {
      setAvailableWeeks(weeks)
      setWeekSchedule(schedule)
    })
  }, [])

  if (roleLoading || !mounted) {
    return (
      <div className="min-h-screen bg-background">
        <aside className="fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-52 border-r bg-card z-40">
          <div className="p-3 animate-pulse">
            <Skeleton className="h-8 w-full mb-3" />
            <Skeleton className="h-8 w-full mb-3" />
            <Skeleton className="h-8 w-full" />
          </div>
        </aside>
        <div className="pl-52 pt-14">
          <div className="p-4 space-y-4">
            <LoadingSkeleton height="h-24" />
            <div className="grid gap-4 lg:grid-cols-2">
              <LoadingSkeleton height="h-80" />
              <LoadingSkeleton height="h-80" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!isDemoMode && !isAuthenticated) {
    return null
  }

  const currentDirector =
    isDemoMode && selectedDirectorId
      ? directors?.find((d) => d.id === selectedDirectorId) || directors?.[0]
      : directors?.find((d) => d.email?.toLowerCase() === email?.toLowerCase()) || directors?.[0]

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-52 border-r bg-card z-40">
        <MainNavigation />
      </aside>

      <div className="pl-52 pt-14">
        <div className="bg-[#3d4559] mx-4 mt-4 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-[#8fa68f] flex items-center justify-center text-xl font-bold text-white">
                {fullName?.charAt(0) ||
                  currentDirector?.full_name?.charAt(0) ||
                  currentDirector?.name?.charAt(0) ||
                  "D"}
              </div>
              <div>
                <h1 className="text-2xl font-bold">Welcome{fullName ? `, ${fullName}` : ""}!</h1>
                <p className="text-[#9aacba]">{role === "admin" ? "Administrator" : "Director Dashboard"}</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              {isDemoMode && <DemoDirectorSelector className="mr-4" />}
              <div className="text-right">
                <p className="text-sm text-[#9aacba]">Current Period</p>
                <p className="font-medium">{selectedWeeks.length > 0 ? selectedWeeks.join(", ") : "All Periods"}</p>
              </div>
            </div>
          </div>
        </div>

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
          <Suspense fallback={<LoadingSkeleton height="h-24" />}>
            <OverviewCards
              selectedWeeks={selectedWeeks}
              selectedClinic={selectedClinics.length > 0 ? selectedClinics[0] : "all"}
            />
          </Suspense>

          <Suspense fallback={<LoadingSkeleton height="h-80" />}>
            <Triage userType="director" />
          </Suspense>

          <Suspense fallback={<LoadingSkeleton height="h-80" />}>
            <ClinicPerformance
              selectedWeeks={selectedWeeks}
              selectedClinic={selectedClinics.length > 0 ? selectedClinics[0] : "all"}
            />
          </Suspense>

          <Suspense fallback={<LoadingSkeleton height="h-64" />}>
            <RecentActivity
              selectedWeeks={selectedWeeks}
              selectedClinic={selectedClinics.length > 0 ? selectedClinics[0] : "all"}
            />
          </Suspense>
        </main>
      </div>
    </div>
  )
}
