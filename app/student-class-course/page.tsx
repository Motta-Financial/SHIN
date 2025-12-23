"use client"

import { useState } from "react"
import { MainNavigation } from "@/components/main-navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Calendar,
  Video,
  BookOpen,
  FileText,
  Download,
  Play,
  Clock,
  FolderOpen,
  File,
  FileImage,
  FileSpreadsheet,
  Presentation,
  Users,
  Building,
} from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"

interface PublishedAgenda {
  id: string
  schedule_date: string
  director_name: string
  zoom_link: string
  schedule_data: any
  notes: string
  published_at: string
}

interface ClassRecording {
  id: string
  title: string
  description: string
  video_url: string
  thumbnail_url: string
  week_number: number
  semester: string
  duration_minutes: number
  recorded_at: string
  created_at: string
}

interface CourseMaterial {
  id: string
  title: string
  description: string | null
  file_name: string
  file_url: string
  file_type: string
  file_size: number
  category: string
  target_clinic: string
  uploaded_by: string
  uploaded_by_name: string
  created_at: string
}

// Mock data for class recordings
const mockRecordings: ClassRecording[] = [
  {
    id: "1",
    title: "Week 1 - Program Orientation",
    description: "Introduction to the SEED program, expectations, and team formation",
    video_url: "https://zoom.us/rec/share/example1",
    thumbnail_url: "/zoom-recording-thumbnail.jpg",
    week_number: 1,
    semester: "Spring 2025",
    duration_minutes: 90,
    recorded_at: "2025-01-13T17:00:00Z",
    created_at: "2025-01-13T19:00:00Z",
  },
  {
    id: "2",
    title: "Week 2 - Client Kickoff Meetings",
    description: "Meeting with clients for the first time, project scope discussions",
    video_url: "https://zoom.us/rec/share/example2",
    thumbnail_url: "/zoom-meeting-thumbnail.png",
    week_number: 2,
    semester: "Spring 2025",
    duration_minutes: 95,
    recorded_at: "2025-01-20T17:00:00Z",
    created_at: "2025-01-20T19:00:00Z",
  },
  {
    id: "3",
    title: "Week 3 - Project Planning Workshop",
    description: "SOW development, timeline creation, and deliverable planning",
    video_url: "https://zoom.us/rec/share/example3",
    thumbnail_url: "/workshop-recording-thumbnail.jpg",
    week_number: 3,
    semester: "Spring 2025",
    duration_minutes: 85,
    recorded_at: "2025-01-27T17:00:00Z",
    created_at: "2025-01-27T19:00:00Z",
  },
]

// Mock published agenda
const mockPublishedAgenda: PublishedAgenda = {
  id: "1",
  schedule_date: "2025-01-27",
  director_name: "Nick Vadala",
  zoom_link: "https://zoom.us/j/123456789",
  notes: "Please prepare your project updates for today's session",
  published_at: "2025-01-26T10:00:00Z",
  schedule_data: [
    {
      id: "1",
      activity: "All Hands",
      startTime: "5:00 PM",
      endTime: "5:15 PM",
      duration: 15,
      color: "blue",
      sessions: [
        {
          id: "1-1",
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
      activity: "Clinic Sessions",
      startTime: "5:15 PM",
      endTime: "6:00 PM",
      duration: 45,
      color: "teal",
      sessions: [
        {
          id: "2-1",
          team: "Accounting Clinic",
          directorInitials: "KM",
          room: "Room",
          roomNumber: "201",
          notes: "Tax review",
        },
        { id: "2-2", team: "Marketing Clinic", directorInitials: "CH", room: "Room", roomNumber: "202", notes: "" },
        { id: "2-3", team: "Consulting Clinic", directorInitials: "NV", room: "Room", roomNumber: "203", notes: "" },
        { id: "2-4", team: "Funding Clinic", directorInitials: "MD", room: "Room", roomNumber: "204", notes: "" },
      ],
    },
    {
      id: "3",
      activity: "Client Work Time",
      startTime: "6:00 PM",
      endTime: "7:30 PM",
      duration: 90,
      color: "amber",
      sessions: [
        {
          id: "3-1",
          team: "All Teams",
          directorInitials: "All",
          room: "Various",
          roomNumber: "",
          notes: "Work with clients",
        },
      ],
    },
  ],
}

const CURRENT_STUDENT_CLINIC = "Accounting Clinic"

const mockCourseMaterials: CourseMaterial[] = [
  {
    id: "1",
    title: "Spring 2025 Syllabus",
    description: "Complete course syllabus with schedule, grading, and policies",
    file_name: "SEED_Syllabus_Spring2025.pdf",
    file_url: "/files/syllabus.pdf",
    file_type: "application/pdf",
    file_size: 245000,
    category: "syllabus",
    target_clinic: "all",
    uploaded_by: "director-1",
    uploaded_by_name: "Nick Vadala",
    created_at: "2025-01-10T10:00:00Z",
  },
  {
    id: "2",
    title: "Tax Preparation Guidelines",
    description: "Step-by-step guide for preparing client tax returns",
    file_name: "Tax_Prep_Guidelines.pdf",
    file_url: "/files/tax-prep.pdf",
    file_type: "application/pdf",
    file_size: 180000,
    category: "resource",
    target_clinic: "Accounting Clinic",
    uploaded_by: "director-2",
    uploaded_by_name: "Mark Dwyer",
    created_at: "2025-01-15T14:30:00Z",
  },
  {
    id: "3",
    title: "Client Communication Template",
    description: "Email templates for professional client communication",
    file_name: "Client_Communication_Templates.docx",
    file_url: "/files/templates.docx",
    file_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    file_size: 52000,
    category: "template",
    target_clinic: "all",
    uploaded_by: "director-1",
    uploaded_by_name: "Nick Vadala",
    created_at: "2025-01-12T09:00:00Z",
  },
  {
    id: "4",
    title: "QuickBooks Training Guide",
    description: "Complete guide for using QuickBooks with SEED clients",
    file_name: "QuickBooks_Training.pdf",
    file_url: "/files/quickbooks.pdf",
    file_type: "application/pdf",
    file_size: 320000,
    category: "lecture",
    target_clinic: "Accounting Clinic",
    uploaded_by: "director-2",
    uploaded_by_name: "Mark Dwyer",
    created_at: "2025-01-18T11:00:00Z",
  },
  {
    id: "5",
    title: "Week 3 Assignment - Financial Analysis",
    description: "Complete financial analysis for your assigned client",
    file_name: "Week3_Assignment.pdf",
    file_url: "/files/week3-assignment.pdf",
    file_type: "application/pdf",
    file_size: 85000,
    category: "assignment",
    target_clinic: "Accounting Clinic",
    uploaded_by: "director-2",
    uploaded_by_name: "Mark Dwyer",
    created_at: "2025-01-20T08:00:00Z",
  },
  {
    id: "6",
    title: "Professional Ethics Guidelines",
    description: "Ethics guidelines for working with small business clients",
    file_name: "Ethics_Guidelines.pdf",
    file_url: "/files/ethics.pdf",
    file_type: "application/pdf",
    file_size: 125000,
    category: "resource",
    target_clinic: "all",
    uploaded_by: "director-1",
    uploaded_by_name: "Nick Vadala",
    created_at: "2025-01-11T16:00:00Z",
  },
  {
    id: "7",
    title: "Marketing Strategy Framework",
    description: "Framework for developing client marketing strategies",
    file_name: "Marketing_Framework.pptx",
    file_url: "/files/marketing-framework.pptx",
    file_type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    file_size: 450000,
    category: "lecture",
    target_clinic: "Marketing Clinic",
    uploaded_by: "director-3",
    uploaded_by_name: "Charlene Howell",
    created_at: "2025-01-17T13:00:00Z",
  },
  {
    id: "8",
    title: "SOW Template",
    description: "Statement of Work template for client projects",
    file_name: "SOW_Template.docx",
    file_url: "/files/sow-template.docx",
    file_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    file_size: 48000,
    category: "template",
    target_clinic: "all",
    uploaded_by: "director-1",
    uploaded_by_name: "Nick Vadala",
    created_at: "2025-01-13T10:30:00Z",
  },
]

export default function StudentClassCoursePage() {
  const [activeTab, setActiveTab] = useState("agenda")
  const [agenda, setAgenda] = useState<PublishedAgenda | null>(mockPublishedAgenda)
  const [recordings, setRecordings] = useState<ClassRecording[]>(mockRecordings)
  const [materials, setMaterials] = useState<CourseMaterial[]>(mockCourseMaterials)
  const [loadingMaterials, setLoadingMaterials] = useState(false)
  const [filterCategory, setFilterCategory] = useState("all")
  const [studentClinic] = useState(CURRENT_STUDENT_CLINIC)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  // useEffect(() => {
  //   fetchMaterials()
  // }, [])

  // const fetchMaterials = async () => {
  //   try {
  //     const { data, error } = await supabase
  //       .from("course_materials")
  //       .select("*")
  //       .order("created_at", { ascending: false })
  //
  //     if (error) throw error
  //     setMaterials(data || [])
  //   } catch (error) {
  //     console.error("Error fetching materials:", error)
  //   } finally {
  //     setLoadingMaterials(false)
  //   }
  // }

  const getBlockHeaderColor = (color: string) => {
    switch (color) {
      case "blue":
        return "bg-slate-700"
      case "teal":
        return "bg-teal-800"
      case "amber":
        return "bg-amber-800"
      default:
        return "bg-slate-700"
    }
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins} min`
  }

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "syllabus":
        return "Syllabus"
      case "lecture":
        return "Lectures"
      case "assignment":
        return "Assignments"
      case "resource":
        return "Resources"
      case "template":
        return "Templates"
      default:
        return cat
    }
  }

  const getFileIcon = (fileType: string) => {
    if (fileType?.includes("image")) return <FileImage className="h-4 w-4" />
    if (fileType?.includes("spreadsheet") || fileType?.includes("excel")) return <FileSpreadsheet className="h-4 w-4" />
    if (fileType?.includes("presentation") || fileType?.includes("powerpoint"))
      return <Presentation className="h-4 w-4" />
    if (fileType?.includes("pdf")) return <FileText className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  const formatFileSize = (bytes: number) => {
    if (!bytes) return ""
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getFilteredMaterials = () => {
    return materials.filter((m) => {
      const clinicMatch = m.target_clinic === "all" || m.target_clinic === studentClinic
      const categoryMatch = filterCategory === "all" || m.category === filterCategory
      return clinicMatch && categoryMatch
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 pt-[48px] pl-12">
      <MainNavigation />

      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Class Course</h1>
            <p className="text-sm text-slate-500 mt-1">Weekly agenda, recordings, and course materials</p>
          </div>
          <Badge className="bg-blue-600 text-white">Spring 2025</Badge>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-slate-100 p-1">
            <TabsTrigger value="agenda" className="gap-2 data-[state=active]:bg-white">
              <Calendar className="h-4 w-4" />
              Weekly Agenda
            </TabsTrigger>
            <TabsTrigger value="recordings" className="gap-2 data-[state=active]:bg-white">
              <Video className="h-4 w-4" />
              Class Recordings
            </TabsTrigger>
            <TabsTrigger value="materials" className="gap-2 data-[state=active]:bg-white">
              <BookOpen className="h-4 w-4" />
              Course Materials
            </TabsTrigger>
          </TabsList>

          {/* Weekly Agenda Tab - View Only for Students */}
          <TabsContent value="agenda" className="space-y-4">
            {agenda ? (
              <Card className="overflow-hidden border-0 shadow-sm">
                <div className="bg-slate-800 text-white p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold tracking-tight">SEED Clinic Schedule</h2>
                      <p className="text-slate-300 text-sm mt-1">
                        {new Date(agenda.schedule_date).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}{" "}
                        • Director: {agenda.director_name}
                      </p>
                    </div>
                    {agenda.zoom_link && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => window.open(agenda.zoom_link, "_blank")}
                        className="gap-2 font-medium"
                      >
                        <Video className="h-4 w-4" />
                        Join Zoom
                      </Button>
                    )}
                  </div>
                </div>

                <CardContent className="p-0">
                  <div className="grid grid-cols-12 gap-0 bg-slate-100 border-b text-xs font-bold text-slate-600 uppercase tracking-wider">
                    <div className="col-span-3 p-4">Team</div>
                    <div className="col-span-4 p-4">Director</div>
                    <div className="col-span-2 p-4">Location</div>
                    <div className="col-span-3 p-4">Notes</div>
                  </div>

                  {agenda.schedule_data.map((block: any) => (
                    <div key={block.id}>
                      <div
                        className={`${getBlockHeaderColor(block.color)} px-4 py-3 flex items-center justify-between`}
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-lg font-bold text-white">{block.startTime}</span>
                          <span className="text-white/90 font-medium">{block.activity}</span>
                        </div>
                        <Badge className="bg-white/20 text-white border-0 font-semibold">{block.duration} min</Badge>
                      </div>

                      {block.sessions.map((session: any, idx: number) => (
                        <div
                          key={session.id}
                          className={`grid grid-cols-12 gap-0 items-center text-sm border-b last:border-b-0 ${
                            idx % 2 === 0 ? "bg-white" : "bg-slate-50"
                          }`}
                        >
                          <div className="col-span-3 p-4 font-medium text-slate-800">{session.team}</div>
                          <div className="col-span-4 p-4 text-slate-600">{session.directorInitials}</div>
                          <div className="col-span-2 p-4">
                            <span className="text-slate-600">{session.room}</span>
                            {session.roomNumber && <span className="text-slate-400 ml-1">#{session.roomNumber}</span>}
                          </div>
                          <div className="col-span-3 p-4 text-slate-500 text-xs italic">{session.notes || "—"}</div>
                        </div>
                      ))}
                    </div>
                  ))}

                  {agenda.notes && (
                    <div className="p-4 bg-amber-50 border-t">
                      <p className="text-sm font-medium text-amber-800">Note from Director:</p>
                      <p className="text-sm text-amber-700 mt-1">{agenda.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="p-8 text-center">
                <Calendar className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500">No agenda posted yet for this week</p>
                <p className="text-sm text-slate-400 mt-1">Check back later for the weekly schedule</p>
              </Card>
            )}
          </TabsContent>

          {/* Class Recordings Tab */}
          <TabsContent value="recordings" className="space-y-4">
            <Card className="overflow-hidden border-0 shadow-sm">
              <div className="bg-slate-800 text-white p-4">
                <h2 className="text-lg font-semibold">Class Recordings</h2>
                <p className="text-slate-300 text-sm">Watch recordings from previous class sessions</p>
              </div>

              <CardContent className="p-6">
                {recordings.length === 0 ? (
                  <div className="text-center py-12">
                    <Video className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-500">No class recordings available yet</p>
                    <p className="text-sm text-slate-400 mt-1">Recordings will appear here after each class session</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recordings.map((recording) => (
                      <div
                        key={recording.id}
                        className="border border-slate-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow group"
                      >
                        {/* Thumbnail */}
                        <div className="relative aspect-video bg-slate-100">
                          <img
                            src={recording.thumbnail_url || "/placeholder.svg"}
                            alt={recording.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button
                              size="sm"
                              className="gap-2"
                              onClick={() => window.open(recording.video_url, "_blank")}
                            >
                              <Play className="h-4 w-4" />
                              Watch
                            </Button>
                          </div>
                          <Badge className="absolute top-2 left-2 bg-slate-900/80 text-white text-xs">
                            Week {recording.week_number}
                          </Badge>
                          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                            {formatDuration(recording.duration_minutes)}
                          </div>
                        </div>

                        {/* Info */}
                        <div className="p-3">
                          <h3 className="font-medium text-slate-800 line-clamp-1">{recording.title}</h3>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">{recording.description}</p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                            <Clock className="h-3 w-3" />
                            <span>
                              {new Date(recording.recorded_at).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Course Materials Tab - View Only */}
          <TabsContent value="materials" className="space-y-4">
            {/* Program-Wide Materials Section */}
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-blue-900 text-white px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5" />
                    <div>
                      <h2 className="font-bold">Program-Wide Materials</h2>
                      <p className="text-blue-200 text-xs">Available to all students across all clinics</p>
                    </div>
                  </div>
                  <span className="text-sm bg-blue-800 px-2 py-1 rounded">
                    {materials.filter((m) => m.target_clinic === "all").length} files
                  </span>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {/* Group by category */}
                {["syllabus", "lecture", "resource", "template"].map((category) => {
                  const categoryMaterials = materials.filter(
                    (m) => m.target_clinic === "all" && m.category === category,
                  )
                  if (categoryMaterials.length === 0) return null

                  return (
                    <div key={category}>
                      <div className="bg-slate-50 px-4 py-2 border-b border-slate-100">
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {getCategoryLabel(category)}s
                        </span>
                      </div>
                      {categoryMaterials.map((material) => (
                        <div
                          key={material.id}
                          className="px-4 py-3 hover:bg-slate-50 transition-colors flex items-center gap-4"
                        >
                          <div className="text-blue-600">{getFileIcon(material.file_type)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-slate-900">{material.title}</div>
                            {material.description && (
                              <p className="text-sm text-slate-500 truncate">{material.description}</p>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 whitespace-nowrap">{material.uploaded_by_name}</div>
                          <div className="text-xs text-slate-400 whitespace-nowrap">
                            {new Date(material.created_at).toLocaleDateString()}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )
                })}

                {materials.filter((m) => m.target_clinic === "all").length === 0 && (
                  <div className="px-4 py-8 text-center text-slate-400">
                    <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No program-wide materials available yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Clinic-Specific Materials Section */}
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-emerald-900 text-white px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building className="h-5 w-5" />
                    <div>
                      <h2 className="font-bold">{studentClinic} Materials</h2>
                      <p className="text-emerald-200 text-xs">Resources specific to your clinic</p>
                    </div>
                  </div>
                  <span className="text-sm bg-emerald-800 px-2 py-1 rounded">
                    {materials.filter((m) => m.target_clinic === studentClinic).length} files
                  </span>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {/* Group by category */}
                {["syllabus", "lecture", "assignment", "resource", "template"].map((category) => {
                  const categoryMaterials = materials.filter(
                    (m) => m.target_clinic === studentClinic && m.category === category,
                  )
                  if (categoryMaterials.length === 0) return null

                  return (
                    <div key={category}>
                      <div className="bg-slate-50 px-4 py-2 border-b border-slate-100">
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {getCategoryLabel(category)}s
                        </span>
                      </div>
                      {categoryMaterials.map((material) => (
                        <div
                          key={material.id}
                          className="px-4 py-3 hover:bg-slate-50 transition-colors flex items-center gap-4"
                        >
                          <div className="text-emerald-600">{getFileIcon(material.file_type)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-slate-900">{material.title}</div>
                            {material.description && (
                              <p className="text-sm text-slate-500 truncate">{material.description}</p>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 whitespace-nowrap">{material.uploaded_by_name}</div>
                          <div className="text-xs text-slate-400 whitespace-nowrap">
                            {new Date(material.created_at).toLocaleDateString()}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )
                })}

                {materials.filter((m) => m.target_clinic === studentClinic).length === 0 && (
                  <div className="px-4 py-8 text-center text-slate-400">
                    <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No clinic-specific materials available yet</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
