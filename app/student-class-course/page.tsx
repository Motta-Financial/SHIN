"use client"

import { useState, useEffect } from "react"
import { MainNavigation } from "@/components/main-navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Calendar,
  Video,
  BookOpen,
  FileText,
  Download,
  Play,
  Clock,
  FolderOpen,
  File,
  FileImage,
  FileSpreadsheet,
  Presentation,
  Users,
  Building,
  CalendarDays,
  Building2,
  Megaphone,
  GraduationCap,
  Mail,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { UnifiedWeeklyAgenda } from "@/components/unified-weekly-agenda"

interface SemesterSchedule {
  id: string
  week_number: number
  week_start: string
  week_end: string
  session_focus: string
  is_break: boolean
  notes: string
  semester_id: string
}

interface PublishedAgenda {
  id: string
  schedule_date: string
  director_name: string
  zoom_link: string
  schedule_data: any
  notes: string
  published_at: string
  semester_id: string
}

interface ClassRecording {
  id: string
  title: string
  description: string
  video_url: string
  thumbnail_url: string
  week_number: number
  duration_minutes: number
  recorded_at: string
  created_at: string
  semester_id: string
}

interface CourseMaterial {
  id: string
  title: string
  description: string | null
  file_name: string
  file_url: string
  file_type: string
  file_size: number
  category: string
  target_clinic: string
  uploaded_by: string
  uploader_name: string
  created_at: string
}

interface StudentInfo {
  id: string
  full_name: string
  email: string
  clinic: string
  clinic_id: string
  semester_id: string
}

interface ClinicAnnouncement {
  id: string
  title: string
  content: string
  postedBy: string
  postedAt: string
  priority: string
  clinicId: string | null
  clinicName: string | null
}

interface ClinicMaterial {
  id: string
  title: string
  description: string | null
  file_name: string
  file_url: string
  file_type: string
  file_size: number
  category: string
  created_at: string
  uploader_name: string
}

interface ClinicDirector {
  id: string
  full_name: string
  email: string
  role: string
}

interface ClinicTeamMember {
  student_id: string
  student_name: string
  student_email: string
  client_name: string | null
  student_role: string | null
}

export default function StudentClassCoursePage() {
  const [activeTab, setActiveTab] = useState("agenda")
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)

  const [semesterSchedule, setSemesterSchedule] = useState<SemesterSchedule[]>([])
  const [selectedWeek, setSelectedWeek] = useState<string>("current")

  const [agenda, setAgenda] = useState<PublishedAgenda | null>(null)
  const [recordings, setRecordings] = useState<ClassRecording[]>([])
  const [materials, setMaterials] = useState<CourseMaterial[]>([])
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null)
  const [currentSemesterId, setCurrentSemesterId] = useState<string | null>(null)

  const [clinicAnnouncements, setClinicAnnouncements] = useState<ClinicAnnouncement[]>([])
  const [clinicMaterials, setClinicMaterials] = useState<ClinicMaterial[]>([])
  const [clinicDirectors, setClinicDirectors] = useState<ClinicDirector[]>([])
  const [clinicTeam, setClinicTeam] = useState<ClinicTeamMember[]>([])
  const [clinicLoading, setClinicLoading] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      fetchAllData()
    }
  }, [mounted])

  useEffect(() => {
    if (selectedWeek && semesterSchedule.length > 0 && currentSemesterId) {
      fetchAgendaForWeek()
    }
  }, [selectedWeek, semesterSchedule, currentSemesterId])

  const fetchClinicData = async () => {
    if (!studentInfo?.clinic_id) return

    setClinicLoading(true)
    try {
      // Fetch clinic-specific announcements
      const announcementsRes = await fetch("/api/announcements")
      if (announcementsRes.ok) {
        const { announcements } = await announcementsRes.json()
        // Filter for this clinic or general announcements
        const filtered = announcements.filter(
          (a: ClinicAnnouncement) => !a.clinicId || a.clinicId === studentInfo.clinic_id,
        )
        setClinicAnnouncements(filtered)
      }

      // Fetch clinic-specific materials
      const { data: materialsData, error: materialsError } = await supabase
        .from("course_materials")
        .select(
          "id, title, description, file_name, file_url, file_type, file_size, category, created_at, uploader_name",
        )
        .eq("target_clinic", studentInfo.clinic)
        .order("created_at", { ascending: false })

      if (!materialsError && materialsData) {
        setClinicMaterials(materialsData)
      }

      // Fetch clinic directors
      const { data: directorsData, error: directorsError } = await supabase
        .from("directors")
        .select("id, full_name, email, role")
        .eq("clinic_id", studentInfo.clinic_id)

      if (!directorsError && directorsData) {
        setClinicDirectors(directorsData)
      }

      // Fetch clinic team members from v_complete_mapping
      const { data: teamData, error: teamError } = await supabase
        .from("v_complete_mapping")
        .select("student_id, student_name, student_email, client_name, student_role")
        .eq("student_clinic_id", studentInfo.clinic_id)

      if (!teamError && teamData) {
        setClinicTeam(teamData)
      }
    } catch (error) {
      console.error("[v0] Error fetching clinic data:", error)
    } finally {
      setClinicLoading(false)
    }
  }

  const fetchAllData = async () => {
    setLoading(true)
    try {
      const { data: semesterData, error: semesterError } = await supabase
        .from("semester_config")
        .select("id, semester, start_date, end_date")
        .eq("is_active", true)
        .maybeSingle()

      if (semesterError) {
        console.error("[v0] Error fetching semester config:", semesterError.message)
      }

      const semesterId = semesterData?.id || null
      setCurrentSemesterId(semesterId)

      const { data: studentData, error: studentError } = await supabase
        .from("v_complete_mapping")
        .select("student_id, student_name, student_email, student_clinic_id, student_clinic_name")
        .limit(1)
        .maybeSingle()

      if (studentData) {
        setStudentInfo({
          id: studentData.student_id,
          full_name: studentData.student_name,
          email: studentData.student_email,
          clinic: studentData.student_clinic_name,
          clinic_id: studentData.student_clinic_id || "",
          semester_id: semesterId || "",
        })
      }

      let scheduleQuery = supabase
        .from("semester_schedule")
        .select("id, week_number, week_start, week_end, session_focus, is_break, notes, semester_id")
        .order("week_number", { ascending: true })

      if (semesterId) {
        scheduleQuery = scheduleQuery.eq("semester_id", semesterId)
      }

      const { data: scheduleData, error: scheduleError } = await scheduleQuery

      if (scheduleError) {
        console.error("[v0] Error fetching schedule:", scheduleError)
      }

      if (scheduleData && scheduleData.length > 0) {
        setSemesterSchedule(scheduleData)

        const today = new Date()
        const currentWeek = scheduleData.find((week) => {
          const weekStart = new Date(week.week_start)
          const weekEnd = new Date(week.week_end)
          return today >= weekStart && today <= weekEnd
        })

        if (currentWeek) {
          setSelectedWeek(currentWeek.id)
        } else {
          // If no current week, find the next upcoming week or use the first one
          const upcomingWeek = scheduleData.find((week) => new Date(week.week_start) > today)
          setSelectedWeek(upcomingWeek?.id || scheduleData[0].id)
        }
      }

      let recordingsQuery = supabase
        .from("class_recordings")
        .select(
          "id, title, description, video_url, thumbnail_url, week_number, duration_minutes, recorded_at, created_at, semester_id",
        )
        .order("week_number", { ascending: false })

      if (semesterId) {
        recordingsQuery = recordingsQuery.eq("semester_id", semesterId)
      }

      const { data: recordingsData, error: recordingsError } = await recordingsQuery

      if (recordingsError) {
        console.error("[v0] Error fetching recordings:", recordingsError)
      }

      if (recordingsData) {
        setRecordings(recordingsData)
      }

      let materialsQuery = supabase
        .from("course_materials")
        .select(
          "id, title, description, file_name, file_url, file_type, file_size, category, target_clinic, uploaded_by, uploader_name, created_at",
        )
        .order("created_at", { ascending: false })

      if (studentData?.student_clinic_name) {
        materialsQuery = materialsQuery.or(`target_clinic.eq.all,target_clinic.eq.${studentData.student_clinic_name}`)
      }

      const { data: materialsData, error: materialsError } = await materialsQuery

      if (materialsError) {
        console.error("[v0] Error fetching materials:", materialsError)
      }

      if (materialsData) {
        setMaterials(materialsData)
      }
    } catch (error) {
      console.error("[v0] Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === "clinic" && studentInfo?.clinic_id) {
      fetchClinicData()
    }
  }, [activeTab, studentInfo?.clinic_id])

  const fetchAgendaForWeek = async () => {
    try {
      const selectedSchedule = semesterSchedule.find((s) => s.id === selectedWeek)
      if (!selectedSchedule) return

      let agendaQuery = supabase
        .from("published_agendas")
        .select("id, schedule_date, director_name, zoom_link, schedule_data, notes, published_at, semester_id")
        .gte("schedule_date", selectedSchedule.week_start)
        .lte("schedule_date", selectedSchedule.week_end)
        .order("published_at", { ascending: false })
        .limit(1)

      if (currentSemesterId) {
        agendaQuery = agendaQuery.eq("semester_id", currentSemesterId)
      }

      const { data: agendaData, error: agendaError } = await agendaQuery.maybeSingle()

      if (agendaError && agendaError.code !== "PGRST116") {
        console.error("[v0] Error fetching agenda:", agendaError)
      }

      setAgenda(agendaData)
    } catch (error) {
      // No agenda for this week is fine
      console.error("[v0] Error in fetchAgendaForWeek:", error)
      setAgenda(null)
    }
  }

  const getBlockHeaderColor = (color: string) => {
    switch (color) {
      case "blue":
        return "bg-slate-700"
      case "teal":
        return "bg-teal-800"
      case "amber":
        return "bg-amber-800"
      case "green":
        return "bg-emerald-800"
      case "purple":
        return "bg-purple-800"
      default:
        return "bg-slate-700"
    }
  }

  const formatDuration = (minutes: number) => {
    if (!minutes) return ""
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins} min`
  }

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "syllabus":
        return "Syllabus"
      case "lecture":
        return "Lectures"
      case "assignment":
        return "Assignments"
      case "resource":
        return "Resources"
      case "template":
        return "Templates"
      default:
        return cat
    }
  }

  const getFileIcon = (fileType: string) => {
    if (fileType?.includes("image")) return <FileImage className="h-4 w-4" />
    if (fileType?.includes("spreadsheet") || fileType?.includes("excel")) return <FileSpreadsheet className="h-4 w-4" />
    if (fileType?.includes("presentation") || fileType?.includes("powerpoint"))
      return <Presentation className="h-4 w-4" />
    if (fileType?.includes("pdf")) return <FileText className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  const formatFileSize = (bytes: number) => {
    if (!bytes) return ""
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getFilteredMaterials = (targetClinic: string) => {
    return materials.filter((m) => {
      if (targetClinic === "all") {
        return m.target_clinic === "all"
      }
      return m.target_clinic === targetClinic || m.target_clinic === studentInfo?.clinic
    })
  }

  // Get current week info
  const getCurrentWeekInfo = () => {
    const selected = semesterSchedule.find((s) => s.id === selectedWeek)
    if (!selected) return null
    return selected
  }

  const currentWeekInfo = getCurrentWeekInfo()

  if (!mounted) return null

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        <aside className="fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-52 border-r bg-card z-40">
          <MainNavigation />
        </aside>
        <div className="pl-52 pt-14 p-4 space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-52 border-r bg-card z-40">
        <MainNavigation />
      </aside>

      <main className="pl-52 pt-14">
        <div className="p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-4">
            {/* Header with Semester Schedule Dropdown */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Class Course</h1>
                <p className="text-sm text-slate-500 mt-1">
                  Weekly agenda, recordings, and course materials
                  {studentInfo && <span className="text-blue-600 ml-1">• {studentInfo.clinic}</span>}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <CalendarDays className="h-4 w-4" />
                  <span>Week:</span>
                </div>
                <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                  <SelectTrigger className="w-[280px] bg-white">
                    <SelectValue placeholder="Select week" />
                  </SelectTrigger>
                  <SelectContent>
                    {semesterSchedule.map((week) => {
                      const today = new Date()
                      const weekStart = new Date(week.week_start)
                      const weekEnd = new Date(week.week_end)
                      const isCurrent = today >= weekStart && today <= weekEnd
                      const isPast = today > weekEnd

                      return (
                        <SelectItem key={week.id} value={week.id} className={week.is_break ? "text-amber-600" : ""}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Week {week.week_number}</span>
                            {isCurrent && <Badge className="bg-green-100 text-green-700 text-xs">Current</Badge>}
                            {week.is_break && <Badge className="bg-amber-100 text-amber-700 text-xs">Break</Badge>}
                            {isPast && !isCurrent && <span className="text-slate-400 text-xs">Past</span>}
                            <span className="text-slate-500 text-xs">
                              {new Date(week.week_start).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Current Week Info Card */}
            {currentWeekInfo && (
              <Card className="border-l-4 border-l-blue-600 bg-blue-50/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900">
                          Week {currentWeekInfo.week_number}: {currentWeekInfo.session_focus || "Class Session"}
                        </h3>
                        {currentWeekInfo.is_break && <Badge className="bg-amber-100 text-amber-700">Break Week</Badge>}
                      </div>
                      <p className="text-sm text-slate-600 mt-1">
                        {new Date(currentWeekInfo.week_start).toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                        })}{" "}
                        -{" "}
                        {new Date(currentWeekInfo.week_end).toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                      {currentWeekInfo.notes && (
                        <p className="text-sm text-slate-500 mt-2 italic">{currentWeekInfo.notes}</p>
                      )}
                    </div>
                    <Calendar className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="bg-slate-100 p-1 flex-wrap h-auto">
                <TabsTrigger value="agenda" className="gap-2 data-[state=active]:bg-white">
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">Weekly</span> Agenda
                </TabsTrigger>
                <TabsTrigger value="recordings" className="gap-2 data-[state=active]:bg-white">
                  <Video className="h-4 w-4" />
                  <span className="hidden sm:inline">Class</span> Recordings
                </TabsTrigger>
                <TabsTrigger value="materials" className="gap-2 data-[state=active]:bg-white">
                  <BookOpen className="h-4 w-4" />
                  <span className="hidden sm:inline">Course</span> Materials
                </TabsTrigger>
                <TabsTrigger value="clinic" className="gap-2 data-[state=active]:bg-white">
                  <Building2 className="h-4 w-4" />
                  My Clinic
                </TabsTrigger>
                <TabsTrigger value="schedule" className="gap-2 data-[state=active]:bg-white">
                  <CalendarDays className="h-4 w-4" />
                  Full Schedule
                </TabsTrigger>
              </TabsList>

              <TabsContent value="agenda" className="space-y-4">
                <UnifiedWeeklyAgenda semester="Spring 2026" isStudentView={true} studentClinic={studentInfo?.clinic} />
              </TabsContent>

              {/* Class Recordings Tab */}
              <TabsContent value="recordings" className="space-y-4">
                <Card className="overflow-hidden border-0 shadow-sm">
                  <div className="bg-slate-800 text-white p-4">
                    <h2 className="text-lg font-semibold">Class Recordings</h2>
                    <p className="text-slate-300 text-sm">Watch recordings from previous class sessions</p>
                  </div>

                  <CardContent className="p-6">
                    {recordings.length === 0 ? (
                      <div className="text-center py-12">
                        <Video className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                        <p className="text-slate-500">No class recordings available yet</p>
                        <p className="text-sm text-slate-400 mt-1">
                          Recordings will appear here after each class session
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {recordings.map((recording) => (
                          <div
                            key={recording.id}
                            className="border border-slate-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow group"
                          >
                            <div className="relative aspect-video bg-slate-100">
                              <img
                                src={
                                  recording.thumbnail_url ||
                                  "/placeholder.svg?height=180&width=320&query=video recording thumbnail" ||
                                  "/placeholder.svg" ||
                                  "/placeholder.svg" ||
                                  "/placeholder.svg" ||
                                  "/placeholder.svg" ||
                                  "/placeholder.svg" ||
                                  "/placeholder.svg" ||
                                  "/placeholder.svg" ||
                                  "/placeholder.svg" ||
                                  "/placeholder.svg"
                                }
                                alt={recording.title}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Button
                                  size="sm"
                                  className="gap-2"
                                  onClick={() => window.open(recording.video_url, "_blank")}
                                >
                                  <Play className="h-4 w-4" />
                                  Watch
                                </Button>
                              </div>
                              <Badge className="absolute top-2 left-2 bg-slate-900/80 text-white text-xs">
                                Week {recording.week_number}
                              </Badge>
                              {recording.duration_minutes && (
                                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                  {formatDuration(recording.duration_minutes)}
                                </div>
                              )}
                            </div>

                            <div className="p-3">
                              <h3 className="font-medium text-slate-800 line-clamp-1">{recording.title}</h3>
                              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{recording.description}</p>
                              <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                                <Clock className="h-3 w-3" />
                                <span>
                                  {new Date(recording.recorded_at).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Course Materials Tab */}
              <TabsContent value="materials" className="space-y-4">
                {/* Program-Wide Materials Section */}
                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                  <div className="bg-blue-900 text-white px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5" />
                        <div>
                          <h2 className="font-bold">Program-Wide Materials</h2>
                          <p className="text-blue-200 text-xs">Available to all students across all clinics</p>
                        </div>
                      </div>
                      <span className="text-sm bg-blue-800 px-2 py-1 rounded">
                        {materials.filter((m) => m.target_clinic === "all").length} files
                      </span>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {["syllabus", "lecture", "resource", "template"].map((category) => {
                      const categoryMaterials = materials.filter(
                        (m) => m.target_clinic === "all" && m.category === category,
                      )
                      if (categoryMaterials.length === 0) return null

                      return (
                        <div key={category}>
                          <div className="bg-slate-50 px-4 py-2 border-b border-slate-100">
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              {getCategoryLabel(category)}s
                            </span>
                          </div>
                          {categoryMaterials.map((material) => (
                            <div
                              key={material.id}
                              className="px-4 py-3 hover:bg-slate-50 transition-colors flex items-center gap-4"
                            >
                              <div className="text-blue-600">{getFileIcon(material.file_type)}</div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-slate-900">{material.title}</div>
                                {material.description && (
                                  <p className="text-sm text-slate-500 truncate">{material.description}</p>
                                )}
                              </div>
                              <div className="text-xs text-slate-400 whitespace-nowrap">{material.uploader_name}</div>
                              <div className="text-xs text-slate-400 whitespace-nowrap">
                                {new Date(material.created_at).toLocaleDateString()}
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                onClick={() => window.open(material.file_url, "_blank")}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )
                    })}

                    {materials.filter((m) => m.target_clinic === "all").length === 0 && (
                      <div className="px-4 py-8 text-center text-slate-400">
                        <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No program-wide materials available yet</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Clinic-Specific Materials Section */}
                {studentInfo?.clinic && (
                  <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                    <div className="bg-emerald-900 text-white px-4 py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Building className="h-5 w-5" />
                          <div>
                            <h2 className="font-bold">{studentInfo.clinic} Materials</h2>
                            <p className="text-emerald-200 text-xs">Resources specific to your clinic</p>
                          </div>
                        </div>
                        <span className="text-sm bg-emerald-800 px-2 py-1 rounded">
                          {materials.filter((m) => m.target_clinic === studentInfo.clinic).length} files
                        </span>
                      </div>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {["syllabus", "lecture", "assignment", "resource", "template"].map((category) => {
                        const categoryMaterials = materials.filter(
                          (m) => m.target_clinic === studentInfo.clinic && m.category === category,
                        )
                        if (categoryMaterials.length === 0) return null

                        return (
                          <div key={category}>
                            <div className="bg-slate-50 px-4 py-2 border-b border-slate-100">
                              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                {getCategoryLabel(category)}s
                              </span>
                            </div>
                            {categoryMaterials.map((material) => (
                              <div
                                key={material.id}
                                className="px-4 py-3 hover:bg-slate-50 transition-colors flex items-center gap-4"
                              >
                                <div className="text-emerald-600">{getFileIcon(material.file_type)}</div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-slate-900">{material.title}</div>
                                  {material.description && (
                                    <p className="text-sm text-slate-500 truncate">{material.description}</p>
                                  )}
                                </div>
                                <div className="text-xs text-slate-400 whitespace-nowrap">{material.uploader_name}</div>
                                <div className="text-xs text-slate-400 whitespace-nowrap">
                                  {new Date(material.created_at).toLocaleDateString()}
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                  onClick={() => window.open(material.file_url, "_blank")}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )
                      })}

                      {materials.filter((m) => m.target_clinic === studentInfo.clinic).length === 0 && (
                        <div className="px-4 py-8 text-center text-slate-400">
                          <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No clinic-specific materials available yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="clinic" className="space-y-6">
                {clinicLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-48 w-full" />
                  </div>
                ) : (
                  <>
                    {/* Clinic Header */}
                    <Card className="border-l-4 border-l-slate-700">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="h-14 w-14 rounded-xl bg-slate-800 flex items-center justify-center">
                            <Building2 className="h-7 w-7 text-white" />
                          </div>
                          <div>
                            <h2 className="text-xl font-bold text-slate-900">{studentInfo?.clinic || "Your Clinic"}</h2>
                            <p className="text-sm text-slate-500">
                              Clinic-specific materials, announcements, and team info
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Announcements Section */}
                      <div className="lg:col-span-2 space-y-4">
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-lg">
                              <Megaphone className="h-5 w-5 text-amber-600" />
                              Clinic Announcements
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {clinicAnnouncements.length === 0 ? (
                              <div className="text-center py-8 text-slate-500">
                                <Megaphone className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                                <p>No announcements yet</p>
                                <p className="text-xs mt-1">Check back for updates from your clinic directors</p>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                {clinicAnnouncements.map((announcement) => (
                                  <div
                                    key={announcement.id}
                                    className={`p-4 rounded-lg border ${
                                      announcement.priority === "high"
                                        ? "border-amber-200 bg-amber-50"
                                        : "border-slate-200 bg-slate-50"
                                    }`}
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          {announcement.priority === "high" && (
                                            <Badge className="bg-amber-100 text-amber-700 text-xs">Important</Badge>
                                          )}
                                          <h4 className="font-semibold text-slate-900">{announcement.title}</h4>
                                        </div>
                                        <p className="text-sm text-slate-600 whitespace-pre-wrap">
                                          {announcement.content}
                                        </p>
                                        <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                                          <span>{announcement.postedBy}</span>
                                          <span>•</span>
                                          <span>
                                            {new Date(announcement.postedAt).toLocaleDateString("en-US", {
                                              month: "short",
                                              day: "numeric",
                                              year: "numeric",
                                            })}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        {/* Clinic Materials */}
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-lg">
                              <FolderOpen className="h-5 w-5 text-blue-600" />
                              Clinic Materials
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {clinicMaterials.length === 0 ? (
                              <div className="text-center py-8 text-slate-500">
                                <FolderOpen className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                                <p>No clinic-specific materials</p>
                                <p className="text-xs mt-1">Materials uploaded by your directors will appear here</p>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {clinicMaterials.map((material) => (
                                  <div
                                    key={material.id}
                                    className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                        {getFileIcon(material.file_type)}
                                      </div>
                                      <div>
                                        <p className="font-medium text-slate-900 text-sm">{material.title}</p>
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                          <Badge variant="outline" className="text-xs">
                                            {getCategoryLabel(material.category)}
                                          </Badge>
                                          {material.file_size && <span>{formatFileSize(material.file_size)}</span>}
                                        </div>
                                      </div>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => window.open(material.file_url, "_blank")}
                                    >
                                      <Download className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>

                      {/* Sidebar - Directors & Team */}
                      <div className="space-y-4">
                        {/* Directors */}
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                              <GraduationCap className="h-4 w-4 text-slate-600" />
                              Clinic Directors
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {clinicDirectors.length === 0 ? (
                              <p className="text-sm text-slate-500">No directors assigned</p>
                            ) : (
                              <div className="space-y-3">
                                {clinicDirectors.map((director) => (
                                  <div key={director.id} className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9">
                                      <AvatarFallback className="bg-slate-200 text-slate-700 text-xs">
                                        {director.full_name
                                          .split(" ")
                                          .map((n) => n[0])
                                          .join("")
                                          .slice(0, 2)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-slate-900 text-sm truncate">
                                        {director.full_name}
                                      </p>
                                      <p className="text-xs text-slate-500 truncate">{director.role || "Director"}</p>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-8 w-8 p-0"
                                      onClick={() => (window.location.href = `mailto:${director.email}`)}
                                    >
                                      <Mail className="h-4 w-4 text-slate-400" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        {/* Team Members */}
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                              <Users className="h-4 w-4 text-slate-600" />
                              Clinic Team
                              {clinicTeam.length > 0 && (
                                <Badge variant="secondary" className="ml-auto">
                                  {clinicTeam.length}
                                </Badge>
                              )}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {clinicTeam.length === 0 ? (
                              <p className="text-sm text-slate-500">No team members found</p>
                            ) : (
                              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                {clinicTeam.map((member) => (
                                  <div
                                    key={member.student_id}
                                    className={`flex items-center gap-2 p-2 rounded-lg ${
                                      member.student_id === studentInfo?.id
                                        ? "bg-blue-50 border border-blue-200"
                                        : "hover:bg-slate-50"
                                    }`}
                                  >
                                    <Avatar className="h-7 w-7">
                                      <AvatarFallback className="bg-slate-100 text-slate-600 text-xs">
                                        {member.student_name
                                          .split(" ")
                                          .map((n) => n[0])
                                          .join("")
                                          .slice(0, 2)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-slate-900 truncate">
                                        {member.student_name}
                                        {member.student_id === studentInfo?.id && (
                                          <span className="text-blue-600 ml-1">(You)</span>
                                        )}
                                      </p>
                                      {member.client_name && (
                                        <p className="text-xs text-slate-500 truncate">{member.client_name}</p>
                                      )}
                                    </div>
                                    {member.student_role === "team_lead" && (
                                      <Badge className="bg-amber-100 text-amber-700 text-xs">Lead</Badge>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </>
                )}
              </TabsContent>

              {/* Full Schedule Tab */}
              <TabsContent value="schedule" className="space-y-4">
                <Card className="overflow-hidden border-0 shadow-sm">
                  <div className="bg-slate-800 text-white p-4">
                    <h2 className="text-lg font-semibold">Full Semester Schedule</h2>
                    <p className="text-slate-300 text-sm">Complete overview of all weeks in the semester</p>
                  </div>

                  <CardContent className="p-0">
                    <div className="divide-y divide-slate-200">
                      {semesterSchedule.map((week) => {
                        const today = new Date()
                        const weekStart = new Date(week.week_start)
                        const weekEnd = new Date(week.week_end)
                        const isCurrent = today >= weekStart && today <= weekEnd
                        const isPast = today > weekEnd
                        const weekRecording = recordings.find((r) => r.week_number === week.week_number)

                        return (
                          <div
                            key={week.id}
                            className={`p-4 ${isCurrent ? "bg-blue-50 border-l-4 border-l-blue-500" : ""} ${
                              week.is_break ? "bg-amber-50" : ""
                            } ${isPast && !isCurrent ? "opacity-60" : ""}`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div
                                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                                    isCurrent
                                      ? "bg-blue-600 text-white"
                                      : week.is_break
                                        ? "bg-amber-200 text-amber-800"
                                        : isPast
                                          ? "bg-slate-200 text-slate-600"
                                          : "bg-slate-100 text-slate-700"
                                  }`}
                                >
                                  {week.week_number}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-medium text-slate-900">
                                      {week.session_focus || `Week ${week.week_number}`}
                                    </h3>
                                    {isCurrent && (
                                      <Badge className="bg-blue-100 text-blue-700 text-xs">Current Week</Badge>
                                    )}
                                    {week.is_break && (
                                      <Badge className="bg-amber-100 text-amber-700 text-xs">Break</Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-slate-500">
                                    {new Date(week.week_start).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                    })}{" "}
                                    -{" "}
                                    {new Date(week.week_end).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })}
                                  </p>
                                  {week.notes && <p className="text-xs text-slate-400 mt-1 italic">{week.notes}</p>}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {weekRecording && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-1 text-xs bg-transparent"
                                    onClick={() => window.open(weekRecording.video_url, "_blank")}
                                  >
                                    <Video className="h-3 w-3" />
                                    Recording
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant={isCurrent ? "default" : "ghost"}
                                  className="gap-1 text-xs"
                                  onClick={() => {
                                    setSelectedWeek(week.id)
                                    setActiveTab("agenda")
                                  }}
                                >
                                  <Calendar className="h-3 w-3" />
                                  View Agenda
                                </Button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  )
}
