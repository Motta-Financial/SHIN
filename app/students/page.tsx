"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { MainNavigation } from "@/components/main-navigation"
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
  Send,
  Upload,
  Building2,
  AlertCircle,
  Bell,
  Presentation,
  Award,
  Users,
  Lock,
  CalendarClock,
  ChevronDown,
  Eye,
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

async function fetchWithRetry(url: string, maxRetries = 3): Promise<Response> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url)

      if (response.status === 429) {
        // Rate limited - wait with exponential backoff
        const waitTime = Math.pow(2, attempt + 1) * 1000 // 2s, 4s, 8s
        console.log(`[v0] Rate limited on ${url}, waiting ${waitTime}ms (attempt ${attempt + 1}/${maxRetries})`)
        await new Promise((r) => setTimeout(r, waitTime))
        continue
      }

      if (!response.ok) {
        const text = await response.text()
        if (text.startsWith("Too Many R")) {
          // Rate limit response without proper status code
          const waitTime = Math.pow(2, attempt + 1) * 1000
          console.log(`[v0] Rate limited (text) on ${url}, waiting ${waitTime}ms`)
          await new Promise((r) => setTimeout(r, waitTime))
          continue
        }
      }

      return response
    } catch (error) {
      if (attempt < maxRetries - 1) {
        const waitTime = Math.pow(2, attempt) * 1000
        await new Promise((r) => setTimeout(r, waitTime))
      } else {
        throw error
      }
    }
  }
  // Final attempt
  return fetch(url)
}

async function fetchSequentially(urls: string[]): Promise<Response[]> {
  const results: Response[] = []
  for (let i = 0; i < urls.length; i++) {
    // Wait 500ms between requests to avoid rate limiting
    if (i > 0) {
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
    const res = await fetchWithRetry(urls[i])
    results.push(res)
  }
  return results
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
          "Scheduled project review meetings for progress and feedback",
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
      "Project Focus: Define key areas of focus for your project and explain how they help your client grow and sustain competitive advantage",
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
  const { role, email: userEmail, isLoading: roleLoading, isAuthenticated } = useUserRole()

  console.log("[v0] StudentPortal - Auth state:", { role, isAuthenticated, roleLoading, isDemoMode })

  const demoStudentId = useDemoStudent(DEMO_STUDENTS[0].id)
  const [selectedStudentId, setSelectedStudentId] = useState<string>(demoStudentId)

  const [availableStudents, setAvailableStudents] = useState<AvailableStudent[]>([])

  useEffect(() => {
    setSelectedStudentId(demoStudentId)
  }, [demoStudentId])

  useEffect(() => {
    if (!roleLoading && !isDemoMode) {
      // Directors and admins can always access
      if (role === "director" || role === "admin") {
        console.log("[v0] StudentPortal - Director/Admin access granted")
        return
      }
      // Students can access their own portal
      if (role === "student") {
        console.log("[v0] StudentPortal - Student access granted")
        return
      }
      // Not authenticated - redirect to login
      if (!isAuthenticated) {
        console.log("[v0] StudentPortal - Not authenticated, redirecting to login")
        router.push("/login")
        return
      }
      // Authenticated but wrong role - redirect to their portal
      if (!canAccessPortal(role, "student")) {
        console.log("[v0] StudentPortal - Wrong role, redirecting to:", getDefaultPortal(role))
        router.push(getDefaultPortal(role))
        return
      }
    }
  }, [role, roleLoading, isAuthenticated, isDemoMode, router])

  useEffect(() => {
    const fetchAvailableStudents = async () => {
      if (isDemoMode || role === "admin" || role === "director") {
        try {
          const res = await fetch("/api/supabase/students/overview")
          const data = await res.json()
          if (data.students) {
            setAvailableStudents(
              data.students.map((s: any) => ({
                id: s.id,
                full_name: s.full_name || s.name,
                email: s.email,
                clinic: s.clinic_name || s.clinic,
              })),
            )
          }
        } catch (error) {
          console.error("Error fetching students:", error)
        }
      } else if (role === "student" && userEmail && !isDemoMode) {
        // For actual students, find their own ID
        try {
          const res = await fetch(`/api/supabase/students/overview?email=${encodeURIComponent(userEmail)}`)
          const data = await res.json()
          if (data.students && data.students.length > 0) {
            setSelectedStudentId(data.students[0].id)
          }
        } catch (error) {
          console.error("Error fetching student:", error)
        }
      }
    }

    if (!roleLoading) {
      fetchAvailableStudents()
    }
  }, [role, userEmail, roleLoading, isDemoMode])

  const canSwitchStudents = isDemoMode || role === "admin" || role === "director"

  const [loading, setLoading] = useState(true)
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null)
  const [debriefs, setDebriefs] = useState<Debrief[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [questionText, setQuestionText] = useState("")
  const [submitting, setSubmitting] = useState(false)
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

  useEffect(() => {
    async function fetchData() {
      // Use the determined student ID
      const currentStudentId = isDemoMode ? demoStudentId : selectedStudentId
      if (!currentStudentId) return

      setLoading(true)
      try {
        const urls = [
          `/api/supabase/roster?studentId=${currentStudentId}`,
          `/api/supabase/debriefs?studentId=${currentStudentId}`,
          `/api/supabase/attendance?studentId=${currentStudentId}`,
          `/api/meeting-requests?studentId=${currentStudentId}`,
          "/api/course-materials",
          `/api/documents?studentId=${currentStudentId}`,
          "/api/semester-schedule",
        ]

        const [studentRes, debriefsRes, attendanceRes, meetingRes, materialsRes, docsRes, scheduleRes] =
          await fetchSequentially(urls)

        const studentData = await studentRes.json()
        const debriefsData = await debriefsRes.json()
        const attendanceData = await attendanceRes.json()
        const meetingData = await meetingRes.json()
        const materialsData = await materialsRes.json()

        const scheduleData = await scheduleRes.json()
        // Ensure week_number is treated as a number if it's meant to be
        setSemesterSchedule(
          (scheduleData.schedules || []).map((week: any) => ({
            ...week,
            // Convert week_number to number for sorting/comparison if necessary, but keep as string if that's the DB type
            week_number: String(week.week_number),
          })),
        )

        const student = studentData.students?.[0] || null
        setCurrentStudent(student)
        setDebriefs(debriefsData.debriefs || [])
        setAttendanceRecords(attendanceData.attendance || [])
        setMeetingRequests(meetingData.requests || []) // Set meeting requests
        // Get materials from last 7 days for "new" materials
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        const recentMaterials = (materialsData.materials || []).filter((m: any) => new Date(m.created_at) >= weekAgo)
        setRecentCourseMaterials(recentMaterials)

        if (docsRes.ok) {
          const docsData = await docsRes.json()
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
            const gradesRes = await fetch(`/api/evaluations?clientId=${student.clientId}&finalized=true`)
            if (gradesRes.ok) {
              const gradesData = await gradesRes.json()
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
            await new Promise((resolve) => setTimeout(resolve, 1500)) // Longer delay to avoid rate limiting
            const res = await fetchWithRetry(
              `/api/student-notifications?studentId=${studentData.id}&clinicId=${studentData.clinicId}`,
            )
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
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedStudentId, demoStudentId, isDemoMode]) // Added dependency for isDemoMode

  // Add useEffect to fetch signed agreements
  useEffect(() => {
    const fetchSignedAgreements = async () => {
      if (!currentStudent?.email) return
      try {
        await new Promise((resolve) => setTimeout(resolve, 2000)) // Longer delay to avoid rate limiting
        const response = await fetchWithRetry(`/api/agreements?userEmail=${encodeURIComponent(currentStudent.email)}`)
        const text = await response.text()
        if (text.startsWith("Too Many R")) {
          console.error("Error fetching agreements: Rate limited")
          return
        }
        try {
          const data = JSON.parse(text)
          if (data.agreements) {
            setSignedAgreements(data.agreements.map((a: any) => a.agreement_type))
          }
        } catch (parseError) {
          console.error("Error parsing agreements:", parseError)
        }
      } catch (error) {
        console.error("Error fetching agreements:", error)
      }
    }
    fetchSignedAgreements()
  }, [currentStudent?.email])

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
        await fetch("/api/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "question",
            title: `Question from ${currentStudent.fullName}`,
            message: questionText,
            studentId: currentStudent.id,
            studentName: currentStudent.fullName,
            studentEmail: currentStudent.email,
            clinic: currentStudent.clinic,
            questionType: questionType,
          }),
        })

        // Refresh debriefs
        const debriefsRes = await fetch(`/api/supabase/debriefs?studentId=${currentStudent.id}`)
        const debriefsData = await debriefsRes.json()
        setDebriefs(debriefsData.debriefs || [])
        setQuestionText("")
      }
    } catch (error) {
      console.error("Error submitting question:", error)
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
        const meetingData = await meetingRes.json()
        setMeetingRequests(meetingData.requests || [])

        // Reset form
        setMeetingSubject("")
        setMeetingMessage("")
        setPreferredDates(["", "", ""])
      }
    } catch (error) {
      console.error("Error submitting meeting request:", error)
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

      const response = await fetch("/api/supabase/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: currentStudent.id,
          studentName: currentStudent.fullName,
          studentEmail: currentStudent.email,
          clinic: currentStudent.clinic,
          weekNumber: selectedWeek.week_number,
          weekEnding: selectedWeek.week_end,
          classDate: selectedWeek.week_start,
          password: attendancePassword,
        }),
      })

      if (response.ok) {
        // Refresh attendance records
        const attendanceRes = await fetch(`/api/supabase/attendance?studentId=${currentStudent.id}`)
        const attendanceData = await attendanceRes.json()
        setAttendanceRecords(attendanceData.attendance || [])

        // Reset form
        setAttendancePassword("")
        setSelectedWeekForAttendance("")
        // Close the dialog if it was open
        const dialogTrigger = document.querySelector('[data-state="open"] > button') as HTMLElement
        dialogTrigger?.click()
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
    if (!selectedWeekForDebrief || !debriefForm.hoursWorked || !debriefForm.workSummary) return

    setSubmittingDebrief(true)
    try {
      const selectedWeek = semesterSchedule.find((w) => w.id === selectedWeekForDebrief)
      if (!selectedWeek) throw new Error("Week not found")

      const response = await fetch("/api/supabase/debriefs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: currentStudent?.id,
          studentName: currentStudent?.fullName,
          clientId: currentStudent?.clientId,
          clientName: currentStudent?.clientName,
          clinic: currentStudent?.clinic,
          weekEnding: selectedWeek.week_end,
          weekNumber: selectedWeek.week_number,
          hoursWorked: Number.parseFloat(debriefForm.hoursWorked),
          workSummary: debriefForm.workSummary,
          questions: debriefForm.questions || null,
          status: "pending",
        }),
      })

      if (!response.ok) throw new Error("Failed to submit debrief")

      // Refresh debriefs
      const debriefRes = await fetch(`/api/supabase/debriefs?studentId=${currentStudent?.id}`)
      if (debriefRes.ok) {
        const data = await debriefRes.json()
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
      return
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
  }, [selectedFile])

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
  const totalAttendance = attendanceRecords.length
  const completedDebriefs = debriefs.filter((d) => d.status === "reviewed").length
  const pendingDebriefs = debriefs.filter((d) => d.status === "pending").length

  const getWeekEndingDate = () => {
    const today = new Date()
    const dayOfWeek = today.getDay()
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

  // Removed redeclaration of canSwitchStudents
  // const canSwitchStudents = isDemoMode || role === "admin" || role === "director"

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
              <p className="text-muted-foreground">Unable to load your student profile.</p>
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
          {/* CHANGE: Show student selector for directors/admins viewing student portal */}
          {canSwitchStudents && availableStudents.length > 1 && (
            <div className="mb-4 flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <Eye className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-blue-800 font-medium">
                  {isDemoMode ? "Demo Mode" : "Viewing as Director/Admin"}
                </p>
                <p className="text-xs text-blue-600">
                  {isDemoMode ? "Select a student to preview their portal" : "Select a student to view their portal"}
                </p>
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
                      {student.full_name} - {student.clinic}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* CHANGE: Removed old demo mode banner - now using unified selector above */}

          {/* Header */}
          <StudentPortalHeader
            loading={loading}
            currentStudent={currentStudent}
            totalHours={totalHours}
            totalAttendance={totalAttendance}
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
                                    {hasHours && <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />}
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
                                    {!isPending && <AlertCircle className="h-3.5 w-3.5 text-red-500" />}
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
                                {isMissing && week.session_focus && (
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
                          <p className="text-xs text-slate-500">Classes Attended</p>
                          <p className="text-xl font-bold text-slate-900">{totalAttendance}</p>
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
                                    {hasAttendance && <CheckCircle2 className="h-3.5 w-3.5 text-purple-600" />}
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
                      <span className="text-sm font-medium text-slate-600">Attendance Rate</span>
                      <span className="text-lg font-bold text-purple-600">
                        {totalAttendance}/
                        {totalAttendance > 0
                          ? semesterSchedule.filter((w) => !w.is_break && new Date(w.week_end) < new Date()).length
                          : 0}
                      </span>
                    </div>
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="dashboard" className="space-y-6">
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
              <div className="space-y-6">
                {/* CHANGE: Replace separate Onboarding, Action Items, and Notifications with unified Triage */}
                <Triage
                  userType="student"
                  userName={currentStudent?.fullName || ""}
                  userEmail={currentStudent?.email || ""}
                  userId={currentStudent?.id}
                  clinicId={currentStudent?.clinicId}
                  programName="SEED Program"
                  debriefs={debriefs}
                  meetingRequests={meetingRequests}
                  recentCourseMaterials={recentCourseMaterials}
                  studentNotifications={studentNotifications}
                  hasSubmittedThisWeek={hasSubmittedThisWeek}
                  hasSubmittedLastWeek={hasSubmittedLastWeek}
                  currentWeekEnding={currentWeekEnding}
                  lastWeekEnding={lastWeekEnding}
                  signedAgreements={signedAgreements as any}
                  onAgreementSigned={(type) => {
                    setSignedAgreements((prev) => [...prev, type])
                  }}
                  onNavigate={(tab) => {
                    const tabsEl = document.querySelector(`[value="${tab}"]`) as HTMLElement
                    tabsEl?.click()
                  }}
                />

                {/* Quick Actions */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-slate-600" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Button
                        variant="outline"
                        className="h-auto py-4 flex flex-col items-center gap-2 bg-transparent"
                        onClick={() =>
                          document
                            .querySelector('[value="attendance"]') // Changed from debriefs
                            ?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
                        }
                      >
                        <FileText className="h-6 w-6 text-blue-600" />
                        <span className="text-sm">Submit Debrief</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-auto py-4 flex flex-col items-center gap-2 bg-transparent"
                        onClick={() =>
                          document
                            .querySelector('[value="questions"]')
                            ?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
                        }
                      >
                        <HelpCircle className="h-6 w-6 text-amber-600" />
                        <span className="text-sm">Ask Question</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-auto py-4 flex flex-col items-center gap-2 bg-transparent"
                        onClick={() =>
                          document
                            .querySelector('[value="clinic"]') // Changed to clinic as documents is removed
                            ?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
                        }
                      >
                        <Upload className="h-6 w-6 text-green-600" />
                        <span className="text-sm">Upload Document</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-auto py-4 flex flex-col items-center gap-2 bg-transparent"
                        onClick={() =>
                          document
                            .querySelector('[value="attendance"]')
                            ?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
                        }
                      >
                        <Calendar className="h-6 w-6 text-purple-600" />
                        <span className="text-sm">View Attendance</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-auto py-4 flex flex-col items-center gap-2 bg-transparent"
                        onClick={() =>
                          document
                            .querySelector('[value="questions"]') // Should link to meeting requests section
                            ?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
                        }
                      >
                        <Calendar className="h-6 w-6 text-blue-600" />
                        <span className="text-sm">Request Meeting</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-auto py-4 flex flex-col items-center gap-2 bg-transparent"
                        onClick={() =>
                          document
                            .querySelector('[value="clinic"]') // Changed to clinic as materials is removed
                            ?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
                        }
                      >
                        <BookOpen className="h-6 w-6 text-amber-600" />
                        <span className="text-sm">View Course Materials</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Program Info */}
                <Card className="bg-gradient-to-r from-slate-50 to-blue-50 border-slate-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-900">Your Assignment</h3>
                        <p className="text-sm text-slate-600 mt-1">
                          <span className="font-medium">{currentStudent?.clinic || "Business Clinic"}</span>
                          {currentStudent?.clientName && (
                            <span>
                              {" "}
                              • Working with <span className="font-medium">{currentStudent.clientName}</span>
                            </span>
                          )}
                        </p>
                      </div>
                      <Badge className={currentStudent?.isTeamLeader ? "bg-amber-500" : "bg-blue-500"}>
                        {currentStudent?.isTeamLeader ? "Team Leader" : "Team Member"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
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
                          <p className="text-sm text-green-700">Classes Attended</p>
                          <p className="text-2xl font-bold text-green-800">
                            {attendanceRecords.length}/{semesterSchedule.filter((w) => !w.is_break).length}
                          </p>
                        </div>
                        <CheckCircle2 className="h-8 w-8 text-green-600" />
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
                            const weekDebrief = debriefs.find((d) => {
                              const debriefWeekNumber = d.weekNumber
                              return debriefWeekNumber === Number(week.week_number) // Compare numbers
                            })
                            const hasDebrief = !!weekDebrief
                            const isPast = new Date(week.week_end) < new Date()
                            const isCurrent =
                              new Date(week.week_start) <= new Date() && new Date(week.week_end) >= new Date()

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
                                      <p className="text-xs text-muted-foreground">Week</p>
                                      <p className="text-xl font-bold">{week.week_number}</p>
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <p className="font-medium">{week.week_label || `Week ${week.week_number}`}</p>
                                        {week.is_break && <Badge className="bg-amber-500">Break</Badge>}
                                        {isCurrent && <Badge className="bg-blue-600">Current Week</Badge>}
                                      </div>
                                      <p className="text-sm text-muted-foreground">
                                        {new Date(week.week_start).toLocaleDateString("en-US", {
                                          weekday: "short",
                                          month: "short",
                                          day: "numeric",
                                        })}{" "}
                                        -{" "}
                                        {new Date(week.week_end).toLocaleDateString("en-US", {
                                          weekday: "short",
                                          month: "short",
                                          day: "numeric",
                                        })}
                                      </p>
                                      {week.session_focus && (
                                        <p className="text-xs text-slate-600 mt-1">{week.session_focus}</p>
                                      )}
                                    </div>
                                  </div>

                                  {!week.is_break && (
                                    <div className="flex flex-wrap items-center gap-2">
                                      {/* Attendance Status/Button */}
                                      {hasAttendance ? (
                                        <Badge className="bg-green-600 text-white">
                                          <CheckCircle2 className="h-3 w-3 mr-1" />
                                          Attended
                                        </Badge>
                                      ) : (
                                        <Dialog>
                                          <DialogTrigger asChild>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className="border-blue-300 text-blue-700 hover:bg-blue-50 bg-transparent"
                                              onClick={() => setSelectedWeekForAttendance(week.id)}
                                            >
                                              <Lock className="h-3 w-3 mr-1" />
                                              Submit Attendance
                                            </Button>
                                          </DialogTrigger>
                                          <DialogContent>
                                            <DialogHeader>
                                              <DialogTitle>Submit Attendance - Week {week.week_number}</DialogTitle>
                                              <DialogDescription>
                                                Enter the class password provided during class to mark your attendance
                                                for {new Date(week.week_start).toLocaleDateString()}.
                                              </DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4 py-4">
                                              <div className="space-y-2">
                                                <Label>Class Password</Label>
                                                <Input
                                                  type="password"
                                                  placeholder="Enter today's class password"
                                                  value={attendancePassword}
                                                  onChange={(e) => setAttendancePassword(e.target.value)}
                                                />
                                                <p className="text-xs text-muted-foreground">
                                                  The password is shared during class
                                                </p>
                                              </div>
                                            </div>
                                            <DialogFooter>
                                              <Button
                                                onClick={() => {
                                                  setSelectedWeekForAttendance(week.id)
                                                  handleSubmitAttendance()
                                                }}
                                                disabled={submittingAttendance || !attendancePassword.trim()}
                                              >
                                                {submittingAttendance ? "Submitting..." : "Submit"}
                                              </Button>
                                            </DialogFooter>
                                          </DialogContent>
                                        </Dialog>
                                      )}

                                      {/* Debrief Status/Button */}
                                      {hasDebrief ? (
                                        <Collapsible>
                                          <CollapsibleTrigger asChild>
                                            <Badge className="bg-green-600 text-white cursor-pointer hover:bg-green-700">
                                              <CheckCircle2 className="h-3 w-3 mr-1" />
                                              Debrief ({weekDebrief?.hoursWorked}h)
                                              <ChevronDown className="h-3 w-3 ml-1" />
                                            </Badge>
                                          </CollapsibleTrigger>
                                          <CollapsibleContent className="mt-2">
                                            <Card className="border-green-200">
                                              <CardContent className="pt-3 text-sm">
                                                <div className="space-y-2">
                                                  <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Hours:</span>
                                                    <span className="font-medium">{weekDebrief?.hoursWorked}h</span>
                                                  </div>
                                                  <div>
                                                    <span className="text-muted-foreground">Work Summary:</span>
                                                    <p className="mt-1">{weekDebrief?.workSummary}</p>
                                                  </div>
                                                  {weekDebrief?.questions && (
                                                    <div>
                                                      <span className="text-muted-foreground">Questions:</span>
                                                      <p className="mt-1 text-amber-700">{weekDebrief.questions}</p>
                                                    </div>
                                                  )}
                                                </div>
                                              </CardContent>
                                            </Card>
                                          </CollapsibleContent>
                                        </Collapsible>
                                      ) : (
                                        <Dialog>
                                          <DialogTrigger asChild>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className="border-purple-300 text-purple-700 hover:bg-purple-50 bg-transparent"
                                              onClick={() => {
                                                setSelectedWeekForDebrief(week.id)
                                                setShowDebriefDialog(true)
                                              }}
                                            >
                                              <FileText className="h-3 w-3 mr-1" />
                                              Submit Debrief
                                            </Button>
                                          </DialogTrigger>
                                          <DialogContent className="max-w-lg">
                                            <DialogHeader>
                                              <DialogTitle>Weekly Debrief - Week {week.week_number}</DialogTitle>
                                              <DialogDescription>
                                                Submit your weekly work summary for{" "}
                                                {new Date(week.week_start).toLocaleDateString()} -{" "}
                                                {new Date(week.week_end).toLocaleDateString()}
                                              </DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4 py-4">
                                              <div className="space-y-2">
                                                <Label>Hours Worked This Week *</Label>
                                                <Input
                                                  type="number"
                                                  step="0.5"
                                                  min="0"
                                                  placeholder="e.g., 5.5"
                                                  value={debriefForm.hoursWorked}
                                                  onChange={(e) =>
                                                    setDebriefForm({ ...debriefForm, hoursWorked: e.target.value })
                                                  }
                                                />
                                              </div>
                                              <div className="space-y-2">
                                                <Label>Work Summary *</Label>
                                                <Textarea
                                                  placeholder="Describe what you worked on this week..."
                                                  rows={4}
                                                  value={debriefForm.workSummary}
                                                  onChange={(e) =>
                                                    setDebriefForm({ ...debriefForm, workSummary: e.target.value })
                                                  }
                                                />
                                              </div>
                                              <div className="space-y-2">
                                                <Label>Questions or Notes (Optional)</Label>
                                                <Textarea
                                                  placeholder="Any questions for your clinic director?"
                                                  rows={2}
                                                  value={debriefForm.questions}
                                                  onChange={(e) =>
                                                    setDebriefForm({ ...debriefForm, questions: e.target.value })
                                                  }
                                                />
                                              </div>
                                            </div>
                                            <DialogFooter>
                                              <Button
                                                onClick={() => {
                                                  setSelectedWeekForDebrief(week.id)
                                                  handleSubmitDebrief()
                                                }}
                                                disabled={
                                                  submittingDebrief ||
                                                  !debriefForm.hoursWorked ||
                                                  !debriefForm.workSummary
                                                }
                                              >
                                                {submittingDebrief ? "Submitting..." : "Submit Debrief"}
                                              </Button>
                                            </DialogFooter>
                                          </DialogContent>
                                        </Dialog>
                                      )}

                                      {/* Completion indicator */}
                                      {isPast && !week.is_break && (
                                        <div className="flex items-center">
                                          {hasAttendance && hasDebrief ? (
                                            <Badge
                                              variant="outline"
                                              className="bg-green-100 text-green-700 border-green-300"
                                            >
                                              <CheckCircle2 className="h-3 w-3 mr-1" />
                                              Complete
                                            </Badge>
                                          ) : (
                                            <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                                              <AlertCircle className="h-3 w-3 mr-1" />
                                              Incomplete
                                            </Badge>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          })
                      )}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Your Debrief History
                    </CardTitle>
                    <CardDescription>All your weekly work submissions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {debriefs.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-8">No debriefs submitted yet</p>
                      ) : (
                        debriefs
                          .sort((a, b) => b.weekNumber - a.weekNumber) // Sort by week number descending
                          .map((debrief) => (
                            <Collapsible key={debrief.id}>
                              <CollapsibleTrigger asChild>
                                <div className="p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className="text-center min-w-[50px]">
                                        <p className="text-xs text-muted-foreground">Week</p>
                                        <p className="font-bold">{debrief.weekNumber || "—"}</p>
                                      </div>
                                      <div>
                                        <p className="font-medium text-sm">{debrief.clientName}</p>
                                        <p className="text-xs text-slate-500">
                                          {new Date(debrief.weekEnding).toLocaleDateString()}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Badge
                                        className={
                                          debrief.status === "reviewed"
                                            ? "bg-green-500"
                                            : debrief.status === "pending"
                                              ? "bg-amber-500"
                                              : "bg-slate-500"
                                        }
                                      >
                                        {debrief.status}
                                      </Badge>
                                      <div className="flex items-center gap-1 text-sm font-medium">
                                        <Clock className="h-4 w-4 text-blue-600" />
                                        {debrief.hoursWorked}h
                                      </div>
                                      <ChevronDown className="h-4 w-4 text-slate-400" />
                                    </div>
                                  </div>
                                </div>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <div className="p-3 border border-t-0 rounded-b-lg bg-slate-50">
                                  <p className="text-sm text-slate-700 mb-2">{debrief.workSummary}</p>
                                  {debrief.questions && (
                                    <div className="bg-amber-50 border border-amber-200 rounded p-2 mt-2">
                                      <p className="text-xs font-medium text-amber-800 mb-1">Questions:</p>
                                      <p className="text-xs text-amber-700">{debrief.questions}</p>
                                    </div>
                                  )}
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="questions">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <HelpCircle className="h-5 w-5" />
                      Ask a Question
                    </CardTitle>
                    <CardDescription>Submit questions to your directors</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="question-type">Question Type</Label>
                      <Select
                        value={questionType}
                        onValueChange={(value: "clinic" | "client") => setQuestionType(value)}
                      >
                        <SelectTrigger id="question-type">
                          <SelectValue placeholder="Select question type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="clinic">
                            <div className="flex flex-col items-start">
                              <span className="font-medium">Clinic-Specific Question</span>
                              <span className="text-xs text-muted-foreground">Goes to your clinic director(s)</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="client">
                            <div className="flex flex-col items-start">
                              <span className="font-medium">Client Engagement Question</span>
                              <span className="text-xs text-muted-foreground">
                                Goes to client primary director (visible to all directors)
                              </span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {questionType === "clinic"
                          ? "Clinic questions are for topics specific to your clinic's operations, processes, or requirements."
                          : "Client engagement questions are about your client project and will be visible to all directors working with your client."}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="question-text">Your Question</Label>
                      <Textarea
                        id="question-text"
                        placeholder="Type your question here..."
                        value={questionText}
                        onChange={(e) => setQuestionText(e.target.value)}
                        rows={4}
                      />
                    </div>
                    <Button onClick={handleSubmitQuestion} disabled={submitting || !questionText.trim()}>
                      <Send className="h-4 w-4 mr-2" />
                      {submitting ? "Submitting..." : "Submit Question"}
                    </Button>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Request a Meeting
                    </CardTitle>
                    <CardDescription>Schedule time with a clinic director</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Subject</Label>
                      <Input
                        placeholder="Meeting subject..."
                        value={meetingSubject}
                        onChange={(e) => setMeetingSubject(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Message (Optional)</Label>
                      <Textarea
                        placeholder="Additional details about your meeting request..."
                        value={meetingMessage}
                        onChange={(e) => setMeetingMessage(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Preferred Dates (Optional)</Label>
                      <div className="space-y-2">
                        {preferredDates.map((date, index) => (
                          <Input
                            key={index}
                            type="date"
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
                      className="w-full"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      {submittingMeeting ? "Submitting..." : "Request Meeting"}
                    </Button>
                  </CardContent>
                </Card>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Your Previous Questions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {debriefs.filter((d) => d.questions).length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No questions submitted yet</p>
                    ) : (
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {debriefs
                          .filter((d) => d.questions)
                          .slice(0, 10)
                          .map((d) => (
                            <div key={d.id} className="p-3 bg-muted/50 rounded-lg">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs">
                                  {d.questionType === "client" ? "Client Engagement" : "Clinic"}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(d.createdAt).toLocaleDateString()}
                                </span>
                                {d.status === "reviewed" && <Badge className="bg-green-600 text-xs">Answered</Badge>}
                              </div>
                              <p className="text-sm">{d.questions}</p>
                            </div>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Your Meeting Requests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {meetingRequests.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No meeting requests yet</p>
                    ) : (
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {meetingRequests.map((request) => (
                          <div key={request.id} className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-medium text-sm">{request.subject || request.directorName}</p>
                              <Badge
                                variant="outline"
                                className={
                                  request.status === "approved"
                                    ? "bg-green-100 text-green-700"
                                    : request.status === "pending"
                                      ? "bg-amber-100 text-amber-700"
                                      : "bg-slate-100"
                                }
                              >
                                {request.status || "Pending"}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Requested: {new Date(request.requestedDate || request.created_at).toLocaleDateString()}
                            </p>
                            {request.reason && <p className="text-sm mt-1">{request.reason}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="client-service">
              {currentStudent?.clientId ? (
                <ClientServiceTab
                  clientId={currentStudent.clientId}
                  clientName={currentStudent.clientName || "Client"}
                  currentUser={{
                    id: currentStudent.id,
                    name: currentStudent.fullName,
                    email: currentStudent.email,
                    type: "student",
                  }}
                />
              ) : (
                <Card className="p-8 text-center">
                  <Building2 className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-500">No client assigned yet</p>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="clinic">
              {currentStudent ? (
                <StudentClinicView
                  currentStudent={{
                    id: currentStudent.id,
                    fullName: currentStudent.fullName,
                    email: currentStudent.email,
                    clinic: currentStudent.clinic,
                    clinicId: currentStudent.clinicId || "",
                    clientId: currentStudent.clientId || "",
                    clientName: currentStudent.clientName || "",
                  }}
                  deliverableDocuments={deliverableDocuments}
                  teamGrades={teamGrades}
                  onDeliverableUpload={handleDeliverableUpload}
                  uploadingDeliverable={uploadingDeliverable}
                  courseMaterials={recentCourseMaterials}
                  onDocumentSubmit={async (data) => {
                    setSubmittingDocument(true)
                    try {
                      const blob = await upload(data.file.name, data.file, {
                        access: "public",
                        handleUploadUrl: "/api/upload-blob",
                      })
                      await fetch("/api/documents", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          fileName: data.file.name,
                          fileUrl: blob.url,
                          fileType: data.file.type,
                          studentId: currentStudent.id,
                          studentName: currentStudent.fullName,
                          clientId: currentStudent.clientId,
                          clientName: data.client,
                          clinic: currentStudent.clinic,
                          submissionType: data.type,
                          description: data.description,
                        }),
                      })
                      alert("Document submitted successfully!")
                    } catch (error) {
                      console.error("Error submitting document:", error)
                      alert("An error occurred. Please try again.")
                    } finally {
                      setSubmittingDocument(false)
                    }
                  }}
                  submittingDocument={submittingDocument}
                />
              ) : (
                <Card className="p-8 text-center">
                  <Users className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-500">Loading clinic information...</p>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
