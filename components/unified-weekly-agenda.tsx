"use client"

import { useState, useEffect } from "react"
import { useCurrentSemester } from "@/hooks/use-current-semester"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import {
  Calendar,
  Plus,
  Trash2,
  Clock,
  BookOpen,
  FileText,
  ChevronRight,
  Coffee,
  Video,
  Pencil,
  Users,
  Loader2,
  MapPin,
  Save,
  Download,
  Send,
  CheckCircle,
  AlertTriangle,
  ArrowDown,
  ChevronDown,
  ChevronUp,
  GripVertical,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Time utility functions for smart agenda management
const parseTime = (timeStr: string): number => {
  // Parse time like "5:00 PM" or "17:00" into minutes from midnight
  const cleanTime = timeStr.trim().toUpperCase()
  const isPM = cleanTime.includes("PM")
  const isAM = cleanTime.includes("AM")
  const timeOnly = cleanTime.replace(/\s*(AM|PM)\s*/i, "")
  const [hoursStr, minutesStr] = timeOnly.split(":")
  let hours = Number.parseInt(hoursStr, 10)
  const minutes = Number.parseInt(minutesStr || "0", 10)
  
  if (isPM && hours !== 12) hours += 12
  if (isAM && hours === 12) hours = 0
  
  return hours * 60 + minutes
}

const formatTime = (totalMinutes: number): string => {
  // Format minutes from midnight back to "5:00 PM" format
  let hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  const isPM = hours >= 12
  
  if (hours > 12) hours -= 12
  if (hours === 0) hours = 12
  
  return `${hours}:${minutes.toString().padStart(2, "0")} ${isPM ? "PM" : "AM"}`
}

const getEndTime = (startTime: string, duration: number): string => {
  const startMinutes = parseTime(startTime)
  return formatTime(startMinutes + duration)
}

const checkTimeOverlap = (block1Start: string, block1Duration: number, block2Start: string): boolean => {
  const start1 = parseTime(block1Start)
  const end1 = start1 + block1Duration
  const start2 = parseTime(block2Start)
  return start2 < end1
}

const sortBlocksByTime = (blocks: TimeBlock[]): TimeBlock[] => {
  return [...blocks].sort((a, b) => parseTime(a.time) - parseTime(b.time))
}

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
  zoom_link?: string
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

interface RecordingLink {
  id: string
  title: string
  url: string
  date?: string
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
  recording_links?: RecordingLink[] // Class recording links
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

function UnifiedWeeklyAgenda({
  semester = "Spring 2026",
  isStudentView = false,
  studentClinic,
  }: UnifiedWeeklyAgendaProps) {
  const [schedules, setSchedules] = useState<WeekSchedule[]>([])
  const { semesterId } = useCurrentSemester()
  const [loading, setLoading] = useState(true)
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null)
  const [showAddWeekDialog, setShowAddWeekDialog] = useState(false)
  const [showAddActivityDialog, setShowAddActivityDialog] = useState(false)
  const [showAddAssignmentDialog, setShowAddAssignmentDialog] = useState(false)
  const [activeWeekForDialog, setActiveWeekForDialog] = useState<number | null>(null)
  const [editingActivity, setEditingActivity] = useState<{ weekNumber: number; activityId: string } | null>(null)
  const [editingAssignment, setEditingAssignment] = useState<{ weekNumber: number; assignmentId: string } | null>(null)
  const [clientMeetings, setClientMeetings] = useState<ClientMeeting[]>([]) // State for client meetings
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

  // State for dialogs and editing
  const [saving, setSaving] = useState(false)
  const [showEditScheduleDialog, setShowEditScheduleDialog] = useState(false)
  const [editingScheduleItem, setEditingScheduleItem] = useState<{
    scheduleId: string
    index: number
    item: ScheduleDataItem
  } | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [publishSuccess, setPublishSuccess] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)
  const [posting, setPosting] = useState(false)

  const [editingTimeBlock, setEditingTimeBlock] = useState<{
    weekNumber: number
    timeBlockId: string
    timeBlock: TimeBlock
    originalTime?: string
    originalDuration?: number
  } | null>(null)
  const [showEditTimeBlockDialog, setShowEditTimeBlockDialog] = useState(false)
  
  // Smart agenda state
  const [showCascadeConfirm, setShowCascadeConfirm] = useState(false)
  const [cascadeChanges, setCascadeChanges] = useState<{
    weekNumber: number
    editedBlockId: string
    timeDiff: number
    affectedBlocks: TimeBlock[]
  } | null>(null)

  // Directors data - assuming it's fetched elsewhere or hardcoded if static
  const directors = [] // Placeholder: In a real app, fetch this data.
  
  // Calculate time conflicts for current editing state
  const getTimeConflicts = (activities: TimeBlock[], editingBlockId: string, newTime: string, newDuration: number): { hasConflict: boolean; conflictWith: string[] } => {
    const conflicts: string[] = []
    const editStart = parseTime(newTime)
    const editEnd = editStart + newDuration
    
    for (const block of activities) {
      if (block.id === editingBlockId) continue
      const blockStart = parseTime(block.time)
      const blockEnd = blockStart + block.duration
      
      // Check for overlap
      if (editStart < blockEnd && editEnd > blockStart) {
        conflicts.push(block.activity)
      }
    }
    
    return { hasConflict: conflicts.length > 0, conflictWith: conflicts }
  }
  
  // Calculate which blocks would be affected by a cascade
  const getBlocksToShift = (activities: TimeBlock[], editedBlockId: string, newEndTime: number): TimeBlock[] => {
    const sortedBlocks = sortBlocksByTime(activities)
    const editedIndex = sortedBlocks.findIndex(b => b.id === editedBlockId)
    if (editedIndex === -1) return []
    
    return sortedBlocks.slice(editedIndex + 1).filter(block => {
      const blockStart = parseTime(block.time)
      return blockStart < newEndTime
    })
  }
  
  // Apply cascade shift to all affected blocks
  const applyCascadeShift = async (weekNumber: number, editedBlockId: string, timeDiff: number) => {
    const schedule = schedules.find(s => s.week_number === weekNumber)
    if (!schedule) return
    
    const sortedBlocks = sortBlocksByTime(schedule.activities || [])
    const editedIndex = sortedBlocks.findIndex(b => b.id === editedBlockId)
    
    const updatedActivities = sortedBlocks.map((block, index) => {
      if (index <= editedIndex) return block
      // Shift all blocks after the edited one
      const newStartMinutes = parseTime(block.time) + timeDiff
      return { ...block, time: formatTime(newStartMinutes) }
    })
    
    await updateSchedule(schedule.id, { activities: updatedActivities })
    setShowCascadeConfirm(false)
    setCascadeChanges(null)
  }
  
  // Quick duration adjustment with optional cascade
  const quickAdjustDuration = async (weekNumber: number, blockId: string, durationChange: number, shouldCascade: boolean = false) => {
    const schedule = schedules.find(s => s.week_number === weekNumber)
    if (!schedule) return
    
    const sortedBlocks = sortBlocksByTime(schedule.activities || [])
    const blockIndex = sortedBlocks.findIndex(b => b.id === blockId)
    if (blockIndex === -1) return
    
    const block = sortedBlocks[blockIndex]
    const newDuration = Math.max(5, block.duration + durationChange)
    
    let updatedActivities: TimeBlock[]
    
    if (shouldCascade && durationChange > 0) {
      // Cascade: shift all following blocks
      updatedActivities = sortedBlocks.map((b, idx) => {
        if (idx === blockIndex) {
          return { ...b, duration: newDuration }
        }
        if (idx > blockIndex) {
          const newStartMinutes = parseTime(b.time) + durationChange
          return { ...b, time: formatTime(newStartMinutes) }
        }
        return b
      })
    } else {
      // No cascade: just update duration
      updatedActivities = sortedBlocks.map(b => 
        b.id === blockId ? { ...b, duration: newDuration } : b
      )
    }
    
    await updateSchedule(schedule.id, { activities: updatedActivities })
  }
  
  // Move activity up or down in order
  const moveActivity = async (weekNumber: number, blockId: string, direction: "up" | "down") => {
    const schedule = schedules.find(s => s.week_number === weekNumber)
    if (!schedule) return
    
    const sortedBlocks = sortBlocksByTime(schedule.activities || [])
    const blockIndex = sortedBlocks.findIndex(b => b.id === blockId)
    if (blockIndex === -1) return
    
    const swapIndex = direction === "up" ? blockIndex - 1 : blockIndex + 1
    if (swapIndex < 0 || swapIndex >= sortedBlocks.length) return
    
    // Swap times between the two blocks
    const currentBlock = sortedBlocks[blockIndex]
    const swapBlock = sortedBlocks[swapIndex]
    
    const updatedActivities = sortedBlocks.map((b, idx) => {
      if (idx === blockIndex) {
        return { ...b, time: swapBlock.time }
      }
      if (idx === swapIndex) {
        return { ...b, time: currentBlock.time }
      }
      return b
    })
    
    // Re-sort after swap
    const resorted = sortBlocksByTime(updatedActivities)
    await updateSchedule(schedule.id, { activities: resorted })
  }

  useEffect(() => {
    fetchSchedules()
    // fetchDirectors() // Removed unused fetch
    fetchClientMeetings() // Added fetch for client meetings
  }, [semester])

  useEffect(() => {
    if (schedules.length > 0 && selectedWeek === null) {
      // Try to find current week based on date
      const today = new Date()
      const currentWeek = schedules.find((s) => {
        const weekStart = new Date(s.week_start)
        const weekEnd = new Date(s.week_end)
        return today >= weekStart && today <= weekEnd
      })
      setSelectedWeek(currentWeek?.week_number || schedules[0].week_number)
    }
  }, [schedules, selectedWeek])

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
        // Removed the line setting openWeeks as it's no longer needed
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
          // Removed the line setting openWeeks as it's no longer needed
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
      // Use dynamic semester ID from hook
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
    const initialsMap = getDirectorInitialsMap(directors) // directors is not defined here
    const parts = initials.split("/")
    const names = parts.map((init) => {
      const upperInit = init.toUpperCase().trim()
      return initialsMap[upperInit] || init
    })
    return names.join(" & ")
  }

  const selectedSchedule = schedules.find((s) => s.week_number === selectedWeek)

  // Loading state
  if (loading) {
    return (
      <Card className="border-0 shadow-md">
        <CardContent className="p-8">
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="text-muted-foreground">Loading course schedule...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Removed toggleWeek as it's no longer needed with the split-pane layout

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

  const updateTimeBlock = async (weekNumber: number, timeBlockId: string, updatedBlock: TimeBlock) => {
    const schedule = schedules.find((s) => s.week_number === weekNumber)
    if (!schedule || !schedule.activities) return

    const newActivities = schedule.activities.map((a) => (a.id === timeBlockId ? { ...a, ...updatedBlock } : a))

    setSaving(true)
    try {
      const response = await fetch("/api/semester-schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: schedule.id, schedule_data: newActivities }),
      })

      if (response.ok) {
        setSchedules(schedules.map((s) => (s.id === schedule.id ? { ...s, activities: newActivities } : s)))
        setShowEditTimeBlockDialog(false)
        setEditingTimeBlock(null)
      }
    } catch (error) {
      console.error("Error updating time block:", error)
    } finally {
      setSaving(false)
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
        // Removed setOpenWeeks as it's no longer needed
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
      // Removed setOpenWeeks as it's no longer needed
      if (selectedWeek === weekNumber) {
        setSelectedWeek(remaining.length > 0 ? remaining[0].week_number : null)
      }
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
  zoom_link: "",
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

  // Delete Time Block directly from the week details view
  const deleteTimeBlock = async (weekNumber: number, blockId: string) => {
    const schedule = schedules.find((s) => s.week_number === weekNumber)
    if (!schedule) return

    const updatedTimeBlocks = schedule.activities.filter((block) => block.id !== blockId)
    await updateSchedule(schedule.id, { activities: updatedTimeBlocks })
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

  // Delete Assignment directly from the week details view
  const deleteAssignment = async (weekNumber: number, assignmentId: string) => {
    const schedule = schedules.find((s) => s.week_number === weekNumber)
    if (!schedule) return
    const updatedAssignments = schedule.assignments.filter((a) => a.id !== assignmentId)
    await updateSchedule(schedule.id, { assignments: updatedAssignments })
  }

  const handlePublishAgenda = async (schedule: WeekSchedule) => {
    setPublishing(true)
    try {
      const res = await fetch("/api/published-agendas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schedule_date: schedule.week_start || new Date().toISOString().split("T")[0],
          director_name: "SEED Director",
          zoom_link: schedule.zoom_link || "",
          schedule_data: schedule.activities,
          notes: schedule.notes,
          published_by: "director",
          semester_id: schedule.semester_id,
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
          director_name: "SEED Director",
          zoom_link: currentSchedule.zoom_link || "",
          schedule_data: currentSchedule.activities,
          notes: currentSchedule.notes,
          semester_id: currentSchedule.semester_id,
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

  // Function to update week notes
  const updateWeekNotes = async (weekNumber: number, notes: string) => {
    const schedule = schedules.find((s) => s.week_number === weekNumber)
    if (!schedule) return
    await updateSchedule(schedule.id, { notes })
  }

  // Function to update zoom link
  const updateZoomLink = async (weekNumber: number, zoomLink: string) => {
    const schedule = schedules.find((s) => s.week_number === weekNumber)
    if (!schedule) return
    await updateSchedule(schedule.id, { zoom_link: zoomLink })
  }

  // Function to add recording link
  const addRecordingLink = async (weekNumber: number, title: string, url: string) => {
    const schedule = schedules.find((s) => s.week_number === weekNumber)
    if (!schedule) return
    const newRecording: RecordingLink = {
      id: crypto.randomUUID(),
      title,
      url,
      date: new Date().toISOString(),
    }
    const updatedRecordings = [...(schedule.recording_links || []), newRecording]
    await updateSchedule(schedule.id, { recording_links: updatedRecordings })
  }

  // Function to remove recording link
  const removeRecordingLink = async (weekNumber: number, recordingId: string) => {
    const schedule = schedules.find((s) => s.week_number === weekNumber)
    if (!schedule) return
    const updatedRecordings = (schedule.recording_links || []).filter((r) => r.id !== recordingId)
    await updateSchedule(schedule.id, { recording_links: updatedRecordings })
  }

  // PDF Download function for agenda
  const downloadAgendaPDF = async () => {
    if (!selectedSchedule) return
    
    const { default: jsPDF } = await import('jspdf')
    
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter'
    })
    
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 15
    const contentWidth = pageWidth - (margin * 2)
    let yPos = 0
    
    // Colors
    const navy: [number, number, number] = [17, 34, 80]
    const white: [number, number, number] = [255, 255, 255]
    const black: [number, number, number] = [30, 30, 30]
    const gray: [number, number, number] = [100, 100, 100]
    const lightGray: [number, number, number] = [245, 245, 245]
    const borderGray: [number, number, number] = [220, 220, 220]
    
    const activityColors: Record<string, [number, number, number]> = {
      blue: [59, 130, 246],
      teal: [20, 184, 166],
      amber: [245, 158, 11],
      slate: [100, 116, 139],
      green: [34, 197, 94],
      purple: [168, 85, 247],
    }
    
    // Format date helper
    const formatShortDate = (dateStr: string) => {
      const date = new Date(dateStr + 'T00:00:00')
      return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
    }
    
    // ===== HEADER BAR =====
    doc.setFillColor(...navy)
    doc.rect(0, 0, pageWidth, 24, 'F')
    
    // Suffolk University SEED
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...white)
    doc.text('Suffolk University SEED', margin, 15)
    
    // Week badge on right - centered in badge
    const weekText = `Week ${selectedSchedule.week_number}`
    doc.setFontSize(12)
    const weekTextWidth = doc.getTextWidth(weekText)
    const badgeWidth = weekTextWidth + 14
    const badgeX = pageWidth - margin - badgeWidth
    doc.setFillColor(...white)
    doc.roundedRect(badgeX, 7, badgeWidth, 11, 3, 3, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...navy)
    doc.text(weekText, badgeX + 7, 14.5)
    
    yPos = 32
    
    // ===== DATE ROW =====
    doc.setFontSize(15)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...black)
    doc.text(`${formatShortDate(selectedSchedule.week_start)} - ${formatShortDate(selectedSchedule.week_end)}`, margin, yPos + 6)
    
    // Topic badge (if exists) - bigger and nicer
    if (selectedSchedule.session_focus) {
      doc.setFillColor(213, 196, 140)
      const focusText = selectedSchedule.session_focus
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      const focusWidth = doc.getTextWidth(focusText) + 14
      doc.roundedRect(pageWidth - margin - focusWidth, yPos, focusWidth, 10, 3, 3, 'F')
      doc.setTextColor(80, 65, 20)
      doc.text(focusText, pageWidth - margin - focusWidth + 7, yPos + 7)
    }
    
    yPos += 14
    
    // Divider line
    doc.setDrawColor(...borderGray)
    doc.setLineWidth(0.5)
    doc.line(margin, yPos, pageWidth - margin, yPos)
    
    yPos += 8
    
    // ===== ACTIVITIES =====
    const activities = selectedSchedule.activities || []
    const assignments = selectedSchedule.assignments || []
    
    // Calculate available space and distribute evenly
    const footerSpace = 12
    const assignmentSpace = assignments.length > 0 ? 30 : 0
    const availableHeight = pageHeight - yPos - footerSpace - assignmentSpace
    const totalActivities = activities.length
    const cardGap = 4
    const totalGaps = (totalActivities - 1) * cardGap
    const cardHeight = Math.floor((availableHeight - totalGaps) / totalActivities)
    
    for (let i = 0; i < activities.length; i++) {
      const block = activities[i]
      const sessions = block.sessions || []
      const sessionCount = sessions.length
      
      // Activity card with border
      doc.setFillColor(...white)
      doc.setDrawColor(...borderGray)
      doc.setLineWidth(0.3)
      doc.roundedRect(margin, yPos, contentWidth, cardHeight, 2, 2, 'FD')
      
      // Left color accent bar
      const barColor = activityColors[block.color] || activityColors.slate
      doc.setFillColor(...barColor)
      doc.roundedRect(margin, yPos, 4, cardHeight, 2, 0, 'F')
      doc.rect(margin + 2, yPos, 2, cardHeight, 'F')
      
      // Time - bold
      doc.setFontSize(13)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...black)
      doc.text(block.time, margin + 8, yPos + 6)
      
      // Duration below time
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...gray)
      doc.text(`${block.duration} min`, margin + 8, yPos + 11)
      
      // Activity name
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...black)
      doc.text(block.activity, margin + 38, yPos + 6)
      
      // Session count
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...gray)
      doc.text(`${sessionCount} session${sessionCount !== 1 ? 's' : ''}`, margin + 38, yPos + 11)
      
      // Sessions - calculate spacing based on available height in card
      const sessionAreaStart = yPos + 15
      const sessionAreaHeight = cardHeight - 17
      const sessionSpacing = Math.min(sessionAreaHeight / Math.max(sessions.length, 1), 10)
      let sessionY = sessionAreaStart
      
      for (const session of sessions) {
        // Bullet point
        doc.setFillColor(...barColor)
        doc.circle(margin + 42, sessionY, 1, 'F')
        
        // Team name
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...black)
        doc.text(session.team, margin + 46, sessionY + 1)
        
        // Director initials badge
        if (session.directorInitials) {
          const teamWidth = doc.getTextWidth(session.team)
          doc.setFillColor(...lightGray)
          doc.roundedRect(margin + 48 + teamWidth, sessionY - 2, 9, 4, 1, 1, 'F')
          doc.setFontSize(6)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(...gray)
          doc.text(session.directorInitials, margin + 49.5 + teamWidth, sessionY + 1)
        }
        
        // Room on right
        if (session.room || session.roomNumber) {
          doc.setFontSize(8)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(...gray)
          const roomText = `${session.room || ''} ${session.roomNumber || ''}`.trim()
          doc.text(roomText, pageWidth - margin - 4 - doc.getTextWidth(roomText), sessionY + 1)
        }
        
        // Notes on same line if space allows
        if (session.notes) {
          doc.setFontSize(7)
          doc.setFont('helvetica', 'italic')
          doc.setTextColor(140, 140, 140)
          const noteX = margin + 46 + doc.getTextWidth(session.team) + (session.directorInitials ? 14 : 4)
          doc.text(`- ${session.notes}`, noteX, sessionY + 1)
        }
        
        sessionY += sessionSpacing
      }
      
      yPos += cardHeight + cardGap
    }
    
// ===== ASSIGNMENTS SECTION =====
    if (assignments.length > 0) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...navy)
      doc.text('ASSIGNMENTS', margin, yPos + 4)
      
      let assignX = margin + 32
      for (const assignment of assignments) {
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...black)
        const assignText = assignment.title + (assignment.dueDate ? ` (Due: ${assignment.dueDate})` : '')
        doc.text(`• ${assignText}`, assignX, yPos + 4)
        assignX += doc.getTextWidth(`• ${assignText}`) + 8
      }
      yPos += 10
    }
    
    // ===== FOOTER =====
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...gray)
    doc.text('Suffolk University SEED Program', margin, pageHeight - 8)
    doc.text(`Week ${selectedSchedule.week_number} Agenda`, pageWidth - margin - doc.getTextWidth(`Week ${selectedSchedule.week_number} Agenda`), pageHeight - 8)
    
    // Save
    const fileName = `SEED_Week${selectedSchedule.week_number}_Agenda.pdf`
    doc.save(fileName)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="flex items-center gap-2 text-lg font-semibold" style={{ color: "#112250" }}>
          <Calendar className="h-5 w-5" />
          Unified Course & Weekly Agenda - {semester}
        </h2>
        {!isStudentView && (
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="gap-1 bg-transparent"
              onClick={downloadAgendaPDF}
              disabled={!selectedSchedule}
            >
              <Download className="h-4 w-4" />
              Download Agenda
            </Button>
            <Dialog open={showAddWeekDialog} onOpenChange={setShowAddWeekDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1" style={{ backgroundColor: "#112250" }}>
                  <Plus className="h-4 w-4" />
                  Add Week
                </Button>
              </DialogTrigger>
            {/* Add Week Dialog Content - unchanged */}
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
                      max={20}
                    />
                  </div>
                  <div>
                    <Label>Week Label</Label>
                    <Input
                      value={newWeek.week_label}
                      onChange={(e) => setNewWeek({ ...newWeek, week_label: e.target.value })}
                      placeholder="Week 1"
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
                  <Label>Session Focus</Label>
                  <Input
                    value={newWeek.session_focus}
                    onChange={(e) => setNewWeek({ ...newWeek, session_focus: e.target.value })}
                    placeholder="e.g., SEED Overview, Client Kickoff"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={newWeek.is_break}
                    onCheckedChange={(checked) => setNewWeek({ ...newWeek, is_break: checked })}
                  />
                  <Label>Break Week (No Class)</Label>
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
        )}
      </div>

      {/* Empty State */}
      {schedules.length === 0 && (
        <Card className="border shadow-sm">
          <CardContent className="p-6">
            <div className="text-center py-4 text-muted-foreground">
              <Calendar className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No weeks added yet. Click "Add Week" to create your course schedule.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {schedules.length > 0 && (
        <div className="flex gap-3">
          <div className="w-[240px] flex-shrink-0">
            <div className="bg-white border rounded-lg overflow-hidden">
              <div className="px-3 py-2 border-b bg-gray-50">
                <h3 className="font-medium text-xs text-gray-600 uppercase tracking-wide">
                  All Weeks ({schedules.length})
                </h3>
              </div>
              <div className="max-h-[500px] overflow-y-auto">
                {schedules.map((schedule) => {
                  const isSelected = selectedWeek === schedule.week_number
                  const isCurrentWeek = (() => {
                    const today = new Date()
                    const weekStart = new Date(schedule.week_start)
                    const weekEnd = new Date(schedule.week_end)
                    return today >= weekStart && today <= weekEnd
                  })()

                  return (
                    <button
                      key={schedule.id}
                      onClick={() => setSelectedWeek(schedule.week_number)}
                      className={`w-full text-left px-3 py-2 border-b last:border-b-0 transition-all ${
                        isSelected
                          ? "bg-[#112250] text-white"
                          : isCurrentWeek
                            ? "bg-amber-50 hover:bg-amber-100"
                            : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {schedule.is_break && (
                            <Coffee className={`h-3.5 w-3.5 ${isSelected ? "text-amber-300" : "text-amber-600"}`} />
                          )}
                          <span className={`font-medium text-sm ${isSelected ? "text-white" : "text-gray-800"}`}>
                            {schedule.week_label || `Week ${schedule.week_number}`}
                          </span>
                        </div>
                        <ChevronRight className={`h-3.5 w-3.5 ${isSelected ? "text-white/70" : "text-gray-400"}`} />
                      </div>
                      <div className={`text-[11px] mt-0.5 ${isSelected ? "text-gray-300" : "text-gray-500"}`}>
                        {formatDate(schedule.week_start)} - {formatDate(schedule.week_end)}
                      </div>
                      {(schedule.session_focus || (isCurrentWeek && !isSelected)) && (
                        <div className="flex items-center gap-1.5 mt-1">
                          {schedule.session_focus && (
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded ${
                                isSelected ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {schedule.session_focus}
                            </span>
                          )}
                          {isCurrentWeek && !isSelected && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700">
                              Current
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            {selectedSchedule ? (
              <div className="bg-white border rounded-lg overflow-hidden">
                {/* Week Header - simplified, no large colored background */}
                <div className="px-4 py-3 border-b flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {selectedSchedule.is_break && <Coffee className="h-4 w-4 text-amber-600" />}
                    <div>
                      <h2 className="font-semibold text-base" style={{ color: "#112250" }}>
                        {selectedSchedule.week_label || `Week ${selectedSchedule.week_number}`}
                      </h2>
                      <p className="text-xs text-gray-500">
                        {formatDate(selectedSchedule.week_start)} - {formatDate(selectedSchedule.week_end)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedSchedule.session_focus && (
                      <Badge
                        variant="secondary"
                        className="text-xs font-normal"
                        style={{ backgroundColor: "#D5CCAB", color: "#505143" }}
                      >
                        {selectedSchedule.session_focus}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs font-normal">
                      {selectedSchedule.activities?.length || 0} activities
                    </Badge>
                    {selectedSchedule.is_break && (
                      <Badge className="text-xs bg-amber-100 text-amber-700 border-amber-200">Break</Badge>
                    )}
                  </div>
                </div>

                <div>
                  {/* Course Agenda Section */}
                  <div className="px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-xs uppercase tracking-wide text-gray-500 flex items-center gap-1.5">
                        <BookOpen className="h-3.5 w-3.5" />
                        Course Agenda
                      </h3>
                      <div className="flex gap-1.5">
                        {!isStudentView && (
                          <Dialog
                            open={showAddActivityDialog && activeWeekForDialog === selectedSchedule.week_number}
                            onOpenChange={(open) => {
                              setShowAddActivityDialog(open)
                              if (open) setActiveWeekForDialog(selectedSchedule.week_number)
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" className="h-7 text-xs gap-1 bg-transparent">
                                <Plus className="h-3 w-3" />
                                Add Activity
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Add Time Block</DialogTitle>
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
                                        setNewTimeBlock({
                                          ...newTimeBlock,
                                          duration: Number.parseInt(e.target.value),
                                        })
                                      }
                                      min={5}
                                      max={180}
                                    />
                                  </div>
                                </div>
                                <div>
                                  <Label>Activity Title</Label>
                                  <Input
                                    value={newTimeBlock.activity}
                                    onChange={(e) => setNewTimeBlock({ ...newTimeBlock, activity: e.target.value })}
                                    placeholder="e.g., Lecture, Workshop"
                                  />
                                </div>
                                <div>
                                  <Label>Type (Color)</Label>
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
                                <Button onClick={addTimeBlock}>Add Time Block</Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        )}

                        {!isStudentView && (
                          <Dialog
                            open={showAddAssignmentDialog && activeWeekForDialog === selectedSchedule.week_number}
                            onOpenChange={(open) => {
                              setShowAddAssignmentDialog(open)
                              if (open) setActiveWeekForDialog(selectedSchedule.week_number)
                              if (!open) setAssignmentFile(null)
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" className="h-7 text-xs gap-1 bg-transparent">
                                <FileText className="h-3 w-3" />
                                Add Assignment
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
                                <div>
                                  <Label>Description</Label>
                                  <Textarea
                                    value={newAssignment.description}
                                    onChange={(e) =>
                                      setNewAssignment({ ...newAssignment, description: e.target.value })
                                    }
                                    placeholder="Brief description"
                                    rows={2}
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Due Date</Label>
                                    <Input
                                      type="date"
                                      value={newAssignment.dueDate}
                                      onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                                    />
                                  </div>
                                  <div>
                                    <Label>Type</Label>
                                    <Select
                                      value={newAssignment.type}
                                      onValueChange={(v: string) =>
                                        setNewAssignment({
                                          ...newAssignment,
                                          type: v as "reading" | "deliverable" | "quiz" | "presentation" | "other",
                                        })
                                      }
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
                                </div>
                                <div>
                                  <Label>Attach File (optional)</Label>
                                  <Input
                                    type="file"
                                    onChange={(e) => setAssignmentFile(e.target.files?.[0] || null)}
                                    className="mt-1"
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setShowAddAssignmentDialog(false)}>
                                  Cancel
                                </Button>
                                <Button onClick={addAssignment} disabled={saving || uploadingAssignment}>
                                  {uploadingAssignment ? "Uploading..." : saving ? "Saving..." : "Add Assignment"}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </div>

                    {selectedSchedule.activities && selectedSchedule.activities.length > 0 ? (
                      <div className="space-y-2">
                        {selectedSchedule.activities.map((timeBlock) => (
                          <div key={timeBlock.id} className="flex border rounded-md overflow-hidden bg-white">
                            {/* Left accent bar based on activity type */}
                            <div
                              className={`w-1 flex-shrink-0 ${
                                timeBlock.color === "blue"
                                  ? "bg-blue-500"
                                  : timeBlock.color === "amber"
                                    ? "bg-amber-500"
                                    : timeBlock.color === "teal"
                                      ? "bg-teal-500"
                                      : timeBlock.color === "purple"
                                        ? "bg-purple-500"
                                        : timeBlock.color === "green"
                                          ? "bg-green-500"
                                          : timeBlock.color === "pink"
                                            ? "bg-pink-500"
                                            : "bg-gray-400"
                              }`}
                            />
                            <div className="flex-1 px-3 py-2">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="text-center min-w-[70px]">
                                    <div className="font-medium text-sm">{timeBlock.time}</div>
                                    <div className="text-[10px] text-gray-400 flex items-center justify-center gap-0.5">
                                      <span>{timeBlock.duration}m</span>
                                      <span className="mx-0.5">·</span>
                                      <span className="text-gray-500">{getEndTime(timeBlock.time, timeBlock.duration)}</span>
                                    </div>
                                  </div>
                                  <div>
                                    <div className="font-medium text-sm">{timeBlock.activity}</div>
                                    {timeBlock.sessions && timeBlock.sessions.length > 0 && (
                                      <div className="text-[10px] text-gray-500">
                                        {timeBlock.sessions.length} session(s)
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {!isStudentView && (
                                  <div className="flex items-center gap-0.5">
                                    {/* Quick duration adjust buttons */}
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                                            onClick={() => quickAdjustDuration(selectedSchedule.week_number, timeBlock.id, -5)}
                                          >
                                            <span className="text-[10px] font-medium">-5</span>
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="top">
                                          <p className="text-xs">Reduce by 5 min</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                                            onClick={() => quickAdjustDuration(selectedSchedule.week_number, timeBlock.id, 5)}
                                          >
                                            <span className="text-[10px] font-medium">+5</span>
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="top">
                                          <p className="text-xs">Extend by 5 min</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                    <div className="w-px h-4 bg-gray-200 mx-1" />
                                    {/* Move up/down buttons */}
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                                            onClick={() => moveActivity(selectedSchedule.week_number, timeBlock.id, "up")}
                                          >
                                            <ChevronUp className="h-3 w-3" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="top">
                                          <p className="text-xs">Move earlier</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                                            onClick={() => moveActivity(selectedSchedule.week_number, timeBlock.id, "down")}
                                          >
                                            <ChevronDown className="h-3 w-3" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="top">
                                          <p className="text-xs">Move later</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                    <div className="w-px h-4 bg-gray-200 mx-1" />
                                    {/* Edit and delete buttons */}
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0 text-gray-400 hover:text-blue-600"
                                      onClick={() => {
                                        setEditingTimeBlock({
                                          weekNumber: selectedSchedule.week_number,
                                          timeBlockId: timeBlock.id,
                                          timeBlock: { ...timeBlock },
                                          originalTime: timeBlock.time,
                                          originalDuration: timeBlock.duration,
                                        })
                                        setShowEditTimeBlockDialog(true)
                                      }}
                                    >
                                      <Pencil className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                                      onClick={() => deleteTimeBlock(selectedSchedule.week_number, timeBlock.id)}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                )}
                              </div>

                              {/* Sessions within TimeBlock */}
                              {timeBlock.sessions && timeBlock.sessions.length > 0 && (
                                <div className="mt-1.5 pt-1.5 border-t border-dashed space-y-1.5">
                                  {timeBlock.sessions.map((session) => (
                                    <div
                                      key={session.id}
                                      className="text-[11px] text-gray-600"
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                          <Users className="h-3 w-3 text-gray-400" />
                                          <span>{session.team}</span>
                                          {session.directorInitials && (
                                            <span className="text-[10px] px-1 py-0 rounded bg-gray-100 text-gray-600">
                                              {session.directorInitials}
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                          {session.zoom_link && (
                                            <a
                                              href={session.zoom_link}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline"
                                            >
                                              <Video className="h-2.5 w-2.5" />
                                              <span className="text-[10px]">Zoom</span>
                                            </a>
                                          )}
                                          {session.room && session.roomNumber && (
                                            <span className="flex items-center gap-1 text-gray-500">
                                              <MapPin className="h-2.5 w-2.5" />
                                              {session.room} {session.roomNumber}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      {session.notes && (
                                        <div className="ml-4 mt-0.5 text-[10px] text-gray-500 italic">
                                          {session.notes}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500 text-xs border rounded-md border-dashed">
                        No activities scheduled.
                        {!isStudentView && " Click 'Add Activity' to add one."}
                      </div>
                    )}
                  </div>

                  <div className="px-4 py-3 border-t">
                    <h3 className="font-medium text-xs uppercase tracking-wide text-gray-500 flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5" />
                      Assignments & Readings
                    </h3>

                    {selectedSchedule.assignments && selectedSchedule.assignments.length > 0 ? (
                      <div className="space-y-1.5">
                        {selectedSchedule.assignments.map((assignment) => (
                          <div
                            key={assignment.id}
                            className="flex items-start justify-between px-3 py-2 rounded border bg-gray-50"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{assignment.title}</span>
                                <Badge className={`text-[10px] px-1.5 py-0 ${assignmentTypeColors[assignment.type]}`}>
                                  {assignment.type}
                                </Badge>
                              </div>
                              {assignment.description && (
                                <p className="text-xs text-gray-600 mt-0.5">{assignment.description}</p>
                              )}
                              <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-2.5 w-2.5" />
                                  Due: {formatDate(assignment.dueDate)}
                                </span>
                                {assignment.file_url && (
                                  <a
                                    href={assignment.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-blue-600 hover:underline"
                                  >
                                    <FileText className="h-2.5 w-2.5" />
                                    {assignment.file_name || "Attachment"}
                                  </a>
                                )}
                              </div>
                            </div>
                            {!isStudentView && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                                onClick={() => deleteAssignment(selectedSchedule.week_number, assignment.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500 text-xs border rounded-md border-dashed">
                        No assignments for this week.
                        {!isStudentView && " Click 'Add Assignment' to add one."}
                      </div>
                    )}
                  </div>

                  {/* Week Notes Section */}
                  {!isStudentView && (
                    <div className="px-4 py-3 border-t">
                      <div className="flex items-center justify-between mb-1.5">
                        <h3 className="font-medium text-xs uppercase tracking-wide text-gray-500">Week Notes</h3>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 text-[10px] gap-1 text-gray-500"
                          onClick={() => {
                            const notes = prompt("Enter notes for this week:", selectedSchedule.notes || "")
                            if (notes !== null) {
                              updateWeekNotes(selectedSchedule.week_number, notes)
                            }
                          }}
                        >
                          <Pencil className="h-2.5 w-2.5" />
                          Edit
                        </Button>
                      </div>
                      {selectedSchedule.notes ? (
                        <p className="text-xs text-gray-700 bg-gray-50 rounded px-2 py-1.5">{selectedSchedule.notes}</p>
                      ) : (
                        <p className="text-xs text-gray-400 italic">No notes for this week.</p>
                      )}
                    </div>
                  )}

                  {/* Zoom & Room Section - Always visible for directors, conditionally for students */}
                  <div className="px-4 py-3 border-t">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-xs uppercase tracking-wide text-gray-500 flex items-center gap-1.5">
                        <Video className="h-3.5 w-3.5" />
                        Class Zoom Link
                      </h3>
                      {!isStudentView && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 text-[10px] gap-1 text-gray-500"
                          onClick={() => {
                            const link = prompt("Enter Zoom meeting link:", selectedSchedule.zoom_link || "")
                            if (link !== null) {
                              updateZoomLink(selectedSchedule.week_number, link)
                            }
                          }}
                        >
                          <Pencil className="h-2.5 w-2.5" />
                          {selectedSchedule.zoom_link ? "Edit" : "Add"}
                        </Button>
                      )}
                    </div>
                    {selectedSchedule.zoom_link ? (
                      <div className="flex items-center gap-3">
                        <a
                          href={selectedSchedule.zoom_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline bg-blue-50 px-2.5 py-1.5 rounded-md"
                        >
                          <Video className="h-3.5 w-3.5" />
                          Join Class Zoom Meeting
                        </a>
                        {selectedSchedule.room_assignment && (
                          <span className="flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-2.5 py-1.5 rounded-md">
                            <MapPin className="h-3.5 w-3.5" />
                            {selectedSchedule.room_assignment}
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">No Zoom link added for this week.</p>
                    )}
                  </div>

                  {/* Class Recordings Section */}
                  <div className="px-4 py-3 border-t">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-xs uppercase tracking-wide text-gray-500 flex items-center gap-1.5">
                        <Video className="h-3.5 w-3.5 text-red-500" />
                        Class Recordings
                      </h3>
                      {!isStudentView && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-[10px] gap-1 bg-transparent"
                          onClick={() => {
                            const title = prompt("Recording title (e.g., 'Week 2 - Full Class'):")
                            if (title) {
                              const url = prompt("Enter recording URL:")
                              if (url) {
                                addRecordingLink(selectedSchedule.week_number, title, url)
                              }
                            }
                          }}
                        >
                          <Plus className="h-2.5 w-2.5" />
                          Add Recording
                        </Button>
                      )}
                    </div>
                    {selectedSchedule.recording_links && selectedSchedule.recording_links.length > 0 ? (
                      <div className="space-y-1.5">
                        {selectedSchedule.recording_links.map((recording) => (
                          <div key={recording.id} className="flex items-center justify-between bg-gray-50 rounded-md px-2.5 py-1.5 group">
                            <a
                              href={recording.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-xs text-red-600 hover:underline"
                            >
                              <Video className="h-3 w-3" />
                              {recording.title}
                            </a>
                            {!isStudentView && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600"
                                onClick={() => removeRecordingLink(selectedSchedule.week_number, recording.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">No recordings added for this week.</p>
                    )}
                  </div>
                  
                  {/* Publish to Students Button */}
                  {!isStudentView && (
                    <div className="px-4 py-4 flex justify-center">
                      <Button
                        onClick={() => handlePublishAgenda(selectedSchedule)}
                        disabled={publishing}
                        className={`gap-2 px-6 ${
                          publishSuccess === selectedSchedule.week_number
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-[#112250] hover:bg-[#1a3470]'
                        } text-white`}
                      >
                        {publishing ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Publishing...
                          </>
                        ) : publishSuccess === selectedSchedule.week_number ? (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            Published!
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            Publish to Students
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white border rounded-lg p-6">
                <div className="text-center text-gray-500">
                  <Calendar className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Select a week from the list to view details.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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

      <Dialog open={showEditTimeBlockDialog} onOpenChange={(open) => {
          setShowEditTimeBlockDialog(open)
          if (!open) {
            setEditingTimeBlock(null)
          }
        }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Activity</DialogTitle>
          </DialogHeader>
          {editingTimeBlock && (() => {
            const schedule = schedules.find(s => s.week_number === editingTimeBlock.weekNumber)
            const activities = schedule?.activities || []
            const conflicts = getTimeConflicts(
              activities,
              editingTimeBlock.timeBlockId,
              editingTimeBlock.timeBlock.time,
              editingTimeBlock.timeBlock.duration
            )
            const endTime = getEndTime(editingTimeBlock.timeBlock.time, editingTimeBlock.timeBlock.duration)
            const originalEndMinutes = editingTimeBlock.originalTime && editingTimeBlock.originalDuration
              ? parseTime(editingTimeBlock.originalTime) + editingTimeBlock.originalDuration
              : null
            const newEndMinutes = parseTime(editingTimeBlock.timeBlock.time) + editingTimeBlock.timeBlock.duration
            const timeDiff = originalEndMinutes ? newEndMinutes - originalEndMinutes : 0
            const blocksToShift = timeDiff > 0 ? getBlocksToShift(activities, editingTimeBlock.timeBlockId, newEndMinutes) : []
            
            return (
            <div className="space-y-4 mt-4">
              {/* Time Conflict Warning */}
              {conflicts.hasConflict && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Time Conflict Detected</p>
                    <p className="text-xs text-red-600 mt-0.5">
                      This activity overlaps with: {conflicts.conflictWith.join(", ")}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Cascade Suggestion */}
              {blocksToShift.length > 0 && !conflicts.hasConflict && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <ArrowDown className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-amber-800">Shift Following Activities?</p>
                      <p className="text-xs text-amber-600 mt-0.5">
                        This change extends into the next activity. Would you like to shift {blocksToShift.length} activity(ies) forward by {timeDiff} minutes?
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {blocksToShift.map(block => (
                          <Badge key={block.id} variant="outline" className="text-xs bg-white">
                            {block.activity} ({block.time})
                          </Badge>
                        ))}
                      </div>
                      <div className="mt-2 flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs bg-transparent"
                          onClick={() => {
                            setCascadeChanges({
                              weekNumber: editingTimeBlock.weekNumber,
                              editedBlockId: editingTimeBlock.timeBlockId,
                              timeDiff,
                              affectedBlocks: blocksToShift
                            })
                            setShowCascadeConfirm(true)
                          }}
                        >
                          <ArrowDown className="h-3 w-3 mr-1" />
                          Shift All Below
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Activity Header Settings */}
              <div className="p-3 bg-gray-50 rounded-lg border">
                <h4 className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-3">Activity Settings</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Start Time</Label>
                    <Input
                      value={editingTimeBlock.timeBlock.time}
                      onChange={(e) =>
                        setEditingTimeBlock({
                          ...editingTimeBlock,
                          timeBlock: { ...editingTimeBlock.timeBlock, time: e.target.value },
                        })
                      }
                      placeholder="5:00 PM"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Duration (min)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={editingTimeBlock.timeBlock.duration}
                        onChange={(e) =>
                          setEditingTimeBlock({
                            ...editingTimeBlock,
                            timeBlock: { ...editingTimeBlock.timeBlock, duration: Number.parseInt(e.target.value) || 0 },
                          })
                        }
                        min={5}
                        max={180}
                        className="h-8 text-sm flex-1"
                      />
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="secondary" className="h-8 px-2 text-xs whitespace-nowrap">
                              <Clock className="h-3 w-3 mr-1" />
                              Ends {endTime}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Activity ends at {endTime}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Activity Name</Label>
                    <Input
                      value={editingTimeBlock.timeBlock.activity}
                      onChange={(e) =>
                        setEditingTimeBlock({
                          ...editingTimeBlock,
                          timeBlock: { ...editingTimeBlock.timeBlock, activity: e.target.value },
                        })
                      }
                      placeholder="e.g., Clinic Sessions"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Color</Label>
                    <Select
                      value={editingTimeBlock.timeBlock.color}
                      onValueChange={(v) =>
                        setEditingTimeBlock({
                          ...editingTimeBlock,
                          timeBlock: { ...editingTimeBlock.timeBlock, color: v },
                        })
                      }
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="blue">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-blue-500" />
                            Blue
                          </div>
                        </SelectItem>
                        <SelectItem value="amber">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-amber-500" />
                            Amber
                          </div>
                        </SelectItem>
                        <SelectItem value="teal">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-teal-500" />
                            Teal
                          </div>
                        </SelectItem>
                        <SelectItem value="purple">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-purple-500" />
                            Purple
                          </div>
                        </SelectItem>
                        <SelectItem value="green">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-green-500" />
                            Green
                          </div>
                        </SelectItem>
                        <SelectItem value="pink">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-pink-500" />
                            Pink
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Sessions Section */}
              <div className="border rounded-lg">
                <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b">
                  <h4 className="text-xs font-medium text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    Sessions ({editingTimeBlock.timeBlock.sessions?.length || 0})
                  </h4>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-xs gap-1 bg-transparent"
                    onClick={() => {
                      const newSession: AgendaSession = {
                        id: crypto.randomUUID(),
                        activity: editingTimeBlock.timeBlock.activity,
                        team: "",
                        directorInitials: "",
                        room: "",
                        roomNumber: "",
                        notes: "",
                        zoom_link: "",
                      }
                      setEditingTimeBlock({
                        ...editingTimeBlock,
                        timeBlock: {
                          ...editingTimeBlock.timeBlock,
                          sessions: [...(editingTimeBlock.timeBlock.sessions || []), newSession],
                        },
                      })
                    }}
                  >
                    <Plus className="h-3 w-3" />
                    Add Session
                  </Button>
                </div>
                
                <div className="divide-y max-h-[300px] overflow-y-auto">
                  {editingTimeBlock.timeBlock.sessions?.map((session, idx) => (
                    <div key={session.id} className="p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500">Session {idx + 1}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-5 w-5 p-0 text-gray-400 hover:text-red-600"
                          onClick={() => {
                            setEditingTimeBlock({
                              ...editingTimeBlock,
                              timeBlock: {
                                ...editingTimeBlock.timeBlock,
                                sessions: editingTimeBlock.timeBlock.sessions.filter((s) => s.id !== session.id),
                              },
                            })
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-[10px] text-gray-500">Team/Clinic</Label>
                          <Input
                            value={session.team}
                            onChange={(e) => {
                              const updatedSessions = editingTimeBlock.timeBlock.sessions.map((s) =>
                                s.id === session.id ? { ...s, team: e.target.value } : s
                              )
                              setEditingTimeBlock({
                                ...editingTimeBlock,
                                timeBlock: { ...editingTimeBlock.timeBlock, sessions: updatedSessions },
                              })
                            }}
                            placeholder="e.g., Accounting Clinic"
                            className="h-7 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] text-gray-500">Director Initials</Label>
                          <Input
                            value={session.directorInitials}
                            onChange={(e) => {
                              const updatedSessions = editingTimeBlock.timeBlock.sessions.map((s) =>
                                s.id === session.id ? { ...s, directorInitials: e.target.value } : s
                              )
                              setEditingTimeBlock({
                                ...editingTimeBlock,
                                timeBlock: { ...editingTimeBlock.timeBlock, sessions: updatedSessions },
                              })
                            }}
                            placeholder="e.g., KM"
                            className="h-7 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] text-gray-500">Room Type</Label>
                          <Input
                            value={session.room}
                            onChange={(e) => {
                              const updatedSessions = editingTimeBlock.timeBlock.sessions.map((s) =>
                                s.id === session.id ? { ...s, room: e.target.value } : s
                              )
                              setEditingTimeBlock({
                                ...editingTimeBlock,
                                timeBlock: { ...editingTimeBlock.timeBlock, sessions: updatedSessions },
                              })
                            }}
                            placeholder="e.g., Room, Main"
                            className="h-7 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] text-gray-500">Room Number</Label>
                          <Input
                            value={session.roomNumber}
                            onChange={(e) => {
                              const updatedSessions = editingTimeBlock.timeBlock.sessions.map((s) =>
                                s.id === session.id ? { ...s, roomNumber: e.target.value } : s
                              )
                              setEditingTimeBlock({
                                ...editingTimeBlock,
                                timeBlock: { ...editingTimeBlock.timeBlock, sessions: updatedSessions },
                              })
                            }}
                            placeholder="e.g., 201"
                            className="h-7 text-xs"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-[10px] text-gray-500">Notes</Label>
                        <Input
                          value={session.notes}
                          onChange={(e) => {
                            const updatedSessions = editingTimeBlock.timeBlock.sessions.map((s) =>
                              s.id === session.id ? { ...s, notes: e.target.value } : s
                            )
                            setEditingTimeBlock({
                              ...editingTimeBlock,
                              timeBlock: { ...editingTimeBlock.timeBlock, sessions: updatedSessions },
                            })
                          }}
                          placeholder="Optional notes for this session"
                          className="h-7 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-gray-500 flex items-center gap-1">
                          <Video className="h-3 w-3" />
                          Zoom Link
                        </Label>
                        <Input
                          value={session.zoom_link || ""}
                          onChange={(e) => {
                            const updatedSessions = editingTimeBlock.timeBlock.sessions.map((s) =>
                              s.id === session.id ? { ...s, zoom_link: e.target.value } : s
                            )
                            setEditingTimeBlock({
                              ...editingTimeBlock,
                              timeBlock: { ...editingTimeBlock.timeBlock, sessions: updatedSessions },
                            })
                          }}
                          placeholder="https://zoom.us/j/..."
                          className="h-7 text-xs"
                        />
                      </div>
                    </div>
                  ))}
                  
                  {(!editingTimeBlock.timeBlock.sessions || editingTimeBlock.timeBlock.sessions.length === 0) && (
                    <div className="p-4 text-center text-xs text-gray-500">
                      No sessions yet. Click "Add Session" to create one.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )})()}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditTimeBlockDialog(false)
                setEditingTimeBlock(null)
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (editingTimeBlock) {
                  updateTimeBlock(editingTimeBlock.weekNumber, editingTimeBlock.timeBlockId, editingTimeBlock.timeBlock)
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
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Cascade Confirmation Dialog */}
      <Dialog open={showCascadeConfirm} onOpenChange={setShowCascadeConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowDown className="h-5 w-5 text-amber-600" />
              Shift Following Activities
            </DialogTitle>
          </DialogHeader>
          {cascadeChanges && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                This will shift the following {cascadeChanges.affectedBlocks.length} activity(ies) forward by {cascadeChanges.timeDiff} minutes:
              </p>
              <div className="bg-gray-50 rounded-lg p-3 space-y-2 max-h-[200px] overflow-y-auto">
                {cascadeChanges.affectedBlocks.map(block => {
                  const newTime = formatTime(parseTime(block.time) + cascadeChanges.timeDiff)
                  return (
                    <div key={block.id} className="flex items-center justify-between text-sm">
                      <span className="font-medium">{block.activity}</span>
                      <div className="flex items-center gap-2 text-gray-500">
                        <span className="line-through">{block.time}</span>
                        <ChevronRight className="h-3 w-3" />
                        <span className="text-green-600 font-medium">{newTime}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCascadeConfirm(false)
                    setCascadeChanges(null)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    if (cascadeChanges && editingTimeBlock) {
                      // First save the current edit
                      await updateTimeBlock(editingTimeBlock.weekNumber, editingTimeBlock.timeBlockId, editingTimeBlock.timeBlock)
                      // Then apply cascade
                      await applyCascadeShift(cascadeChanges.weekNumber, cascadeChanges.editedBlockId, cascadeChanges.timeDiff)
                      setShowEditTimeBlockDialog(false)
                      setEditingTimeBlock(null)
                    }
                  }}
                  disabled={saving}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Shifting...
                    </>
                  ) : (
                    <>
                      <ArrowDown className="h-4 w-4 mr-2" />
                      Shift All
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { UnifiedWeeklyAgenda }

export default UnifiedWeeklyAgenda
