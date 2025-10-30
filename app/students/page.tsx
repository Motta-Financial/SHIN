"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Briefcase,
  Clock,
  Calendar,
  Users,
  MessageSquare,
  HelpCircle,
  Send,
  AlertCircle,
  CheckCircle,
  Upload,
  FileText,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { upload } from "@vercel/blob/client"

interface Debrief {
  id: string
  fields: {
    Client?: string
    "Number of Hours Worked"?: number
    "Summary of Work"?: string
    "Date Submitted"?: string
    "Related Clinic"?: string
    "NAME (from SEED | Students)"?: string[]
    Questions?: string
  }
}

interface Student {
  id: string
  fields: {
    NAME?: string
    "Email Address"?: string
    "Related Clinic"?: string
    "Number of Hours Worked (from SHIN | Client Debriefs)"?: number[]
    "SEED| Attendance"?: string[]
  }
}

interface AttendanceRecord {
  id: string
  fields: {
    "Week Number"?: number
    Date?: string
    "Class Date"?: string
    Week?: string
    [key: string]: any
  }
}

const CLINIC_COLORS = {
  Consulting: { bg: "bg-[#4A6FA5]/10", border: "border-[#4A6FA5]/30", text: "text-[#4A6FA5]" },
  Accounting: { bg: "bg-[#5B7C99]/10", border: "border-[#5B7C99]/30", text: "text-[#5B7C99]" },
  Funding: { bg: "bg-[#8B7B8B]/10", border: "border-[#8B7B8B]/30", text: "text-[#8B7B8B]" },
  Marketing: { bg: "bg-[#C4B5C4]/10", border: "border-[#C4B5C4]/30", text: "text-[#C4B5C4]" },
}

export default function StudentDashboard() {
  const [students, setStudents] = useState<Student[]>([])
  const [debriefs, setDebriefs] = useState<Debrief[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [questionText, setQuestionText] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [openDialog, setOpenDialog] = useState<"hours" | "clients" | "submissions" | "attendance" | null>(null)

  const [documentDescription, setDocumentDescription] = useState("")
  const [documentClient, setDocumentClient] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadedFileUrl, setUploadedFileUrl] = useState("")
  const [uploading, setUploading] = useState(false)
  const [submittingDocument, setSubmittingDocument] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [submissionType, setSubmissionType] = useState<"midterm" | "final" | "draft" | "other">("midterm")

  const [expandedSections, setExpandedSections] = useState({
    submitWork: false,
    askQuestion: false,
    myQuestions: false,
    workHistory: false,
  })

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  useEffect(() => {
    async function fetchData() {
      try {
        const [rosterRes, debriefsRes] = await Promise.all([
          fetch("/api/airtable/roster"),
          fetch("/api/airtable/debriefs"),
        ])

        const rosterData = await rosterRes.json()
        const debriefsData = await debriefsRes.json()

        setStudents(rosterData.records || [])
        setDebriefs(debriefsData.records || [])

        const loggedInStudent = "Declan Leahy"
        const currentStudent = rosterData.records?.find((s: Student) => s.fields.NAME === loggedInStudent)

        if (currentStudent?.fields["SEED| Attendance"]?.length > 0) {
          const attendanceIds = currentStudent.fields["SEED| Attendance"].join(",")
          const attendanceRes = await fetch(`/api/airtable/attendance?recordIds=${attendanceIds}`)
          const attendanceData = await attendanceRes.json()
          console.log("[v0] Attendance data fetched:", attendanceData)
          setAttendanceRecords(attendanceData.records || [])
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const loggedInStudent = "Declan Leahy"

  const currentStudent = students.find((s) => s.fields.NAME === loggedInStudent)
  const studentDebriefs = debriefs.filter((d) => d.fields["NAME (from SEED | Students)"]?.[0] === loggedInStudent)

  const debriefsWithQuestions = studentDebriefs.filter(
    (d) => d.fields.Questions && d.fields.Questions.trim().length > 0,
  )

  const totalHours =
    currentStudent?.fields["Number of Hours Worked (from SHIN | Client Debriefs)"]?.reduce(
      (sum, hours) => sum + hours,
      0,
    ) || 0

  const uniqueClients = new Set(studentDebriefs.map((d) => d.fields.Client).filter(Boolean))
  const clientCount = uniqueClients.size

  const clinic = currentStudent?.fields["Related Clinic"] || "Unknown"
  const clinicColor = CLINIC_COLORS[clinic as keyof typeof CLINIC_COLORS] || CLINIC_COLORS.Consulting

  const attendanceCount = currentStudent?.fields["SEED| Attendance"]?.length || 0

  const handleSubmitQuestion = async () => {
    if (!questionText.trim()) return

    setSubmitting(true)
    try {
      const response = await fetch("/api/airtable/debriefs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentName: loggedInStudent,
          question: questionText,
          clinic: clinic,
        }),
      })

      if (response.ok) {
        const debriefsRes = await fetch("/api/airtable/debriefs")
        const debriefsData = await debriefsRes.json()
        setDebriefs(debriefsData.records || [])
        setQuestionText("")
      } else {
        console.error("Failed to submit question")
      }
    } catch (error) {
      console.error("Error submitting question:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0])
    }
  }

  const handleUploadFile = async () => {
    if (!selectedFile) return

    const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
    if (selectedFile.size > MAX_FILE_SIZE) {
      alert(`File size exceeds 50MB limit. Please choose a smaller file.`)
      setSelectedFile(null)
      return
    }

    setUploading(true)
    try {
      console.log(
        "[v0] Starting client-side upload:",
        selectedFile.name,
        "Size:",
        (selectedFile.size / 1024 / 1024).toFixed(2),
        "MB",
      )

      const newBlob = await upload(selectedFile.name, selectedFile, {
        access: "public",
        handleUploadUrl: "/api/upload",
      })

      setUploadedFileUrl(newBlob.url)
      console.log("[v0] File uploaded successfully:", newBlob.url)
    } catch (error: any) {
      console.error("[v0] Upload error:", error)
      alert(error?.message || "An error occurred while uploading. Please try again.")
      setSelectedFile(null)
      setUploadedFileUrl("")
    } finally {
      setUploading(false)
    }
  }

  const handleSubmitDocument = async () => {
    if (!documentDescription.trim() || !documentClient.trim()) {
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentName: loggedInStudent,
          clientName: documentClient,
          fileUrl: uploadedFileUrl,
          fileName: selectedFile?.name || "document",
          description: documentDescription,
          clinic: clinic,
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
    if (selectedFile && !uploadedFileUrl && !uploading) {
      handleUploadFile()
    }
  }, [selectedFile])

  const hoursByWeek = studentDebriefs.reduce(
    (acc, debrief) => {
      const date = debrief.fields["Date Submitted"]
      if (date) {
        const weekStart = new Date(date)
        weekStart.setDate(weekStart.getDate() - weekStart.getDay())
        const weekKey = weekStart.toISOString().split("T")[0]

        if (!acc[weekKey]) {
          acc[weekKey] = { week: weekKey, hours: 0, submissions: 0 }
        }
        acc[weekKey].hours += debrief.fields["Number of Hours Worked"] || 0
        acc[weekKey].submissions += 1
      }
      return acc
    },
    {} as Record<string, { week: string; hours: number; submissions: number }>,
  )

  const hoursBreakdown = Object.values(hoursByWeek).sort(
    (a, b) => new Date(b.week).getTime() - new Date(a.week).getTime(),
  )

  const hoursByClient = studentDebriefs.reduce(
    (acc, debrief) => {
      const client = debrief.fields.Client || "Unknown"
      if (!acc[client]) {
        acc[client] = { client, hours: 0, submissions: 0 }
      }
      acc[client].hours += debrief.fields["Number of Hours Worked"] || 0
      acc[client].submissions += 1
      return acc
    },
    {} as Record<string, { client: string; hours: number; submissions: number }>,
  )

  const clientsBreakdown = Object.values(hoursByClient).sort((a, b) => b.hours - a.hours)

  const calculateWeekNumber = (dateString: string) => {
    const semesterStart = new Date("2025-09-07") // First week of Fall 2025 semester
    const attendanceDate = new Date(dateString)
    const diffTime = attendanceDate.getTime() - semesterStart.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    const weekNumber = Math.floor(diffDays / 7) + 1
    return weekNumber > 0 ? weekNumber : 1
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-lg text-slate-600">Loading student dashboard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="rounded-lg bg-[#1A2332] p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Welcome, {currentStudent?.fields.NAME?.split(" ")[0]}</h1>
              <p className="mt-2 text-slate-300">Track your hours, clients, and work submissions</p>
            </div>
            <Badge variant="outline" className="border-white/30 bg-white/10 text-white">
              {clinic} Clinic
            </Badge>
          </div>
        </div>

        {/* Weekly Debrief Reminder */}
        <Card className="border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50 shadow-md">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-amber-100 p-2">
                <AlertCircle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">Weekly Debrief Due</h3>
                <p className="text-xs text-slate-600 flex items-center gap-2 mt-0.5">
                  Password:{" "}
                  <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 text-xs">
                    SEED2025
                  </Badge>
                </p>
              </div>
            </div>
            <Button asChild size="sm" className="bg-amber-600 hover:bg-amber-700 text-white shadow-sm">
              <a
                href="https://airtable.com/appv3eSA0Ab2lJLe0/pagjmAO5txWTZGMMl/form"
                target="_blank"
                rel="noopener noreferrer"
              >
                Fill Out Form
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* Stats Overview */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card
            className="border-slate-200/60 shadow-sm cursor-pointer transition-all hover:shadow-md hover:scale-105"
            onClick={() => setOpenDialog("hours")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Hours</CardTitle>
              <Clock className="h-4 w-4 text-[#4A6FA5]" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{totalHours}</div>
              <p className="text-xs text-slate-500">Hours worked this semester</p>
            </CardContent>
          </Card>

          <Card
            className="border-slate-200/60 shadow-sm cursor-pointer transition-all hover:shadow-md hover:scale-105"
            onClick={() => setOpenDialog("clients")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Clients Served</CardTitle>
              <Briefcase className="h-4 w-4 text-[#5B7C99]" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{clientCount}</div>
              <p className="text-xs text-slate-500">Unique clients this semester</p>
            </CardContent>
          </Card>

          <Card
            className="border-slate-200/60 shadow-sm cursor-pointer transition-all hover:shadow-md hover:scale-105"
            onClick={() => setOpenDialog("submissions")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Work Submissions</CardTitle>
              <Users className="h-4 w-4 text-[#8B7B8B]" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{studentDebriefs.length}</div>
              <p className="text-xs text-slate-500">Total debriefs submitted</p>
            </CardContent>
          </Card>

          <Card
            className="border-slate-200/60 shadow-sm cursor-pointer transition-all hover:shadow-md hover:scale-105"
            onClick={() => setOpenDialog("attendance")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Attendance</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{attendanceCount}</div>
              <p className="text-xs text-slate-500">Sessions attended</p>
            </CardContent>
          </Card>
        </div>

        {/* Total Hours Dialog */}
        <Dialog open={openDialog === "hours"} onOpenChange={(open) => !open && setOpenDialog(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-[#4A6FA5]" />
                Hours Breakdown
              </DialogTitle>
              <DialogDescription>Detailed breakdown of your {totalHours} hours worked this semester</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {hoursBreakdown.map((week) => (
                <div
                  key={week.week}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4"
                >
                  <div>
                    <p className="font-medium text-slate-900">
                      Week of{" "}
                      {new Date(week.week).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-sm text-slate-600">
                      {week.submissions} submission{week.submissions !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-[#4A6FA5]">{week.hours}</p>
                    <p className="text-xs text-slate-500">hours</p>
                  </div>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* Clients Served Dialog */}
        <Dialog open={openDialog === "clients"} onOpenChange={(open) => !open && setOpenDialog(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-[#5B7C99]" />
                Clients Served
              </DialogTitle>
              <DialogDescription>All {clientCount} clients you've worked with this semester</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {clientsBreakdown.map((client) => (
                <div
                  key={client.client}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4"
                >
                  <div>
                    <p className="font-medium text-slate-900">{client.client}</p>
                    <p className="text-sm text-slate-600">
                      {client.submissions} submission{client.submissions !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-[#5B7C99]">{client.hours}</p>
                    <p className="text-xs text-slate-500">hours</p>
                  </div>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* Work Submissions Dialog */}
        <Dialog open={openDialog === "submissions"} onOpenChange={(open) => !open && setOpenDialog(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-[#8B7B8B]" />
                Work Submissions
              </DialogTitle>
              <DialogDescription>
                All {studentDebriefs.length} debriefs you've submitted this semester
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {studentDebriefs
                .sort((a, b) => {
                  const dateA = new Date(a.fields["Date Submitted"] || "")
                  const dateB = new Date(b.fields["Date Submitted"] || "")
                  return dateB.getTime() - dateA.getTime()
                })
                .map((debrief) => (
                  <div key={debrief.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-900">{debrief.fields.Client}</h3>
                          <Badge variant="outline" className="text-[#8B7B8B] border-[#8B7B8B]">
                            {debrief.fields["Related Clinic"]}
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm text-slate-700 line-clamp-2">{debrief.fields["Summary of Work"]}</p>
                        <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1 font-medium">
                            <Clock className="h-3 w-3" />
                            {debrief.fields["Number of Hours Worked"]} hours
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(debrief.fields["Date Submitted"] || "").toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* Attendance Dialog */}
        <Dialog open={openDialog === "attendance"} onOpenChange={(open) => !open && setOpenDialog(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Attendance Record
              </DialogTitle>
              <DialogDescription>Your attendance records for this semester</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {attendanceRecords.length > 0 ? (
                <>
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
                    <CheckCircle className="mx-auto h-10 w-10 text-green-600 mb-2" />
                    <p className="text-2xl font-bold text-green-900">{attendanceRecords.length}</p>
                    <p className="text-sm text-green-700 mt-1">Sessions attended</p>
                  </div>
                  <div className="space-y-2">
                    {attendanceRecords
                      .sort((a, b) => {
                        const dateA = new Date(a.fields.Date || a.fields["Class Date"] || "")
                        const dateB = new Date(b.fields.Date || b.fields["Class Date"] || "")
                        return dateB.getTime() - dateA.getTime()
                      })
                      .map((record) => {
                        const date = record.fields.Date || record.fields["Class Date"] || record.fields.Week
                        const weekNumber = date
                          ? calculateWeekNumber(date)
                          : record.fields["Week Number"] || record.fields.Week || "?"

                        return (
                          <div
                            key={record.id}
                            className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50/50 p-4"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-700">
                                W{weekNumber}
                              </div>
                              <div>
                                <p className="font-medium text-slate-900">
                                  Week {weekNumber}
                                  {date && (
                                    <span className="text-slate-600 font-normal">
                                      {" "}
                                      •{" "}
                                      {new Date(date).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                      })}
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs text-slate-600">Class session attended</p>
                              </div>
                            </div>
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          </div>
                        )
                      })}
                  </div>
                </>
              ) : (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center">
                  <Calendar className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                  <p className="text-slate-600">No attendance records yet</p>
                  <p className="text-sm text-slate-500 mt-1">Your attendance will be tracked here</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Card className="border-slate-200/60 shadow-sm">
          <CardHeader
            className="cursor-pointer hover:bg-purple-50/30 transition-colors p-3"
            onClick={() => toggleSection("submitWork")}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-purple-600" />
                <div>
                  <CardTitle className="text-sm text-slate-900">Submit Work for Feedback</CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-0.5">
                    Upload documents for director review
                  </CardDescription>
                </div>
              </div>
              {expandedSections.submitWork ? (
                <ChevronUp className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              )}
            </div>
          </CardHeader>
          {expandedSections.submitWork && (
            <CardContent className="pt-0 pb-3 px-3">
              <div className="flex gap-1 mb-3 p-1 bg-slate-100 rounded-lg">
                <button
                  onClick={() => setSubmissionType("midterm")}
                  className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    submissionType === "midterm"
                      ? "bg-white text-purple-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Midterm PPT
                </button>
                <button
                  onClick={() => setSubmissionType("final")}
                  className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    submissionType === "final"
                      ? "bg-white text-purple-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Final PPT
                </button>
                <button
                  onClick={() => setSubmissionType("draft")}
                  className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    submissionType === "draft"
                      ? "bg-white text-purple-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Draft Work
                </button>
                <button
                  onClick={() => setSubmissionType("other")}
                  className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    submissionType === "other"
                      ? "bg-white text-purple-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Other
                </button>
              </div>

              <div className="space-y-2.5">
                <div>
                  <label className="text-xs font-medium text-slate-700 mb-1 block">Client Name</label>
                  <input
                    type="text"
                    placeholder="Which client is this work for?"
                    value={documentClient}
                    onChange={(e) => setDocumentClient(e.target.value)}
                    className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-xs focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500/20"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 mb-1 block">Upload File</label>
                  <div
                    className={`relative rounded-lg border-2 border-dashed transition-colors ${
                      dragActive
                        ? "border-purple-500 bg-purple-50"
                        : "border-slate-300 bg-slate-50 hover:border-purple-400"
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                    />

                    {selectedFile ? (
                      <div className="p-2">
                        <div className="flex items-center justify-between rounded-lg border border-purple-200 bg-purple-50 p-2">
                          <div className="flex items-center gap-2">
                            <div className="rounded-full bg-purple-100 p-1.5">
                              <FileText className="h-3 w-3 text-purple-600" />
                            </div>
                            <div>
                              <p className="text-xs font-medium text-slate-900 truncate max-w-[200px]">
                                {selectedFile.name}
                              </p>
                              <p className="text-[10px] text-slate-500">
                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                {uploading && " • Uploading..."}
                                {uploadedFileUrl && " • Ready"}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedFile(null)
                              setUploadedFileUrl("")
                            }}
                            className="rounded-full p-1 hover:bg-purple-100 transition-colors"
                          >
                            <X className="h-3 w-3 text-slate-600" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label
                        htmlFor="file-upload"
                        className="flex cursor-pointer flex-col items-center justify-center p-4 text-center"
                      >
                        <div className="rounded-full bg-purple-100 p-2 mb-2">
                          <Upload className="h-4 w-4 text-purple-600" />
                        </div>
                        <p className="text-xs font-medium text-slate-700 mb-0.5">Drop file or click to browse</p>
                        <p className="text-[10px] text-slate-500">PDF, Word, Excel, PowerPoint</p>
                      </label>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 mb-1 block">Notes (Optional)</label>
                  <Textarea
                    placeholder="Add any notes or context..."
                    value={documentDescription}
                    onChange={(e) => setDocumentDescription(e.target.value)}
                    className="min-h-[60px] resize-none border-slate-200 focus:border-purple-500 focus:ring-purple-500 text-xs"
                  />
                </div>

                <Button
                  onClick={handleSubmitDocument}
                  disabled={!documentClient.trim() || !uploadedFileUrl || uploading || submittingDocument}
                  size="sm"
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white h-8 text-xs"
                >
                  <FileText className="mr-1.5 h-3.5 w-3.5" />
                  {uploading ? "Uploading..." : submittingDocument ? "Submitting..." : "Submit for Review"}
                </Button>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Ask Your Director a Question Section */}
        <Card className="border-slate-200/60 shadow-sm">
          <CardHeader
            className="cursor-pointer hover:bg-blue-50/30 transition-colors p-4"
            onClick={() => toggleSection("askQuestion")}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-[#4A6FA5]" />
                <div>
                  <CardTitle className="text-base text-slate-900">Ask Your Director</CardTitle>
                  <CardDescription className="text-xs text-slate-600 mt-0.5">
                    Submit questions to your clinic director
                  </CardDescription>
                </div>
              </div>
              {expandedSections.askQuestion ? (
                <ChevronUp className="h-5 w-5 text-slate-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-slate-400" />
              )}
            </div>
          </CardHeader>
          {expandedSections.askQuestion && (
            <CardContent className="pt-0 pb-4 px-4">
              <div className="space-y-4">
                <Textarea
                  placeholder="Type your question here..."
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  className="min-h-[100px] resize-none border-slate-200 focus:border-[#4A6FA5] focus:ring-[#4A6FA5] text-sm"
                />
                <Button
                  onClick={handleSubmitQuestion}
                  disabled={!questionText.trim() || submitting}
                  size="sm"
                  className="bg-[#4A6FA5] hover:bg-[#3d5a85] text-white"
                >
                  <Send className="mr-2 h-4 w-4" />
                  {submitting ? "Submitting..." : "Submit Question"}
                </Button>
              </div>
            </CardContent>
          )}
        </Card>

        {/* My Questions Section */}
        {debriefsWithQuestions.length > 0 && (
          <Card className="border-slate-200/60 shadow-sm">
            <CardHeader
              className="cursor-pointer hover:bg-amber-50/30 transition-colors p-4"
              onClick={() => toggleSection("myQuestions")}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-amber-600" />
                  <div>
                    <CardTitle className="text-base text-slate-900">My Questions</CardTitle>
                    <CardDescription className="text-xs text-slate-600 mt-0.5">
                      {debriefsWithQuestions.length} question{debriefsWithQuestions.length !== 1 ? "s" : ""} submitted
                    </CardDescription>
                  </div>
                </div>
                {expandedSections.myQuestions ? (
                  <ChevronUp className="h-5 w-5 text-slate-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                )}
              </div>
            </CardHeader>
            {expandedSections.myQuestions && (
              <CardContent className="pt-0 pb-4 px-4">
                <div className="space-y-3">
                  {debriefsWithQuestions
                    .sort((a, b) => {
                      const dateA = new Date(a.fields["Date Submitted"] || "")
                      const dateB = new Date(b.fields["Date Submitted"] || "")
                      return dateB.getTime() - dateA.getTime()
                    })
                    .map((debrief) => (
                      <div key={debrief.id} className="rounded-lg border border-amber-200/60 bg-amber-50/30 p-3">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 rounded-full bg-amber-100 p-1.5">
                            <HelpCircle className="h-3.5 w-3.5 text-amber-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-sm font-semibold text-slate-900">{debrief.fields.Client}</span>
                              <Badge variant="outline" className="text-xs text-amber-700 border-amber-300">
                                {debrief.fields["Related Clinic"]}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-700 leading-relaxed mb-1.5">{debrief.fields.Questions}</p>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <Calendar className="h-3 w-3" />
                              {new Date(debrief.fields["Date Submitted"] || "").toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Recent Work */}
        <Card className="border-slate-200/60 shadow-sm">
          <CardHeader
            className="cursor-pointer hover:bg-slate-50 transition-colors p-4"
            onClick={() => toggleSection("workHistory")}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-slate-600" />
                <div>
                  <CardTitle className="text-base text-slate-900">My Work History</CardTitle>
                  <CardDescription className="text-xs text-slate-600 mt-0.5">
                    {studentDebriefs.length} submission{studentDebriefs.length !== 1 ? "s" : ""} this semester
                  </CardDescription>
                </div>
              </div>
              {expandedSections.workHistory ? (
                <ChevronUp className="h-5 w-5 text-slate-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-slate-400" />
              )}
            </div>
          </CardHeader>
          {expandedSections.workHistory && (
            <CardContent className="pt-0 pb-4 px-4">
              {studentDebriefs.length === 0 ? (
                <div className="py-8 text-center">
                  <Briefcase className="mx-auto h-10 w-10 text-slate-300" />
                  <p className="mt-3 text-sm text-slate-500">No work submissions yet</p>
                  <p className="mt-1 text-xs text-slate-400">Your debriefs will appear here once submitted</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {studentDebriefs
                    .sort((a, b) => {
                      const dateA = new Date(a.fields["Date Submitted"] || "")
                      const dateB = new Date(b.fields["Date Submitted"] || "")
                      return dateB.getTime() - dateA.getTime()
                    })
                    .map((debrief) => (
                      <div key={debrief.id} className={`rounded-lg border p-3 ${clinicColor.bg} ${clinicColor.border}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-semibold text-slate-900">{debrief.fields.Client}</h3>
                              <Badge variant="outline" className={`text-xs ${clinicColor.text} border-current`}>
                                {debrief.fields["Related Clinic"]}
                              </Badge>
                            </div>
                            <p className="mt-1.5 text-sm text-slate-700 line-clamp-2">
                              {debrief.fields["Summary of Work"]}
                            </p>

                            {debrief.fields.Questions && debrief.fields.Questions.trim().length > 0 && (
                              <div className="mt-2 rounded-md bg-amber-50 border border-amber-200 p-2">
                                <div className="flex items-start gap-2">
                                  <MessageSquare className="h-3.5 w-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1">
                                    <p className="text-xs font-medium text-amber-900 mb-0.5">Question:</p>
                                    <p className="text-xs text-amber-800 line-clamp-2">{debrief.fields.Questions}</p>
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                              <span className="flex items-center gap-1 font-medium">
                                <Clock className="h-3 w-3" />
                                {debrief.fields["Number of Hours Worked"]} hours
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(debrief.fields["Date Submitted"] || "").toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
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
          )}
        </Card>
      </div>
    </div>
  )
}
