"use client"

import React from "react"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { MainNavigation } from "@/components/main-navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  Bell,
  Calendar,
  BookOpen,
  FileText,
  Plus,
  Upload,
  Download,
  Trash2,
  FolderOpen,
  File,
  FileImage,
  FileSpreadsheet,
  Presentation,
  FileCheck,
  Files,
  FileCode,
  Loader2,
  AlertCircle,
  AlertTriangle,
  ClipboardList,
  Star,
  CheckCircle2,
  Clock,
  Users,
  Send,
  Megaphone,
  Building2,
  Key,
  Save,
  XCircle,
  Pencil,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { UnifiedWeeklyAgenda } from "@/components/unified-weekly-agenda"
import { useDemoMode } from "@/contexts/demo-mode-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { useUserRole } from "@/hooks/use-user-role"
import { useCurrentSemester } from "@/hooks/use-current-semester"
import { MeetingsQueue } from "@/components/meetings-queue"
import { ClinicAgendaTab } from "@/components/clinic-agenda-tab"

// Mock announcements - REMOVED - will fetch from database
// const mockAnnouncements = [
//   {
//     id: "1",
//     title: "Mid-semester Review Schedule",
//     content: "Mid-semester reviews will be held during weeks 7-8. Please prepare your progress reports.",
//     postedBy: "Program Director",
//     postedAt: "2025-01-15",
//     priority: "high",
//   },
//   {
//     id: "2",
//     title: "Guest Speaker Next Week",
//     content: "We will have a guest speaker from industry discussing career opportunities.",
//     postedBy: "Nick Vadala",
//     postedAt: "2025-01-10",
//     priority: "normal",
//   },
// ]

// Mock course schedule
const mockCourseSchedule = [
  { week: 1, date: "Jan 13", topic: "Program Orientation & Team Formation", type: "orientation" },
  { week: 2, date: "Jan 20", topic: "Client Kickoff Meetings", type: "meeting" },
  { week: 3, date: "Jan 27", topic: "Project Planning & SOW Development", type: "workshop" },
  { week: 4, date: "Feb 3", topic: "Research Methods & Data Collection", type: "lecture" },
  { week: 5, date: "Feb 10", topic: "Progress Check-ins", type: "meeting" },
  { week: 6, date: "Feb 17", topic: "Analysis Frameworks", type: "workshop" },
  { week: 7, date: "Feb 24", topic: "Mid-semester Reviews", type: "review" },
  { week: 8, date: "Mar 3", topic: "Mid-semester Reviews (cont.)", type: "review" },
]

// Director initials to full name mapping (will be replaced by DB fetch)
const directorInitials: Record<string, string> = {}

// Weekly agenda data structure
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
  activity: string
  duration: number
  color: string
  sessions: AgendaSession[]
}

interface CourseMaterial {
  id: string
  title: string
  description: string | null
  file_name: string
  file_url: string
  file_type: string
  file_size: number
  uploaded_by_name: string
  uploaded_by_email: string | null
  category: string
  target_clinic: string
  created_at: string
}

// Define Announcement interface
interface Announcement {
  id: string
  title: string
  content: string
  postedBy: string
  postedAt: string
  priority: "high" | "normal"
  clinicId: string | null
  clinicName: string | null
  targetAudience?: "students" | "directors"
}

// Director initials mapping - will be populated from database
const getDirectorInitialsMap = (directors: Array<{ full_name: string; clinic: string }>) => {
  const map: Record<string, string> = {}
  directors.forEach((d) => {
    // Create initials from full name (e.g., "Mark Dwyer" -> "MD")
    const names = d.full_name.split(" ")
    const initials = names.map((n) => n[0]?.toUpperCase() || "").join("")
    map[initials] = d.full_name
  })
  return map
}

const EVALUATION_QUESTIONS = [
  {
    id: 1,
    question: "How was the presentation opening?",
    guidance:
      "Consider attributes of clear & concise communication of presentation purpose and did the opening pique your interest.",
  },
  {
    id: 2,
    question:
      "Did the presenter(s) demonstrate confidence and knowledge of their client's business and how the business model works?",
    guidance: "Consider knowing the market, customers, how the product/service is sold and delivered.",
  },
  {
    id: 3,
    question: "Did the presenter(s) demonstrate knowledge of their client's industry?",
    guidance:
      "Consider knowing the general market, competition, and where the client fits within the industry at their current business stage.",
  },
  {
    id: 4,
    question: "Did the presenter(s) demonstrate knowledge of how the business measures/monitors performance?",
    guidance: "Consider key performance indicators, reporting, and systems required to measure performance.",
  },
  {
    id: 5,
    question: "Was the team able to outline their project?",
    guidance: "Consider ability to outline key deliverables and expected results.",
  },
]

const FINAL_EVALUATION_QUESTIONS = [
  {
    id: 1,
    question: "How was the presentation opening?",
    guidance:
      "Consider attributes of clear & concise communication of the presentation purpose and did the opening pique your interest.",
  },
  {
    id: 2,
    question:
      "Did the presenter(s) demonstrate confidence and knowledge of the client's deliverables and the related solutions/recommendations?",
    guidance: "Consider communication of the challenge and solutions/recommendations was clear.",
  },
  {
    id: 3,
    question: "Did the presenter(s) demonstrate knowledge of their client's business & industry?",
    guidance:
      "Consider how the solutions/recommendations were put in the context of the client's business stage and industry.",
  },
  {
    id: 4,
    question: "What was the quality of the recommendations?",
    guidance: "Were they well thought out, clear, fit the client business, and implementable.",
  },
  {
    id: 5,
    question:
      "Was the team organized in presenting their solutions as a team and handling the questions and answer session?",
    guidance: "Consider if all team members participated, were the transitions smooth and clean.",
  },
]

const DELIVERABLES_CONFIG = {
  sow: {
    title: "Statement of Work (SOW)",
    description:
      "Document outlining the project scope, objectives, deliverables, and timeline agreed upon with the client.",
    dueDate: "Week 4",
    weight: "Part of Team Grade (20%)",
    instructions: [
      "Define clear project objectives and scope",
      "Outline specific deliverables and milestones",
      "Establish timeline with key dates",
      "Identify resources and team responsibilities",
      "Get client sign-off before proceeding",
    ],
  },
  midterm: {
    title: "Mid-Term Presentation",
    description: "Present your research findings, industry analysis, and project progress to instructors and guests.",
    dueDate: "October 27, 2025",
    weight: "Client Team Grade (20%)",
    instructions: [
      "Present client business overview and model",
      "Demonstrate industry knowledge and competitive landscape",
      "Show KPIs and performance metrics",
      "Outline project focus and expected deliverables",
      "15-minute presentation with Q&A",
    ],
  },
  final: {
    title: "Final Presentation",
    description: "Deliver comprehensive research, solutions, and recommendations to the client and evaluation panel.",
    dueDate: "End of Semester (Dec 2025)",
    weight: "Team Grade (30%)",
    instructions: [
      "Use SEED PowerPoint template (same as mid-term)",
      "Send draft to primary clinic director 24 hours before client submission",
      "Send final presentation to client 24 hours before presentation day",
      "Forward presentation to MJ and all clinic directors when sending to client",
      "Arrive early to set up and meet your client",
      "Dress code: Business casual",
      "All team members must participate",
    ],
    submissionSteps: [
      "Team leaders coordinate presentation construction in PowerPoint format",
      "Primary clinic director reviews presentation before sending to client",
      "Send near-final draft for review - doesn't need to be complete",
      "Arrange brief call/Zoom with clinic director for feedback",
      "Submit final presentation to client after director approval",
      "Copy your team and primary clinic director on client email",
      "Forward to MJ and all clinic directors simultaneously",
    ],
    presentationDay: [
      "Arrive early to set up and coordinate with team and MJ",
      "Meet and greet your client",
      "Your audience: client(s), clinic director(s), legal team member, or Prof. Letwin",
      "Have bottles of water in the room for your client",
      "Teams not presenting are not required to attend class",
    ],
  },
}

export default function ClassCoursePage() {
  // Initialize useSearchParams
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get("tab") || "announcements"
  const { toast } = useToast()
  
  const [copied, setCopied] = useState(false)
  const [editingSession, setEditingSession] = useState<string | null>(null)
  const [directors, setDirectors] = useState<Array<{ id: string; full_name: string; clinic: string }>>([])
  const [clients, setClients] = useState<
    Array<{
      id: string
      name: string
      teamMembers?: Array<{ student_id: string; student_name: string; student_role: string; student_email: string }>
    }>
  >([])
  const [scheduleNotes, setScheduleNotes] = useState("")

  const [materials, setMaterials] = useState<CourseMaterial[]>([])
  const [loadingMaterials, setLoadingMaterials] = useState(true)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterClinic, setFilterClinic] = useState("all")

  const [evaluationDialogOpen, setEvaluationDialogOpen] = useState(false)
  const [selectedClientForEval, setSelectedClientForEval] = useState<string | null>(null)
  const [selectedDirectorForEval, setSelectedDirectorForEval] = useState<string>("")
  const [evaluationRatings, setEvaluationRatings] = useState<Record<number, number>>({})
  const [evaluationNotes, setEvaluationNotes] = useState<Record<number, string>>({})
  const [additionalComments, setAdditionalComments] = useState("")
  const [submittingEvaluation, setSubmittingEvaluation] = useState(false)
  const [evaluationType, setEvaluationType] = useState<"midterm" | "final">("midterm")
  const [evaluations, setEvaluations] = useState<
    Array<{
      id: string
      client_id: string
      director_name: string
      created_at: string
      average_rating: number
      evaluation_type?: string
      question_1_rating?: number
      question_1_notes?: string
      question_2_rating?: number
      question_2_notes?: string
      question_3_rating?: number
      question_3_notes?: string
      question_4_rating?: number
      question_4_notes?: string
      question_5_rating?: number
      question_5_notes?: string
      additional_comments?: string
    }>
  >([])
  const [clientDeliverables, setClientDeliverables] = useState<
    Record<string, { sow: boolean; midterm: boolean; final: boolean }>
  >({})

  const [attendanceRecords, setAttendanceRecords] = useState<
    Array<{
      id: string
      studentId: string
      studentName: string
      studentEmail: string
      classDate: string
      weekNumber: number
      weekEnding: string
      clinic: string
      notes: string
      submittedAt?: string // Added for attendance submission time
      is_present: boolean // Present/absent status
    }>
  >([])
  const [loadingAttendance, setLoadingAttendance] = useState(true)

  // State for password management
  interface WeekPassword {
    id: string
    week_number: number
    password: string
    created_at: string
    updated_at: string
    week_start: string | null // Added for date range
    week_end: string | null // Added for date range
    semesterId: string // Added for semester association
  }
  const [weekPasswords, setWeekPasswords] = useState<WeekPassword[]>([])
  const [newPasswordWeek, setNewPasswordWeek] = useState<string>("")
  const [newPassword, setNewPassword] = useState<string>("")
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [editingPasswordWeek, setEditingPasswordWeek] = useState<number | null>(null)
  const [editPasswordValue, setEditPasswordValue] = useState("")
  const [selectedPasswordWeek, setSelectedPasswordWeek] = useState<number | null>(null)
  const [recentlySetWeek, setRecentlySetWeek] = useState<number | null>(null)
  
// Attendance edit mode state - tracks which clinic is being edited and pending changes
  const [attendanceEditMode, setAttendanceEditMode] = useState<Record<string, boolean>>({})
  const [pendingAttendanceChanges, setPendingAttendanceChanges] = useState<
  Record<string, { studentId: string; studentName: string; newStatus: boolean }[]>
  >({})
  const [confirmedAttendance, setConfirmedAttendance] = useState<Record<string, boolean>>({})

  const [scheduleData, setScheduleData] = useState<TimeBlock[]>([
    {
      id: "1",
      time: "5:00 PM",
      activity: "All-hands Updates",
      duration: 15,
      color: "slate",
      sessions: [
        { id: "1-1", team: "All Hands", directorInitials: "", room: "SEED Lounge", roomNumber: "102", notes: "" },
      ],
    },
    {
      id: "2",
      time: "5:15 PM",
      activity: "Clinic Team Meetings",
      duration: 45,
      color: "blue",
      sessions: [
        {
          id: "2-1",
          team: "Accounting Clinic",
          directorInitials: "MD/DL",
          room: "Class Room",
          roomNumber: "101",
          notes: "",
        },
        {
          id: "2-2",
          team: "Consulting Clinic",
          directorInitials: "NV/BD",
          room: "SEED Lounge",
          roomNumber: "102",
          notes: "",
        },
        { id: "2-3", team: "Funding Clinic", directorInitials: "KM", room: "Class Room", roomNumber: "103", notes: "" },
        {
          id: "2-4",
          team: "Marketing Clinic",
          directorInitials: "CH",
          room: "Class Room",
          roomNumber: "104",
          notes: "",
        },
      ],
    },
    {
      id: "3",
      time: "6:00 PM",
      activity: "Teams Meet with Clinic Directors",
      duration: 90,
      color: "amber",
      sessions: [
        { id: "3-1", team: "Legends Team", directorInitials: "MD", room: "Class Room", roomNumber: "101", notes: "" },
        {
          id: "3-2",
          team: "Serene Team",
          directorInitials: "BD/NV",
          room: "SEED Lounge",
          roomNumber: "102",
          notes: "",
        },
        {
          id: "3-3",
          team: "Intriguing Team",
          directorInitials: "BD/NV",
          room: "SEED Lounge",
          roomNumber: "102",
          notes: "",
        },
        { id: "3-4", team: "Parks Team", directorInitials: "NV", room: "SEED Lounge", roomNumber: "102", notes: "" },
        { id: "3-5", team: "Malden Team", directorInitials: "NV", room: "SEED Lounge", roomNumber: "102", notes: "" },
        { id: "3-6", team: "SEED Team", directorInitials: "KM", room: "Class Room", roomNumber: "103", notes: "" },
        { id: "3-7", team: "Marabou Team", directorInitials: "KM", room: "Class Room", roomNumber: "103", notes: "" },
        { id: "3-8", team: "Paw Team", directorInitials: "CH", room: "Class Room", roomNumber: "104", notes: "" },
        { id: "3-9", team: "REWRITE Team", directorInitials: "CH", room: "Class Room", roomNumber: "104", notes: "" },
      ],
    },
  ])

  const [publishing, setPublishing] = useState(false)
  const [publishSuccess, setPublishSuccess] = useState(false)

  // Upload form state
  const [uploadTitle, setUploadTitle] = useState("")
  const [uploadDescription, setUploadDescription] = useState("")
  const [uploadTargetClinic, setUploadTargetClinic] = useState("all")
  const [uploadCategory, setUploadCategory] = useState("resource")
  const [uploadFile, setUploadFile] = useState<File | null>(null)

  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true)
  const [announcementDialogOpen, setAnnouncementDialogOpen] = useState(false)
  const [newAnnouncementTitle, setNewAnnouncementTitle] = useState("")
  const [newAnnouncementContent, setNewAnnouncementContent] = useState("")
  const [newAnnouncementClinic, setNewAnnouncementClinic] = useState<string>("all")
  const [newAnnouncementPriority, setNewAnnouncementPriority] = useState<"high" | "normal">("normal")
  const [newAnnouncementAudience, setNewAnnouncementAudience] = useState<"students" | "directors">("students")
  const [postingAnnouncement, setPostingAnnouncement] = useState(false)
  const [clinics, setClinics] = useState<Array<{ id: string; name: string }>>([])
const { isDemoMode } = useDemoMode()
  const { fullName: userName, email: userEmail } = useUserRole()
  
  // State for student selection in demo mode
  interface Student {
    id: string
    first_name: string
    last_name: string
    email: string
    clinic_id: string
    clinic_name: string
    is_team_lead?: boolean // Added for role display
  }
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState<string>("")
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)

  // State for Roster Data
  const [rosterData, setRosterData] = useState<any[]>([])

  // Agenda section state
  const [agendaSection, setAgendaSection] = useState<"weekly" | "semester">("weekly")

const semesterName = "Spring 2026" // Define semester name
  const { semesterId } = useCurrentSemester()
  
  const [semesterSchedule, setSemesterSchedule] = useState<any[]>([])

  useEffect(() => {
const fetchSemesterSchedule = async () => {
  try {
  const res = await fetch(`/api/semester-schedule?semesterId=${semesterId}`)
        if (res.ok) {
          const data = await res.json()
          setSemesterSchedule(data.schedules || [])
        }
      } catch (error) {
        console.error("Error fetching semester schedule:", error)
      }
    }
    fetchSemesterSchedule()
  }, [])

  useEffect(() => {
    const fetchEvaluations = async () => {
      try {
        const res = await fetch("/api/evaluations")
        if (res.ok) {
          const data = await res.json()
          setEvaluations(data.evaluations || [])
        }
      } catch (error) {
        console.error("Error fetching evaluations:", error)
      }
    }

    const fetchClientDeliverables = async () => {
      try {
        const res = await fetch("/api/documents?submissionType=all")
        if (res.ok) {
          const data = await res.json()
          const deliverablesByClient: Record<string, { sow: boolean; midterm: boolean; final: boolean }> = {}

          for (const doc of data.documents || []) {
            if (!deliverablesByClient[doc.client_id]) {
              deliverablesByClient[doc.client_id] = { sow: false, midterm: false, final: false }
            }
            if (doc.submission_type === "sow") deliverablesByClient[doc.client_id].sow = true
            if (doc.submission_type === "midterm") deliverablesByClient[doc.client_id].midterm = true
            if (doc.submission_type === "final") deliverablesByClient[doc.client_id].final = true
          }

          setClientDeliverables(deliverablesByClient)
        }
      } catch (error) {
        console.error("Error fetching deliverables:", error)
      }
    }

    fetchEvaluations()
    fetchClientDeliverables()
  }, [])

  // Fetch directors and clients from database
  useEffect(() => {
    const fetchDirectors = async () => {
      try {
        const res = await fetch("/api/directors")
        if (res.ok) {
          const data = await res.json()
          setDirectors(data.directors || [])
        }
      } catch (error) {
        console.error("Error fetching directors:", error)
      }
    }
    fetchDirectors()
  }, [])

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await fetch("/api/supabase/clients")
        if (res.ok) {
          const data = await res.json()
          const clientsWithTeams = data.clients || []

          // Fetch team members for each client
          const teamRes = await fetch("/api/supabase/v-complete-mapping")
          if (teamRes.ok) {
            const teamData = await teamRes.json()
            const mappings = teamData.records || []

            for (const client of clientsWithTeams) {
              client.teamMembers = mappings
                .filter((m: any) => m.client_id === client.id)
                .map((m: any) => ({
                  student_id: m.student_id,
                  student_name: m.student_name,
                  student_role: m.student_role,
                  student_email: m.student_email,
                }))
            }
          }

          setClients(clientsWithTeams)
        }
      } catch (error) {
        console.error("Error fetching clients:", error)
      }
    }
    fetchClients()
  }, [])

  useEffect(() => {
    const fetchAnnouncements = async () => {
      setLoadingAnnouncements(true)
      try {
        const res = await fetch("/api/announcements")
        if (res.ok) {
          const data = await res.json()
          setAnnouncements(data.announcements || [])
        }
      } catch (error) {
        console.error("Error fetching announcements:", error)
      } finally {
        setLoadingAnnouncements(false)
      }
    }

    const fetchClinics = async () => {
      try {
        const res = await fetch("/api/supabase/clinics")
        if (res.ok) {
          const data = await res.json()
          setClinics(data.clinics || [])
        }
      } catch (error) {
        console.error("Error fetching clinics:", error)
      }
    }

    fetchAnnouncements()
    fetchClinics()
  }, [])

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await fetch("/api/supabase/students")
        if (res.ok) {
          const data = await res.json()
          setStudents(data.students || [])
        } else {
          console.error("Failed to fetch students")
        }
      } catch (error) {
        console.error("Error fetching students:", error)
      }
    }
    fetchStudents()
  }, [])

  // Fetch roster data for absent students
  useEffect(() => {
    const fetchRosterForAbsent = async () => {
      try {
        const response = await fetch("/api/supabase/v-complete-mapping")
        if (response.ok) {
          const data = await response.json()
          setRosterData(data.mappings || [])
        }
      } catch (error) {
        console.error("[v0] Error fetching roster:", error)
      }
    }

    fetchRosterForAbsent()
  }, [])

  // Update selectedStudent when selectedStudentId changes
  useEffect(() => {
    if (selectedStudentId) {
      const student = students.find((s) => s.id === selectedStudentId)
      setSelectedStudent(student || null)
    } else {
      setSelectedStudent(null)
    }
  }, [selectedStudentId, students])

  useEffect(() => {
    fetchMaterials()
  }, [filterCategory, filterClinic])

  const fetchMaterials = async () => {
    setLoadingMaterials(true)
    setUploadError(null)
    try {
      const params = new URLSearchParams()
      if (filterCategory !== "all") params.append("category", filterCategory)
      if (filterClinic !== "all") params.append("clinic", filterClinic)

      const res = await fetch(`/api/course-materials?${params}`)
      if (res.ok) {
        const data = await res.json()
        setMaterials(data.materials || [])
      } else {
        console.error("Failed to fetch materials")
        setUploadError("Failed to load materials")
      }
    } catch (error) {
      console.error("Error fetching materials:", error)
      setUploadError("Error loading materials")
    } finally {
      setLoadingMaterials(false)
    }
  }

  const handleUpload = async () => {
    if (!uploadFile || !uploadTitle) return

    setUploading(true)
    setUploadError(null)

    try {
      const formData = new FormData()
      formData.append("file", uploadFile)
      formData.append("title", uploadTitle)
      formData.append("description", uploadDescription)
      formData.append("targetClinic", uploadTargetClinic)
formData.append("category", uploadCategory)
    // Use actual authenticated user info
    formData.append("uploadedByName", userName || "Program Director")
    formData.append("uploadedByEmail", userEmail || "director@example.com")

      const res = await fetch("/api/course-materials", {
        method: "POST",
        body: formData,
      })

      if (res.ok) {
        // Reset form and close dialog
        setUploadTitle("")
        setUploadDescription("")
        setUploadTargetClinic("all")
        setUploadCategory("resource")
        setUploadFile(null)
        setUploadDialogOpen(false)
        // Refresh materials
        await fetchMaterials()
      } else {
        const errorData = await res.json()
        setUploadError(errorData.error || "Upload failed")
      }
    } catch (error) {
      console.error("Error uploading material:", error)
      setUploadError("Upload failed. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteMaterial = async (material: CourseMaterial) => {
    if (!confirm("Are you sure you want to delete this material?")) return

    try {
      const res = await fetch("/api/course-materials", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: material.id, fileUrl: material.file_url }),
      })

      if (res.ok) {
        fetchMaterials()
      }
    } catch (error) {
      console.error("Error deleting material:", error)
    }
  }

  const handlePublishAgenda = async () => {
    setPublishing(true)
    try {
      const res = await fetch("/api/published-agendas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schedule_date: new Date().toISOString().split("T")[0],
          director_name: "Nick Vadala",
          zoom_link: "https://zoom.us/j/123456789",
          schedule_data: scheduleData,
          notes: scheduleNotes,
          published_by: "director@example.com",
        }),
      })

      if (res.ok) {
        setPublishSuccess(true)
        setTimeout(() => setPublishSuccess(false), 3000)
      }
    } catch (error) {
      console.error("Error publishing agenda:", error)
    } finally {
      setPublishing(false)
    }
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.includes("pdf")) return <FileText className="h-5 w-5" />
    if (fileType.includes("image")) return <FileImage className="h-5 w-5" />
    if (fileType.includes("spreadsheet") || fileType.includes("excel")) return <FileSpreadsheet className="h-5 w-5" />
    if (fileType.includes("presentation") || fileType.includes("powerpoint"))
      return <Presentation className="h-5 w-5" />
    return <File className="h-5 w-5" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "syllabus":
        return "bg-blue-100 text-blue-800"
      case "lecture":
        return "bg-purple-100 text-purple-800"
      case "assignment":
        return "bg-amber-100 text-amber-800"
      case "resource":
        return "bg-emerald-100 text-emerald-800"
      case "template":
        return "bg-slate-100 text-slate-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Map director initials to full names from database
  const getDirectorName = (initials: string): string => {
    if (!initials) return ""

    // Build initials map from fetched directors
    const initialsMap = getDirectorInitialsMap(directors)

    // Handle multiple directors (e.g., "MD/DL")
    const parts = initials.split("/")
    const names = parts.map((init) => {
      const upperInit = init.toUpperCase().trim()
      return initialsMap[upperInit] || init
    })
    return names.join(" & ")
  }

  const copyZoomLink = () => {
    navigator.clipboard.writeText("https://zoom.us/j/123456789")
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const updateSession = (blockId: string, sessionId: string, field: keyof AgendaSession, value: string) => {
    setScheduleData((blocks) =>
      blocks.map((block) => {
        if (block.id === blockId) {
          return {
            ...block,
            sessions: block.sessions.map((session) => {
              if (session.id === sessionId) {
                return { ...session, [field]: value }
              }
              return session
            }),
          }
        }
        return block
      }),
    )
  }

  const getBlockHeaderColor = (color: string) => {
    switch (color) {
      case "slate":
        return "bg-slate-700 text-white"
      case "blue":
        return "bg-blue-900 text-white"
      case "amber":
        return "bg-amber-900 text-white"
      default:
        return "bg-slate-700 text-white"
    }
  }

  const getBlockBorderColor = (color: string) => {
    switch (color) {
      case "slate":
        return "border-l-slate-500"
      case "blue":
        return "border-l-blue-700"
      case "amber":
        return "border-l-amber-700"
      default:
        return "border-l-slate-500"
    }
  }

  const groupMaterialsByClinicAndCategory = (materials: CourseMaterial[]) => {
    const grouped: Record<string, Record<string, CourseMaterial[]>> = {}

    // First, separate "All Clinics" from specific clinics
    const clinicOrder = ["all", "Accounting", "Consulting", "Funding", "Marketing"]

    materials.forEach((material) => {
      const clinic = material.target_clinic
      const category = material.category

      if (!grouped[clinic]) {
        grouped[clinic] = {}
      }
      if (!grouped[clinic][category]) {
        grouped[clinic][category] = []
      }
      grouped[clinic][category].push(material)
    })

    // Sort clinics by predefined order
    const sortedGrouped: Record<string, Record<string, CourseMaterial[]>> = {}
    clinicOrder.forEach((clinic) => {
      if (grouped[clinic]) {
        sortedGrouped[clinic] = grouped[clinic]
      }
    })

    return sortedGrouped
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "syllabus":
        return "Syllabi"
      case "lecture":
        return "Lectures"
      case "assignment":
        return "Assignments"
      case "resource":
        return "Resources"
      case "template":
        return "Templates"
      default:
        return category
    }
  }

  const getClinicLabel = (clinic: string) => {
    return clinic === "all" ? "All Clinics (Program-Wide)" : `${clinic} Clinic`
  }

  const handlePostAnnouncement = async () => {
    if (!newAnnouncementTitle.trim() || !newAnnouncementContent.trim()) {
      alert("Please fill in all required fields")
      return
    }

    setPostingAnnouncement(true)
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newAnnouncementTitle,
          content: newAnnouncementContent,
          clinicId: newAnnouncementClinic === "all" ? null : newAnnouncementClinic,
          priority: newAnnouncementPriority,
          postedBy: "Program Director", // This could be dynamic based on logged in user
          targetAudience: newAnnouncementAudience,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setAnnouncements((prev) => [data.announcement, ...prev])
        setAnnouncementDialogOpen(false)
        setNewAnnouncementTitle("")
        setNewAnnouncementContent("")
        setNewAnnouncementClinic("all")
        setNewAnnouncementPriority("normal")
        setNewAnnouncementAudience("students")
      } else {
        const error = await res.json()
        alert(error.error || "Failed to post announcement")
      }
    } catch (error) {
      console.error("Error posting announcement:", error)
      alert("Failed to post announcement")
    } finally {
      setPostingAnnouncement(false)
    }
  }

  const handleSubmitEvaluation = async () => {
    if (!selectedClientForEval || !selectedDirectorForEval) return

    const questions = evaluationType === "final" ? FINAL_EVALUATION_QUESTIONS : EVALUATION_QUESTIONS

    // Validate all ratings are filled
    const missingRatings = questions.filter((q) => !evaluationRatings[q.id])
    if (missingRatings.length > 0) {
      alert("Please provide ratings for all questions")
      return
    }

    setSubmittingEvaluation(true)
    try {
      const res = await fetch("/api/evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: selectedClientForEval,
          director_name: selectedDirectorForEval,
          evaluation_type: evaluationType, // Include evaluation type
          question_1_rating: evaluationRatings[1],
          question_1_notes: evaluationNotes[1] || "",
          question_2_rating: evaluationRatings[2],
          question_2_notes: evaluationNotes[2] || "",
          question_3_rating: evaluationRatings[3],
          question_3_notes: evaluationNotes[3] || "",
          question_4_rating: evaluationRatings[4],
          question_4_notes: evaluationNotes[4] || "",
          question_5_rating: evaluationRatings[5],
          question_5_notes: evaluationNotes[5] || "",
          additional_comments: additionalComments,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        // Ensure the new evaluation includes the type
        setEvaluations((prev) => [...prev, { ...data.evaluation, evaluation_type: evaluationType }])
        setEvaluationDialogOpen(false)
        resetEvaluationForm()
      } else {
        const error = await res.json()
        alert(error.error || "Failed to submit evaluation")
      }
    } catch (error) {
      console.error("Error submitting evaluation:", error)
      alert("Failed to submit evaluation")
    } finally {
      setSubmittingEvaluation(false)
    }
  }

  const resetEvaluationForm = () => {
    setSelectedClientForEval(null)
    setSelectedDirectorForEval("")
    setEvaluationRatings({})
    setEvaluationNotes({})
    setAdditionalComments("")
    setEvaluationType("midterm") // Reset to default
  }

  const openEvaluationDialog = (clientId: string, type: "midterm" | "final") => {
    setSelectedClientForEval(clientId)
    setEvaluationType(type) // Set the evaluation type
    setEvaluationDialogOpen(true)
  }

  const getClientEvaluations = (clientId: string, type?: "midterm" | "final") => {
    return evaluations.filter((e) => {
      const matchesClient = e.client_id === clientId
      // Default to 'midterm' if evaluation_type is missing, to avoid filtering out old evaluations
      const matchesType = type ? (e.evaluation_type || "midterm") === type : true
      return matchesClient && matchesType
    })
  }

  // Helper to get current week number (assuming semester starts on Jan 1st for simplicity)
  // Replaced with semester-aware calculation
  const getCurrentWeekNumber = () => {
    if (!semesterSchedule || semesterSchedule.length === 0) {
      return 1 // Default to Week 1 if schedule not loaded
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0) // Reset to start of day for accurate comparison

    // Find the week that contains today's date
    const currentWeek = semesterSchedule.find((week) => {
      const weekStart = new Date(week.week_start)
      const weekEnd = new Date(week.week_end)
      weekStart.setHours(0, 0, 0, 0)
      weekEnd.setHours(23, 59, 59, 999)

      return today >= weekStart && today <= weekEnd
    })

    if (currentWeek) {
      console.log("[v0] Current week found:", currentWeek.week_number, currentWeek.week_label)
      return currentWeek.week_number
    }

    // If today is before semester starts, return 1
    const firstWeek = semesterSchedule[0]
    if (firstWeek && today < new Date(firstWeek.week_start)) {
      console.log("[v0] Before semester start, defaulting to Week 1")
      return 1
    }

    // If today is after semester ends, return the last week
    const lastWeek = semesterSchedule[semesterSchedule.length - 1]
    if (lastWeek && today > new Date(lastWeek.week_end)) {
      console.log("[v0] After semester end, using last week:", lastWeek.week_number)
      return lastWeek.week_number
    }

    console.log("[v0] Could not determine current week, defaulting to 1")
    return 1 // Default fallback
  }

  // Fetch attendance records
  useEffect(() => {
    const fetchAttendanceRecords = async () => {
setLoadingAttendance(true)
  try {
  const res = await fetch(`/api/supabase/attendance?semesterId=${semesterId}`)
        if (res.ok) {
          const data = await res.json()
          console.log("[v0] Fetched attendance records for Spring 2026:", data.attendance?.length || 0)
          setAttendanceRecords(data.attendance || [])
        } else {
          console.error("Failed to fetch attendance records")
        }
      } catch (error) {
        console.error("Error fetching attendance records:", error)
      } finally {
        setLoadingAttendance(false)
      }
    }
    fetchAttendanceRecords()
  }, [])

  // Fetch week passwords
  useEffect(() => {
    const fetchWeekPasswords = async () => {
      try {
        const res = await fetch("/api/attendance-password")
        if (res.ok) {
          const data = await res.json()
          setWeekPasswords(data.passwords || [])
        } else {
          console.error("Failed to fetch week passwords")
        }
      } catch (error) {
        console.error("Error fetching week passwords:", error)
      }
    }
    fetchWeekPasswords()
  }, [])

// Handle setting a new password
  const handleSetPassword = async () => {
  const weekNumber = Number.parseInt(newPasswordWeek, 10)
  
  if (!newPasswordWeek || !newPassword.trim()) {
      alert("Please enter both week number and password")
      return
    }

    if (isNaN(weekNumber) || weekNumber <= 0) {
      alert("Week number must be a positive integer")
      return
    }

    const uniqueWeeks =
      semesterSchedule.length > 0
        ? Array.from(new Map(semesterSchedule.map((w: any) => [w.week_number, w])).values())
        : Array.from({ length: 17 }, (_, i) => ({
            week_number: i + 1,
            week_start: null,
            week_end: null,
          }))

    console.log(
      "[v0] Unique weeks:",
      uniqueWeeks.map((w: any) => w.week_number),
    )

    const weekInfo = uniqueWeeks.find((w: any) => w.week_number === weekNumber)

    console.log("[v0] Found weekInfo:", weekInfo ? `Week ${weekInfo.week_number}` : "NOT FOUND")

    if (!weekInfo) {
      alert(
        `Invalid week number. Please select a valid week from the dropdown. Available weeks: ${uniqueWeeks.map((w: any) => w.week_number).join(", ")}`,
      )
      return
    }

    setSavingPassword(true)
    
    try {
      const res = await fetch("/api/attendance-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
body: JSON.stringify({
  weekNumber: weekNumber,
  semesterId: semesterId,
  password: newPassword,
          weekStart: weekInfo.week_start || null,
          weekEnd: weekInfo.week_end || null,
          userEmail: userEmail,
          createdByName: userName,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        // Update password list - check if updating existing or adding new
        setWeekPasswords((prev) => {
          const existingIndex = prev.findIndex((p) => p.week_number === weekNumber)
          if (existingIndex >= 0) {
            const updated = [...prev]
            updated[existingIndex] = data.password
            return updated
          }
          return [...prev, data.password]
        })
        setNewPasswordWeek("")
        setNewPassword("")
        // Navigate to the newly set week to show the user
        setSelectedPasswordWeek(weekNumber)
        setRecentlySetWeek(weekNumber)
        // Clear the "just set" indicator after 10 seconds
        setTimeout(() => setRecentlySetWeek(null), 10000)
toast({
          title: "Success",
          description: `Password for Week ${weekNumber} set successfully!`,
        })
  } else {
  const error = await res.json()
        toast({
          title: "Error",
          description: error.error || "Failed to set password",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error setting password:", error)
      alert("Failed to set password. Please try again.")
    } finally {
      setSavingPassword(false)
    }
  }

  // Handle updating an existing password
  const handleUpdatePassword = async (weekNumber: number, newPasswordValue: string) => {
    if (!newPasswordValue.trim()) {
      alert("Password cannot be empty")
      return
    }

    const weekInfo = semesterSchedule.find((w: any) => w.week_number === weekNumber)

    setSavingPassword(true)
    try {
      const res = await fetch("/api/attendance-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekNumber: weekNumber,
          semesterId: semesterId,
          password: newPasswordValue,
          weekStart: weekInfo?.week_start || null,
          weekEnd: weekInfo?.week_end || null,
          userEmail: userEmail,
          createdByName: userName,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        // Update the password in the list
        setWeekPasswords((prev) => {
          const existing = prev.findIndex((p) => p.week_number === weekNumber)
          if (existing >= 0) {
            const updated = [...prev]
            updated[existing] = data.password
            return updated
          }
          return [...prev, data.password]
        })
        setEditingPasswordWeek(null)
        setEditPasswordValue("")
        toast({
          title: "Success",
          description: `Password for Week ${weekNumber} updated successfully!`,
        })
      } else {
        const error = await res.json()
        toast({
          title: "Error",
          description: error.error || "Failed to update password",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating password:", error)
      alert("Failed to update password. Please try again.")
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-52 border-r bg-card z-40">
        <MainNavigation userRole="director" userName="Director" />
      </aside>
      {/* <main className="pl-52 pt-14 p-4 space-y-4"> */}
      <main className="pl-52 pt-14 pr-6 pb-6 lg:pr-8 lg:pb-8">
        <div className="px-4 lg:px-6 space-y-4">
          {/* <div className="max-w-7xl mx-auto space-y-4"> */}
          <div className="max-w-7xl mx-auto space-y-4">
            <div className="mb-6">
              {isDemoMode && (
                <div className="mb-4 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-amber-800 font-medium">Demo Mode</p>
                    <p className="text-xs text-amber-600">
                      In production, students will be authenticated and see only their personalized dashboard.
                    </p>
                  </div>
                  <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                    <SelectTrigger className="w-[240px] bg-white">
                      <SelectValue placeholder="Select a student to preview" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.first_name} {s.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {/* <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl p-5 text-white shadow-lg mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                    {selectedStudent?.first_name?.charAt(0) || "S"}
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                      {selectedStudent ? `Welcome, ${selectedStudent.first_name}!` : "Class Course Dashboard"}
                    </h1>
                    <p className="text-emerald-100 text-sm mt-0.5">
                      {selectedStudent?.clinic_name
                        ? `${selectedStudent.clinic_name} Clinic - ${semesterName} Semester`
                        : `${semesterName} Semester`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-right">
                    <p className="text-emerald-200 text-xs">Current Week</p>
                    <p className="text-lg font-semibold">Week {getCurrentWeekNumber()}</p>
                  </div>
                  {selectedStudent && (
                    <>
                      <div className="h-10 w-px bg-emerald-400/50" />
                      <div className="text-right">
                        <p className="text-emerald-200 text-xs">Role</p>
                        <p className="text-lg font-semibold">
                          {selectedStudent.is_team_lead ? "Team Lead" : "Consultant"}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div> */}
              {/* End welcome header banner */}

              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-8 text-white shadow-xl mb-6 border border-slate-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-3xl font-bold shadow-lg">
                        {selectedStudent?.first_name?.charAt(0) || "S"}
                      </div>
                      <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-green-500 rounded-full border-2 border-slate-900" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold tracking-tight mb-1">
                        {selectedStudent ? `Welcome back, ${selectedStudent.first_name}` : "Class Course Dashboard"}
                      </h1>
                      <p className="text-slate-300 text-sm flex items-center gap-2">
                        {selectedStudent?.clinic_name && (
                          <>
                            <span className="px-2 py-0.5 bg-slate-700/50 rounded text-xs font-medium">
                              {selectedStudent.clinic_name} Clinic
                            </span>
                            <span className="text-slate-500">•</span>
                          </>
                        )}
                        <span>{semesterName} Semester</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Current Week</p>
                      <div className="flex items-baseline gap-1">
                        <p className="text-3xl font-bold">Week</p>
                        <p className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                          {getCurrentWeekNumber()}
                        </p>
                      </div>
                    </div>
                    {selectedStudent && (
                      <>
                        <div className="h-12 w-px bg-slate-700" />
                        <div className="text-right">
                          <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Role</p>
                          <p className="text-xl font-semibold">
                            {selectedStudent.is_team_lead ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
                                <span className="text-lg">★</span> Team Lead
                              </span>
                            ) : (
                              <span className="text-slate-200">Consultant</span>
                            )}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              {/* End welcome header banner */}
            </div>

            <Tabs defaultValue={defaultTab} className="space-y-4">
              <TabsList className="bg-muted/50 p-1 rounded-lg">
                <TabsTrigger
                  value="announcements"
                  className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4"
                >
                  <Bell className="h-4 w-4" />
                  Announcements
                </TabsTrigger>
                <TabsTrigger
                  value="agenda"
                  className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4"
                >
                  <Calendar className="h-4 w-4" />
                  Agenda
                </TabsTrigger>
                <TabsTrigger
                  value="materials"
                  className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4"
                >
                  <BookOpen className="h-4 w-4" />
                  Course Materials
                </TabsTrigger>
                <TabsTrigger
                  value="assignments"
                  className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4"
                >
                  <ClipboardList className="h-4 w-4" />
                  Assignments
                </TabsTrigger>
                <TabsTrigger
                  value="attendance"
                  className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4"
                >
                  <Calendar className="h-4 w-4" />
                  Attendance
                </TabsTrigger>
                <TabsTrigger
                  value="meetings"
                  className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4"
                >
                  <Users className="h-4 w-4" />
                  Meetings
                </TabsTrigger>
              </TabsList>

              {/* Announcements Tab */}
              <TabsContent value="announcements" className="space-y-4">
                <Card className="border-0 shadow-sm">
                  <CardHeader className="border-b bg-muted/30 rounded-t-lg">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl font-semibold">Announcements</CardTitle>
                      <Dialog open={announcementDialogOpen} onOpenChange={setAnnouncementDialogOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" className="gap-2">
                            <Plus className="h-4 w-4" />
                            Post Announcement
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <Megaphone className="h-5 w-5" />
                              Post New Announcement
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="announcement-title">Title *</Label>
                              <Input
                                id="announcement-title"
                                placeholder="Enter announcement title"
                                value={newAnnouncementTitle}
                                onChange={(e) => setNewAnnouncementTitle(e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="announcement-content">Content *</Label>
                              <Textarea
                                id="announcement-content"
                                placeholder="Enter announcement details..."
                                rows={4}
                                value={newAnnouncementContent}
                                onChange={(e) => setNewAnnouncementContent(e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="announcement-clinic">Target Clinic</Label>
                              <Select value={newAnnouncementClinic} onValueChange={setNewAnnouncementClinic}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select clinic" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">All Clinics (Program-Wide)</SelectItem>
                                  {clinics.map((clinic) => (
                                    <SelectItem key={clinic.id} value={clinic.id}>
                                      {clinic.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <p className="text-xs text-muted-foreground">
                                Only students in the selected clinic will receive this notification
                              </p>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="announcement-priority">Priority</Label>
                              <Select
                                value={newAnnouncementPriority}
                                onValueChange={(v) => setNewAnnouncementPriority(v as "high" | "normal")}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="normal">Normal</SelectItem>
                                  <SelectItem value="high">High (Important)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="announcement-audience">Target Audience</Label>
                              <Select
                                value={newAnnouncementAudience}
                                onValueChange={(v) => setNewAnnouncementAudience(v as "students" | "directors")}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select audience" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="students">All Students</SelectItem>
                                  <SelectItem value="directors">Directors & Admins Only</SelectItem>
                                </SelectContent>
                              </Select>
                              <p className="text-xs text-muted-foreground">
                                {newAnnouncementAudience === "directors"
                                  ? "Only directors and admins will see this announcement"
                                  : "Students in the selected clinic(s) will receive this notification"}
                              </p>
                            </div>
                            <Button
                              className="w-full gap-2"
                              onClick={handlePostAnnouncement}
                              disabled={
                                postingAnnouncement || !newAnnouncementTitle.trim() || !newAnnouncementContent.trim()
                              }
                            >
                              {postingAnnouncement ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Posting...
                                </>
                              ) : (
                                <>
                                  <Send className="h-4 w-4" />
                                  Post Announcement
                                </>
                              )}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    {loadingAnnouncements ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : announcements.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Megaphone className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No announcements yet</p>
                        <p className="text-sm">Post an announcement to notify students</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {announcements.map((announcement) => (
                          <div
                            key={announcement.id}
                            className="border-l-4 border-l-primary bg-muted/20 rounded-r-lg p-4"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-semibold text-base text-foreground">{announcement.title}</h3>
                                  {announcement.priority === "high" && (
                                    <Badge variant="destructive" className="text-xs font-medium">
                                      Important
                                    </Badge>
                                  )}
                                  {announcement.clinicName && (
                                    <Badge variant="secondary" className="text-xs">
                                      {announcement.clinicName}
                                    </Badge>
                                  )}
                                  {!announcement.clinicId && (
                                    <Badge variant="outline" className="text-xs">
                                      All Clinics
                                    </Badge>
                                  )}
                                  {announcement.targetAudience === "directors" && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs bg-amber-50 text-amber-700 border-amber-300"
                                    >
                                      Directors Only
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-2">{announcement.content}</p>
                                <p className="text-xs text-muted-foreground mt-3">
                                  Posted by <span className="font-medium">{announcement.postedBy}</span> •{" "}
                                  {new Date(announcement.postedAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Agenda Tab - Split into Weekly Agenda and Semester Schedule sections */}
              <TabsContent value="agenda" className="space-y-6">
                {/* Sub-navigation for agenda sections */}
                <div className="flex gap-2 border-b pb-3">
                  <Button
                    variant={agendaSection === "weekly" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAgendaSection("weekly")}
                    className="gap-2"
                  >
                    <Calendar className="h-4 w-4" />
                    Weekly Agenda
                  </Button>
                  <Button
                    variant={agendaSection === "semester" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAgendaSection("semester")}
                    className="gap-2"
                  >
                    <BookOpen className="h-4 w-4" />
                    Semester Schedule
                  </Button>
                </div>

                {/* Weekly Agenda Section */}
                {agendaSection === "weekly" && <UnifiedWeeklyAgenda semester={semesterName} />}

                {/* Semester Schedule Section */}
                {agendaSection === "semester" && (
                  <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
                    {/* Header - simplified, no gradient */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-[#505143]" />
                        <h2 className="text-sm font-semibold text-gray-800">Semester Schedule</h2>
                        <span className="text-xs text-gray-500">• {mockCourseSchedule.length} weeks</span>
                      </div>
                    </div>

                    {/* Week List - compact rows with left accent bars */}
                    <div className="max-h-[500px] overflow-y-auto">
                      {mockCourseSchedule.map((week) => {
                        const currentWeekNumber = getCurrentWeekNumber()
                        const isCurrentWeek = week.week === currentWeekNumber
                        const isPastWeek = week.week < currentWeekNumber

                        return (
                          <div
                            key={week.week}
                            className={`flex items-center gap-3 px-4 py-2.5 border-b border-gray-50 last:border-b-0 transition-colors ${
                              isCurrentWeek ? "bg-[#F5F0E9]/50" : isPastWeek ? "opacity-50" : "hover:bg-gray-50"
                            }`}
                          >
                            {/* Week Number - small pill */}
                            <div
                              className={`flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center text-xs font-semibold ${
                                isCurrentWeek
                                  ? "bg-[#505143] text-white"
                                  : isPastWeek
                                    ? "bg-gray-100 text-gray-400"
                                    : "bg-[#D5CCAB]/50 text-[#505143]"
                              }`}
                            >
                              {week.week}
                            </div>

                            {/* Week Details - compact */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-800 truncate">{week.topic}</span>
                                {isCurrentWeek && (
                                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#878568] text-white">
                                    Current
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-gray-400">{week.date}</span>
                                <span
                                  className={`text-[10px] px-1.5 py-0.5 rounded capitalize ${
                                    week.type === "orientation"
                                      ? "bg-blue-50 text-blue-600"
                                      : week.type === "meeting"
                                        ? "bg-green-50 text-green-600"
                                        : week.type === "workshop"
                                          ? "bg-purple-50 text-purple-600"
                                          : week.type === "lecture"
                                            ? "bg-orange-50 text-orange-600"
                                            : week.type === "review"
                                              ? "bg-red-50 text-red-600"
                                              : "bg-gray-50 text-gray-600"
                                  }`}
                                >
                                  {week.type}
                                </span>
                              </div>
                            </div>

                            {/* Status - subtle icon */}
                            <div className="flex-shrink-0">
                              {isPastWeek ? (
                                <CheckCircle2 className="h-4 w-4 text-green-400" />
                              ) : isCurrentWeek ? (
                                <Clock className="h-4 w-4 text-[#878568]" />
                              ) : (
                                <div className="h-4 w-4 rounded-full border border-gray-200" />
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Course Materials Tab */}
              <TabsContent value="materials" className="space-y-4">
                <Card className="overflow-hidden border-0 shadow-sm">
                  <div className="bg-slate-800 text-white p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-semibold">Course Materials</h2>
                        <p className="text-slate-300 text-sm">Resources and documents for your clinic</p>
                      </div>
                      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="secondary" className="gap-2">
                            <Upload className="h-4 w-4" />
                            Upload
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Upload Course Material</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            {uploadError && (
                              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                                <AlertCircle className="h-4 w-4" />
                                {uploadError}
                              </div>
                            )}
                            <div className="space-y-2">
                              <Label htmlFor="title">Title *</Label>
                              <Input
                                id="title"
                                value={uploadTitle}
                                onChange={(e) => setUploadTitle(e.target.value)}
                                placeholder="e.g., Week 3 Lecture Slides"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="description">Description</Label>
                              <Textarea
                                id="description"
                                value={uploadDescription}
                                onChange={(e) => setUploadDescription(e.target.value)}
                                placeholder="Brief description of the material..."
                                rows={2}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Category</Label>
                                <Select value={uploadCategory} onValueChange={setUploadCategory}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="syllabus">Syllabus</SelectItem>
                                    <SelectItem value="lecture">Lecture</SelectItem>
                                    <SelectItem value="assignment">Assignment</SelectItem>
                                    <SelectItem value="resource">Resource</SelectItem>
                                    <SelectItem value="template">Template</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>Available To</Label>
                                <Select value={uploadTargetClinic} onValueChange={setUploadTargetClinic}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="all">All Clinics</SelectItem>
                                    <SelectItem value="Accounting">Accounting</SelectItem>
                                    <SelectItem value="Consulting">Consulting</SelectItem>
                                    <SelectItem value="Funding">Funding</SelectItem>
                                    <SelectItem value="Marketing">Marketing</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="file">File *</Label>
                              <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center hover:border-slate-400 transition-colors">
                                <Input
                                  id="file"
                                  type="file"
                                  onChange={(e) => {
                                    setUploadFile(e.target.files?.[0] || null)
                                    setUploadError(null)
                                  }}
                                  className="cursor-pointer"
                                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,.png,.jpg,.jpeg"
                                />
                                <p className="text-xs text-muted-foreground mt-2">
                                  Supported: PDF, Word, PowerPoint, Excel, Images
                                </p>
                              </div>
                              {uploadFile && (
                                <p className="text-xs text-muted-foreground">
                                  Selected: {uploadFile.name} ({formatFileSize(uploadFile.size)})
                                </p>
                              )}
                            </div>
                            <Button
                              onClick={handleUpload}
                              disabled={!uploadFile || !uploadTitle || uploading}
                              className="w-full"
                            >
                              {uploading ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Uploading...
                                </>
                              ) : (
                                "Upload Material"
                              )}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>

                  <div className="flex min-h-[400px]">
                    {/* Sidebar - Clinic Navigation */}
                    <div className="w-48 border-r bg-slate-50 p-3 space-y-1">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide px-2 mb-2">Clinics</p>
                      {["all", "Accounting", "Consulting", "Funding", "Marketing"].map((clinic) => (
                        <button
                          key={clinic}
                          onClick={() => setFilterClinic(clinic)}
                          className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                            filterClinic === clinic ? "bg-slate-800 text-white" : "text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {clinic === "all" ? "All Clinics" : clinic}
                        </button>
                      ))}

                      <div className="border-t my-3 pt-3">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide px-2 mb-2">
                          Categories
                        </p>
                        {["all", "syllabus", "lecture", "assignment", "resource", "template"].map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setFilterCategory(cat)}
                            className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors ${
                              filterCategory === cat ? "bg-slate-700 text-white" : "text-slate-600 hover:bg-slate-200"
                            }`}
                          >
                            {cat === "all" ? "All Types" : getCategoryLabel(cat)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 p-4">
                      {loadingMaterials ? (
                        <div className="text-center py-8 text-muted-foreground">Loading materials...</div>
                      ) : materials.length === 0 ? (
                        <div className="text-center py-12">
                          <FolderOpen className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                          <p className="text-slate-500">No course materials uploaded yet</p>
                          <p className="text-sm text-slate-400 mt-1">Click "Upload" to add your first file</p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {(() => {
                            const filtered = materials.filter(
                              (m) =>
                                (filterCategory === "all" || m.category === filterCategory) &&
                                (filterClinic === "all" || m.target_clinic === filterClinic),
                            )

                            // Group by category for display
                            const grouped = filtered.reduce(
                              (acc, mat) => {
                                const cat = mat.category
                                if (!grouped[cat]) grouped[cat] = []
                                grouped[cat].push(mat)
                                return acc
                              },
                              {} as Record<string, typeof materials>,
                            )

                            const categoryOrder = ["syllabus", "lecture", "assignment", "resource", "template"]
                            const sortedCategories = Object.entries(grouped).sort(
                              ([a], [b]) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b),
                            )

                            if (sortedCategories.length === 0) {
                              return (
                                <div className="text-center py-8">
                                  <p className="text-slate-500">No materials match your filters</p>
                                </div>
                              )
                            }

                            return sortedCategories.map(([category, categoryMaterials]) => (
                              <div key={category}>
                                {/* Category Header */}
                                <div className="flex items-center gap-3 mb-3">
                                  <div
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                      category === "syllabus"
                                        ? "bg-blue-100 text-blue-700"
                                        : category === "lecture"
                                          ? "bg-purple-100 text-purple-700"
                                          : category === "assignment"
                                            ? "bg-amber-100 text-amber-700"
                                            : category === "resource"
                                              ? "bg-emerald-100 text-emerald-700"
                                              : "bg-slate-100 text-slate-700"
                                    }`}
                                  >
                                    {category === "syllabus" ? (
                                      <FileText className="h-4 w-4" />
                                    ) : category === "lecture" ? (
                                      <BookOpen className="h-4 w-4" />
                                    ) : category === "assignment" ? (
                                      <FileCheck className="h-4 w-4" />
                                    ) : category === "resource" ? (
                                      <Files className="h-4 w-4" />
                                    ) : (
                                      <FileCode className="h-4 w-4" />
                                    )}
                                  </div>
                                  <div>
                                    <h3 className="font-semibold text-slate-800">{getCategoryLabel(category)}</h3>
                                    <p className="text-xs text-slate-500">
                                      {categoryMaterials.length} file{categoryMaterials.length !== 1 ? "s" : ""}
                                    </p>
                                  </div>
                                </div>

                                {/* Materials Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                                  {categoryMaterials.map((material) => (
                                    <div
                                      key={material.id}
                                      className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm transition-all group"
                                    >
                                      {/* File Icon */}
                                      <div
                                        className={`p-2 rounded-lg shrink-0 ${
                                          category === "syllabus"
                                            ? "bg-blue-50 text-blue-600"
                                            : category === "lecture"
                                              ? "bg-purple-50 text-purple-600"
                                              : category === "assignment"
                                                ? "bg-amber-50 text-amber-600"
                                                : category === "resource"
                                                  ? "bg-emerald-50 text-emerald-600"
                                                  : "bg-slate-50 text-slate-600"
                                        }`}
                                      >
                                        {getFileIcon(material.file_type)}
                                      </div>

                                      {/* File Info */}
                                      <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-slate-800 truncate">{material.title}</h4>
                                        {material.description && (
                                          <p className="text-xs text-slate-500 truncate mt-0.5">
                                            {material.description}
                                          </p>
                                        )}
                                        <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400">
                                          <span>{material.uploaded_by_name}</span>
                                          <span>•</span>
                                          <span>{new Date(material.created_at).toLocaleDateString()}</span>
                                          {material.target_clinic !== "all" && (
                                            <>
                                              <span>•</span>
                                              <span className="text-slate-500">{material.target_clinic}</span>
                                            </>
                                          )}
                                        </div>
                                      </div>

                                      {/* Actions */}
                                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-8 w-8 p-0"
                                          onClick={() => window.open(material.file_url, "_blank")}
                                        >
                                          <Download className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                                          onClick={() => handleDeleteMaterial(material)}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="assignments" className="space-y-6">
                {/* Grading Breakdown */}
                <Card className="border-0 shadow-sm">
                  <CardHeader className="border-b bg-gradient-to-r from-slate-800 to-slate-700 text-white rounded-t-lg">
                    <CardTitle className="text-lg">Grading Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-5 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">15%</div>
                        <div className="text-xs text-muted-foreground">Attendance & Participation</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">15%</div>
                        <div className="text-xs text-muted-foreground">Written Assignments</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">20%</div>
                        <div className="text-xs text-muted-foreground">Mid-Term Presentation</div>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">20%</div>
                        <div className="text-xs text-muted-foreground">Client Work & Feedback</div>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">30%</div>
                        <div className="text-xs text-muted-foreground">Final Presentation</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Deliverables Overview */}
                <div className="grid grid-cols-3 gap-4">
                  {Object.entries(DELIVERABLES_CONFIG).map(([key, config]) => (
                    <Card key={key} className="border-0 shadow-sm">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{config.title}</CardTitle>
                          <Badge variant={key === "sow" ? "default" : key === "midterm" ? "secondary" : "outline"}>
                            {config.weight}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground">{config.description}</p>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>Due: {config.dueDate}</span>
                        </div>
                        <Accordion type="single" collapsible className="w-full">
                          <AccordionItem value="instructions" className="border-0">
                            <AccordionTrigger className="text-sm py-2">View Instructions</AccordionTrigger>
                            <AccordionContent>
                              <ul className="space-y-1 text-sm text-muted-foreground">
                                {config.instructions.map((instruction, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                    {instruction}
                                  </li>
                                ))}
                              </ul>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                        {/* Conditionally render submissionSteps and presentationDay for final */}
                        {key === "final" && config.submissionSteps && (
                          <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="submissionSteps" className="border-0">
                              <AccordionTrigger className="text-sm py-2">Submission Steps</AccordionTrigger>
                              <AccordionContent>
                                <ul className="space-y-1 text-sm text-muted-foreground">
                                  {config.submissionSteps.map((step, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                      {step}
                                    </li>
                                  ))}
                                </ul>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        )}
                        {key === "final" && config.presentationDay && (
                          <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="presentationDay" className="border-0">
                              <AccordionTrigger className="text-sm py-2">Presentation Day</AccordionTrigger>
                              <AccordionContent>
                                <ul className="space-y-1 text-sm text-muted-foreground">
                                  {config.presentationDay.map((day, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                      {day}
                                    </li>
                                  ))}
                                </ul>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Client Teams & Evaluations */}
                <Card className="border-0 shadow-sm">
                  <CardHeader className="border-b bg-muted/30">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Client Team Deliverables & Evaluations</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {clients.map((client) => {
                        const deliverables = clientDeliverables[client.id] || {
                          sow: false,
                          midterm: false,
                          final: false,
                        }
                        const clientEvalsMidterm = getClientEvaluations(client.id, "midterm")
                        const clientEvalsFinal = getClientEvaluations(client.id, "final")

                        const allClientEvals = [...clientEvalsMidterm, ...clientEvalsFinal]
                        const avgRating =
                          allClientEvals.length > 0
                            ? (
                                allClientEvals.reduce((sum, e) => sum + e.average_rating, 0) / allClientEvals.length
                              ).toFixed(1)
                            : null

                        return (
                          <div key={client.id} className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h3 className="font-semibold">{client.name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <Users className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">
                                    {client.teamMembers?.length || 0} team members
                                  </span>
                                  {avgRating && (
                                    <Badge variant="outline" className="ml-2">
                                      <Star className="h-3 w-3 mr-1 text-yellow-500" />
                                      {avgRating} avg
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openEvaluationDialog(client.id, "midterm")}
                                  className="gap-1"
                                >
                                  <Star className="h-3 w-3" />
                                  Mid-Term Eval
                                  {getClientEvaluations(client.id, "midterm").length > 0 && (
                                    <Badge variant="secondary" className="ml-1 text-xs">
                                      {getClientEvaluations(client.id, "midterm").length}
                                    </Badge>
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openEvaluationDialog(client.id, "final")}
                                  className="gap-1"
                                >
                                  <Star className="h-3 w-3" />
                                  Final Eval
                                  {getClientEvaluations(client.id, "final").length > 0 && (
                                    <Badge variant="secondary" className="ml-1 text-xs">
                                      {getClientEvaluations(client.id, "final").length}
                                    </Badge>
                                  )}
                                </Button>
                              </div>
                            </div>

                            {/* Deliverables Status */}
                            <div className="grid grid-cols-3 gap-3 mb-3">
                              <div
                                className={`flex items-center gap-2 p-2 rounded-lg ${deliverables.sow ? "bg-green-50" : "bg-slate-50"}`}
                              >
                                {deliverables.sow ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Clock className="h-4 w-4 text-slate-400" />
                                )}
                                <span className="text-sm">SOW</span>
                              </div>
                              <div
                                className={`flex items-center gap-2 p-2 rounded-lg ${deliverables.midterm ? "bg-green-50" : "bg-slate-50"}`}
                              >
                                {deliverables.midterm ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Clock className="h-4 w-4 text-slate-400" />
                                )}
                                <span className="text-sm">Mid-Term</span>
                              </div>
                              <div
                                className={`flex items-center gap-2 p-2 rounded-lg ${deliverables.final ? "bg-green-50" : "bg-slate-50"}`}
                              >
                                {deliverables.final ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Clock className="h-4 w-4 text-slate-400" />
                                )}
                                <span className="text-sm">Final</span>
                              </div>
                            </div>

                            {/* Existing Evaluations */}
                            {(clientEvalsMidterm.length > 0 || clientEvalsFinal.length > 0) && (
                              <div className="mt-3 pt-3 border-t">
                                <p className="text-xs font-medium text-muted-foreground mb-2">Submitted Evaluations</p>
                                <Accordion type="single" collapsible className="w-full space-y-2">
                                  {clientEvalsMidterm.map((evaluation) => (
                                    <AccordionItem
                                      key={evaluation.id}
                                      value={`eval-${evaluation.id}`}
                                      className="border rounded-lg bg-blue-50/50 border-blue-200"
                                    >
                                      <AccordionTrigger className="px-3 py-2 hover:no-underline">
                                        <div className="flex items-center gap-2 text-left">
                                          <Badge
                                            variant="outline"
                                            className="text-xs bg-blue-50 border-blue-200 text-blue-800"
                                          >
                                            {evaluation.director_name} - {evaluation.average_rating.toFixed(1)}
                                            <Star className="h-3 w-3 ml-1 text-yellow-500 fill-yellow-500" />
                                            (Mid-Term)
                                          </Badge>
                                        </div>
                                      </AccordionTrigger>
                                      <AccordionContent className="px-3 pb-3">
                                        <div className="space-y-3 pt-2">
                                          {/* Question Ratings with Notes */}
                                          {[
                                            {
                                              label: "Presentation Opening",
                                              rating: evaluation.question_1_rating,
                                              notes: evaluation.question_1_notes,
                                            },
                                            {
                                              label: "Business Knowledge",
                                              rating: evaluation.question_2_rating,
                                              notes: evaluation.question_2_notes,
                                            },
                                            {
                                              label: "Industry Knowledge",
                                              rating: evaluation.question_3_rating,
                                              notes: evaluation.question_3_notes,
                                            },
                                            {
                                              label: "Performance Metrics",
                                              rating: evaluation.question_4_rating,
                                              notes: evaluation.question_4_notes,
                                            },
                                            {
                                              label: "Project Outline",
                                              rating: evaluation.question_5_rating,
                                              notes: evaluation.question_5_notes,
                                            },
                                          ].map((q, idx) => (
                                            <div key={idx} className="bg-white rounded-lg p-3 border border-blue-100">
                                              <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-medium text-slate-700">
                                                  Q{idx + 1}: {q.label}
                                                </span>
                                                <div className="flex items-center gap-1">
                                                  {[1, 2, 3, 4, 5].map((star) => (
                                                    <Star
                                                      key={star}
                                                      className={`h-3 w-3 ${star <= q.rating ? "text-amber-500" : "text-gray-300"}`}
                                                    />
                                                  ))}
                                                  <span className="text-xs font-semibold ml-1">{q.rating}/5</span>
                                                </div>
                                              </div>
                                              {q.notes && (
                                                <p className="text-xs text-slate-600 mt-2 italic border-l-2 border-blue-200 pl-2">
                                                  {q.notes}
                                                </p>
                                              )}
                                            </div>
                                          ))}
                                          {/* Additional Comments */}
                                          {evaluation.additional_comments && (
                                            <div className="bg-white rounded-lg p-3 border border-blue-100">
                                              <span className="text-xs font-medium text-slate-700">
                                                Additional Comments
                                              </span>
                                              <p className="text-xs text-slate-600 mt-1">
                                                {evaluation.additional_comments}
                                              </p>
                                            </div>
                                          )}
                                        </div>
                                      </AccordionContent>
                                    </AccordionItem>
                                  ))}
                                  {clientEvalsFinal.map((evaluation) => (
                                    <AccordionItem
                                      key={evaluation.id}
                                      value={`eval-${evaluation.id}`}
                                      className="border rounded-lg bg-purple-50/50 border-purple-200"
                                    >
                                      <AccordionTrigger className="px-3 py-2 hover:no-underline">
                                        <div className="flex items-center gap-2 text-left">
                                          <Badge
                                            variant="outline"
                                            className="text-xs bg-purple-50 border-purple-200 text-purple-800"
                                          >
                                            {evaluation.director_name} - {evaluation.average_rating.toFixed(1)}
                                            <Star className="h-3 w-3 ml-1 text-yellow-500 fill-yellow-500" />
                                            (Final)
                                          </Badge>
                                        </div>
                                      </AccordionTrigger>
                                      <AccordionContent className="px-3 pb-3">
                                        <div className="space-y-3 pt-2">
                                          {/* Question Ratings with Notes */}
                                          {[
                                            {
                                              label: "Executive Summary",
                                              rating: evaluation.question_1_rating,
                                              notes: evaluation.question_1_notes,
                                            },
                                            {
                                              label: "Deliverables Quality",
                                              rating: evaluation.question_2_rating,
                                              notes: evaluation.question_2_notes,
                                            },
                                            {
                                              label: "Analysis & Recommendations",
                                              rating: evaluation.question_3_rating,
                                              notes: evaluation.question_3_notes,
                                            },
                                            {
                                              label: "Presentation Skills",
                                              rating: evaluation.question_4_rating,
                                              notes: evaluation.question_4_notes,
                                            },
                                            {
                                              label: "Client Impact",
                                              rating: evaluation.question_5_rating,
                                              notes: evaluation.question_5_notes,
                                            },
                                          ].map((q, idx) => (
                                            <div key={idx} className="bg-white rounded-lg p-3 border border-purple-100">
                                              <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-medium text-slate-700">
                                                  Q{idx + 1}: {q.label}
                                                </span>
                                                <div className="flex items-center gap-1">
                                                  {[1, 2, 3, 4, 5].map((star) => (
                                                    <Star
                                                      key={star}
                                                      className={`h-3 w-3 ${star <= q.rating ? "text-amber-500" : "text-gray-300"}`}
                                                    />
                                                  ))}
                                                  <span className="text-xs font-semibold ml-1">{q.rating}/5</span>
                                                </div>
                                              </div>
                                              {q.notes && (
                                                <p className="text-xs text-slate-600 mt-2 italic border-l-2 border-purple-200 pl-2">
                                                  {q.notes}
                                                </p>
                                              )}
                                            </div>
                                          ))}
                                          {/* Additional Comments */}
                                          {evaluation.additional_comments && (
                                            <div className="bg-white rounded-lg p-3 border border-purple-100">
                                              <span className="text-xs font-medium text-slate-700">
                                                Additional Comments
                                              </span>
                                              <p className="text-xs text-slate-600 mt-1">
                                                {evaluation.additional_comments}
                                              </p>
                                            </div>
                                          )}
                                        </div>
                                      </AccordionContent>
                                    </AccordionItem>
                                  ))}
                                </Accordion>
                              </div>
                            )}

                            {/* Team Members */}
                            {client.teamMembers && client.teamMembers.length > 0 && (
                              <Accordion type="single" collapsible className="w-full mt-2">
                                <AccordionItem value="team" className="border-0">
                                  <AccordionTrigger className="text-xs py-1 text-muted-foreground">
                                    View Team Members
                                  </AccordionTrigger>
                                  <AccordionContent>
                                    <div className="flex flex-wrap gap-2">
                                      {client.teamMembers.map((member, i) => (
                                        <Badge key={i} variant="outline" className="text-xs">
                                          {member.student_name}
                                          {member.student_role && ` (${member.student_role})`}
                                        </Badge>
                                      ))}
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                              </Accordion>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Start of Attendance Tab */}
              <TabsContent value="attendance" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-3xl">
                      <ClipboardList className="h-8 w-8" />
                      Class Attendance Records
                    </CardTitle>
                    <p className="text-base text-slate-600 mt-2">
                      {semesterName} - View student attendance submissions organized by week and clinic
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                            <Key className="h-5 w-5 text-blue-600" />
                            Weekly Attendance Password
                          </h3>
                          <p className="text-sm text-slate-600 mt-1">
                            Students need this password to submit their weekly attendance
                          </p>
                        </div>
                        <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                              <Key className="h-4 w-4" />
                              Manage All Passwords
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2 text-xl">
                                <Key className="h-5 w-5 text-blue-600" />
                                Attendance Password Management
                              </DialogTitle>
                              <p className="text-sm text-slate-600">
                                View and manage attendance passwords for all weeks in {semesterName}
                              </p>
                            </DialogHeader>
                            <div className="flex-1 overflow-y-auto pr-2">
                              <div className="space-y-2">
                                {/* Header */}
                                <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-slate-100 rounded-lg text-sm font-medium text-slate-700">
                                  <div className="col-span-2">Week</div>
                                  <div className="col-span-3">Date Range</div>
                                  <div className="col-span-3">Password</div>
                                  <div className="col-span-2">Status</div>
                                  <div className="col-span-2">Actions</div>
                                </div>
                                
                                {/* Week rows */}
                                {(() => {
                                  const uniqueWeeks = semesterSchedule.length > 0
                                    ? Array.from(new Map(semesterSchedule.map((w: any) => [w.week_number, w])).values())
                                        .sort((a: any, b: any) => a.week_number - b.week_number)
                                    : Array.from({ length: 17 }, (_, i) => ({
                                        week_number: i + 1,
                                        week_start: null,
                                        week_end: null,
                                      }))
                                  
                                  const today = new Date()
                                  today.setHours(0, 0, 0, 0)
                                  
                                  return uniqueWeeks.map((week: any) => {
                                    const password = weekPasswords.find((p) => p.week_number === week.week_number)
                                    const isCurrentWeek = week.week_start && week.week_end && 
                                      today >= new Date(week.week_start) && today <= new Date(week.week_end)
                                    const isPastWeek = week.week_end && today > new Date(week.week_end)
                                    const isEditing = editingPasswordWeek === week.week_number
                                    
                                    return (
                                      <div 
                                        key={week.week_number}
                                        className={`grid grid-cols-12 gap-2 px-3 py-3 rounded-lg border transition-colors ${
                                          isCurrentWeek 
                                            ? "bg-blue-50 border-blue-200" 
                                            : isPastWeek 
                                              ? "bg-slate-50 border-slate-200" 
                                              : "bg-white border-slate-200 hover:bg-slate-50"
                                        }`}
                                      >
                                        <div className="col-span-2 flex items-center gap-2">
                                          <span className={`font-semibold ${isCurrentWeek ? "text-blue-700" : "text-slate-900"}`}>
                                            Week {week.week_number}
                                          </span>
                                          {isCurrentWeek && (
                                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                                              Current
                                            </Badge>
                                          )}
                                        </div>
                                        <div className="col-span-3 flex items-center text-sm text-slate-600">
                                          {week.week_start && week.week_end ? (
                                            <>
                                              {new Date(week.week_start).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                              {" - "}
                                              {new Date(week.week_end).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                            </>
                                          ) : (
                                            <span className="text-slate-400">Not scheduled</span>
                                          )}
                                        </div>
                                        <div className="col-span-3 flex items-center">
                                          {isEditing ? (
                                            <Input
                                              value={editPasswordValue}
                                              onChange={(e) => setEditPasswordValue(e.target.value)}
                                              className="h-8 text-sm"
                                              placeholder="Enter new password"
                                              autoFocus
                                            />
                                          ) : password ? (
                                            <code className="bg-slate-100 px-2 py-1 rounded text-sm font-mono">
                                              {password.password}
                                            </code>
                                          ) : (
                                            <span className="text-slate-400 text-sm">Not set</span>
                                          )}
                                        </div>
                                        <div className="col-span-2 flex items-center">
                                          {password ? (
                                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                                              <CheckCircle2 className="h-3 w-3 mr-1" />
                                              Set
                                            </Badge>
                                          ) : (
                                            <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                                              <AlertTriangle className="h-3 w-3 mr-1" />
                                              Missing
                                            </Badge>
                                          )}
                                        </div>
                                        <div className="col-span-2 flex items-center gap-1">
                                          {isEditing ? (
                                            <>
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-7 w-7 p-0"
                                                onClick={() => handleUpdatePassword(week.week_number, editPasswordValue)}
                                                disabled={savingPassword}
                                              >
                                                {savingPassword ? (
                                                  <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                  <Check className="h-4 w-4 text-green-600" />
                                                )}
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-7 w-7 p-0"
                                                onClick={() => {
                                                  setEditingPasswordWeek(null)
                                                  setEditPasswordValue("")
                                                }}
                                              >
                                                <XCircle className="h-4 w-4 text-slate-500" />
                                              </Button>
                                            </>
                                          ) : (
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-7 px-2 text-xs"
                                              onClick={() => {
                                                setEditingPasswordWeek(week.week_number)
                                                setEditPasswordValue(password?.password || "")
                                              }}
                                            >
                                              <Pencil className="h-3 w-3 mr-1" />
                                              {password ? "Edit" : "Set"}
                                            </Button>
                                          )}
                                        </div>
                                      </div>
                                    )
                                  })
                                })()}
                              </div>
                            </div>
                            
                            {/* Summary footer */}
                            <div className="border-t pt-4 mt-4">
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-4">
                                  <span className="text-slate-600">
                                    <strong className="text-green-600">{weekPasswords.length}</strong> passwords set
                                  </span>
                                  <span className="text-slate-600">
                                    <strong className="text-amber-600">
                                      {(semesterSchedule.length > 0 
                                        ? new Set(semesterSchedule.map((w: any) => w.week_number)).size 
                                        : 17) - weekPasswords.length}
                                    </strong> missing
                                  </span>
                                </div>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setPasswordDialogOpen(false)}
                                >
                                  Close
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>

                      {weekPasswords.length > 0 ? (
                        <div className="space-y-3">
                          {/* Week Password Display with Toggle */}
                          {(() => {
                            const today = new Date()
                            today.setHours(0, 0, 0, 0)

                            // Find the week that contains today's date
                            const currentWeekRecord = semesterSchedule.find((week: any) => {
                              const weekStart = new Date(week.week_start)
                              const weekEnd = new Date(week.week_end)
                              weekStart.setHours(0, 0, 0, 0)
                              weekEnd.setHours(23, 59, 59, 999)
                              return today >= weekStart && today <= weekEnd
                            })

                            // Check if we're before semester starts
                            const firstWeek = semesterSchedule[0]
                            const isBeforeSemester = firstWeek && today < new Date(firstWeek.week_start)

                            // Use Week 1 if before semester or use the actual current week
                            const currentWeekNum = currentWeekRecord ? currentWeekRecord.week_number : 1
                            
                            // Use selected week or default to current week
                            const displayWeekNum = selectedPasswordWeek ?? currentWeekNum
                            const displayWeekPassword = weekPasswords.find((wp) => wp.week_number === displayWeekNum)
                            const isCurrentWeek = displayWeekNum === currentWeekNum
                            
                            // Get all unique weeks for the toggle
                            const uniqueWeeks = semesterSchedule.length > 0
                              ? Array.from(new Map(semesterSchedule.map((w: any) => [w.week_number, w])).values())
                                  .sort((a: any, b: any) => a.week_number - b.week_number)
                              : Array.from({ length: 17 }, (_, i) => ({
                                  week_number: i + 1,
                                  week_start: null,
                                  week_end: null,
                                }))
                            
                            // Get week info for display
                            const displayWeekInfo = semesterSchedule.find((w: any) => w.week_number === displayWeekNum)

                            // Get min and max week numbers
                            const minWeek = uniqueWeeks.length > 0 ? Math.min(...uniqueWeeks.map((w: any) => w.week_number)) : 1
                            const maxWeek = uniqueWeeks.length > 0 ? Math.max(...uniqueWeeks.map((w: any) => w.week_number)) : 17
                            
                            const handlePrevWeek = () => {
                              if (displayWeekNum > minWeek) {
                                setSelectedPasswordWeek(displayWeekNum - 1)
                              }
                            }
                            
                            const handleNextWeek = () => {
                              if (displayWeekNum < maxWeek) {
                                setSelectedPasswordWeek(displayWeekNum + 1)
                              }
                            }

                            return (
                              <div className={`bg-white rounded-lg border-2 shadow-sm ${
                                isCurrentWeek ? "border-green-300" : "border-slate-200"
                              }`}>
                                {/* Card with arrow navigation */}
                                <div className="flex items-stretch">
                                  {/* Left Arrow */}
                                  <button
                                    onClick={handlePrevWeek}
                                    disabled={displayWeekNum <= minWeek}
                                    className={`flex items-center justify-center px-3 border-r transition-colors ${
                                      displayWeekNum <= minWeek 
                                        ? "text-slate-300 cursor-not-allowed" 
                                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                                    }`}
                                  >
                                    <ChevronLeft className="h-5 w-5" />
                                  </button>
                                  
                                  {/* Content */}
                                  <div className="flex-1 p-4">
                                    {/* Header */}
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <h4 className="text-base font-semibold text-slate-900">
                                          Week {displayWeekNum} Password
                                        </h4>
                                        {isCurrentWeek ? (
                                          <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                                            Current
                                          </Badge>
                                        ) : recentlySetWeek === displayWeekNum ? (
                                          <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs animate-pulse">
                                            Just Set
                                          </Badge>
                                        ) : displayWeekNum > currentWeekNum ? (
                                          <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-xs">
                                            Upcoming
                                          </Badge>
                                        ) : null}
                                      </div>
                                      <span className="text-xs text-slate-500">
                                        {displayWeekNum} of {maxWeek}
                                      </span>
                                    </div>
                                    
                                    {/* Password or No Password state */}
                                    {displayWeekPassword ? (
                                      <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${
                                          isCurrentWeek ? "bg-green-100" : "bg-blue-100"
                                        }`}>
                                          <CheckCircle2 className={`h-5 w-5 ${
                                            isCurrentWeek ? "text-green-600" : "text-blue-600"
                                          }`} />
                                        </div>
                                        <div>
                                          <p className="text-xl font-bold text-slate-900 tracking-wider font-mono">
                                            {displayWeekPassword.password}
                                          </p>
                                          <p className="text-xs text-slate-500">
                                            {displayWeekInfo?.week_start && displayWeekInfo?.week_end && (
                                              <>
                                                {new Date(displayWeekInfo.week_start).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                                {" - "}
                                                {new Date(displayWeekInfo.week_end).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                                {" • "}
                                              </>
                                            )}
                                            Set {new Date(displayWeekPassword.created_at).toLocaleDateString()}
                                          </p>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-full bg-amber-100">
                                          <AlertTriangle className="h-5 w-5 text-amber-600" />
                                        </div>
                                        <div>
                                          <p className="text-sm font-medium text-amber-700">
                                            No password set
                                          </p>
                                          <p className="text-xs text-slate-500">
                                            {displayWeekInfo?.week_start && displayWeekInfo?.week_end && (
                                              <>
                                                {new Date(displayWeekInfo.week_start).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                                {" - "}
                                                {new Date(displayWeekInfo.week_end).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                              </>
                                            )}
                                            {isCurrentWeek && " • Students cannot submit attendance"}
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Right Arrow */}
                                  <button
                                    onClick={handleNextWeek}
                                    disabled={displayWeekNum >= maxWeek}
                                    className={`flex items-center justify-center px-3 border-l transition-colors ${
                                      displayWeekNum >= maxWeek 
                                        ? "text-slate-300 cursor-not-allowed" 
                                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                                    }`}
                                  >
                                    <ChevronRight className="h-5 w-5" />
                                  </button>
                                </div>
                              </div>
                            )
                          })()}

                          {/* Set New Password */}
                          <details className="group">
                            <summary className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-2">
                              <Plus className="h-4 w-4" />
                              Set Password for Next Week
                            </summary>
                            <div className="mt-3 p-3 bg-white rounded-lg border border-slate-200">
                              <div className="flex gap-2">
                                <Select value={newPasswordWeek} onValueChange={setNewPasswordWeek}>
                                  <SelectTrigger className="w-32">
                                    <SelectValue placeholder="Week #" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {(() => {
                                      const uniqueWeeks =
                                        semesterSchedule.length > 0
                                          ? Array.from(
                                              new Map(semesterSchedule.map((w: any) => [w.week_number, w])).values(),
                                            )
                                          : Array.from({ length: 17 }, (_, i) => ({
                                              week_number: i + 1,
                                              week_start: null,
                                              week_end: null,
                                            }))

                                      return uniqueWeeks
                                        .sort((a, b) => a.week_number - b.week_number)
                                        .map((week) => (
                                          <SelectItem key={week.week_number} value={week.week_number.toString()}>
                                            Week {week.week_number}
                                          </SelectItem>
                                        ))
                                    })()}
                                  </SelectContent>
                                </Select>

                                <Input
                                  type="text"
                                  placeholder="Password"
                                  value={newPassword}
                                  onChange={(e) => setNewPassword(e.target.value)}
                                  className="flex-1"
                                />
                                <Button onClick={handleSetPassword} disabled={savingPassword} size="sm">
                                  {savingPassword ? (
                                    <>
                                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                      Saving...
                                    </>
                                  ) : (
                                    <>
                                      <Save className="h-4 w-4 mr-2" />
                                      Save
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          </details>
                        </div>
                      ) : (
                        <Alert className="border-red-300 bg-red-50">
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                          <AlertDescription className="text-red-800">
                            <strong className="block mb-2">No passwords set yet!</strong>
                            <div className="flex gap-2 mt-3">
                              <Select value={newPasswordWeek} onValueChange={setNewPasswordWeek}>
                                <SelectTrigger className="w-32">
                                  <SelectValue placeholder="Week #" />
                                </SelectTrigger>
                                <SelectContent>
                                  {(() => {
                                    const uniqueWeeks =
                                      semesterSchedule.length > 0
                                        ? Array.from(
                                            new Map(semesterSchedule.map((w: any) => [w.week_number, w])).values(),
                                          )
                                        : Array.from({ length: 17 }, (_, i) => ({ week_number: i + 1 }))

                                    return uniqueWeeks
                                      .sort((a, b) => a.week_number - b.week_number)
                                      .map((week) => (
                                        <SelectItem key={week.week_number} value={week.week_number.toString()}>
                                          Week {week.week_number}
                                        </SelectItem>
                                      ))
                                  })()}
                                </SelectContent>
                              </Select>
                              <Input
                                type="text"
                                placeholder="Enter password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="flex-1"
                              />
                              <Button onClick={handleSetPassword} disabled={savingPassword} size="sm">
                                {savingPassword ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Saving...
                                  </>
                                ) : (
                                  <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Set Password
                                  </>
                                )}
                              </Button>
                            </div>
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>

                    {loadingAttendance ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                        <span className="ml-2 text-slate-500">Loading attendance records...</span>
                      </div>
                    ) : attendanceRecords.length === 0 ? (
                      <div className="text-center py-8">
                        <Calendar className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                        <p className="text-slate-500">No attendance records yet</p>
                        <p className="text-sm text-slate-400 mt-1">
                          Students will submit attendance each week via the Student Portal
                        </p>
                      </div>
                    ) : (
                      <Tabs
                        defaultValue={`week-${Math.max(...attendanceRecords.map((r) => r.weekNumber))}`}
                        className="w-full"
                      >
                        {/* Week Tabs */}
                        <TabsList className="flex flex-wrap gap-1 h-auto p-1 bg-slate-100/80 mb-4">
                          {Array.from(new Set(attendanceRecords.map((r) => r.weekNumber)))
                            .sort((a, b) => a - b)
                            .map((weekNum) => {
                              const weekRecords = attendanceRecords.filter((r) => r.weekNumber === weekNum)
                              const isCurrentWeek = weekNum === Math.max(...attendanceRecords.map((r) => r.weekNumber))
                              return (
                                <TabsTrigger
                                  key={weekNum}
                                  value={`week-${weekNum}`}
                                  className={`gap-2 ${isCurrentWeek ? "bg-blue-50 border-blue-200" : ""}`}
                                >
                                  <Calendar className="h-4 w-4" />
                                  Week {weekNum}
                                  <span className="ml-1 text-xs text-slate-500">({weekRecords.length})</span>
                                </TabsTrigger>
                              )
                            })}
                        </TabsList>

                        {/* Week Content */}
                        {Array.from(new Set(attendanceRecords.map((r) => r.weekNumber)))
                          .sort((a, b) => a - b)
                          .map((weekNum) => {
                            const weekAttendance = attendanceRecords.filter((r) => r.weekNumber === weekNum)
                            const weekInfo = semesterSchedule.find((w) => w.week_number === weekNum)
                            const dateRange = weekInfo
                              ? `${new Date(weekInfo.week_start).toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${new Date(weekInfo.week_end).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                              : ""

                            if (weekAttendance.length === 0) return null

                            // Split attendance records by is_present boolean
                            const presentRecords = weekAttendance.filter((r) => r.is_present)
                            const explicitAbsentRecords = weekAttendance.filter((r) => !r.is_present)
                            const classDate = weekAttendance[0]?.classDate || ''

                            // Find students who have NO attendance record for this week (didn't submit = absent)
                            const studentIdsWithRecords = new Set(weekAttendance.map((r) => r.studentId))
                            const missingStudents = students.filter((s) => !studentIdsWithRecords.has(s.id))

                            // Combine explicit absent records + missing students into one absent list
                            const allAbsentStudents = [
                              ...explicitAbsentRecords.map((r) => ({
                                student_id: r.studentId,
                                student_name: r.studentName,
                                student_clinic_name: r.clinic,
                              })),
                              ...missingStudents.map((s) => ({
                                student_id: s.id,
                                student_name: `${s.first_name} ${s.last_name}`,
                                student_clinic_name: s.clinic_name,
                              })),
                            ]

                            // Group present students by clinic
                            const byClinic = presentRecords.reduce(
                              (acc, record) => {
                                const clinic = record.clinic || "Unknown Clinic"
                                if (!acc[clinic]) acc[clinic] = []
                                acc[clinic].push(record)
                                return acc
                              },
                              {} as Record<string, typeof weekAttendance>,
                            )

                            // Group absent students by clinic
                            const absentByClinic = allAbsentStudents.reduce(
                              (acc, student) => {
                                const clinic = student.student_clinic_name || "Unknown Clinic"
                                if (!acc[clinic]) acc[clinic] = []
                                acc[clinic].push(student)
                                return acc
                              },
                              {} as Record<string, Array<{ student_id: string; student_name: string; student_clinic_name: string }>>,
                            )

                            return (
                              <TabsContent key={weekNum} value={`week-${weekNum}`} className="space-y-4">
                                <div className="flex items-center justify-between mb-4 pb-2 border-b">
                                  <div>
                                    <h3 className="font-semibold text-lg">
                                      Week {weekNum} {dateRange && `(${dateRange})`}
                                    </h3>
                                    <p className="text-sm text-slate-500">
                                      {weekAttendance.length > 0 &&
                                        new Date(weekAttendance[0].classDate).toLocaleDateString("en-US", {
                                          month: "long",
                                          day: "numeric",
                                          year: "numeric",
                                        })}
                                    </p>
                                  </div>
                                  <div className="text-right flex gap-4">
                                    <div>
                                      <p className="text-2xl font-bold text-green-600">{presentRecords.length}</p>
                                      <p className="text-xs text-slate-500">Present</p>
                                    </div>
                                    <div>
                                      <p className="text-2xl font-bold text-red-600">{allAbsentStudents.length}</p>
                                      <p className="text-xs text-slate-500">Absent</p>
                                    </div>
                                    <div>
                                      <p className="text-2xl font-bold text-slate-600">{students.length}</p>
                                      <p className="text-xs text-slate-500">Total</p>
                                    </div>
                                  </div>
                                </div>

                                {/* Group by Clinic */}
                                {Object.entries(byClinic)
                                  .sort(([a], [b]) => a.localeCompare(b))
                                  .map(([clinicName, clinicRecords]) => {
                                    const clinicAbsentStudents = absentByClinic[clinicName] || []
                                    const clinicKey = `${weekNum}-${clinicName}`
                                    const isEditMode = attendanceEditMode[clinicKey] || false
                                    const pendingChanges = pendingAttendanceChanges[clinicKey] || []
                                    const isConfirmed = confirmedAttendance[clinicKey] || false
                                    
                                    // Calculate effective present/absent lists including pending changes
                                    const effectivePresentRecords = clinicRecords.filter(r => {
                                      const change = pendingChanges.find(c => c.studentId === r.studentId)
                                      return change ? change.newStatus : true
                                    })
                                    const movedToAbsent = clinicRecords.filter(r => {
                                      const change = pendingChanges.find(c => c.studentId === r.studentId)
                                      return change && !change.newStatus
                                    })
                                    const effectiveAbsentStudents = [
                                      ...clinicAbsentStudents.filter(s => {
                                        const change = pendingChanges.find(c => c.studentId === s.student_id)
                                        return change ? !change.newStatus : true
                                      }),
                                      ...movedToAbsent.map(r => ({
                                        student_id: r.studentId,
                                        student_name: r.studentName,
                                        student_clinic_name: r.clinic
                                      }))
                                    ]
                                    const movedToPresent = clinicAbsentStudents.filter(s => {
                                      const change = pendingChanges.find(c => c.studentId === s.student_id)
                                      return change && change.newStatus
                                    })
                                    const allPresentRecords = [
                                      ...effectivePresentRecords,
                                      ...movedToPresent.map(s => ({
                                        studentId: s.student_id,
                                        studentName: s.student_name,
                                        clinic: s.student_clinic_name,
                                        id: '',
                                        studentEmail: '',
                                        classDate: '',
                                        weekNumber: weekNum,
                                        weekEnding: '',
                                        notes: '',
                                        is_present: true
                                      }))
                                    ]
                                    
                                    const toggleStudentStatus = (studentId: string, studentName: string, currentlyPresent: boolean) => {
                                      if (!isEditMode) return
                                      
                                      setPendingAttendanceChanges(prev => {
                                        const current = prev[clinicKey] || []
                                        const existingIndex = current.findIndex(c => c.studentId === studentId)
                                        
                                        if (existingIndex >= 0) {
                                          // Toggle back - remove the pending change
                                          const newChanges = [...current]
                                          newChanges.splice(existingIndex, 1)
                                          return { ...prev, [clinicKey]: newChanges }
                                        } else {
                                          // Add new pending change
                                          return {
                                            ...prev,
                                            [clinicKey]: [...current, { studentId, studentName, newStatus: !currentlyPresent }]
                                          }
                                        }
                                      })
                                    }
                                    
                                    const handleConfirm = async () => {
                                      // If there are pending changes, save them to the database
                                      if (pendingChanges.length > 0) {
                                        for (const change of pendingChanges) {
                                          // Find the attendance record for this student
                                          const record = weekAttendance.find(r => r.studentId === change.studentId)
                                          if (record) {
                                            try {
                                              const res = await fetch('/api/attendance/update-status', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                  attendanceId: record.id,
                                                  isPresent: change.newStatus,
                                                  userEmail: userEmail
                                                })
                                              })
                                              if (res.ok) {
                                                // Update local state
                                                setAttendanceRecords(prev => prev.map(r => 
                                                  r.id === record.id ? { ...r, is_present: change.newStatus } : r
                                                ))
                                              }
                                            } catch (error) {
                                              console.error('Failed to update attendance:', error)
                                            }
                                          }
                                        }
                                        toast({
                                          title: "Attendance Updated",
                                          description: `Updated ${pendingChanges.length} student(s) attendance status.`,
                                        })
                                      } else {
                                        toast({
                                          title: "Confirmed",
                                          description: "Attendance records confirmed as correct.",
                                        })
                                      }
                                      // Clear edit mode and pending changes, mark as confirmed
                                      setAttendanceEditMode(prev => ({ ...prev, [clinicKey]: false }))
                                      setPendingAttendanceChanges(prev => ({ ...prev, [clinicKey]: [] }))
                                      setConfirmedAttendance(prev => ({ ...prev, [clinicKey]: true }))
                                      
                                      // Send notification to all students in this clinic that attendance was confirmed
                                      const studentsInClinic = [...clinicRecords, ...clinicAbsentStudents]
                                      for (const student of studentsInClinic) {
                                        try {
                                          await fetch('/api/notifications', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                              type: 'attendance_approved',
                                              title: 'Attendance Confirmed',
                                              message: `Your attendance for Week ${weekNum} has been confirmed by the director.`,
                                              studentId: student.studentId || student.student_id,
                                              studentName: student.studentName || student.student_name,
                                              studentEmail: student.studentEmail || student.student_email,
                                              clinicId: student.clinicId || student.clinic_id,
                                              targetAudience: 'students',
                                              relatedId: `week-${weekNum}`,
                                              createdByUserId: userEmail,
                                            })
                                          })
                                        } catch (error) {
                                          console.error('Failed to send attendance confirmation notification:', error)
                                        }
                                      }
                                    }
                                    
                                    return (
                                      <div key={clinicName} className={`border rounded-lg p-4 ${isEditMode ? 'bg-blue-50 border-blue-300' : 'bg-slate-50'}`}>
                                        <div className="flex items-center justify-between mb-3">
<h4 className="font-semibold text-md flex items-center gap-2">
                                          <Building2 className="h-4 w-4 text-blue-600" />
                                          {clinicName}
                                        </h4>
                                          <div className="flex gap-2">
                                            {isConfirmed ? (
                                              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-md text-sm font-medium">
                                                <CheckCircle2 className="h-4 w-4" />
                                                Confirmed
                                              </div>
                                            ) : isEditMode ? (
                                              <>
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  className="bg-transparent text-slate-600 border-slate-300 hover:bg-slate-100"
                                                  onClick={() => {
                                                    setAttendanceEditMode(prev => ({ ...prev, [clinicKey]: false }))
                                                    setPendingAttendanceChanges(prev => ({ ...prev, [clinicKey]: [] }))
                                                  }}
                                                >
                                                  Cancel
                                                </Button>
                                                <Button
                                                  size="sm"
                                                  className="bg-green-600 hover:bg-green-700 text-white"
                                                  onClick={handleConfirm}
                                                >
                                                  <Check className="h-4 w-4 mr-1" />
                                                  Confirm
                                                </Button>
                                              </>
                                            ) : (
                                              <>
                                                <Button
                                                  size="sm"
                                                  className="bg-green-600 hover:bg-green-700 text-white"
                                                  onClick={handleConfirm}
                                                >
                                                  <Check className="h-4 w-4 mr-1" />
                                                  Confirm
                                                </Button>
                                                <Button
                                                  size="sm"
                                                  className="bg-blue-600 hover:bg-blue-700 text-white"
                                                  onClick={() => setAttendanceEditMode(prev => ({ ...prev, [clinicKey]: true }))}
                                                >
                                                  <Pencil className="h-4 w-4 mr-1" />
                                                  Edit
                                                </Button>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                        
                                        {isEditMode && (
                                          <div className="mb-3 p-2 bg-blue-100 rounded text-sm text-blue-800">
                                            Click on a student name to move them between Present and Absent. Click Confirm when done.
                                          </div>
                                        )}

                                        {/* Present Students - Concise Badge View */}
                                        <div className="mb-3">
                                          <p className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                                            Present Students ({allPresentRecords.length})
                                          </p>
                                          <div className="flex flex-wrap gap-2">
                                            {allPresentRecords.map((record, idx) => {
                                              const isPendingChange = pendingChanges.some(c => c.studentId === record.studentId)
                                              return (
                                                <Badge
                                                  key={idx}
                                                  variant="outline"
                                                  className={`${
                                                    isPendingChange 
                                                      ? 'bg-yellow-100 border-yellow-400 text-yellow-800' 
                                                      : 'bg-white border-green-200 text-green-700'
                                                  } ${isEditMode ? 'cursor-pointer hover:bg-green-100' : ''} transition-colors`}
                                                  onClick={() => toggleStudentStatus(record.studentId, record.studentName, true)}
                                                >
                                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                                  {record.studentName}
                                                  {isPendingChange && <span className="ml-1 text-xs">(moved)</span>}
                                                </Badge>
                                              )
                                            })}
                                          </div>
                                        </div>

                                        {/* Absent Students */}
                                        {(effectiveAbsentStudents.length > 0 || isEditMode) && (
                                          <div className="pt-3 border-t border-slate-200">
                                            <p className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                                              <XCircle className="h-4 w-4 text-red-600" />
                                              Absent Students ({effectiveAbsentStudents.length})
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                              {effectiveAbsentStudents.map((student, idx) => {
                                                const isPendingChange = pendingChanges.some(c => c.studentId === student.student_id)
                                                
                                                return (
                                                  <Badge
                                                    key={idx}
                                                    variant="outline"
                                                    className={`${
                                                      isPendingChange 
                                                        ? 'bg-yellow-100 border-yellow-400 text-yellow-800' 
                                                        : 'bg-red-50 border-red-200 text-red-700'
                                                    } ${isEditMode ? 'cursor-pointer hover:bg-red-100' : ''} transition-colors`}
                                                    onClick={() => isEditMode && toggleStudentStatus(student.student_id, student.student_name, false)}
                                                  >
                                                    <XCircle className="h-3 w-3 mr-1" />
                                                    {student.student_name}
                                                    {isPendingChange && <span className="ml-1 text-xs">(moved)</span>}
                                                  </Badge>
                                                )
                                              })}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )
                                  })}
                              </TabsContent>
                            )
                          })}
                      </Tabs>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              {/* End of Attendance Tab */}

<TabsContent value="meetings" className="space-y-4">
                  <Card className="border-0 shadow-sm">
                    <CardHeader className="border-b bg-muted/30 rounded-t-lg">
                      <CardTitle className="text-xl font-semibold flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Meeting Requests
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <MeetingsQueue weekNumber={getCurrentWeekNumber()} />
                    </CardContent>
                  </Card>
                </TabsContent>
            </Tabs>

            {/* Evaluation Dialog */}
            <Dialog open={evaluationDialogOpen} onOpenChange={setEvaluationDialogOpen}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5" />
                    {evaluationType === "final" ? "Final" : "Mid-Term"} Evaluation
                  </DialogTitle>
                  <p className="text-sm text-muted-foreground">
                    {evaluationType === "final"
                      ? "Evaluate the team's final presentation, deliverables, and recommendations."
                      : "Evaluate the team's mid-term presentation on their client knowledge and project outline."}
                  </p>
                </DialogHeader>

                <div className="space-y-6 py-4">
                  {/* Evaluation Type Toggle */}
                  <div className="flex gap-2 p-1 bg-muted rounded-lg">
                    <Button
                      variant={evaluationType === "midterm" ? "default" : "outline"}
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setEvaluationType("midterm")
                        setEvaluationRatings({})
                        setEvaluationNotes({})
                      }}
                    >
                      Mid-Term Evaluation
                    </Button>
                    <Button
                      variant={evaluationType === "final" ? "default" : "outline"}
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setEvaluationType("final")
                        setEvaluationRatings({})
                        setEvaluationNotes({})
                      }}
                    >
                      Final Evaluation
                    </Button>
                  </div>

                  {/* Client Selection */}
                  <div className="space-y-2">
                    <Label>Client Team</Label>
                    <Select value={selectedClientForEval || ""} onValueChange={setSelectedClientForEval}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select client team" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Director Selection */}
                  <div className="space-y-2">
                    <Label>Evaluator (Director)</Label>
                    <Select value={selectedDirectorForEval} onValueChange={setSelectedDirectorForEval}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your name" />
                      </SelectTrigger>
                      <SelectContent>
                        {directors.map((director) => (
                          <SelectItem key={director.id} value={director.full_name}>
                            {director.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Rating Questions - dynamically use correct questions */}
                  <div className="space-y-6">
                    <h4 className="font-medium">
                      Evaluation Questions{" "}
                      <span className="text-muted-foreground font-normal">(Rate 1-5, where 5 is Excellent)</span>
                    </h4>
                    {(evaluationType === "final" ? FINAL_EVALUATION_QUESTIONS : EVALUATION_QUESTIONS).map((q) => (
                      <div key={q.id} className="space-y-3 p-4 border rounded-lg">
                        <div>
                          <p className="font-medium text-sm">
                            {q.id}. {q.question}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">{q.guidance}</p>
                        </div>

                        {/* Star Rating */}
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <button
                              key={rating}
                              type="button"
                              onClick={() => setEvaluationRatings((prev) => ({ ...prev, [q.id]: rating }))}
                              className={`p-1 rounded hover:bg-muted transition-colors ${
                                evaluationRatings[q.id] >= rating ? "text-amber-500" : "text-muted-foreground"
                              }`}
                            >
                              <Star className={`h-6 w-6 ${evaluationRatings[q.id] >= rating ? "fill-current" : ""}`} />
                            </button>
                          ))}
                          <span className="ml-2 text-sm text-muted-foreground">
                            {evaluationRatings[q.id] ? `${evaluationRatings[q.id]}/5` : "Not rated"}
                          </span>
                        </div>

                        {/* Notes */}
                        <Textarea
                          placeholder="Add comments for this question..."
                          value={evaluationNotes[q.id] || ""}
                          onChange={(e) => setEvaluationNotes((prev) => ({ ...prev, [q.id]: e.target.value }))}
                          className="min-h-[60px]"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Additional Comments */}
                  <div className="space-y-2">
                    <Label>Additional Comments</Label>
                    <Textarea
                      placeholder="Any additional feedback or comments you would like to share..."
                      value={additionalComments}
                      onChange={(e) => setAdditionalComments(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={() => setEvaluationDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSubmitEvaluation}
                      disabled={submittingEvaluation || !selectedClientForEval || !selectedDirectorForEval}
                      className="gap-2"
                    >
                      {submittingEvaluation ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Submit {evaluationType === "final" ? "Final" : "Mid-Term"} Evaluation
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </main>
    </div>
  )
}
