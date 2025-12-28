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
    const mappingUrl =
      selectedDirectorId && selectedDirectorId !== "all"
        ? `/api/supabase/v-complete-mapping?directorId=${selectedDirectorId}`
        : "/api/supabase/v-complete-mapping"

    const [debriefsRes, mappingRes] = await Promise.all([fetch("/api/supabase/debriefs"), fetch(mappingUrl)])

    const debriefsData = await debriefsRes.json()
    const mappingData = await mappingRes.json()

    const mappings = mappingData.data || mappingData.records || mappingData.mappings || []

    // Get student IDs that belong to this director (either as clinic director or client director)
    const directorStudentIds = new Set<string>()
    const directorClientNames = new Set<string>()

    if (selectedDirectorId && selectedDirectorId !== "all") {
      mappings.forEach((m: any) => {
        // When using directorId filter, all returned records belong to this director
        if (m.student_id) directorStudentIds.add(m.student_id)
        if (m.client_name) directorClientNames.add(m.client_name)
      })

      console.log(
        "[v0] Director filter - Student IDs:",
        directorStudentIds.size,
        "Client Names:",
        directorClientNames.size,
      )
    }

    let totalHours = 0
    const activeStudents = new Set<string>()
    const activeClients = new Set<string>()
    let debriefsSubmitted = 0

    const allDebriefs = debriefsData.debriefs || []
    allDebriefs.forEach((debrief: any) => {
      const weekEnding = debrief.week_ending || debrief.weekEnding
      const studentId = debrief.student_id || debrief.studentId
      const clientName = debrief.client_name || debrief.clientName

      // Check week filter
      const matchesWeek =
        selectedWeeks.length === 0 ||
        selectedWeeks.some((w) => {
          const normalizeDate = (d: string) => (d ? new Date(d).toISOString().split("T")[0] : "")
          return normalizeDate(weekEnding) === normalizeDate(w)
        })

      // Check director filter - either student belongs to director OR client belongs to director
      const matchesDirector =
        selectedDirectorId === "all" ||
        directorStudentIds.size === 0 ||
        directorStudentIds.has(studentId) ||
        directorClientNames.has(clientName)

      if (matchesWeek && matchesDirector) {
        totalHours += Number.parseFloat(debrief.hours_worked || debrief.hoursWorked || "0")
        if (studentId) activeStudents.add(studentId)
        if (clientName) activeClients.add(clientName)
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
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-5 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                  {currentDirector?.name?.charAt(0) || "D"}
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">
                    {currentDirector ? `Welcome, ${currentDirector.name.split(" ")[0]}!` : "Director Dashboard"}
                  </h1>
                  <p className="text-blue-100 text-sm mt-0.5">
                    {currentDirector?.clinic ? `${currentDirector.clinic} Clinic Director` : "SEED Program Director"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="text-right">
                  <p className="text-blue-200 text-xs">Current Period</p>
                  <p className="text-lg font-semibold">
                    {selectedWeeks.length === 0
                      ? "Select Week"
                      : selectedWeeks.length === 1
                        ? getWeekLabel(selectedWeeks[0])
                        : `${selectedWeeks.length} weeks`}
                  </p>
                </div>
                <div className="h-10 w-px bg-blue-400/50" />
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="secondary" className="gap-2 bg-white/20 hover:bg-white/30 text-white border-0">
                        <Download className="h-4 w-4" />
                        Export
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={() => alert("Export as PDF coming soon!")}>
                        Export as PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => alert("Export as CSV coming soon!")}>
                        Export as CSV
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => alert("Export as Excel coming soon!")}>
                        Export as Excel
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={handleRefresh}
                    disabled={isLoading}
                    className="bg-white/20 hover:bg-white/30 text-white border-0"
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                  </Button>
                </div>
              </div>
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
                  <ClinicPerformance
                    selectedClinic={selectedDirectorId}
                    selectedWeeks={selectedWeeks}
                    directorId={selectedDirectorId}
                  />
                </Suspense>
                <Suspense fallback={<div>Loading notifications...</div>}>
                  <DirectorNotifications />
                </Suspense>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <Suspense fallback={<div>Loading summary...</div>}>
                  <WeeklyProgramSummary
                    selectedClinic={selectedDirectorId}
                    selectedWeeks={selectedWeeks}
                    directorId={selectedDirectorId}
                  />
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
