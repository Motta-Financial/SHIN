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
  Eye,
  Check,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  FileUp,
} from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { createBrowserClient } from "@supabase/ssr"
import { useDemoStudent, STORAGE_KEY } from "./demo-student-selector"
import type { ClientEngagement, Deliverable, TeamNote } from "@/types"

function getSupabaseClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

function getDeliverableTypeLabel(type: string | undefined): string {
  const labels: Record<string, string> = {
    sow: "SOW",
    final: "Final Presentation",
    progress: "Progress Report",
    other: "Other Document",
  }
  return labels[type || "other"] || type || "Document"
}

export function MyTeamContent() {
  const searchParams = useSearchParams()
  const studentIdFromUrl = searchParams.get("studentId")

  const demoStudentId = useDemoStudent()

  const [loading, setLoading] = useState(true)
  const [currentStudentId, setCurrentStudentId] = useState<string>("") // Initialize with empty string
  const [currentStudentName, setCurrentStudentName] = useState<string>("Loading...")
  const [engagement, setEngagement] = useState<ClientEngagement | null>(null)
  const [newNote, setNewNote] = useState("")
  const [noteCategory, setNoteCategory] = useState("general")
  const [teamNotes, setTeamNotes] = useState<TeamNote[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Deliverables state
  const [deliverables, setDeliverables] = useState<Deliverable[]>([])
  const [uploadingDeliverable, setUploadingDeliverable] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedDeliverableType, setSelectedDeliverableType] = useState<string>("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const [editingDocId, setEditingDocId] = useState<string | null>(null)
  const [editingDeliverable, setEditingDeliverable] = useState<string | null>(null)
  const [editFileName, setEditFileName] = useState("")
  const [editSubmissionType, setEditSubmissionType] = useState("")
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [expandedTimelineItems, setExpandedTimelineItems] = useState<Set<string>>(new Set())
  const [savingEdit, setSavingEdit] = useState(false) // Declare savingEdit state

  useEffect(() => {
    const handleDemoChange = (e: CustomEvent<{ studentId: string }>) => {
      console.log("[v0] MyTeamContent received demoStudentChanged:", e.detail.studentId)
      setCurrentStudentId(e.detail.studentId)
      loadTeamData(e.detail.studentId)
    }

    window.addEventListener("demoStudentChanged", handleDemoChange as EventListener)
    return () => {
      window.removeEventListener("demoStudentChanged", handleDemoChange as EventListener)
    }
  }, [])

  useEffect(() => {
    const storedId = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null
    const resolvedId = studentIdFromUrl || storedId || demoStudentId

    console.log(
      "[v0] Student ID resolution - URL:",
      studentIdFromUrl,
      "localStorage:",
      storedId,
      "demoHook:",
      demoStudentId,
      "resolved:",
      resolvedId,
    )

    if (resolvedId !== currentStudentId) {
      setCurrentStudentId(resolvedId)
      loadTeamData(resolvedId)
    }
  }, [studentIdFromUrl, demoStudentId, currentStudentId]) // Added currentStudentId to dependency array

  const loadTeamData = async (studentId: string) => {
    try {
      setLoading(true)
      console.log("[v0] loadTeamData called with studentId:", studentId)

      // Fetch from v-complete-mapping to get student info
      const mappingRes = await fetch(`/api/supabase/v-complete-mapping?studentId=${studentId}`)
      const mappingData = await mappingRes.json()

      if (mappingData.data && mappingData.data.length > 0) {
        const studentData = mappingData.data[0]
        setCurrentStudentName(studentData.student_name || "Unknown Student")

        // Fetch team workspace data
        const response = await fetch(`/api/team-workspace?studentId=${studentId}&includeDebriefs=true`)
        const data = await response.json()

        console.log("[v0] Team workspace response - debriefs count:", data.debriefs?.length || 0)
        console.log(
          "[v0] Team workspace debriefs:",
          JSON.stringify(
            data.debriefs?.slice(0, 3).map((d: any) => ({
              id: d.id,
              studentName: d.studentName,
              workSummary: d.workSummary?.substring(0, 50),
              clientName: d.clientName,
            })),
            null,
            2,
          ),
        )
        console.log("[v0] Team workspace response - deliverables count:", data.deliverables?.length || 0)

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
          console.log("[v0] Deliverables state set to:", data.deliverables?.length || 0, "items")
        }
      } else {
        setCurrentStudentName("Unknown Student")
        // Clear engagement data if student is not found
        setEngagement(null)
        setTeamNotes([])
        setDeliverables([])
      }
    } catch (error) {
      console.error("[v0] Error loading team data:", error)
      // Reset engagement data in case of error
      setEngagement(null)
      setTeamNotes([])
      setDeliverables([])
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
      } else {
        const errorData = await response.json()
        alert(`Failed to add note: ${errorData.error || response.statusText}`)
      }
    } catch (error) {
      console.error("[v0] Error adding note:", error)
      alert("An unexpected error occurred while adding your note.")
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
      const supabase = getSupabaseClient()

      // Create file path
      const timestamp = Date.now()
      const sanitizedFileName = selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, "_")
      const filePath = `deliverables/${engagement.clientId}/${selectedDeliverableType}/${timestamp}_${sanitizedFileName}`

      console.log("[v0] Starting direct Supabase upload:", filePath, "Size:", selectedFile.size)

      // Upload directly to Supabase Storage from client
      // This bypasses the Next.js API route body size limit
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("SHIN")
        .upload(filePath, selectedFile, {
          cacheControl: "3600",
          upsert: true,
          // Track progress (works with large files)
        })

      if (uploadError) {
        console.error("[v0] Direct upload error:", uploadError)
        throw new Error(uploadError.message)
      }

      console.log("[v0] Upload successful:", uploadData?.path)
      setUploadProgress(50) // File uploaded, now saving record

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("SHIN").getPublicUrl(filePath)

      console.log("[v0] Public URL:", publicUrl)

      // Save document record via API (small JSON payload, no file)
      const response = await fetch("/api/upload-deliverable/save-record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: selectedFile.name,
          fileUrl: publicUrl,
          fileType: selectedFile.type,
          fileSize: selectedFile.size,
          filePath: filePath,
          studentId: currentStudentId,
          studentName: currentStudentName,
          clientId: engagement.clientId,
          clientName: engagement.clientName,
          submissionType: selectedDeliverableType,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save document record")
      }

      setUploadProgress(100)
      console.log("[v0] Document record saved")

      // Success - refresh deliverables list
      await loadTeamData(currentStudentId)
      setSelectedFile(null)
      setSelectedDeliverableType("")
      alert("Deliverable uploaded successfully!")
    } catch (error) {
      console.error("[v0] Upload error:", error)
      alert(`Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setUploadingDeliverable(false)
      setUploadProgress(0)
    }
  }

  const handleStartEdit = (deliverable: Deliverable) => {
    setEditingDocId(deliverable.id)
    setEditFileName(deliverable.fileName)
    setEditSubmissionType(deliverable.submissionType || "other")
  }

  const handleCancelEdit = () => {
    setEditingDocId(null)
    setEditFileName("")
    setEditSubmissionType("")
  }

  const handleSaveEdit = async (docId: string) => {
    try {
      setSavingEdit(true) // Use the declared state
      const response = await fetch(`/api/documents/${docId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: editFileName,
          submissionType: editSubmissionType,
        }),
      })

      const result = await response.json()
      if (result.success) {
        // Update local state
        setDeliverables((prev) =>
          prev.map((d) => (d.id === docId ? { ...d, fileName: editFileName, submissionType: editSubmissionType } : d)),
        )
        setEditingDocId(null)
        alert("Document updated successfully!")
      } else {
        alert("Failed to update document: " + result.error)
      }
    } catch (error) {
      console.error("[v0] Error updating document:", error)
      alert("Failed to update document")
    } finally {
      setSavingEdit(false) // Use the declared state
    }
  }

  const handleDeleteDocument = async (docId: string, fileName: string) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"?`)) return

    try {
      const response = await fetch(`/api/documents/${docId}`, {
        method: "DELETE",
      })

      const result = await response.json()
      if (result.success) {
        setDeliverables((prev) => prev.filter((d) => d.id !== docId))
        alert("Document deleted successfully!")
      } else {
        alert("Failed to delete document: " + result.error)
      }
    } catch (error) {
      console.error("[v0] Error deleting document:", error)
      alert("Failed to delete document")
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

  const toggleTimelineExpand = (id: string) => {
    setExpandedTimelineItems((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const buildCombinedTimeline = () => {
    const items: Array<{
      id: string
      type: "debrief" | "deliverable" | "question"
      date: string
      studentName: string
      data: any
    }> = []

    // Add debriefs
    if (engagement?.debriefs) {
      for (const debrief of engagement.debriefs) {
        items.push({
          id: `debrief-${debrief.id}`,
          type: "debrief",
          date: debrief.weekEnding || debrief.createdAt,
          studentName: debrief.studentName || "Unknown",
          data: debrief,
        })

        // If debrief has a question, add it as a separate item
        if (debrief.questions) {
          items.push({
            id: `question-${debrief.id}`,
            type: "question",
            date: debrief.weekEnding || debrief.createdAt,
            studentName: debrief.studentName || "Unknown",
            data: debrief,
          })
        }
      }
    }

    // Add deliverables
    if (deliverables) {
      for (const deliverable of deliverables) {
        items.push({
          id: `deliverable-${deliverable.id}`,
          type: "deliverable",
          date: deliverable.uploadedAt,
          studentName: deliverable.studentName || deliverable.uploadedBy || "Unknown",
          data: deliverable,
        })
      }
    }

    // Sort by date descending
    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return items
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
            <Button className="bg-[#2d3a4f] hover:bg-[#3d4a5f] text-white" onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Note
            </Button>
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
                  <CardDescription className="text-[#5f7082]">
                    Debriefs, questions, and deliverable submissions from all team members
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {(() => {
                    const timelineItems = buildCombinedTimeline()

                    if (timelineItems.length === 0) {
                      return (
                        <div className="text-center py-12">
                          <FileText className="h-12 w-12 text-[#9aacb8] mx-auto mb-4" />
                          <p className="text-[#5f7082]">No activity found for this team</p>
                        </div>
                      )
                    }

                    return (
                      <div className="space-y-4">
                        {timelineItems.slice(0, 20).map((item, index) => {
                          const isExpanded = expandedTimelineItems.has(item.id)

                          return (
                            <div key={item.id} className="flex gap-4">
                              <div className="flex flex-col items-center">
                                <div
                                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                                    item.type === "debrief"
                                      ? "bg-[#2d3a4f] border-[#8fa889]"
                                      : item.type === "question"
                                        ? "bg-[#f59e0b] border-[#fbbf24]"
                                        : "bg-[#565f4b] border-[#8fa889]"
                                  }`}
                                >
                                  {item.type === "debrief" && <FileText className="h-5 w-5 text-white" />}
                                  {item.type === "question" && <HelpCircle className="h-5 w-5 text-white" />}
                                  {item.type === "deliverable" && <FileUp className="h-5 w-5 text-white" />}
                                </div>
                                {index < timelineItems.length - 1 && (
                                  <div className="w-0.5 h-full bg-[#9aacb8]/30 mt-2" />
                                )}
                              </div>
                              <div className="flex-1 pb-4">
                                <div
                                  className={`bg-white rounded-lg border shadow-sm overflow-hidden transition-all ${
                                    item.type === "question"
                                      ? "border-[#f59e0b]/50"
                                      : item.type === "deliverable"
                                        ? "border-[#565f4b]/50"
                                        : "border-[#9aacb8]/30"
                                  }`}
                                >
                                  {/* Clickable Header */}
                                  <button
                                    onClick={() => toggleTimelineExpand(item.id)}
                                    className="w-full p-4 text-left hover:bg-[#f5f7f9]/50 transition-colors"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8 border border-[#9aacb8]/30">
                                          <AvatarFallback className="bg-[#2d3a4f] text-white text-xs">
                                            {getInitials(item.studentName)}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div>
                                          <span className="font-medium text-[#2d3a4f]">{item.studentName}</span>
                                          <Badge
                                            className={`ml-2 text-xs ${
                                              item.type === "debrief"
                                                ? "bg-[#8fa889]/20 text-[#565f4b]"
                                                : item.type === "question"
                                                  ? "bg-[#f59e0b]/20 text-[#d97706]"
                                                  : "bg-[#565f4b]/20 text-[#565f4b]"
                                            }`}
                                          >
                                            {item.type === "debrief" && "Debrief"}
                                            {item.type === "question" && "Question"}
                                            {item.type === "deliverable" &&
                                              getDeliverableTypeLabel(item.data.submissionType)}
                                          </Badge>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {item.type === "debrief" && (
                                          <Badge className="bg-[#8fa889]/20 text-[#565f4b] border-none">
                                            {item.data.hoursWorked}h
                                          </Badge>
                                        )}
                                        <span className="text-xs text-[#5f7082]">
                                          {new Date(item.date).toLocaleDateString()}
                                        </span>
                                        {isExpanded ? (
                                          <ChevronUp className="h-4 w-4 text-[#5f7082]" />
                                        ) : (
                                          <ChevronDown className="h-4 w-4 text-[#5f7082]" />
                                        )}
                                      </div>
                                    </div>

                                    {/* Preview when collapsed */}
                                    {!isExpanded && (
                                      <p className="text-sm text-[#5f7082] mt-2 line-clamp-2">
                                        {item.type === "debrief" && (item.data.workSummary || "No summary provided")}
                                        {item.type === "question" && item.data.questions}
                                        {item.type === "deliverable" && `Uploaded: ${item.data.fileName}`}
                                      </p>
                                    )}
                                  </button>

                                  {/* Expanded Content */}
                                  {isExpanded && (
                                    <div className="px-4 pb-4 border-t border-[#9aacb8]/20">
                                      {item.type === "debrief" && (
                                        <div className="space-y-4 pt-4">
                                          <div>
                                            <h4 className="text-sm font-semibold text-[#2d3a4f] mb-2">Work Summary</h4>
                                            <p className="text-sm text-[#5f7082] whitespace-pre-wrap">
                                              {item.data.workSummary || "No summary provided"}
                                            </p>
                                          </div>
                                          <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                              <span className="text-[#5f7082]">Hours Worked:</span>
                                              <span className="ml-2 font-medium text-[#2d3a4f]">
                                                {item.data.hoursWorked}h
                                              </span>
                                            </div>
                                            <div>
                                              <span className="text-[#5f7082]">Week Ending:</span>
                                              <span className="ml-2 font-medium text-[#2d3a4f]">
                                                {item.data.weekEnding
                                                  ? new Date(item.data.weekEnding).toLocaleDateString()
                                                  : "N/A"}
                                              </span>
                                            </div>
                                            {item.data.weekNumber && (
                                              <div>
                                                <span className="text-[#5f7082]">Week Number:</span>
                                                <span className="ml-2 font-medium text-[#2d3a4f]">
                                                  {item.data.weekNumber}
                                                </span>
                                              </div>
                                            )}
                                            {item.data.clinic && (
                                              <div>
                                                <span className="text-[#5f7082]">Clinic:</span>
                                                <span className="ml-2 font-medium text-[#2d3a4f]">
                                                  {item.data.clinic}
                                                </span>
                                              </div>
                                            )}
                                          </div>
                                          {item.data.questions && (
                                            <div className="p-3 bg-[#f59e0b]/10 rounded-lg border-l-4 border-[#f59e0b]">
                                              <div className="flex items-center gap-2 mb-2">
                                                <HelpCircle className="h-4 w-4 text-[#d97706]" />
                                                <span className="text-sm font-semibold text-[#d97706]">
                                                  Question for Director
                                                  {item.data.questionType && ` (${item.data.questionType})`}
                                                </span>
                                              </div>
                                              <p className="text-sm text-[#5f7082]">{item.data.questions}</p>
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      {item.type === "question" && (
                                        <div className="space-y-3 pt-4">
                                          <div className="p-3 bg-[#f59e0b]/10 rounded-lg">
                                            <div className="flex items-center gap-2 mb-2">
                                              <HelpCircle className="h-4 w-4 text-[#d97706]" />
                                              <span className="text-sm font-semibold text-[#d97706]">
                                                {item.data.questionType
                                                  ? `${item.data.questionType} Question`
                                                  : "Question for Director"}
                                              </span>
                                            </div>
                                            <p className="text-sm text-[#2d3a4f] whitespace-pre-wrap">
                                              {item.data.questions}
                                            </p>
                                          </div>
                                          <div className="text-sm text-[#5f7082]">
                                            <span>From debrief submitted on </span>
                                            <span className="font-medium">
                                              {item.data.weekEnding
                                                ? new Date(item.data.weekEnding).toLocaleDateString()
                                                : "N/A"}
                                            </span>
                                          </div>
                                        </div>
                                      )}

                                      {item.type === "deliverable" && (
                                        <div className="space-y-3 pt-4">
                                          <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-[#565f4b]/10 rounded-lg flex items-center justify-center">
                                              <FileUp className="h-5 w-5 text-[#565f4b]" />
                                            </div>
                                            <div className="flex-1">
                                              <p className="font-medium text-[#2d3a4f]">{item.data.fileName}</p>
                                              <p className="text-xs text-[#5f7082]">
                                                {item.data.fileSize
                                                  ? `${(item.data.fileSize / 1024 / 1024).toFixed(2)} MB`
                                                  : "Unknown size"}
                                                {item.data.fileType && ` • ${item.data.fileType}`}
                                              </p>
                                            </div>
                                            {item.data.fileUrl && (
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                className="border-[#565f4b] text-[#565f4b] hover:bg-[#565f4b] hover:text-white bg-transparent"
                                                onClick={(e) => {
                                                  e.stopPropagation()
                                                  window.open(item.data.fileUrl, "_blank")
                                                }}
                                              >
                                                View File
                                              </Button>
                                            )}
                                          </div>

                                          {/* Status and Grade */}
                                          <div className="flex items-center gap-4 text-sm">
                                            <div>
                                              <span className="text-[#5f7082]">Status:</span>
                                              <Badge
                                                className={`ml-2 ${
                                                  item.data.status === "graded"
                                                    ? "bg-green-100 text-green-700"
                                                    : item.data.status === "reviewed"
                                                      ? "bg-blue-100 text-blue-700"
                                                      : "bg-yellow-100 text-yellow-700"
                                                }`}
                                              >
                                                {item.data.status === "graded"
                                                  ? "Graded"
                                                  : item.data.status === "reviewed"
                                                    ? "Reviewed"
                                                    : "Pending Review"}
                                              </Badge>
                                            </div>
                                            {item.data.grade && (
                                              <div>
                                                <span className="text-[#5f7082]">Grade:</span>
                                                <span className="ml-2 font-semibold text-[#2d3a4f]">
                                                  {item.data.grade}
                                                </span>
                                              </div>
                                            )}
                                          </div>

                                          {/* Director Feedback */}
                                          {item.data.comment && (
                                            <div className="p-3 bg-[#8fa889]/10 rounded-lg border-l-4 border-[#8fa889]">
                                              <div className="flex items-center gap-2 mb-2">
                                                <MessageSquare className="h-4 w-4 text-[#565f4b]" />
                                                <span className="text-sm font-semibold text-[#565f4b]">
                                                  Director Feedback
                                                  {item.data.reviewedBy && ` from ${item.data.reviewedBy}`}
                                                </span>
                                              </div>
                                              <p className="text-sm text-[#5f7082]">{item.data.comment}</p>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })()}
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

                  {deliverables.length > 0 ? (
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-[#2d3a4f]">
                        Uploaded Documents ({deliverables.length})
                      </h3>
                      {deliverables.map((deliverable) => (
                        <div
                          key={deliverable.id}
                          className="p-4 rounded-lg border border-[#9aacb8]/30 bg-white hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 mt-1">{getFileIcon(deliverable.fileType)}</div>
                            <div className="flex-1 min-w-0">
                              {editingDocId === deliverable.id ? (
                                <div className="space-y-3 mb-2">
                                  <div>
                                    <label className="text-xs text-[#5f7082] mb-1 block">File Name</label>
                                    <Input
                                      value={editFileName}
                                      onChange={(e) => setEditFileName(e.target.value)}
                                      className="h-8 text-sm"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs text-[#5f7082] mb-1 block">Deliverable Type</label>
                                    <Select value={editSubmissionType} onValueChange={setEditSubmissionType}>
                                      <SelectTrigger className="h-8 text-sm">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="sow">SOW</SelectItem>
                                        <SelectItem value="progress">Progress Report</SelectItem>
                                        <SelectItem value="final">Final Presentation</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => handleSaveEdit(deliverable.id)}
                                      disabled={savingEdit}
                                      className="bg-[#8fa889] hover:bg-[#7a9574]"
                                    >
                                      <Check className="h-3 w-3 mr-1" />
                                      {savingEdit ? "Saving..." : "Save"}
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="font-medium text-[#2d3a4f] truncate">{deliverable.fileName}</p>
                                    <Badge className="bg-[#8fa889]/20 text-[#565f4b] border-none text-xs">
                                      {getDeliverableTypeLabel(deliverable.submissionType)}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-[#5f7082] mb-2">
                                    <span>Uploaded by {deliverable.uploadedBy || deliverable.studentName}</span>
                                    <span>•</span>
                                    <span>{new Date(deliverable.uploadedAt).toLocaleDateString()}</span>
                                    {deliverable.fileSize && (
                                      <>
                                        <span>•</span>
                                        <span>{formatFileSize(deliverable.fileSize)}</span>
                                      </>
                                    )}
                                  </div>
                                </>
                              )}

                              {/* Status and Grade Section */}
                              {editingDocId !== deliverable.id && (
                                <div className="flex items-center gap-3 mt-2">
                                  <Badge
                                    className={
                                      deliverable.status === "graded"
                                        ? "bg-[#8fa889] text-white"
                                        : deliverable.status === "reviewed"
                                          ? "bg-[#5f7082] text-white"
                                          : "bg-[#f5a623]/20 text-[#c68a1a]"
                                    }
                                  >
                                    {deliverable.status === "graded"
                                      ? `Graded: ${deliverable.grade}`
                                      : deliverable.status === "reviewed"
                                        ? "Reviewed"
                                        : "Pending Review"}
                                  </Badge>
                                  {deliverable.reviewedBy && (
                                    <span className="text-xs text-[#5f7082]">by {deliverable.reviewedBy}</span>
                                  )}
                                </div>
                              )}

                              {/* Director Comment */}
                              {deliverable.comment && editingDocId !== deliverable.id && (
                                <div className="mt-3 p-3 bg-[#f5f7f9] rounded-md border-l-4 border-[#8fa889]">
                                  <p className="text-xs font-medium text-[#5f7082] mb-1">Director Feedback:</p>
                                  <p className="text-sm text-[#2d3a4f]">{deliverable.comment}</p>
                                </div>
                              )}
                            </div>

                            <div className="flex-shrink-0 flex flex-col gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(deliverable.fileUrl, "_blank")}
                                className="border-[#9aacb8]/50"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              {editingDocId !== deliverable.id && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleStartEdit(deliverable)}
                                    className="border-[#9aacb8]/50"
                                  >
                                    <Pencil className="h-4 w-4 mr-1" />
                                    Edit
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteDocument(deliverable.id, deliverable.fileName)}
                                    className="border-red-300 text-red-600 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Delete
                                  </Button>
                                </>
                              )}
                            </div>
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

      {/* Add Note Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team Note</DialogTitle>
            <DialogDescription>Share updates or notes with your team</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Textarea
              placeholder="Write your note here..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button className="bg-[#2d3a4f] hover:bg-[#3d4a5f]" onClick={handleAddNote} disabled={!newNote.trim()}>
                <Send className="h-4 w-4 mr-2" />
                Post Note
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
