"use client"

import { Suspense, useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { MainNavigation } from "@/components/main-navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { WeeklyProgramSummary } from "@/components/weekly-program-summary"
import { DirectorNotifications } from "@/components/director-notifications"
import { ClinicView } from "@/components/clinic-view"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OnboardingAgreements } from "@/components/onboarding-agreements"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  BarChart3,
  FileText,
  Users,
  Clock,
  Briefcase,
  Calendar,
  Building2,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  TrendingUp,
  MessageSquare,
  ExternalLink,
  Bell,
  Eye,
} from "lucide-react"
import { useDirectors } from "@/hooks/use-directors"
import { useDemoMode } from "@/contexts/demo-mode-context"
import { useUserRole, canAccessPortal, getDefaultPortal } from "@/hooks/use-user-role"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  getElapsedClassCount,
  getTotalClassCount,
  getElapsedWeeksRequiringDebrief,
  type SemesterWeek,
} from "@/lib/semester-utils"

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

interface Clinic {
  id: string
  name: string
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

  const [clinics, setClinics] = useState<Clinic[]>([])
  const [selectedClinicForView, setSelectedClinicForView] = useState<string>("my-clinic")

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
  const [debriefsData, setDebriefsData] = useState<{
    total: number
    pending: number
    reviewed: number
    recentDebriefs: any[]
    byClient: Record<string, number>
    byWeek: Record<number, number>
  }>({
    total: 0,
    pending: 0,
    reviewed: 0,
    recentDebriefs: [],
    byClient: {},
    byWeek: {},
  })
  const [scheduleData, setScheduleData] = useState<{
    currentWeek: any
    upcomingWeeks: any[]
    assignments: any[]
  }>({
    currentWeek: null,
    upcomingWeeks: [],
    assignments: [],
  })

  const [overviewData, setOverviewData] = useState<{
    urgentItems: Array<{ type: string; message: string; count?: number; action?: string }>
    attendanceSummary: { present: number; absent: number; rate: number }
    recentClientActivity: Array<{ client: string; activity: string; time: string; type: string }>
    studentQuestions: Array<{ student: string; question: string; time: string; answered: boolean }>
    weeklyProgress: { hoursTarget: number; hoursActual: number; debriefsExpected: number; debriefsSubmitted: number }
  }>({
    urgentItems: [],
    attendanceSummary: { present: 0, absent: 0, rate: 0 },
    recentClientActivity: [],
    studentQuestions: [],
    weeklyProgress: { hoursTarget: 0, hoursActual: 0, debriefsExpected: 0, debriefsSubmitted: 0 },
  })

  const isInternalOrLegalDirector = role === "admin" || role === "legal" // Assuming these roles should see the clinic selection
  const isSEEDDirector = role === "director" // Assuming SEED Director role

  const getClinicIdForView = (): string => {
    if (isInternalOrLegalDirector || isSEEDDirector || role === "admin" || isDemoMode) {
      return selectedClinicForView
    }
    return "my-clinic" // Default for other roles
  }

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

  useEffect(() => {
    async function fetchDebriefsData() {
      try {
        const response = await fetch("/api/supabase/debriefs?semesterId=a1b2c3d4-e5f6-7890-abcd-202601120000")
        const data = await response.json()
        if (data.success && data.debriefs) {
          const debriefs = data.debriefs

          // Filter by director if selected
          const filteredDebriefs =
            selectedDirectorId && selectedDirectorId !== "all"
              ? debriefs.filter((d: any) => {
                  // Match by clinic or client director
                  return true // For now include all, can be enhanced with director filtering
                })
              : debriefs

          const pending = filteredDebriefs.filter((d: any) => d.status === "pending" || !d.status).length
          const reviewed = filteredDebriefs.filter((d: any) => d.status === "reviewed").length

          // Group by client
          const byClient: Record<string, number> = {}
          filteredDebriefs.forEach((d: any) => {
            const client = d.client_name || "Unknown"
            byClient[client] = (byClient[client] || 0) + 1
          })

          // Group by week
          const byWeek: Record<number, number> = {}
          filteredDebriefs.forEach((d: any) => {
            const week = d.week_number || 0
            byWeek[week] = (byWeek[week] || 0) + 1
          })

          // Get recent debriefs (last 5)
          const recentDebriefs = filteredDebriefs
            .sort(
              (a: any, b: any) =>
                new Date(b.date_submitted || b.created_at).getTime() -
                new Date(a.date_submitted || a.created_at).getTime(),
            )
            .slice(0, 5)

          setDebriefsData({
            total: filteredDebriefs.length,
            pending,
            reviewed,
            recentDebriefs,
            byClient,
            byWeek,
          })
        }
      } catch (error) {
        console.error("Error fetching debriefs data:", error)
      }
    }
    fetchDebriefsData()
  }, [selectedDirectorId])

  useEffect(() => {
    async function fetchScheduleData() {
      try {
        const response = await fetch("/api/semester-schedule?semester=Spring%202026")
        const data = await response.json()
        if (data.schedules) {
          const schedules = data.schedules
          const today = new Date()

          // Find current week
          const currentWeek = schedules.find((s: any) => {
            const start = new Date(s.week_start)
            const end = new Date(s.week_end)
            return today >= start && today <= end
          })

          // Get upcoming weeks (next 3)
          const upcomingWeeks = schedules.filter((s: any) => new Date(s.week_start) > today).slice(0, 3)

          // Collect all assignments from all weeks
          const allAssignments = schedules
            .flatMap((s: any) => (s.assignments || []).map((a: any) => ({ ...a, week_number: s.week_number })))
            .filter((a: any) => new Date(a.dueDate) >= today)
            .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
            .slice(0, 5)

          setScheduleData({
            currentWeek,
            upcomingWeeks,
            assignments: allAssignments,
          })
        }
      } catch (error) {
        console.error("Error fetching schedule data:", error)
      }
    }
    fetchScheduleData()
  }, [])

  useEffect(() => {
    async function fetchOverviewData() {
      try {
        // Fetch attendance data from correct endpoint
        const attendanceRes = await fetch("/api/supabase/attendance")
        let attendanceData = { records: [] }
        if (attendanceRes.ok) {
          const text = await attendanceRes.text()
          try {
            attendanceData = JSON.parse(text)
          } catch {
            console.error("Attendance API returned non-JSON response")
          }
        }

        const scheduleRes = await fetch("/api/semester-schedule")
        let semesterScheduleData: SemesterWeek[] = []
        if (scheduleRes.ok) {
          const scheduleJson = await scheduleRes.json()
          semesterScheduleData = scheduleJson.schedules || []
        }

        // Fetch announcements for recent activity
        const announcementsRes = await fetch("/api/announcements")
        let announcementsData = { announcements: [] }
        if (announcementsRes.ok) {
          const text = await announcementsRes.text()
          try {
            announcementsData = JSON.parse(text)
          } catch {
            console.error("Announcements API returned non-JSON response")
          }
        }

        // Fetch client meetings
        const meetingsRes = await fetch("/api/scheduled-client-meetings")
        let meetingsData = { meetings: [] }
        if (meetingsRes.ok) {
          const text = await meetingsRes.text()
          try {
            meetingsData = JSON.parse(text)
          } catch {
            console.error("Meetings API returned non-JSON response")
          }
        }

        const allAttendanceRecords = attendanceData.records || attendanceData.attendance || []
        const elapsedClasses = getElapsedClassCount(semesterScheduleData)
        const totalClasses = getTotalClassCount(semesterScheduleData)

        // Get unique students who attended
        const studentsWithAttendance = new Set(allAttendanceRecords.map((r: any) => r.student_id))
        const presentCount = studentsWithAttendance.size

        // Calculate rate based on elapsed classes (if 1 class has occurred, and student attended, rate is 100%)
        const attendanceRate =
          elapsedClasses > 0
            ? Math.round((allAttendanceRecords.length / (quickStats.activeStudents * elapsedClasses || 1)) * 100)
            : 0

        // Build urgent items
        const urgentItems: Array<{ type: string; message: string; count?: number; action?: string }> = []

        if (debriefsData.pending > 0) {
          urgentItems.push({
            type: "warning",
            message: `${debriefsData.pending} debrief${debriefsData.pending > 1 ? "s" : ""} pending review`,
            count: debriefsData.pending,
            action: "Review Now",
          })
        }

        if (attendanceRate < 80 && elapsedClasses > 0) {
          urgentItems.push({
            type: "alert",
            message: `Attendance rate at ${attendanceRate}% (${elapsedClasses}/${totalClasses} classes completed)`,
            action: "View Details",
          })
        }

        // Build recent client activity from meetings and announcements
        const recentActivity: Array<{ client: string; activity: string; time: string; type: string }> = []

        meetingsData.meetings?.slice(0, 3).forEach((meeting: any) => {
          recentActivity.push({
            client: meeting.client_name || "Client",
            activity: `Scheduled meeting - Week ${meeting.week_number}`,
            time: meeting.start_time || "",
            type: "meeting",
          })
        })

        const elapsedWeeks = getElapsedWeeksRequiringDebrief(semesterScheduleData).length
        const expectedDebriefs = (quickStats.activeStudents || 0) * elapsedWeeks
        const weeklyProgress = {
          hoursTarget: (quickStats.activeStudents || 0) * 3 * elapsedWeeks, // 3 hours target per student per week
          hoursActual: quickStats.totalHours || 0,
          debriefsExpected: expectedDebriefs,
          debriefsSubmitted: quickStats.debriefsSubmitted || 0,
        }

        setOverviewData({
          urgentItems,
          attendanceSummary: {
            present: allAttendanceRecords.length,
            absent: quickStats.activeStudents * elapsedClasses - allAttendanceRecords.length,
            rate: Math.min(attendanceRate, 100), // Cap at 100%
          },
          recentClientActivity: recentActivity,
          studentQuestions: [],
          weeklyProgress,
        })
      } catch (error) {
        console.error("Error fetching overview data:", error)
      }
    }

    if (!isLoading) {
      fetchOverviewData()
    }
  }, [isLoading, quickStats, debriefsData])

  useEffect(() => {
    async function fetchClinics() {
      try {
        const response = await fetch("/api/clinics")
        if (response.ok) {
          const data = await response.json()
          setClinics(data.clinics || [])
        }
      } catch (error) {
        console.error("Error fetching clinics:", error)
      }
    }
    fetchClinics()
  }, [])

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

              {/* Weekly Overview Stats */}
              <div className="grid gap-6 md:grid-cols-3">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Hours Logged</p>
                        <p className="text-3xl font-bold text-blue-900 mt-1">{quickStats.totalHours}</p>
                        <p className="text-xs text-blue-600 mt-1">
                          {overviewData.weeklyProgress.hoursTarget > 0
                            ? `${Math.round((quickStats.totalHours / overviewData.weeklyProgress.hoursTarget) * 100)}% of target`
                            : "This period"}
                        </p>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-blue-200/50 flex items-center justify-center">
                        <Clock className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide">Students Active</p>
                        <p className="text-3xl font-bold text-emerald-900 mt-1">{quickStats.activeStudents}</p>
                        <p className="text-xs text-emerald-600 mt-1">Submitted work</p>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-emerald-200/50 flex items-center justify-center">
                        <Users className="h-6 w-6 text-emerald-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-purple-600 uppercase tracking-wide">Active Clients</p>
                        <p className="text-3xl font-bold text-purple-900 mt-1">{quickStats.activeClients}</p>
                        <p className="text-xs text-purple-600 mt-1">With activity</p>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-purple-200/50 flex items-center justify-center">
                        <Briefcase className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Two Column Layout: Clinic Health & Activity Feed */}
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Clinic Health Summary - 2 columns */}
                <div className="lg:col-span-2 space-y-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">Clinic Health</CardTitle>
                          <CardDescription>Quick overview of your clinic's performance</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => router.push("/my-clinic")}>
                          View Details <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2">
                        {/* Weekly Progress */}
                        <div className="space-y-3 p-4 rounded-lg bg-slate-50">
                          <h4 className="font-medium text-sm flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-blue-500" />
                            Weekly Progress
                          </h4>
                          <div className="space-y-2">
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-muted-foreground">Hours Logged</span>
                                <span className="font-medium">
                                  {quickStats.totalHours} / {overviewData.weeklyProgress.hoursTarget || "—"} target
                                </span>
                              </div>
                              <Progress
                                value={
                                  overviewData.weeklyProgress.hoursTarget > 0
                                    ? Math.min(
                                        (quickStats.totalHours / overviewData.weeklyProgress.hoursTarget) * 100,
                                        100,
                                      )
                                    : 0
                                }
                                className="h-2"
                              />
                            </div>
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-muted-foreground">Debriefs Submitted</span>
                                <span className="font-medium">
                                  {quickStats.debriefsSubmitted} / {overviewData.weeklyProgress.debriefsExpected || "—"}{" "}
                                  expected
                                </span>
                              </div>
                              <Progress
                                value={
                                  overviewData.weeklyProgress.debriefsExpected > 0
                                    ? Math.min(
                                        (quickStats.debriefsSubmitted / overviewData.weeklyProgress.debriefsExpected) *
                                          100,
                                        100,
                                      )
                                    : 0
                                }
                                className="h-2"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Student Activity Summary */}
                        <div className="space-y-3 p-4 rounded-lg bg-slate-50">
                          <h4 className="font-medium text-sm flex items-center gap-2">
                            <Users className="h-4 w-4 text-emerald-500" />
                            Student Activity
                          </h4>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Active this week</span>
                              <Badge variant="secondary">{quickStats.activeStudents} students</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Attendance rate</span>
                              <Badge
                                variant={overviewData.attendanceSummary.rate >= 80 ? "default" : "destructive"}
                                className={
                                  overviewData.attendanceSummary.rate >= 80 ? "bg-emerald-100 text-emerald-700" : ""
                                }
                              >
                                {overviewData.attendanceSummary.rate}%
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Avg hours/student</span>
                              <Badge variant="secondary">
                                {quickStats.activeStudents > 0
                                  ? (quickStats.totalHours / quickStats.activeStudents).toFixed(1)
                                  : 0}{" "}
                                hrs
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Client Projects Quick View */}
                      <div className="mt-4 p-4 rounded-lg bg-slate-50">
                        <h4 className="font-medium text-sm flex items-center gap-2 mb-3">
                          <Briefcase className="h-4 w-4 text-purple-500" />
                          Client Projects
                        </h4>
                        <div className="grid gap-2 md:grid-cols-2">
                          {Object.entries(debriefsData.byClient)
                            .slice(0, 4)
                            .map(([client, count]) => (
                              <div key={client} className="flex items-center justify-between p-2 rounded bg-white">
                                <span className="text-sm truncate max-w-[180px]">{client}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">{count} debriefs</span>
                                </div>
                              </div>
                            ))}
                          {Object.keys(debriefsData.byClient).length === 0 && (
                            <p className="text-sm text-muted-foreground col-span-2">No client activity yet</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Activity Feed - 1 column */}
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Bell className="h-4 w-4" />
                          Recent Activity
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Suspense fallback={<div className="text-sm text-muted-foreground">Loading...</div>}>
                        <DirectorNotifications selectedClinic={selectedDirectorId} compact={true} />
                      </Suspense>
                    </CardContent>
                  </Card>

                  {/* Quick Actions */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-2 bg-transparent"
                        onClick={() => router.push("/debriefs")}
                      >
                        <FileText className="h-4 w-4" />
                        Review Debriefs
                        {debriefsData.pending > 0 && (
                          <Badge variant="secondary" className="ml-auto">
                            {debriefsData.pending}
                          </Badge>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-2 bg-transparent"
                        onClick={() => router.push("/class-course")}
                      >
                        <Calendar className="h-4 w-4" />
                        View Schedule
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-2 bg-transparent"
                        onClick={() => router.push("/client-engagements")}
                      >
                        <Briefcase className="h-4 w-4" />
                        Client Engagements
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-2 bg-transparent"
                        onClick={() => router.push("/roster")}
                      >
                        <Users className="h-4 w-4" />
                        View Roster
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Detailed Performance Section */}
              <div className="grid gap-6">
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
              {/* Add clinic selection dropdown for "My Clinic" view */}
              {(isInternalOrLegalDirector || isSEEDDirector || role === "admin" || isDemoMode) && (
                <Card className="border-blue-200 bg-blue-50/30">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">Viewing as Director/Admin</span>
                        <span className="text-sm text-blue-700">Select a clinic to view their data</span>
                      </div>
                      <Select value={selectedClinicForView} onValueChange={setSelectedClinicForView}>
                        <SelectTrigger className="w-[220px] bg-white">
                          <SelectValue placeholder="Select clinic" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="my-clinic">
                            My Clinic ({currentDirector?.clinic || "Not assigned"})
                          </SelectItem>
                          <SelectItem value="all">All Clinics</SelectItem>
                          {clinics.map((clinic) => (
                            <SelectItem key={clinic.id} value={clinic.id}>
                              {clinic.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              )}
              <ClinicView selectedClinic={getClinicIdForView()} selectedWeeks={selectedWeeks} />
            </TabsContent>

            <TabsContent value="debriefs" className="space-y-6">
              {/* Debriefs Summary Cards */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Debriefs</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{debriefsData.total}</div>
                    <p className="text-xs text-muted-foreground">This semester</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-amber-600">{debriefsData.pending}</div>
                    <p className="text-xs text-muted-foreground">Awaiting your review</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Reviewed</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{debriefsData.reviewed}</div>
                    <p className="text-xs text-muted-foreground">Completed reviews</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {debriefsData.total > 0 ? Math.round((debriefsData.reviewed / debriefsData.total) * 100) : 0}%
                    </div>
                    <Progress
                      value={debriefsData.total > 0 ? (debriefsData.reviewed / debriefsData.total) * 100 : 0}
                      className="h-2 mt-2"
                    />
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                {/* Recent Debriefs */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Recent Debriefs</CardTitle>
                      <CardDescription>Latest submissions from your students</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => router.push("/debriefs")}>
                      View All <ExternalLink className="ml-2 h-3 w-3" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {debriefsData.recentDebriefs.length === 0 ? (
                      <p className="text-muted-foreground text-sm">No recent debriefs</p>
                    ) : (
                      <div className="space-y-3">
                        {debriefsData.recentDebriefs.map((debrief: any, index: number) => (
                          <div
                            key={debrief.id || index}
                            className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <FileText className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <p className="text-sm font-medium">
                                  {debrief.student_email?.split("@")[0] || "Student"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {debrief.client_name || "Client"} • Week {debrief.week_number}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={debrief.status === "reviewed" ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {debrief.status || "pending"}
                              </Badge>
                              <span className="text-xs text-muted-foreground">{debrief.hours_worked}h</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Debriefs by Client */}
                <Card>
                  <CardHeader>
                    <CardTitle>Debriefs by Client</CardTitle>
                    <CardDescription>Distribution across your client projects</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {Object.keys(debriefsData.byClient).length === 0 ? (
                      <p className="text-muted-foreground text-sm">No data available</p>
                    ) : (
                      <div className="space-y-3">
                        {Object.entries(debriefsData.byClient)
                          .sort(([, a], [, b]) => b - a)
                          .slice(0, 5)
                          .map(([client, count]) => (
                            <div key={client} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Briefcase className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{client}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Progress value={(count / debriefsData.total) * 100} className="w-20 h-2" />
                                <span className="text-sm font-medium w-8 text-right">{count}</span>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Questions & Updates Section */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Student Questions & Updates
                    </CardTitle>
                    <CardDescription>Questions and updates from recent debriefs</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  {debriefsData.recentDebriefs.filter((d: any) => d.questions).length === 0 ? (
                    <p className="text-muted-foreground text-sm">No questions or updates this period</p>
                  ) : (
                    <div className="space-y-3">
                      {debriefsData.recentDebriefs
                        .filter((d: any) => d.questions)
                        .slice(0, 3)
                        .map((debrief: any, index: number) => (
                          <div key={index} className="p-3 rounded-lg border bg-amber-50/50 border-amber-200">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="text-xs">
                                Week {debrief.week_number}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {debrief.student_email?.split("@")[0]}
                              </span>
                            </div>
                            <p className="text-sm">{debrief.questions}</p>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="schedule" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Current Week */}
                <Card className="lg:col-span-2">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Current Week</CardTitle>
                      <CardDescription>
                        {scheduleData.currentWeek
                          ? `${scheduleData.currentWeek.week_label} (${new Date(scheduleData.currentWeek.week_start).toLocaleDateString()} - ${new Date(scheduleData.currentWeek.week_end).toLocaleDateString()})`
                          : "No active week"}
                      </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => router.push("/class-course")}>
                      Full Schedule <ExternalLink className="ml-2 h-3 w-3" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {scheduleData.currentWeek ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <Badge variant="secondary" className="text-sm">
                            {scheduleData.currentWeek.session_focus || "No focus set"}
                          </Badge>
                          {scheduleData.currentWeek.is_break && (
                            <Badge variant="outline" className="text-amber-600 border-amber-300">
                              Break Week
                            </Badge>
                          )}
                        </div>

                        {/* Schedule Data Summary */}
                        {scheduleData.currentWeek.schedule_data &&
                          scheduleData.currentWeek.schedule_data.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-muted-foreground">Today's Sessions:</p>
                              {scheduleData.currentWeek.schedule_data.slice(0, 4).map((item: any, index: number) => (
                                <div key={index} className="flex items-center justify-between p-2 rounded bg-slate-50">
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">
                                      {item.start_time} - {item.end_time}
                                    </span>
                                    <span className="text-sm text-muted-foreground">{item.activity}</span>
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    {item.minutes} min
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          )}

                        {scheduleData.currentWeek.notes && (
                          <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                            <p className="text-sm text-blue-800">{scheduleData.currentWeek.notes}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No schedule data for current week</p>
                    )}
                  </CardContent>
                </Card>

                {/* Upcoming Weeks */}
                <Card>
                  <CardHeader>
                    <CardTitle>Upcoming Weeks</CardTitle>
                    <CardDescription>Next 3 weeks preview</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {scheduleData.upcomingWeeks.length === 0 ? (
                      <p className="text-muted-foreground text-sm">No upcoming weeks</p>
                    ) : (
                      <div className="space-y-3">
                        {scheduleData.upcomingWeeks.map((week: any, index: number) => (
                          <div
                            key={week.id || index}
                            className="p-3 rounded-lg border hover:bg-slate-50 transition-colors cursor-pointer"
                            onClick={() => router.push("/class-course")}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm">{week.week_label}</span>
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(week.week_start).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}{" "}
                              -{" "}
                              {new Date(week.week_end).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </p>
                            {week.session_focus && (
                              <Badge variant="secondary" className="mt-2 text-xs">
                                {week.session_focus}
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Upcoming Assignments */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Upcoming Assignments & Deadlines
                  </CardTitle>
                  <CardDescription>Assignments due in the coming weeks</CardDescription>
                </CardHeader>
                <CardContent>
                  {scheduleData.assignments.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No upcoming assignments</p>
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {scheduleData.assignments.map((assignment: any, index: number) => (
                        <div key={assignment.id || index} className="p-3 rounded-lg border">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-sm">{assignment.title}</p>
                              <p className="text-xs text-muted-foreground mt-1">{assignment.description}</p>
                            </div>
                            <Badge variant="outline" className="text-xs whitespace-nowrap">
                              Week {assignment.week_number}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              Due:{" "}
                              {new Date(assignment.dueDate).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
