"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Users, Briefcase, Calendar, FileText, GraduationCap, Building2, ExternalLink } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"

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
  const [loading, setLoading] = useState(true)
  const [activeSubTab, setActiveSubTab] = useState("overview")

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

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
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clinicData?.students.length || 0}</div>
            <p className="text-xs text-muted-foreground">In {clinicData?.clinic || "clinic"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clinicData?.clients.length || 0}</div>
            <p className="text-xs text-muted-foreground">Active engagements</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Directors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clinicData?.directors.length || 0}</div>
            <p className="text-xs text-muted-foreground">Supporting team</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Semester</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clinicData?.semester || "N/A"}</div>
            <p className="text-xs text-muted-foreground">Current term</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
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
                      return (
                        <div key={clientName} className="rounded-lg border p-4">
                          <div className="mb-2 flex items-center justify-between">
                            <h4 className="font-medium">{clientName}</h4>
                            <Badge variant="secondary">{teamMembers.length} members</Badge>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {teamMembers.map((student) => (
                              <div key={student.student_id} className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-xs">
                                    {getInitials(student.student_name)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm">{student.student_name}</span>
                              </div>
                            ))}
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
              <CardDescription>All students in {clinicData?.clinic || "this clinic"}</CardDescription>
            </CardHeader>
            <CardContent>
              {clinicData?.students.length === 0 ? (
                <p className="text-sm text-muted-foreground">No students found</p>
              ) : (
                <div className="space-y-3">
                  {clinicData?.students.map((student) => (
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
                      <div className="text-right">
                        <Badge variant="outline">{student.client_name || "Unassigned"}</Badge>
                      </div>
                    </div>
                  ))}
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

        <TabsContent value="materials">
          <Card>
            <CardHeader>
              <CardTitle>Course Materials</CardTitle>
              <CardDescription>Resources and documents for the clinic</CardDescription>
            </CardHeader>
            <CardContent>
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
