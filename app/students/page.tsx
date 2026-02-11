"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { MainNavigation } from "@/components/main-navigation"
import { getErrorMessage, isAuthError, isPermissionError } from "@/lib/error-handler"
import { useDemoMode } from "@/contexts/demo-mode-context"
import { StudentPortalHeader } from "@/components/student-portal-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  HelpCircle,
  Building2,
  AlertCircle,
  Bell,
  Presentation,
  Award,
  Users,
  CalendarClock,
  ChevronDown,
  Eye,
  UserCheck,
  UsersRound,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Lock,
} from "lucide-react"
import { upload } from "@vercel/blob/client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ClientServiceTab } from "@/components/client-service-tab"
import { StudentClinicView } from "@/components/student-clinic-view"
import { Triage } from "@/components/triage"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useDemoStudent, DEMO_STUDENTS } from "@/components/demo-student-selector"
import { useUserRole, canAccessPortal, getDefaultPortal } from "@/hooks/use-user-role"

function isRateLimitText(text: string): boolean {
  if (!text) return false
  const lower = text.toLowerCase()
  return lower.startsWith("too many r") || lower.includes("rate limit") || lower.includes("too many requests")
}

async function fetchWithRetry(url: string, maxRetries = 2): Promise<Response> {
  const emptyJson = () =>
    new Response(JSON.stringify({}), { status: 200, headers: { "Content-Type": "application/json" } })

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url)

      // Check for rate limiting via status code
      if (response.status === 429) {
        if (attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 500 + Math.random() * 200))
          continue
        }
        return emptyJson()
      }

      // Read the body text ONCE, then check for rate limit content.
      // We reconstruct a new Response so downstream code can still read it.
      const bodyText = await response.text()

      if (isRateLimitText(bodyText) || (bodyText.includes("Too Many R") && bodyText.includes("SyntaxError"))) {
        if (attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 500 + Math.random() * 200))
          continue
        }
        return emptyJson()
      }

      // Return a fresh Response with the body text so it can be read again downstream
      return new Response(bodyText, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      })
    } catch (error: any) {
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, Math.pow(2, attempt + 1) * 1000))
        continue
      }
      return emptyJson()
    }
  }
  return emptyJson()
}

async function fetchSequentially(urls: string[]): Promise<Response[]> {
  const results: Response[] = []
  for (let i = 0; i < urls.length; i++) {
    if (i > 0) {
      await new Promise((resolve) => setTimeout(resolve, 600))
    }
    const res = await fetchWithRetry(urls[i], 2)
    results.push(res)
  }
  return results
}

async function safeJsonParse<T>(response: Response, defaultValue: T): Promise<T> {
  try {
    const text = await response.text()
    if (!text || text.startsWith("<!DOCTYPE") || text.startsWith("Too Many R") || text.startsWith("too many")) {
      return defaultValue
    }
    return JSON.parse(text) as T
  } catch {
    return defaultValue
  }
}

interface Student {
  id: string
  firstName: string
  lastName: string
  fullName: string
  email: string
  universityId?: string
  clinic: string
  clinicId?: string // Added for clinic view
  clientTeam?: string
  clientId?: string
  clientName?: string
  education?: string
  academicLevel?: string
  businessExperience?: string
  linkedinProfile?: string
  status: string
  semester: string
  isTeamLeader: boolean
  totalHours: number
  attendanceCount: number
}

interface Debrief {
  id: string
  studentId: string
  studentName: string
  studentEmail: string
  clientName: string
  clinic: string
  hoursWorked: number
  workSummary: string
  questions?: string
  questionType?: "clinic" | "client" // Added question type field
  weekEnding: string
  semester: string
  status: string
  createdAt: string
  weekNumber: number
}

interface AttendanceRecord {
  id: string
  studentId: string
  studentName: string
  studentEmail: string
  classDate: string
  weekNumber: number
  weekEnding: string
  clinic: string
  notes?: string
  semester: string
}

interface AvailableStudent {
  id: string
  full_name: string
  email: string
  clinic: string
}

interface SemesterWeek {
  id: string
  week_number: string // Changed to string to match Supabase schema for week_number
  week_label: string
  week_start: string
  week_end: string
  session_focus?: string
  is_break: boolean
  activities?: any[]
}

const CLINIC_COLORS = {
  "Consulting Clinic": { bg: "bg-[#4A6FA5]/10", border: "border-[#4A6FA5]/30", text: "text-[#4A6FA5]" },
  "Accounting Clinic": { bg: "bg-[#5B7C99]/10", border: "border-[#5B7C99]/30", text: "text-[#5B7C99]" },
  "Marketing Clinic": { bg: "bg-[#C4B5C4]/10", border: "border-[#C4B5C4]/30", text: "text-[#C4B5C4]" },
  Consulting: { bg: "bg-[#4A6FA5]/10", border: "border-[#4A6FA5]/30", text: "text-[#4A6FA5]" },
  Accounting: { bg: "bg-[#5B7C99]/10", border: "border-[#5B7C99]/30", text: "text-[#5B7C99]" },
  Marketing: { bg: "bg-[#C4B5C4]/10", border: "border-[#C4B5C4]/30", text: "text-[#C4B5C4]" },
}

const GRADING_BREAKDOWN = {
  attendance: {
    weight: 15,
    label: "Attendance & Participation",
    type: "Individual",
    description:
      "Attendance and participation with Instructors and guest speakers in the on-boarding portion of the semester.",
  },
  assignments: {
    weight: 15,
    label: "Written Assignments (5)",
    type: "Individual",
    description: "The quality and completeness of at least five written assignments required by the Course.",
  },
  midterm: {
    weight: 20,
    label: "Mid-Term Presentation",
    type: "Team",
    description:
      "Quality of research, solution, recommendations, and presentation delivered for assigned mid-term presentation, presented to Instructors and guests.",
  },
  clientWork: {
    weight: 20,
    label: "Client Meetings & Work Process",
    type: "Team",
    description:
      "Attendance and participation in client meetings, client team/clinic director meetings and clinic director and client feedback of work process and client relationship.",
  },
  final: {
    weight: 30,
    label: "Final Presentation & Deliverables",
    type: "Team",
    description:
      "Quality of research, solution and recommendations made to the client, including deliverables from the statement of work and the final presentation.",
  },
}

const DELIVERABLE_INSTRUCTIONS = {
  sow: {
    title: "Statement of Work (SOW)",
    weight: "Part of Final Grade (30%)",
    icon: FileText,
    description:
      "The Statement of Work outlines the project scope, objectives, deliverables, and timeline agreed upon between the student team and the client. It serves as a formal agreement between your SEED team and the client.",
    instructions: [
      "Define clear project objectives and success metrics",
      "Outline specific deliverables with deadlines",
      "Document client expectations and requirements",
      "Include timeline and milestones",
      "Get client sign-off before proceeding",
    ],
    templateSections: [
      {
        title: "1. Project Summary",
        description: "Provide an overview of the client's business and the project objectives.",
        content: [
          "Describe the client's business model, products/services, and market position",
          "Summarize the key challenges or opportunities the project will address",
          "List 3-5 specific project objectives that align with client needs",
        ],
        example:
          "Example: '[Client Name] is a [business type] founded by [founder name], dedicated to [mission]. The company offers [products/services]. To help the business grow, the team will address [key areas such as financial structure, marketing, operations, etc.].'",
      },
      {
        title: "2. Project Scope & Deliverables",
        description: "Break down the project into workstreams with specific activities and deliverables.",
        workstreams: [
          {
            name: "Business Model & Financial Analysis",
            activities:
              "Draft and review financial statements, assess tax credits, explore accounting system integration",
            deliverables:
              "Financial insights report, cost-saving recommendations, tax credit opportunities, system integration plan",
          },
          {
            name: "Market Research & Value Proposition",
            activities: "Conduct customer research, analyze feedback, identify value trends",
            deliverables: "Market research report, website improvement recommendations, customer engagement strategies",
          },
          {
            name: "Strategic Marketing & Outreach",
            activities: "Diversify marketing channels, develop CRM utilization strategies",
            deliverables: "Marketing plan, outreach program recommendations, new channel identification",
          },
          {
            name: "Operational Optimization",
            activities: "Develop metrics, track conversion rates, create standard operating procedures",
            deliverables: "SOP documentation, performance tracking framework, process improvement recommendations",
          },
          {
            name: "Funding & Expansion Planning",
            activities: "Assess funding sources, evaluate capital needs, prepare grant guidelines",
            deliverables: "Funding strategy document, expansion roadmap, grant application templates",
          },
        ],
      },
      {
        title: "3. Schedule",
        description: "Define the project timeline with key milestones.",
        content: [
          "Project start and end dates (typically January through May)",
          "Weekly client meeting schedule",
          "Mid-term presentation date",
          "Final presentation date",
          "Key deliverable due dates",
        ],
        example:
          "Example: 'The project began on [start date] and will conclude on [end date]. Weekly meetings with [Client Name] will occur on [day/time]. Mid-term presentation: [date]. Final presentation: [date].'",
      },
      {
        title: "4. Client Commitment",
        description: "Outline what the client agrees to provide and their responsibilities.",
        content: [
          "Provide timely access to all necessary records, data, and analytics",
          "Designate a primary point of contact for coordination",
          "Review deliverables and provide feedback within agreed timeframes",
          "Attend scheduled meetings and presentations",
        ],
      },
      {
        title: "5. Changes to the Statement of Work",
        description: "Define the change management process.",
        content: [
          "Any changes to scope, schedule, or deliverables must be documented",
          "Both parties must review and approve modifications in writing",
          "Changes should be communicated promptly to all stakeholders",
        ],
      },
      {
        title: "6. Communications",
        description: "Establish communication protocols and expectations.",
        content: [
          "Weekly updates via project check-in meetings and email reports",
          "Scheduled project review meetings for feedback",
          "Response time expectations for emails and requests",
          "Final presentation of results and recommendations",
        ],
      },
      {
        title: "7. Confidentiality",
        description: "Address confidentiality and NDA requirements.",
        content: [
          "All materials, data, and findings are kept confidential",
          "Information used for project purposes only",
          "Reference signed NDA agreement",
          "No proprietary or sensitive information disclosed outside agreement",
        ],
      },
      {
        title: "8. SEED Team & Roles",
        description: "List team members and their specific responsibilities.",
        roles: [
          { role: "Team Leader", responsibilities: "Project oversight and execution, main client contact and liaison" },
          {
            role: "Resource Acquisition",
            responsibilities: "Identifying and securing resources, funding opportunities, strategic partnerships",
          },
          {
            role: "Consulting Team",
            responsibilities: "Business model optimization, market research, strategic planning",
          },
          { role: "Accounting/Finance", responsibilities: "Financial analysis, cost reporting, accounting systems" },
          { role: "Marketing", responsibilities: "Marketing analysis, plans, and tactics" },
        ],
      },
      {
        title: "9. Summary & Signatures",
        description: "Closing statement and signature blocks.",
        content: [
          "Thank the client for the opportunity to collaborate",
          "Express commitment to achieving successful outcomes",
          "Include signature blocks for both client and SEED Clinic team",
          "Capture printed names, titles, and dates",
        ],
      },
    ],
    dueInfo: "Due by Week 4 of the semester",
    submissionType: "sow",
  },
  midterm: {
    title: "Mid-Term Presentation",
    weight: "Team Grade - 20%",
    icon: Presentation,
    description:
      "Each client team will research and present the key attributes of their assigned client's business, industry, and focus of their client project. The objective is to demonstrate and present succinctly and clearly in a ten-minute presentation your team's knowledge of your client's business and how you will help the business.",
    instructions: [
      "Client Business: Define your client's business model including product/service, customers/clients, marketing and sales approach, delivery method, and profit generation",
      "Industry: Research your client's industry, identify competitors or similar businesses, understand market operations and key industry characteristics, identify key competitors and competitive advantages",
      "Key Performance Indicators: Identify metrics your client needs to monitor performance, understand accounting systems and processes required for these measurements",
      "Project Focus: Define key areas of focus for your client project and explain how they help your client grow and sustain competitive advantage",
    ],
    planningGuidelines: [
      "Presentations must be prepared in PowerPoint - recommend 8 slides or less",
      "All teammates must have a speaking role",
      "Presentations are due 24 hours in advance (10/26/25)",
      "Presentations will be delivered at class on 10/27/25",
      "Each presentation is 10 minutes, moderated by Clinic Directors & Mj",
      "Order of presentations will be announced prior to class start time",
      "Class will have food and soft drinks provided",
    ],
    presentationTeams: [
      "Team Sawyer",
      "Team Paw",
      "Team Malden",
      "Team REWRITE",
      "Team Crown",
      "Team Marabou",
      "Team Serene",
      "Team Intriguing",
      "Team SEED",
    ],
    learningObjectives: [
      "Demonstrate knowledge and understanding of the client's business and industry",
      "Ability to be brief and impactful in explaining the business and key industry attributes",
      "Outline the key areas of focus for the client project",
    ],
    dueInfo: "Due 10/26/25 - Presentation on 10/27/25",
    submissionType: "midterm",
  },
  final: {
    title: "Final Presentation",
    weight: "Team Grade - 30%",
    icon: Award,
    description:
      "Quality of research, solution and recommendations made to the client, including deliverables from the statement of work and the final presentation prepared and delivered by the student client team to the client.",
    instructions: [
      "Project Description (brief) - Project name, team, date, and a one sentence objective",
      "Executive Summary - About your project and what you achieved, headline impact (dollars, time, or strategic value)",
      "Problem / Opportunity - Concise statement of the issue with supporting metric or evidence",
      "Recommendation(s) to Client - Be concise and clear, state key success metric(s) and timeline",
      "Rationale - Top 3 reasons supporting the recommendation with data points",
      "Financials & Impact - Cost, ROI, payback, and sensitivity (best/base/worst)",
      "Implementation / Timeline - Major milestones, roadmap, key deliverables and dependencies",
      "Risks & Mitigations - Top 3-5 risks with probability/impact and mitigation steps",
      "Next Steps - Recommended steps the client needs to take to implement",
      "Appendix - Backup slides for deep data, methods, or Q&A",
    ],
    dueInfo: "Final week of semester",
    submissionType: "final",
    presentationTips: [
      "Expect to spend an hour with your client - 20 minutes presentation +/-",
      "Make it interactive, ask if there are any questions after major sections",
      "Each person on the team should have a speaking role",
      "Team leader should manage the presentation and ensure clean transitions",
      "Lead with the conclusion; use the top down 'BLUF' (Bottom Line Up Front)",
      "Keep slides sparse: one idea per slide, one headline per slide",
      "Use clear visuals (single chart or table per slide)",
      "Anticipate 3-5 likely questions and have appendix slides ready",
      "Close with the result you expect your client to achieve",
    ],
  },
}

interface DeliverableDocument {
  id: string
  fileName: string
  fileUrl: string
  submissionType: string
  uploadedAt: string
  status: "pending" | "submitted" | "graded"
  grade?: number
  feedback?: string
}

interface TeamGrade {
  deliverableType: string
  grade: number
  feedback?: string
  finalizedBy: string
  finalizedAt: string
}

// export default function StudentPortalPage() { // Changed to StudentPortal
export default function StudentPortal() {
  const router = useRouter()
  const { isDemoMode } = useDemoMode()
  const { role, email: userEmail, studentId: authStudentId, isLoading: roleLoading, isAuthenticated } = useUserRole()
  const isAdminOrDirector = role === "admin" || role === "director"
  const allowDemoMode = isDemoMode && isAdminOrDirector

  const demoStudentId = useDemoStudent(DEMO_STUDENTS[0].id)
  // For directors/admins, don't initialize with demo student - let the fetch set a real student
  const [selectedStudentId, setSelectedStudentId] = useState<string>(authStudentId || "")

  const [availableStudents, setAvailableStudents] = useState<AvailableStudent[]>([])

  // useEffect(() => {
  //   setSelectedStudentId(demoStudentId)
  // }, [demoStudentId])

  useEffect(() => {
    // Still loading - don't redirect yet
    if (roleLoading) return

    if (allowDemoMode) return

    // Directors and admins can always access
    if (role === "director" || role === "admin") return

    // Students can access their own portal
    if (role === "student") return

    // Not authenticated at all - redirect to login
    if (!isAuthenticated) {
      router.push("/sign-in")
      return
    }

    // Don't redirect when role is null - user IS authenticated, keep them here

    // Authenticated with a role that can't access student portal (e.g., client)
    if (!canAccessPortal(role, "student")) {
      router.push(getDefaultPortal(role))
      return
    }
  }, [role, roleLoading, isAuthenticated, allowDemoMode, router])

  useEffect(() => {
    const fetchAvailableStudents = async () => {
      // Use Vercel-specific API for complete mapping of students to admins/directors
      if (isAdminOrDirector) {
        try {
          const res = await fetch("/api/supabase/v-complete-mapping")
          const responseData = await safeJsonParse(res, { data: [] })
          const mappings = responseData.data || responseData.mappings || responseData.records || []
          if (mappings.length > 0) {
            // Deduplicate students by ID since the view can have multiple rows per student
            const studentMap = new Map<string, any>()
            for (const row of mappings) {
              if (row.student_id && !studentMap.has(row.student_id)) {
                studentMap.set(row.student_id, {
                  id: row.student_id,
                  full_name: row.student_name,
                  email: row.student_email,
                  clinic: row.student_clinic_name || "No Clinic",
                })
              }
            }
            const uniqueStudents = Array.from(studentMap.values())
            setAvailableStudents(uniqueStudents)
            // If no student selected yet and we have students, select the first one
            if (!selectedStudentId && uniqueStudents.length > 0) {
              setSelectedStudentId(uniqueStudents[0].id)
            }
          }
} catch (error) {
  console.error("Error fetching students:", error)
  if (isAuthError(error)) {
    router.push("/sign-in")
  }
  }
  } else if (role === "student") {
        if (authStudentId) {
          setSelectedStudentId(authStudentId)
        }
      }
    }

    if (!roleLoading) {
      fetchAvailableStudents()
    }
  }, [role, userEmail, authStudentId, roleLoading, isAdminOrDirector])

  const canSwitchStudents = isAdminOrDirector

  const [loading, setLoading] = useState(true)
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null)
  const [debriefs, setDebriefs] = useState<Debrief[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [questionText, setQuestionText] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // CHANGE: Add team status state variables
  const [teamData, setTeamData] = useState<any>(null)
  const [teamSummary, setTeamSummary] = useState<string>("")
  const [loadingTeamSummary, setLoadingTeamSummary] = useState(false)
  const [teamSummaryError, setTeamSummaryError] = useState<string | null>(null)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadedFileUrl, setUploadedFileUrl] = useState("") // Keep this state
  const [uploading, setUploading] = useState(false)
  const [documentDescription, setDocumentDescription] = useState("")
  const [documentClient, setDocumentClient] = useState("")
  const [submissionType, setSubmissionType] = useState("debrief")
  const [dragActive, setDragActive] = useState(false) // Keep this state
  const [openDialog, setOpenDialog] = useState<"hours" | "clients" | "submissions" | "attendance" | null>(null) // Keep this state
  const [expandedSections, setExpandedSections] = useState({
    // Keep this state
    submitWork: false,
    askQuestion: false,
    myQuestions: false,
    workHistory: false,
  })
  const [submittingDocument, setSubmittingDocument] = useState(false) // Declare the variable
  const [questionType, setQuestionType] = useState<"clinic" | "client">("clinic") // Added state for question type selection
  // const [meetingRequests, setMeetingRequests] = useState<any[]>([]) // Removed, consolidated
  const [recentCourseMaterials, setRecentCourseMaterials] = useState<any[]>([])

  const [deliverableDocuments, setDeliverableDocuments] = useState<DeliverableDocument[]>([])
  const [uploadingDeliverable, setUploadingDeliverable] = useState<string | null>(null)
  const [expandedDeliverable, setExpandedDeliverable] = useState<string | null>("sow")
  const [teamGrades, setTeamGrades] = useState<TeamGrade[]>([])

  const [semesterSchedule, setSemesterSchedule] = useState<SemesterWeek[]>([])
  const [classAttendanceRecords, setClassAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [totalStudentCount, setTotalStudentCount] = useState(0)
  const [attendancePassword, setAttendancePassword] = useState("")
  const [selectedWeekForAttendance, setSelectedWeekForAttendance] = useState<string>("")
  const [submittingAttendance, setSubmittingAttendance] = useState(false)

  // State for debrief submission dialog
  const [showDebriefDialog, setShowDebriefDialog] = useState(false)
  const [selectedWeekForDebrief, setSelectedWeekForDebrief] = useState<string>("")
  const [debriefForm, setDebriefForm] = useState({
    hoursWorked: "",
    workSummary: "",
    questions: "",
  })
  const [submittingDebrief, setSubmittingDebrief] = useState(false)

  const [meetingSubject, setMeetingSubject] = useState("")
  const [meetingMessage, setMeetingMessage] = useState("")
  const [preferredDates, setPreferredDates] = useState<string[]>(["", "", ""])
  const [submittingMeeting, setSubmittingMeeting] = useState(false)
  const [meetingRequests, setMeetingRequests] = useState<any[]>([]) // Keep this state

  const [studentNotifications, setStudentNotifications] = useState<any[]>([])

  // Active main tab state (controlled)
  const [mainTab, setMainTab] = useState("dashboard")

  // Add state for signed agreements
  const [signedAgreements, setSignedAgreements] = useState<string[]>([])

  const [expandedStats, setExpandedStats] = useState<{
    hours: boolean
    debriefs: boolean
    pending: boolean
    attendance: boolean
  }>({
    hours: false,
    debriefs: false,
    pending: false,
    attendance: false,
  })

  const toggleSection = (section: keyof typeof expandedSections) => {
    // Keep this function
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  // Ref to track which student we've already fetched data for, preventing duplicate fetches
  const lastFetchedStudentRef = useRef<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      const currentStudentId = role === "student" ? authStudentId : selectedStudentId
      if (!currentStudentId) return
      // Don't fetch while role is still settling to avoid duplicate calls
      if (!role) return

      // Prevent duplicate fetches for the same student
      if (lastFetchedStudentRef.current === currentStudentId) return
      lastFetchedStudentRef.current = currentStudentId

      setLoading(true)
      try {
        // Fetch critical data first (roster + debriefs), then secondary data
        // This avoids Supabase rate limits from 7+ simultaneous queries
        const [studentRes, debriefsRes, scheduleRes] = await Promise.all([
          fetchWithRetry(`/api/supabase/roster?studentId=${currentStudentId}`),
          fetchWithRetry(`/api/supabase/debriefs?studentId=${currentStudentId}`),
          fetchWithRetry("/api/semester-schedule"),
        ])

        const [attendanceRes, meetingRes, materialsRes, docsRes, classAttendanceRes, studentListRes] = await Promise.all([
          fetchWithRetry(`/api/supabase/attendance?studentId=${currentStudentId}`),
          fetchWithRetry(`/api/meeting-requests?studentId=${currentStudentId}`),
          fetchWithRetry("/api/course-materials"),
          fetchWithRetry(`/api/documents?studentId=${currentStudentId}`),
          fetchWithRetry("/api/supabase/attendance"),
          fetchWithRetry("/api/students/list"),
        ])

        // If this effect was cancelled (re-triggered), don't update state
        if (cancelled) return

        const studentData = await safeJsonParse(studentRes, { students: [] })
        const debriefsData = await safeJsonParse(debriefsRes, { debriefs: [] })
        const attendanceData = await safeJsonParse(attendanceRes, { attendance: [] })
        const meetingData = await safeJsonParse(meetingRes, { requests: [] })
        const materialsData = await safeJsonParse(materialsRes, { materials: [] })

        const scheduleData = await safeJsonParse(scheduleRes, { schedules: [] }) // Use safeJsonParse
        // Ensure week_number is treated as a number if it's meant to be
        setSemesterSchedule(
          (scheduleData.schedules || []).map((week: any) => ({
            ...week,
            // Convert week_number to number for sorting/comparison if necessary, but keep as string if that's the DB type
            week_number: String(week.week_number),
          })),
        )

        // Student data is usually an array, so access the first element
        const student = studentData.students?.[0] || null
        setCurrentStudent(student)
        setDebriefs(debriefsData.debriefs || [])
        setAttendanceRecords(attendanceData.attendance || [])
        setMeetingRequests(meetingData.requests || []) // Set meeting requests

        // Class-wide attendance data
        const classAttData = await safeJsonParse(classAttendanceRes, { attendance: [] })
        setClassAttendanceRecords(classAttData.attendance || [])
        const studentListData = await safeJsonParse(studentListRes, { students: [] })
        setTotalStudentCount((studentListData.students || []).length)

        // Get materials from last 7 days for "new" materials
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        const recentMaterials = (materialsData.materials || []).filter((m: any) => new Date(m.created_at) >= weekAgo)
        setRecentCourseMaterials(recentMaterials)

        if (docsRes.ok) {
          const docsData = await safeJsonParse(docsRes, { documents: [] }) // Use safeJsonParse
          const deliverableDocs = (docsData.documents || [])
            .filter((doc: any) => ["sow", "midterm", "final"].includes(doc.submission_type))
            .map((doc: any) => ({
              id: doc.id,
              fileName: doc.file_name,
              fileUrl: doc.file_url,
              submissionType: doc.submission_type,
              uploadedAt: doc.uploaded_at,
              status: doc.status || "submitted",
              grade: doc.grade,
              feedback: doc.feedback,
            }))
          setDeliverableDocuments(deliverableDocs)
        }

        if (student?.clientId) {
          try {
            const gradesRes = await fetchWithRetry(`/api/evaluations?clientId=${student.clientId}&finalized=true`)
            if (gradesRes.ok) {
              const gradesData = await safeJsonParse(gradesRes, { evaluations: [] }) // Use safeJsonParse
              // Process finalized grades
              const grades: TeamGrade[] = (gradesData.evaluations || [])
                .filter((e: any) => e.final_grade !== null)
                .map((e: any) => ({
                  deliverableType: e.evaluation_type || "midterm",
                  grade: e.final_grade,
                  feedback: e.final_feedback,
                  finalizedBy: e.finalized_by || "Nick Vadala",
                  finalizedAt: e.finalized_at,
                }))
              setTeamGrades(grades)
            }
          } catch (error) {
            console.error("Error fetching team grades:", error)
          }
        }

        // After line that sets currentStudent, add:
        // Fetch student notifications (announcements from directors)
        const fetchStudentNotifications = async () => {
          try {
            if (!student?.id) return
            const url = student.clinicId
              ? `/api/student-notifications?studentId=${student.id}&clinicId=${student.clinicId}`
              : `/api/student-notifications?studentId=${student.id}`
            const res = await fetchWithRetry(url)
            if (!res.ok) {
              console.error("Error fetching student notifications: HTTP", res.status)
              return
            }
            const text = await res.text()
            if (text.startsWith("Too Many R")) {
              console.error("Error fetching student notifications: Rate limited")
              return
            }
            try {
              const data = JSON.parse(text)
              if (data.notifications) {
                setStudentNotifications(data.notifications)
              }
            } catch (parseError) {
              console.error("Error parsing student notifications:", parseError)
            }
          } catch (error) {
            console.error("Error fetching student notifications:", error)
          }
        }
        fetchStudentNotifications()

        // Fetch agreements using the student email we already have (avoids extra roster call)
        if (student?.email) {
          try {
            const agreementsRes = await fetchWithRetry(`/api/agreements?userEmail=${encodeURIComponent(student.email)}`)
            const agreementsData = await safeJsonParse(agreementsRes, { agreements: [] })
            if (agreementsData.agreements) {
              setSignedAgreements(agreementsData.agreements.map((a: any) => a.agreement_type))
            }
          } catch (error) {
            console.error("Error fetching agreements:", error)
          }
        }
} catch (error) {
  console.error("Error fetching data:", error)
  // Reset the ref so a retry is possible
  lastFetchedStudentRef.current = null
  if (isAuthError(error)) {
    router.push("/sign-in")
  }
  } finally {
  setLoading(false)
      }
    }

    fetchData()

    return () => {
      cancelled = true
    }
  }, [selectedStudentId, authStudentId, role])

  // Fetch team data AFTER main data is loaded (deferred to avoid rate limiting)
  useEffect(() => {
    const fetchTeamData = async () => {
      const currentStudentId = role === "student" ? authStudentId : selectedStudentId
      if (!currentStudentId || !currentStudent?.clientId) return

      // Defer team data fetch to avoid flooding with the initial batch
      await new Promise((resolve) => setTimeout(resolve, 2000))

      setLoadingTeamSummary(true)
      setTeamSummaryError(null)
      try {
        const teamRes = await fetchWithRetry(`/api/team-workspace?studentId=${currentStudentId}&includeDebriefs=true`)
        if (!teamRes.ok) throw new Error(`HTTP error! status: ${teamRes.status}`)
        const teamData = await safeJsonParse(teamRes, {})
        setTeamData(teamData)

        // Then try to fetch the cached summary (non-critical)
        try {
          await new Promise((resolve) => setTimeout(resolve, 350))
          const summaryRes = await fetchWithRetry(`/api/teams/summary?studentId=${currentStudentId}`)
          if (summaryRes.ok) {
            const summaryData = await safeJsonParse(summaryRes, { summary: "" })
            setTeamSummary(summaryData.summary)
          }
        } catch {
          // Summary is optional - team data already loaded above
        }
      } catch (error: any) {
        console.error("Error fetching team data or summary:", error)
        setTeamSummaryError(error.message || "Failed to load team information.")
      } finally {
        setLoadingTeamSummary(false)
      }
    }
    fetchTeamData()
  }, [currentStudent?.clientId, selectedStudentId, authStudentId, role])

  const handleSubmitQuestion = async () => {
    if (!questionText.trim() || !currentStudent) return

    setSubmitting(true)
    try {
      const response = await fetch("/api/supabase/debriefs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: currentStudent.id,
          studentName: currentStudent.fullName,
          studentEmail: currentStudent.email,
          clientName: currentStudent.clientName || "General",
          clinic: currentStudent.clinic,
          questions: questionText,
          questionType: questionType,
          hoursWorked: 0,
          workSummary: "Question submission",
        }),
      })

      if (response.ok) {
        // Send notification with proper targeting based on question type
        const questionLabel = questionType === "clinic" ? "Clinic Question" : "Client Question"
        const questionContext = questionType === "clinic" 
          ? `[${currentStudent.clinic}]` 
          : `[${currentStudent.clientName || currentStudent.clientTeam || "Client"}]`
        
        await fetch("/api/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "question",
            title: `${questionLabel} from ${currentStudent.fullName}`,
            message: `${questionContext} ${questionText}`,
            studentId: currentStudent.id,
            studentName: currentStudent.fullName,
            studentEmail: currentStudent.email,
            clinic: currentStudent.clinic,
            clinicId: currentStudent.clinicId,
            clientId: currentStudent.clientId,
            questionType: questionType,
          }),
        })

        // Refresh debriefs
        const debriefsRes = await fetch(`/api/supabase/debriefs?studentId=${currentStudent.id}`)
        const debriefsData = await safeJsonParse(debriefsRes, { debriefs: [] }) // Use safeJsonParse
        setDebriefs(debriefsData.debriefs || [])
        setQuestionText("")
        alert("Your question has been sent to your director!")
      } else {
        alert("Failed to send question. Please try again.")
      }
    } catch (error) {
      console.error("Error submitting question:", error)
      alert("An error occurred. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitMeetingRequest = async () => {
    if (!meetingSubject.trim() || !currentStudent) return

    setSubmittingMeeting(true)
    try {
      const validDates = preferredDates.filter((d) => d.trim())

      const response = await fetch("/api/meeting-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: currentStudent.id,
          studentName: currentStudent.fullName,
          studentEmail: currentStudent.email,
          clinic: currentStudent.clinic,
          subject: meetingSubject,
          message: meetingMessage,
          preferredDates: validDates,
        }),
      })

      if (response.ok) {
        await fetch("/api/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "meeting_request",
            title: `Meeting Request: ${meetingSubject}`,
            message: meetingMessage || `${currentStudent.fullName} has requested a meeting`,
            studentId: currentStudent.id,
            studentName: currentStudent.fullName,
            studentEmail: currentStudent.email,
            clinic: currentStudent.clinic,
          }),
        })

        // Refresh meeting requests
        const meetingRes = await fetch(`/api/meeting-requests?studentId=${currentStudent.id}`)
        const meetingData = await safeJsonParse(meetingRes, { requests: [] }) // Use safeJsonParse
        setMeetingRequests(meetingData.requests || [])

        // Reset form
        setMeetingSubject("")
        setMeetingMessage("")
        setPreferredDates(["", "", ""])
        alert("Meeting request sent successfully! Your director will respond soon.")
      } else {
        alert("Failed to send meeting request. Please try again.")
      }
    } catch (error) {
      console.error("Error submitting meeting request:", error)
      alert("An error occurred. Please try again.")
    } finally {
      setSubmittingMeeting(false)
    }
  }

  const handleSubmitAttendance = async () => {
    if (!attendancePassword.trim() || !selectedWeekForAttendance || !currentStudent) return

    setSubmittingAttendance(true)
    try {
      const selectedWeek = semesterSchedule.find((w) => w.id === selectedWeekForAttendance)
      if (!selectedWeek) return

      const attendancePayload = {
        studentId: currentStudent.id,
        studentName: currentStudent.fullName,
        studentEmail: currentStudent.email,
        clinic: currentStudent.clinic,
        weekNumber: selectedWeek.week_number,
        weekEnding: selectedWeek.week_end,
        classDate: selectedWeek.week_start,
        password: attendancePassword,
      }

      const response = await fetch("/api/supabase/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(attendancePayload),
      })

      if (response.ok) {
        // Refresh attendance records
        const attendanceRes = await fetch(`/api/supabase/attendance?studentId=${currentStudent.id}`)
        const attendanceData = await safeJsonParse(attendanceRes, { attendance: [] })
        setAttendanceRecords(attendanceData.attendance || [])

        // Reset form
        setAttendancePassword("")
        setSelectedWeekForAttendance("")
        // Close the dialog if it was open
        // This logic might need to be triggered from the component that opens the dialog.
        // For now, assume the Dialog component handles closing itself after successful submission.
      } else {
        const error = await response.json()
        alert(error.error || "Invalid password or attendance already submitted")
      }
    } catch (error) {
      console.error("Error submitting attendance:", error)
    } finally {
      setSubmittingAttendance(false)
    }
  }

  const handleSubmitDebrief = async () => {
    if (!selectedWeekForDebrief || !debriefForm.hoursWorked || !debriefForm.workSummary || !currentStudent) return

    setSubmittingDebrief(true)
    try {
      const selectedWeek = semesterSchedule.find((w) => w.id === selectedWeekForDebrief)
      if (!selectedWeek) throw new Error("Week not found")

      const response = await fetch("/api/supabase/debriefs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: currentStudent.id,
          studentName: currentStudent.fullName,
          studentEmail: currentStudent.email,
          clientId: currentStudent.clientId,
          clientName: currentStudent.clientName,
          clinic: currentStudent.clinic,
          clinicId: currentStudent.clinicId,
          weekEnding: selectedWeek.week_end,
          weekNumber: selectedWeek.week_number,
          hoursWorked: Number.parseFloat(debriefForm.hoursWorked),
          workSummary: debriefForm.workSummary,
          questions: debriefForm.questions || null,
          questionType: debriefForm.questions ? "clinic" : null,
          status: "pending",
        }),
      })

      if (!response.ok) throw new Error("Failed to submit debrief")

      // Refresh debriefs
      const debriefRes = await fetch(`/api/supabase/debriefs?studentId=${currentStudent.id}`)
      if (debriefRes.ok) {
        const data = await safeJsonParse(debriefRes, { debriefs: [] }) // Use safeJsonParse
        setDebriefs(data.debriefs || [])
      }

      setShowDebriefDialog(false)
      setDebriefForm({ hoursWorked: "", workSummary: "", questions: "" })
      setSelectedWeekForDebrief("")
    } catch (error) {
      console.error("Error submitting debrief:", error)
    } finally {
      setSubmittingDebrief(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Keep this function
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    // Keep this function
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    // Keep this function
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0])
    }
  }

  const handleUploadFile = async () => {
    // Keep this function
    if (!selectedFile) return

    const MAX_FILE_SIZE = 50 * 1024 * 1024
    if (selectedFile.size > MAX_FILE_SIZE) {
      alert(`File size exceeds 50MB limit. Please choose a smaller file.`)
      setSelectedFile(null)
      return
    }

    setUploading(true)
    try {
      const newBlob = await upload(selectedFile.name, selectedFile, {
        access: "public",
        handleUploadUrl: "/api/upload",
      })

      setUploadedFileUrl(newBlob.url)
    } catch (error: any) {
      console.error("Upload error:", error)
      alert(error?.message || "An error occurred while uploading. Please try again.")
      setSelectedFile(null)
      setUploadedFileUrl("")
    } finally {
      setUploading(false)
    }
  }

  const handleSubmitDocument = async () => {
    // Keep this function
    if (!documentDescription.trim() || !documentClient.trim() || !currentStudent) {
      alert("Please fill in all fields")
      return
    }

    if (selectedFile && !uploadedFileUrl) {
      await handleUploadFile()
      // After upload, re-trigger this function to submit the document metadata
      // using the uploadedFileUrl. A simple way is to await handleUploadFile() and then call this again,
      // but it's better to structure it to avoid redundant calls.
      // For now, assuming handleUploadFile will set uploadedFileUrl, and this function will be called again
      // or the logic is slightly adjusted.
      // A more robust way:
      if (!uploadedFileUrl) {
        // If handleUploadFile didn't set it (e.g., due to an error that didn't break the flow but failed upload)
        alert("Upload failed. Please try again.")
        return
      }
    }

    if (!uploadedFileUrl) {
      alert("Please upload a file")
      return
    }

    setSubmittingDocument(true)
    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: currentStudent.id,
          studentName: currentStudent.fullName,
          studentEmail: currentStudent.email,
          clientName: documentClient,
          fileUrl: uploadedFileUrl,
          fileName: selectedFile?.name || "document",
          description: documentDescription,
          clinic: currentStudent.clinic,
          submissionType: submissionType,
        }),
      })

      if (response.ok) {
        setDocumentDescription("")
        setDocumentClient("")
        setSelectedFile(null)
        setUploadedFileUrl("")
        alert("Document submitted successfully! Your director will review it soon.")
      } else {
        alert("Failed to submit document. Please try again.")
      }
    } catch (error) {
      console.error("Error submitting document:", error)
      alert("An error occurred. Please try again.")
    } finally {
      setSubmittingDocument(false)
    }
  }

  useEffect(() => {
    // Keep this useEffect
    if (selectedFile && !uploadedFileUrl && !uploading) {
      handleUploadFile()
    }
  }, [selectedFile, uploadedFileUrl, uploading]) // Added dependencies for clarity

  const handleDeliverableUpload = async (deliverableType: string, file: File) => {
    if (!currentStudent || !file) return

    setUploadingDeliverable(deliverableType)
    try {
      // Upload to Vercel Blob
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/upload-blob",
      })

      // Save metadata to Supabase
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileUrl: blob.url,
          fileType: file.type,
          studentId: currentStudent.id,
          studentName: currentStudent.fullName,
          clientId: currentStudent.clientId,
          clientName: currentStudent.clientName,
          clinic: currentStudent.clinic,
          submissionType: deliverableType,
          description: `${DELIVERABLE_INSTRUCTIONS[deliverableType as keyof typeof DELIVERABLE_INSTRUCTIONS]?.title} submission`,
        }),
      })

      if (response.ok) {
        const newDoc = await response.json()
        setDeliverableDocuments((prev) => [
          ...prev,
          {
            id: newDoc.id,
            fileName: file.name,
            fileUrl: blob.url,
            submissionType: deliverableType,
            uploadedAt: new Date().toISOString(),
            status: "submitted",
          },
        ])
      }
    } catch (error) {
      console.error("Error uploading deliverable:", error)
    } finally {
      setUploadingDeliverable(null)
    }
  }

  const getDeliverableStatus = (type: string) => {
    // First check for team grades from evaluations
    const teamGrade = teamGrades.find((g) => g.deliverableType === type)
    if (teamGrade) {
      return {
        status: "graded",
        label: `Graded: ${teamGrade.grade}%`,
        color: "bg-green-100 text-green-700",
        grade: teamGrade.grade,
        feedback: teamGrade.feedback,
      }
    }

    // Then check documents
    const docs = deliverableDocuments.filter((d) => d.submissionType === type)
    if (docs.length === 0) return { status: "pending", label: "Not Submitted", color: "bg-slate-100 text-slate-600" }
    const latestDoc = docs.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())[0]
    if (latestDoc.status === "graded")
      return {
        status: "graded",
        label: `Graded: ${latestDoc.grade}%`,
        color: "bg-green-100 text-green-700",
        grade: latestDoc.grade,
        feedback: latestDoc.feedback,
      }
    return { status: "submitted", label: "Submitted", color: "bg-blue-100 text-blue-700" }
  }

  const totalHours = debriefs.reduce((sum, d) => sum + d.hoursWorked, 0)
  // Only count attendance records where is_present is true (for individual student)
  const totalAttendance = attendanceRecords.filter((r) => r.is_present).length
  // Count submitted and reviewed debriefs as completed
  const completedDebriefs = debriefs.filter((d) => d.status === "submitted" || d.status === "reviewed").length
  const pendingDebriefs = debriefs.filter((d) => d.status === "pending" || d.status === "draft").length

  // Class-wide attendance: find current week and count present students
  const currentWeek = semesterSchedule.find((w) => {
    const now = new Date()
    return new Date(w.week_start) <= now && new Date(w.week_end) >= now
  })
  const currentWeekNumber = currentWeek ? Number(currentWeek.week_number) : null
  const studentsPresent = currentWeekNumber !== null
    ? new Set(classAttendanceRecords.filter((r) => Number(r.weekNumber) === currentWeekNumber && r.is_present).map((r) => r.studentId)).size
    : 0

  const getWeekEndingDate = () => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    // Calculate days until Friday (day 5)
    // If today is Friday (5), daysUntilFriday = 0
    // If today is Saturday (6), daysUntilFriday = 5 - 6 + 7 = 6 days until next Friday
    // If today is Sunday (0), daysUntilFriday = 5 - 0 = 5 days until next Friday
    const daysUntilFriday = dayOfWeek <= 5 ? 5 - dayOfWeek : 5 + (7 - dayOfWeek)
    const friday = new Date(today)
    friday.setDate(today.getDate() + daysUntilFriday)
    return friday.toISOString().split("T")[0]
  }

  const currentWeekEnding = getWeekEndingDate()
  const hasSubmittedThisWeek = debriefs.some((d) => {
    const debriefWeek = new Date(d.weekEnding).toISOString().split("T")[0]
    return debriefWeek === currentWeekEnding
  })

  const lastWeekEnding = (() => {
    const friday = new Date(currentWeekEnding)
    friday.setDate(friday.getDate() - 7)
    return friday.toISOString().split("T")[0]
  })()
  const hasSubmittedLastWeek = debriefs.some((d) => {
    const debriefWeek = new Date(d.weekEnding).toISOString().split("T")[0]
    return debriefWeek === lastWeekEnding
  })

  const generateTeamSummary = async () => {
    if (!currentStudent?.clientId) return
    setLoadingTeamSummary(true)
    setTeamSummaryError(null)
    try {
      const response = await fetch("/api/teams/generate-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: currentStudent.clientId,
          studentId: currentStudent.id, // Pass studentId to ensure context
        }),
      })

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const data = await safeJsonParse(response, { summary: "" })
      setTeamSummary(data.summary)
    } catch (error: any) {
      console.error("Error generating team summary:", error)
      setTeamSummaryError(error.message || "Failed to generate team summary.")
      setTeamSummary("")
    } finally {
      setLoadingTeamSummary(false)
    }
  }

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen bg-background">
        <aside className="fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-52 border-r bg-card z-40">
          <MainNavigation />
        </aside>
        <div className="pl-52 pt-14">
          <div className="p-4">
            <Card className="p-8 text-center">
              <p className="text-slate-500">Loading your portal...</p>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // For directors/admins waiting for student list to load, show a helpful message
  if (!currentStudent && isAdminOrDirector && availableStudents.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <aside className="fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-52 border-r bg-card z-40">
          <MainNavigation />
        </aside>
        <div className="pl-52 pt-14">
          <div className="p-4">
            <Card className="p-8 text-center">
              <p className="text-slate-500">Loading student list...</p>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // For directors with students available but none selected yet
  if (!currentStudent && isAdminOrDirector && availableStudents.length > 0 && !selectedStudentId) {
    return (
      <div className="min-h-screen bg-background">
        <aside className="fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-52 border-r bg-card z-40">
          <MainNavigation />
        </aside>
        <div className="pl-52 pt-14">
          <div className="p-4">
            <Card className="p-6 text-center">
              <h2 className="text-xl font-semibold mb-2">Select a Student</h2>
              <p className="text-muted-foreground mb-4">Choose a student to view their portal.</p>
              <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                <SelectTrigger className="w-[280px] mx-auto">
                  <SelectValue placeholder="Select a student..." />
                </SelectTrigger>
                <SelectContent>
                  {availableStudents.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (!currentStudent) {
    return (
      <div className="min-h-screen bg-background">
        <aside className="fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-52 border-r bg-card z-40">
          <MainNavigation />
        </aside>
        <div className="pl-52 pt-14">
          <div className="p-4">
            <Card className="p-6 text-center">
              <h2 className="text-xl font-semibold mb-2">Student Not Found</h2>
              <p className="text-muted-foreground mb-4">Unable to load your student profile.</p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => window.location.reload()} variant="outline">
                  Retry
                </Button>
                {!isAuthenticated && (
                  <Button onClick={() => router.push("/sign-in")}>
                    Go to Sign In
                  </Button>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <aside className="fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-52 border-r bg-card z-40">
        <MainNavigation />
      </aside>

      <div className="pl-52 pt-14">
        {/* Updated padding from px-6 py-6 to p-4 */}
        <div className="p-4">
          {canSwitchStudents && availableStudents.length > 0 && (
            <div className="mb-4 flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <Eye className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-blue-800 font-medium">Viewing as Director/Admin</p>
                <p className="text-xs text-blue-600">Select a student to view their portal</p>
              </div>
              <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                <SelectTrigger className="w-[280px] bg-white">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">
                      {availableStudents.find((s) => s.id === selectedStudentId)?.full_name || "Select a student"}
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {availableStudents.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Header */}
          <StudentPortalHeader
            loading={loading}
            currentStudent={currentStudent}
            totalHours={totalHours}
            totalAttendance={totalAttendance}
            studentsPresent={studentsPresent}
            totalStudentCount={totalStudentCount}
            currentWeekNumber={currentWeekNumber}
          />

          {/* Quick Stats - Now Expandable with Semester Schedule */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Hours Logged Card - Expandable */}
            <Collapsible
              open={expandedStats.hours}
              onOpenChange={(open) => setExpandedStats((prev) => ({ ...prev, hours: open }))}
            >
              <Card className="border-blue-200 bg-white overflow-hidden">
                <CollapsibleTrigger asChild>
                  <div className="p-4 cursor-pointer hover:bg-blue-50/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-100">
                          <Clock className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Hours Logged</p>
                          <p className="text-xl font-bold text-slate-900">{totalHours.toFixed(1)}</p>
                        </div>
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 text-slate-400 transition-transform ${expandedStats.hours ? "rotate-180" : ""}`}
                      />
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 pb-4 border-t border-blue-100">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mt-3 mb-2">
                      Semester Schedule - Hours by Week
                    </p>
                    <div className="space-y-2 max-h-72 overflow-y-auto">
                      {semesterSchedule.length > 0 ? (
                        semesterSchedule
                          .sort((a, b) => Number(a.week_number) - Number(b.week_number)) // Ensure numeric sort
                          .map((week) => {
                            const weekDebrief = debriefs.find((d) => d.weekNumber === Number(week.week_number)) // Compare numbers
                            const hasHours = !!weekDebrief
                            const isPast = new Date(week.week_end) < new Date()

                            return (
                              <div
                                key={week.id}
                                className={`flex items-center justify-between p-2 rounded-lg ${
                                  week.is_break
                                    ? "bg-slate-100 opacity-60"
                                    : hasHours
                                      ? "bg-blue-50 border border-blue-200"
                                      : isPast
                                        ? "bg-red-50 border border-red-200"
                                        : "bg-slate-50 border border-slate-200"
                                }`}
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium text-slate-700">
                                      Week {week.week_number}
                                      {week.is_break && <span className="text-slate-500 ml-1">(Break)</span>}
                                    </p>
                                    {!hasHours && isPast && !week.is_break && (
                                      <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-500">
                                    {new Date(week.week_start).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                    })}{" "}
                                    -{" "}
                                    {new Date(week.week_end).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </p>
                                  {week.session_focus && (
                                    <p className="text-xs text-slate-400 truncate">{week.session_focus}</p>
                                  )}
                                </div>
                                <div className="text-right">
                                  {week.is_break ? (
                                    <Badge variant="outline" className="text-slate-400">
                                      N/A
                                    </Badge>
                                  ) : hasHours ? (
                                    <Badge className="bg-blue-100 text-blue-700">{weekDebrief?.hoursWorked} hrs</Badge>
                                  ) : isPast ? (
                                    <Badge variant="outline" className="text-red-500 border-red-300">
                                      Missing
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-slate-400">
                                      Upcoming
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )
                          })
                      ) : (
                        <p className="text-sm text-slate-500 text-center py-2">Loading schedule...</p>
                      )}
                    </div>
                    <div className="mt-3 pt-3 border-t border-blue-100 flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-600">Total Hours</span>
                      <span className="text-lg font-bold text-blue-600">{totalHours.toFixed(1)}</span>
                    </div>
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Completed Debriefs Card - Expandable */}
            <Collapsible
              open={expandedStats.debriefs}
              onOpenChange={(open) => setExpandedStats((prev) => ({ ...prev, debriefs: open }))}
            >
              <Card className="border-green-200 bg-white overflow-hidden">
                <CollapsibleTrigger asChild>
                  <div className="p-4 cursor-pointer hover:bg-green-50/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-100">
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Completed Debriefs</p>
                          <p className="text-xl font-bold text-slate-900">{completedDebriefs}</p>
                        </div>
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 text-slate-400 transition-transform ${expandedStats.debriefs ? "rotate-180" : ""}`}
                      />
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 pb-4 border-t border-green-100">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mt-3 mb-2">
                      Semester Schedule - Debriefs by Week
                    </p>
                    <div className="space-y-2 max-h-72 overflow-y-auto">
                      {semesterSchedule.length > 0 ? (
                        semesterSchedule
                          .sort((a, b) => Number(a.week_number) - Number(b.week_number)) // Ensure numeric sort
                          .map((week) => {
                            const weekDebrief = debriefs.find((d) => d.weekNumber === Number(week.week_number)) // Compare numbers
                            const hasDebrief = !!weekDebrief
                            const isReviewed = weekDebrief?.status === "reviewed"
                            const isPending = weekDebrief?.status === "pending"
                            const isPast = new Date(week.week_end) < new Date()

                            return (
                              <div
                                key={week.id}
                                className={`p-2 rounded-lg ${
                                  week.is_break
                                    ? "bg-slate-100 opacity-60"
                                    : isReviewed
                                      ? "bg-green-50 border border-green-200"
                                      : isPending
                                        ? "bg-amber-50 border border-amber-200"
                                        : isPast && !hasDebrief
                                          ? "bg-red-50 border border-red-200"
                                          : "bg-slate-50 border border-slate-200"
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium text-slate-700">
                                      Week {week.week_number}
                                      {week.is_break && <span className="text-slate-500 ml-1">(Break)</span>}
                                    </p>
                                    {isReviewed && <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />}
                                    {isPending && <Clock className="h-3.5 w-3.5 text-amber-600" />}
                                    {!hasDebrief && isPast && !week.is_break && (
                                      <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                                    )}
                                  </div>
                                  {week.is_break ? (
                                    <Badge variant="outline" className="text-slate-400 text-xs">
                                      N/A
                                    </Badge>
                                  ) : isReviewed ? (
                                    <Badge className="bg-green-100 text-green-700 text-xs">Reviewed</Badge>
                                  ) : isPending ? (
                                    <Badge className="bg-amber-100 text-amber-700 text-xs">Pending</Badge>
                                  ) : isPast ? (
                                    <Badge variant="outline" className="text-red-500 border-red-300 text-xs">
                                      Missing
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-slate-400 text-xs">
                                      Upcoming
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-slate-500">
                                  {new Date(week.week_start).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                  })}{" "}
                                  -{" "}
                                  {new Date(week.week_end).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </p>
                                {hasDebrief && (
                                  <p className="text-xs text-slate-600 line-clamp-1 mt-1">{weekDebrief.workSummary}</p>
                                )}
                              </div>
                            )
                          })
                      ) : (
                        <p className="text-sm text-slate-500 text-center py-2">Loading schedule...</p>
                      )}
                    </div>
                    <div className="mt-3 pt-3 border-t border-green-100 flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-600">Completed</span>
                      <span className="text-lg font-bold text-green-600">
                        {completedDebriefs}/
                        {totalAttendance > 0 ? semesterSchedule.filter((w) => !w.is_break).length : 0}
                      </span>
                    </div>
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Pending Debriefs Card - Expandable */}
            <Collapsible
              open={expandedStats.pending}
              onOpenChange={(open) => setExpandedStats((prev) => ({ ...prev, pending: open }))}
            >
              <Card className="border-amber-200 bg-white overflow-hidden">
                <CollapsibleTrigger asChild>
                  <div className="p-4 cursor-pointer hover:bg-amber-50/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-100">
                          <FileText className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Pending Debriefs</p>
                          <p className="text-xl font-bold text-slate-900">{pendingDebriefs}</p>
                        </div>
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 text-slate-400 transition-transform ${expandedStats.pending ? "rotate-180" : ""}`}
                      />
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 pb-4 border-t border-amber-100">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mt-3 mb-2">
                      Awaiting Review & Missing Submissions
                    </p>
                    <div className="space-y-2 max-h-72 overflow-y-auto">
                      {semesterSchedule.length > 0 ? (
                        semesterSchedule
                          .filter((week) => !week.is_break)
                          .sort((a, b) => Number(a.week_number) - Number(b.week_number)) // Ensure numeric sort
                          .map((week) => {
                            const weekDebrief = debriefs.find((d) => d.weekNumber === Number(week.week_number)) // Compare numbers
                            const isPending = weekDebrief?.status === "pending"
                            const isReviewed = weekDebrief?.status === "reviewed"
                            const isPast = new Date(week.week_end) < new Date()
                            const isMissing = !weekDebrief && isPast

                            if (!isPending && !isMissing) return null

                            return (
                              <div
                                key={week.id}
                                className={`p-2 rounded-lg ${
                                  isPending ? "bg-amber-50 border border-amber-200" : "bg-red-50 border border-red-200"
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium text-slate-700">Week {week.week_number}</p>
                                    {isPending && <Clock className="h-3.5 w-3.5 text-amber-600" />}
                                    {!isPending && !isReviewed && !week.is_break && (
                                      <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                                    )}
                                  </div>
                                  {isPending ? (
                                    <Badge className="bg-amber-100 text-amber-700 text-xs">Pending Review</Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-red-500 border-red-300 text-xs">
                                      Not Submitted
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-slate-500">
                                  {new Date(week.week_start).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                  })}{" "}
                                  -{" "}
                                  {new Date(week.week_end).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </p>
                                {isPending && weekDebrief && (
                                  <>
                                    <p className="text-xs text-slate-600 line-clamp-1 mt-1">
                                      {weekDebrief.workSummary}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                      {weekDebrief.hoursWorked} hours - {weekDebrief.clientName}
                                    </p>
                                  </>
                                )}
                                {!isPending && isMissing && week.session_focus && (
                                  <p className="text-xs text-slate-400 mt-1">{week.session_focus}</p>
                                )}
                              </div>
                            )
                          })
                          .filter(Boolean)
                      ) : (
                        <p className="text-sm text-slate-500 text-center py-2">Loading schedule...</p>
                      )}
                    </div>
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Classes Attended Card - Expandable */}
            <Collapsible
              open={expandedStats.attendance}
              onOpenChange={(open) => setExpandedStats((prev) => ({ ...prev, attendance: open }))}
            >
              <Card className="border-purple-200 bg-white overflow-hidden">
                <CollapsibleTrigger asChild>
                  <div className="p-4 cursor-pointer hover:bg-purple-50/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-100">
                          <Calendar className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">
                            {currentWeekNumber !== null ? `Week ${currentWeekNumber} Attendance` : "Class Attendance"}
                          </p>
                          <p className="text-xl font-bold text-slate-900">
                            {studentsPresent}/{totalStudentCount}
                          </p>
                        </div>
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 text-slate-400 transition-transform ${expandedStats.attendance ? "rotate-180" : ""}`}
                      />
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 pb-4 border-t border-purple-100">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mt-3 mb-2">
                      Semester Schedule - Attendance by Week
                    </p>
                    <div className="space-y-2 max-h-72 overflow-y-auto">
                      {semesterSchedule.length > 0 ? (
                        semesterSchedule
                          .sort((a, b) => Number(a.week_number) - Number(b.week_number)) // Ensure numeric sort
                          .map((week) => {
                            const weekAttendance = attendanceRecords.find(
                              (a) => a.weekNumber === Number(week.week_number),
                            ) // Compare numbers
                            const hasAttendance = !!weekAttendance
                            const isPast = new Date(week.week_end) < new Date()

                            return (
                              <div
                                key={week.id}
                                className={`flex items-center justify-between p-2 rounded-lg ${
                                  week.is_break
                                    ? "bg-slate-100 opacity-60"
                                    : hasAttendance
                                      ? "bg-purple-50 border border-purple-200"
                                      : isPast
                                        ? "bg-red-50 border border-red-200"
                                        : "bg-slate-50 border border-slate-200"
                                }`}
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium text-slate-700">
                                      Week {week.week_number}
                                      {week.is_break && <span className="text-slate-500 ml-1">(Break)</span>}
                                    </p>
                                    {!hasAttendance && isPast && !week.is_break && (
                                      <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-500">
                                    {new Date(week.week_start).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                    })}{" "}
                                    -{" "}
                                    {new Date(week.week_end).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </p>
                                  {week.session_focus && (
                                    <p className="text-xs text-slate-400 truncate">{week.session_focus}</p>
                                  )}
                                </div>
                                <div className="text-right">
                                  {week.is_break ? (
                                    <Badge variant="outline" className="text-slate-400">
                                      N/A
                                    </Badge>
                                  ) : hasAttendance ? (
                                    <Badge className="bg-purple-100 text-purple-700">
                                      <CheckCircle2 className="h-3 w-3 mr-1" />
                                      Present
                                    </Badge>
                                  ) : isPast ? (
                                    <Badge variant="outline" className="text-red-500 border-red-300">
                                      Missing
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-slate-400">
                                      Upcoming
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )
                          })
                      ) : (
                        <p className="text-sm text-slate-500 text-center py-2">Loading schedule...</p>
                      )}
                    </div>
                    <div className="mt-3 pt-3 border-t border-purple-100 flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-600">
                        {currentWeekNumber !== null ? `Week ${currentWeekNumber} Attendance` : "Current Attendance"}
                      </span>
                      <span className="text-lg font-bold text-purple-600">
                        {studentsPresent}/{totalStudentCount}
                      </span>
                    </div>
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </div>

          {/* Main Content Tabs */}
          <Tabs value={mainTab} onValueChange={setMainTab} className="space-y-6">
            <TabsList className="flex flex-wrap gap-1 h-auto p-1 bg-slate-100/80">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="attendance" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Attendance & Debriefs
              </TabsTrigger>
              <TabsTrigger value="questions" className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                Questions & Meetings
              </TabsTrigger>
              <TabsContent value="client-service" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Client Service
              </TabsContent>
              <TabsTrigger value="clinic" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                My Clinic
              </TabsTrigger>
            </TabsList>

            {/* Dashboard Tab - Reminders & Notifications */}
            <TabsContent value="dashboard" className="space-y-6">
              {/* CHANGE: Added grid layout for Triage, Quick Actions, and new Status Summary card */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Triage Card - Takes 2 columns */}
                <div className="lg:col-span-2">
                  <Triage
                    userType="student"
                    userName={currentStudent?.fullName || ""}
                    userEmail={currentStudent?.email || ""}
                    userId={currentStudent?.id}
                    clinicId={currentStudent?.clinicId}
                    debriefs={debriefs}
                    meetingRequests={meetingRequests}
                    recentCourseMaterials={recentCourseMaterials}
                    studentNotifications={studentNotifications}
                    hasSubmittedThisWeek={hasSubmittedThisWeek}
                    hasSubmittedLastWeek={hasSubmittedLastWeek}
                    currentWeekEnding={currentWeekEnding}
                    lastWeekEnding={lastWeekEnding}
                    onNavigate={(tab) => {
                      setMainTab(tab)
                    }}
                    onDismissNotification={async (notificationId) => {
                      try {
                        await fetch(`/api/notifications/${notificationId}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ is_read: true }),
                        })
                      } catch (e) {
                        // Dismissal is best-effort
                      }
                    }}
                  />
                </div>

                {/* Right column - Status Summary */}
                <div className="space-y-4">
                  {/* CHANGE: Added My Team Status Card */}
                  <Card className="border-l-4 border-l-[#878568]">
                    <CardHeader className="pb-2 pt-3 px-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                          <UsersRound className="h-4 w-4 text-[#878568]" />
                          My Team's Status
                        </CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs text-[#505143] hover:text-[#505143]/80 p-0"
                          onClick={() => router.push(`/my-team?studentId=${selectedStudentId || authStudentId}`)}
                        >
                          View Team <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-3 space-y-3">
                      {/* Team Members Summary */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Team Members</span>
                        <span className="font-semibold text-[#505143]">
                          {teamData?.teamMembers?.length || 0} students
                        </span>
                      </div>

                      {/* This Week's Debriefs */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Debriefs This Week</span>
                        <span className="font-semibold text-[#505143]">
                          {teamData?.debriefs?.filter((d: any) => {
                            const now = new Date()
                            const startOfWeek = new Date(now)
                            startOfWeek.setDate(now.getDate() - now.getDay())
                            startOfWeek.setHours(0, 0, 0, 0)
                            const debriefDate = new Date(d.createdAt || d.created_at || d.date)
                            return debriefDate >= startOfWeek
                          }).length || 0}{" "}
                          submitted
                        </span>
                      </div>

                      {/* AI Summary Section */}
                      <div className="pt-2 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                            <Sparkles className="h-3 w-3 text-amber-500" />
                            Weekly Progress Summary
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 text-[10px] text-[#878568] hover:text-[#505143] p-0"
                            onClick={generateTeamSummary}
                            disabled={loadingTeamSummary}
                          >
                            {loadingTeamSummary ? (
                              <RefreshCw className="h-3 w-3 animate-spin" />
                            ) : (
                              <>
                                Generate <Sparkles className="h-2.5 w-2.5 ml-1" />
                              </>
                            )}
                          </Button>
                        </div>

                        {teamSummaryError && <p className="text-[10px] text-red-500 mb-2">{teamSummaryError}</p>}

                        {teamSummary ? (
                          <div className="p-2 rounded-md bg-[#D5CCAB]/20 max-h-[80px] overflow-y-auto">
                            <p className="text-[11px] text-gray-700 leading-relaxed">{teamSummary}</p>
                          </div>
                        ) : !loadingTeamSummary && !teamSummaryError ? (
                          <p className="text-[10px] text-gray-400 italic">
                            Click "Generate" to create an AI summary of your team's weekly progress
                          </p>
                        ) : null}

                        {loadingTeamSummary && (
                          <div className="flex items-center justify-center p-3">
                            <RefreshCw className="h-4 w-4 animate-spin text-[#878568]" />
                            <span className="text-[10px] text-gray-500 ml-2">Generating summary...</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Status Summary Card */}
                  <Card className="border-l-4 border-l-[#505143]">
                    <CardHeader className="pb-2 pt-3 px-4">
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Award className="h-4 w-4 text-[#505143]" />
                        My Progress
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-3 space-y-3">
                      {/* This Week Status */}
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">This Week</p>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center gap-2 p-2 rounded-md bg-gray-50">
                            <div
                              className={`p-1.5 rounded-full ${hasSubmittedThisWeek ? "bg-green-100" : "bg-amber-100"}`}
                            >
                              <FileText
                                className={`h-3.5 w-3.5 ${hasSubmittedThisWeek ? "text-green-600" : "text-amber-600"}`}
                              />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Debrief</p>
                              <p
                                className={`text-xs font-semibold ${hasSubmittedThisWeek ? "text-green-600" : "text-amber-600"}`}
                              >
                                {hasSubmittedThisWeek ? "Submitted" : "Pending"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 p-2 rounded-md bg-gray-50">
                            <div
                              className={`p-1.5 rounded-full ${(currentStudent?.attendanceCount || 0) > 0 ? "bg-green-100" : "bg-amber-100"}`}
                            >
                              <UserCheck
                                className={`h-3.5 w-3.5 ${(currentStudent?.attendanceCount || 0) > 0 ? "text-green-600" : "text-amber-600"}`}
                              />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Attendance</p>
                              <p
                                className={`text-xs font-semibold ${(currentStudent?.attendanceCount || 0) > 0 ? "text-green-600" : "text-amber-600"}`}
                              >
                                {(currentStudent?.attendanceCount || 0) > 0 ? "Checked In" : "Pending"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Accumulated Stats */}
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Semester Total</p>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="text-center p-2 rounded-md bg-[#D5CCAB]/30">
                            <p className="text-lg font-bold text-[#505143]">{currentStudent?.totalHours || 0}</p>
                            <p className="text-[10px] text-gray-500">Hours</p>
                          </div>
                          <div className="text-center p-2 rounded-md bg-[#A3A289]/20">
                            <p className="text-lg font-bold text-[#505143]">{debriefs?.length || 0}</p>
                            <p className="text-[10px] text-gray-500">Debriefs</p>
                          </div>
                          <div className="text-center p-2 rounded-md bg-[#878568]/20">
                            <p className="text-lg font-bold text-[#505143]">{currentStudent?.attendanceCount || 0}</p>
                            <p className="text-[10px] text-gray-500">Attendance</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Compact Quick Actions */}
                  <Card>
                    <CardHeader className="pb-2 pt-3 px-4">
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-slate-600" />
                        Quick Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-3">
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-auto py-2 flex flex-col items-center gap-1 bg-purple-50/50 border-purple-200 hover:bg-purple-100 text-xs"
                          onClick={() => setMainTab("attendance")}
                        >
                          <UserCheck className="h-4 w-4 text-purple-600" />
                          <span className="font-medium">Attendance</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-auto py-2 flex flex-col items-center gap-1 bg-blue-50/50 border-blue-200 hover:bg-blue-100 text-xs"
                          onClick={() => {
                            // Auto-select the current week for debrief
                            const currentWeek = semesterSchedule.find((w) => {
                              const start = new Date(w.week_start)
                              const end = new Date(w.week_end)
                              const now = new Date()
                              return start <= now && end >= now && !w.is_break
                            })
                            if (currentWeek) {
                              setSelectedWeekForDebrief(currentWeek.id)
                              const existingDebrief = debriefs.find(
                                (d) => d.weekNumber === Number(currentWeek.week_number),
                              )
                              setDebriefForm({
                                hoursWorked: existingDebrief?.hoursWorked?.toString() || "",
                                workSummary: existingDebrief?.workSummary || "",
                                questions: existingDebrief?.questions || "",
                              })
                            }
                            setShowDebriefDialog(true)
                          }}
                        >
                          <FileText className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">Debrief</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-auto py-2 flex flex-col items-center gap-1 bg-amber-50/50 border-amber-200 hover:bg-amber-100 text-xs"
                          onClick={() => setMainTab("questions")}
                        >
                          <HelpCircle className="h-4 w-4 text-amber-600" />
                          <span className="font-medium">Ask Question</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-auto py-2 flex flex-col items-center gap-1 bg-green-50/50 border-green-200 hover:bg-green-100 text-xs"
                          onClick={() => router.push(`/my-team?studentId=${selectedStudentId || authStudentId}`)}
                        >
                          <Users className="h-4 w-4 text-green-600" />
                          <span className="font-medium">My Team</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Program Info - kept but made more compact */}
              <Card className="bg-gradient-to-r from-slate-50 to-blue-50 border-slate-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm">Your Assignment</h3>
                      <p className="text-xs text-slate-600 mt-1">
                        <span className="font-medium">{currentStudent?.clinic || "Business Clinic"}</span>
                        {currentStudent?.clientName && (
                          <span>
                            {" "}
                            • Working with <span className="font-medium">{currentStudent.clientName}</span>
                          </span>
                        )}
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-white text-xs">
                      {currentStudent?.semester || "Spring 2026"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* attendance & Debriefs Tab - Merged Content */}
            <TabsContent value="attendance">
              <div className="space-y-6">
                {/* Grading Info Card */}
                <Card className="border-blue-200 bg-blue-50/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-blue-800 flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Attendance & Participation (15% of Grade)
                    </CardTitle>
                    <CardDescription className="text-blue-700">
                      Attendance and participation with Instructors and guest speakers. Submit attendance using the
                      class password and complete your weekly debrief form each week.
                    </CardDescription>
                  </CardHeader>
                </Card>

                {/* Progress Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-green-200 bg-green-50/50">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-green-700">
                            {currentWeekNumber !== null ? `Week ${currentWeekNumber} Attendance` : "Class Attendance"}
                          </p>
                          <p className="text-2xl font-bold text-green-800">
                            {studentsPresent}/{totalStudentCount}
                          </p>
                        </div>
                        <UserCheck className="h-8 w-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-blue-200 bg-blue-50/50">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-blue-700">Debriefs Submitted</p>
                          <p className="text-2xl font-bold text-blue-800">
                            {debriefs.length}/{semesterSchedule.filter((w) => !w.is_break).length}
                          </p>
                        </div>
                        <FileText className="h-8 w-8 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-purple-200 bg-purple-50/50">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-purple-700">Total Hours Logged</p>
                          <p className="text-2xl font-bold text-purple-800">{totalHours.toFixed(1)}</p>
                        </div>
                        <Clock className="h-8 w-8 text-purple-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Semester Schedule with Action Buttons */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CalendarClock className="h-5 w-5" />
                      Semester Schedule
                    </CardTitle>
                    <CardDescription>
                      Submit attendance and debriefs for each week. Both are required for participation grade.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {semesterSchedule.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-8">No schedule data available</p>
                      ) : (
                        semesterSchedule
                          .sort((a, b) => Number(a.week_number) - Number(b.week_number)) // Ensure numeric sort
                          .map((week) => {
                            const hasAttendance = attendanceRecords.some(
                              (r) => r.weekNumber === Number(week.week_number),
                            ) // Compare numbers
                            const attendanceRecord = attendanceRecords.find(
                              (r) => r.weekNumber === Number(week.week_number),
                            )
                            const weekDebrief = debriefs.find((d) => {
                              const debriefWeekNumber = d.weekNumber
                              return debriefWeekNumber === Number(week.week_number) // Compare numbers
                            })
                            const hasDebrief = !!weekDebrief
                            const isPast = new Date(week.week_end) < new Date()
                            const isCurrent =
                              new Date(week.week_start) <= new Date() && new Date(week.week_end) >= new Date()
                            
                            // Attendance is available for the entire current week (from week_start through week_end)
                            const canSubmitAttendance = isCurrent && !hasAttendance

                            return (
                              <div
                                key={week.id}
                                className={`p-4 rounded-lg border transition-all ${
                                  week.is_break
                                    ? "bg-amber-50 border-amber-200"
                                    : isCurrent
                                      ? "bg-blue-50 border-blue-300 ring-2 ring-blue-200"
                                      : isPast
                                        ? hasAttendance && hasDebrief
                                          ? "bg-green-50 border-green-200"
                                          : "bg-red-50 border-red-200"
                                        : "bg-slate-50 border-slate-200"
                                }`}
                              >
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                  <div className="flex items-center gap-4">
                                    <div className="text-center min-w-[60px]">
                                      <p className="text-lg font-bold text-slate-800">{week.week_number}</p>
                                      <p className="text-xs font-medium text-slate-500">
                                        {new Date(week.week_end).toLocaleDateString("en-US", {
                                          month: "short",
                                          day: "numeric",
                                        })}
                                      </p>
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-sm font-semibold text-slate-700">
                                        {week.week_label || "Class Session"}
                                        {week.is_break && <span className="text-slate-500 ml-1">(Break)</span>}
                                      </p>
                                      {week.session_focus && (
                                        <p className="text-xs text-slate-500 line-clamp-1">{week.session_focus}</p>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3 shrink-0">
                                    {!week.is_break && (
                                      <>
                                        {/* Attendance Status/Button */}
                                        {hasAttendance ? (
                                          // Already submitted - show status
                                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-green-100 border border-green-200">
                                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                                            <span className="text-xs font-medium text-green-700">Present</span>
                                          </div>
                                        ) : isPast ? (
                                          // Past week without attendance - show absent status (locked)
                                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-red-100 border border-red-200">
                                            <AlertCircle className="h-4 w-4 text-red-500" />
                                            <span className="text-xs font-medium text-red-700">Absent</span>
                                          </div>
                                        ) : canSubmitAttendance ? (
                                          // Class day - can submit
                                          <Dialog
                                            open={openDialog === "attendance" && selectedWeekForAttendance === week.id}
                                            onOpenChange={(open) => setOpenDialog(open ? "attendance" : null)}
                                          >
                                            <DialogTrigger asChild>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-xs h-8 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                                                onClick={() => {
                                                  setSelectedWeekForAttendance(week.id)
                                                  setOpenDialog("attendance")
                                                }}
                                              >
                                                <CalendarClock className="h-4 w-4 mr-2" />
                                                Mark Attendance
                                              </Button>
                                            </DialogTrigger>
                                          <DialogContent className="sm:max-w-[425px]">
                                            <DialogHeader>
                                              <DialogTitle>Mark Attendance</DialogTitle>
                                              <DialogDescription>
                                                Enter the password provided by the instructor for Week{" "}
                                                {week.week_number}.
                                              </DialogDescription>
                                            </DialogHeader>
                                            <div className="grid gap-4 py-4">
                                              <div className="grid grid-cols-4 items-center gap-4">
                                                <Label htmlFor="attendancePassword" className="text-right">
                                                  Password
                                                </Label>
                                                <Input
                                                  id="attendancePassword"
                                                  type="password"
                                                  className="col-span-3"
                                                  value={attendancePassword}
                                                  onChange={(e) => setAttendancePassword(e.target.value)}
                                                  placeholder="Enter password"
                                                />
                                              </div>
                                            </div>
                                            <DialogFooter>
                                              <Button
                                                type="submit"
                                                onClick={handleSubmitAttendance}
                                                disabled={submittingAttendance}
                                              >
                                                {submittingAttendance ? "Submitting..." : "Submit Attendance"}
                                              </Button>
                                            </DialogFooter>
                                          </DialogContent>
                                          </Dialog>
                                        ) : (
                                          // Future week - show locked badge
                                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-100 border border-slate-200">
                                            <Lock className="h-4 w-4 text-slate-400" />
                                            <span className="text-xs font-medium text-slate-500">Locked</span>
                                          </div>
                                        )}

                                        {/* Debrief Status/Button */}
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className={`text-xs h-8 ${hasDebrief ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100" : isPast ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100" : ""}`}
                                          onClick={() => {
                                            setSelectedWeekForDebrief(week.id)
                                            setDebriefForm({
                                              hoursWorked: weekDebrief?.hoursWorked?.toString() || "",
                                              workSummary: weekDebrief?.workSummary || "",
                                              questions: weekDebrief?.questions || "",
                                            })
                                            setShowDebriefDialog(true)
                                          }}
                                          disabled={!isCurrent && isPast && hasDebrief}
                                        >
                                          {hasDebrief ? (
                                            weekDebrief?.status === "reviewed" ? (
                                              <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                                            ) : (
                                              <Clock className="h-4 w-4 mr-2 text-amber-600" />
                                            )
                                          ) : isPast ? (
                                            <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
                                          ) : (
                                            <FileText className="h-4 w-4 mr-2 text-blue-600" />
                                          )}
                                          {hasDebrief
                                            ? weekDebrief?.status === "reviewed"
                                              ? "Debrief Reviewed"
                                              : "Debrief Pending"
                                            : isPast
                                              ? "Missing Debrief"
                                              : "Submit Debrief"}
                                        </Button>
                                      </>
                                    )}

                                    {!isPast && !isCurrent && !week.is_break && (
                                      <Badge variant="outline" className="text-xs text-slate-400">
                                        Upcoming
                                      </Badge>
                                    )}
                                    {week.is_break && (
                                      <Badge variant="outline" className="text-xs text-amber-500">
                                        Break Week
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )
                          })
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Questions & Meetings Tab */}
            <TabsContent value="questions" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Ask a Question Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <HelpCircle className="h-5 w-5" />
                      Ask a Question
                    </CardTitle>
                    <CardDescription>
                      Use this section to ask questions related to clinic work, client engagements, or course material.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="questionType">Question Type</Label>
                        <Select
                          value={questionType}
                          onValueChange={(value) => setQuestionType(value as "clinic" | "client")}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select question type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="clinic">Clinic Related</SelectItem>
                            <SelectItem value="client">Client Related</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="questionText">Your Question</Label>
                        <Textarea
                          id="questionText"
                          className="h-32 resize-none"
                          value={questionText}
                          onChange={(e) => setQuestionText(e.target.value)}
                          placeholder="Type your question here..."
                        />
                      </div>
                      <Button onClick={handleSubmitQuestion} disabled={submitting || !questionText.trim()}>
                        {submitting ? "Submitting..." : "Send Question"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Request a Meeting Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CalendarClock className="h-5 w-5" />
                      Request a Meeting
                    </CardTitle>
                    <CardDescription>
                      Request a meeting with your clinic director or instructor. Please provide context and preferred
                      times.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="meetingSubject">Subject</Label>
                        <Input
                          id="meetingSubject"
                          value={meetingSubject}
                          onChange={(e) => setMeetingSubject(e.target.value)}
                          placeholder="e.g., Project X Check-in"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="meetingMessage">Message</Label>
                        <Textarea
                          id="meetingMessage"
                          className="h-24 resize-none"
                          value={meetingMessage}
                          onChange={(e) => setMeetingMessage(e.target.value)}
                          placeholder="Provide details about the meeting purpose..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Preferred Dates/Times</Label>
                        <div className="grid grid-cols-3 gap-2">
                          {preferredDates.map((date, index) => (
                            <Input
                              key={index}
                              type="datetime-local"
                              className="text-xs"
                              value={date}
                              onChange={(e) => {
                                const newDates = [...preferredDates]
                                newDates[index] = e.target.value
                                setPreferredDates(newDates)
                              }}
                            />
                          ))}
                        </div>
                      </div>
                      <Button
                        onClick={handleSubmitMeetingRequest}
                        disabled={submittingMeeting || !meetingSubject.trim()}
                      >
                        {submittingMeeting ? "Requesting..." : "Request Meeting"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Meeting Requests */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarClock className="h-5 w-5" />
                    Your Meeting Requests
                  </CardTitle>
                  <CardDescription>View the status of your submitted meeting requests.</CardDescription>
                </CardHeader>
                <CardContent>
                  {meetingRequests.length === 0 ? (
                    <p className="text-sm text-slate-500">You haven't requested any meetings yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {meetingRequests.map((req) => (
                        <div
                          key={req.id}
                          className="p-3 rounded-lg border border-slate-200 flex justify-between items-center"
                        >
                          <div>
                            <p className="font-medium text-slate-700">{req.subject}</p>
                            <p className="text-xs text-slate-500 line-clamp-1">{req.message}</p>
                            <p className="text-xs text-slate-400 mt-1">
                              Requested: {new Date(req.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              req.status === "approved"
                                ? "border-green-200 text-green-700 bg-green-50"
                                : req.status === "pending"
                                  ? "border-amber-200 text-amber-700 bg-amber-50"
                                  : "border-red-200 text-red-700 bg-red-50"
                            }`}
                          >
                            {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Client Service Tab */}
            <TabsContent value="client-service">
              <ClientServiceTab currentStudent={currentStudent} />
            </TabsContent>

            {/* Clinic Tab */}
            <TabsContent value="clinic">
              <StudentClinicView currentStudent={currentStudent} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Standalone Debrief Dialog - rendered once outside the loop */}
      <Dialog open={showDebriefDialog} onOpenChange={setShowDebriefDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Weekly Debrief</DialogTitle>
            <DialogDescription>
              Please complete your debrief for Week{" "}
              {semesterSchedule.find((w) => w.id === selectedWeekForDebrief)?.week_number || ""}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="debrief-hoursWorked" className="text-right">
                Hours Worked
              </Label>
              <Input
                id="debrief-hoursWorked"
                type="number"
                className="col-span-3"
                value={debriefForm.hoursWorked}
                onChange={(e) => setDebriefForm({ ...debriefForm, hoursWorked: e.target.value })}
                placeholder="e.g., 5.5"
                min="0"
                step="0.5"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="debrief-workSummary" className="text-right">
                Work Summary
              </Label>
              <Textarea
                id="debrief-workSummary"
                className="col-span-3 h-32 resize-none"
                value={debriefForm.workSummary}
                onChange={(e) => setDebriefForm({ ...debriefForm, workSummary: e.target.value })}
                placeholder="Summarize your work this week..."
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="debrief-questions" className="text-right">
                Questions
              </Label>
              <Textarea
                id="debrief-questions"
                className="col-span-3 h-24 resize-none"
                value={debriefForm.questions}
                onChange={(e) => setDebriefForm({ ...debriefForm, questions: e.target.value })}
                placeholder="Any questions for the instructor?"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleSubmitDebrief} disabled={submittingDebrief}>
              {submittingDebrief ? "Submitting..." : "Submit Debrief"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
