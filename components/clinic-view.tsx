"use client"

import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Users,
  Building2,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Mail,
  Briefcase,
  GraduationCap,
  MessageSquare,
  BarChart3,
  ExternalLink,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import DocumentUpload from "@/components/shared/DocumentUpload"
import { useRouter } from "next/navigation"
import { useCurrentSemester } from "@/hooks/use-current-semester"

interface WeekScheduleInfo {
  weekStart: string
  weekEnd: string
}

interface ClinicViewProps {
  selectedClinic: string
  selectedWeeks: string[]
  weekSchedule?: WeekScheduleInfo[]
}

interface CompleteMapping {
  student_id: string
  student_name: string
  student_email: string
  student_clinic_id: string | null
  student_clinic_name: string | null
  client_id: string | null
  client_name: string | null
  student_role: string | null
  clinic_director_id: string | null
  clinic_director_name: string | null
  clinic_director_email: string | null
  client_director_id: string | null
  client_director_name: string | null
  client_director_email: string | null
  semester: string | null
  semester_id: string | null // Added semester_id to CompleteMapping
}

interface ClinicData {
  clinic: string
  students: CompleteMapping[]
  directors: string[]
  clients: string[]
  semester: string
}

interface ScheduleWeek {
  id: string
  week_number: number
  week_label: string
  week_start: string
  week_end: string
  session_focus: string
  assignments: any
  is_break: boolean
  semester_id: string | null // Added semester_id to ScheduleWeek
}

interface CourseMaterial {
  id: string
  title: string
  description: string
  file_url: string
  file_type: string
  category: string
  uploaded_by: string
  created_at: string
}

export default function ClinicView({ selectedClinic, selectedWeeks, weekSchedule = [] }: ClinicViewProps) {
  const [clinicData, setClinicData] = useState<ClinicData | null>(null)
  const [schedule, setSchedule] = useState<ScheduleWeek[]>([])
  const [materials, setMaterials] = useState<CourseMaterial[]>([])
  const [debriefs, setDebriefs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { semesterId } = useCurrentSemester()
  const [activeSubTab, setActiveSubTab] = useState("overview")
  const [expandedCard, setExpandedCard] = useState<string | null>(null)
  const [expandedClient, setExpandedClient] = useState<string | null>(null)
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null)
  const [expandedDebrief, setExpandedDebrief] = useState<string | null>(null)

  const supabase = createClient()
  const router = useRouter()

  const normalizeDate = (dateStr: string): string => {
    if (!dateStr) return ""
    try {
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return dateStr
      return date.toISOString().split("T")[0]
    } catch {
      return dateStr
    }
  }

  const matchesSelectedWeek = (weekEnding: string, selectedWeekValues: string[]): boolean => {
    if (selectedWeekValues.length === 0) return true
    if (!weekEnding) return false

    // Range-based matching: selectedWeekValues are week_start dates
    // We check if weekEnding falls within the week's date range
    return selectedWeekValues.some((weekStartValue) => {
      // Use schedule data if available for precise range
      const scheduleEntry = weekSchedule.find((s) => s.weekStart === weekStartValue)
      if (scheduleEntry) {
        const start = new Date(scheduleEntry.weekStart)
        const end = new Date(scheduleEntry.weekEnd)
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)
        const debriefDate = new Date(weekEnding)
        return debriefDate >= start && debriefDate <= end
      }
      // Fallback: assume 7-day week from start
      const start = new Date(weekStartValue)
      const end = new Date(weekStartValue)
      end.setDate(end.getDate() + 6)
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
      const debriefDate = new Date(weekEnding)
      return debriefDate >= start && debriefDate <= end
    })
  }

  useEffect(() => {
    fetchClinicData()
  }, [selectedClinic, selectedWeeks])

  const fetchClinicData = async () => {
    setLoading(true)
    try {
      const isValidUUID = Boolean(
        selectedClinic &&
          selectedClinic !== "all" &&
          typeof selectedClinic === "string" &&
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selectedClinic),
      )

      // API uses current semester by default
      const mappingUrl = `/api/supabase/v-complete-mapping`
      const mappingRes = await fetch(mappingUrl)
      let mappingData: CompleteMapping[] = []

      if (mappingRes.ok) {
        const result = await mappingRes.json()
        // Handle different response formats
        mappingData = result.data || result.records || result.mappings || result || []
      }

      let filteredStudents: CompleteMapping[] = []

      if (mappingData && mappingData.length > 0) {
        if (!isValidUUID) {
          filteredStudents = mappingData as CompleteMapping[]
        } else {
          filteredStudents = mappingData.filter((s: CompleteMapping) => {
            const matchesClinicDirector = s.clinic_director_id === selectedClinic
            const matchesClientDirector = s.client_director_id === selectedClinic
            return matchesClinicDirector || matchesClientDirector
          })
        }
      }

      const directorsSet = new Set<string>()
      const clientsSet = new Set<string>()
      let clinicName = "All Clinics"

      filteredStudents.forEach((s) => {
        if (s.clinic_director_name) directorsSet.add(s.clinic_director_name)
        if (s.client_director_name) directorsSet.add(s.client_director_name)
        if (s.client_name) clientsSet.add(s.client_name)
        if (s.student_clinic_name && clinicName === "All Clinics") {
          clinicName = s.student_clinic_name
        }
      })

      setClinicData({
        clinic: clinicName,
        students: filteredStudents,
        directors: Array.from(directorsSet),
        clients: Array.from(clientsSet),
        semester: filteredStudents[0]?.semester || "Spring 2026",
      })

      const debriefsRes = await fetch("/api/supabase/debriefs")
      if (debriefsRes.ok) {
        const debriefsData = await debriefsRes.json()
        setDebriefs(debriefsData.debriefs || [])
      }

      const { data: scheduleData } = await supabase
        .from("semester_schedule_current")
        .select("*")
        .order("week_number", { ascending: true })

      if (scheduleData) {
        setSchedule(scheduleData)
      }

      const { data: materialsData } = await supabase
        .from("course_materials")
        .select("*")
        .order("created_at", { ascending: false })

      if (materialsData) {
        setMaterials(materialsData)
      }
    } catch (error) {
      console.error("Error fetching clinic data:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMaterials = async () => {
    const { data: materialsData } = await supabase
      .from("course_materials")
      .select("*")
      .order("created_at", { ascending: false })

    if (materialsData) {
      setMaterials(materialsData)
    }
  }

  const filteredDebriefs = useMemo(() => {
    if (!clinicData || !debriefs.length) return []

    const studentIds = new Set(clinicData.students.map((s) => s.student_id))

    return debriefs.filter((d) => {
      const studentId = d.student_id || d.studentId
      return studentIds.has(studentId)
    })
  }, [clinicData, debriefs])

  const activityMetrics = useMemo(() => {
    if (!filteredDebriefs.length) {
      return {
        totalHours: 0,
        activeStudents: 0,
        debriefsSubmitted: 0,
        submittedStudentIds: new Set<string>(),
      }
    }

    const weekFilteredDebriefs = filteredDebriefs.filter((d) =>
      matchesSelectedWeek(d.week_ending || d.weekEnding, selectedWeeks),
    )

    let totalHours = 0
    const activeStudentIds = new Set<string>()
    const submittedStudentIds = new Set<string>()

    weekFilteredDebriefs.forEach((d) => {
      const hours = Number.parseFloat(d.hours_worked || d.hoursWorked || "0")
      totalHours += hours
      const studentId = d.student_id || d.studentId
      if (studentId) {
        activeStudentIds.add(studentId)
        submittedStudentIds.add(studentId)
      }
    })

    return {
      totalHours: Math.round(totalHours * 10) / 10,
      activeStudents: activeStudentIds.size,
      debriefsSubmitted: weekFilteredDebriefs.length,
      submittedStudentIds,
    }
  }, [filteredDebriefs, selectedWeeks])

  const weeklyBreakdown = useMemo(() => {
    if (!clinicData || !filteredDebriefs.length) return []

    const studentIds = new Set(clinicData.students.map((s) => s.student_id))
    const breakdown: { week: string; hours: number; submissions: number; students: number }[] = []

    const weekMap = new Map<string, { hours: number; submissions: number; studentSet: Set<string> }>()

    filteredDebriefs.forEach((debrief: any) => {
      const studentId = debrief.studentId || debrief.student_id
      if (!studentIds.has(studentId) && studentIds.size > 0) return

      const weekEnding = debrief.weekEnding || debrief.week_ending || ""
      if (!weekEnding) return

      const hours = Number.parseFloat(debrief.hoursWorked || debrief.hours_worked || "0")

      if (!weekMap.has(weekEnding)) {
        weekMap.set(weekEnding, { hours: 0, submissions: 0, studentSet: new Set() })
      }

      const weekData = weekMap.get(weekEnding)!
      weekData.hours += hours
      weekData.submissions++
      if (studentId) weekData.studentSet.add(studentId)
    })

    weekMap.forEach((data, week) => {
      breakdown.push({
        week,
        hours: data.hours,
        submissions: data.submissions,
        students: data.studentSet.size,
      })
    })

    return breakdown.sort((a, b) => new Date(b.week).getTime() - new Date(a.week).getTime()).slice(0, 8)
  }, [clinicData, filteredDebriefs])

  const studentPerformance = useMemo(() => {
    if (!clinicData || !filteredDebriefs.length) return []

    const studentMetrics = new Map<
      string,
      { name: string; email: string; client: string; totalHours: number; submissions: number; lastSubmission: string }
    >()

    clinicData.students.forEach((s) => {
      studentMetrics.set(s.student_id, {
        name: s.student_name,
        email: s.student_email,
        client: s.client_name || "Unassigned",
        totalHours: 0,
        submissions: 0,
        lastSubmission: "",
      })
    })

    filteredDebriefs.forEach((debrief: any) => {
      const studentId = debrief.studentId || debrief.student_id
      if (!studentMetrics.has(studentId)) return

      const weekEnding = debrief.weekEnding || debrief.week_ending || ""
      if (!matchesSelectedWeek(weekEnding, selectedWeeks)) return

      const hours = Number.parseFloat(debrief.hoursWorked || debrief.hours_worked || "0")
      const metrics = studentMetrics.get(studentId)!
      metrics.totalHours += hours
      metrics.submissions++
      if (!metrics.lastSubmission || weekEnding > metrics.lastSubmission) {
        metrics.lastSubmission = weekEnding
      }
    })

    return Array.from(studentMetrics.values())
      .filter((s) => s.submissions > 0)
      .sort((a, b) => b.totalHours - a.totalHours)
  }, [clinicData, filteredDebriefs, selectedWeeks])

  const clientTeams = useMemo(() => {
    if (!clinicData) return []

    const clientMap = new Map<
      string,
      { id: string | null; name: string; students: CompleteMapping[]; totalHours: number }
    >()

    clinicData.students.forEach((s) => {
      if (!s.client_name) return

      if (!clientMap.has(s.client_name)) {
        clientMap.set(s.client_name, { id: s.client_id, name: s.client_name, students: [], totalHours: 0 })
      }

      clientMap.get(s.client_name)!.students.push(s)
    })

    filteredDebriefs.forEach((debrief: any) => {
      const clientName = debrief.clientName || debrief.client_name
      if (!clientName || !clientMap.has(clientName)) return

      const weekEnding = debrief.weekEnding || debrief.week_ending || ""
      if (!matchesSelectedWeek(weekEnding, selectedWeeks)) return

      const hours = Number.parseFloat(debrief.hoursWorked || debrief.hours_worked || "0")
      clientMap.get(clientName)!.totalHours += hours
    })

    return Array.from(clientMap.values()).sort((a, b) => b.students.length - a.students.length)
  }, [clinicData, filteredDebriefs, selectedWeeks])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0077B6]" />
      </div>
    )
  }

  if (!clinicData) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">No clinic data available</p>
        </CardContent>
      </Card>
    )
  }

  const avgHoursPerStudent =
    activityMetrics.activeStudents > 0 ? (activityMetrics.totalHours / activityMetrics.activeStudents).toFixed(1) : "0"

  const getStudentDetails = (studentId: string) => {
    const student = clinicData.students.find((s) => s.student_id === studentId)
    const studentDebriefs = filteredDebriefs.filter((d) => (d.studentId || d.student_id) === studentId)
    const totalHours = studentDebriefs.reduce((sum, d) => {
      return sum + Number.parseFloat(d.hoursWorked || d.hours_worked || "0")
    }, 0)
    const lastDebrief = studentDebriefs.sort(
      (a, b) =>
        new Date(b.week_ending || b.weekEnding || 0).getTime() - new Date(a.week_ending || a.weekEnding || 0).getTime(),
    )[0]
    return { student, debriefs: studentDebriefs, totalHours, lastDebrief }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Collapsible
          open={expandedCard === "students"}
          onOpenChange={(open) => setExpandedCard(open ? "students" : null)}
        >
          <CollapsibleTrigger asChild>
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-2xl font-bold text-blue-700">{clinicData.students.length}</p>
                    <p className="text-xs text-blue-600">Total Students</p>
                  </div>
                  {expandedCard === "students" ? (
                    <ChevronUp className="h-4 w-4 text-blue-600" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-blue-600" />
                  )}
                </div>
              </CardContent>
            </Card>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <Card className="border-blue-200">
              <CardHeader className="py-3">
                <CardTitle className="text-sm">All Students ({clinicData.students.length})</CardTitle>
              </CardHeader>
              <CardContent className="max-h-64 overflow-y-auto">
                <div className="space-y-2">
                  {clinicData.students.map((student) => {
                    const { totalHours, debriefs: studentDebriefs } = getStudentDetails(student.student_id)
                    const hasSubmitted = activityMetrics.submittedStudentIds.has(student.student_id)
                    return (
                      <div
                        key={student.student_id}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className={`h-8 w-8 ${hasSubmitted ? "ring-2 ring-green-500" : ""}`}>
                            <AvatarFallback className="text-xs">
                              {student.student_name
                                ?.split(" ")
                                .map((n) => n[0])
                                .join("") || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{student.student_name}</p>
                            <p className="text-xs text-muted-foreground">{student.client_name || "Unassigned"}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">{totalHours.toFixed(1)}h</p>
                          <p className="text-xs text-muted-foreground">{studentDebriefs.length} debriefs</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        <Collapsible open={expandedCard === "active"} onOpenChange={(open) => setExpandedCard(open ? "active" : null)}>
          <CollapsibleTrigger asChild>
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-2xl font-bold text-green-700">{activityMetrics.activeStudents}</p>
                    <p className="text-xs text-green-600">Active This Period</p>
                  </div>
                  {expandedCard === "active" ? (
                    <ChevronUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-green-600" />
                  )}
                </div>
              </CardContent>
            </Card>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <Card className="border-green-200">
              <CardHeader className="py-3">
                <CardTitle className="text-sm">Active Students ({activityMetrics.activeStudents})</CardTitle>
              </CardHeader>
              <CardContent className="max-h-64 overflow-y-auto">
                <div className="space-y-2">
                  {clinicData.students
                    .filter((s) => activityMetrics.submittedStudentIds.has(s.student_id))
                    .map((student) => {
                      const { totalHours, lastDebrief } = getStudentDetails(student.student_id)
                      return (
                        <div
                          key={student.student_id}
                          className="flex items-center justify-between p-2 rounded-lg bg-green-50 border border-green-200"
                        >
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8 ring-2 ring-green-500">
                              <AvatarFallback className="text-xs bg-green-100">
                                {student.student_name
                                  ?.split(" ")
                                  .map((n) => n[0])
                                  .join("") || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{student.student_name}</p>
                              <p className="text-xs text-muted-foreground">{student.client_name || "Unassigned"}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-green-700">{totalHours.toFixed(1)}h</p>
                            {lastDebrief && (
                              <p className="text-xs text-muted-foreground">
                                Last: {new Date(lastDebrief.week_ending || lastDebrief.weekEnding).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        <Collapsible open={expandedCard === "hours"} onOpenChange={(open) => setExpandedCard(open ? "hours" : null)}>
          <CollapsibleTrigger asChild>
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-2xl font-bold text-purple-700">{activityMetrics.totalHours.toFixed(1)}</p>
                    <p className="text-xs text-purple-600">Hours Worked ({avgHoursPerStudent}/student)</p>
                  </div>
                  {expandedCard === "hours" ? (
                    <ChevronUp className="h-4 w-4 text-purple-600" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-purple-600" />
                  )}
                </div>
              </CardContent>
            </Card>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <Card className="border-purple-200">
              <CardHeader className="py-3">
                <CardTitle className="text-sm">Hours by Student</CardTitle>
              </CardHeader>
              <CardContent className="max-h-64 overflow-y-auto">
                <div className="space-y-2">
                  {studentPerformance.map((student, idx) => (
                    <div key={student.email} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                      <span className="text-sm font-bold text-muted-foreground w-6">#{idx + 1}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{student.name}</p>
                        <p className="text-xs text-muted-foreground">{student.client}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-purple-700">{student.totalHours.toFixed(1)}h</p>
                      </div>
                    </div>
                  ))}
                  {studentPerformance.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No hours recorded</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        <Collapsible
          open={expandedCard === "debriefs"}
          onOpenChange={(open) => setExpandedCard(open ? "debriefs" : null)}
        >
          <CollapsibleTrigger asChild>
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500 rounded-lg">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-2xl font-bold text-orange-700">{activityMetrics.debriefsSubmitted}</p>
                    <p className="text-xs text-orange-600">Debriefs Submitted</p>
                  </div>
                  {expandedCard === "debriefs" ? (
                    <ChevronUp className="h-4 w-4 text-orange-600" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-orange-600" />
                  )}
                </div>
              </CardContent>
            </Card>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <Card className="border-orange-200">
              <CardHeader className="py-3">
                <CardTitle className="text-sm">Recent Debriefs ({activityMetrics.debriefsSubmitted})</CardTitle>
              </CardHeader>
              <CardContent className="max-h-64 overflow-y-auto">
                <div className="space-y-2">
                  {filteredDebriefs
                    .filter((d) => matchesSelectedWeek(d.week_ending || d.weekEnding, selectedWeeks))
                    .sort(
                      (a, b) =>
                        new Date(b.week_ending || b.weekEnding || 0).getTime() -
                        new Date(a.week_ending || a.weekEnding || 0).getTime(),
                    )
                    .slice(0, 20)
                    .map((debrief, idx) => (
                      <div
                        key={`${debrief.id || idx}`}
                        className="p-2 rounded-lg bg-orange-50 border border-orange-200"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">
                              {debrief.student_name || debrief.studentName || "Unknown"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {debrief.client_name || debrief.clientName || "Unknown Client"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-orange-700">
                              {debrief.hours_worked || debrief.hoursWorked || 0}h
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(debrief.week_ending || debrief.weekEnding).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  {activityMetrics.debriefsSubmitted === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No debriefs submitted</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        <Collapsible
          open={expandedCard === "clients"}
          onOpenChange={(open) => setExpandedCard(open ? "clients" : null)}
        >
          <CollapsibleTrigger asChild>
            <Card className="bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200 cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-teal-500 rounded-lg">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-2xl font-bold text-teal-700">{clientTeams.length}</p>
                    <p className="text-xs text-teal-600">Active Clients</p>
                  </div>
                  {expandedCard === "clients" ? (
                    <ChevronUp className="h-4 w-4 text-teal-600" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-teal-600" />
                  )}
                </div>
              </CardContent>
            </Card>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <Card className="border-teal-200">
              <CardHeader className="py-3">
                <CardTitle className="text-sm">Client Teams ({clientTeams.length})</CardTitle>
              </CardHeader>
              <CardContent className="max-h-64 overflow-y-auto">
                <div className="space-y-2">
                  {clientTeams.map((client) => (
                    <div key={client.name} className="p-2 rounded-lg bg-teal-50 border border-teal-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{client.name}</p>
                          <p className="text-xs text-muted-foreground">{client.students.length} team members</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-teal-700">{client.totalHours.toFixed(1)}h</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
      </div>

      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {weeklyBreakdown.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Weekly Activity Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {weeklyBreakdown.slice(0, 6).map((week) => (
                    <div key={week.week} className="flex items-center gap-4">
                      <div className="w-24 text-sm text-muted-foreground">
                        {new Date(week.week).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </div>
                      <div className="flex-1">
                        <div className="h-6 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                            style={{
                              width: `${Math.min((week.hours / Math.max(...weeklyBreakdown.map((w) => w.hours))) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                      <div className="w-20 text-right text-sm font-medium">{week.hours.toFixed(1)}h</div>
                      <div className="w-16 text-right text-xs text-muted-foreground">{week.submissions} debriefs</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Client Teams
              </CardTitle>
              <CardDescription>Click on a client to view full details in Client Engagements</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {clientTeams.map((client) => {
                  const submittedCount = client.students.filter((s) =>
                    activityMetrics.submittedStudentIds.has(s.student_id),
                  ).length

                  return (
                    <Card
                      key={client.name}
                      className="border-l-4 border-l-[#505143] hover:shadow-md transition-all hover:border-l-[#878568] cursor-pointer group"
                      onClick={() => {
                        router.push(`/client-engagements?client=${encodeURIComponent(client.name)}`)
                      }}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-sm truncate flex-1">{client.name}</h4>
                          <ExternalLink className="h-3.5 w-3.5 text-gray-400 group-hover:text-[#505143] transition-colors" />
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="text-center p-1.5 bg-gray-50 rounded">
                            <p className="font-semibold text-gray-700">{client.students.length}</p>
                            <p className="text-gray-500">Members</p>
                          </div>
                          <div className="text-center p-1.5 bg-gray-50 rounded">
                            <p className="font-semibold text-gray-700">{client.totalHours.toFixed(1)}h</p>
                            <p className="text-gray-500">Hours</p>
                          </div>
                          <div className="text-center p-1.5 bg-gray-50 rounded">
                            <p
                              className={`font-semibold ${submittedCount === client.students.length ? "text-green-600" : "text-amber-600"}`}
                            >
                              {submittedCount}/{client.students.length}
                            </p>
                            <p className="text-gray-500">Active</p>
                          </div>
                        </div>

                        <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
                          <div className="flex -space-x-1.5">
                            {client.students.slice(0, 4).map((student) => (
                              <Avatar key={student.student_id} className="h-6 w-6 border-2 border-white">
                                <AvatarFallback className="text-[10px] bg-[#D5CCAB] text-[#505143]">
                                  {student.student_name
                                    ?.split(" ")
                                    .map((n) => n[0])
                                    .join("") || "?"}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                            {client.students.length > 4 && (
                              <Avatar className="h-6 w-6 border-2 border-white">
                                <AvatarFallback className="text-[10px] bg-gray-200 text-gray-600">
                                  +{client.students.length - 4}
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                          <span className="text-[10px] text-[#505143] font-medium group-hover:underline">
                            View Details →
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Student Roster
              </CardTitle>
              <CardDescription>All students in this clinic - click to expand details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {clinicData.students.map((student) => {
                  const hasSubmitted = activityMetrics.submittedStudentIds.has(student.student_id)
                  const { totalHours, debriefs: studentDebriefs, lastDebrief } = getStudentDetails(student.student_id)
                  const isExpanded = expandedStudent === student.student_id

                  return (
                    <Collapsible
                      key={student.student_id}
                      open={isExpanded}
                      onOpenChange={(open) => setExpandedStudent(open ? student.student_id : null)}
                    >
                      <CollapsibleTrigger asChild>
                        <div
                          className={`p-3 rounded-lg border cursor-pointer hover:shadow-md transition-all ${hasSubmitted ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"}`}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className={`h-10 w-10 ${hasSubmitted ? "ring-2 ring-green-500" : ""}`}>
                              <AvatarFallback>
                                {student.student_name
                                  ?.split(" ")
                                  .map((n) => n[0])
                                  .join("") || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{student.student_name}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {student.client_name || "Unassigned"}
                              </p>
                            </div>
                            <div className="text-right flex items-center gap-2">
                              <div>
                                <p className="font-bold text-sm">{totalHours.toFixed(1)}h</p>
                                {hasSubmitted ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto" />
                                ) : (
                                  <AlertCircle className="h-4 w-4 text-orange-500 ml-auto" />
                                )}
                              </div>
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </div>
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="mt-2 p-4 rounded-lg bg-background border space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-muted-foreground">Email</p>
                              <p className="text-sm flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                {student.student_email}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-muted-foreground">Role</p>
                              <p className="text-sm flex items-center gap-2">
                                <Briefcase className="h-4 w-4" />
                                {student.student_role || "Team Member"}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-muted-foreground">Client</p>
                              <p className="text-sm flex items-center gap-2">
                                <Building2 className="h-4 w-4" />
                                {student.client_name || "Unassigned"}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-muted-foreground">Clinic Director</p>
                              <p className="text-sm flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                {student.clinic_director_name || "N/A"}
                              </p>
                            </div>
                          </div>

                          <div className="border-t pt-3">
                            <h6 className="text-sm font-medium mb-2 flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              Activity Summary
                            </h6>
                            <div className="grid grid-cols-3 gap-3 text-center">
                              <div className="p-2 bg-muted rounded-lg">
                                <p className="text-lg font-bold">{totalHours.toFixed(1)}</p>
                                <p className="text-xs text-muted-foreground">Total Hours</p>
                              </div>
                              <div className="p-2 bg-muted rounded-lg">
                                <p className="text-lg font-bold">{studentDebriefs.length}</p>
                                <p className="text-xs text-muted-foreground">Debriefs</p>
                              </div>
                              <div className="p-2 bg-muted rounded-lg">
                                <p className="text-lg font-bold">
                                  {studentDebriefs.length > 0 ? (totalHours / studentDebriefs.length).toFixed(1) : "0"}
                                </p>
                                <p className="text-xs text-muted-foreground">Avg Hours</p>
                              </div>
                            </div>
                          </div>

                          {studentDebriefs.length > 0 && (
                            <div className="border-t pt-3">
                              <h6 className="text-sm font-medium mb-2 flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Recent Debriefs
                              </h6>
                              <div className="space-y-2 max-h-32 overflow-y-auto">
                                {studentDebriefs.slice(0, 5).map((d, idx) => {
                                  const debriefId = d.id || `${student.student_id}-${idx}`
                                  const isDebriefExpanded = expandedDebrief === debriefId
                                  const weekDate = new Date(d.week_ending || d.weekEnding)

                                  return (
                                    <Collapsible
                                      key={debriefId}
                                      open={isDebriefExpanded}
                                      onOpenChange={(open) => setExpandedDebrief(open ? debriefId : null)}
                                    >
                                      <CollapsibleTrigger asChild>
                                        <div className="flex justify-between items-center p-2 bg-muted/50 rounded text-sm cursor-pointer hover:bg-muted transition-colors">
                                          <div className="flex items-center gap-2">
                                            <Calendar className="h-3 w-3 text-muted-foreground" />
                                            <span>{weekDate.toLocaleDateString()}</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <Badge variant="secondary">{d.hours_worked || d.hoursWorked || 0}h</Badge>
                                            <Badge
                                              variant={d.status === "reviewed" ? "default" : "outline"}
                                              className="text-xs"
                                            >
                                              {d.status || "submitted"}
                                            </Badge>
                                            {isDebriefExpanded ? (
                                              <ChevronUp className="h-3 w-3" />
                                            ) : (
                                              <ChevronDown className="h-3 w-3" />
                                            )}
                                          </div>
                                        </div>
                                      </CollapsibleTrigger>
                                      <CollapsibleContent>
                                        <div className="mt-1 p-3 bg-background border rounded-lg space-y-3 text-sm">
                                          {/* Debrief metadata */}
                                          <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div className="flex items-center gap-1">
                                              <Clock className="h-3 w-3 text-muted-foreground" />
                                              <span className="text-muted-foreground">Hours:</span>
                                              <span className="font-medium">
                                                {d.hours_worked || d.hoursWorked || 0}
                                              </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                              <Calendar className="h-3 w-3 text-muted-foreground" />
                                              <span className="text-muted-foreground">Week:</span>
                                              <span className="font-medium">{d.week_number || "N/A"}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                              <Building2 className="h-3 w-3 text-muted-foreground" />
                                              <span className="text-muted-foreground">Client:</span>
                                              <span className="font-medium truncate">
                                                {d.client_name || d.clientName || "N/A"}
                                              </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                              <FileText className="h-3 w-3 text-muted-foreground" />
                                              <span className="text-muted-foreground">Submitted:</span>
                                              <span className="font-medium">
                                                {d.date_submitted
                                                  ? new Date(d.date_submitted).toLocaleDateString()
                                                  : weekDate.toLocaleDateString()}
                                              </span>
                                            </div>
                                          </div>

                                          {/* Work Summary */}
                                          {(d.work_summary || d.workSummary) && (
                                            <div className="space-y-1">
                                              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                                <FileText className="h-3 w-3" />
                                                Work Summary
                                              </p>
                                              <div className="p-2 bg-muted/30 rounded text-xs whitespace-pre-wrap max-h-24 overflow-y-auto">
                                                {d.work_summary || d.workSummary}
                                              </div>
                                            </div>
                                          )}

                                          {/* Questions */}
                                          {d.questions && (
                                            <div className="space-y-1">
                                              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                                <MessageSquare className="h-3 w-3" />
                                                Questions / Notes
                                                {d.question_type && (
                                                  <Badge variant="outline" className="ml-1 text-[10px]">
                                                    {d.question_type}
                                                  </Badge>
                                                )}
                                              </p>
                                              <div className="p-2 bg-blue-50 border border-blue-100 rounded text-xs whitespace-pre-wrap max-h-24 overflow-y-auto">
                                                {d.questions}
                                              </div>
                                            </div>
                                          )}

                                          {/* Review Status */}
                                          {d.reviewed_by && (
                                            <div className="flex items-center gap-2 pt-2 border-t text-xs">
                                              <CheckCircle2 className="h-3 w-3 text-green-500" />
                                              <span className="text-muted-foreground">Reviewed by</span>
                                              <span className="font-medium">{d.reviewed_by}</span>
                                              {d.reviewed_at && (
                                                <span className="text-muted-foreground">
                                                  on {new Date(d.reviewed_at).toLocaleDateString()}
                                                </span>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      </CollapsibleContent>
                                    </Collapsible>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Student Performance Rankings
              </CardTitle>
              <CardDescription>Based on hours worked during selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {studentPerformance.length > 0 ? (
                  studentPerformance.map((student, index) => {
                    const maxHours = studentPerformance[0]?.totalHours || 1
                    return (
                      <div key={student.email} className="flex items-center gap-4">
                        <div className="w-8 text-center font-bold text-muted-foreground">#{index + 1}</div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">{student.name}</span>
                            <span className="text-sm text-muted-foreground">{student.client}</span>
                          </div>
                          <div className="h-4 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all"
                              style={{ width: `${(student.totalHours / maxHours) * 100}%` }}
                            />
                          </div>
                        </div>
                        <div className="w-24 text-right">
                          <p className="font-bold">{student.totalHours.toFixed(1)}h</p>
                          <p className="text-xs text-muted-foreground">{student.submissions} debriefs</p>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No performance data available for selected period
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="materials">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Course Materials
                </CardTitle>
                <CardDescription>Upload and manage course materials</CardDescription>
              </div>
              <DocumentUpload
                clinic={clinicData.clinic}
                onUploadComplete={fetchMaterials}
                compact
                submissionType="course_material"
              />
            </CardHeader>
            <CardContent>
              {materials.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {materials.map((material) => (
                    <div key={material.id} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{material.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{material.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {material.category || "General"}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(material.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          <a href={material.file_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No course materials uploaded yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}


// export default ClinicView // Removed to fix duplicate default export error
