"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Users,
  Clock,
  Building,
  ChevronRight,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  FileText,
  CheckCircle,
  Target,
  Calendar,
  BarChart3,
  User,
} from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ClinicData {
  name: string
  hours: number
  students: number
  clients: number
  weeklyData?: { week: string; hours: number }[]
  color?: string
  debriefsSubmitted: number
  debriefsReviewed: number
  attendanceRate: number
  avgHoursPerStudent: number
  weeklyTrend: number // percentage change from last week
  completionRate: number
}

interface ClientData {
  name: string
  hours: number
  students: string[]
  latestSummary: string
  director: string
  debriefsCount: number
  avgHoursPerWeek: number
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
  clinic_id: string
  clinicName?: string
}

interface ClinicPerformanceProps {
  selectedWeeks: string[]
  selectedClinic: string
  weekSchedule?: WeekSchedule[]
  directorId?: string
}

const CLINIC_COLORS: Record<string, string> = {
  Accounting: "#2d3a4f",
  "Accounting Clinic": "#2d3a4f",
  Marketing: "#8fa889",
  "Marketing Clinic": "#8fa889",
  Consulting: "#565f4b",
  "Consulting Clinic": "#565f4b",
  "Resource Acquisition": "#7c3aed",
  "Resource Clinic": "#7c3aed",
  Resource: "#7c3aed",
  Legal: "#9aacb8",
  SEED: "#3d5a80",
}

export function ClinicPerformance({
  selectedWeeks,
  selectedClinic,
  weekSchedule = [],
  directorId,
}: ClinicPerformanceProps) {
  const [debriefs, setDebriefs] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [directors, setDirectors] = useState<Director[]>([])
  const [attendance, setAttendance] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedView, setExpandedView] = useState(false)
  const [expandedKPI, setExpandedKPI] = useState<string | null>(null)

  const [mounted, setMounted] = useState(false)
  const [clinicData, setClinicData] = useState<ClinicData[]>([])
  const [clientData, setClientData] = useState<ClientData[]>([])
  const [clientToDirectorMap, setClientToDirectorMap] = useState<Map<string, string>>(new Map())

  const [directorStudentIds, setDirectorStudentIds] = useState<Set<string>>(new Set())
  const [directorClientNames, setDirectorClientNames] = useState<Set<string>>(new Set())

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const mappingUrl =
          directorId && directorId !== "all"
            ? `/api/supabase/v-complete-mapping?directorId=${directorId}`
            : "/api/supabase/v-complete-mapping"

        const [debriefsRes, clientsRes, directorsRes, attendanceRes, mappingRes] = await Promise.all([
          fetch("/api/supabase/debriefs"),
          fetch("/api/supabase/clients"),
          fetch("/api/directors"),
          fetch("/api/supabase/attendance"),
          fetch(mappingUrl),
        ])

        if (debriefsRes.ok) {
          const data = await debriefsRes.json()
          setDebriefs(data.debriefs || [])
        }

        if (clientsRes.ok) {
          const data = await clientsRes.json()
          setClients(data.records || [])
        }

        if (directorsRes.ok) {
          const data = await directorsRes.json()
          setDirectors(data.directors || [])
        }

        if (attendanceRes.ok) {
          const data = await attendanceRes.json()
          setAttendance(data.records || data.attendance || [])
        }

        if (mappingRes.ok) {
          const mappingData = await mappingRes.json()
          const mappings = mappingData.data || mappingData.records || mappingData.mappings || []

          const studentIds = new Set<string>()
          const clientNames = new Set<string>()

          // When using directorId filter, all returned records belong to this director
          mappings.forEach((m: any) => {
            if (m.student_id) studentIds.add(m.student_id)
            if (m.client_name) clientNames.add(m.client_name.trim())
          })

          console.log(
            "[v0] ClinicPerformance - Director student IDs:",
            studentIds.size,
            "Client names:",
            clientNames.size,
          )

          setDirectorStudentIds(studentIds)
          setDirectorClientNames(clientNames)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [directorId])

  const directorToClinicMap = new Map<string, string>()
  directors.forEach((director) => {
    if (director.full_name && director.clinicName) {
      directorToClinicMap.set(director.full_name, director.clinicName)
    }
    if (director.id && director.clinicName) {
      directorToClinicMap.set(director.id, director.clinicName)
    }
  })

  const normalizeClinicName = (name: string): string => {
    if (!name) return "Unknown"
    const normalized = name.replace(" Clinic", "").trim()
    if (normalized.toLowerCase().includes("resource")) {
      return "Resource Acquisition"
    }
    return normalized
  }

  const matchesSelectedWeek = (weekEnding: string, selectedWeekValues: string[]): boolean => {
    if (selectedWeekValues.length === 0) return true

    const normalizeDate = (dateStr: string): string => {
      if (!dateStr) return ""
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return dateStr
      return date.toISOString().split("T")[0]
    }

    const normalizedWeekEnding = normalizeDate(weekEnding)

    return selectedWeekValues.some((selectedWeek) => {
      const normalizedSelected = normalizeDate(selectedWeek)
      return normalizedWeekEnding === normalizedSelected
    })
  }

  useEffect(() => {
    if (loading) return

    const clientToClinicMap = new Map<string, string>()

    if (clients.length > 0) {
      clients.forEach((client: any) => {
        const clientName = client.name || client.fields?.["Name"]
        const directorId = client.primary_director_id
        const director = directors.find((d) => d.id === directorId)
        if (clientName && director?.clinicName) {
          clientToClinicMap.set(clientName.trim(), director.clinicName)
        }
      })
    }

    setClientToDirectorMap(clientToClinicMap)

    let filterClinicName = "all"
    if (selectedClinic && selectedClinic !== "all") {
      const isUUID = selectedClinic.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
      if (isUUID) {
        const director = directors.find((d) => d.id === selectedClinic)
        filterClinicName = director?.clinicName || "all"
      } else {
        filterClinicName = directorToClinicMap.get(selectedClinic) || selectedClinic
      }
    }

    const clinicMap = new Map<
      string,
      {
        hours: number
        students: Set<string>
        clients: Set<string>
        debriefsSubmitted: number
        debriefsReviewed: number
        weeklyHours: Map<string, number>
      }
    >()

    const clientMap = new Map<
      string,
      {
        hours: number
        students: Set<string>
        latestSummary: string
        director: string
        debriefsCount: number
        weeklyHours: number[]
      }
    >()

    // Calculate attendance by clinic
    const clinicAttendance = new Map<string, { attended: number; total: number }>()
    attendance.forEach((record: any) => {
      const clinic = normalizeClinicName(record.clinic || "")
      if (!clinicAttendance.has(clinic)) {
        clinicAttendance.set(clinic, { attended: 0, total: 0 })
      }
      const att = clinicAttendance.get(clinic)!
      att.total++
      if (record.status === "present" || record.attended) {
        att.attended++
      }
    })

    debriefs.forEach((debrief: any) => {
      const recordWeek = debrief.weekEnding || debrief.week_ending || ""
      const studentClinic = debrief.clinic || ""
      const clientName = debrief.clientName || debrief.client_name || ""
      const hours = Number.parseFloat(debrief.hoursWorked || debrief.hours_worked || "0")
      const studentName = debrief.studentName || debrief.student_name || ""
      const studentId = debrief.studentId || debrief.student_id || ""
      const summary = debrief.workSummary || debrief.work_summary || ""
      const status = debrief.status || ""

      const normalizedClinic = normalizeClinicName(studentClinic)

      let matchesDirectorFilter = true
      if (directorId && directorId !== "all") {
        // Filter by director's students or clients
        matchesDirectorFilter = directorStudentIds.has(studentId) || directorClientNames.has(clientName?.trim())
      } else if (filterClinicName !== "all") {
        // Fallback to clinic-based filtering
        matchesDirectorFilter =
          normalizedClinic.toLowerCase().includes(filterClinicName.toLowerCase()) ||
          studentClinic.toLowerCase().includes(filterClinicName.toLowerCase())
      }

      const matchesWeek = matchesSelectedWeek(recordWeek, selectedWeeks)

      if (matchesWeek && matchesDirectorFilter) {
        const clinic = normalizedClinic || "Unknown"
        if (!clinicMap.has(clinic)) {
          clinicMap.set(clinic, {
            hours: 0,
            students: new Set(),
            clients: new Set(),
            debriefsSubmitted: 0,
            debriefsReviewed: 0,
            weeklyHours: new Map(),
          })
        }
        const clinicInfo = clinicMap.get(clinic)!
        clinicInfo.hours += hours
        clinicInfo.debriefsSubmitted++
        if (status === "reviewed") {
          clinicInfo.debriefsReviewed++
        }
        if (studentName) clinicInfo.students.add(studentName)
        if (clientName) clinicInfo.clients.add(clientName)

        // Track weekly hours for trend
        const weekKey = recordWeek.split("T")[0]
        clinicInfo.weeklyHours.set(weekKey, (clinicInfo.weeklyHours.get(weekKey) || 0) + hours)

        if (clientName) {
          if (!clientMap.has(clientName)) {
            clientMap.set(clientName, {
              hours: 0,
              students: new Set(),
              latestSummary: "",
              director: clientToClinicMap.get(clientName) || "",
              debriefsCount: 0,
              weeklyHours: [],
            })
          }
          const clientInfo = clientMap.get(clientName)!
          clientInfo.hours += hours
          clientInfo.debriefsCount++
          clientInfo.weeklyHours.push(hours)
          if (studentName) clientInfo.students.add(studentName)
          if (summary && !clientInfo.latestSummary) {
            clientInfo.latestSummary = summary
          }
        }
      }
    })

    const clinicDataArray: ClinicData[] = Array.from(clinicMap.entries())
      .map(([name, info]) => {
        const weeklyHoursArr = Array.from(info.weeklyHours.values())
        const lastWeekHours = weeklyHoursArr[weeklyHoursArr.length - 1] || 0
        const prevWeekHours = weeklyHoursArr[weeklyHoursArr.length - 2] || 0
        const weeklyTrend = prevWeekHours > 0 ? ((lastWeekHours - prevWeekHours) / prevWeekHours) * 100 : 0

        const att = clinicAttendance.get(name) || { attended: 0, total: 0 }
        const attendanceRate = att.total > 0 ? (att.attended / att.total) * 100 : 0

        const avgHoursPerStudent = info.students.size > 0 ? info.hours / info.students.size : 0
        const completionRate = info.debriefsSubmitted > 0 ? (info.debriefsReviewed / info.debriefsSubmitted) * 100 : 0

        return {
          name,
          hours: Math.round(info.hours * 10) / 10,
          students: info.students.size,
          clients: info.clients.size,
          color: CLINIC_COLORS[name] || CLINIC_COLORS[name + " Clinic"] || "#6b7280",
          debriefsSubmitted: info.debriefsSubmitted,
          debriefsReviewed: info.debriefsReviewed,
          attendanceRate: Math.round(attendanceRate),
          avgHoursPerStudent: Math.round(avgHoursPerStudent * 10) / 10,
          weeklyTrend: Math.round(weeklyTrend),
          completionRate: Math.round(completionRate),
        }
      })
      .sort((a, b) => b.hours - a.hours)

    const clientDataArray: ClientData[] = Array.from(clientMap.entries())
      .map(([name, info]) => ({
        name,
        hours: Math.round(info.hours * 10) / 10,
        students: Array.from(info.students),
        latestSummary: info.latestSummary,
        director: info.director,
        debriefsCount: info.debriefsCount,
        avgHoursPerWeek: info.weeklyHours.length > 0 ? Math.round((info.hours / info.weeklyHours.length) * 10) / 10 : 0,
      }))
      .sort((a, b) => b.hours - a.hours)

    setClinicData(clinicDataArray)
    setClientData(clientDataArray)
  }, [
    debriefs,
    clients,
    directors,
    attendance,
    selectedWeeks,
    selectedClinic,
    loading,
    directorId,
    directorStudentIds,
    directorClientNames,
  ])

  if (!mounted) {
    return null
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  const totalHours = clinicData.reduce((sum, c) => sum + c.hours, 0)
  const totalStudents = clinicData.reduce((sum, c) => sum + c.students, 0)
  const totalClients = clinicData.reduce((sum, c) => sum + c.clients, 0)
  const totalDebriefs = clinicData.reduce((sum, c) => sum + c.debriefsSubmitted, 0)
  const totalReviewed = clinicData.reduce((sum, c) => sum + c.debriefsReviewed, 0)
  const avgAttendance =
    clinicData.length > 0 ? Math.round(clinicData.reduce((sum, c) => sum + c.attendanceRate, 0) / clinicData.length) : 0

  const studentsList = debriefs.reduce((acc: any[], d) => {
    const existing = acc.find((s) => s.email === d.student_email)
    if (existing) {
      existing.totalHours += d.hours_worked || 0
      existing.debriefsCount += 1
    } else {
      acc.push({
        name: d.student_email?.split("@")[0] || "Unknown",
        email: d.student_email,
        clinic: d.clinic,
        totalHours: d.hours_worked || 0,
        debriefsCount: 1,
        clientName: d.client_name,
      })
    }
    return acc
  }, [])

  const reviewedDebriefs = debriefs.filter((d) => d.status === "reviewed")
  const pendingDebriefs = debriefs.filter((d) => d.status !== "reviewed")

  const chartData = clinicData.map((clinic) => ({
    name: clinic.name,
    hours: clinic.hours,
    students: clinic.students,
    clients: clinic.clients,
    color: clinic.color || "#000000",
  }))

  // Pie chart data for debrief status
  const pieData = [
    { name: "Reviewed", value: totalReviewed, fill: "#22c55e" },
    { name: "Pending", value: totalDebriefs - totalReviewed, fill: "#f59e0b" },
  ]

  const toggleKPI = (kpi: string) => {
    setExpandedKPI(expandedKPI === kpi ? null : kpi)
  }

  return (
    <div className="space-y-4">
      <Collapsible open={expandedView} onOpenChange={setExpandedView}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#002855]">Clinic Performance</h2>
            <p className="text-xs text-muted-foreground">Comprehensive KPIs and metrics by clinic</p>
          </div>
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
              {expandedView ? "Collapse" : "Expand"} View
              {expandedView ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          </CollapsibleTrigger>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
          {/* Total Hours - Expandable */}
          <Collapsible open={expandedKPI === "hours"} onOpenChange={() => toggleKPI("hours")}>
            <CollapsibleTrigger asChild>
              <Card className="border-l-4 border-l-blue-500 cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <Clock className="h-3 w-3" />
                      Total Hours
                    </div>
                    <ChevronDown
                      className={`h-3 w-3 text-muted-foreground transition-transform ${expandedKPI === "hours" ? "rotate-180" : ""}`}
                    />
                  </div>
                  <div className="text-2xl font-bold">{Math.round(totalHours)}</div>
                </CardContent>
              </Card>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <Card className="mt-2 border-l-4 border-l-blue-500">
                <CardContent className="p-3">
                  <h4 className="text-sm font-semibold mb-2">Hours by Clinic</h4>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {clinicData.map((clinic) => (
                        <div key={clinic.name} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: clinic.color }} />
                            <span className="text-sm">{clinic.name}</span>
                          </div>
                          <Badge variant="outline">{clinic.hours}h</Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>

          {/* Active Students - Expandable */}
          <Collapsible open={expandedKPI === "students"} onOpenChange={() => toggleKPI("students")}>
            <CollapsibleTrigger asChild>
              <Card className="border-l-4 border-l-green-500 cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <Users className="h-3 w-3" />
                      Active Students
                    </div>
                    <ChevronDown
                      className={`h-3 w-3 text-muted-foreground transition-transform ${expandedKPI === "students" ? "rotate-180" : ""}`}
                    />
                  </div>
                  <div className="text-2xl font-bold">{totalStudents}</div>
                </CardContent>
              </Card>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <Card className="mt-2 border-l-4 border-l-green-500">
                <CardContent className="p-3">
                  <h4 className="text-sm font-semibold mb-2">Student Details</h4>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {studentsList.slice(0, 20).map((student, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3 text-muted-foreground" />
                            <div>
                              <span className="text-sm font-medium">{student.name}</span>
                              <p className="text-xs text-muted-foreground">{student.clinic}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline">{student.totalHours}h</Badge>
                            <p className="text-xs text-muted-foreground">{student.debriefsCount} debriefs</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>

          {/* Active Clients - Expandable */}
          <Collapsible open={expandedKPI === "clients"} onOpenChange={() => toggleKPI("clients")}>
            <CollapsibleTrigger asChild>
              <Card className="border-l-4 border-l-purple-500 cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <Building className="h-3 w-3" />
                      Active Clients
                    </div>
                    <ChevronDown
                      className={`h-3 w-3 text-muted-foreground transition-transform ${expandedKPI === "clients" ? "rotate-180" : ""}`}
                    />
                  </div>
                  <div className="text-2xl font-bold">{totalClients}</div>
                </CardContent>
              </Card>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <Card className="mt-2 border-l-4 border-l-purple-500">
                <CardContent className="p-3">
                  <h4 className="text-sm font-semibold mb-2">Client Details</h4>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {clientData.map((client, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <div className="flex items-center gap-2">
                            <Building className="h-3 w-3 text-muted-foreground" />
                            <div>
                              <span className="text-sm font-medium">{client.name}</span>
                              <p className="text-xs text-muted-foreground">{client.students.length} students</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline">{client.hours}h</Badge>
                            <p className="text-xs text-muted-foreground">{client.debriefsCount} debriefs</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>

          {/* Debriefs - Expandable */}
          <Collapsible open={expandedKPI === "debriefs"} onOpenChange={() => toggleKPI("debriefs")}>
            <CollapsibleTrigger asChild>
              <Card className="border-l-4 border-l-amber-500 cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <FileText className="h-3 w-3" />
                      Debriefs
                    </div>
                    <ChevronDown
                      className={`h-3 w-3 text-muted-foreground transition-transform ${expandedKPI === "debriefs" ? "rotate-180" : ""}`}
                    />
                  </div>
                  <div className="text-2xl font-bold">{totalDebriefs}</div>
                  <div className="text-xs text-muted-foreground">{totalReviewed} reviewed</div>
                </CardContent>
              </Card>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <Card className="mt-2 border-l-4 border-l-amber-500">
                <CardContent className="p-3">
                  <Tabs defaultValue="pending" className="w-full">
                    <TabsList className="grid grid-cols-2 w-full h-8">
                      <TabsTrigger value="pending" className="text-xs">
                        Pending ({pendingDebriefs.length})
                      </TabsTrigger>
                      <TabsTrigger value="reviewed" className="text-xs">
                        Reviewed ({reviewedDebriefs.length})
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="pending">
                      <ScrollArea className="h-[180px]">
                        <div className="space-y-2 mt-2">
                          {pendingDebriefs.slice(0, 15).map((d, idx) => (
                            <div key={idx} className="p-2 bg-amber-50 border border-amber-200 rounded text-sm">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{d.student_email?.split("@")[0]}</span>
                                <Badge variant="outline" className="text-amber-600 border-amber-300">
                                  Pending
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {d.client_name} • Week {d.week_number}
                              </p>
                            </div>
                          ))}
                          {pendingDebriefs.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">All debriefs reviewed!</p>
                          )}
                        </div>
                      </ScrollArea>
                    </TabsContent>
                    <TabsContent value="reviewed">
                      <ScrollArea className="h-[180px]">
                        <div className="space-y-2 mt-2">
                          {reviewedDebriefs.slice(0, 15).map((d, idx) => (
                            <div key={idx} className="p-2 bg-green-50 border border-green-200 rounded text-sm">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{d.student_email?.split("@")[0]}</span>
                                <Badge variant="outline" className="text-green-600 border-green-300">
                                  Reviewed
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {d.client_name} • {d.hours_worked}h
                              </p>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>

          {/* Review Rate - Expandable */}
          <Collapsible open={expandedKPI === "review"} onOpenChange={() => toggleKPI("review")}>
            <CollapsibleTrigger asChild>
              <Card className="border-l-4 border-l-cyan-500 cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <CheckCircle className="h-3 w-3" />
                      Review Rate
                    </div>
                    <ChevronDown
                      className={`h-3 w-3 text-muted-foreground transition-transform ${expandedKPI === "review" ? "rotate-180" : ""}`}
                    />
                  </div>
                  <div className="text-2xl font-bold">
                    {totalDebriefs > 0 ? Math.round((totalReviewed / totalDebriefs) * 100) : 0}%
                  </div>
                </CardContent>
              </Card>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <Card className="mt-2 border-l-4 border-l-cyan-500">
                <CardContent className="p-3">
                  <h4 className="text-sm font-semibold mb-2">Review Rate by Clinic</h4>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-3">
                      {clinicData.map((clinic) => (
                        <div key={clinic.name} className="p-2 bg-muted/50 rounded">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: clinic.color }} />
                              <span className="text-sm">{clinic.name}</span>
                            </div>
                            <span className="text-sm font-semibold">{clinic.completionRate}%</span>
                          </div>
                          <Progress value={clinic.completionRate} className="h-1.5" />
                          <p className="text-xs text-muted-foreground mt-1">
                            {clinic.debriefsReviewed} of {clinic.debriefsSubmitted} reviewed
                          </p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>

          {/* Avg Attendance - Expandable */}
          <Collapsible open={expandedKPI === "attendance"} onOpenChange={() => toggleKPI("attendance")}>
            <CollapsibleTrigger asChild>
              <Card className="border-l-4 border-l-rose-500 cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <Calendar className="h-3 w-3" />
                      Avg Attendance
                    </div>
                    <ChevronDown
                      className={`h-3 w-3 text-muted-foreground transition-transform ${expandedKPI === "attendance" ? "rotate-180" : ""}`}
                    />
                  </div>
                  <div className="text-2xl font-bold">{avgAttendance}%</div>
                </CardContent>
              </Card>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <Card className="mt-2 border-l-4 border-l-rose-500">
                <CardContent className="p-3">
                  <h4 className="text-sm font-semibold mb-2">Attendance by Clinic</h4>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-3">
                      {clinicData.map((clinic) => (
                        <div key={clinic.name} className="p-2 bg-muted/50 rounded">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: clinic.color }} />
                              <span className="text-sm">{clinic.name}</span>
                            </div>
                            <Badge
                              variant={
                                clinic.attendanceRate >= 80
                                  ? "default"
                                  : clinic.attendanceRate >= 60
                                    ? "secondary"
                                    : "destructive"
                              }
                            >
                              {clinic.attendanceRate}%
                            </Badge>
                          </div>
                          <Progress value={clinic.attendanceRate} className="h-1.5" />
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {clinicData.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground mt-4">No data available for selected filters</Card>
        ) : (
          <>
            {/* Main Chart */}
            <Card className="mt-4">
              <CardContent className="pt-4">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}h`}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          return (
                            <div className="bg-background border rounded-lg shadow-lg p-3 text-sm">
                              <p className="font-semibold" style={{ color: data.color }}>
                                {data.name}
                              </p>
                              <p className="text-muted-foreground">{data.hours} hours</p>
                              <p className="text-muted-foreground">{data.students} students</p>
                              <p className="text-muted-foreground">{data.clients} clients</p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <CollapsibleContent>
              <div className="grid gap-4 md:grid-cols-2 mt-4">
                {/* Debrief Status Pie Chart */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Debrief Review Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        />
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Clinic Comparison Table */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Clinic Comparison</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-[180px] overflow-y-auto">
                      {clinicData.map((clinic) => (
                        <div key={clinic.name} className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: clinic.color }} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium truncate">{clinic.name}</span>
                              <div className="flex items-center gap-1">
                                {clinic.weeklyTrend > 0 ? (
                                  <TrendingUp className="h-3 w-3 text-green-500" />
                                ) : clinic.weeklyTrend < 0 ? (
                                  <TrendingDown className="h-3 w-3 text-red-500" />
                                ) : null}
                                <span
                                  className={`text-xs ${clinic.weeklyTrend > 0 ? "text-green-500" : clinic.weeklyTrend < 0 ? "text-red-500" : "text-muted-foreground"}`}
                                >
                                  {clinic.weeklyTrend > 0 ? "+" : ""}
                                  {clinic.weeklyTrend}%
                                </span>
                              </div>
                            </div>
                            <Progress value={clinic.completionRate} className="h-1.5 mt-1" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CollapsibleContent>

            {/* Clinic Cards Grid - Updated to show 5 columns for Resource Acquisition */}
            <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-5 mt-4">
              {clinicData.map((clinic) => {
                const relatedClients = clientData.filter((c) => {
                  const directorClinic = directorToClinicMap.get(c.director)
                  return directorClinic === clinic.name || normalizeClinicName(directorClinic || "") === clinic.name
                })

                return (
                  <Dialog key={clinic.name}>
                    <DialogTrigger asChild>
                      <Card
                        className="cursor-pointer transition-all hover:shadow-md border-t-4 group"
                        style={{ borderTopColor: clinic.color }}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold truncate" style={{ color: clinic.color }}>
                              {clinic.name}
                            </span>
                            <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <div className="text-2xl font-bold">{clinic.hours}h</div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {clinic.students}
                            </span>
                            <span className="flex items-center gap-1">
                              <Building className="h-3 w-3" />
                              {clinic.clients}
                            </span>
                          </div>
                          <div className="mt-2 pt-2 border-t">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Avg/Student</span>
                              <span className="font-medium">{clinic.avgHoursPerStudent}h</span>
                            </div>
                            <div className="flex items-center justify-between text-xs mt-1">
                              <span className="text-muted-foreground">Review Rate</span>
                              <Badge
                                variant={
                                  clinic.completionRate >= 80
                                    ? "default"
                                    : clinic.completionRate >= 50
                                      ? "secondary"
                                      : "destructive"
                                }
                                className="text-xs px-1 py-0"
                              >
                                {clinic.completionRate}%
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: clinic.color }} />
                          {clinic.name} Clinic
                        </DialogTitle>
                      </DialogHeader>

                      <Tabs defaultValue="overview" className="mt-4">
                        <TabsList className="grid grid-cols-3 w-full">
                          <TabsTrigger value="overview">Overview</TabsTrigger>
                          <TabsTrigger value="kpis">KPIs</TabsTrigger>
                          <TabsTrigger value="clients">Clients</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="space-y-4">
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="p-3 bg-muted/50 rounded-lg">
                              <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs mb-1">
                                <Users className="h-3 w-3" />
                                Students
                              </div>
                              <div className="text-xl font-bold">{clinic.students}</div>
                            </div>
                            <div className="p-3 bg-muted/50 rounded-lg">
                              <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs mb-1">
                                <Clock className="h-3 w-3" />
                                Hours
                              </div>
                              <div className="text-xl font-bold">{clinic.hours}</div>
                            </div>
                            <div className="p-3 bg-muted/50 rounded-lg">
                              <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs mb-1">
                                <Building className="h-3 w-3" />
                                Clients
                              </div>
                              <div className="text-xl font-bold">{clinic.clients}</div>
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="kpis" className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <Card>
                              <CardContent className="p-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <Target className="h-4 w-4 text-blue-500" />
                                  <span className="text-sm font-medium">Avg Hours/Student</span>
                                </div>
                                <div className="text-2xl font-bold">{clinic.avgHoursPerStudent}h</div>
                                <Progress value={Math.min(clinic.avgHoursPerStudent * 10, 100)} className="h-2 mt-2" />
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="p-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  <span className="text-sm font-medium">Review Completion</span>
                                </div>
                                <div className="text-2xl font-bold">{clinic.completionRate}%</div>
                                <Progress value={clinic.completionRate} className="h-2 mt-2" />
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="p-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <FileText className="h-4 w-4 text-amber-500" />
                                  <span className="text-sm font-medium">Debriefs</span>
                                </div>
                                <div className="text-2xl font-bold">{clinic.debriefsSubmitted}</div>
                                <p className="text-xs text-muted-foreground mt-1">{clinic.debriefsReviewed} reviewed</p>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="p-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <Calendar className="h-4 w-4 text-purple-500" />
                                  <span className="text-sm font-medium">Attendance Rate</span>
                                </div>
                                <div className="text-2xl font-bold">{clinic.attendanceRate}%</div>
                                <Progress value={clinic.attendanceRate} className="h-2 mt-2" />
                              </CardContent>
                            </Card>
                          </div>

                          {/* Weekly Trend */}
                          <Card>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <BarChart3 className="h-4 w-4 text-cyan-500" />
                                  <span className="text-sm font-medium">Weekly Trend</span>
                                </div>
                                <div
                                  className={`flex items-center gap-1 ${clinic.weeklyTrend >= 0 ? "text-green-500" : "text-red-500"}`}
                                >
                                  {clinic.weeklyTrend >= 0 ? (
                                    <TrendingUp className="h-4 w-4" />
                                  ) : (
                                    <TrendingDown className="h-4 w-4" />
                                  )}
                                  <span className="text-lg font-bold">
                                    {clinic.weeklyTrend >= 0 ? "+" : ""}
                                    {clinic.weeklyTrend}%
                                  </span>
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground mt-2">
                                Compared to previous week's hours logged
                              </p>
                            </CardContent>
                          </Card>
                        </TabsContent>

                        <TabsContent value="clients" className="space-y-2">
                          {relatedClients.length > 0 ? (
                            <div className="max-h-60 overflow-y-auto space-y-2">
                              {relatedClients.map((client) => (
                                <div key={client.name} className="p-3 rounded-lg border">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-medium text-sm">{client.name}</span>
                                    <Badge variant="outline">{client.hours}h</Badge>
                                  </div>
                                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <span>
                                      {client.students.length} student{client.students.length !== 1 ? "s" : ""}
                                    </span>
                                    <span>{client.debriefsCount} debriefs</span>
                                    <span>{client.avgHoursPerWeek}h/week avg</span>
                                  </div>
                                  {client.latestSummary && (
                                    <p className="text-xs text-muted-foreground mt-2 italic line-clamp-2">
                                      "{client.latestSummary}"
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              No clients assigned to this clinic
                            </p>
                          )}
                        </TabsContent>
                      </Tabs>
                    </DialogContent>
                  </Dialog>
                )
              })}
            </div>
          </>
        )}
      </Collapsible>
    </div>
  )
}
