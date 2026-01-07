"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { MainNavigation } from "@/components/main-navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import {
  Users,
  Clock,
  FileText,
  MessageSquare,
  Plus,
  Calendar,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ClipboardList,
  Send,
  Upload,
  File,
  FileSpreadsheet,
  Presentation,
  X,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const DEFAULT_STUDENT_ID = "3f19f7d2-33c4-4637-935e-1aa032012c58" // Collin Merwin

interface TeamMember {
  id: string
  full_name: string
  email: string
  role?: string
  clinic?: string
  totalHours?: number
  debriefCount?: number
}

interface TeamDebrief {
  id: string
  studentName: string
  studentEmail: string
  hoursWorked: number
  workSummary: string
  questions?: string
  weekEnding: string
  createdAt: string
}

interface Deliverable {
  id: string
  fileName: string
  fileUrl: string
  fileType: string
  fileSize?: number
  submissionType: string
  uploadedAt: string
  uploadedBy: string
  status?: string
}

interface ClientEngagement {
  clientId: string
  clientName: string
  clientEmail?: string
  projectType?: string
  status?: string
  teamMembers: TeamMember[]
  totalHours: number
  debriefs: TeamDebrief[]
  deliverables?: Deliverable[]
  sowProgress?: {
    phase: string
    percentComplete: number
    milestones: { name: string; completed: boolean; dueDate?: string }[]
  }
}

export function MyTeamContent() {
  const searchParams = useSearchParams()
  const studentIdFromUrl = searchParams.get("studentId")

  const [loading, setLoading] = useState(true)
  const [currentStudentId, setCurrentStudentId] = useState<string>(DEFAULT_STUDENT_ID)
  const [currentStudentName, setCurrentStudentName] = useState<string>("Loading...")
  const [engagement, setEngagement] = useState<ClientEngagement | null>(null)
  const [newNote, setNewNote] = useState("")
  const [noteCategory, setNoteCategory] = useState("general")
  const [teamNotes, setTeamNotes] = useState<any[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Deliverables state
  const [deliverables, setDeliverables] = useState<Deliverable[]>([])
  const [uploadingDeliverable, setUploadingDeliverable] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedDeliverableType, setSelectedDeliverableType] = useState<string>("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Resolve the student ID from localStorage or URL params
  useEffect(() => {
    // Prefer localStorage (set when user selects a student on dashboard)
    const storedId = typeof window !== "undefined" ? localStorage.getItem("selectedStudentId") : null
    const resolvedId = storedId || studentIdFromUrl || DEFAULT_STUDENT_ID

    setCurrentStudentId(resolvedId)
    loadTeamData(resolvedId)
  }, [studentIdFromUrl])

  const loadTeamData = async (studentId: string) => {
    try {
      setLoading(true)

      // Fetch from v-complete-mapping to get student info
      const mappingRes = await fetch(`/api/supabase/v-complete-mapping?studentId=${studentId}`)
      const mappingData = await mappingRes.json()

      if (mappingData.data && mappingData.data.length > 0) {
        const studentData = mappingData.data[0]
        setCurrentStudentName(studentData.student_name || "Unknown Student")

        // Fetch team workspace data
        const response = await fetch(`/api/team-workspace?studentId=${studentId}&includeDebriefs=true`)
        const data = await response.json()

        if (data.success) {
          setEngagement({
            clientId: data.clientId || "",
            clientName: data.clientName || "No Client Assigned",
            clientEmail: data.clientEmail,
            projectType: data.projectType,
            status: data.status,
            teamMembers: data.teamMembers || [],
            totalHours: data.totalHours || 0,
            debriefs: data.debriefs || [],
            deliverables: data.deliverables || [],
            sowProgress: data.sowProgress,
          })
          setTeamNotes(data.notes || [])
          setDeliverables(data.deliverables || [])
        }
      } else {
        setCurrentStudentName("Unknown Student")
      }
    } catch (error) {
      console.error("[v0] Error loading team data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddNote = async () => {
    if (!newNote.trim()) return
    setSubmitting(true)
    try {
      const response = await fetch("/api/team-workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: currentStudentId,
          noteText: newNote,
          category: noteCategory,
          createdByName: currentStudentName,
        }),
      })
      if (response.ok) {
        setNewNote("")
        setNoteCategory("general")
        setIsDialogOpen(false)
        await loadTeamData(currentStudentId)
      }
    } catch (error) {
      console.error("[v0] Error adding note:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeliverableUpload = async () => {
    if (!selectedFile || !selectedDeliverableType || !engagement?.clientId) {
      alert("Please select a file and deliverable type")
      return
    }

    setUploadingDeliverable(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("studentId", currentStudentId)
      formData.append("studentName", currentStudentName)
      formData.append("clientId", engagement.clientId)
      formData.append("clientName", engagement.clientName)
      formData.append("submissionType", selectedDeliverableType)

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90))
      }, 200)

      const response = await fetch("/api/upload-deliverable", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Upload failed")
      }

      const result = await response.json()
      setUploadProgress(100)

      // Add to local state
      setDeliverables((prev) => [
        {
          id: result.documentId || Date.now().toString(),
          fileName: selectedFile.name,
          fileUrl: result.url,
          fileType: selectedFile.type,
          fileSize: selectedFile.size,
          submissionType: selectedDeliverableType,
          uploadedAt: new Date().toISOString(),
          uploadedBy: currentStudentName,
          status: "submitted",
        },
        ...prev,
      ])

      // Reset form
      setSelectedFile(null)
      setSelectedDeliverableType("")
      alert("Deliverable uploaded successfully!")
    } catch (error: any) {
      console.error("[v0] Upload error:", error)
      alert(`Upload failed: ${error.message}`)
    } finally {
      setUploadingDeliverable(false)
      setUploadProgress(0)
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

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown size"
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getFileIcon = (type: string) => {
    if (type.includes("presentation") || type.includes("powerpoint")) {
      return <Presentation className="h-8 w-8 text-orange-500" />
    }
    if (type.includes("spreadsheet") || type.includes("excel")) {
      return <FileSpreadsheet className="h-8 w-8 text-green-500" />
    }
    if (type.includes("pdf")) {
      return <FileText className="h-8 w-8 text-red-500" />
    }
    return <File className="h-8 w-8 text-[#5f7082]" />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f5f7f9] to-[#e8eef3]">
        <aside className="fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-52 border-r bg-card z-40">
          <MainNavigation />
        </aside>
        <main className="pl-52 pt-14 p-4">
          <div className="flex items-center justify-center h-[calc(100vh-2rem)]">
            <div className="animate-pulse text-[#5f7082]">Loading team data...</div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f7f9] to-[#e8eef3]">
      <aside className="fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-52 border-r bg-card z-40">
        <MainNavigation />
      </aside>
      <main className="pl-52 pt-14 p-4">
        <div className="max-w-7xl mx-auto space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#2d3a4f]">My Team</h1>
              <p className="text-[#5f7082]">Viewing as {currentStudentName}</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#2d3a4f] hover:bg-[#3d4a5f] text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Note
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Team Note</DialogTitle>
                  <DialogDescription>Share updates or questions with your team</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <Select value={noteCategory} onValueChange={setNoteCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="question">Question</SelectItem>
                      <SelectItem value="update">Update</SelectItem>
                      <SelectItem value="blocker">Blocker</SelectItem>
                    </SelectContent>
                  </Select>
                  <Textarea
                    placeholder="Write your note..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={4}
                  />
                  <Button
                    onClick={handleAddNote}
                    disabled={submitting || !newNote.trim()}
                    className="w-full bg-[#2d3a4f] hover:bg-[#3d4a5f]"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {submitting ? "Adding..." : "Add Note"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Client Engagement Overview Card */}
          <Card className="overflow-hidden border-none shadow-lg">
            <div className="bg-gradient-to-r from-[#2d3a4f] to-[#5f7082] p-6 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-white/70 mb-1">Client Engagement</p>
                  <h2 className="text-2xl font-bold">{engagement?.clientName || "No Client Assigned"}</h2>
                  {engagement?.projectType && <p className="text-white/80 mt-1">{engagement.projectType}</p>}
                </div>
                <Badge
                  className={
                    engagement?.status === "Active" ? "bg-[#8fa889] text-[#2d3a4f]" : "bg-[#9aacb8] text-[#2d3a4f]"
                  }
                >
                  {engagement?.status || "Unknown"}
                </Badge>
              </div>
            </div>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-[#f5f7f9] rounded-lg border border-[#9aacb8]/30">
                  <div className="w-10 h-10 bg-[#2d3a4f] rounded-full flex items-center justify-center mx-auto mb-2">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-[#2d3a4f]">{engagement?.teamMembers.length || 0}</p>
                  <p className="text-sm text-[#5f7082]">Team Members</p>
                </div>
                <div className="text-center p-4 bg-[#f5f7f9] rounded-lg border border-[#9aacb8]/30">
                  <div className="w-10 h-10 bg-[#8fa889] rounded-full flex items-center justify-center mx-auto mb-2">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-[#2d3a4f]">{engagement?.totalHours || 0}</p>
                  <p className="text-sm text-[#5f7082]">Total Hours</p>
                </div>
                <div className="text-center p-4 bg-[#f5f7f9] rounded-lg border border-[#9aacb8]/30">
                  <div className="w-10 h-10 bg-[#5f7082] rounded-full flex items-center justify-center mx-auto mb-2">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-[#2d3a4f]">{engagement?.debriefs.length || 0}</p>
                  <p className="text-sm text-[#5f7082]">Debriefs</p>
                </div>
                <div className="text-center p-4 bg-[#f5f7f9] rounded-lg border border-[#9aacb8]/30">
                  <div className="w-10 h-10 bg-[#565f4b] rounded-full flex items-center justify-center mx-auto mb-2">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-[#2d3a4f]">{engagement?.sowProgress?.percentComplete || 0}%</p>
                  <p className="text-sm text-[#5f7082]">Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SOW Progress Card */}
          <Card className="border-none shadow-lg">
            <CardHeader className="border-b border-[#9aacb8]/20 bg-[#f5f7f9]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#8fa889] rounded-lg flex items-center justify-center">
                  <ClipboardList className="h-4 w-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-[#2d3a4f]">SOW Progress</CardTitle>
                  <CardDescription className="text-[#5f7082]">
                    {engagement?.sowProgress?.phase || "Project Phase"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#5f7082]">Overall Progress</span>
                    <span className="font-medium text-[#2d3a4f]">{engagement?.sowProgress?.percentComplete || 0}%</span>
                  </div>
                  <div className="h-3 bg-[#e8eef3] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#8fa889] to-[#565f4b] rounded-full transition-all duration-500"
                      style={{ width: `${engagement?.sowProgress?.percentComplete || 0}%` }}
                    />
                  </div>
                </div>
                {/* Milestones */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                  {(
                    engagement?.sowProgress?.milestones || [
                      { name: "Discovery", completed: true },
                      { name: "Planning", completed: true },
                      { name: "Execution", completed: false },
                      { name: "Delivery", completed: false },
                    ]
                  ).map((milestone, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg text-center ${
                        milestone.completed
                          ? "bg-[#8fa889]/20 border border-[#8fa889]"
                          : "bg-[#f5f7f9] border border-[#9aacb8]/30"
                      }`}
                    >
                      {milestone.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-[#565f4b] mx-auto mb-1" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-[#9aacb8] mx-auto mb-1" />
                      )}
                      <p className={`text-sm font-medium ${milestone.completed ? "text-[#565f4b]" : "text-[#5f7082]"}`}>
                        {milestone.name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs Section */}
          <Tabs defaultValue="timeline" className="space-y-4">
            <TabsList className="bg-[#2d3a4f] p-1">
              <TabsTrigger
                value="timeline"
                className="data-[state=active]:bg-[#8fa889] data-[state=active]:text-[#2d3a4f] text-white/70"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Activity Timeline
              </TabsTrigger>
              <TabsTrigger
                value="team"
                className="data-[state=active]:bg-[#8fa889] data-[state=active]:text-[#2d3a4f] text-white/70"
              >
                <Users className="h-4 w-4 mr-2" />
                Team Members
              </TabsTrigger>
              <TabsTrigger
                value="deliverables"
                className="data-[state=active]:bg-[#8fa889] data-[state=active]:text-[#2d3a4f] text-white/70"
              >
                <Upload className="h-4 w-4 mr-2" />
                Deliverables
              </TabsTrigger>
              <TabsTrigger
                value="notes"
                className="data-[state=active]:bg-[#8fa889] data-[state=active]:text-[#2d3a4f] text-white/70"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Team Notes
              </TabsTrigger>
            </TabsList>

            {/* Timeline Tab */}
            <TabsContent value="timeline">
              <Card className="border-none shadow-lg">
                <CardHeader className="border-b border-[#9aacb8]/20 bg-[#f5f7f9]">
                  <CardTitle className="text-[#2d3a4f]">Activity Timeline</CardTitle>
                  <CardDescription className="text-[#5f7082]">Recent debriefs from all team members</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {engagement?.debriefs && engagement.debriefs.length > 0 ? (
                    <div className="space-y-4">
                      {engagement.debriefs.slice(0, 10).map((debrief, index) => (
                        <div key={debrief.id || index} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <Avatar className="h-10 w-10 border-2 border-[#8fa889]">
                              <AvatarFallback className="bg-[#2d3a4f] text-white text-xs">
                                {getInitials(debrief.studentName || "?")}
                              </AvatarFallback>
                            </Avatar>
                            {index < (engagement?.debriefs?.length || 0) - 1 && (
                              <div className="w-0.5 h-full bg-[#9aacb8]/30 mt-2" />
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <div className="bg-white rounded-lg p-4 border border-[#9aacb8]/30 shadow-sm">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-[#2d3a4f]">{debrief.studentName}</span>
                                <div className="flex items-center gap-2">
                                  <Badge className="bg-[#8fa889]/20 text-[#565f4b] border-none">
                                    {debrief.hoursWorked}h
                                  </Badge>
                                  <span className="text-xs text-[#5f7082]">
                                    {new Date(debrief.weekEnding || debrief.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                              <p className="text-sm text-[#5f7082]">{debrief.workSummary || "No summary provided"}</p>
                              {debrief.questions && (
                                <div className="mt-2 p-2 bg-[#f5f7f9] rounded border-l-2 border-[#8fa889]">
                                  <p className="text-xs text-[#5f7082]">
                                    <span className="font-medium">Question:</span> {debrief.questions}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 text-[#9aacb8] mx-auto mb-4" />
                      <p className="text-[#5f7082]">No debriefs found for this team</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Team Members Tab */}
            <TabsContent value="team">
              <Card className="border-none shadow-lg">
                <CardHeader className="border-b border-[#9aacb8]/20 bg-[#f5f7f9]">
                  <CardTitle className="text-[#2d3a4f]">Team Members</CardTitle>
                  <CardDescription className="text-[#5f7082]">
                    Students assigned to this client engagement
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {engagement?.teamMembers && engagement.teamMembers.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {engagement.teamMembers.map((member) => (
                        <div
                          key={member.id}
                          className="p-4 rounded-lg border border-[#9aacb8]/30 bg-white hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12 border-2 border-[#8fa889]">
                              <AvatarFallback className="bg-[#2d3a4f] text-white">
                                {getInitials(member.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-[#2d3a4f] truncate">{member.full_name}</p>
                              <Badge className="bg-[#5f7082]/20 text-[#5f7082] border-none text-xs">
                                {member.clinic || "No Clinic"}
                              </Badge>
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t border-[#9aacb8]/20 flex justify-between text-sm">
                            <div>
                              <p className="text-[#5f7082]">Hours</p>
                              <p className="font-semibold text-[#2d3a4f]">{member.totalHours || 0}</p>
                            </div>
                            <div>
                              <p className="text-[#5f7082]">Debriefs</p>
                              <p className="font-semibold text-[#2d3a4f]">{member.debriefCount || 0}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 text-[#9aacb8] mx-auto mb-4" />
                      <p className="text-[#5f7082]">No team members found</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Deliverables Tab */}
            <TabsContent value="deliverables">
              <Card className="border-none shadow-lg">
                <CardHeader className="border-b border-[#9aacb8]/20 bg-[#f5f7f9]">
                  <CardTitle className="text-[#2d3a4f]">Deliverables</CardTitle>
                  <CardDescription className="text-[#5f7082]">
                    Upload and manage project deliverables (SOW, Presentations, etc.)
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {/* Upload Section */}
                  <div className="mb-6 p-4 border-2 border-dashed border-[#9aacb8]/50 rounded-lg bg-[#f5f7f9]">
                    <h3 className="text-sm font-semibold text-[#2d3a4f] mb-3">Upload New Deliverable</h3>
                    <div className="grid gap-4 md:grid-cols-3">
                      <Select value={selectedDeliverableType} onValueChange={setSelectedDeliverableType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select deliverable type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sow">Statement of Work (SOW)</SelectItem>
                          <SelectItem value="midterm">Midterm Presentation</SelectItem>
                          <SelectItem value="final">Final Presentation</SelectItem>
                          <SelectItem value="report">Project Report</SelectItem>
                          <SelectItem value="other">Other Document</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="relative">
                        <input
                          type="file"
                          id="deliverable-upload"
                          className="hidden"
                          accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        />
                        <label
                          htmlFor="deliverable-upload"
                          className="flex items-center justify-center gap-2 px-4 py-2 border border-[#9aacb8]/50 rounded-md cursor-pointer hover:bg-white transition-colors h-10"
                        >
                          <Upload className="h-4 w-4 text-[#5f7082]" />
                          <span className="text-sm text-[#5f7082] truncate">
                            {selectedFile ? selectedFile.name : "Choose file..."}
                          </span>
                        </label>
                      </div>
                      <Button
                        onClick={handleDeliverableUpload}
                        disabled={uploadingDeliverable || !selectedFile || !selectedDeliverableType}
                        className="bg-[#2d3a4f] hover:bg-[#3d4a5f]"
                      >
                        {uploadingDeliverable ? (
                          <>Uploading... {uploadProgress}%</>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload
                          </>
                        )}
                      </Button>
                    </div>
                    {uploadingDeliverable && <Progress value={uploadProgress} className="mt-3 h-2" />}
                    {selectedFile && (
                      <div className="mt-3 flex items-center gap-2 text-sm text-[#5f7082]">
                        <File className="h-4 w-4" />
                        <span>{selectedFile.name}</span>
                        <span>({formatFileSize(selectedFile.size)})</span>
                        <button
                          onClick={() => setSelectedFile(null)}
                          className="ml-auto text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Deliverables List */}
                  {deliverables.length > 0 ? (
                    <div className="space-y-3">
                      {deliverables.map((deliverable) => (
                        <div
                          key={deliverable.id}
                          className="flex items-center gap-4 p-4 rounded-lg border border-[#9aacb8]/30 bg-white hover:shadow-md transition-shadow"
                        >
                          {getFileIcon(deliverable.fileType)}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-[#2d3a4f] truncate">{deliverable.fileName}</p>
                            <div className="flex items-center gap-2 text-xs text-[#5f7082]">
                              <Badge className="bg-[#8fa889]/20 text-[#565f4b] border-none">
                                {deliverable.submissionType.toUpperCase()}
                              </Badge>
                              <span>Uploaded by {deliverable.uploadedBy}</span>
                              <span>•</span>
                              <span>{new Date(deliverable.uploadedAt).toLocaleDateString()}</span>
                              {deliverable.fileSize && (
                                <>
                                  <span>•</span>
                                  <span>{formatFileSize(deliverable.fileSize)}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              className={
                                deliverable.status === "graded"
                                  ? "bg-[#8fa889] text-white"
                                  : deliverable.status === "reviewed"
                                    ? "bg-[#5f7082] text-white"
                                    : "bg-[#9aacb8]/30 text-[#5f7082]"
                              }
                            >
                              {deliverable.status || "Submitted"}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(deliverable.fileUrl, "_blank")}
                            >
                              View
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Upload className="h-12 w-12 text-[#9aacb8] mx-auto mb-4" />
                      <p className="text-[#5f7082]">No deliverables uploaded yet</p>
                      <p className="text-sm text-[#9aacb8] mt-1">
                        Upload your SOW, presentations, and other project documents above
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notes Tab */}
            <TabsContent value="notes">
              <Card className="border-none shadow-lg">
                <CardHeader className="border-b border-[#9aacb8]/20 bg-[#f5f7f9]">
                  <CardTitle className="text-[#2d3a4f]">Team Notes</CardTitle>
                  <CardDescription className="text-[#5f7082]">Collaborative notes and updates</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {teamNotes.length > 0 ? (
                    <div className="space-y-4">
                      {teamNotes.map((note, index) => (
                        <div key={note.id || index} className="p-4 rounded-lg border border-[#9aacb8]/30 bg-white">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-[#5f7082] text-white text-xs">
                                  {getInitials(note.created_by_name || "?")}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-[#2d3a4f]">{note.created_by_name}</span>
                            </div>
                            <Badge className="bg-[#8fa889]/20 text-[#565f4b] border-none text-xs">
                              {note.category || "general"}
                            </Badge>
                          </div>
                          <p className="text-sm text-[#5f7082]">{note.note_text}</p>
                          <p className="text-xs text-[#9aacb8] mt-2">{new Date(note.created_at).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <MessageSquare className="h-12 w-12 text-[#9aacb8] mx-auto mb-4" />
                      <p className="text-[#5f7082]">No team notes yet</p>
                      <Button className="mt-4 bg-[#2d3a4f] hover:bg-[#3d4a5f]" onClick={() => setIsDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Note
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
