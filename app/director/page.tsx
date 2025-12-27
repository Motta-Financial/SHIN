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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  AlertCircle,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useDirectors } from "@/hooks/use-directors"

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

interface Director {
  id: string
  full_name: string
  email: string
  clinic: string
  job_title?: string
  role?: string
}

async function getAvailableWeeks(): Promise<{ weeks: string[]; schedule: WeekSchedule[] }> {
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

export default function DirectorPortalPage() {
  const [availableWeeks, setAvailableWeeks] = useState<string[]>([])
  const [weekSchedule, setWeekSchedule] = useState<WeekSchedule[]>([])
  const [selectedWeeks, setSelectedWeeks] = useState<string[]>([])
  const [selectedDirectorId, setSelectedDirectorId] = useState<string>("all")
  const { directors, isLoading: directorsLoading } = useDirectors()
  const [currentDirector, setCurrentDirector] = useState<{
    name: string
    email: string
    clinic: string
    jobTitle: string
  } | null>(null)
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

  useEffect(() => {
    if (directors.length > 0 && selectedDirectorId === "all") {
      // Auto-select first director for personalized demo
      const firstDirector = directors[0]
      setSelectedDirectorId(firstDirector.id)
      setCurrentDirector({
        name: firstDirector.full_name,
        email: firstDirector.email || "",
        clinic: firstDirector.clinic || "",
        jobTitle: firstDirector.job_title || "Director",
      })
    } else if (selectedDirectorId !== "all") {
      const director = directors.find((d) => d.id === selectedDirectorId)
      if (director) {
        setCurrentDirector({
          name: director.full_name,
          email: director.email || "",
          clinic: director.clinic || "",
          jobTitle: director.job_title || "Director",
        })
      }
    }
  }, [directors, selectedDirectorId])

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
    const updateDirectorInfo = async () => {
      if (!selectedDirectorId || selectedDirectorId === "all") {
        setCurrentDirector(null)
        setSignedAgreements([])
        return
      }

      const director = directors.find((d) => d.id === selectedDirectorId)
      if (director) {
        setCurrentDirector({
          name: director.full_name,
          email: director.email || "",
          clinic: director.clinic || "",
          jobTitle: director.job_title || "Director",
        })

        // Fetch signed agreements for this director
        if (director.email) {
          try {
            const agreeRes = await fetch(`/api/agreements?userEmail=${encodeURIComponent(director.email)}`)
            const agreeData = await agreeRes.json()
            if (agreeData.agreements) {
              setSignedAgreements(agreeData.agreements.map((a: any) => a.agreement_type))
            } else {
              setSignedAgreements([])
            }
          } catch (error) {
            console.error("Error fetching agreements:", error)
            setSignedAgreements([])
          }
        }
      }
    }
    updateDirectorInfo()
  }, [selectedDirectorId, directors])

  const handleDirectorChange = (directorId: string) => {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      <aside className="fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-52 border-r bg-card z-40">
        <MainNavigation />
      </aside>
      <div className="pl-52 pt-14">
        <DashboardHeader
          selectedWeeks={selectedWeeks}
          onWeeksChange={setSelectedWeeks}
          availableWeeks={availableWeeks}
          selectedDirectorId={selectedDirectorId}
          onDirectorChange={handleDirectorChange}
          showDirectorFilter={true}
        />

        <main className="p-4 space-y-4">
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-amber-800 font-medium">Demo Mode</p>
              <p className="text-xs text-amber-600">
                In production, directors will be authenticated and see only their personalized dashboard.
              </p>
            </div>
            <Select value={selectedDirectorId} onValueChange={handleDirectorChange}>
              <SelectTrigger className="w-[240px] bg-white">
                <SelectValue placeholder="Select a director to preview" />
              </SelectTrigger>
              <SelectContent>
                {directors.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                  {currentDirector ? `Welcome, ${currentDirector.name.split(" ")[0]}` : "Director Dashboard"}
                </h1>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground text-sm">
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {selectedWeeks.length === 0
                    ? "Select Week"
                    : selectedWeeks.length === 1
                      ? getWeekLabel(selectedWeeks[0])
                      : `${selectedWeeks.length} weeks`}
                </span>
                {currentDirector && (
                  <>
                    <span className="text-muted-foreground/50">•</span>
                    <span className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {currentDirector.clinic}
                    </span>
                  </>
                )}
              </div>
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
                    <p className="text-xs text-muted-foreground">
                      {currentDirector ? "Your students this period" : "This period"}
                    </p>
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
                    <p className="text-xs text-muted-foreground">
                      {currentDirector ? "Your clients with activity" : "With activity"}
                    </p>
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
    </div>
  )
}
