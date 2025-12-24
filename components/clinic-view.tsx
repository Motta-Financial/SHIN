"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Users,
  FileText,
  GraduationCap,
  Building2,
  ExternalLink,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Calendar,
  BarChart3,
} from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import { DocumentUpload } from "@/components/document-upload"

interface ClinicViewProps {
  selectedClinic: string
  selectedWeeks: string[]
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

export function ClinicView({ selectedClinic, selectedWeeks }: ClinicViewProps) {
  const [clinicData, setClinicData] = useState<ClinicData | null>(null)
  const [schedule, setSchedule] = useState<ScheduleWeek[]>([])
  const [materials, setMaterials] = useState<CourseMaterial[]>([])
  const [debriefs, setDebriefs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSubTab, setActiveSubTab] = useState("overview")

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const matchesSelectedWeek = (weekEnding: string, selectedWeekValues: string[]): boolean => {
    if (selectedWeekValues.length === 0) return true
    if (!weekEnding) return false

    const normalizeDate = (dateStr: string): string => {
      try {
        const date = new Date(dateStr)
        if (isNaN(date.getTime())) return dateStr
        return date.toISOString().split("T")[0]
      } catch {
        return dateStr
      }
    }

    const normalizedWeekEnding = normalizeDate(weekEnding)
    return selectedWeekValues.some((selectedWeek) => {
      const normalizedSelected = normalizeDate(selectedWeek)
      return normalizedWeekEnding === normalizedSelected
    })
  }

  useEffect(() => {
    fetchClinicData()
  }, [selectedClinic, selectedWeeks])

  const fetchClinicData = async () => {
    setLoading(true)
    try {
      console.log("[v0] ClinicView - selectedClinic value:", selectedClinic)

      const isValidUUID =
        selectedClinic &&
        selectedClinic !== "all" &&
        selectedClinic.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)

      const { data: mappingData, error: mappingError } = await supabase.from("v_complete_mapping").select("*")

      console.log("[v0] ClinicView - v_complete_mapping count:", mappingData?.length, "error:", mappingError)

      let filteredStudents: CompleteMapping[] = []

      if (mappingData && mappingData.length > 0) {
        if (!isValidUUID) {
          filteredStudents = mappingData as CompleteMapping[]
          console.log("[v0] ClinicView - Showing ALL students:", filteredStudents.length)
        } else {
          filteredStudents = mappingData.filter(
            (s: CompleteMapping) => s.clinic_director_id === selectedClinic || s.client_director_id === selectedClinic,
          )
          console.log("[v0] ClinicView - Filtered by director ID:", filteredStudents.length)
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
        semester: filteredStudents[0]?.semester || "Fall 2025",
      })

      const debriefsRes = await fetch("/api/supabase/debriefs")
      if (debriefsRes.ok) {
        const debriefsData = await debriefsRes.json()
        setDebriefs(debriefsData.debriefs || [])
      }

      const { data: scheduleData } = await supabase
        .from("semester_schedule")
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
      console.error("[v0] Error fetching clinic data:", error)
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

  const activityMetrics = useMemo(() => {
    if (!clinicData || debriefs.length === 0) {
      return {
        totalHours: 0,
        activeStudents: 0,
        debriefsSubmitted: 0,
        studentsWithDebriefs: new Set<string>(),
      }
    }

    const studentIds = new Set(clinicData.students.map((s) => s.student_id))
    let totalHours = 0
    const studentsWithDebriefs = new Set<string>()
    let debriefsSubmitted = 0

    debriefs.forEach((debrief: any) => {
      const studentId = debrief.studentId || debrief.student_id
      const weekEnding = debrief.weekEnding || debrief.week_ending || ""

      if (!studentIds.has(studentId) && studentIds.size > 0) return

      if (!matchesSelectedWeek(weekEnding, selectedWeeks)) return

      const hours = Number.parseFloat(debrief.hoursWorked || debrief.hours_worked || "0")
      totalHours += hours
      if (studentId) studentsWithDebriefs.add(studentId)
      debriefsSubmitted++
    })

    return {
      totalHours,
      activeStudents: studentsWithDebriefs.size,
      debriefsSubmitted,
      studentsWithDebriefs,
    }
  }, [clinicData, debriefs, selectedWeeks])

  const weeklyBreakdown = useMemo(() => {
    if (!clinicData || debriefs.length === 0) return []

    const studentIds = new Set(clinicData.students.map((s) => s.student_id))
    const breakdown: { week: string; hours: number; submissions: number; students: number }[] = []

    const weekMap = new Map<string, { hours: number; submissions: number; studentSet: Set<string> }>()

    debriefs.forEach((debrief: any) => {
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
  }, [clinicData, debriefs])

  const studentPerformance = useMemo(() => {
    if (!clinicData || debriefs.length === 0) return []

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

    debriefs.forEach((debrief: any) => {
      const studentId = debrief.studentId || debrief.student_id
      if (!studentMetrics.has(studentId)) return

      const weekEnding = debrief.weekEnding || debrief.week_ending || ""
      if (selectedWeeks.length > 0 && !matchesSelectedWeek(weekEnding, selectedWeeks)) return

      const hours = Number.parseFloat(debrief.hoursWorked || debrief.hours_worked || "0")
      const metrics = studentMetrics.get(studentId)!
      metrics.totalHours += hours
      metrics.submissions++
      if (!metrics.lastSubmission || weekEnding > metrics.lastSubmission) {
        metrics.lastSubmission = weekEnding
      }
    })

    return Array.from(studentMetrics.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.totalHours - a.totalHours)
  }, [clinicData, debriefs, selectedWeeks])

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-pulse text-muted-foreground">Loading clinic data...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clinicData?.students.length || 0}</div>
            <p className="text-xs text-muted-foreground">In {clinicData?.clinic || "clinic"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active This Period</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activityMetrics.activeStudents}</div>
            <p className="text-xs text-muted-foreground">
              {selectedWeeks.length === 0 ? "All time" : `${selectedWeeks.length} week(s) selected`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hours Worked</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activityMetrics.totalHours.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              {clinicData && clinicData.students.length > 0
                ? `Avg: ${(activityMetrics.totalHours / clinicData.students.length).toFixed(1)} per student`
                : "No students"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Debriefs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activityMetrics.debriefsSubmitted}</div>
            <p className="text-xs text-muted-foreground">Submitted this period</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clinicData?.clients.length || 0}</div>
            <p className="text-xs text-muted-foreground">Active engagements</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Weekly Activity Trend
              </CardTitle>
              <CardDescription>Hours and submissions by week</CardDescription>
            </CardHeader>
            <CardContent>
              {weeklyBreakdown.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity data available</p>
              ) : (
                <div className="space-y-3">
                  {weeklyBreakdown.map((week) => (
                    <div key={week.week} className="flex items-center gap-4">
                      <div className="w-24 text-sm text-muted-foreground">
                        {new Date(week.week).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-4 rounded bg-primary"
                            style={{ width: `${Math.min((week.hours / 50) * 100, 100)}%` }}
                          />
                          <span className="text-sm font-medium">{week.hours.toFixed(1)} hrs</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{week.submissions} debriefs</span>
                        <span>{week.students} students</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Client Engagement Teams
                </CardTitle>
                <CardDescription>Students grouped by client assignment</CardDescription>
              </CardHeader>
              <CardContent>
                {clinicData?.clients.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No client assignments found</p>
                ) : (
                  <div className="space-y-4">
                    {clinicData?.clients.map((clientName) => {
                      const teamMembers = clinicData?.students.filter((s) => s.client_name === clientName) || []
                      const teamHours = studentPerformance
                        .filter((s) => s.client === clientName)
                        .reduce((sum, s) => sum + s.totalHours, 0)
                      return (
                        <div key={clientName} className="rounded-lg border p-4">
                          <div className="mb-2 flex items-center justify-between">
                            <h4 className="font-medium">{clientName}</h4>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{teamHours.toFixed(1)} hrs</Badge>
                              <Badge variant="secondary">{teamMembers.length} members</Badge>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {teamMembers.map((student) => {
                              const hasSubmitted = activityMetrics.studentsWithDebriefs.has(student.student_id)
                              return (
                                <div key={student.student_id} className="flex items-center gap-2">
                                  <Avatar className={`h-6 w-6 ${hasSubmitted ? "ring-2 ring-green-500" : ""}`}>
                                    <AvatarFallback className="text-xs">
                                      {getInitials(student.student_name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm">{student.student_name}</span>
                                  {!hasSubmitted && selectedWeeks.length > 0 && (
                                    <AlertCircle className="h-3 w-3 text-orange-500" />
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Clinic Directors
                </CardTitle>
                <CardDescription>Directors supporting this clinic</CardDescription>
              </CardHeader>
              <CardContent>
                {clinicData?.directors.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No directors found</p>
                ) : (
                  <div className="space-y-3">
                    {clinicData?.directors.map((director) => (
                      <div key={director} className="flex items-center gap-3 rounded-lg border p-3">
                        <Avatar>
                          <AvatarFallback>{getInitials(director)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{director}</p>
                          <p className="text-sm text-muted-foreground">Director</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle>Student Roster</CardTitle>
              <CardDescription>
                All students in {clinicData?.clinic || "this clinic"}
                {selectedWeeks.length > 0 && ` - showing activity for ${selectedWeeks.length} week(s)`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {clinicData?.students.length === 0 ? (
                <p className="text-sm text-muted-foreground">No students found</p>
              ) : (
                <div className="space-y-3">
                  {clinicData?.students.map((student) => {
                    const hasSubmitted = activityMetrics.studentsWithDebriefs.has(student.student_id)
                    const perf = studentPerformance.find((s) => s.id === student.student_id)
                    return (
                      <div key={student.student_id} className="flex items-center justify-between rounded-lg border p-4">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{getInitials(student.student_name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{student.student_name}</p>
                            <p className="text-sm text-muted-foreground">{student.student_email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{student.client_name || "Unassigned"}</Badge>
                          {perf && <Badge variant="secondary">{perf.totalHours.toFixed(1)} hrs</Badge>}
                          {selectedWeeks.length > 0 &&
                            (hasSubmitted ? (
                              <Badge variant="default" className="bg-green-500">
                                Submitted
                              </Badge>
                            ) : (
                              <Badge variant="destructive">Missing</Badge>
                            ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Student Performance
              </CardTitle>
              <CardDescription>
                Ranked by hours worked {selectedWeeks.length > 0 ? "for selected period" : "all time"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {studentPerformance.length === 0 ? (
                <p className="text-sm text-muted-foreground">No performance data available</p>
              ) : (
                <div className="space-y-3">
                  {studentPerformance.map((student, index) => {
                    const maxHours = studentPerformance[0]?.totalHours || 1
                    return (
                      <div key={student.id} className="rounded-lg border p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium">{student.name}</p>
                              <p className="text-sm text-muted-foreground">{student.client}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="font-bold">{student.totalHours.toFixed(1)} hrs</p>
                              <p className="text-xs text-muted-foreground">{student.submissions} debriefs</p>
                            </div>
                            {student.submissions === 0 && <AlertCircle className="h-5 w-5 text-orange-500" />}
                          </div>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${(student.totalHours / maxHours) * 100}%` }}
                          />
                        </div>
                        {student.lastSubmission && (
                          <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Last submission:{" "}
                            {new Date(student.lastSubmission).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle>Semester Schedule</CardTitle>
              <CardDescription>Weekly schedule and assignments</CardDescription>
            </CardHeader>
            <CardContent>
              {schedule.length === 0 ? (
                <p className="text-sm text-muted-foreground">No schedule data available</p>
              ) : (
                <div className="space-y-3">
                  {schedule.map((week) => (
                    <div key={week.id} className="rounded-lg border p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{week.week_label || `Week ${week.week_number}`}</h4>
                          <p className="text-sm text-muted-foreground">
                            {week.week_start} - {week.week_end}
                          </p>
                        </div>
                        {week.is_break && <Badge variant="secondary">Break</Badge>}
                      </div>
                      {week.session_focus && <p className="mt-2 text-sm text-muted-foreground">{week.session_focus}</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="materials" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Course Materials</CardTitle>
              <CardDescription>Resources and documents for the clinic</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <DocumentUpload
                clinic={clinicData?.clinic || ""}
                studentName="Director"
                title="Upload Course Materials"
                description="Upload resources, guides, or documents for students"
                acceptedTypes=".pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls"
                onUploadComplete={(files) => {
                  fetchMaterials()
                }}
                compact
              />

              {materials.length === 0 ? (
                <p className="text-sm text-muted-foreground">No materials uploaded yet</p>
              ) : (
                <div className="space-y-3">
                  {materials.map((material) => (
                    <div key={material.id} className="flex items-center justify-between rounded-lg border p-4">
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{material.title}</p>
                          <p className="text-sm text-muted-foreground">{material.description}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <a href={material.file_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
