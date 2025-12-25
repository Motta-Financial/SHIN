"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useEffect, useState } from "react"
import {
  Building2,
  Users,
  Clock,
  AlertCircle,
  FileText,
  ExternalLink,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  Presentation,
  FileCheck,
  Calendar,
  Star,
  MessageSquare,
  TrendingUp,
  BarChart3,
  Mail,
  Globe,
  UserCheck,
  Activity,
} from "lucide-react"
import { getClinicColor } from "@/lib/clinic-colors"
import { Button } from "@/components/ui/button"
import { DocumentUpload } from "@/components/document-upload"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ClientServiceTab } from "@/components/client-service-tab"

interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  isTeamLeader: boolean
}

interface Client {
  id: string
  name: string
  clinic: string
  clinicId: string
  director: string
  directorId: string
  contactName: string
  email: string
  website: string
  students: number
  hoursLogged: number
  hoursTarget: number
  status: "on-track" | "at-risk" | "ahead"
  lastUpdate: string
  recentWork: string[]
  teamMembers: TeamMember[]
  semesterId: string
}

interface Document {
  id: string
  student_name: string
  student_id: string
  client_name: string
  client_id: string
  file_url: string
  file_name: string
  file_type: string
  description: string
  clinic: string
  uploaded_at: string
  submission_type: string
}

interface Evaluation {
  id: string
  document_id: string
  director_name: string
  question_1_rating: number
  question_2_rating: number
  question_3_rating: number
  question_4_rating: number
  question_5_rating: number
  question_1_notes: string
  question_2_notes: string
  question_3_notes: string
  question_4_notes: string
  question_5_notes: string
  additional_comments: string
  created_at: string
}

interface ClientEngagementsProps {
  selectedWeeks: string[]
  selectedClinic: string
}

// Grading breakdown from syllabus
const GRADING_BREAKDOWN = {
  attendance: { weight: 15, label: "Attendance & Participation", type: "Individual" },
  assignments: { weight: 15, label: "Written Assignments (5)", type: "Individual" },
  midterm: { weight: 20, label: "Mid-Term Presentation", type: "Team" },
  clientWork: { weight: 20, label: "Client Meetings & Work Process", type: "Team" },
  final: { weight: 30, label: "Final Presentation & Deliverables", type: "Team" },
}

const DELIVERABLE_INSTRUCTIONS = {
  sow: {
    title: "Statement of Work (SOW)",
    weight: "Part of Final Grade (30%)",
    description:
      "The Statement of Work outlines the project scope, objectives, deliverables, and timeline agreed upon between the student team and the client.",
    instructions: [
      "Define clear project objectives and success metrics",
      "Outline specific deliverables with deadlines",
      "Document client expectations and requirements",
      "Include timeline and milestones",
      "Get client sign-off before proceeding",
    ],
    dueInfo: "Due by Week 4 of the semester",
  },
  midterm: {
    title: "Mid-Term Presentation",
    weight: "Team Grade - 20%",
    description:
      "Quality of research, solution, recommendations, and presentation delivered for assigned mid-term presentation, presented to Instructors and guests. Based on evaluation by the panel members and instructors.",
    instructions: [
      "Present preliminary research findings",
      "Share initial recommendations and approach",
      "Demonstrate progress on SOW deliverables",
      "Address feedback from instructors and panel",
      "Show evidence of client collaboration",
    ],
    dueInfo: "Scheduled mid-semester (Week 7-8)",
  },
  final: {
    title: "Final Presentation",
    weight: "Team Grade - 30%",
    description:
      "Quality of research, solution and recommendations made to the client, including deliverables from the statement of work and the final presentation prepared and delivered by the student client team to the client. Based on an evaluation by the client and clinic directors.",
    instructions: [
      "Complete all SOW deliverables",
      "Prepare comprehensive final presentation",
      "Include actionable recommendations for client",
      "Document methodology and findings",
      "Present to client and clinic directors for evaluation",
    ],
    dueInfo: "Final week of semester",
  },
}

export function ClientEngagements({ selectedWeeks, selectedClinic }: ClientEngagementsProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [documents, setDocuments] = useState<Record<string, Document[]>>({})
  const [evaluations, setEvaluations] = useState<Record<string, Evaluation[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedClient, setExpandedClient] = useState<string | null>(null)
  const [clientTabs, setClientTabs] = useState<Record<string, string>>({})
  const [directorInfo, setDirectorInfo] = useState<{ id: string; name: string; email: string } | null>(null)

  const getClientTab = (clientId: string) => clientTabs[clientId] || "overview"
  const setClientTab = (clientId: string, tab: string) => {
    setClientTabs((prev) => ({ ...prev, [clientId]: tab }))
  }

  useEffect(() => {
    const fetchDirectorInfo = async () => {
      if (selectedClinic && selectedClinic !== "all") {
        try {
          const res = await fetch("/api/directors")
          if (res.ok) {
            const data = await res.json()
            const directors = data.directors || []
            // Find director by id or name
            const director = directors.find(
              (d: any) => d.id === selectedClinic || d.full_name?.toLowerCase().includes(selectedClinic.toLowerCase()),
            )
            if (director) {
              setDirectorInfo({
                id: director.id,
                name: director.full_name,
                email: director.email || `${director.full_name?.toLowerCase().replace(/\s+/g, ".")}@suffolk.edu`,
              })
            }
          }
        } catch (err) {
          console.error("Error fetching director info:", err)
        }
      }
    }
    fetchDirectorInfo()
  }, [selectedClinic])

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        setError(null)

        const [clientsRes, debriefsRes, mappingRes, docsRes] = await Promise.all([
          fetch("/api/supabase/clients"),
          fetch("/api/supabase/debriefs"),
          fetch("/api/supabase/v-complete-mapping"),
          fetch("/api/documents"),
        ])

        if (!clientsRes.ok) {
          throw new Error("Failed to fetch clients from Supabase")
        }

        const clientsData = await clientsRes.json()
        const debriefsData = debriefsRes.ok ? await debriefsRes.json() : { debriefs: [] }
        const mappingData = mappingRes.ok ? await mappingRes.json() : { records: [] }
        const docsData = docsRes.ok ? await docsRes.json() : { documents: [] }

        console.log("[v0] ClientEngagements - clientsData:", JSON.stringify(clientsData).slice(0, 200))
        console.log("[v0] ClientEngagements - clients count:", clientsData.clients?.length || 0)

        // Process documents by client
        const docsByClient: Record<string, Document[]> = {}
        docsData.documents?.forEach((doc: Document) => {
          const clientId = doc.client_id
          if (clientId) {
            if (!docsByClient[clientId]) {
              docsByClient[clientId] = []
            }
            docsByClient[clientId].push(doc)
          }
        })
        setDocuments(docsByClient)

        // Build team members from mapping
        const teamMembersByClient = new Map<string, TeamMember[]>()
        mappingData.records?.forEach((record: any) => {
          const clientId = record.client_id
          if (clientId && record.student_id) {
            if (!teamMembersByClient.has(clientId)) {
              teamMembersByClient.set(clientId, [])
            }
            const existing = teamMembersByClient.get(clientId)!
            if (!existing.find((m) => m.id === record.student_id)) {
              existing.push({
                id: record.student_id,
                name: record.student_name || "Unknown",
                email: record.student_email || "",
                role: record.student_role || "Consultant",
                isTeamLeader: record.student_role === "Team Leader",
              })
            }
          }
        })

        // Build hours by client from debriefs
        const hoursByClient = new Map<string, number>()
        const recentWorkByClient = new Map<string, string[]>()
        const latestUpdateByClient = new Map<string, Date>()

        debriefsData.debriefs?.forEach((debrief: any) => {
          const clientId = debrief.clientId
          const weekEnding = debrief.weekEnding
          const matchesWeek = selectedWeeks.length === 0 || selectedWeeks.includes(weekEnding)

          if (clientId && matchesWeek) {
            const hours = Number.parseFloat(debrief.hoursWorked || "0")
            hoursByClient.set(clientId, (hoursByClient.get(clientId) || 0) + hours)

            if (debrief.workSummary) {
              const workList = recentWorkByClient.get(clientId) || []
              if (workList.length < 3) {
                workList.push(debrief.workSummary)
                recentWorkByClient.set(clientId, workList)
              }
            }

            if (weekEnding) {
              const date = new Date(weekEnding)
              const current = latestUpdateByClient.get(clientId)
              if (!current || date > current) {
                latestUpdateByClient.set(clientId, date)
              }
            }
          }
        })

        const clientsList: Client[] = []
        const clientsArray = clientsData.clients || []

        clientsArray.forEach((client: any) => {
          const clinicName = client.clinicName || client.clinic || "Unknown"
          const matchesClinic =
            selectedClinic === "all" || clinicName.toLowerCase().includes(selectedClinic.toLowerCase())

          if (matchesClinic) {
            const teamMembers = teamMembersByClient.get(client.id) || []
            const hoursLogged = hoursByClient.get(client.id) || 0
            const hoursTarget = 60 // Default target per client

            let status: "on-track" | "at-risk" | "ahead" = "on-track"
            const progress = (hoursLogged / hoursTarget) * 100
            if (progress >= 100) status = "ahead"
            else if (progress < 40) status = "at-risk"

            clientsList.push({
              id: client.id,
              name: client.name || "Unknown Client",
              clinic: clinicName,
              clinicId: client.clinicId || "",
              director: client.directorName || client.director || "Director TBD",
              directorId: client.primary_director_id || client.directorId || "",
              contactName: client.contactName || client.contact_name || "",
              email: client.email || "",
              website: client.website || "",
              students: teamMembers.length,
              hoursLogged,
              hoursTarget,
              status,
              lastUpdate: latestUpdateByClient.has(client.id) ? "This week" : "No updates",
              recentWork: recentWorkByClient.get(client.id) || [],
              teamMembers,
              semesterId: client.semesterId || client.semester_id || "",
            })
          }
        })

        console.log("[v0] ClientEngagements - processed clients:", clientsList.length)
        setClients(clientsList)
      } catch (err) {
        console.error("[v0] ClientEngagements error:", err)
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedWeeks, selectedClinic])

  const fetchEvaluationsForDocument = async (documentId: string) => {
    try {
      const res = await fetch(`/api/documents/evaluations?documentId=${documentId}`)
      if (res.ok) {
        const data = await res.json()
        setEvaluations((prev) => ({
          ...prev,
          [documentId]: data.evaluations || [],
        }))
      }
    } catch (err) {
      console.error("Error fetching evaluations:", err)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ahead":
        return "bg-green-100 text-green-800 border-green-200"
      case "on-track":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "at-risk":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ahead":
        return <CheckCircle2 className="h-4 w-4" />
      case "on-track":
        return <Clock className="h-4 w-4" />
      case "at-risk":
        return <AlertCircle className="h-4 w-4" />
      default:
        return null
    }
  }

  const getDocumentsByType = (clientId: string, type: string) => {
    const clientDocs = documents[clientId] || []
    return clientDocs.filter(
      (doc) =>
        doc.submission_type?.toLowerCase() === type.toLowerCase() ||
        doc.file_name?.toLowerCase().includes(type.toLowerCase()),
    )
  }

  const getDeliverableStatus = (clientId: string, type: string) => {
    const docs = getDocumentsByType(clientId, type)
    if (docs.length === 0) return { status: "pending", label: "Not Submitted", color: "bg-gray-100 text-gray-700" }

    const hasEval = docs.some((doc) => evaluations[doc.id]?.length > 0)
    if (hasEval) return { status: "graded", label: "Graded", color: "bg-green-100 text-green-700" }

    return { status: "submitted", label: "Submitted", color: "bg-blue-100 text-blue-700" }
  }

  const handleUploadComplete = (clientId: string) => {
    // Refresh documents for this client
    fetch("/api/documents")
      .then((res) => res.json())
      .then((data) => {
        const docsByClient: Record<string, Document[]> = {}
        data.documents?.forEach((doc: Document) => {
          const cId = doc.client_id
          if (cId) {
            if (!docsByClient[cId]) docsByClient[cId] = []
            docsByClient[cId].push(doc)
          }
        })
        setDocuments(docsByClient)
      })
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-6 bg-muted rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <p>Error loading client engagements: {error}</p>
        </div>
      </Card>
    )
  }

  if (clients.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No client engagements found for selected filters</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700">{clients.length}</p>
                <p className="text-xs text-blue-600">Active Clients</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500 rounded-lg">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-700">{clients.reduce((sum, c) => sum + c.students, 0)}</p>
                <p className="text-xs text-emerald-600">Total Students</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-700">
                  {clients.reduce((sum, c) => sum + c.hoursLogged, 0).toFixed(0)}
                </p>
                <p className="text-xs text-purple-600">Hours Logged</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500 rounded-lg">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-700">
                  {Object.values(documents).reduce((sum, docs) => sum + docs.length, 0)}
                </p>
                <p className="text-xs text-amber-600">Documents</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-rose-50 to-rose-100/50 border-rose-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-500 rounded-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-rose-700">
                  {Math.round(
                    (clients.reduce((sum, c) => sum + c.hoursLogged, 0) /
                      Math.max(
                        clients.reduce((sum, c) => sum + c.hoursTarget, 0),
                        1,
                      )) *
                      100,
                  )}
                  %
                </p>
                <p className="text-xs text-rose-600">Avg Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-muted/30 border-dashed">
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Syllabus Grading Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="py-2">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
            {Object.entries(GRADING_BREAKDOWN).map(([key, item]) => (
              <div key={key} className="flex flex-col">
                <span className="font-medium text-foreground">{item.weight}%</span>
                <span className="text-muted-foreground">{item.label}</span>
                <Badge variant="outline" className="w-fit mt-1 text-[10px]">
                  {item.type}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Client Cards */}
      <div className="space-y-4">
        {clients.map((client) => {
          const colors = getClinicColor(client.clinic)
          const clientDocs = documents[client.id] || []
          const progress = Math.min((client.hoursLogged / client.hoursTarget) * 100, 100)
          const isExpanded = expandedClient === client.id

          const sowStatus = getDeliverableStatus(client.id, "sow")
          const midtermStatus = getDeliverableStatus(client.id, "midterm")
          const finalStatus = getDeliverableStatus(client.id, "final")

          return (
            <Card key={client.id} className="overflow-hidden border-l-4" style={{ borderLeftColor: colors.hex }}>
              {/* Client Header - Always Visible */}
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg text-foreground">{client.name}</h3>
                      <Badge className={getStatusColor(client.status)}>
                        {getStatusIcon(client.status)}
                        <span className="ml-1 capitalize">{client.status.replace("-", " ")}</span>
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {client.clinic} • {client.director}
                    </p>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                      {client.contactName && (
                        <span className="flex items-center gap-1">
                          <UserCheck className="h-3 w-3" />
                          {client.contactName}
                        </span>
                      )}
                      {client.email && (
                        <a
                          href={`mailto:${client.email}`}
                          className="flex items-center gap-1 hover:text-primary transition-colors"
                        >
                          <Mail className="h-3 w-3" />
                          {client.email}
                        </a>
                      )}
                      {client.website && (
                        <a
                          href={client.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:text-primary transition-colors"
                        >
                          <Globe className="h-3 w-3" />
                          Website
                        </a>
                      )}
                    </div>
                  </div>

                  <Button variant="ghost" size="sm" onClick={() => setExpandedClient(isExpanded ? null : client.id)}>
                    {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </Button>
                </div>

                {/* Quick Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                  <div className="text-center p-2 bg-muted/50 rounded">
                    <div className="text-lg font-semibold">{client.students}</div>
                    <div className="text-xs text-muted-foreground">Students</div>
                  </div>
                  <div className="text-center p-2 bg-muted/50 rounded">
                    <div className="text-lg font-semibold">{client.hoursLogged.toFixed(1)}h</div>
                    <div className="text-xs text-muted-foreground">Hours Logged</div>
                  </div>
                  <div className="text-center p-2 bg-muted/50 rounded">
                    <div className="text-lg font-semibold">{clientDocs.length}</div>
                    <div className="text-xs text-muted-foreground">Documents</div>
                  </div>
                  {/* Deliverable Status Badges */}
                  <div className="col-span-2 flex items-center justify-center gap-2 flex-wrap">
                    <Badge className={`${sowStatus.color} text-xs`}>
                      <FileCheck className="h-3 w-3 mr-1" />
                      SOW: {sowStatus.label}
                    </Badge>
                    <Badge className={`${midtermStatus.color} text-xs`}>
                      <Presentation className="h-3 w-3 mr-1" />
                      Mid: {midtermStatus.label}
                    </Badge>
                    <Badge className={`${finalStatus.color} text-xs`}>
                      <Star className="h-3 w-3 mr-1" />
                      Final: {finalStatus.label}
                    </Badge>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Hours Progress</span>
                    <span className="font-medium">
                      {client.hoursLogged.toFixed(1)} / {client.hoursTarget}h
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              </div>

              {isExpanded && (
                <div className="border-t bg-muted/20 p-6">
                  <Tabs
                    value={getClientTab(client.id)}
                    onValueChange={(v) => setClientTab(client.id, v)}
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-5">
                      <TabsTrigger value="overview" className="text-xs">
                        <BarChart3 className="h-3 w-3 mr-1" />
                        Overview
                      </TabsTrigger>
                      <TabsTrigger value="deliverables" className="text-xs">
                        <FileCheck className="h-3 w-3 mr-1" />
                        Deliverables
                      </TabsTrigger>
                      <TabsTrigger value="service" className="text-xs">
                        <MessageSquare className="h-3 w-3 mr-1" />
                        Client Service
                      </TabsTrigger>
                      <TabsTrigger value="team" className="text-xs">
                        <Users className="h-3 w-3 mr-1" />
                        Team ({client.students})
                      </TabsTrigger>
                      <TabsTrigger value="activity" className="text-xs">
                        <Activity className="h-3 w-3 mr-1" />
                        Activity
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Client Details Card */}
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <Building2 className="h-4 w-4" />
                              Client Details
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <p className="text-muted-foreground text-xs">Contact</p>
                                <p className="font-medium">{client.contactName || "Not specified"}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">Email</p>
                                <p className="font-medium truncate">{client.email || "Not specified"}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">Website</p>
                                {client.website ? (
                                  <a
                                    href={client.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-medium text-primary hover:underline truncate block"
                                  >
                                    {client.website.replace(/^https?:\/\//, "")}
                                  </a>
                                ) : (
                                  <p className="font-medium">Not specified</p>
                                )}
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">Clinic Director</p>
                                <p className="font-medium">{client.director}</p>
                              </div>
                              {directorInfo && (
                                <>
                                  <div>
                                    <p className="text-muted-foreground text-xs">Director Email</p>
                                    <a
                                      href={`mailto:${directorInfo.email}`}
                                      className="font-medium text-primary hover:underline truncate block"
                                    >
                                      {directorInfo.email}
                                    </a>
                                  </div>
                                </>
                              )}
                            </div>
                          </CardContent>
                        </Card>

                        {/* Progress Summary Card */}
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <TrendingUp className="h-4 w-4" />
                              Progress Summary
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Hours Progress</span>
                                <span className="font-medium">{Math.round(progress)}%</span>
                              </div>
                              <Progress value={progress} className="h-2" />
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-center">
                              <div className="p-2 bg-muted rounded">
                                <p className="text-lg font-bold">{client.hoursLogged.toFixed(0)}</p>
                                <p className="text-xs text-muted-foreground">Hours</p>
                              </div>
                              <div className="p-2 bg-muted rounded">
                                <p className="text-lg font-bold">{clientDocs.length}</p>
                                <p className="text-xs text-muted-foreground">Docs</p>
                              </div>
                              <div className="p-2 bg-muted rounded">
                                <p className="text-lg font-bold">{client.students}</p>
                                <p className="text-xs text-muted-foreground">Team</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Deliverable Status Card */}
                        <Card className="md:col-span-2">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4" />
                              Deliverable Status
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-3 gap-4">
                              <div className="p-3 border rounded-lg text-center">
                                <FileCheck className="h-6 w-6 mx-auto mb-2 text-primary" />
                                <p className="font-medium text-sm">Statement of Work</p>
                                <Badge className={`${sowStatus.color} mt-2`}>{sowStatus.label}</Badge>
                              </div>
                              <div className="p-3 border rounded-lg text-center">
                                <Presentation className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                                <p className="font-medium text-sm">Mid-Term</p>
                                <Badge className={`${midtermStatus.color} mt-2`}>{midtermStatus.label}</Badge>
                              </div>
                              <div className="p-3 border rounded-lg text-center">
                                <Star className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
                                <p className="font-medium text-sm">Final</p>
                                <Badge className={`${finalStatus.color} mt-2`}>{finalStatus.label}</Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>

                    {/* Deliverables Tab - existing code */}
                    <TabsContent value="deliverables" className="mt-4">
                      <Accordion type="single" collapsible defaultValue="sow">
                        {/* Statement of Work Section */}
                        <AccordionItem value="sow">
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center gap-3">
                              <FileCheck className="h-5 w-5 text-primary" />
                              <div className="text-left">
                                <div className="font-medium">{DELIVERABLE_INSTRUCTIONS.sow.title}</div>
                                <div className="text-xs text-muted-foreground">
                                  {DELIVERABLE_INSTRUCTIONS.sow.weight}
                                </div>
                              </div>
                              <Badge className={sowStatus.color}>{sowStatus.label}</Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-4 pt-2">
                              <div className="bg-background p-4 rounded-lg border">
                                <p className="text-sm text-muted-foreground mb-3">
                                  {DELIVERABLE_INSTRUCTIONS.sow.description}
                                </p>
                                <div className="text-sm">
                                  <p className="font-medium mb-2">Instructions:</p>
                                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                    {DELIVERABLE_INSTRUCTIONS.sow.instructions.map((inst, i) => (
                                      <li key={i}>{inst}</li>
                                    ))}
                                  </ul>
                                </div>
                                <div className="mt-3 flex items-center gap-2 text-xs text-primary">
                                  <Calendar className="h-3 w-3" />
                                  {DELIVERABLE_INSTRUCTIONS.sow.dueInfo}
                                </div>
                              </div>

                              {/* Upload Section */}
                              <div className="border rounded-lg p-4">
                                <DocumentUpload
                                  clientId={client.id}
                                  clientName={client.name}
                                  clinic={client.clinic}
                                  studentName="Director"
                                  submissionType="sow"
                                  title="Upload Statement of Work"
                                  description="Upload the completed SOW document"
                                  onUploadComplete={() => handleUploadComplete(client.id)}
                                  compact
                                />
                              </div>

                              {/* Existing Documents */}
                              {getDocumentsByType(client.id, "sow").length > 0 && (
                                <div className="space-y-2">
                                  <p className="text-sm font-medium">Submitted Documents</p>
                                  {getDocumentsByType(client.id, "sow").map((doc) => (
                                    <div
                                      key={doc.id}
                                      className="flex items-center justify-between p-3 border rounded-lg bg-background"
                                    >
                                      <div className="flex items-center gap-3">
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                          <p className="text-sm font-medium">{doc.file_name}</p>
                                          <p className="text-xs text-muted-foreground">
                                            {doc.student_name} • {new Date(doc.uploaded_at).toLocaleDateString()}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Button variant="outline" size="sm" asChild>
                                          <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="h-4 w-4" />
                                          </a>
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>

                        {/* Mid-Term & Final sections remain the same */}
                        <AccordionItem value="midterm">
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center gap-3">
                              <Presentation className="h-5 w-5 text-orange-500" />
                              <div className="text-left">
                                <div className="font-medium">{DELIVERABLE_INSTRUCTIONS.midterm.title}</div>
                                <div className="text-xs text-muted-foreground">
                                  {DELIVERABLE_INSTRUCTIONS.midterm.weight}
                                </div>
                              </div>
                              <Badge className={midtermStatus.color}>{midtermStatus.label}</Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-4 pt-2">
                              <div className="bg-background p-4 rounded-lg border">
                                <p className="text-sm text-muted-foreground mb-3">
                                  {DELIVERABLE_INSTRUCTIONS.midterm.description}
                                </p>
                                <div className="text-sm">
                                  <p className="font-medium mb-2">Instructions:</p>
                                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                    {DELIVERABLE_INSTRUCTIONS.midterm.instructions.map((inst, i) => (
                                      <li key={i}>{inst}</li>
                                    ))}
                                  </ul>
                                </div>
                                <div className="mt-3 flex items-center gap-2 text-xs text-orange-600">
                                  <Calendar className="h-3 w-3" />
                                  {DELIVERABLE_INSTRUCTIONS.midterm.dueInfo}
                                </div>
                              </div>

                              <div className="border rounded-lg p-4">
                                <DocumentUpload
                                  clientId={client.id}
                                  clientName={client.name}
                                  clinic={client.clinic}
                                  studentName="Director"
                                  submissionType="midterm"
                                  title="Upload Mid-Term Presentation"
                                  description="Upload presentation slides or supporting materials"
                                  onUploadComplete={() => handleUploadComplete(client.id)}
                                  compact
                                />
                              </div>

                              {getDocumentsByType(client.id, "midterm").length > 0 && (
                                <div className="space-y-2">
                                  <p className="text-sm font-medium">Submitted Documents</p>
                                  {getDocumentsByType(client.id, "midterm").map((doc) => (
                                    <div
                                      key={doc.id}
                                      className="flex items-center justify-between p-3 border rounded-lg bg-background"
                                    >
                                      <div className="flex items-center gap-3">
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                          <p className="text-sm font-medium">{doc.file_name}</p>
                                          <p className="text-xs text-muted-foreground">
                                            {doc.student_name} • {new Date(doc.uploaded_at).toLocaleDateString()}
                                          </p>
                                        </div>
                                      </div>
                                      <Button variant="outline" size="sm" asChild>
                                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                                          <ExternalLink className="h-4 w-4" />
                                        </a>
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="final">
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center gap-3">
                              <Star className="h-5 w-5 text-yellow-500" />
                              <div className="text-left">
                                <div className="font-medium">{DELIVERABLE_INSTRUCTIONS.final.title}</div>
                                <div className="text-xs text-muted-foreground">
                                  {DELIVERABLE_INSTRUCTIONS.final.weight}
                                </div>
                              </div>
                              <Badge className={finalStatus.color}>{finalStatus.label}</Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-4 pt-2">
                              <div className="bg-background p-4 rounded-lg border">
                                <p className="text-sm text-muted-foreground mb-3">
                                  {DELIVERABLE_INSTRUCTIONS.final.description}
                                </p>
                                <div className="text-sm">
                                  <p className="font-medium mb-2">Instructions:</p>
                                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                    {DELIVERABLE_INSTRUCTIONS.final.instructions.map((inst, i) => (
                                      <li key={i}>{inst}</li>
                                    ))}
                                  </ul>
                                </div>
                                <div className="mt-3 flex items-center gap-2 text-xs text-yellow-600">
                                  <Calendar className="h-3 w-3" />
                                  {DELIVERABLE_INSTRUCTIONS.final.dueInfo}
                                </div>
                              </div>

                              <div className="border rounded-lg p-4">
                                <DocumentUpload
                                  clientId={client.id}
                                  clientName={client.name}
                                  clinic={client.clinic}
                                  studentName="Director"
                                  submissionType="final"
                                  title="Upload Final Presentation"
                                  description="Upload final presentation and deliverables"
                                  onUploadComplete={() => handleUploadComplete(client.id)}
                                  compact
                                />
                              </div>

                              {getDocumentsByType(client.id, "final").length > 0 && (
                                <div className="space-y-2">
                                  <p className="text-sm font-medium">Submitted Documents</p>
                                  {getDocumentsByType(client.id, "final").map((doc) => (
                                    <div
                                      key={doc.id}
                                      className="flex items-center justify-between p-3 border rounded-lg bg-background"
                                    >
                                      <div className="flex items-center gap-3">
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                          <p className="text-sm font-medium">{doc.file_name}</p>
                                          <p className="text-xs text-muted-foreground">
                                            {doc.student_name} • {new Date(doc.uploaded_at).toLocaleDateString()}
                                          </p>
                                        </div>
                                      </div>
                                      <Button variant="outline" size="sm" asChild>
                                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                                          <ExternalLink className="h-4 w-4" />
                                        </a>
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </TabsContent>

                    {/* CHANGE: Updated ClientServiceTab to pass director email properly */}
                    <TabsContent value="service" className="mt-4">
                      <ClientServiceTab
                        clientId={client.id}
                        clientName={client.name}
                        currentUser={{
                          id: directorInfo?.id || client.directorId || "director",
                          name: directorInfo?.name || client.director || "Director",
                          email: directorInfo?.email || "",
                          type: "director",
                        }}
                        teamMembers={client.teamMembers.map((m) => ({
                          id: m.id,
                          name: m.name,
                          email: m.email,
                        }))}
                      />
                    </TabsContent>

                    {/* Team Tab */}
                    <TabsContent value="team" className="mt-4">
                      <div className="space-y-3">
                        {client.teamMembers.length > 0 ? (
                          client.teamMembers.map((member) => (
                            <div
                              key={member.id}
                              className="flex items-center justify-between p-3 border rounded-lg bg-background"
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                  <span className="text-sm font-medium text-primary">
                                    {member.name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{member.name}</p>
                                  <p className="text-xs text-muted-foreground">{member.email}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {member.isTeamLeader && (
                                  <Badge variant="outline" className="text-xs">
                                    Team Leader
                                  </Badge>
                                )}
                                <Badge variant="secondary" className="text-xs">
                                  {member.role}
                                </Badge>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-6 text-muted-foreground">
                            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No team members assigned yet</p>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    {/* Activity Tab */}
                    <TabsContent value="activity" className="mt-4">
                      <div className="space-y-3">
                        {client.recentWork.length > 0 ? (
                          client.recentWork.map((work, i) => (
                            <div key={i} className="p-3 border rounded-lg bg-background">
                              <div className="flex items-start gap-3">
                                <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <p className="text-sm">{work}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-6 text-muted-foreground">
                            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No recent activity recorded</p>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
