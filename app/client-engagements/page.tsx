"use client"

import { Suspense, useState, useEffect } from "react"
import { MainNavigation } from "@/components/main-navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { ClientEngagements } from "@/components/client-engagements"
import { DirectorReminders } from "@/components/director-reminders"
import { UploadSOWButton } from "@/components/upload-sow-button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

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

export default function ClientEngagementsPage() {
  const [availableWeeks, setAvailableWeeks] = useState<string[]>([])
  const [selectedWeeks, setSelectedWeeks] = useState<string[]>(["2025-09-14"])
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
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">Client Engagements</h1>
              <p className="text-sm text-muted-foreground">Manage all client projects and deliverables</p>
            </div>
            <UploadSOWButton />
          </div>

          {selectedWeeks.length > 0 && (
            <>
              {/* Director Reminders */}
              <Suspense fallback={null}>
                <DirectorReminders
                  selectedWeeks={selectedWeeks}
                  selectedClinic={selectedClinics.length > 0 ? selectedClinics[0] : "all"}
                />
              </Suspense>

              {/* Client Engagements Grid */}
              <Suspense fallback={<LoadingSkeleton height="h-96" />}>
                <ClientEngagements
                  selectedWeeks={selectedWeeks}
                  selectedClinic={selectedClinics.length > 0 ? selectedClinics[0] : "all"}
                />
              </Suspense>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
