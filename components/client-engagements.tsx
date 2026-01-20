"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import {
  Building2,
  Users,
  Clock,
  AlertCircle,
  FileText,
  CheckCircle2,
  Star,
  TrendingUp,
  ChevronRight,
  Check,
  BarChart3,
  Presentation,
  Trophy,
  Search,
} from "lucide-react"
import { getClinicColor } from "@/lib/clinic-colors"
import { DocumentUpload } from "@/components/document-upload"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ClientServiceTab } from "@/components/client-service-tab"
// Removed: import { ClinicAgendaTab } from "@/components/clinic-agenda-tab" // Import removed
import { useDirectors } from "@/hooks/use-directors"

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

// Workflow stages type and helper function
const workflowStages = [
  { id: 1, name: "Discovery", icon: Search, description: "Client research & analysis" },
  { id: 2, name: "SOW Signed", icon: FileText, description: "Statement of Work finalized" },
  { id: 3, name: "Strategy", icon: BarChart3, description: "Developing recommendations" },
  { id: 4, name: "Deliverables", icon: Presentation, description: "Creating final outputs" },
  { id: 5, name: "Complete", icon: Trophy, description: "Project finished" },
]

function getWorkflowStage(progress: number): number {
  if (progress >= 100) return 5
  if (progress >= 75) return 4
  if (progress >= 50) return 3
  if (progress >= 25) return 2
  return 1
}

export function ClientEngagements({ selectedWeeks, selectedClinic }: ClientEngagementsProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [documents, setDocuments] = useState<Record<string, Document[]>>({})
  const [evaluations, setEvaluations] = useState<Record<string, Evaluation[]>>({})
  const [clientTabs, setClientTabs] = useState<Record<string, string>>({})
  const [mainTab, setMainTab] = useState<"clients" | "agenda">("clients") // Added state for main tab
  const { directors } = useDirectors()
  const [directorInfo, setDirectorInfo] = useState<{
    id: string
    name: string
    email: string
    clinicId?: string
    clinicName?: string
  } | null>(null) // Added clinicId and clinicName
  const searchParams = useSearchParams()
  const clientFromUrl = searchParams.get("client")

  const getClientTab = (clientId: string) => clientTabs[clientId] || "overview"
  const setClientTab = (clientId: string, tab: string) => {
    setClientTabs((prev) => ({ ...prev, [clientId]: tab }))
  }

  useEffect(() => {
    if (selectedClinic && selectedClinic !== "all" && directors.length > 0) {
      const director = directors.find(
        (d: any) => d.id === selectedClinic || d.full_name?.toLowerCase().includes(selectedClinic.toLowerCase()),
      )
      if (director) {
        setDirectorInfo({
          id: director.id,
          name: director.full_name,
          email: director.email || `${director.full_name?.toLowerCase().replace(/\s+/g, ".")}@suffolk.edu`,
          clinicId: director.clinic_id, // Added
          clinicName: director.clinic_name || director.clinic, // Added
        })
      }
    }
  }, [selectedClinic, directors])

  useEffect(() => {
    if (clientFromUrl && clients.length > 0) {
      const matchingClient = clients.find(
        (c) => c.name.toLowerCase() === decodeURIComponent(clientFromUrl).toLowerCase(),
      )
      if (matchingClient) {
        setSelectedClientId(matchingClient.id)
        return
      }
    }
    // Default: select first client if none selected
    if (clients.length > 0 && !selectedClientId && !clientFromUrl) {
      setSelectedClientId(null) // Show "All Clients" by default
    }
  }, [clients, clientFromUrl, selectedClientId])

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

  const selectedClient = clients.find((c) => c.id === selectedClientId)
  const selectedClientDocs = selectedClient ? documents[selectedClient.id] || [] : []
  const selectedProgress = selectedClient
    ? Math.min((selectedClient.hoursLogged / selectedClient.hoursTarget) * 100, 100)
    : 0

  if (loading) {
    // Loading state for split-pane layout
    return (
      <div className="flex gap-4 h-[600px]">
        <div className="w-72 flex-shrink-0 space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-muted rounded animate-pulse" />
          ))}
        </div>
        <div className="flex-1 bg-muted rounded animate-pulse" />
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

  if (clients.length === 0 && mainTab === "clients") {
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
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-[#112250] via-[#1a2d52] to-[#112250] rounded-xl p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Left - Title and subtitle */}
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#E0C58F] to-[#d0b57f] flex items-center justify-center shadow-md">
              <Building2 className="h-6 w-6 text-[#112250]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#F5F0E9]">Client Engagements</h1>
              <p className="text-sm text-[#9aacba]">Manage and track all client projects</p>
            </div>
          </div>

          {/* Right - Summary Stats in header */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg border border-white/20">
              <Building2 className="h-4 w-4 text-[#E0C58F]" />
              <span className="text-lg font-bold">{clients.length}</span>
              <span className="text-xs text-[#9aacba]">Clients</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg border border-white/20">
              <Users className="h-4 w-4 text-[#E0C58F]" />
              <span className="text-lg font-bold">{clients.reduce((sum, c) => sum + c.students, 0)}</span>
              <span className="text-xs text-[#9aacba]">Students</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg border border-white/20">
              <Clock className="h-4 w-4 text-[#E0C58F]" />
              <span className="text-lg font-bold">{clients.reduce((sum, c) => sum + c.hoursLogged, 0).toFixed(0)}</span>
              <span className="text-xs text-[#9aacba]">Hours</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg border border-white/20">
              <TrendingUp className="h-4 w-4 text-[#E0C58F]" />
              <span className="text-lg font-bold">
                {Math.round(
                  (clients.reduce((sum, c) => sum + c.hoursLogged, 0) /
                    Math.max(
                      clients.reduce((sum, c) => sum + c.hoursTarget, 0),
                      1,
                    )) *
                    100,
                )}
                %
              </span>
              <span className="text-xs text-[#9aacba]">Progress</span>
            </div>
          </div>
        </div>
      </div>

      {/* Client Tabs - Wrapping flex layout */}
      <div className="border-b pb-2">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedClientId(null)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              !selectedClientId ? "bg-[#112250] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All Clients ({clients.length})
          </button>
          {clients.map((client) => {
            const colors = getClinicColor(client.clinic)
            const isSelected = selectedClientId === client.id
            return (
              <button
                key={client.id}
                onClick={() => setSelectedClientId(client.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  isSelected ? "bg-[#112250] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: isSelected ? "#fff" : colors.hex }}
                />
                {client.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content Area */}
      <div>
        {/* All Clients View */}
        {!selectedClientId && (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {clients.map((client) => {
              const colors = getClinicColor(client.clinic)
              const progress = Math.min((client.hoursLogged / client.hoursTarget) * 100, 100)
              const clientDocs = documents[client.id] || []

              return (
                <Card
                  key={client.id}
                  className="p-4 cursor-pointer hover:shadow-md transition-shadow border-l-4"
                  style={{ borderLeftColor: colors.hex }}
                  onClick={() => setSelectedClientId(client.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{client.name}</h3>
                      <p className="text-xs text-gray-500">{client.clinic}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        client.status === "on-track"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : client.status === "ahead"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {client.status}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Progress</span>
                      <span className="font-medium">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                    <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {client.students} students
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {client.hoursLogged}/{client.hoursTarget}h
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {clientDocs.length}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-end mt-2 text-xs text-[#112250] font-medium">
                    View Details <ChevronRight className="h-3 w-3 ml-1" />
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {/* Single Client View */}
        {selectedClient && (
          <div className="space-y-4">
            {/* Client Header */}
            <div className="flex items-start justify-between p-4 bg-white rounded-lg border">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: getClinicColor(selectedClient.clinic).hex }}
                >
                  {selectedClient.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{selectedClient.name}</h2>
                  <p className="text-sm text-gray-500">{selectedClient.clinic}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="text-center">
                  <p className="font-bold text-gray-900">{selectedClient.students}</p>
                  <p className="text-xs text-gray-500">Students</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-gray-900">
                    {selectedClient.hoursLogged}/{selectedClient.hoursTarget}
                  </p>
                  <p className="text-xs text-gray-500">Hours</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-gray-900">{selectedClientDocs.length}</p>
                  <p className="text-xs text-gray-500">Docs</p>
                </div>
                <Badge
                  variant="outline"
                  className={`${
                    selectedClient.status === "on-track"
                      ? "bg-green-50 text-green-700 border-green-200"
                      : selectedClient.status === "ahead"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}
                >
                  {selectedClient.status}
                </Badge>
              </div>
            </div>

            <div className="p-4 bg-white rounded-lg border">
              <div className="flex items-center justify-between text-sm mb-3">
                <span className="font-medium text-gray-700">Project Workflow</span>
                <span className="font-semibold text-[#112250]">{Math.round(selectedProgress)}% Complete</span>
              </div>

              {/* Workflow Stages */}
              <div className="relative mb-3">
                {/* Progress Line */}
                <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200" />
                <div
                  className="absolute top-4 left-0 h-0.5 bg-[#505143] transition-all duration-500"
                  style={{ width: `${Math.min(selectedProgress, 100)}%` }}
                />

                {/* Stage Nodes */}
                <div className="relative flex justify-between">
                  {workflowStages.map((stage, index) => {
                    const currentStage = getWorkflowStage(selectedProgress)
                    const isCompleted = stage.id < currentStage
                    const isCurrent = stage.id === currentStage
                    const StageIcon = stage.icon

                    return (
                      <div key={stage.id} className="flex flex-col items-center" style={{ width: "20%" }}>
                        <div
                          className={`
                            w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300
                            ${
                              isCompleted
                                ? "bg-[#505143] border-[#505143] text-white"
                                : isCurrent
                                  ? "bg-white border-[#505143] text-[#505143]"
                                  : "bg-white border-gray-300 text-gray-400"
                            }
                          `}
                        >
                          {isCompleted ? <Check className="h-4 w-4" /> : <StageIcon className="h-4 w-4" />}
                        </div>
                        <span
                          className={`text-xs mt-1.5 text-center font-medium ${
                            isCompleted || isCurrent ? "text-gray-700" : "text-gray-400"
                          }`}
                        >
                          {stage.name}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Current Stage Description */}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                <Clock className="h-3.5 w-3.5 text-[#878568]" />
                <span className="text-xs text-gray-600">
                  Current:{" "}
                  <span className="font-medium text-gray-800">
                    {workflowStages[getWorkflowStage(selectedProgress) - 1]?.description || "Getting started"}
                  </span>
                </span>
              </div>
            </div>

            {/* Client Detail Tabs */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
                <TabsTrigger
                  value="overview"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#112250] data-[state=active]:bg-transparent"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="deliverables"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#112250] data-[state=active]:bg-transparent"
                >
                  Deliverables
                </TabsTrigger>
                <TabsTrigger
                  value="communication"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#112250] data-[state=active]:bg-transparent"
                >
                  Communication
                </TabsTrigger>
                <TabsTrigger
                  value="team"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#112250] data-[state=active]:bg-transparent"
                >
                  Team
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-4 space-y-4">
                {/* Contact Info */}
                <Card className="p-4">
                  <h3 className="font-semibold text-sm mb-3">Contact Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 text-xs">Contact Name</p>
                      <p className="font-medium">{selectedClient.contactName || "Not specified"}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Email</p>
                      <p className="font-medium">{selectedClient.email || "Not specified"}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Website</p>
                      <p className="font-medium">{selectedClient.website || "Not specified"}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Director</p>
                      <p className="font-medium">{selectedClient.director}</p>
                    </div>
                  </div>
                </Card>

                {/* Recent Activity */}
                <Card className="p-4">
                  <h3 className="font-semibold text-sm mb-3">Recent Work</h3>
                  {selectedClient.recentWork && selectedClient.recentWork.length > 0 ? (
                    <ul className="space-y-2">
                      {selectedClient.recentWork.map((work, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{work}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">No recent work logged</p>
                  )}
                </Card>
              </TabsContent>

              <TabsContent value="deliverables" className="mt-4">
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Documents ({selectedClientDocs.length})</h3>
                    <DocumentUpload
                      clientId={selectedClient.id}
                      clientName={selectedClient.name}
                      onUploadComplete={() => handleUploadComplete(selectedClient.id)}
                    />
                  </div>
                  {selectedClientDocs.length > 0 ? (
                    <div className="space-y-2">
                      {selectedClientDocs.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-gray-400" />
                            <div>
                              <p className="font-medium text-sm">{doc.file_name}</p>
                              <p className="text-xs text-gray-500">
                                {doc.student_name} • {new Date(doc.uploaded_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <a
                            href={doc.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[#112250] hover:underline"
                          >
                            View
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No documents uploaded yet</p>
                    </div>
                  )}
                </Card>
              </TabsContent>

              <TabsContent value="communication" className="mt-4">
                <ClientServiceTab
                  clientId={selectedClient.id}
                  clientName={selectedClient.name}
                  semesterId={selectedClient.semesterId}
                />
              </TabsContent>

              <TabsContent value="team" className="mt-4">
                <Card className="p-4">
                  <h3 className="font-semibold mb-4">Team Members ({selectedClient.teamMembers?.length || 0})</h3>
                  {selectedClient.teamMembers && selectedClient.teamMembers.length > 0 ? (
                    <div className="space-y-2">
                      {selectedClient.teamMembers.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#112250] text-white flex items-center justify-center text-sm font-medium">
                              {member.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{member.name}</p>
                              <p className="text-xs text-gray-500">{member.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {member.isTeamLeader && (
                              <Badge className="bg-amber-100 text-amber-700 text-[10px]">
                                <Star className="h-3 w-3 mr-1" />
                                Lead
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-[10px]">
                              {member.role}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No team members assigned</p>
                    </div>
                  )}
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  )
}

export default ClientEngagements
