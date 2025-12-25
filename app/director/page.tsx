"use client"

import { Suspense, useState, useEffect } from "react"
import { MainNavigation } from "@/components/main-navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { ClinicPerformance } from "@/components/clinic-performance"
import { WeeklyProgramSummary } from "@/components/weekly-program-summary"
import { DirectorNotifications } from "@/components/director-notifications"
import { ClinicView } from "@/components/clinic-view"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OnboardingAgreements } from "@/components/onboarding-agreements"
import {
  RefreshCw,
  BarChart3,
  FileText,
  Users,
  Clock,
  Briefcase,
  Calendar,
  Download,
  ChevronDown,
  Building2,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface QuickStats {
  totalHours: number
  activeStudents: number
  activeClients: number
  debriefsSubmitted: number
  pendingReviews: number
  hoursChange: number
  studentsChange: number
}

interface WeekSchedule {
  value: string
  label: string
  weekNumber: number
  isBreak: boolean
  weekStart: string
  weekEnd: string
}

async function getAvailableWeeks(): Promise<{ weeks: string[]; schedule: WeekSchedule[] }> {
  // Only run on client side
  if (typeof window === "undefined") {
    return { weeks: [], schedule: [] }
  }
  try {
    const response = await fetch("/api/supabase/weeks")
    const data = await response.json()
    if (data.success && data.weeks) {
      return { weeks: data.weeks, schedule: data.schedule || [] }
    }
    return { weeks: [], schedule: [] }
  } catch (error) {
    console.error("Error fetching available weeks:", error)
    return { weeks: [], schedule: [] }
  }
}

async function getQuickStats(selectedWeeks: string[], selectedDirectorId: string): Promise<QuickStats> {
  try {
    const [debriefsRes, overviewRes] = await Promise.all([
      fetch("/api/supabase/debriefs"),
      fetch("/api/supabase/students/overview"),
    ])

    const debriefsData = await debriefsRes.json()
    const overviewData = await overviewRes.json()

    let filteredStudents = overviewData.students || []
    if (selectedDirectorId && selectedDirectorId !== "all") {
      filteredStudents = filteredStudents.filter((s: any) => s.client_primary_director_id === selectedDirectorId)
    }

    const studentIds = new Set(filteredStudents.map((s: any) => s.student_id))

    let totalHours = 0
    const activeStudents = new Set<string>()
    const activeClients = new Set<string>()
    let debriefsSubmitted = 0

    const allDebriefs = debriefsData.debriefs || []
    allDebriefs.forEach((debrief: any) => {
      const weekEnding = debrief.week_ending
      const studentId = debrief.student_id || debrief.studentId

      const matchesWeek = selectedWeeks.length === 0 || selectedWeeks.includes(weekEnding)
      const matchesDirector = selectedDirectorId === "all" || studentIds.has(studentId)

      if (matchesWeek && matchesDirector) {
        totalHours += Number.parseFloat(debrief.hours_worked || debrief.hoursWorked || "0")
        if (debrief.student_id || debrief.studentId) {
          activeStudents.add(debrief.student_id || debrief.studentId)
        }
        if (debrief.client_name || debrief.clientName) {
          activeClients.add(debrief.client_name || debrief.clientName)
        }
        debriefsSubmitted++
      }
    })

    return {
      totalHours: Math.round(totalHours * 10) / 10,
      activeStudents: activeStudents.size,
      activeClients: activeClients.size,
      debriefsSubmitted,
      pendingReviews: 0,
      hoursChange: 0,
      studentsChange: 0,
    }
  } catch (error) {
    console.error("Error fetching quick stats:", error)
    return {
      totalHours: 0,
      activeStudents: 0,
      activeClients: 0,
      debriefsSubmitted: 0,
      pendingReviews: 0,
      hoursChange: 0,
      studentsChange: 0,
    }
  }
}

export default function DirectorPortal() {
  const [availableWeeks, setAvailableWeeks] = useState<string[]>([])
  const [weekSchedule, setWeekSchedule] = useState<WeekSchedule[]>([])
  const [selectedWeeks, setSelectedWeeks] = useState<string[]>([])
  const [selectedDirectorId, setSelectedDirectorId] = useState<string>("all")
  const [quickStats, setQuickStats] = useState<QuickStats>({
    totalHours: 0,
    activeStudents: 0,
    activeClients: 0,
    debriefsSubmitted: 0,
    pendingReviews: 0,
    hoursChange: 0,
    studentsChange: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [signedAgreements, setSignedAgreements] = useState<string[]>([])
  const [currentDirector, setCurrentDirector] = useState<{ name: string; email: string } | null>(null)

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true)
      const { weeks, schedule } = await getAvailableWeeks()
      setAvailableWeeks(weeks)
      setWeekSchedule(schedule)

      if (weeks.length > 0) {
        const sortedWeeks = [...weeks].sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
        const latestWeek = sortedWeeks[0]
        setSelectedWeeks([latestWeek])

        const stats = await getQuickStats([latestWeek], selectedDirectorId)
        setQuickStats(stats)
      }
      setIsLoading(false)
    }

    fetchInitialData()
  }, [])

  useEffect(() => {
    const fetchStats = async () => {
      if (selectedWeeks.length > 0 || selectedDirectorId !== "all") {
        const stats = await getQuickStats(selectedWeeks, selectedDirectorId)
        setQuickStats(stats)
      }
    }

    fetchStats()
  }, [selectedWeeks, selectedDirectorId])

  useEffect(() => {
    const fetchDirectorInfo = async () => {
      if (!selectedDirectorId || selectedDirectorId === "all") return
      try {
        // Get director info
        const dirRes = await fetch("/api/directors")
        const dirData = await dirRes.json()
        const director = dirData.directors?.find((d: any) => d.id === selectedDirectorId)
        if (director) {
          setCurrentDirector({ name: director.full_name, email: director.email || "" })

          // Fetch signed agreements for this director
          if (director.email) {
            const agreeRes = await fetch(`/api/agreements?userEmail=${encodeURIComponent(director.email)}`)
            const agreeData = await agreeRes.json()
            if (agreeData.agreements) {
              setSignedAgreements(agreeData.agreements.map((a: any) => a.agreement_type))
            }
          }
        }
      } catch (error) {
        console.error("Error fetching director info:", error)
      }
    }
    fetchDirectorInfo()
  }, [selectedDirectorId])

  const handleClinicChange = (directorId: string) => {
    setSelectedDirectorId(directorId)
  }

  const handleWeekChange = (weeks: string[]) => {
    setSelectedWeeks(weeks)
  }

  const handleRefresh = async () => {
    setIsLoading(true)
    const stats = await getQuickStats(selectedWeeks, selectedDirectorId)
    setQuickStats(stats)
    setIsLoading(false)
  }

  const getWeekLabel = (weekValue: string) => {
    const week = weekSchedule.find((w) => w.value === weekValue)
    return week ? week.label : weekValue
  }

  const handleDirectorChange = (directorId: string) => {
    console.log("[v0] DirectorPortal - handleDirectorChange called with:", directorId)
    console.log("[v0] DirectorPortal - directorId type:", typeof directorId)
    setSelectedDirectorId(directorId)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      <MainNavigation activePortal="director" />

      <DashboardHeader
        selectedClinic={selectedDirectorId}
        onClinicChange={handleDirectorChange}
        selectedWeeks={selectedWeeks}
        onWeeksChange={setSelectedWeeks}
        availableWeeks={availableWeeks}
      />

      <main className="container mx-auto px-6 py-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">Director Dashboard</h1>
            </div>
            <p className="text-muted-foreground flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4" />
              {selectedWeeks.length === 0
                ? "Select Week"
                : selectedWeeks.length === 1
                  ? getWeekLabel(selectedWeeks[0])
                  : `${selectedWeeks.length} weeks`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 bg-transparent">
                  <Download className="h-4 w-4" />
                  Export
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => alert("Export as PDF coming soon!")}>Export as PDF</DropdownMenuItem>
                <DropdownMenuItem onClick={() => alert("Export as CSV coming soon!")}>Export as CSV</DropdownMenuItem>
                <DropdownMenuItem onClick={() => alert("Export as Excel coming soon!")}>
                  Export as Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="my-clinic" className="gap-2">
              <Building2 className="h-4 w-4" />
              My Clinic
            </TabsTrigger>
            <TabsTrigger value="debriefs" className="gap-2">
              <FileText className="h-4 w-4" />
              Debriefs
            </TabsTrigger>
            <TabsTrigger value="schedule" className="gap-2">
              <Calendar className="h-4 w-4" />
              Schedule
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Onboarding & Administrative Tasks */}
            {currentDirector && (
              <OnboardingAgreements
                userType="director"
                userName={currentDirector.name}
                userEmail={currentDirector.email}
                programName="SEED Program"
                signedAgreements={signedAgreements as any}
                onAgreementSigned={(type) => {
                  setSignedAgreements((prev) => [...prev, type])
                }}
              />
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{quickStats.totalHours}</div>
                  <p className="text-xs text-muted-foreground">This period</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Students</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{quickStats.activeStudents}</div>
                  <p className="text-xs text-muted-foreground">Submitted debriefs</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{quickStats.activeClients}</div>
                  <p className="text-xs text-muted-foreground">With activity</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Debriefs</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{quickStats.debriefsSubmitted}</div>
                  <p className="text-xs text-muted-foreground">This period</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Suspense fallback={<div>Loading performance...</div>}>
                <ClinicPerformance selectedClinic={selectedDirectorId} selectedWeeks={selectedWeeks} />
              </Suspense>
              <Suspense fallback={<div>Loading notifications...</div>}>
                <DirectorNotifications />
              </Suspense>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Suspense fallback={<div>Loading summary...</div>}>
                <WeeklyProgramSummary selectedClinic={selectedDirectorId} selectedWeeks={selectedWeeks} />
              </Suspense>
            </div>
          </TabsContent>

          <TabsContent value="my-clinic" className="space-y-6">
            {console.log("[v0] DirectorPortal - Passing to ClinicView:", selectedDirectorId)}
            <ClinicView selectedClinic={selectedDirectorId} selectedWeeks={selectedWeeks} />
          </TabsContent>

          <TabsContent value="debriefs">
            <Card>
              <CardHeader>
                <CardTitle>Debrief Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Debrief review and management coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule">
            <Card>
              <CardHeader>
                <CardTitle>Schedule Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Schedule management coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
