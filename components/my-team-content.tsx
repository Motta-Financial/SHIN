"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import {
  Users,
  Clock,
  FileText,
  MessageSquare,
  Plus,
  Calendar,
  TrendingUp,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { createBrowserClient } from "@supabase/ssr"
import { useUserRole, canAccessPortal, getDefaultPortal } from "@/hooks/use-user-role"
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
  const { role, isAuthenticated, isLoading: roleLoading, studentId: authStudentId } = useUserRole()
  const router = useRouter()

  const [availableStudents, setAvailableStudents] = useState<Array<{ id: string; name: string; email: string }>>([])
  const isAdminOrDirector = role === "admin" || role === "director"
  const canSwitchStudents = isAdminOrDirector

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
    const fetchAvailableStudents = async () => {
      if (isAdminOrDirector) {
        try {
          const response = await fetch("/api/supabase/roster?activeOnly=true")
          if (response.ok) {
            const data = await response.json()
            if (data.students) {
              const studentList = data.students.map((s: any) => ({
                id: s.id,
                name:
                  s.fullName ||
                  s.full_name ||
                  `${s.firstName || s.first_name || ""} ${s.lastName || s.last_name || ""}`.trim(),
                email: s.email,
              }))
              setAvailableStudents(studentList)
              // If no student selected yet, select the first one
              if (!currentStudentId && studentList.length > 0) {
                setCurrentStudentId(studentList[0].id)
                loadTeamData(studentList[0].id)
              }
            }
          }
        } catch (error) {
          console.error("[v0] Error fetching students:", error)
        }
      }
    }

    if (!roleLoading && isAdminOrDirector) {
      fetchAvailableStudents()
    }
  }, [roleLoading, isAdminOrDirector, currentStudentId])

  useEffect(() => {
    console.log("[v0] MyTeam - Auth state:", { role, isAuthenticated, roleLoading, authStudentId })

    if (roleLoading) {
      console.log("[v0] MyTeam - Still loading role, waiting...")
      return
    }

    if (!isAuthenticated) {
      console.log("[v0] MyTeam - Not authenticated, redirecting to sign-in")
      router.push("/sign-in")
      return
    }

    // Directors and admins can access all portals
    if (isAdminOrDirector) {
      console.log("[v0] MyTeam - Admin/Director access granted, no redirect.")
      return // Don't redirect, allow access
    }

    // Students can access the student portal
    if (role === "student") {
      console.log("[v0] MyTeam - Student role detected.")
      if (authStudentId && authStudentId !== currentStudentId) {
        console.log("[v0] MyTeam - Using student ID from auth:", authStudentId)
        setCurrentStudentId(authStudentId)
        loadTeamData(authStudentId)
      }
      return
    }

    // Other roles that can't access student portal - redirect
    if (!canAccessPortal(role, "student")) {
      console.log("[v0] MyTeam - Wrong role, redirecting to:", getDefaultPortal(role))
      router.push(getDefaultPortal(role))
      return
    }

    console.log("[v0] MyTeam - Student access granted (default case)")
    // This part might be redundant if the above conditions cover all cases,
    // but it's here for completeness if logic changes.
    if (authStudentId && authStudentId !== currentStudentId) {
      console.log("[v0] MyTeam - Using student ID from auth (fallback):", authStudentId)
      setCurrentStudentId(authStudentId)
      loadTeamData(authStudentId)
    }
  }, [role, isAuthenticated, roleLoading, authStudentId, router, currentStudentId, isAdminOrDirector])

  const handleStudentChange = (studentId: string) => {
    setCurrentStudentId(studentId)
    const selectedStudent = availableStudents.find((s) => s.id === studentId)
    if (selectedStudent) {
      setCurrentStudentName(selectedStudent.name)
    }
    loadTeamData(studentId)
  }

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

  // Adjust loading state to include role loading
  if (roleLoading || (loading && !currentStudentId)) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-2rem)]">
        <div className="animate-pulse text-muted-foreground">Loading team data...</div>
      </div>
    )
  }

  return (
    // Simplified layout for authenticated users
    <div className="space-y-6">
      {canSwitchStudents && availableStudents.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-100">
          <div className="flex items-center gap-3">
            <Eye className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm text-blue-800 font-medium">Viewing as Director/Admin</p>
              <p className="text-xs text-blue-600">Select a student to view their team</p>
            </div>
          </div>
          <Select value={currentStudentId} onValueChange={handleStudentChange}>
            <SelectTrigger className="w-[280px] bg-white">
              <SelectValue placeholder="Select a student" />
            </SelectTrigger>
            <SelectContent>
              {availableStudents.map((student) => (
                <SelectItem key={student.id} value={student.id}>
                  {student.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Team</h1>
          <p className="text-muted-foreground mt-1">Collaborate with your team and manage deliverables</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Note
        </Button>
      </div>

      {/* Client Engagement Overview Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">{engagement?.clientName || "No Client Assigned"}</CardTitle>
              {engagement?.projectType && <CardDescription className="mt-1">{engagement.projectType}</CardDescription>}
            </div>
            <Badge variant={engagement?.status === "Active" ? "default" : "secondary"}>
              {engagement?.status || "Unknown"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <Users className="h-5 w-5 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{engagement?.teamMembers.length || 0}</p>
              <p className="text-sm text-muted-foreground">Team Members</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <Clock className="h-5 w-5 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{engagement?.totalHours || 0}</p>
              <p className="text-sm text-muted-foreground">Total Hours</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <FileText className="h-5 w-5 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{engagement?.debriefs.length || 0}</p>
              <p className="text-sm text-muted-foreground">Debriefs</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <TrendingUp className="h-5 w-5 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{engagement?.sowProgress?.percentComplete || 0}%</p>
              <p className="text-sm text-muted-foreground">Progress</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Section */}
      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList className="bg-primary p-1">
          <TabsTrigger
            value="timeline"
            className="data-[state=active]:bg-primary-foreground data-[state=active]:text-primary text-white/70"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Activity Timeline
          </TabsTrigger>
          <TabsTrigger
            value="team"
            className="data-[state=active]:bg-primary-foreground data-[state=active]:text-primary text-white/70"
          >
            <Users className="h-4 w-4 mr-2" />
            Team Members
          </TabsTrigger>
          <TabsTrigger
            value="deliverables"
            className="data-[state=active]:bg-primary-foreground data-[state=active]:text-primary text-white/70"
          >
            <Upload className="h-4 w-4 mr-2" />
            Deliverables
          </TabsTrigger>
          <TabsTrigger
            value="notes"
            className="data-[state=active]:bg-primary-foreground data-[state=active]:text-primary text-white/70"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Team Notes
          </TabsTrigger>
        </TabsList>

        {/* Timeline Tab */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Activity Timeline</CardTitle>
              <CardDescription>Debriefs, questions, and deliverable submissions from all team members</CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                const timelineItems = buildCombinedTimeline()

                if (timelineItems.length === 0) {
                  return (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">No activity found for this team</p>
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
                                  ? "bg-primary border-primary-foreground"
                                  : item.type === "question"
                                    ? "bg-yellow-500 border-yellow-300"
                                    : "bg-green-500 border-green-300"
                              }`}
                            >
                              {item.type === "debrief" && <FileText className="h-5 w-5 text-white" />}
                              {item.type === "question" && <HelpCircle className="h-5 w-5 text-white" />}
                              {item.type === "deliverable" && <FileUp className="h-5 w-5 text-white" />}
                            </div>
                            {index < timelineItems.length - 1 && <div className="w-0.5 h-full bg-muted mt-2" />}
                          </div>
                          <div className="flex-1 pb-4">
                            <div
                              className={`bg-card rounded-lg border shadow-sm overflow-hidden transition-all ${
                                item.type === "question"
                                  ? "border-yellow-300"
                                  : item.type === "deliverable"
                                    ? "border-green-300"
                                    : "border-muted"
                              }`}
                            >
                              {/* Clickable Header */}
                              <button
                                onClick={() => toggleTimelineExpand(item.id)}
                                className="w-full p-4 text-left hover:bg-accent transition-colors"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8 border">
                                      <AvatarFallback className="bg-primary text-white text-xs">
                                        {getInitials(item.studentName)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <span className="font-medium text-foreground">{item.studentName}</span>
                                      <Badge
                                        className={`ml-2 text-xs ${
                                          item.type === "debrief"
                                            ? "bg-primary/20 text-primary"
                                            : item.type === "question"
                                              ? "bg-yellow-500/20 text-yellow-700"
                                              : "bg-green-500/20 text-green-700"
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
                                      <Badge className="bg-primary/20 text-primary border-none">
                                        {item.data.hoursWorked}h
                                      </Badge>
                                    )}
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(item.date).toLocaleDateString()}
                                    </span>
                                    {isExpanded ? (
                                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                    )}
                                  </div>
                                </div>

                                {/* Preview when collapsed */}
                                {!isExpanded && (
                                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                    {item.type === "debrief" && (item.data.workSummary || "No summary provided")}
                                    {item.type === "question" && item.data.questions}
                                    {item.type === "deliverable" && `Uploaded: ${item.data.fileName}`}
                                  </p>
                                )}
                              </button>

                              {/* Expanded Content */}
                              {isExpanded && (
                                <div className="px-4 pb-4 border-t border-muted">
                                  {item.type === "debrief" && (
                                    <div className="space-y-4 pt-4">
                                      <div>
                                        <h4 className="text-sm font-semibold text-foreground mb-2">Work Summary</h4>
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                          {item.data.workSummary || "No summary provided"}
                                        </p>
                                      </div>
                                      <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                          <span className="text-muted-foreground">Hours Worked:</span>
                                          <span className="ml-2 font-medium text-foreground">
                                            {item.data.hoursWorked}h
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">Week Ending:</span>
                                          <span className="ml-2 font-medium text-foreground">
                                            {item.data.weekEnding
                                              ? new Date(item.data.weekEnding).toLocaleDateString()
                                              : "N/A"}
                                          </span>
                                        </div>
                                        {item.data.weekNumber && (
                                          <div>
                                            <span className="text-muted-foreground">Week Number:</span>
                                            <span className="ml-2 font-medium text-foreground">
                                              {item.data.weekNumber}
                                            </span>
                                          </div>
                                        )}
                                        {item.data.clinic && (
                                          <div>
                                            <span className="text-muted-foreground">Clinic:</span>
                                            <span className="ml-2 font-medium text-foreground">{item.data.clinic}</span>
                                          </div>
                                        )}
                                      </div>
                                      {item.data.questions && (
                                        <div className="p-3 bg-yellow-500/10 rounded-lg border-l-4 border-yellow-500">
                                          <div className="flex items-center gap-2 mb-2">
                                            <HelpCircle className="h-4 w-4 text-yellow-700" />
                                            <span className="text-sm font-semibold text-yellow-700">
                                              Question for Director
                                              {item.data.questionType && ` (${item.data.questionType})`}
                                            </span>
                                          </div>
                                          <p className="text-sm text-muted-foreground">{item.data.questions}</p>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {item.type === "question" && (
                                    <div className="space-y-3 pt-4">
                                      <div className="p-3 bg-yellow-500/10 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                          <HelpCircle className="h-4 w-4 text-yellow-700" />
                                          <span className="text-sm font-semibold text-yellow-700">
                                            {item.data.questionType
                                              ? `${item.data.questionType} Question`
                                              : "Question for Director"}
                                          </span>
                                        </div>
                                        <p className="text-sm text-foreground whitespace-pre-wrap">
                                          {item.data.questions}
                                        </p>
                                      </div>
                                      <div className="text-sm text-muted-foreground">
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
                                        <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                                          <FileUp className="h-5 w-5 text-green-500" />
                                        </div>
                                        <div className="flex-1">
                                          <p className="font-medium text-foreground">{item.data.fileName}</p>
                                          <p className="text-xs text-muted-foreground">
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
                                            className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white bg-transparent"
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
                                          <span className="text-muted-foreground">Status:</span>
                                          <Badge
                                            className={
                                              item.data.status === "graded"
                                                ? "bg-green-100 text-green-700"
                                                : item.data.status === "reviewed"
                                                  ? "bg-blue-100 text-blue-700"
                                                  : "bg-yellow-100 text-yellow-700"
                                            }
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
                                            <span className="text-muted-foreground">Grade:</span>
                                            <span className="ml-2 font-semibold text-foreground">
                                              {item.data.grade}
                                            </span>
                                          </div>
                                        )}
                                      </div>

                                      {/* Director Feedback */}
                                      {item.data.comment && (
                                        <div className="p-3 bg-green-500/10 rounded-lg border-l-4 border-green-500">
                                          <div className="flex items-center gap-2 mb-2">
                                            <MessageSquare className="h-4 w-4 text-green-700" />
                                            <span className="text-sm font-semibold text-green-700">
                                              Director Feedback
                                              {item.data.reviewedBy && ` from ${item.data.reviewedBy}`}
                                            </span>
                                          </div>
                                          <p className="text-sm text-muted-foreground">{item.data.comment}</p>
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
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Team Members</CardTitle>
              <CardDescription>Students assigned to this client engagement</CardDescription>
            </CardHeader>
            <CardContent>
              {engagement?.teamMembers && engagement.teamMembers.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {engagement.teamMembers.map((member) => (
                    <div
                      key={member.id}
                      className="p-4 rounded-lg border bg-card shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 border-2 border-primary">
                          <AvatarFallback className="bg-primary text-white">
                            {getInitials(member.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{member.full_name}</p>
                          <Badge className="bg-muted text-muted-foreground border-none text-xs">
                            {member.clinic || "No Clinic"}
                          </Badge>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-muted flex justify-between text-sm">
                        <div>
                          <p className="text-muted-foreground">Hours</p>
                          <p className="font-semibold text-foreground">{member.totalHours || 0}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Debriefs</p>
                          <p className="font-semibold text-foreground">{member.debriefCount || 0}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No team members found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deliverables Tab */}
        <TabsContent value="deliverables">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Deliverables</CardTitle>
              <CardDescription>Upload and manage project deliverables (SOW, Presentations, etc.)</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Upload Section */}
              <div className="mb-6 p-4 border-2 border-dashed border-muted rounded-lg bg-muted/10">
                <h3 className="text-sm font-semibold text-foreground mb-3">Upload New Deliverable</h3>
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
                      className="flex items-center justify-center gap-2 px-4 py-2 border border-muted rounded-md cursor-pointer hover:bg-accent transition-colors h-10"
                    >
                      <Upload className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground truncate">
                        {selectedFile ? selectedFile.name : "Choose file..."}
                      </span>
                    </label>
                  </div>
                  <Button
                    onClick={handleDeliverableUpload}
                    disabled={uploadingDeliverable || !selectedFile || !selectedDeliverableType}
                    className="bg-primary hover:bg-primary-foreground"
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
                  <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                    <File className="h-4 w-4" />
                    <span>{selectedFile.name}</span>
                    <span>({formatFileSize(selectedFile.size)})</span>
                    <button onClick={() => setSelectedFile(null)} className="ml-auto text-red-500 hover:text-red-700">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {deliverables.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground">Uploaded Documents ({deliverables.length})</h3>
                  {deliverables.map((deliverable) => (
                    <div
                      key={deliverable.id}
                      className="p-4 rounded-lg border bg-card shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 mt-1">{getFileIcon(deliverable.fileType)}</div>
                        <div className="flex-1 min-w-0">
                          {editingDocId === deliverable.id ? (
                            <div className="space-y-3 mb-2">
                              <div>
                                <label className="text-xs text-muted-foreground mb-1 block">File Name</label>
                                <Input
                                  value={editFileName}
                                  onChange={(e) => setEditFileName(e.target.value)}
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Deliverable Type</label>
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
                                  className="bg-primary-foreground text-primary hover:bg-primary-foreground/80"
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
                                <p className="font-medium text-foreground truncate">{deliverable.fileName}</p>
                                <Badge className="bg-primary/20 text-primary border-none text-xs">
                                  {getDeliverableTypeLabel(deliverable.submissionType)}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
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
                                    ? "bg-green-500 text-white"
                                    : deliverable.status === "reviewed"
                                      ? "bg-primary text-white"
                                      : "bg-yellow-500/20 text-yellow-700"
                                }
                              >
                                {deliverable.status === "graded"
                                  ? `Graded: ${deliverable.grade}`
                                  : deliverable.status === "reviewed"
                                    ? "Reviewed"
                                    : "Pending Review"}
                              </Badge>
                              {deliverable.reviewedBy && (
                                <span className="text-xs text-muted-foreground">by {deliverable.reviewedBy}</span>
                              )}
                            </div>
                          )}

                          {/* Director Comment */}
                          {deliverable.comment && editingDocId !== deliverable.id && (
                            <div className="mt-3 p-3 bg-muted/10 rounded-md border-l-4 border-primary">
                              <p className="text-xs font-medium text-muted-foreground mb-1">Director Feedback:</p>
                              <p className="text-sm text-foreground">{deliverable.comment}</p>
                            </div>
                          )}
                        </div>

                        <div className="flex-shrink-0 flex flex-col gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(deliverable.fileUrl, "_blank")}
                            className="border-muted"
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
                                className="border-muted"
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
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No deliverables uploaded yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Upload your SOW, presentations, and other project documents above
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Team Notes</CardTitle>
              <CardDescription>Collaborative notes and updates</CardDescription>
            </CardHeader>
            <CardContent>
              {teamNotes.length > 0 ? (
                <div className="space-y-4">
                  {teamNotes.map((note, index) => (
                    <div key={note.id || index} className="p-4 rounded-lg border bg-card shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary text-white text-xs">
                              {getInitials(note.created_by_name || "?")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-foreground">{note.created_by_name}</span>
                        </div>
                        <Badge className="bg-muted text-muted-foreground border-none text-xs">
                          {note.category || "general"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{note.note_text}</p>
                      <p className="text-xs text-muted-foreground mt-2">{new Date(note.created_at).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No team notes yet</p>
                  <Button className="mt-4 bg-primary hover:bg-primary-foreground" onClick={() => setIsDialogOpen(true)}>
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
  )
}
