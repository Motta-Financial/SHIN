"use client"

import { Suspense, useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { MainNavigation } from "@/components/main-navigation"
import { getErrorMessage, isAuthError, isPermissionError } from "@/lib/error-handler"
import { useCurrentSemester } from "@/hooks/use-current-semester"
import { DashboardHeader } from "@/components/dashboard-header"
import { WeeklyProgramSummary } from "@/components/weekly-program-summary"
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
  KeyRound,
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog" // Added Dialog imports

interface QuickStats {
  totalHours: number
  activeStudents: number
  totalStudents: number
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

    // Fetch all students to get total student count
    const allStudentsRes = await fetch("/api/supabase/students") // Assuming an endpoint exists for all students
    const allStudentsData = await allStudentsRes.json()
    const totalStudents = allStudentsData.students ? allStudentsData.students.length : 0

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

    // Calculate pending reviews (debriefs without director feedback)
    const pendingReviews = allDebriefs.filter((d: any) => {
      const hasFeedback = d.director_feedback || d.directorFeedback
      const studentId = d.student_id || d.studentId
      const matchesDirector =
        selectedDirectorId === "all" ||
        directorStudentIds.size === 0 ||
        directorStudentIds.has(studentId)
      return !hasFeedback && matchesDirector
    }).length

    // Calculate week-over-week changes (comparing to previous period)
    // For now, show positive indicators based on activity
    const hoursChange = debriefsSubmitted > 0 ? Math.round((totalHours / debriefsSubmitted) * 10) / 10 : 0
    const studentsChange = activeStudents.size > 0 ? activeStudents.size : 0

    return {
      totalHours: Math.round(totalHours * 10) / 10,
      activeStudents: activeStudents.size,
      totalStudents: totalStudents,
      activeClients: activeClients.size,
      debriefsSubmitted,
      pendingReviews,
      hoursChange,
      studentsChange,
    }
  } catch (error) {
    console.error("Error fetching quick stats:", error)
    return {
      totalHours: 0,
      activeStudents: 0,
      totalStudents: 0,
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
  const { semesterId } = useCurrentSemester()
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
    totalStudents: 0,
    activeClients: 0,
    debriefsSubmitted: 0,
    pendingReviews: 0,
    hoursChange: 0,
    studentsChange: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [signedAgreements, setSignedAgreements] = useState<string[]>([])
  const [activeSemesterId, setActiveSemesterId] = useState<string | null>(null) // Added for semesterId
  const [hoursDialogOpen, setHoursDialogOpen] = useState(false)
  const [debriefsDialogOpen, setDebriefsDialogOpen] = useState(false)
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false)
  const [attendancePassword, setAttendancePassword] = useState<string>("") // Added attendance password state
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
    notifications: Array<{ type: string; title: string; time: string }> // Added for notifications
  }>({
    urgentItems: [],
    attendanceSummary: { present: 0, absent: 0, rate: 0 },
    recentClientActivity: [],
    studentQuestions: [],
    weeklyProgress: { hoursTarget: 0, hoursActual: 0, debriefsExpected: 0, debriefsSubmitted: 0 },
    notifications: [], // Initialize notifications
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

        // Fetch stats with the default week and selected director
        const stats = await getQuickStats([defaultWeek], selectedDirectorId)
        setQuickStats(stats)
      } else if (weeks.length === 0) {
        // If no weeks are available, fetch stats with empty selection to potentially show zero states
        const stats = await getQuickStats([], selectedDirectorId)
        setQuickStats(stats)
      }
      setIsLoading(false)
    }

    fetchInitialData()
  }, [selectedDirectorId]) // Depend on selectedDirectorId to fetch initial stats correctly

  useEffect(() => {
    const fetchStats = async () => {
      // Only fetch if weeks are selected or if it's not the initial load state
      if (selectedWeeks.length > 0 || (availableWeeks.length > 0 && !isLoading)) {
        const stats = await getQuickStats(selectedWeeks, selectedDirectorId)
        setQuickStats(stats)
      }
    }

    fetchStats()
  }, [selectedWeeks, selectedDirectorId, availableWeeks, isLoading]) // Added dependencies

  useEffect(() => {
    async function fetchDebriefsData() {
      try {
        const response = await fetch(`/api/supabase/debriefs?semesterId=${semesterId}`)
        const data = await response.json()
        if (data.success && data.debriefs) {
          const debriefs = data.debriefs

          // Filter by director if selected
          const filteredDebriefs =
            selectedDirectorId && selectedDirectorId !== "all"
              ? debriefs.filter((d: any) => {
                  // This filtering needs to be more robust. For now, assume we can get director's clinic or clients from their mapped data.
                  // A more complex approach might involve fetching director's associated clinics/clients first.
                  // Placeholder: If director is selected, we'd need a way to link debriefs to that director.
                  // For simplicity, we'll assume the debriefs fetched are generally relevant,
                  // and specific director filtering might happen client-side if needed or via API params.
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
    // Fetch debriefs data when director selection changes or on initial load if relevant
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
          } catch (e) {
            console.error("Attendance API returned non-JSON response:", e)
            attendanceData = { records: [] } // Ensure it's an empty array if parsing fails
          }
        } else {
          console.error("Failed to fetch attendance data:", attendanceRes.status)
        }

        const scheduleRes = await fetch("/api/semester-schedule")
        let semesterScheduleData: SemesterWeek[] = []
        if (scheduleRes.ok) {
          const scheduleJson = await scheduleRes.json()
          semesterScheduleData = scheduleJson.schedules || []
        } else {
          console.error("Failed to fetch semester schedule data:", scheduleRes.status)
        }

        // Fetch announcements for recent activity
        const announcementsRes = await fetch("/api/announcements")
        let announcementsData = { announcements: [] }
        if (announcementsRes.ok) {
          const text = await announcementsRes.text()
          try {
            announcementsData = JSON.parse(text)
          } catch (e) {
            console.error("Announcements API returned non-JSON response:", e)
            announcementsData = { announcements: [] }
          }
        } else {
          console.error("Failed to fetch announcements data:", announcementsRes.status)
        }

        // Fetch client meetings
        const meetingsRes = await fetch("/api/scheduled-client-meetings")
        let meetingsData = { meetings: [] }
        if (meetingsRes.ok) {
          const text = await meetingsRes.text()
          try {
            meetingsData = JSON.parse(text)
          } catch (e) {
            console.error("Meetings API returned non-JSON response:", e)
            meetingsData = { meetings: [] }
          }
        } else {
          console.error("Failed to fetch meetings data:", meetingsRes.status)
        }

        const allAttendanceRecords = attendanceData.records || attendanceData.attendance || []
        const elapsedClasses = getElapsedClassCount(semesterScheduleData)
        const totalClasses = getTotalClassCount(semesterScheduleData)

        // Filter attendance records by Present/Absent status (stored in notes field)
        const presentRecords = allAttendanceRecords.filter((r: any) => r.notes === "Present")
        const absentRecords = allAttendanceRecords.filter((r: any) => r.notes === "Absent")

        // Get unique students who were present
        const studentsWithAttendance = new Set(presentRecords.map((r: any) => r.student_id))
        const presentCount = studentsWithAttendance.size // This is the count of unique students present in *any* class

        // Calculate total possible attendances (students × elapsed classes)
        const totalPossibleAttendances = elapsedClasses * (quickStats.activeStudents || 0)

        // Calculate rate based on present vs total records
        const totalRecords = allAttendanceRecords.length
        const attendanceRate =
          totalRecords > 0 ? Math.round((presentRecords.length / totalRecords) * 100) : 0

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

        // Adjusted attendance rate check for urgency
        if (elapsedClasses > 0 && quickStats.activeStudents > 0 && attendanceRate < 80) {
          urgentItems.push({
            type: "alert",
            message: `Low attendance rate: ${attendanceRate}% (${elapsedClasses}/${totalClasses} classes completed)`,
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

        // Filter announcements too, perhaps? For now, sticking to meetings.
        // announcementsData.announcements?.slice(0, 3).forEach((announcement: any) => {
        //   recentActivity.push({
        //     client: "SEED Program", // Or derive from announcement context
        //     activity: announcement.title || "New Announcement",
        //     time: announcement.created_at || "",
        //     type: "announcement",
        //   })
        // })

        const elapsedWeeksForDebrief = getElapsedWeeksRequiringDebrief(semesterScheduleData)
        const expectedDebriefs = (quickStats.activeStudents || 0) * elapsedWeeksForDebrief.length
        const weeklyProgress = {
          hoursTarget: (quickStats.activeStudents || 0) * 3 * elapsedWeeksForDebrief.length, // Assuming 3 hours target per student per week
          hoursActual: quickStats.totalHours || 0,
          debriefsExpected: expectedDebriefs,
          debriefsSubmitted: quickStats.debriefsSubmitted || 0,
        }

        // Placeholder for notifications - fetch real data if available
        const placeholderNotifications = [
          { type: "debrief", title: "Student A submitted a debrief", time: "2h ago" },
          { type: "session", title: "Client Meeting: Project X", time: "yesterday" },
          { type: "alert", title: "Low attendance detected for Week 10", time: "2 days ago" },
        ]

        setOverviewData({
          urgentItems,
          attendanceSummary: {
            present: presentRecords.length, // Count of records marked as "Present"
            absent: absentRecords.length, // Count of records marked as "Absent"
            rate: Math.min(attendanceRate, 100), // Cap at 100%
          },
          recentClientActivity: recentActivity,
          studentQuestions: [], // Placeholder, needs dedicated fetch
          weeklyProgress,
          notifications: placeholderNotifications, // Assign placeholder notifications
        })
} catch (error) {
  console.error("Error fetching overview data:", error)
  if (isAuthError(error)) {
    router.push("/sign-in")
  }
  }
  }

    // Fetch overview data only after initial loading is complete and relevant data (quickStats, debriefsData) is available
    if (!isLoading && quickStats && debriefsData) {
      fetchOverviewData()
    }
  }, [isLoading, quickStats, debriefsData]) // Depend on isLoading, quickStats, and debriefsData

  useEffect(() => {
    async function fetchClinics() {
      try {
        const response = await fetch("/api/clinics")
        if (response.ok) {
          const data = await response.json()
          setClinics(data.clinics || [])
        } else {
          console.error("Failed to fetch clinics:", response.status)
        }
} catch (error) {
  console.error("Error fetching clinics:", error)
  if (isAuthError(error)) {
    router.push("/sign-in")
  }
  }
  }
  fetchClinics()
  }, [])

  // Add useEffect to fetch attendance password
  useEffect(() => {
    const fetchAttendancePassword = async () => {
      try {
        // Find current week number from weekSchedule
        const today = new Date()
        const currentWeekData = weekSchedule.find((w) => {
          const start = new Date(w.weekStart)
          const end = new Date(w.weekEnd)
          return today >= start && today <= end
        })

        const weekNum = currentWeekData?.weekNumber || 1

        const response = await fetch(`/api/attendance-password?weekNumber=${weekNum}`)
        const data = await response.json()

        if (data.passwords && data.passwords.length > 0) {
          setAttendancePassword(data.passwords[0].password)
        } else {
          setAttendancePassword("Not set")
        }
      } catch (error) {
        console.error("[v0] Error fetching attendance password:", error)
        setAttendancePassword("Error loading")
      }
    }

    if (weekSchedule.length > 0) {
      fetchAttendancePassword()
    }
  }, [weekSchedule])

  const handleCurrentWeekDetected = (currentWeek: string) => {
    // This function is called by DashboardHeader when it detects the current week.
    // It's used to initialize selectedWeeks if it's empty.
    if (!currentWeekSetRef.current && selectedWeeks.length === 0) {
      currentWeekSetRef.current = true
      setSelectedWeeks([currentWeek])
      // Optionally, refetch stats if selectedWeeks was empty and now has a value
      // const fetchStatsAfterSettingWeek = async () => {
      //   const stats = await getQuickStats([currentWeek], selectedDirectorId)
      //   setQuickStats(stats)
      // }
      // fetchStatsAfterSettingWeek()
    }
  }

  const handleDirectorChange = (directorId: string) => {
    setSelectedDirectorId(directorId)
  }

  const handleWeekChange = (weeks: string[]) => {
    setSelectedWeeks(weeks)
  }

  const handleRefresh = async () => {
    setIsLoading(true) // Set loading to true before refetching
    // Refetch quick stats
    const stats = await getQuickStats(selectedWeeks, selectedDirectorId)
    setQuickStats(stats)

    // Optionally refetch other data if needed, e.g., debriefs, overview
    // await fetchDebriefsData(); // Assuming fetchDebriefsData is accessible or can be called here
    // await fetchOverviewData(); // Assuming fetchOverviewData is accessible or can be called here

    setIsLoading(false) // Set loading to false after refetching
  }

  const getWeekLabel = (weekValue: string) => {
    const week = weekSchedule.find((w) => w.value === weekValue)
    return week ? week.label : weekValue
  }

  const getPeriodLabel = () => {
    if (selectedWeeks.length === 0) return "All Weeks"
    if (selectedWeeks.length === 1) return getWeekLabel(selectedWeeks[0])
    // Sort selectedWeeks chronologically to display the range correctly
    const sortedWeeks = [...selectedWeeks].sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
    const firstWeekLabel = getWeekLabel(sortedWeeks[0])
    const lastWeekLabel = getWeekLabel(sortedWeeks[sortedWeeks.length - 1])
    if (sortedWeeks.length === availableWeeks.length) return "Full Semester"
    if (firstWeekLabel === lastWeekLabel) return firstWeekLabel // Should not happen if length > 1
    return `${firstWeekLabel} – ${lastWeekLabel}`
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

  // Redirect to login if not authenticated and not in demo mode
  if (!isDemoMode && !isAuthenticated) {
    // router.push("/login"); // This should ideally be handled by a guard, but for component-level logic:
    return null // Or a loading indicator/message
  }

  // If authenticated but lacks access, redirect
  if (isAuthenticated && role && !canAccessPortal(role, "director")) {
    // router.push(getDefaultPortal(role)); // Again, ideally handled elsewhere
    return null // Or a message indicating lack of access
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      <aside className="fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-52 border-r bg-card z-40">
        <MainNavigation />
      </aside>

      <div className="pl-52 pt-14">
        <div className="bg-gradient-to-r from-[#112250] via-[#1a2d52] to-[#112250] mx-4 mt-4 rounded-2xl p-8 text-white shadow-xl border border-[#3C507D]/30">
          {/* Main Welcome Section */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Left Side - Welcome Message */}
            <div className="flex items-start gap-5">
              {/* Avatar with gold ring */}
              <div className="relative">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[#E0C58F] to-[#d0b57f] flex items-center justify-center text-2xl font-bold text-[#112250] shadow-lg">
                  {getInitials()}
                </div>
                <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 border-2 border-[#112250] flex items-center justify-center">
                  <CheckCircle2 className="h-3 w-3 text-white" />
                </div>
              </div>

              {/* Welcome Text */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl lg:text-4xl font-bold text-[#F5F0E9] tracking-tight">
                    Welcome{getDisplayName() ? ` ${getDisplayName()}` : ""}!
                  </h1>
                  <Badge className="bg-[#E0C58F]/20 text-[#E0C58F] border-[#E0C58F]/30 text-xs font-medium">
                    {role === "admin" ? "Admin" : "Director"}
                  </Badge>
                </div>
                <p className="text-xl lg:text-2xl text-[#9aacba] font-medium">
                  Here's what happened at <span className="text-[#E0C58F] font-semibold">SEED</span>{" "}
                  <span className="relative inline-block">
                    <span className="text-white font-bold underline decoration-[#E0C58F] decoration-2 underline-offset-4">
                      this week
                    </span>
                  </span>
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <Badge className="bg-[#3C507D] text-[#F5F0E9] border-[#3C507D] text-sm font-semibold px-3 py-1">
                    Week {(() => {
                      const now = new Date()
                      const start = new Date(now.getFullYear(), 0, 1)
                      const diff = now.getTime() - start.getTime()
                      const oneWeek = 1000 * 60 * 60 * 24 * 7
                      return Math.ceil(diff / oneWeek)
                    })()}
                  </Badge>
                  <span className="text-[#E0C58F] font-medium text-sm">
                    {(() => {
                      const now = new Date()
                      const dayOfWeek = now.getDay()
                      const monday = new Date(now)
                      // Calculate Monday of the current week
                      monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
                      const sunday = new Date(monday)
                      sunday.setDate(monday.getDate() + 6)
                      const formatDate = (date: Date) =>
                        date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
                      return `${formatDate(monday)} – ${formatDate(sunday)}, ${now.getFullYear()}`
                    })()}
                  </span>
                </div>
                <p className="text-sm text-[#6b7a8a]">
                  {getRoleTitle()} • {getPeriodLabel()}
                </p>
              </div>
            </div>

            {/* Right Side - Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {(isDemoMode || role === "admin") && directors.length > 0 && (
                <Select value={selectedDirectorId} onValueChange={handleDirectorChange}>
                  <SelectTrigger className="w-[200px] bg-[#1a2d52] border-[#3C507D] text-[#F5F0E9] hover:bg-[#3C507D] transition-colors">
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

              {/* Quick Stats Preview */}
              <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-[#1a2d52] border border-[#3C507D]/50">
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#E0C58F]">{quickStats.activeStudents}</p>
                  <p className="text-xs text-[#6b7a8a]">Students</p>
                </div>
                <div className="w-px h-8 bg-[#3C507D]" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#E0C58F]">{quickStats.debriefsSubmitted}</p>
                  <p className="text-xs text-[#6b7a8a]">Debriefs</p>
                </div>
                <div className="w-px h-8 bg-[#3C507D]" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#E0C58F]">{quickStats.totalHours}</p>
                  <p className="text-xs text-[#6b7a8a]">Hours</p>
                </div>
              </div>
            </div>
          </div>

          {/* Urgent Items Banner (if any) */}
          {overviewData.urgentItems.length > 0 && (
            <div className="mt-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <Bell className="h-5 w-5 text-amber-400 shrink-0" />
              <p className="text-sm text-amber-200">
                <span className="font-semibold">
                  {overviewData.urgentItems.length} item{overviewData.urgentItems.length > 1 ? "s" : ""} need
                  {overviewData.urgentItems.length === 1 ? "s" : ""} your attention:
                </span>{" "}
                {overviewData.urgentItems.map((item) => item.message).join(" • ")}
              </p>
            </div>
          )}
        </div>
        {/* End of redesigned header */}

        <DashboardHeader
          selectedWeeks={selectedWeeks}
          onWeeksChange={handleWeekChange}
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
              <div className="flex gap-4 items-stretch">
                {/* Left side: Attendance password + 3 compact summary cards */}
                <div className="flex flex-col gap-3">
                  <div
                    className="flex items-center justify-between px-4 py-3 rounded-xl shadow-sm"
                    style={{
                      background: "linear-gradient(135deg, #878568 0%, #6A6352 100%)",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-white/20">
                        <KeyRound className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-white/80 font-medium">This week's attendance password</p>
                        <p className="text-lg font-bold text-white tracking-wider">
                          {attendancePassword || "Loading..."}
                        </p>
                      </div>
                    </div>
                    <a
                      href="/class-course?tab=attendance"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors text-white text-sm font-medium"
                    >
                      <span>Open Attendance</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>

                  {/* 3 Summary Cards Row */}
                  <div className="flex gap-3 items-start">
                    {/* Hours Logged Card */}
                    <Card
                      className="group w-[160px] bg-white border border-gray-200 shadow-sm cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                      onClick={() => setHoursDialogOpen(true)}
                    >
                      <CardContent className="p-2.5">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-700 font-semibold">Total hours</p>
                          <Clock className="h-4 w-4" style={{ color: "#878568" }} />
                        </div>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{quickStats.totalHours}</p>
                        <div className="mt-1.5 space-y-0.5 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Target</span>
                            <span className="text-gray-700 font-medium">
                              {overviewData.weeklyProgress.hoursTarget || 0}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Remaining</span>
                            <span className="font-medium" style={{ color: "#878568" }}>
                              {Math.max(0, (overviewData.weeklyProgress.hoursTarget || 0) - quickStats.totalHours)}
                            </span>
                          </div>
                        </div>
                        <div className="mt-1.5 h-0.5 w-8 rounded-full" style={{ backgroundColor: "#878568" }} />
                      </CardContent>
                    </Card>

                    {/* Debriefs Card */}
                    <Card
                      className="group w-[160px] bg-white border border-gray-200 shadow-sm cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                      onClick={() => setDebriefsDialogOpen(true)}
                    >
                      <CardContent className="p-2.5">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-700 font-semibold">Debriefs</p>
                          <FileText className="h-4 w-4" style={{ color: "#6A6352" }} />
                        </div>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-3xl font-bold text-gray-900">{quickStats.debriefsSubmitted}</span>
                          <span className="text-lg text-gray-400">
                            /{overviewData.weeklyProgress.debriefsExpected || quickStats.totalStudents || 0}
                          </span>
                        </div>
                        <div className="mt-1.5 space-y-0.5 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Submitted</span>
                            <span className="text-gray-700 font-medium">{quickStats.debriefsSubmitted}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Missing</span>
                            <span className="text-red-500 font-medium">
                              {Math.max(
                                0,
                                (overviewData.weeklyProgress.debriefsExpected || quickStats.totalStudents || 0) -
                                  quickStats.debriefsSubmitted,
                              )}
                            </span>
                          </div>
                        </div>
                        <div className="mt-1.5 h-0.5 w-8 rounded-full" style={{ backgroundColor: "#6A6352" }} />
                      </CardContent>
                    </Card>

                    {/* Attendance Card */}
                    <Card
                      className="group w-[160px] bg-white border border-gray-200 shadow-sm cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                      onClick={() => setAttendanceDialogOpen(true)}
                    >
                      <CardContent className="p-2.5">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-700 font-semibold">Attendance</p>
                          <Users className="h-4 w-4" style={{ color: "#505143" }} />
                        </div>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-3xl font-bold text-gray-900">
                            {overviewData.attendanceSummary.present}
                          </span>
                          <span className="text-lg text-gray-400">
                            /{quickStats.totalStudents || quickStats.activeStudents || 0}
                          </span>
                        </div>
                        <div className="mt-1.5 space-y-0.5 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Present</span>
                            <span className="text-gray-700 font-medium">{overviewData.attendanceSummary.present}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Absent</span>
                            <span className="text-red-500 font-medium">
                              {Math.max(
                                0,
                                (quickStats.totalStudents || quickStats.activeStudents || 0) -
                                  overviewData.attendanceSummary.present,
                              )}
                            </span>
                          </div>
                        </div>
                        <div className="mt-1.5 h-0.5 w-8 rounded-full" style={{ backgroundColor: "#505143" }} />
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Right side: Recent Activity - takes remaining space */}
                <Card className="flex-1 bg-white border border-gray-200 shadow-sm flex flex-col">
                  <CardContent className="pt-1 pb-2 px-2 flex flex-col flex-1 h-full">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4" style={{ color: "#878568" }} />
                        <p className="text-base text-gray-800 font-bold">Recent Activity</p>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        {overviewData.notifications.length} updates
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-1">
                      {overviewData.notifications.length > 0 ? (
                        overviewData.notifications.slice(0, 15).map((notification, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-2 p-2 rounded-lg transition-colors hover:bg-gray-50"
                          >
                            <div
                              className="h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: notification.type === "alert" ? "#fee2e2" : "#f3f4f6" }}
                            >
                              {notification.type === "debrief" && (
                                <FileText className="h-3.5 w-3.5" style={{ color: "#6A6352" }} />
                              )}
                              {notification.type === "session" && (
                                <Calendar className="h-3.5 w-3.5" style={{ color: "#878568" }} />
                              )}
                              {notification.type === "alert" && <AlertCircle className="h-3.5 w-3.5 text-red-500" />}
                              {!["debrief", "session", "alert"].includes(notification.type) && (
                                <Bell className="h-3.5 w-3.5" style={{ color: "#505143" }} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-800 leading-tight">{notification.title}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{notification.time}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                          <Bell className="h-6 w-6 mb-1 opacity-50" />
                          <p className="text-xs">No recent activity</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Two Column Layout: Clinic Health & Quick Actions */}
              <div className="grid gap-6 lg:grid-cols-3 items-stretch">
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
                                  {quickStats.totalHours} / {overviewData.weeklyProgress.hoursTarget || "—"}
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
                <div className="h-full">
                  <Card className="h-full border-l-4 border-l-[#6A6352] flex flex-col">
                    <CardHeader className="pb-2 bg-gradient-to-r from-[#F5F0E9] to-white rounded-t-lg">
                      <CardTitle className="text-lg font-bold text-[#505143]">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 pt-3 flex-1 flex flex-col justify-start">
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-2 bg-[#FEF3E7] hover:bg-[#FDE8D3] border-[#E8D5C4] text-[#6A6352] font-medium"
                        onClick={() => router.push("/debriefs")}
                      >
                        <FileText className="h-4 w-4 text-[#C17F59]" />
                        Review Debriefs
                        {debriefsData.pending > 0 && (
                          <Badge className="ml-auto bg-[#C17F59] text-white hover:bg-[#A66B47]">
                            {debriefsData.pending}
                          </Badge>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-2 bg-[#EEF4EE] hover:bg-[#E0EBE0] border-[#C5D5C5] text-[#505143] font-medium"
                        onClick={() => router.push("/class-course?tab=agenda")}
                      >
                        <Calendar className="h-4 w-4 text-[#6B8E6B]" />
                        View Schedule
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-2 bg-[#F0EDE8] hover:bg-[#E5E0D8] border-[#D5CCAB] text-[#6A6352] font-medium"
                        onClick={() => router.push("/client-engagements")}
                      >
                        <Briefcase className="h-4 w-4 text-[#8B7355]" />
                        Client Engagements
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-2 bg-[#EDF1F5] hover:bg-[#DEE5ED] border-[#C5D0DC] text-[#4A5568] font-medium"
                        onClick={() => router.push("/roster")}
                      >
                        <Users className="h-4 w-4 text-[#5A7A9A]" />
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
                    selectedClinic={selectedDirectorId} // This prop might need adjustment based on its usage in WeeklyProgramSummary
                    selectedWeeks={selectedWeeks}
                    directorId={selectedDirectorId} // This prop might need adjustment based on its usage in WeeklyProgramSummary
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

      {/* Dialogs for detailed views */}
      <Dialog open={hoursDialogOpen} onOpenChange={setHoursDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-600">
              <Clock className="h-5 w-5" />
              Hours Logged Details
            </DialogTitle>
            <DialogDescription>Breakdown of hours logged this week</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-blue-50 text-center">
                <p className="text-3xl font-bold text-blue-600">{quickStats.totalHours}</p>
                <p className="text-sm text-muted-foreground">Total Hours</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 text-center">
                <p className="text-3xl font-bold text-slate-600">{overviewData.weeklyProgress.hoursTarget || 0}</p>
                <p className="text-sm text-muted-foreground">Target Hours</p>
              </div>
              <div className="p-4 rounded-lg bg-emerald-50 text-center">
                <p className="text-3xl font-bold text-emerald-600">
                  {overviewData.weeklyProgress.hoursTarget > 0
                    ? Math.round((quickStats.totalHours / overviewData.weeklyProgress.hoursTarget) * 100)
                    : 0}
                  %
                </p>
                <p className="text-sm text-muted-foreground">Progress</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Weekly Progress</span>
                <span className="font-medium">
                  {quickStats.totalHours} / {overviewData.weeklyProgress.hoursTarget || 0} hours
                </span>
              </div>
              <Progress
                value={
                  overviewData.weeklyProgress.hoursTarget > 0
                    ? Math.min((quickStats.totalHours / overviewData.weeklyProgress.hoursTarget) * 100, 100)
                    : 0
                }
                className="h-3"
              />
            </div>

            {/* Student Hours List */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Hours by Student</h4>
              <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
                {debriefsData.recentDebriefs.length > 0 ? (
                  debriefsData.recentDebriefs.map((debrief: any, index: number) => (
                    <div key={debrief.id || index} className="flex items-center justify-between p-3 hover:bg-slate-50">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-600">
                          {(debrief.studentName || debrief.student_name || "S").charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {debrief.studentName || debrief.student_name || "Student"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {debrief.clientName || debrief.client_name || "Client"}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                        {debrief.hours || debrief.total_hours || 0} hrs
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="p-4 text-sm text-muted-foreground text-center">No hours data available</p>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={debriefsDialogOpen} onOpenChange={setDebriefsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <FileText className="h-5 w-5" />
              Debrief Submissions
            </DialogTitle>
            <DialogDescription>Students who have and haven't submitted debriefs this week</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-emerald-50 text-center">
                <p className="text-3xl font-bold text-emerald-600">{quickStats.debriefsSubmitted}</p>
                <p className="text-sm text-muted-foreground">Submitted</p>
              </div>
              <div className="p-4 rounded-lg bg-red-50 text-center">
                <p className="text-3xl font-bold text-red-600">
                  {Math.max(
                    0,
                    (overviewData.weeklyProgress.debriefsExpected || quickStats.totalStudents || 0) -
                      quickStats.debriefsSubmitted,
                  )}
                </p>
                <p className="text-sm text-muted-foreground">Missing</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 text-center">
                <p className="text-3xl font-bold text-slate-600">
                  {overviewData.weeklyProgress.debriefsExpected || quickStats.totalStudents || 0}
                </p>
                <p className="text-sm text-muted-foreground">Expected Total</p>
              </div>
            </div>

            {/* Submitted List */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Submitted ({quickStats.debriefsSubmitted})
              </h4>
              <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                {debriefsData.recentDebriefs.length > 0 ? (
                  debriefsData.recentDebriefs.map((debrief: any, index: number) => (
                    <div key={debrief.id || index} className="flex items-center justify-between p-3 hover:bg-slate-50">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {debrief.studentName || debrief.student_name || "Student"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {debrief.clientName || debrief.client_name || "Client"}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {debrief.submittedAt || debrief.submitted_at
                          ? new Date(debrief.submittedAt || debrief.submitted_at).toLocaleDateString()
                          : "Recently"}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="p-4 text-sm text-muted-foreground text-center">No submissions yet</p>
                )}
              </div>
            </div>

            {/* Missing List */}
            {(() => {
              const expected = overviewData.weeklyProgress.debriefsExpected || quickStats.totalStudents || 0
              const missing = Math.max(0, expected - quickStats.debriefsSubmitted)
              if (missing === 0) return null
              return (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    Not Submitted ({missing})
                  </h4>
                  <div className="border border-red-200 rounded-lg bg-red-50/50 p-4">
                    <p className="text-sm text-red-700">
                      {missing} student{missing > 1 ? "s have" : " has"} not yet submitted a debrief this week.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 text-red-600 border-red-200 hover:bg-red-100 bg-transparent"
                    >
                      Send Reminder
                    </Button>
                  </div>
                </div>
              )
            })()}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={attendanceDialogOpen} onOpenChange={setAttendanceDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-violet-600">
              <Users className="h-5 w-5" />
              Student Attendance
            </DialogTitle>
            <DialogDescription>Attendance breakdown for this week</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-emerald-50 text-center">
                <p className="text-3xl font-bold text-emerald-600">{overviewData.attendanceSummary.present}</p>
                <p className="text-sm text-muted-foreground">Present</p>
              </div>
              <div className="p-4 rounded-lg bg-red-50 text-center">
                <p className="text-3xl font-bold text-red-600">
                  {Math.max(
                    0,
                    (quickStats.totalStudents || quickStats.activeStudents || 0) -
                      overviewData.attendanceSummary.present,
                  )}
                </p>
                <p className="text-sm text-muted-foreground">Absent</p>
              </div>
              <div className="p-4 rounded-lg bg-violet-50 text-center">
                <p className="text-3xl font-bold text-violet-600">{overviewData.attendanceSummary.rate}%</p>
                <p className="text-sm text-muted-foreground">Attendance Rate</p>
              </div>
            </div>

            {/* Attendance Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Attendance Rate</span>
                <span className="font-medium">
                  {overviewData.attendanceSummary.present} /{" "}
                  {quickStats.totalStudents || quickStats.activeStudents || 0} students
                </span>
              </div>
              <Progress value={overviewData.attendanceSummary.rate} className="h-3" />
            </div>

            {/* Present Students */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Present Students ({overviewData.attendanceSummary.present})
              </h4>
              <div className="border rounded-lg divide-y max-h-40 overflow-y-auto">
                {debriefsData.recentDebriefs.length > 0 ? (
                  debriefsData.recentDebriefs
                    .slice(0, overviewData.attendanceSummary.present)
                    .map((debrief: any, index: number) => (
                      <div
                        key={debrief.id || index}
                        className="flex items-center justify-between p-3 hover:bg-slate-50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {debrief.studentName || debrief.student_name || "Student"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {debrief.clientName || debrief.client_name || "Client"}
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                          Present
                        </Badge>
                      </div>
                    ))
                ) : (
                  <p className="p-4 text-sm text-muted-foreground text-center">No attendance data available</p>
                )}
              </div>
            </div>

            {/* Absent Students */}
            {(() => {
              const total = quickStats.totalStudents || quickStats.activeStudents || 0
              const absent = Math.max(0, total - overviewData.attendanceSummary.present)
              if (absent === 0) return null
              return (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    Absent Students ({absent})
                  </h4>
                  <div className="border border-red-200 rounded-lg bg-red-50/50 p-4">
                    <p className="text-sm text-red-700">
                      {absent} student{absent > 1 ? "s were" : " was"} absent this week.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 text-red-600 border-red-200 hover:bg-red-100 bg-transparent"
                    >
                      View Absent Students
                    </Button>
                  </div>
                </div>
              )
            })()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
