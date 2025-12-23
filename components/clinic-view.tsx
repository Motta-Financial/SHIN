"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  Users,
  Briefcase,
  Calendar,
  FileText,
  Plus,
  GraduationCap,
  Building2,
  CheckCircle2,
  AlertCircle,
  ListTodo,
  Mail,
  Upload,
  Trash2,
  ExternalLink,
} from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"

interface ClinicViewProps {
  selectedClinic: string
  selectedWeeks: string[]
}

interface StudentOverview {
  student_id: string
  student_name: string
  student_email: string
  client_name: string
  clinic: string
  clinic_director: string
  clinic_director_email: string
  client_director: string
  client_director_email: string
  client_primary_director_id: string
  semester: string
}

interface ClinicData {
  clinic: string
  students: StudentOverview[]
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

interface AgendaItem {
  id: string
  title: string
  description: string
  date: string
  time: string
  type: string
  clinic: string
  completed: boolean
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

const directorToClinicMap: Record<string, string> = {
  "Mark Dwyer": "Accounting",
  "Dat Le": "Accounting",
  "Nick Vadala": "Consulting",
  "Ken Mooney": "Resource Acquisition",
  "Christopher Hill": "Marketing",
  "Chris Hill": "Marketing",
  "Beth DiRusso": "Legal",
  "Darrell Mottley": "Legal",
  "Boris Lazic": "SEED",
  "Grace Cha": "SEED",
  "Chaim Letwin": "SEED",
  "Dmitri Tcherevik": "SEED",
}

export function ClinicView({ selectedClinic, selectedWeeks }: ClinicViewProps) {
  const [clinicData, setClinicData] = useState<ClinicData | null>(null)
  const [schedule, setSchedule] = useState<ScheduleWeek[]>([])
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([])
  const [materials, setMaterials] = useState<CourseMaterial[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSubTab, setActiveSubTab] = useState("overview")
  const [showAddAssignment, setShowAddAssignment] = useState(false)
  const [newAssignment, setNewAssignment] = useState({
    title: "",
    description: "",
    due_date: "",
    type: "assignment",
  })

  const clinicName = selectedClinic === "all" ? null : directorToClinicMap[selectedClinic] || selectedClinic

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
      const { data: overviewData, error: overviewError } = await supabase.from("v_student_overview").select("*")

      console.log("[v0] ClinicView - selectedClinic:", selectedClinic)
      console.log("[v0] ClinicView - clinicName derived:", clinicName)
      console.log("[v0] ClinicView - v_student_overview count:", overviewData?.length || 0)

      if (overviewData && overviewData.length > 0) {
        console.log("[v0] ClinicView - Sample student:", overviewData[0])
        console.log("[v0] ClinicView - All clinics in data:", [...new Set(overviewData.map((s: any) => s.clinic))])
      }

      if (overviewError) {
        console.error("[v0] Error fetching v_student_overview:", overviewError)
      }

      if (overviewData && overviewData.length > 0) {
        let filteredStudents = overviewData as StudentOverview[]

        if (clinicName) {
          const normalizedClinic = clinicName.toLowerCase().replace(" clinic", "")
          filteredStudents = overviewData.filter((s: StudentOverview) => {
            const studentClinic = (s.clinic || "").toLowerCase().replace(" clinic", "")
            return studentClinic === normalizedClinic || studentClinic.includes(normalizedClinic)
          })
          console.log("[v0] ClinicView - normalizedClinic:", normalizedClinic)
          console.log("[v0] ClinicView - filteredStudents count:", filteredStudents.length)
        }

        const directorsSet = new Set<string>()
        const clientsSet = new Set<string>()

        filteredStudents.forEach((s) => {
          if (s.clinic_director) directorsSet.add(s.clinic_director)
          if (s.client_director) directorsSet.add(s.client_director)
          if (s.client_name) clientsSet.add(s.client_name)
        })

        setClinicData({
          clinic: clinicName || "All Clinics",
          students: filteredStudents,
          directors: Array.from(directorsSet),
          clients: Array.from(clientsSet),
          semester: filteredStudents[0]?.semester || "Fall 2025",
        })
      } else {
        setClinicData({
          clinic: clinicName || "All Clinics",
          students: [],
          directors: [],
          clients: [],
          semester: "Fall 2025",
        })
      }

      // Fetch semester schedule
      const { data: scheduleData } = await supabase
        .from("semester_schedule")
        .select("*")
        .order("week_number", { ascending: true })

      if (scheduleData) {
        setSchedule(scheduleData)
      }

      // Fetch agenda items for this clinic
      let agendaQuery = supabase.from("agenda_items").select("*").order("date", { ascending: true })

      if (clinicName) {
        agendaQuery = agendaQuery.ilike("clinic", `%${clinicName}%`)
      }

      const { data: agendaData } = await agendaQuery

      if (agendaData) {
        setAgendaItems(agendaData)
      }

      // Fetch course materials for this clinic
      let materialsQuery = supabase.from("course_materials").select("*").order("created_at", { ascending: false })

      if (clinicName) {
        materialsQuery = materialsQuery.or(`target_clinic.ilike.%${clinicName}%,target_clinic.is.null`)
      }

      const { data: materialsData } = await materialsQuery

      if (materialsData) {
        setMaterials(materialsData)
      }
    } catch (error) {
      console.error("[v0] Error fetching clinic data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddAssignment = async () => {
    if (!newAssignment.title || !newAssignment.due_date) return

    try {
      const { error } = await supabase.from("agenda_items").insert({
        title: newAssignment.title,
        description: newAssignment.description,
        date: newAssignment.due_date,
        type: newAssignment.type,
        clinic: clinicName,
        completed: false,
        created_by: "Director",
      })

      if (!error) {
        setShowAddAssignment(false)
        setNewAssignment({ title: "", description: "", due_date: "", type: "assignment" })
        fetchClinicData()
      }
    } catch (error) {
      console.error("[v0] Error adding assignment:", error)
    }
  }

  const toggleAssignmentComplete = async (id: string, completed: boolean) => {
    try {
      await supabase.from("agenda_items").update({ completed: !completed }).eq("id", id)
      fetchClinicData()
    } catch (error) {
      console.error("[v0] Error updating assignment:", error)
    }
  }

  const deleteAssignment = async (id: string) => {
    try {
      await supabase.from("agenda_items").delete().eq("id", id)
      fetchClinicData()
    } catch (error) {
      console.error("[v0] Error deleting assignment:", error)
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

  const getCurrentWeek = () => {
    const now = new Date()
    const currentWeek = schedule.find((week) => {
      const start = new Date(week.week_start)
      const end = new Date(week.week_end)
      return now >= start && now <= end
    })
    return currentWeek
  }

  const upcomingAssignments = agendaItems
    .filter((item) => !item.completed && new Date(item.date) >= new Date())
    .slice(0, 5)

  const currentWeek = getCurrentWeek()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards - Now using v_student_overview data */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-[#2d3a4f] border-none shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-white/80">Students</p>
                <p className="text-2xl font-bold text-white">{clinicData?.students.length || 0}</p>
              </div>
              <div className="rounded-lg bg-[#8fa889] p-2">
                <GraduationCap className="h-4 w-4 text-[#2d3a4f]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#565f4b] border-none shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-white/80">Clients</p>
                <p className="text-2xl font-bold text-white">{clinicData?.clients.length || 0}</p>
              </div>
              <div className="rounded-lg bg-[#9aacb8] p-2">
                <Briefcase className="h-4 w-4 text-[#565f4b]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#5f7082] border-none shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-white/80">Directors</p>
                <p className="text-2xl font-bold text-white">{clinicData?.directors.length || 0}</p>
              </div>
              <div className="rounded-lg bg-[#8fa889] p-2">
                <Users className="h-4 w-4 text-[#5f7082]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#9aacb8] border-none shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-white/80">Current Week</p>
                <p className="text-2xl font-bold text-white">{currentWeek?.week_number || "-"}</p>
              </div>
              <div className="rounded-lg bg-[#2d3a4f] p-2">
                <Calendar className="h-4 w-4 text-[#9aacb8]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="bg-[#2d3a4f]">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-[#8fa889] data-[state=active]:text-[#2d3a4f] text-white/70"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="students"
            className="data-[state=active]:bg-[#8fa889] data-[state=active]:text-[#2d3a4f] text-white/70"
          >
            Students
          </TabsTrigger>
          <TabsTrigger
            value="schedule"
            className="data-[state=active]:bg-[#8fa889] data-[state=active]:text-[#2d3a4f] text-white/70"
          >
            Schedule
          </TabsTrigger>
          <TabsTrigger
            value="materials"
            className="data-[state=active]:bg-[#8fa889] data-[state=active]:text-[#2d3a4f] text-white/70"
          >
            Materials
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Current Week Focus */}
            <Card className="border-[#9aacb8]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-[#2d3a4f]">
                  <Calendar className="h-4 w-4 text-[#8fa889]" />
                  This Week's Focus
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentWeek ? (
                  <div className="space-y-2">
                    <Badge variant="outline" className="border-[#8fa889] text-[#565f4b]">
                      Week {currentWeek.week_number}
                    </Badge>
                    <p className="text-sm text-[#5f7082]">{currentWeek.session_focus || "No focus set"}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(currentWeek.week_start).toLocaleDateString()} -{" "}
                      {new Date(currentWeek.week_end).toLocaleDateString()}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No active week</p>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Assignments */}
            <Card className="border-[#9aacb8]">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-[#2d3a4f]">
                  <ListTodo className="h-4 w-4 text-[#8fa889]" />
                  Upcoming Tasks
                </CardTitle>
                <Dialog open={showAddAssignment} onOpenChange={setShowAddAssignment}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 hover:bg-[#8fa889]/20">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Task</DialogTitle>
                      <DialogDescription>Create a new task for your clinic</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                          id="title"
                          value={newAssignment.title}
                          onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                          placeholder="Task title"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={newAssignment.description}
                          onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                          placeholder="Task description"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="due_date">Due Date</Label>
                          <Input
                            id="due_date"
                            type="date"
                            value={newAssignment.due_date}
                            onChange={(e) => setNewAssignment({ ...newAssignment, due_date: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="type">Type</Label>
                          <Select
                            value={newAssignment.type}
                            onValueChange={(v) => setNewAssignment({ ...newAssignment, type: v })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="assignment">Assignment</SelectItem>
                              <SelectItem value="meeting">Meeting</SelectItem>
                              <SelectItem value="deadline">Deadline</SelectItem>
                              <SelectItem value="reminder">Reminder</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleAddAssignment} className="bg-[#2d3a4f] hover:bg-[#2d3a4f]/90">
                        Add Task
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {upcomingAssignments.length > 0 ? (
                  <div className="space-y-2">
                    {upcomingAssignments.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-[#9aacb8]/10 group"
                      >
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleAssignmentComplete(item.id, item.completed)}
                            className="text-muted-foreground hover:text-[#8fa889]"
                          >
                            {item.completed ? (
                              <CheckCircle2 className="h-4 w-4 text-[#8fa889]" />
                            ) : (
                              <AlertCircle className="h-4 w-4" />
                            )}
                          </button>
                          <div>
                            <p className="text-sm font-medium">{item.title}</p>
                            <p className="text-xs text-muted-foreground">{new Date(item.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                          onClick={() => deleteAssignment(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No upcoming tasks</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Client Teams */}
          <Card className="border-[#9aacb8]">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-[#2d3a4f]">
                <Building2 className="h-4 w-4 text-[#8fa889]" />
                Client Engagement Teams
              </CardTitle>
            </CardHeader>
            <CardContent>
              {clinicData?.clients && clinicData.clients.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {clinicData.clients.map((client) => {
                    const clientStudents = clinicData.students.filter((s) => s.client_name === client)
                    return (
                      <Card key={client} className="border-[#9aacb8]/50 hover:border-[#8fa889] transition-colors">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-[#2d3a4f]">{client}</CardTitle>
                          <CardDescription>{clientStudents.length} students assigned</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-1">
                            {clientStudents.slice(0, 4).map((student) => (
                              <Avatar key={student.student_id} className="h-8 w-8 border-2 border-[#9aacb8]">
                                <AvatarFallback className="text-xs bg-[#8fa889]/20 text-[#2d3a4f]">
                                  {getInitials(student.student_name)}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                            {clientStudents.length > 4 && (
                              <Avatar className="h-8 w-8 border-2 border-[#9aacb8]">
                                <AvatarFallback className="text-xs bg-[#2d3a4f] text-white">
                                  +{clientStudents.length - 4}
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No client teams found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Students Tab - Now using v_student_overview data */}
        <TabsContent value="students" className="space-y-4 mt-4">
          <Card className="border-[#9aacb8]">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-[#2d3a4f]">Clinic Roster</CardTitle>
              <CardDescription>All students in {clinicData?.clinic || "this clinic"}</CardDescription>
            </CardHeader>
            <CardContent>
              {clinicData?.students && clinicData.students.length > 0 ? (
                <div className="space-y-3">
                  {clinicData.students.map((student) => (
                    <div
                      key={student.student_id}
                      className="flex items-center justify-between p-3 rounded-lg border border-[#9aacb8]/50 hover:border-[#8fa889] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-[#8fa889]">
                          <AvatarFallback className="bg-[#8fa889]/20 text-[#2d3a4f]">
                            {getInitials(student.student_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-[#2d3a4f]">{student.student_name}</p>
                          <p className="text-sm text-[#5f7082]">{student.client_name || "Unassigned"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="border-[#8fa889] text-[#565f4b]">
                          {student.clinic}
                        </Badge>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-[#8fa889]/20">
                          <Mail className="h-4 w-4 text-[#5f7082]" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No students found in this clinic</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="space-y-4 mt-4">
          <Card className="border-[#9aacb8]">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-[#2d3a4f]">Semester Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              {schedule.length > 0 ? (
                <div className="space-y-2">
                  {schedule.map((week) => (
                    <div
                      key={week.id}
                      className={`p-3 rounded-lg border transition-colors ${
                        currentWeek?.id === week.id
                          ? "border-[#8fa889] bg-[#8fa889]/10"
                          : week.is_break
                            ? "border-[#9aacb8]/30 bg-[#9aacb8]/5"
                            : "border-[#9aacb8]/50 hover:border-[#8fa889]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge
                            variant={currentWeek?.id === week.id ? "default" : "outline"}
                            className={
                              currentWeek?.id === week.id
                                ? "bg-[#8fa889] text-white"
                                : "border-[#9aacb8] text-[#5f7082]"
                            }
                          >
                            {week.week_label || `Week ${week.week_number}`}
                          </Badge>
                          <span className="text-sm text-[#5f7082]">
                            {new Date(week.week_start).toLocaleDateString()} -{" "}
                            {new Date(week.week_end).toLocaleDateString()}
                          </span>
                        </div>
                        {week.is_break && (
                          <Badge variant="secondary" className="bg-[#9aacb8]/20 text-[#5f7082]">
                            Break
                          </Badge>
                        )}
                      </div>
                      {week.session_focus && <p className="text-sm text-[#5f7082] mt-2">{week.session_focus}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No schedule available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Materials Tab */}
        <TabsContent value="materials" className="space-y-4 mt-4">
          <Card className="border-[#9aacb8]">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium text-[#2d3a4f]">Course Materials</CardTitle>
                <CardDescription>Resources and documents for your clinic</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-[#8fa889] text-[#565f4b] hover:bg-[#8fa889]/10 bg-transparent"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </CardHeader>
            <CardContent>
              {materials.length > 0 ? (
                <div className="space-y-3">
                  {materials.map((material) => (
                    <div
                      key={material.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-[#9aacb8]/50 hover:border-[#8fa889] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-[#8fa889]/20 p-2">
                          <FileText className="h-4 w-4 text-[#565f4b]" />
                        </div>
                        <div>
                          <p className="font-medium text-[#2d3a4f]">{material.title}</p>
                          <p className="text-xs text-[#5f7082]">
                            {material.category} • {new Date(material.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="hover:bg-[#8fa889]/20">
                        <ExternalLink className="h-4 w-4 text-[#5f7082]" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No materials available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
