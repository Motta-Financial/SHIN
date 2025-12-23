"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { MainNavigation } from "@/components/main-navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  GraduationCap,
  HelpCircle,
  Send,
  Upload,
  Building2,
  AlertCircle,
  Bell,
  AlertTriangle,
  ChevronRight,
} from "lucide-react"
import { upload } from "@vercel/blob/client" // Keep this import

interface Student {
  id: string
  firstName: string
  lastName: string
  fullName: string
  email: string
  universityId?: string
  clinic: string
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

const CLINIC_COLORS = {
  "Consulting Clinic": { bg: "bg-[#4A6FA5]/10", border: "border-[#4A6FA5]/30", text: "text-[#4A6FA5]" },
  "Accounting Clinic": { bg: "bg-[#5B7C99]/10", border: "border-[#5B7C99]/30", text: "text-[#5B7C99]" },
  "Marketing Clinic": { bg: "bg-[#C4B5C4]/10", border: "border-[#C4B5C4]/30", text: "text-[#C4B5C4]" },
  Consulting: { bg: "bg-[#4A6FA5]/10", border: "border-[#4A6FA5]/30", text: "text-[#4A6FA5]" },
  Accounting: { bg: "bg-[#5B7C99]/10", border: "border-[#5B7C99]/30", text: "text-[#5B7C99]" },
  Marketing: { bg: "bg-[#C4B5C4]/10", border: "border-[#C4B5C4]/30", text: "text-[#C4B5C4]" },
}

export default function StudentPortalPage() {
  const DEMO_STUDENT_ID = "3f19f7d2-33c4-4637-935e-1aa032012c58" // Collin Merwin

  const [selectedStudentId] = useState<string>(DEMO_STUDENT_ID)
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
  const [meetingRequests, setMeetingRequests] = useState<any[]>([])
  const [recentCourseMaterials, setRecentCourseMaterials] = useState<any[]>([])

  const toggleSection = (section: keyof typeof expandedSections) => {
    // Keep this function
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  useEffect(() => {
    async function fetchData() {
      if (!selectedStudentId) return

      setLoading(true)
      try {
        const [studentRes, debriefsRes, attendanceRes, meetingRes, materialsRes] = await Promise.all([
          fetch(`/api/supabase/roster?studentId=${selectedStudentId}`),
          fetch(`/api/supabase/debriefs?studentId=${selectedStudentId}`),
          fetch(`/api/supabase/attendance?studentId=${selectedStudentId}`),
          fetch(`/api/students/meeting-requests?studentId=${selectedStudentId}`),
          fetch(`/api/course-materials`),
        ])

        const studentData = await studentRes.json()
        const debriefsData = await debriefsRes.json()
        const attendanceData = await attendanceRes.json()
        const meetingData = await meetingRes.json()
        const materialsData = await materialsRes.json()

        setCurrentStudent(studentData.students?.[0] || null)
        setDebriefs(debriefsData.debriefs || [])
        setAttendanceRecords(attendanceData.attendance || [])
        setMeetingRequests(meetingData.meetingRequests || [])
        // Get materials from last 7 days for "new" materials
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        const recentMaterials = (materialsData.materials || []).filter((m: any) => new Date(m.created_at) >= weekAgo)
        setRecentCourseMaterials(recentMaterials)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedStudentId])

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
          questionType: questionType, // Include question type in submission
          hoursWorked: 0,
          workSummary: "Question submission",
        }),
      })

      if (response.ok) {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 pt-[48px] pl-12">
        <MainNavigation />
        <div className="container mx-auto px-4 py-6">
          <Card className="p-8 text-center">
            <p className="text-slate-500">Loading your portal...</p>
          </Card>
        </div>
      </div>
    )
  }

  if (!currentStudent) {
    return (
      <div className="min-h-screen bg-background pt-[48px] pl-12">
        <MainNavigation />
        <div className="container mx-auto px-6 py-6">
          <Card className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Student Not Found</h2>
            <p className="text-muted-foreground">Unable to load your student profile.</p>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-[48px] pl-12">
      <MainNavigation />

      <div className="container mx-auto px-4 py-6">
        <div className="mb-4 flex items-center gap-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-blue-800 font-medium">Demo Mode - Viewing as Collin Merwin</p>
            <p className="text-xs text-blue-600">
              In production, you'll be automatically logged in as yourself and see only your own data.
            </p>
          </div>
        </div>

        {/* Header */}
        <div className="mb-6 bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <GraduationCap className="h-8 w-8" />
                <div>
                  <h1 className="text-2xl font-bold">
                    {loading ? "Loading..." : currentStudent?.fullName || "Student Portal"}
                  </h1>
                  <p className="text-blue-100 text-sm">
                    {currentStudent?.clinic || "Business Clinic"} - {currentStudent?.semester || "Fall 2025"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                {currentStudent?.isTeamLeader && <Badge className="bg-amber-500 text-white">Team Leader</Badge>}
                {currentStudent?.clientName && (
                  <Badge className="bg-white text-blue-600">
                    <Building2 className="h-3 w-3 mr-1" />
                    {currentStudent.clientName}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="text-right">
                <p className="text-blue-100">Total Hours</p>
                <p className="text-2xl font-bold">{totalHours.toFixed(1)}</p>
              </div>
              <div className="h-10 w-px bg-blue-400" />
              <div className="text-right">
                <p className="text-blue-100">Attendance</p>
                <p className="text-2xl font-bold">{totalAttendance}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card className="p-4 border-blue-200 bg-white">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Hours Logged</p>
                <p className="text-xl font-bold text-slate-900">{totalHours.toFixed(1)}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 border-green-200 bg-white">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Completed Debriefs</p>
                <p className="text-xl font-bold text-slate-900">{completedDebriefs}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 border-amber-200 bg-white">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <FileText className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Pending Debriefs</p>
                <p className="text-xl font-bold text-slate-900">{pendingDebriefs}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 border-purple-200 bg-white">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Classes Attended</p>
                <p className="text-xl font-bold text-slate-900">{totalAttendance}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="debriefs" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Debriefs
            </TabsTrigger>
            <TabsTrigger value="attendance" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Attendance
            </TabsTrigger>
            <TabsTrigger value="questions" className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              Questions
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="meetings" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Meetings
            </TabsTrigger>
            <TabsTrigger value="materials" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Materials
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab - Reminders & Notifications */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Action Items / Reminders */}
              <Card className="border-amber-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-amber-700">
                    <AlertTriangle className="h-5 w-5" />
                    Action Items
                  </CardTitle>
                  <CardDescription>Tasks that need your attention</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {!hasSubmittedThisWeek && (
                    <div
                      className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200 cursor-pointer hover:bg-red-100 transition-colors"
                      onClick={() => {
                        const tabsEl = document.querySelector('[value="debriefs"]') as HTMLElement
                        tabsEl?.click()
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-full">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        </div>
                        <div>
                          <p className="font-medium text-red-900">Submit Weekly Debrief</p>
                          <p className="text-xs text-red-600">
                            Week ending{" "}
                            {new Date(currentWeekEnding).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}{" "}
                            - Log your hours and work summary
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-red-400" />
                    </div>
                  )}

                  {!hasSubmittedLastWeek && (
                    <div
                      className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200 cursor-pointer hover:bg-amber-100 transition-colors"
                      onClick={() => {
                        const tabsEl = document.querySelector('[value="debriefs"]') as HTMLElement
                        tabsEl?.click()
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-full">
                          <Clock className="h-4 w-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="font-medium text-amber-900">Overdue: Last Week's Debrief</p>
                          <p className="text-xs text-amber-600">
                            Week ending{" "}
                            {new Date(lastWeekEnding).toLocaleDateString("en-US", { month: "short", day: "numeric" })} -
                            Please submit ASAP
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-amber-400" />
                    </div>
                  )}

                  {hasSubmittedThisWeek && hasSubmittedLastWeek && (
                    <div className="flex items-center justify-center p-4 text-center text-green-700 bg-green-50 rounded-lg border border-green-200">
                      <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />
                      <span>All debriefs submitted - You're all caught up!</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Notifications */}
              <Card className="border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-blue-700">
                    <Bell className="h-5 w-5" />
                    Notifications
                  </CardTitle>
                  <CardDescription>Updates from your directors</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {debriefs
                    .filter((d) => d.questions && d.status === "reviewed")
                    .slice(0, 2)
                    .map((debrief) => (
                      <div
                        key={debrief.id}
                        className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200 cursor-pointer hover:bg-green-100 transition-colors"
                        onClick={() => {
                          const tabsEl = document.querySelector('[value="questions"]') as HTMLElement
                          tabsEl?.click()
                        }}
                      >
                        <div className="p-2 bg-green-100 rounded-full flex-shrink-0">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-green-900 text-sm">Question Answered</p>
                          <p className="text-xs text-green-600 truncate">{debrief.questions}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-green-400 flex-shrink-0" />
                      </div>
                    ))}

                  {meetingRequests
                    .filter((m) => m.status === "pending")
                    .slice(0, 2)
                    .map((meeting) => (
                      <div
                        key={meeting.id}
                        className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200"
                      >
                        <div className="p-2 bg-amber-100 rounded-full flex-shrink-0">
                          <Clock className="h-4 w-4 text-amber-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-amber-900 text-sm">Meeting Request Pending</p>
                          <p className="text-xs text-amber-600 truncate">{meeting.subject}</p>
                        </div>
                      </div>
                    ))}

                  {meetingRequests
                    .filter((m) => m.status === "scheduled")
                    .slice(0, 1)
                    .map((meeting) => (
                      <div
                        key={meeting.id}
                        className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200"
                      >
                        <div className="p-2 bg-blue-100 rounded-full flex-shrink-0">
                          <Calendar className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-blue-900 text-sm">Meeting Scheduled</p>
                          <p className="text-xs text-blue-600 truncate">{meeting.subject}</p>
                        </div>
                      </div>
                    ))}

                  {recentCourseMaterials.slice(0, 2).map((material) => (
                    <div
                      key={material.id}
                      className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200 cursor-pointer hover:bg-purple-100 transition-colors"
                      onClick={() => window.open(material.file_url, "_blank")}
                    >
                      <div className="p-2 bg-purple-100 rounded-full flex-shrink-0">
                        <BookOpen className="h-4 w-4 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-purple-900 text-sm">New Course Material</p>
                        <p className="text-xs text-purple-600 truncate">{material.title}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-purple-400 flex-shrink-0" />
                    </div>
                  ))}

                  {debriefs.filter((d) => d.questions && d.status === "reviewed").length === 0 &&
                    meetingRequests.length === 0 &&
                    recentCourseMaterials.length === 0 && (
                      <div className="flex items-center justify-center p-4 text-center text-slate-500 bg-slate-50 rounded-lg border border-slate-200">
                        <Bell className="h-5 w-5 mr-2 text-slate-400" />
                        <span>No new notifications</span>
                      </div>
                    )}
                </CardContent>
              </Card>
            </div>

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
                        .querySelector('[value="debriefs"]')
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
                        .querySelector('[value="documents"]')
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
                        .querySelector('[value="meetings"]')
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
                        .querySelector('[value="materials"]')
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
          </TabsContent>

          {/* Debriefs Tab */}
          <TabsContent value="debriefs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Debriefs</CardTitle>
                <CardDescription>Your weekly work submissions and hours logged</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {debriefs.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-8">No debriefs submitted yet</p>
                  ) : (
                    debriefs.map((debrief) => (
                      <Card key={debrief.id} className="border-slate-200">
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-medium text-sm">{debrief.clientName}</p>
                              <p className="text-xs text-slate-500">
                                Week Ending: {new Date(debrief.weekEnding).toLocaleDateString()}
                              </p>
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
                            </div>
                          </div>
                          <p className="text-sm text-slate-700 mb-2">{debrief.workSummary}</p>
                          {debrief.questions && (
                            <div className="bg-amber-50 border border-amber-200 rounded p-2 mt-2">
                              <p className="text-xs font-medium text-amber-800 mb-1">Questions:</p>
                              <p className="text-xs text-amber-700">{debrief.questions}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Attendance Tab */}
          <TabsContent value="attendance">
            <Card>
              <CardHeader>
                <CardTitle>Class Attendance</CardTitle>
                <CardDescription>Your attendance record for this semester</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {attendanceRecords.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-8">No attendance records yet</p>
                  ) : (
                    attendanceRecords.map((record) => (
                      <div
                        key={record.id}
                        className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="font-medium text-sm">
                              Week {record.weekNumber} - {record.clinic}
                            </p>
                            <p className="text-xs text-slate-500">{new Date(record.classDate).toLocaleDateString()}</p>
                          </div>
                        </div>
                        {record.notes && <Badge className="bg-slate-500 text-xs">{record.notes}</Badge>}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Questions Tab */}
          <TabsContent value="questions">
            <Card>
              <CardHeader>
                <CardTitle>Ask a Question</CardTitle>
                <CardDescription>Submit questions to your directors</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="question-type">Question Type</Label>
                  <Select value={questionType} onValueChange={(value: "clinic" | "client") => setQuestionType(value)}>
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
                  {/* Question type description */}
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

                {debriefs.filter((d) => d.questions).length > 0 && (
                  <div className="mt-6 pt-6 border-t">
                    <h3 className="text-sm font-medium mb-3">Your Previous Questions</h3>
                    <div className="space-y-3">
                      {debriefs
                        .filter((d) => d.questions)
                        .slice(0, 5)
                        .map((d) => (
                          <div key={d.id} className="p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                {d.questionType === "client" ? "Client Engagement" : "Clinic"}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(d.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm">{d.questions}</p>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle>Upload Document</CardTitle>
                <CardDescription>Submit presentations, reports, and other materials</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Submission Type</Label>
                  <Select value={submissionType} onValueChange={setSubmissionType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="debrief">Weekly Debrief</SelectItem>
                      <SelectItem value="presentation">Presentation</SelectItem>
                      <SelectItem value="report">Report</SelectItem>
                      <SelectItem value="sow">Statement of Work</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Client</Label>
                  <Input
                    value={documentClient}
                    onChange={(e) => setDocumentClient(e.target.value)}
                    placeholder="Enter client name"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={documentDescription}
                    onChange={(e) => setDocumentDescription(e.target.value)}
                    placeholder="Describe this document..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label>File</Label>
                  <Input type="file" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                </div>
                <Button onClick={handleSubmitDocument} disabled={uploading || !selectedFile}>
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? "Uploading..." : "Upload Document"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Meetings Tab */}
          <TabsContent value="meetings">
            <Card>
              <CardHeader>
                <CardTitle>Meeting Requests</CardTitle>
                <CardDescription>Your meeting requests with directors</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {meetingRequests.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-8">No meeting requests yet</p>
                  ) : (
                    meetingRequests.map((request) => (
                      <div key={request.id} className="p-4 bg-white border border-slate-200 rounded-lg">
                        <p className="font-medium text-sm">{request.directorName}</p>
                        <p className="text-xs text-slate-500">
                          Meeting Requested: {new Date(request.requestedDate).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-slate-700 mt-2">{request.reason}</p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Materials Tab */}
          <TabsContent value="materials">
            <Card>
              <CardHeader>
                <CardTitle>Course Materials</CardTitle>
                <CardDescription>Recent course materials shared with you</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentCourseMaterials.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-8">No course materials yet</p>
                  ) : (
                    recentCourseMaterials.map((material) => (
                      <div key={material.id} className="p-4 bg-white border border-slate-200 rounded-lg">
                        <p className="font-medium text-sm">{material.title}</p>
                        <p className="text-xs text-slate-500">
                          Uploaded: {new Date(material.uploadedDate).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-slate-700 mt-2">{material.description}</p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
