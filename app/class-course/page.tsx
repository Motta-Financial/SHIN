"use client"

import { useState, useEffect } from "react"
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
} from "lucide-react"
import { UnifiedWeeklyAgenda } from "@/components/unified-weekly-agenda"

// Mock announcements
const mockAnnouncements = [
  {
    id: "1",
    title: "Mid-semester Review Schedule",
    content: "Mid-semester reviews will be held during weeks 7-8. Please prepare your progress reports.",
    postedBy: "Program Director",
    postedAt: "2025-01-15",
    priority: "high",
  },
  {
    id: "2",
    title: "Guest Speaker Next Week",
    content: "We will have a guest speaker from industry discussing career opportunities.",
    postedBy: "Nick Vadala",
    postedAt: "2025-01-10",
    priority: "normal",
  },
]

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

export default function ClassCoursePage() {
  const [copied, setCopied] = useState(false)
  const [editingSession, setEditingSession] = useState<string | null>(null)
  const [directors, setDirectors] = useState<Array<{ full_name: string; clinic: string }>>([])
  const [clients, setClients] = useState<Array<{ name: string }>>([])
  const [scheduleNotes, setScheduleNotes] = useState("")

  const [materials, setMaterials] = useState<CourseMaterial[]>([])
  const [loadingMaterials, setLoadingMaterials] = useState(true)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterClinic, setFilterClinic] = useState("all")

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

  // Fetch directors and clients from database
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [directorsRes, clientsRes] = await Promise.all([fetch("/api/directors"), fetch("/api/supabase/clients")])

        if (directorsRes.ok) {
          const directorsData = await directorsRes.json()
          setDirectors(directorsData.directors || [])
        }

        if (clientsRes.ok) {
          const clientsData = await clientsRes.json()
          setClients(clientsData.clients || [])
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      }
    }

    fetchData()
  }, [])

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
      // TODO: Get from actual authenticated user
      formData.append("uploadedByName", "Program Director")
      formData.append("uploadedByEmail", "director@example.com")

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

  return (
    <div className="min-h-screen bg-background pt-[48px] pl-12">
      <MainNavigation />

      <main className="container mx-auto p-6 space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Class Course</h1>
          <p className="text-muted-foreground mt-1">Fall 2025 Semester</p>
        </div>

        <Tabs defaultValue="announcements" className="space-y-6">
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
          </TabsList>

          {/* Announcements Tab */}
          <TabsContent value="announcements" className="space-y-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="border-b bg-muted/30 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-semibold">Announcements</CardTitle>
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Post Announcement
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {mockAnnouncements.map((announcement) => (
                    <div key={announcement.id} className="border-l-4 border-l-primary bg-muted/20 rounded-r-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-base text-foreground">{announcement.title}</h3>
                            {announcement.priority === "high" && (
                              <Badge variant="destructive" className="text-xs font-medium">
                                Important
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">{announcement.content}</p>
                          <p className="text-xs text-muted-foreground mt-3">
                            Posted by <span className="font-medium">{announcement.postedBy}</span> •{" "}
                            {announcement.postedAt}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="agenda" className="space-y-4">
            <UnifiedWeeklyAgenda semester="Fall 2025" />
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
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide px-2 mb-2">Categories</p>
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
                            if (!acc[cat]) acc[cat] = []
                            acc[cat].push(mat)
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
                                      <p className="text-xs text-slate-500 truncate mt-0.5">{material.description}</p>
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
        </Tabs>
      </main>
    </div>
  )
}
