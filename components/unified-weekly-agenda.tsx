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
  Loader2,
  MapPin,
  Save,
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
  file_url?: string // Added file attachment state for assignments
  file_name?: string // Added file attachment state for assignments
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
  activity: string // Changed from title to activity for clarity
  duration: number
  color: string
  sessions: AgendaSession[]
}

interface ScheduleDataItem {
  start_time: string
  end_time: string
  minutes: number
  activity: string
  room_assignment?: string // Added room_assignment
  zoom_link?: string // Added zoom_link
}

// Added ClientMeeting interface
interface ClientMeeting {
  id: string
  semester_schedule_id: string
  semester_id: string
  week_number: number
  week_label: string
  week_start: string
  week_end: string
  client_name: string
  client_id: string
  primary_director_id: string
  start_time: string
  end_time: string
  minutes: number
  room_assignment?: string
  zoom_link?: string
  notes?: string
}

interface WeekSchedule {
  id: string
  week_number: number
  week_label: string
  week_start: string
  week_end: string
  session_focus: string
  activities: TimeBlock[] // Renamed from schedule_data to activities for TimeBlocks
  assignments: Assignment[]
  notes: string
  class_time_minutes: number
  clinic_time_minutes: number
  is_break: boolean
  semester: string
  zoom_link?: string
  room_assignment?: string // Added room_assignment
  created_at: string
  updated_at: string
  schedule_data?: ScheduleDataItem[] // Kept for original schedule data
}

interface UnifiedWeeklyAgendaProps {
  semester?: string
  isStudentView?: boolean // Added for student view
  studentClinic?: string // Added for student specific clinic view
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
    activity: "All Hands", // Changed from title to activity
    duration: 15,
    color: "blue", // Corresponds to lecture type for color
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
    activity: "Clinic Sessions", // Changed from title to activity
    duration: 45,
    color: "teal", // Corresponds to meeting type for color
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
    activity: "Client Work Time", // Changed from title to activity
    duration: 90,
    color: "amber", // Corresponds to break type for color
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
    activity: "Wrap Up", // Changed from title to activity
    duration: 15,
    color: "slate", // Corresponds to other type for color
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
  // Spring 2026 semester starts January 12, 2026
  const startDate = new Date("2026-01-12")

  for (let i = 1; i <= 14; i++) {
    const weekStart = new Date(startDate)
    weekStart.setDate(startDate.getDate() + (i - 1) * 7)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)

    // Spring Break (week 6)
    const isBreak = i === 6

    weeks.push({
      week_number: i,
      week_label: isBreak ? `Week ${i} - Spring Break` : `Week ${i}`,
      week_start: weekStart.toISOString().split("T")[0],
      week_end: weekEnd.toISOString().split("T")[0],
      session_focus: getWeekFocus(i),
      activities: [], // Now stores TimeBlocks, not schedule_data directly
      assignments: [],
      notes: "",
      class_time_minutes: 90,
      clinic_time_minutes: 90,
      is_break: isBreak,
      semester,
      // schedule_data: JSON.parse(JSON.stringify(defaultTimeBlocks)), // No longer directly assigning schedule_data here
      zoom_link: "https://zoom.us/j/123456789",
      room_assignment: "Main Classroom", // Default room assignment for the week
    })
  }
  return weeks
}

const getWeekFocus = (week: number): string => {
  return "" // Return empty to let database values take precedence
}

export function UnifiedWeeklyAgenda({
  semester = "Spring 2026",
  isStudentView = false,
  studentClinic,
}: UnifiedWeeklyAgendaProps) {
  const [schedules, setSchedules] = useState<WeekSchedule[]>([])
  const [clientMeetings, setClientMeetings] = useState<ClientMeeting[]>([]) // State for client meetings
  const [loading, setLoading] = useState(true)
  const [openWeeks, setOpenWeeks] = useState<Set<number>>(new Set([1]))
  // const [editingField, setEditingField] = useState<string | null>(null) // Removed unused state
  // const [editingSession, setEditingSession] = useState<string | null>(null) // Removed unused state
  const [showAddWeekDialog, setShowAddWeekDialog] = useState(false)
  const [showAddActivityDialog, setShowAddActivityDialog] = useState(false) // This is for adding TimeBlocks
  const [showAddAssignmentDialog, setShowAddAssignmentDialog] = useState(false)
  const [showEditScheduleDialog, setShowEditScheduleDialog] = useState(false) // Dialog for editing schedule_data items
  const [editingScheduleItem, setEditingScheduleItem] = useState<{
    scheduleId: string
    index: number
    item: ScheduleDataItem
  } | null>(null) // State for editing schedule_data items
  const [activeWeekForDialog, setActiveWeekForDialog] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [publishSuccess, setPublishSuccess] = useState<number | null>(null) // Removed unused state
  const [directors, setDirectors] = useState<Array<{ full_name: string; clinic: string }>>([]) // Removed unused state
  const [copied, setCopied] = useState(false)
  const [posting, setPosting] = useState(false) // Added posting state

  const [assignmentFile, setAssignmentFile] = useState<File | null>(null)
  const [uploadingAssignment, setUploadingAssignment] = useState(false)

  // New week form state
  const [newWeek, setNewWeek] = useState({
    week_number: 1,
    week_label: "",
    week_start: "",
    week_end: "",
    session_focus: "",
    is_break: false,
  })

  // New activity form state (renamed to newTimeBlock for clarity)
  const [newTimeBlock, setNewTimeBlock] = useState<Omit<TimeBlock, "id" | "sessions">>({
    time: "5:00 PM",
    activity: "", // Changed from title to activity
    duration: 30,
    color: "blue", // Default color, maps to lecture type
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
    // fetchDirectors() // Removed unused fetch
    fetchClientMeetings() // Added fetch for client meetings
  }, [semester])

  const fetchSchedules = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/semester-schedule?semester=${encodeURIComponent(semester)}`)
      const data = await response.json()
      if (data.schedules && data.schedules.length > 0) {
        // Initialize activities with default time blocks if not present
        const schedulesWithActivities = data.schedules.map((s: WeekSchedule) => ({
          ...s,
          // Ensure 'activities' array exists, using defaultTimeBlocks if empty
          activities:
            s.activities && s.activities.length > 0 ? s.activities : JSON.parse(JSON.stringify(defaultTimeBlocks)),
          // schedule_data: s.schedule_data || [], // Ensure schedule_data is initialized
          zoom_link: s.zoom_link || "https://zoom.us/j/123456789",
          room_assignment: s.room_assignment || "Main Classroom", // Default room assignment
        }))
        setSchedules(schedulesWithActivities)
        if (schedulesWithActivities.length > 0) {
          setOpenWeeks(new Set([schedulesWithActivities[0].week_number]))
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
          const schedulesWithActivities = refetchData.schedules.map((s: WeekSchedule) => ({
            ...s,
            activities: s.activities || JSON.parse(JSON.stringify(defaultTimeBlocks)),
            // schedule_data: s.schedule_data || [],
            zoom_link: s.zoom_link || "https://zoom.us/j/123456789",
            room_assignment: s.room_assignment || "Main Classroom",
          }))
          setSchedules(schedulesWithActivities)
          setOpenWeeks(new Set([1]))
        }
      }
    } catch (error) {
      console.error("Error fetching schedules:", error)
    } finally {
      setLoading(false)
    }
  }

  // Removed fetchDirectors as it's no longer used

  const fetchClientMeetings = async () => {
    try {
      // Assuming a placeholder semester ID for fetching client meetings
      // In a real app, this would likely be dynamic or passed as a prop
      const semesterId = "a1b2c3d4-e5f6-7890-abcd-202601120000" // Placeholder
      const res = await fetch(`/api/scheduled-client-meetings?semesterId=${encodeURIComponent(semesterId)}`)
      if (res.ok) {
        const data = await res.json()
        setClientMeetings(data.meetings || [])
      }
    } catch (error) {
      console.error("Error fetching client meetings:", error)
    }
  }

  // Function to get client meetings for a specific week
  const getMeetingsForWeek = (weekNumber: number) => {
    return clientMeetings.filter((m) => m.week_number === weekNumber)
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

  // Updated to save schedule_data (class schedule)
  const updateScheduleData = async (scheduleId: string, newScheduleData: ScheduleDataItem[]) => {
    setSaving(true)
    try {
      const response = await fetch("/api/semester-schedule", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: scheduleId, schedule_data: newScheduleData }),
      })
      const data = await response.json()
      if (data.schedule) {
        setSchedules(
          schedules.map((s) => (s.id === data.schedule.id ? { ...data.schedule, schedule_data: newScheduleData } : s)),
        )
      }
    } catch (error) {
      console.error("Error updating schedule data:", error)
    } finally {
      setSaving(false)
      // setEditingField(null) // No longer relevant for schedule_data editing here
    }
  }

  const updateScheduleDataItem = async (scheduleId: string, index: number, updatedItem: ScheduleDataItem) => {
    setSaving(true)
    try {
      const schedule = schedules.find((s) => s.id === scheduleId)
      if (!schedule || !schedule.schedule_data) return

      const newScheduleData = [...schedule.schedule_data]
      newScheduleData[index] = updatedItem

      const res = await fetch("/api/semester-schedule", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: scheduleId,
          schedule_data: newScheduleData,
        }),
      })

      if (res.ok) {
        setSchedules(schedules.map((s) => (s.id === scheduleId ? { ...s, schedule_data: newScheduleData } : s)))
        setShowEditScheduleDialog(false)
        setEditingScheduleItem(null)
      }
    } catch (error) {
      console.error("Error updating schedule data:", error)
    } finally {
      setSaving(false)
    }
  }

  const addScheduleDataItem = async (scheduleId: string, newItem: ScheduleDataItem) => {
    setSaving(true)
    try {
      const schedule = schedules.find((s) => s.id === scheduleId)
      if (!schedule) return

      const newScheduleData = [...(schedule.schedule_data || []), newItem]

      const res = await fetch("/api/semester-schedule", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: scheduleId,
          schedule_data: newScheduleData,
        }),
      })

      if (res.ok) {
        setSchedules(schedules.map((s) => (s.id === scheduleId ? { ...s, schedule_data: newScheduleData } : s)))
      }
    } catch (error) {
      console.error("Error adding schedule data:", error)
    } finally {
      setSaving(false)
    }
  }

  const deleteScheduleDataItem = async (scheduleId: string, index: number) => {
    setSaving(true)
    try {
      const schedule = schedules.find((s) => s.id === scheduleId)
      if (!schedule || !schedule.schedule_data) return

      const newScheduleData = schedule.schedule_data.filter((_, i) => i !== index)

      const res = await fetch("/api/semester-schedule", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: scheduleId,
          schedule_data: newScheduleData,
        }),
      })

      if (res.ok) {
        setSchedules(schedules.map((s) => (s.id === scheduleId ? { ...s, schedule_data: newScheduleData } : s)))
      }
    } catch (error) {
      console.error("Error deleting schedule data:", error)
    } finally {
      setSaving(false)
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
        const updatedBlocks = (schedule.activities || []).map((block) => {
          // Use 'activities' for TimeBlocks
          if (block.id !== blockId) return block
          return {
            ...block,
            sessions: block.sessions.map((session) => {
              if (session.id !== sessionId) return session
              return { ...session, [field]: value }
            }),
          }
        })
        return { ...schedule, activities: updatedBlocks } // Use 'activities' for TimeBlocks
      }),
    )
  }

  const saveScheduleData = async (schedule: WeekSchedule) => {
    // This function seems to be for saving changes made in memory for 'activities' (TimeBlocks)
    // It updates the backend with the current state of activities.
    await updateSchedule(schedule.id, { activities: schedule.activities })
  }

  // Generic update function for WeekSchedule, can be used for notes, zoom_link, etc.
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
              ? { ...data.schedule, activities: updates.activities || s.activities } // Ensure 'activities' is updated correctly
              : s,
          ),
        )
      }
    } catch (error) {
      console.error("Error updating schedule:", error)
    } finally {
      setSaving(false)
      // setEditingField(null) // Removed
    }
  }

  const addWeek = async () => {
    try {
      const response = await fetch("/api/semester-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newWeek,
          week_label: newWeek.week_label || `Week ${newWeek.week_number}`,
          activities: [], // Initialize with empty activities (TimeBlocks)
          assignments: [],
          notes: "",
          class_time_minutes: 90,
          clinic_time_minutes: 90,
          semester,
          // schedule_data: JSON.parse(JSON.stringify(defaultTimeBlocks)), // Not directly assigning schedule_data here
          zoom_link: "https://zoom.us/j/123456789", // Default zoom link
          room_assignment: "Main Classroom", // Default room assignment
        }),
      })
      const data = await response.json()
      if (data.schedule) {
        const newSchedule = {
          ...data.schedule,
          activities: JSON.parse(JSON.stringify(defaultTimeBlocks)), // Initialize activities with default TimeBlocks
          // schedule_data: [], // Initialize schedule_data as empty
          zoom_link: "https://zoom.us/j/123456789",
          room_assignment: "Main Classroom",
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

  // Renamed addActivity to addTimeBlock to match the interface change
  const addTimeBlock = async () => {
    if (activeWeekForDialog === null || !newTimeBlock.activity) return // Check for 'activity' which is the title
    const schedule = schedules.find((s) => s.week_number === activeWeekForDialog)
    if (!schedule) return

    const timeBlockToAdd: TimeBlock = {
      id: crypto.randomUUID(),
      ...newTimeBlock,
      sessions: [
        // Default session for a new time block
        {
          id: `${crypto.randomUUID()}-session`,
          activity: newTimeBlock.activity, // Use the activity as the session activity
          team: "All Teams",
          directorInitials: "",
          room: "",
          roomNumber: "",
          notes: "",
        },
      ],
    }
    const updatedTimeBlocks = [...(schedule.activities || []), timeBlockToAdd] // Use 'activities' for TimeBlocks
    await updateSchedule(schedule.id, { activities: updatedTimeBlocks }) // Use 'activities' for TimeBlocks
    setShowAddActivityDialog(false) // Close dialog after adding
    setActiveWeekForDialog(null)
    setNewTimeBlock({
      // Reset newTimeBlock form
      time: "5:00 PM",
      activity: "",
      duration: 30,
      color: "blue",
    })
  }

  // Modified to remove a specific session from a TimeBlock
  const removeActivity = async (weekId: string, blockId: string, sessionId: string) => {
    const schedule = schedules.find((s) => s.id === weekId)
    if (!schedule) return

    const updatedTimeBlocks = (schedule.activities || [])
      .map((block) => {
        // Use 'activities' for TimeBlocks
        if (block.id !== blockId) return block
        return {
          ...block,
          sessions: block.sessions.filter((session) => session.id !== sessionId),
        }
      })
      .filter((block) => block.sessions.length > 0) // Remove block if it has no sessions left

    await updateSchedule(weekId, { activities: updatedTimeBlocks }) // Use 'activities' for TimeBlocks
  }

  const addAssignment = async () => {
    if (!newAssignment.title || !activeWeekForDialog) return

    setSaving(true)
    try {
      let fileUrl = ""
      let fileName = ""

      // Upload file if provided
      if (assignmentFile) {
        setUploadingAssignment(true)
        const formData = new FormData()
        formData.append("file", assignmentFile)
        formData.append("title", newAssignment.title)
        formData.append("description", newAssignment.description || "")
        formData.append("category", "assignment")
        formData.append("targetClinic", "all")
        formData.append("uploadedByName", "Program Director") // Placeholder
        formData.append("uploadedByEmail", "director@example.com") // Placeholder

        const uploadRes = await fetch("/api/course-materials", {
          method: "POST",
          body: formData,
        })

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json()
          fileUrl = uploadData.material?.file_url || ""
          fileName = uploadData.material?.file_name || assignmentFile.name
        } else {
          console.error("File upload failed:", await uploadRes.text())
        }
        setUploadingAssignment(false)
      }

      const assignment: Assignment = {
        id: `assignment-${Date.now()}`,
        ...newAssignment,
        file_url: fileUrl,
        file_name: fileName,
      }

      const schedule = schedules.find((s) => s.week_number === activeWeekForDialog)
      if (!schedule) return

      const updatedAssignments = [...(schedule.assignments || []), assignment]

      // Save to database
      const res = await fetch("/api/semester-schedule", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: schedule.id,
          assignments: updatedAssignments,
        }),
      })

      if (res.ok) {
        setSchedules(
          schedules.map((s) => (s.week_number === activeWeekForDialog ? { ...s, assignments: updatedAssignments } : s)),
        )
      } else {
        console.error("Failed to update assignments in database.")
      }

      // Reset form
      setNewAssignment({ title: "", description: "", dueDate: "", type: "deliverable" })
      setAssignmentFile(null)
      setShowAddAssignmentDialog(false)
    } catch (error) {
      console.error("Error adding assignment:", error)
    } finally {
      setSaving(false)
      setUploadingAssignment(false)
    }
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
          director_name: "Nick Vadala", // Placeholder, consider fetching dynamically
          zoom_link: schedule.zoom_link || "https://zoom.us/j/123456789",
          schedule_data: schedule.activities, // Use 'activities' for TimeBlocks
          notes: schedule.notes,
          published_by: "director@example.com", // Placeholder, consider fetching dynamically
        }),
      })

      if (res.ok) {
        setPublishSuccess(schedule.week_number)
        setTimeout(() => setPublishSuccess(null), 3000)
      } else {
        console.error("Failed to publish agenda.")
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
          schedule_data: currentSchedule.activities, // Use 'activities' for TimeBlocks
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
                    {schedule.activities?.length || 0} activities {/* Count TimeBlocks */}
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
                            Activity {/* This button adds a TimeBlock */}
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add Time Block</DialogTitle> {/* Updated Title */}
                          </DialogHeader>
                          <div className="space-y-4 mt-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Time</Label>
                                <Input
                                  value={newTimeBlock.time}
                                  onChange={(e) => setNewTimeBlock({ ...newTimeBlock, time: e.target.value })}
                                  placeholder="5:00 PM"
                                />
                              </div>
                              <div>
                                <Label>Duration (min)</Label>
                                <Input
                                  type="number"
                                  value={newTimeBlock.duration}
                                  onChange={(e) =>
                                    setNewTimeBlock({ ...newTimeBlock, duration: Number.parseInt(e.target.value) })
                                  }
                                  min={5}
                                  max={180}
                                />
                              </div>
                            </div>
                            <div>
                              <Label>Activity Title</Label> {/* Changed from Title to Activity Title */}
                              <Input
                                value={newTimeBlock.activity}
                                onChange={(e) => setNewTimeBlock({ ...newTimeBlock, activity: e.target.value })}
                                placeholder="e.g., Lecture, Workshop"
                              />
                            </div>
                            <div>
                              <Label>Type (Color)</Label> {/* This selects the color for the TimeBlock */}
                              <Select
                                value={newTimeBlock.color}
                                onValueChange={(v: string) => setNewTimeBlock({ ...newTimeBlock, color: v })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="blue">Lecture</SelectItem>
                                  <SelectItem value="purple">Workshop</SelectItem>
                                  <SelectItem value="green">Meeting</SelectItem>
                                  <SelectItem value="amber">Break</SelectItem>
                                  <SelectItem value="pink">Presentation</SelectItem>
                                  <SelectItem value="slate">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setShowAddActivityDialog(false)}>
                              Cancel
                            </Button>
                            <Button onClick={addTimeBlock}>Add Time Block</Button> {/* Changed function name */}
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <Dialog
                        open={showAddAssignmentDialog && activeWeekForDialog === schedule.week_number}
                        onOpenChange={(open) => {
                          setShowAddAssignmentDialog(open)
                          if (open) setActiveWeekForDialog(schedule.week_number)
                          if (!open) setAssignmentFile(null) // Reset file upload on close
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

                            <div>
                              <Label>Attachment (Optional)</Label>
                              <div className="mt-1 border-2 border-dashed border-slate-200 rounded-lg p-3 text-center hover:border-slate-400 transition-colors">
                                <Input
                                  type="file"
                                  onChange={(e) => setAssignmentFile(e.target.files?.[0] || null)}
                                  className="cursor-pointer text-sm"
                                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                                />
                                {assignmentFile && (
                                  <p className="text-xs text-muted-foreground mt-1">{assignmentFile.name}</p>
                                )}
                              </div>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setShowAddAssignmentDialog(false)
                                setAssignmentFile(null) // Reset file upload on cancel
                              }}
                            >
                              Cancel
                            </Button>
                            <Button onClick={addAssignment} disabled={saving || uploadingAssignment}>
                              {uploadingAssignment ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Uploading...
                                </>
                              ) : saving ? (
                                "Saving..."
                              ) : (
                                "Add Assignment"
                              )}
                            </Button>
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
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Class Schedule</Label>
                        {!isStudentView && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 h-6 text-xs bg-transparent"
                            onClick={() => {
                              setEditingScheduleItem({
                                scheduleId: schedule.id,
                                index: -1, // -1 means adding new
                                item: {
                                  start_time: "",
                                  end_time: "",
                                  minutes: 30,
                                  activity: "",
                                  room_assignment: "",
                                  zoom_link: "",
                                },
                              })
                              setShowEditScheduleDialog(true)
                            }}
                          >
                            <Plus className="h-3 w-3" />
                            Add
                          </Button>
                        )}
                      </div>
                      {!schedule.schedule_data || schedule.schedule_data.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">No schedule data available</p>
                      ) : (
                        <div className="space-y-2">
                          {schedule.schedule_data.map((item, index) => (
                            <div
                              key={index}
                              className={`p-3 rounded-lg border ${
                                item.activity.toLowerCase().includes("break") ||
                                item.activity.toLowerCase().includes("no class")
                                  ? "bg-amber-50 border-amber-200"
                                  : item.activity.toLowerCase().includes("all-hands") ||
                                      item.activity.toLowerCase().includes("all hands")
                                    ? "bg-blue-50 border-blue-200"
                                    : item.activity.toLowerCase().includes("clinic")
                                      ? "bg-green-50 border-green-200"
                                      : item.activity.toLowerCase().includes("presentation")
                                        ? "bg-purple-50 border-purple-200"
                                        : item.activity.toLowerCase().includes("meeting")
                                          ? "bg-teal-50 border-teal-200"
                                          : "bg-slate-50 border-slate-200"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="flex flex-col items-center min-w-[70px]">
                                    <span className="text-xs font-semibold text-[#3C507D]">{item.start_time}</span>
                                    <span className="text-[10px] text-muted-foreground">to {item.end_time}</span>
                                  </div>
                                  <div className="h-8 w-px bg-slate-200" />
                                  <div>
                                    <span className="text-sm font-medium text-slate-800">{item.activity}</span>
                                    <div className="flex items-center gap-2 mt-1">
                                      {item.room_assignment && (
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                          <MapPin className="h-3 w-3" />
                                          {item.room_assignment}
                                        </span>
                                      )}
                                      {item.zoom_link && (
                                        <a
                                          href={item.zoom_link}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                        >
                                          <Video className="h-3 w-3" />
                                          Zoom
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs bg-white">
                                    {item.minutes} min
                                  </Badge>
                                  {!isStudentView && (
                                    <>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-6 w-6"
                                        onClick={() => {
                                          setEditingScheduleItem({ scheduleId: schedule.id, index, item })
                                          setShowEditScheduleDialog(true)
                                        }}
                                      >
                                        <Pencil className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-6 w-6 text-red-600 hover:text-red-700"
                                        onClick={() => deleteScheduleDataItem(schedule.id, index)}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                        Client Meetings This Week
                      </Label>
                      {getMeetingsForWeek(schedule.week_number).length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">No client meetings scheduled</p>
                      ) : (
                        <div className="space-y-2">
                          {getMeetingsForWeek(schedule.week_number).map((meeting) => (
                            <div
                              key={meeting.id}
                              className="flex items-center justify-between p-3 rounded-lg border bg-teal-50 border-teal-200"
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex flex-col items-center min-w-[70px]">
                                  <span className="text-xs font-semibold text-[#3C507D]">{meeting.start_time}</span>
                                  <span className="text-[10px] text-muted-foreground">to {meeting.end_time}</span>
                                </div>
                                <div className="h-8 w-px bg-teal-200" />
                                <div>
                                  <span className="text-sm font-medium text-slate-800">{meeting.client_name}</span>
                                  <div className="flex items-center gap-2 mt-1">
                                    {meeting.room_assignment && (
                                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        {meeting.room_assignment}
                                      </span>
                                    )}
                                    {meeting.zoom_link && (
                                      <a
                                        href={meeting.zoom_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                      >
                                        <Video className="h-3 w-3" />
                                        Zoom
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <Badge variant="outline" className="text-xs bg-white">
                                {meeting.minutes} min
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Time Blocks (manually added) */}
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                        Custom Time Blocks
                      </Label>
                      {(schedule.activities || []).length === 0 ? ( // Use 'activities' for TimeBlocks
                        <p className="text-sm text-muted-foreground italic">No custom time blocks added</p>
                      ) : (
                        <div className="space-y-2">
                          {schedule.activities.map(
                            (
                              timeBlock, // Renamed loop variable
                            ) => (
                              <div
                                key={timeBlock.id}
                                className={`flex items-center justify-between p-2 rounded-md border ${activityTypeColors[timeBlock.color]}`} // Use color for styling
                              >
                                <div className="flex items-center gap-2">
                                  <Clock className="h-3 w-3" />
                                  <span className="text-xs font-medium">{timeBlock.time}</span>
                                  <span className="text-sm">{timeBlock.activity}</span> {/* Use activity as title */}
                                  <Badge variant="outline" className="text-xs">
                                    {timeBlock.duration}m
                                  </Badge>
                                </div>
                                {/* Modified to remove specific session */}
                                {timeBlock.sessions.length > 0 && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6"
                                    onClick={() => removeActivity(schedule.id, timeBlock.id, timeBlock.sessions[0].id)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            ),
                          )}
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
                                {assignment.file_name && ( // Display file name if attached
                                  <a
                                    href={assignment.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline text-xs flex items-center gap-1"
                                  >
                                    <FileText className="h-3 w-3" />
                                    {assignment.file_name}
                                  </a>
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

                      {(schedule.activities || []).map(
                        (
                          block, // Use 'activities' for TimeBlocks
                        ) => (
                          <div key={block.id}>
                            <div
                              className={`${getBlockHeaderColor(block.color)} px-3 py-2 flex items-center justify-between`}
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-bold">{block.time}</span>
                                <span className="text-white/90 text-sm">{block.activity}</span>{" "}
                                {/* Use activity as title */}
                              </div>
                              <Badge className="bg-white/20 text-white border-0 text-xs">{block.duration} min</Badge>
                            </div>

                            {/* Render only the first session for each TimeBlock for now, as addActivity created only one. */}
                            {block.sessions.slice(0, 1).map(
                              (
                                session, // Ensured only one session is rendered per block
                              ) => (
                                <div
                                  key={session.id}
                                  className={`grid grid-cols-12 gap-0 items-center text-sm border-b last:border-b-0 group ${
                                    (block.id === block.sessions.indexOf(session) % 2) === 0
                                      ? "bg-white"
                                      : "bg-slate-50" // Simplified bg logic
                                  }`}
                                >
                                  {/* Editing Mode */}
                                  {editingScheduleItem?.scheduleId === schedule.id &&
                                    editingScheduleItem.index === block.sessions.indexOf(session) &&
                                    editingScheduleItem.scheduleId === schedule.id && (
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
                                              // Complex logic to update directorInitials based on input if needed
                                              // For now, assume direct input of initials or a selection mechanism
                                            }}
                                            className="h-7 text-xs"
                                            placeholder="Director Initials (e.g., NV)"
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
                                              // This save logic should update the backend for this specific session
                                              // For now, it's complex to update just one session without full block update
                                              // Temporarily, we update the in-memory schedule which will be saved by saveScheduleData if called
                                              // A more robust solution would involve a dedicated save session API call or batch update
                                              const updatedSession = {
                                                ...session,
                                                team: session.team,
                                                directorInitials: session.directorInitials,
                                                room: session.room,
                                                roomNumber: session.roomNumber,
                                                notes: session.notes,
                                              }
                                              const updatedBlock = {
                                                ...block,
                                                sessions: block.sessions.map((s) =>
                                                  s.id === session.id ? updatedSession : s,
                                                ),
                                              }
                                              const updatedActivities = (schedule.activities || []).map((b) =>
                                                b.id === block.id ? updatedBlock : b,
                                              )
                                              updateSchedule(schedule.id, { activities: updatedActivities })
                                              setEditingScheduleItem(null) // Exit editing mode
                                            }}
                                          >
                                            <Check className="h-3 w-3 text-green-600" />
                                          </Button>
                                        </div>
                                      </>
                                    )}

                                  {/* Display Mode */}
                                  {editingScheduleItem?.scheduleId !== schedule.id ||
                                    (editingScheduleItem.index !== block.sessions.indexOf(session) && (
                                      <>
                                        <div className="col-span-3 p-3 font-medium text-slate-800 text-xs">
                                          {session.team}
                                        </div>
                                        <div className="col-span-4 p-3 text-slate-600">
                                          {getDirectorName(session.directorInitials) || (
                                            <span className="text-slate-400 italic">N/A</span>
                                          )}
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
                                            onClick={() =>
                                              setEditingScheduleItem({
                                                scheduleId: schedule.id,
                                                index: block.sessions.indexOf(session),
                                                item: {
                                                  ...session,
                                                  start_time: block.time,
                                                  end_time: "",
                                                  minutes: block.duration,
                                                  activity: block.activity,
                                                  room_assignment: session.room,
                                                  zoom_link: schedule.zoom_link,
                                                },
                                              })
                                            }
                                          >
                                            <Pencil className="h-3 w-3 text-slate-400" />
                                          </Button>
                                        </div>
                                      </>
                                    ))}
                                </div>
                              ),
                            )}
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      ))}

      <Dialog open={showEditScheduleDialog} onOpenChange={setShowEditScheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingScheduleItem?.index === -1 ? "Add Schedule Item" : "Edit Schedule Item"}</DialogTitle>
          </DialogHeader>
          {editingScheduleItem && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Time</Label>
                  <Input
                    value={editingScheduleItem.item.start_time}
                    onChange={(e) =>
                      setEditingScheduleItem({
                        ...editingScheduleItem,
                        item: { ...editingScheduleItem.item, start_time: e.target.value },
                      })
                    }
                    placeholder="5:00 PM"
                  />
                </div>
                <div>
                  <Label>End Time</Label>
                  <Input
                    value={editingScheduleItem.item.end_time}
                    onChange={(e) =>
                      setEditingScheduleItem({
                        ...editingScheduleItem,
                        item: { ...editingScheduleItem.item, end_time: e.target.value },
                      })
                    }
                    placeholder="5:45 PM"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Activity</Label>
                  <Input
                    value={editingScheduleItem.item.activity}
                    onChange={(e) =>
                      setEditingScheduleItem({
                        ...editingScheduleItem,
                        item: { ...editingScheduleItem.item, activity: e.target.value },
                      })
                    }
                    placeholder="e.g., All-Hands, Clinic Session"
                  />
                </div>
                <div>
                  <Label>Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={editingScheduleItem.item.minutes}
                    onChange={(e) =>
                      setEditingScheduleItem({
                        ...editingScheduleItem,
                        item: { ...editingScheduleItem.item, minutes: Number.parseInt(e.target.value) || 0 },
                      })
                    }
                    min={5}
                    max={180}
                  />
                </div>
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Room Assignment
                </Label>
                <Input
                  value={editingScheduleItem.item.room_assignment || ""}
                  onChange={(e) =>
                    setEditingScheduleItem({
                      ...editingScheduleItem,
                      item: { ...editingScheduleItem.item, room_assignment: e.target.value },
                    })
                  }
                  placeholder="e.g., Room 101, Main Hall"
                />
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  Zoom Link
                </Label>
                <Input
                  value={editingScheduleItem.item.zoom_link || ""}
                  onChange={(e) =>
                    setEditingScheduleItem({
                      ...editingScheduleItem,
                      item: { ...editingScheduleItem.item, zoom_link: e.target.value },
                    })
                  }
                  placeholder="https://zoom.us/j/..."
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditScheduleDialog(false)
                setEditingScheduleItem(null)
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (editingScheduleItem) {
                  if (editingScheduleItem.index === -1) {
                    addScheduleDataItem(editingScheduleItem.scheduleId, editingScheduleItem.item)
                  } else {
                    updateScheduleDataItem(
                      editingScheduleItem.scheduleId,
                      editingScheduleItem.index,
                      editingScheduleItem.item,
                    )
                  }
                }
              }}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
