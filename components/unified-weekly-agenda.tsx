"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Calendar,
  Plus,
  Trash2,
  X,
  Clock,
  BookOpen,
  FileText,
  ChevronDown,
  ChevronRight,
  Coffee,
  Video,
  Check,
  Pencil,
  Send,
  Users,
} from "lucide-react"

interface Activity {
  id: string
  time: string
  title: string
  description: string
  duration: number
  type: "lecture" | "workshop" | "meeting" | "break" | "presentation" | "other"
}

interface Assignment {
  id: string
  title: string
  description: string
  dueDate: string
  type: "reading" | "deliverable" | "quiz" | "presentation" | "other"
}

interface AgendaSession {
  id: string
  activity: string
  team: string
  directorInitials: string
  room: string
  roomNumber: string
  notes: string
}

interface TimeBlock {
  id: string
  time: string
  activity: string
  duration: number
  color: string
  sessions: AgendaSession[]
}

interface WeekSchedule {
  id: string
  week_number: number
  week_label: string
  week_start: string
  week_end: string
  session_focus: string
  activities: Activity[]
  assignments: Assignment[]
  notes: string
  class_time_minutes: number
  clinic_time_minutes: number
  is_break: boolean
  semester: string
  schedule_data?: TimeBlock[]
  zoom_link?: string
  created_at: string
  updated_at: string
}

interface UnifiedWeeklyAgendaProps {
  semester?: string
}

const activityTypeColors: Record<string, string> = {
  lecture: "bg-blue-100 text-blue-800 border-blue-200",
  workshop: "bg-purple-100 text-purple-800 border-purple-200",
  meeting: "bg-green-100 text-green-800 border-green-200",
  break: "bg-amber-100 text-amber-800 border-amber-200",
  presentation: "bg-pink-100 text-pink-800 border-pink-200",
  other: "bg-gray-100 text-gray-800 border-gray-200",
}

const assignmentTypeColors: Record<string, string> = {
  reading: "bg-blue-100 text-blue-800",
  deliverable: "bg-green-100 text-green-800",
  quiz: "bg-red-100 text-red-800",
  presentation: "bg-purple-100 text-purple-800",
  other: "bg-gray-100 text-gray-800",
}

const defaultTimeBlocks: TimeBlock[] = [
  {
    id: "1",
    time: "5:00 PM",
    activity: "All Hands",
    duration: 15,
    color: "blue",
    sessions: [
      {
        id: "1-1",
        activity: "All Hands",
        team: "All Teams",
        directorInitials: "NV",
        room: "Main",
        roomNumber: "101",
        notes: "Announcements",
      },
    ],
  },
  {
    id: "2",
    time: "5:15 PM",
    activity: "Clinic Sessions",
    duration: 45,
    color: "teal",
    sessions: [
      {
        id: "2-1",
        activity: "Clinic Sessions",
        team: "Accounting Clinic",
        directorInitials: "KM",
        room: "Room",
        roomNumber: "201",
        notes: "Tax review",
      },
      {
        id: "2-2",
        activity: "Clinic Sessions",
        team: "Marketing Clinic",
        directorInitials: "CH",
        room: "Room",
        roomNumber: "202",
        notes: "",
      },
      {
        id: "2-3",
        activity: "Clinic Sessions",
        team: "Consulting Clinic",
        directorInitials: "NV",
        room: "Room",
        roomNumber: "203",
        notes: "",
      },
      {
        id: "2-4",
        activity: "Clinic Sessions",
        team: "Funding Clinic",
        directorInitials: "MD",
        room: "Room",
        roomNumber: "204",
        notes: "",
      },
    ],
  },
  {
    id: "3",
    time: "6:00 PM",
    activity: "Client Work Time",
    duration: 90,
    color: "amber",
    sessions: [
      {
        id: "3-1",
        activity: "Client Work Time",
        team: "All Teams",
        directorInitials: "All",
        room: "Various",
        roomNumber: "",
        notes: "Work with clients",
      },
    ],
  },
  {
    id: "4",
    time: "7:30 PM",
    activity: "Wrap Up",
    duration: 15,
    color: "slate",
    sessions: [
      {
        id: "4-1",
        activity: "Wrap Up",
        team: "All Teams",
        directorInitials: "NV",
        room: "Main",
        roomNumber: "101",
        notes: "Weekly summary & next steps",
      },
    ],
  },
]

const generateDefaultWeeks = (semester: string): Omit<WeekSchedule, "id" | "created_at" | "updated_at">[] => {
  const weeks = []
  // Fall 2025 semester starts around late August
  const startDate = new Date("2025-08-25")

  for (let i = 1; i <= 13; i++) {
    const weekStart = new Date(startDate)
    weekStart.setDate(startDate.getDate() + (i - 1) * 7)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)

    // Check for break weeks (e.g., Thanksgiving week 12)
    const isBreak = i === 12

    weeks.push({
      week_number: i,
      week_label: isBreak ? `Week ${i} - Thanksgiving Break` : `Week ${i}`,
      week_start: weekStart.toISOString().split("T")[0],
      week_end: weekEnd.toISOString().split("T")[0],
      session_focus: getWeekFocus(i),
      activities: [],
      assignments: [],
      notes: "",
      class_time_minutes: 90,
      clinic_time_minutes: 90,
      is_break: isBreak,
      semester,
      schedule_data: JSON.parse(JSON.stringify(defaultTimeBlocks)),
      zoom_link: "https://zoom.us/j/123456789",
    })
  }
  return weeks
}

const getWeekFocus = (week: number): string => {
  const focuses: Record<number, string> = {
    1: "Orientation & Team Formation",
    2: "Client Discovery & Needs Assessment",
    3: "Project Planning & SOW Development",
    4: "Research & Analysis",
    5: "Strategy Development",
    6: "Midpoint Review & Feedback",
    7: "Implementation Planning",
    8: "Progress Check-in",
    9: "Draft Deliverables",
    10: "Client Feedback Integration",
    11: "Final Deliverables Preparation",
    12: "Thanksgiving Break",
    13: "Final Presentations & Wrap Up",
  }
  return focuses[week] || ""
}

export function UnifiedWeeklyAgenda({ semester = "Fall 2025" }: UnifiedWeeklyAgendaProps) {
  const [schedules, setSchedules] = useState<WeekSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [openWeeks, setOpenWeeks] = useState<Set<number>>(new Set([1]))
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editingSession, setEditingSession] = useState<string | null>(null)
  const [showAddWeekDialog, setShowAddWeekDialog] = useState(false)
  const [showAddActivityDialog, setShowAddActivityDialog] = useState(false)
  const [showAddAssignmentDialog, setShowAddAssignmentDialog] = useState(false)
  const [activeWeekForDialog, setActiveWeekForDialog] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [publishSuccess, setPublishSuccess] = useState<number | null>(null)
  const [directors, setDirectors] = useState<Array<{ full_name: string; clinic: string }>>([])
  const [copied, setCopied] = useState(false)
  const [posting, setPosting] = useState(false) // Added posting state

  // New week form state
  const [newWeek, setNewWeek] = useState({
    week_number: 1,
    week_label: "",
    week_start: "",
    week_end: "",
    session_focus: "",
    is_break: false,
  })

  // New activity form state
  const [newActivity, setNewActivity] = useState<Omit<Activity, "id">>({
    time: "5:00 PM",
    title: "",
    description: "",
    duration: 30,
    type: "lecture",
  })

  // New assignment form state
  const [newAssignment, setNewAssignment] = useState<Omit<Assignment, "id">>({
    title: "",
    description: "",
    dueDate: "",
    type: "deliverable",
  })

  useEffect(() => {
    fetchSchedules()
    fetchDirectors()
  }, [semester])

  const fetchSchedules = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/semester-schedule?semester=${encodeURIComponent(semester)}`)
      const data = await response.json()
      if (data.schedules && data.schedules.length > 0) {
        // Initialize schedule_data with default time blocks if not present
        const schedulesWithTimeBlocks = data.schedules.map((s: WeekSchedule) => ({
          ...s,
          schedule_data: s.schedule_data || JSON.parse(JSON.stringify(defaultTimeBlocks)),
          zoom_link: s.zoom_link || "https://zoom.us/j/123456789",
        }))
        setSchedules(schedulesWithTimeBlocks)
        if (schedulesWithTimeBlocks.length > 0) {
          setOpenWeeks(new Set([schedulesWithTimeBlocks[0].week_number]))
        }
      } else {
        const defaultWeeks = generateDefaultWeeks(semester)
        // Create all weeks in database
        for (const week of defaultWeeks) {
          try {
            await fetch("/api/semester-schedule", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(week),
            })
          } catch (e) {
            console.error("Error creating week:", e)
          }
        }
        // Refetch to get the created weeks with IDs
        const refetchResponse = await fetch(`/api/semester-schedule?semester=${encodeURIComponent(semester)}`)
        const refetchData = await refetchResponse.json()
        if (refetchData.schedules) {
          const schedulesWithTimeBlocks = refetchData.schedules.map((s: WeekSchedule) => ({
            ...s,
            schedule_data: s.schedule_data || JSON.parse(JSON.stringify(defaultTimeBlocks)),
            zoom_link: s.zoom_link || "https://zoom.us/j/123456789",
          }))
          setSchedules(schedulesWithTimeBlocks)
          setOpenWeeks(new Set([1]))
        }
      }
    } catch (error) {
      console.error("Error fetching schedules:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDirectors = async () => {
    try {
      const response = await fetch("/api/directors")
      if (response.ok) {
        const data = await response.json()
        setDirectors(data.directors || [])
      }
    } catch (error) {
      console.error("Error fetching directors:", error)
    }
  }

  const getDirectorInitialsMap = (directors: Array<{ full_name: string; clinic: string }>) => {
    const map: Record<string, string> = {}
    directors.forEach((d) => {
      const names = d.full_name.split(" ")
      const initials = names.map((n) => n[0]?.toUpperCase() || "").join("")
      map[initials] = d.full_name
    })
    return map
  }

  const getDirectorName = (initials: string): string => {
    if (!initials) return ""
    const initialsMap = getDirectorInitialsMap(directors)
    const parts = initials.split("/")
    const names = parts.map((init) => {
      const upperInit = init.toUpperCase().trim()
      return initialsMap[upperInit] || init
    })
    return names.join(" & ")
  }

  const toggleWeek = (weekNumber: number) => {
    setOpenWeeks((prev) => {
      const next = new Set(prev)
      if (next.has(weekNumber)) {
        next.delete(weekNumber)
      } else {
        next.add(weekNumber)
      }
      return next
    })
  }

  const updateSchedule = async (weekId: string, updates: Partial<WeekSchedule>) => {
    setSaving(true)
    try {
      const response = await fetch("/api/semester-schedule", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: weekId, ...updates }),
      })
      const data = await response.json()
      if (data.schedule) {
        setSchedules(
          schedules.map((s) =>
            s.id === data.schedule.id
              ? { ...data.schedule, schedule_data: updates.schedule_data || s.schedule_data }
              : s,
          ),
        )
      }
    } catch (error) {
      console.error("Error updating schedule:", error)
    } finally {
      setSaving(false)
      setEditingField(null)
    }
  }

  const updateSessionInSchedule = (
    weekNumber: number,
    blockId: string,
    sessionId: string,
    field: keyof AgendaSession,
    value: string,
  ) => {
    setSchedules((prev) =>
      prev.map((schedule) => {
        if (schedule.week_number !== weekNumber) return schedule
        const updatedBlocks = (schedule.schedule_data || []).map((block) => {
          if (block.id !== blockId) return block
          return {
            ...block,
            sessions: block.sessions.map((session) => {
              if (session.id !== sessionId) return session
              return { ...session, [field]: value }
            }),
          }
        })
        return { ...schedule, schedule_data: updatedBlocks }
      }),
    )
  }

  const saveScheduleData = async (schedule: WeekSchedule) => {
    await updateSchedule(schedule.id, { schedule_data: schedule.schedule_data })
  }

  const addWeek = async () => {
    try {
      const response = await fetch("/api/semester-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newWeek,
          week_label: newWeek.week_label || `Week ${newWeek.week_number}`,
          activities: [],
          assignments: [],
          notes: "",
          class_time_minutes: 90,
          clinic_time_minutes: 90,
          semester,
          schedule_data: JSON.parse(JSON.stringify(defaultTimeBlocks)),
          zoom_link: "https://zoom.us/j/123456789",
        }),
      })
      const data = await response.json()
      if (data.schedule) {
        const newSchedule = {
          ...data.schedule,
          schedule_data: JSON.parse(JSON.stringify(defaultTimeBlocks)),
          zoom_link: "https://zoom.us/j/123456789",
        }
        setSchedules([...schedules, newSchedule].sort((a, b) => a.week_number - b.week_number))
        setOpenWeeks((prev) => new Set([...prev, newSchedule.week_number]))
        setShowAddWeekDialog(false)
        setNewWeek({
          week_number: schedules.length + 2,
          week_label: "",
          week_start: "",
          week_end: "",
          session_focus: "",
          is_break: false,
        })
      }
    } catch (error) {
      console.error("Error adding week:", error)
    }
  }

  const deleteWeek = async (id: string, weekNumber: number) => {
    if (!confirm("Are you sure you want to delete this week?")) return
    try {
      await fetch(`/api/semester-schedule?id=${id}`, { method: "DELETE" })
      const remaining = schedules.filter((s) => s.id !== id)
      setSchedules(remaining)
      setOpenWeeks((prev) => {
        const next = new Set(prev)
        next.delete(weekNumber)
        return next
      })
    } catch (error) {
      console.error("Error deleting week:", error)
    }
  }

  const addActivity = async () => {
    if (activeWeekForDialog === null || !newActivity.title) return
    const schedule = schedules.find((s) => s.week_number === activeWeekForDialog)
    if (!schedule) return

    const activity: Activity = {
      id: crypto.randomUUID(),
      ...newActivity,
    }
    const updatedActivities = [...(schedule.activities || []), activity]
    await updateSchedule(schedule.id, { activities: updatedActivities })
    setShowAddActivityDialog(false)
    setActiveWeekForDialog(null)
    setNewActivity({
      time: "5:00 PM",
      title: "",
      description: "",
      duration: 30,
      type: "lecture",
    })
  }

  const removeActivity = async (weekId: string, activityId: string) => {
    const schedule = schedules.find((s) => s.id === weekId)
    if (!schedule) return
    const updatedActivities = schedule.activities.filter((a) => a.id !== activityId)
    await updateSchedule(weekId, { activities: updatedActivities })
  }

  const addAssignment = async () => {
    if (activeWeekForDialog === null || !newAssignment.title) return
    const schedule = schedules.find((s) => s.week_number === activeWeekForDialog)
    if (!schedule) return

    const assignment: Assignment = {
      id: crypto.randomUUID(),
      ...newAssignment,
    }
    const updatedAssignments = [...(schedule.assignments || []), assignment]
    await updateSchedule(schedule.id, { assignments: updatedAssignments })
    setShowAddAssignmentDialog(false)
    setActiveWeekForDialog(null)
    setNewAssignment({
      title: "",
      description: "",
      dueDate: "",
      type: "deliverable",
    })
  }

  const removeAssignment = async (weekId: string, assignmentId: string) => {
    const schedule = schedules.find((s) => s.id === weekId)
    if (!schedule) return
    const updatedAssignments = schedule.assignments.filter((a) => a.id !== assignmentId)
    await updateSchedule(weekId, { assignments: updatedAssignments })
  }

  const handlePublishAgenda = async (schedule: WeekSchedule) => {
    setPublishing(true)
    try {
      const res = await fetch("/api/published-agendas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schedule_date: schedule.week_start || new Date().toISOString().split("T")[0],
          director_name: "Nick Vadala",
          zoom_link: schedule.zoom_link || "https://zoom.us/j/123456789",
          schedule_data: schedule.schedule_data,
          notes: schedule.notes,
          published_by: "director@example.com",
        }),
      })

      if (res.ok) {
        setPublishSuccess(schedule.week_number)
        setTimeout(() => setPublishSuccess(null), 3000)
      }
    } catch (error) {
      console.error("Error publishing agenda:", error)
    } finally {
      setPublishing(false)
    }
  }

  const copyZoomLink = (link: string) => {
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  }

  const getBlockHeaderColor = (color: string) => {
    switch (color) {
      case "slate":
        return "bg-slate-700 text-white"
      case "blue":
        return "bg-blue-900 text-white"
      case "amber":
        return "bg-amber-900 text-white"
      case "teal":
        return "bg-teal-900 text-white" // Added teal color
      default:
        return "bg-slate-700 text-white"
    }
  }

  // Function to handle posting to students (formerly handlePublishAgenda)
  const handlePostToStudents = async (weekNumber: number) => {
    setPosting(true)
    const currentSchedule = schedules.find((s) => s.week_number === weekNumber)
    if (!currentSchedule) {
      setPosting(false)
      return
    }

    try {
      const res = await fetch("/api/published-agendas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schedule_date: currentSchedule.week_start || new Date().toISOString().split("T")[0],
          director_name: "Nick Vadala", // Placeholder, consider fetching dynamically
          zoom_link: currentSchedule.zoom_link || "https://zoom.us/j/123456789",
          schedule_data: currentSchedule.schedule_data,
          notes: currentSchedule.notes,
          published_by: "director@example.com", // Placeholder, consider fetching dynamically
        }),
      })

      if (res.ok) {
        // Use a more general success indicator or remove the week-specific success state
        // For now, let's simulate a success feedback
        console.log(`Agenda for Week ${weekNumber} posted successfully.`)
        // Optionally, update UI to reflect posting status or show a toast
      } else {
        console.error(`Failed to post agenda for Week ${weekNumber}.`)
        // Handle error feedback
      }
    } catch (error) {
      console.error(`Error posting agenda for Week ${weekNumber}:`, error)
      // Handle network or other errors
    } finally {
      setPosting(false)
    }
  }

  if (loading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-8 text-center text-muted-foreground">
          <div className="animate-pulse">Loading weekly agendas...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="border-b bg-muted/30 rounded-t-lg py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Unified Course & Weekly Agenda - {semester}
            </CardTitle>
            <Dialog open={showAddWeekDialog} onOpenChange={setShowAddWeekDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Week
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Week</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Week Number</Label>
                      <Input
                        type="number"
                        value={newWeek.week_number}
                        onChange={(e) => setNewWeek({ ...newWeek, week_number: Number.parseInt(e.target.value) })}
                        min={1}
                        max={16}
                      />
                    </div>
                    <div>
                      <Label>Week Label</Label>
                      <Input
                        value={newWeek.week_label}
                        onChange={(e) => setNewWeek({ ...newWeek, week_label: e.target.value })}
                        placeholder={`Week ${newWeek.week_number}`}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={newWeek.week_start}
                        onChange={(e) => setNewWeek({ ...newWeek, week_start: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={newWeek.week_end}
                        onChange={(e) => setNewWeek({ ...newWeek, week_end: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Session Focus / Topic</Label>
                    <Input
                      value={newWeek.session_focus}
                      onChange={(e) => setNewWeek({ ...newWeek, session_focus: e.target.value })}
                      placeholder="e.g., Project Planning & SOW Development"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={newWeek.is_break}
                      onCheckedChange={(checked) => setNewWeek({ ...newWeek, is_break: checked })}
                    />
                    <Label>This is a break week (no class)</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddWeekDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={addWeek}>Add Week</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {schedules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No weeks added yet. Click "Add Week" to create your course schedule.</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Click on each week to expand and view/edit the course agenda and clinic schedule.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Week Dropdowns */}
      {schedules.map((schedule) => (
        <Collapsible
          key={schedule.id}
          open={openWeeks.has(schedule.week_number)}
          onOpenChange={() => toggleWeek(schedule.week_number)}
        >
          <Card className={`border-0 shadow-sm overflow-hidden ${schedule.is_break ? "bg-amber-50/50" : ""}`}>
            {/* Week Header - Collapsible Trigger */}
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  {openWeeks.has(schedule.week_number) ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div className="flex items-center gap-2">
                    {schedule.is_break && <Coffee className="h-4 w-4 text-amber-600" />}
                    <span className="font-semibold text-lg">
                      {schedule.week_label || `Week ${schedule.week_number}`}
                    </span>
                    {schedule.is_break && <Badge className="bg-amber-100 text-amber-800 border-amber-200">Break</Badge>}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(schedule.week_start)} - {formatDate(schedule.week_end)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {schedule.session_focus && (
                    <Badge variant="secondary" className="font-normal">
                      {schedule.session_focus}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {schedule.activities?.length || 0} activities
                  </Badge>
                </div>
              </div>
            </CollapsibleTrigger>

            {/* Collapsible Content */}
            <CollapsibleContent>
              <div className="border-t">
                {/* Course Agenda Section */}
                <div className="p-4 space-y-4 bg-white">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Course Agenda
                    </h3>
                    <div className="flex gap-2">
                      <Dialog
                        open={showAddActivityDialog && activeWeekForDialog === schedule.week_number}
                        onOpenChange={(open) => {
                          setShowAddActivityDialog(open)
                          if (open) setActiveWeekForDialog(schedule.week_number)
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" className="gap-1 h-7 text-xs bg-transparent">
                            <Plus className="h-3 w-3" />
                            Activity
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add Activity</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 mt-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Time</Label>
                                <Input
                                  value={newActivity.time}
                                  onChange={(e) => setNewActivity({ ...newActivity, time: e.target.value })}
                                  placeholder="5:00 PM"
                                />
                              </div>
                              <div>
                                <Label>Duration (min)</Label>
                                <Input
                                  type="number"
                                  value={newActivity.duration}
                                  onChange={(e) =>
                                    setNewActivity({ ...newActivity, duration: Number.parseInt(e.target.value) })
                                  }
                                  min={5}
                                  max={180}
                                />
                              </div>
                            </div>
                            <div>
                              <Label>Title</Label>
                              <Input
                                value={newActivity.title}
                                onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
                                placeholder="Activity title"
                              />
                            </div>
                            <div>
                              <Label>Type</Label>
                              <Select
                                value={newActivity.type}
                                onValueChange={(v: any) => setNewActivity({ ...newActivity, type: v })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="lecture">Lecture</SelectItem>
                                  <SelectItem value="workshop">Workshop</SelectItem>
                                  <SelectItem value="meeting">Meeting</SelectItem>
                                  <SelectItem value="break">Break</SelectItem>
                                  <SelectItem value="presentation">Presentation</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Description</Label>
                              <Textarea
                                value={newActivity.description}
                                onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                                placeholder="Optional description"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setShowAddActivityDialog(false)}>
                              Cancel
                            </Button>
                            <Button onClick={addActivity}>Add Activity</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Dialog
                        open={showAddAssignmentDialog && activeWeekForDialog === schedule.week_number}
                        onOpenChange={(open) => {
                          setShowAddAssignmentDialog(open)
                          if (open) setActiveWeekForDialog(schedule.week_number)
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" className="gap-1 h-7 text-xs bg-transparent">
                            <Plus className="h-3 w-3" />
                            Assignment
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add Assignment</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 mt-4">
                            <div>
                              <Label>Title</Label>
                              <Input
                                value={newAssignment.title}
                                onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                                placeholder="Assignment title"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Type</Label>
                                <Select
                                  value={newAssignment.type}
                                  onValueChange={(v: any) => setNewAssignment({ ...newAssignment, type: v })}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="reading">Reading</SelectItem>
                                    <SelectItem value="deliverable">Deliverable</SelectItem>
                                    <SelectItem value="quiz">Quiz</SelectItem>
                                    <SelectItem value="presentation">Presentation</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Due Date</Label>
                                <Input
                                  type="date"
                                  value={newAssignment.dueDate}
                                  onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                                />
                              </div>
                            </div>
                            <div>
                              <Label>Description</Label>
                              <Textarea
                                value={newAssignment.description}
                                onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                                placeholder="Optional description"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setShowAddAssignmentDialog(false)}>
                              Cancel
                            </Button>
                            <Button onClick={addAssignment}>Add Assignment</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7"
                        onClick={() => deleteWeek(schedule.id, schedule.week_number)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Activities & Assignments Grid */}
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Activities */}
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground">Activities</Label>
                      {(schedule.activities || []).length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">No activities added</p>
                      ) : (
                        <div className="space-y-2">
                          {schedule.activities.map((activity) => (
                            <div
                              key={activity.id}
                              className={`flex items-center justify-between p-2 rounded-md border ${activityTypeColors[activity.type]}`}
                            >
                              <div className="flex items-center gap-2">
                                <Clock className="h-3 w-3" />
                                <span className="text-xs font-medium">{activity.time}</span>
                                <span className="text-sm">{activity.title}</span>
                                <Badge variant="outline" className="text-xs">
                                  {activity.duration}m
                                </Badge>
                              </div>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => removeActivity(schedule.id, activity.id)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Assignments */}
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground">Assignments</Label>
                      {(schedule.assignments || []).length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">No assignments added</p>
                      ) : (
                        <div className="space-y-2">
                          {schedule.assignments.map((assignment) => (
                            <div
                              key={assignment.id}
                              className={`flex items-center justify-between p-2 rounded-md border ${assignmentTypeColors[assignment.type]}`}
                            >
                              <div className="flex items-center gap-2">
                                <FileText className="h-3 w-3" />
                                <span className="text-sm">{assignment.title}</span>
                                {assignment.dueDate && (
                                  <Badge variant="outline" className="text-xs">
                                    Due: {formatDate(assignment.dueDate)}
                                  </Badge>
                                )}
                              </div>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => removeAssignment(schedule.id, assignment.id)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">Week Notes</Label>
                    <Textarea
                      value={schedule.notes || ""}
                      onChange={(e) =>
                        setSchedules(schedules.map((s) => (s.id === schedule.id ? { ...s, notes: e.target.value } : s)))
                      }
                      onBlur={() => updateSchedule(schedule.id, { notes: schedule.notes })}
                      placeholder="Add notes for this week..."
                      className="mt-1"
                      rows={2}
                    />
                  </div>
                </div>

                {/* Clinic Schedule Section */}
                {!schedule.is_break && (
                  <div className="border-t">
                    <div className="bg-slate-800 text-white p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Users className="h-5 w-5" />
                          <div>
                            <h3 className="font-semibold">SEED Clinic Schedule</h3>
                            <p className="text-slate-300 text-xs">
                              {formatDate(schedule.week_start)} • Director: Nick Vadala
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handlePostToStudents(schedule.week_number)} // Corrected to use handlePostToStudents
                            disabled={posting}
                            className="gap-2 font-medium h-8 text-xs"
                          >
                            {posting ? (
                              "Publishing..."
                            ) : (
                              <>
                                <Send className="h-3 w-3" />
                                Post to Students
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => copyZoomLink(schedule.zoom_link || "")}
                            className="gap-2 font-medium h-8 text-xs"
                          >
                            {copied ? <Check className="h-3 w-3" /> : <Video className="h-3 w-3" />}
                            {copied ? "Copied!" : "Copy Zoom"}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Schedule Grid */}
                    <div>
                      <div className="grid grid-cols-12 gap-0 bg-slate-100 border-b text-xs font-bold text-slate-600 uppercase tracking-wider">
                        <div className="col-span-3 p-3">Team</div>
                        <div className="col-span-4 p-3">Director</div>
                        <div className="col-span-2 p-3">Location</div>
                        <div className="col-span-2 p-3">Notes</div>
                        <div className="col-span-1 p-3"></div>
                      </div>

                      {(schedule.schedule_data || []).map((block) => (
                        <div key={block.id}>
                          <div
                            className={`${getBlockHeaderColor(block.color)} px-3 py-2 flex items-center justify-between`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-bold">{block.time}</span>
                              <span className="text-white/90 text-sm">{block.activity}</span>
                            </div>
                            <Badge className="bg-white/20 text-white border-0 text-xs">{block.duration} min</Badge>
                          </div>

                          {block.sessions.map((session, idx) => (
                            <div
                              key={session.id}
                              className={`grid grid-cols-12 gap-0 items-center text-sm border-b last:border-b-0 group ${
                                idx % 2 === 0 ? "bg-white" : "bg-slate-50"
                              }`}
                            >
                              {editingSession === `${schedule.id}-${session.id}` ? (
                                <>
                                  <div className="col-span-3 p-3 font-medium text-slate-800">
                                    <Input
                                      value={session.team}
                                      onChange={(e) =>
                                        updateSessionInSchedule(
                                          schedule.week_number,
                                          block.id,
                                          session.id,
                                          "team",
                                          e.target.value,
                                        )
                                      }
                                      className="h-7 text-xs"
                                    />
                                  </div>
                                  <div className="col-span-4 p-3 text-slate-600">
                                    <Input
                                      value={getDirectorName(session.directorInitials)} // Display current name for editing
                                      onChange={(e) => {
                                        /* Logic to update directorInitials based on input might be complex */
                                      }}
                                      className="h-7 text-xs"
                                      placeholder="Director Initials" // Or logic to select director
                                    />
                                  </div>
                                  <div className="col-span-2 p-2">
                                    <div className="flex gap-1">
                                      <Input
                                        value={session.room}
                                        onChange={(e) =>
                                          updateSessionInSchedule(
                                            schedule.week_number,
                                            block.id,
                                            session.id,
                                            "room",
                                            e.target.value,
                                          )
                                        }
                                        className="h-7 text-xs"
                                        placeholder="Room"
                                      />
                                      <Input
                                        value={session.roomNumber}
                                        onChange={(e) =>
                                          updateSessionInSchedule(
                                            schedule.week_number,
                                            block.id,
                                            session.id,
                                            "roomNumber",
                                            e.target.value,
                                          )
                                        }
                                        className="h-7 text-xs w-12"
                                        placeholder="#"
                                      />
                                    </div>
                                  </div>
                                  <div className="col-span-2 p-2">
                                    <Input
                                      value={session.notes}
                                      onChange={(e) =>
                                        updateSessionInSchedule(
                                          schedule.week_number,
                                          block.id,
                                          session.id,
                                          "notes",
                                          e.target.value,
                                        )
                                      }
                                      className="h-7 text-xs"
                                      placeholder="Notes"
                                    />
                                  </div>
                                  <div className="col-span-1 p-2 flex justify-end">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 w-7 p-0"
                                      onClick={() => {
                                        // Save the current state of schedule_data which was updated in memory
                                        saveScheduleData(schedule)
                                        setEditingSession(null)
                                      }}
                                    >
                                      <Check className="h-3 w-3 text-green-600" />
                                    </Button>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="col-span-3 p-3 font-medium text-slate-800 text-xs">
                                    {session.team}
                                  </div>
                                  <div className="col-span-4 p-3 text-slate-600 text-xs">
                                    {getDirectorName(session.directorInitials) || session.directorInitials}
                                  </div>
                                  <div className="col-span-2 p-3 text-xs">
                                    <span className="text-slate-600">{session.room}</span>
                                    <span className="text-slate-400 ml-1">#{session.roomNumber}</span>
                                  </div>
                                  <div className="col-span-2 p-3 text-slate-500 text-xs italic">
                                    {session.notes || "—"}
                                  </div>
                                  <div className="col-span-1 p-2 flex justify-end">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 w-7 p-0"
                                      onClick={() => setEditingSession(`${schedule.id}-${session.id}`)}
                                    >
                                      <Pencil className="h-3 w-3 text-slate-400" />
                                    </Button>
                                  </div>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      ))}

      {/* Removed redundant Card/CardContent */}
    </div>
  )
}
