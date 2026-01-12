"use client"

import { Suspense, useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { MainNavigation } from "@/components/main-navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { ClinicPerformance } from "@/components/clinic-performance"
import { WeeklyProgramSummary } from "@/components/weekly-program-summary"
import { DirectorNotifications } from "@/components/director-notifications"
import { ClinicView } from "@/components/clinic-view"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OnboardingAgreements } from "@/components/onboarding-agreements"
import { BarChart3, FileText, Users, Clock, Briefcase, Calendar, Building2 } from "lucide-react"
import { useDirectors } from "@/hooks/use-directors"
import { useDemoMode } from "@/contexts/demo-mode-context"
import { useUserRole, canAccessPortal, getDefaultPortal } from "@/hooks/use-user-role"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

async function getAvailableWeeks(): Promise<{ weeks: string[]; schedule: WeekSchedule[]; currentWeek: string | null }> {
  if (typeof window === "undefined") {
    return { weeks: [], schedule: [], currentWeek: null }
  }
  try {
    const response = await fetch("/api/supabase/weeks")
    const data = await response.json()
    if (data.success && data.weeks) {
      return { weeks: data.weeks, schedule: data.schedule || [], currentWeek: data.currentWeek || null }
    }
    return { weeks: [], schedule: [], currentWeek: null }
  } catch (error) {
    console.error("Error fetching available weeks:", error)
    return { weeks: [], schedule: [], currentWeek: null }
  }
}

async function getQuickStats(selectedWeeks: string[], selectedDirectorId: string): Promise<QuickStats> {
  try {
    const fetchWithRetry = async (url: string, retries = 3): Promise<Response> => {
      for (let i = 0; i < retries; i++) {
        try {
          const response = await fetch(url)
          if (response.ok) return response

          // If rate limited or server error, retry
          if (response.status === 429 || response.status >= 500) {
            await new Promise((resolve) => setTimeout(resolve, 2000 * (i + 1)))
            continue
          }

          return response
        } catch (err) {
          console.error(`[v0] Fetch attempt ${i + 1} failed for ${url}:`, err)
          if (i === retries - 1) throw err
          await new Promise((resolve) => setTimeout(resolve, 2000 * (i + 1)))
        }
      }
      throw new Error(`Failed to fetch ${url} after ${retries} retries`)
    }

    const mappingUrl =
      selectedDirectorId && selectedDirectorId !== "all"
        ? `/api/supabase/v-complete-mapping?directorId=${selectedDirectorId}`
        : "/api/supabase/v-complete-mapping"

    const [debriefsRes, mappingRes] = await Promise.all([
      fetchWithRetry("/api/supabase/debriefs"),
      fetchWithRetry(mappingUrl),
    ])

    const debriefsData = await debriefsRes.json()
    const mappingData = await mappingRes.json()

    const mappings = mappingData.data || mappingData.records || mappingData.mappings || []

    const directorStudentIds = new Set<string>()
    const directorClientNames = new Set<string>()

    if (selectedDirectorId && selectedDirectorId !== "all") {
      mappings.forEach((m: any) => {
        if (m.student_id) directorStudentIds.add(m.student_id)
        if (m.client_name) directorClientNames.add(m.client_name)
      })
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

      const matchesWeek =
        selectedWeeks.length === 0 ||
        selectedWeeks.some((w) => {
          const normalizeDate = (d: string) => (d ? new Date(d).toISOString().split("T")[0] : "")
          const weekStartDate = new Date(w)
          const weekEndDate = new Date(w)
          weekEndDate.setDate(weekEndDate.getDate() + 6)
          const debriefDate = new Date(weekEnding)
          return debriefDate >= weekStartDate && debriefDate <= weekEndDate
        })

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

export default function DirectorDashboard() {
  const router = useRouter()
  const { isDemoMode } = useDemoMode()
  const { role, email: userEmail, fullName, isLoading: roleLoading, isAuthenticated } = useUserRole()
  const { directors, isLoading: directorsLoading } = useDirectors()
  const directorSetRef = useRef(false)
  const currentWeekSetRef = useRef(false)

  const [selectedDirectorId, setSelectedDirectorId] = useState<string>("all")
  const [currentDirector, setCurrentDirector] = useState<{
    name: string
    email: string
    clinic: string
    jobTitle: string
  } | null>(null)
  const [availableWeeks, setAvailableWeeks] = useState<string[]>([])
  const [weekSchedule, setWeekSchedule] = useState<WeekSchedule[]>([])
  const [selectedWeeks, setSelectedWeeks] = useState<string[]>([])
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
  const [signedAgreements, setSignedAgreements] = useState<string[]>([])
  const [activeSemesterId, setActiveSemesterId] = useState<string | null>(null) // Added for semesterId

  useEffect(() => {
    if (roleLoading) return
    if (!isDemoMode && !isAuthenticated) {
      router.push("/login")
      return
    }
    if (isAuthenticated && role && !canAccessPortal(role, "director")) {
      router.push(getDefaultPortal(role))
    }
  }, [role, roleLoading, isAuthenticated, isDemoMode, router])

  useEffect(() => {
    if (directors.length === 0 || directorSetRef.current) return

    if (isAuthenticated && role === "director" && userEmail) {
      const loggedInDirector = directors.find((d) => d.email?.toLowerCase() === userEmail.toLowerCase())
      if (loggedInDirector) {
        directorSetRef.current = true
        setSelectedDirectorId(loggedInDirector.id)
        setCurrentDirector({
          name: loggedInDirector.full_name,
          email: loggedInDirector.email || "",
          clinic: loggedInDirector.clinic || "",
          jobTitle: loggedInDirector.job_title || "Director",
        })
        return
      }
    }

    if (isDemoMode || role === "admin") {
      const firstDirector = directors[0]
      directorSetRef.current = true
      setSelectedDirectorId(firstDirector.id)
      setCurrentDirector({
        name: firstDirector.full_name,
        email: firstDirector.email || "",
        clinic: firstDirector.clinic || "",
        jobTitle: firstDirector.job_title || "Director",
      })
    }
  }, [directors, isAuthenticated, role, userEmail, isDemoMode])

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true)
      const { weeks, schedule, currentWeek } = await getAvailableWeeks()
      setAvailableWeeks(weeks)
      setWeekSchedule(schedule)

      if (weeks.length > 0 && !currentWeekSetRef.current) {
        currentWeekSetRef.current = true
        const defaultWeek = currentWeek && weeks.includes(currentWeek) ? currentWeek : weeks[0]
        setSelectedWeeks([defaultWeek])

        const stats = await getQuickStats([defaultWeek], selectedDirectorId)
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

  const handleCurrentWeekDetected = (currentWeek: string) => {
    if (!currentWeekSetRef.current && selectedWeeks.length === 0) {
      currentWeekSetRef.current = true
      setSelectedWeeks([currentWeek])
    }
  }

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

  const getPeriodLabel = () => {
    if (selectedWeeks.length === 0) return "All Weeks"
    if (selectedWeeks.length === 1) return getWeekLabel(selectedWeeks[0])
    return `${selectedWeeks.length} weeks`
  }

  const getDisplayName = () => {
    if (role === "admin" && fullName) {
      return fullName.split(" ")[0]
    }
    if (currentDirector?.name) {
      return currentDirector.name.split(" ")[0]
    }
    return ""
  }

  const getRoleTitle = () => {
    if (role === "admin") return "Administrator"
    if (currentDirector?.clinic) return `${currentDirector.clinic} Clinic Director`
    return "Director Dashboard"
  }

  const getInitials = () => {
    if (role === "admin" && fullName) {
      return fullName.charAt(0).toUpperCase()
    }
    if (currentDirector?.name) {
      return currentDirector.name.charAt(0).toUpperCase()
    }
    return "D"
  }

  if (roleLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
        <aside className="fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-52 border-r bg-card z-40">
          <MainNavigation />
        </aside>
        <div className="pl-52 pt-14">
          <div className="p-4">
            <Card className="p-8 text-center">
              <p className="text-slate-500">Loading dashboard...</p>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (!isDemoMode && !isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      <aside className="fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-52 border-r bg-card z-40">
        <MainNavigation />
      </aside>

      <div className="pl-52 pt-14">
        <div className="bg-[#3d4559] mx-4 mt-4 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-[#8fa68f] flex items-center justify-center text-xl font-bold text-white">
                {getInitials()}
              </div>
              <div>
                <h1 className="text-2xl font-bold">Welcome{getDisplayName() ? `, ${getDisplayName()}` : ""}!</h1>
                <p className="text-[#9aacba]">{getRoleTitle()}</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              {(isDemoMode || role === "admin") && directors.length > 0 && (
                <Select value={selectedDirectorId} onValueChange={handleDirectorChange}>
                  <SelectTrigger className="w-[200px] bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Select Director" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Directors</SelectItem>
                    {directors.map((director) => (
                      <SelectItem key={director.id} value={director.id}>
                        {director.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <div className="text-right">
                <p className="text-sm text-[#9aacba]">Current Period</p>
                <p className="font-medium">{getPeriodLabel()}</p>
              </div>
            </div>
          </div>
        </div>

        <DashboardHeader
          selectedWeeks={selectedWeeks}
          onWeeksChange={setSelectedWeeks}
          availableWeeks={availableWeeks}
          selectedDirectorId={selectedDirectorId}
          onDirectorChange={handleDirectorChange}
          showDirectorFilter={true}
          onCurrentWeekDetected={handleCurrentWeekDetected}
        />

        <main className="p-4 space-y-4">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="flex flex-wrap gap-1 h-auto p-1 bg-slate-100/80">
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
