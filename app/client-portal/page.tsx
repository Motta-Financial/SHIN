"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { MainNavigation } from "@/components/main-navigation"
import { getErrorMessage, isAuthError, isPermissionError } from "@/lib/error-handler"
import { ClientPortalHeader } from "@/components/client-portal-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Building2,
  Users,
  FileText,
  MessageSquare,
  TrendingUp,
  HelpCircle,
  AlertCircle,
  Eye,
  Calendar,
  Clock,
  MapPin,
  Video,
} from "lucide-react"
import { Triage } from "@/components/triage"
import { useDemoMode } from "@/contexts/demo-mode-context"
import { useUserRole, canAccessPortal, getDefaultPortal } from "@/hooks/use-user-role"

import { ClientTeamCard } from "@/components/client-portal/client-team-card"
import { ClientTasksCard } from "@/components/client-portal/client-tasks-card"
import { ClientQuestionsCard } from "@/components/client-portal/client-questions-card"
import { ClientDocumentUpload } from "@/components/client-portal/client-document-upload"
import { ClientProgressCard } from "@/components/client-portal/client-progress-card"
import { ClientDeliverablesCard } from "@/components/client-portal/client-deliverables-card"

interface Client {
  id: string
  name: string
  email: string
  contactName: string
  website: string
  projectType: string
  status: string
  semester: string
  alumniMentor: string
}

interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  clinic: string
  isTeamLeader: boolean
  linkedinProfile?: string
  academicLevel?: string
  education?: string
}

interface Director {
  id: string
  name: string
  email: string
  clinic: string
  jobTitle: string
  role: string
  isPrimary: boolean
}

interface AvailableClient {
  id: string
  name: string
  email: string
}

interface ClientMeeting {
  id: string
  week_number: number
  week_label: string
  week_start: string
  week_end: string
  client_name: string
  start_time: string
  end_time: string
  minutes: number
  room_assignment?: string
  zoom_link?: string
  notes?: string
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const fetchWithRetry = async (url: string, retries = 3, delayMs = 500): Promise<Response> => {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url)
    if (res.ok) return res
    if (res.status === 429 && i < retries - 1) {
      // Rate limited - wait and retry
      await delay(delayMs * (i + 1))
      continue
    }
    return res
  }
  return fetch(url) // Final attempt
}

export default function ClientPortalPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { isDemoMode } = useDemoMode()
  const { role, email: userEmail, isLoading: roleLoading, isAuthenticated, clientId: authClientId, studentId: authStudentId } = useUserRole()

  const tabFromUrl = searchParams.get("tab") || "overview"
  const [activeTab, setActiveTab] = useState(tabFromUrl)

  useEffect(() => {
    const tab = searchParams.get("tab") || "overview"
    setActiveTab(tab)
  }, [searchParams])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    if (value === "overview") {
      router.push("/client-portal", { scroll: false })
    } else {
      router.push(`/client-portal?tab=${value}`, { scroll: false })
    }
  }

  const [availableClients, setAvailableClients] = useState<Array<{ id: string; name: string }>>([])
  const [selectedClientId, setSelectedClientId] = useState<string>("")

  const [loading, setLoading] = useState(true)
  const [client, setClient] = useState<Client | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [directors, setDirectors] = useState<Director[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [questions, setQuestions] = useState<any[]>([])
  const [clientDocuments, setClientDocuments] = useState<any[]>([])
  const [deliverables, setDeliverables] = useState<any[]>([])
  const [progress, setProgress] = useState({
    totalHours: 0,
    uniqueStudents: 0,
    weeklyProgress: [] as any[],
  })
  const [signedAgreements, setSignedAgreements] = useState<string[]>([])
  const [meetings, setMeetings] = useState<ClientMeeting[]>([]) // Added meetings state

  useEffect(() => {
    if (!roleLoading && !isDemoMode) {
      // Directors and admins can always access
      if (role === "director" || role === "admin") return
      // Students can access client portal
      if (role === "student") return
      // Clients can access their own portal
      if (role === "client") return
      // Not authenticated - redirect to login
      if (!isAuthenticated) {
        router.push("/login")
        return
      }
      // Authenticated but wrong role - redirect to their portal
      if (!canAccessPortal(role, "client")) {
        router.push(getDefaultPortal(role))
        return
      }
    }
  }, [role, roleLoading, isAuthenticated, isDemoMode, router])

  const canSwitchClients = isDemoMode || role === "admin" || role === "director" || role === "student"

  useEffect(() => {
    const fetchAvailableClients = async () => {
      try {
        // Add small delay to avoid rate limiting from navigation
        await delay(300)

        if (role === "client" && userEmail && !isDemoMode) {
          // Fetch client by email
          const res = await fetchWithRetry(`/api/clients?email=${encodeURIComponent(userEmail)}`)
          if (!res.ok) {
            console.error("Error fetching client by email:", res.status)
            return
          }
          const data = await res.json()
          if (data.clients && data.clients.length > 0) {
            setAvailableClients([{ id: data.clients[0].id, name: data.clients[0].name }])
            setSelectedClientId(data.clients[0].id)
          }
        } else {
          // Directors/Admins/Students can see all clients
          const res = await fetchWithRetry("/api/clients")
          if (!res.ok) {
            console.error("Error fetching all clients:", res.status)
            return
          }
          const data = await res.json()
          if (data.clients && data.clients.length > 0) {
            const clientList = data.clients.map((c: any) => ({
              id: c.id,
              name: c.name,
            }))

            // For students, pre-select their assigned client if available
            if (role === "student" && authClientId) {
              // Move the student's assigned client to the top of the list
              const assignedIndex = clientList.findIndex((c: any) => c.id === authClientId)
              if (assignedIndex > 0) {
                const [assigned] = clientList.splice(assignedIndex, 1)
                clientList.unshift(assigned)
              }
              setAvailableClients(clientList)
              setSelectedClientId(authClientId)
            } else {
              setAvailableClients(clientList)
              setSelectedClientId(data.clients[0].id)
            }
          }
        }
} catch (error) {
  console.error("Error fetching clients:", error)
  if (isAuthError(error)) {
    router.push("/sign-in")
  }
  }
  }

    if (!roleLoading) {
      fetchAvailableClients()
    }
  }, [role, userEmail, roleLoading, isDemoMode, authClientId])

  const fetchClientData = useCallback(async () => {
    if (!selectedClientId) return

    setLoading(true)
    try {
      const teamRes = await fetchWithRetry(`/api/client-portal/team?clientId=${selectedClientId}`)
      if (!teamRes.ok) {
        console.error("Error fetching team data:", teamRes.status)
        setLoading(false)
        return
      }
      const teamData = await teamRes.json()

      if (teamData.success && teamData.client) {
        setClient(teamData.client)
        setTeamMembers(teamData.teamMembers || [])
        setDirectors(teamData.directors || [])

        const clientId = teamData.client.id
        const clientEmail = teamData.client.email

        await delay(150)
        const tasksRes = await fetchWithRetry(`/api/client-portal/tasks?clientId=${clientId}`)
        const tasksData = tasksRes.ok ? await tasksRes.json() : { tasks: [] }
        setTasks(tasksData.tasks || [])

        await delay(150)
        const questionsRes = await fetchWithRetry(`/api/client-portal/questions?clientId=${clientId}`)
        const questionsData = questionsRes.ok ? await questionsRes.json() : { questions: [] }
        setQuestions(questionsData.questions || [])

        await delay(150)
        const docsRes = await fetchWithRetry(
          `/api/client-portal/client-documents?clientId=${clientId}`,
        )
        const docsData = docsRes.ok ? await docsRes.json() : { documents: [] }
        setClientDocuments(docsData.documents || [])

        await delay(150)
        const deliverablesRes = await fetchWithRetry(`/api/client-portal/deliverables?clientId=${clientId}`)
        const deliverablesData = deliverablesRes.ok ? await deliverablesRes.json() : { deliverables: [] }
        setDeliverables(deliverablesData.deliverables || [])

        await delay(150)
        const progressRes = await fetchWithRetry(`/api/client-portal/weekly-progress?clientId=${clientId}`)
        const progressData = progressRes.ok
          ? await progressRes.json()
          : { totalHours: 0, uniqueStudents: 0, weeklyProgress: [] }
        setProgress({
          totalHours: progressData.totalHours || 0,
          uniqueStudents: progressData.uniqueStudents || 0,
          weeklyProgress: progressData.weeklyProgress || [],
        })
      } else {
        setClient(null)
        setTeamMembers([])
        setDirectors([])
        setTasks([])
        setQuestions([])
        setClientDocuments([])
        setDeliverables([])
        setProgress({ totalHours: 0, uniqueStudents: 0, weeklyProgress: [] })
      }
} catch (error) {
  console.error("Error fetching client data:", error)
  if (isAuthError(error)) {
    router.push("/sign-in")
  }
  } finally {
  setLoading(false)
    }
  }, [selectedClientId])

  useEffect(() => {
    fetchClientData()
  }, [fetchClientData])

  useEffect(() => {
    const fetchSignedAgreements = async () => {
      if (!client?.email) return
      try {
        const response = await fetch(`/api/agreements?userEmail=${encodeURIComponent(client.email)}`)
        const data = await response.json()
        if (data.agreements) {
          setSignedAgreements(data.agreements.map((a: any) => a.agreement_type))
        }
      } catch (error) {
        console.error("Error fetching agreements:", error)
      }
    }
    fetchSignedAgreements()
  }, [client?.email])

  const fetchMeetings = useCallback(async () => {
    if (!selectedClientId) return
    try {
      const res = await fetch(`/api/scheduled-client-meetings?clientId=${selectedClientId}`)
      if (res.ok) {
        const data = await res.json()
        setMeetings(data.meetings || [])
      }
    } catch (error) {
      console.error("Error fetching client meetings:", error)
    }
  }, [selectedClientId])

  useEffect(() => {
    fetchMeetings()
  }, [fetchMeetings])

  const refreshTasks = () => {
    if (client?.id) {
      fetch(`/api/client-portal/tasks?clientId=${client.id}`)
        .then((res) => res.json())
        .then((data) => setTasks(data.tasks || []))
    }
  }

  const refreshQuestions = () => {
    if (client?.id) {
      fetch(`/api/client-portal/questions?clientId=${client.id}`)
        .then((res) => res.json())
        .then((data) => setQuestions(data.questions || []))
    }
  }

  const refreshDocuments = () => {
    if (client?.id) {
      fetch(`/api/client-portal/client-documents?clientId=${client.id}`)
        .then((res) => res.json())
        .then((data) => setClientDocuments(data.documents || []))
    }
  }

  const pendingTasks = tasks.filter((t) => t.status === "pending" || t.status === "in_progress")
  const openQuestions = questions.filter((q) => q.status === "open")

  if (availableClients.length === 0 && loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <aside className="fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-52 border-r bg-card z-40">
          <MainNavigation />
        </aside>
        <div className="pl-52 pt-14">
          <div className="p-4">
            <Card className="p-6 text-center">
              <p className="text-slate-500">Loading clients...</p>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-52 border-r bg-card z-40">
        <MainNavigation />
      </aside>

      <div className="pl-52 pt-14">
        <ClientPortalHeader />

        <div className="p-4">
          {canSwitchClients && availableClients.length > 1 && (
            <div className="mb-4 flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <Eye className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-blue-800 font-medium">
                  {role === "student" ? "Client Portal View" : "Viewing as Director/Admin"}
                </p>
                <p className="text-xs text-blue-600">
                  {role === "student" ? "View your assigned client's portal" : "Select a client to view their portal"}
                </p>
              </div>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger className="w-[240px] bg-white">
                  <SelectValue placeholder="Select a client to preview" />
                </SelectTrigger>
                <SelectContent>
                  {availableClients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Legacy demo mode indicator */}
          {isDemoMode && !canSwitchClients && (
            <div className="mb-4 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-amber-800 font-medium">Demo Mode</p>
                <p className="text-xs text-amber-600">
                  In production, clients will be authenticated and see only their own portal.
                </p>
              </div>
            </div>
          )}

          <div className="mb-4 bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-5 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-white/20 flex items-center justify-center">
                  <Building2 className="h-7 w-7 text-slate-300" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">
                    {loading
                      ? "Loading..."
                      : client?.contactName
                        ? `Welcome, ${client.contactName.split(" ")[0]}!`
                        : client?.name || "Client Portal"}
                  </h1>
                  <p className="text-slate-300 text-sm mt-0.5">
                    {client?.name
                      ? `${client.name} - ${client.projectType || "Business Consulting Engagement"}`
                      : "Business Consulting Engagement"}
                  </p>
                  {client?.semester && <Badge className="bg-slate-600 text-slate-200 mt-2">{client.semester}</Badge>}
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="text-right">
                  <p className="text-slate-400 text-xs">Team Size</p>
                  <p className="text-2xl font-bold">{teamMembers.length + directors.length}</p>
                </div>
                <div className="h-12 w-px bg-slate-600" />
                <div className="text-right">
                  <p className="text-slate-400 text-xs">Hours Logged</p>
                  <p className="text-2xl font-bold">{progress.totalHours.toFixed(1)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-6 mb-6">
            <Card className="p-5 border-slate-200 bg-white">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-blue-100">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Team Members</p>
                  <p className="text-xl font-bold text-slate-900">{teamMembers.length + directors.length}</p>
                </div>
              </div>
            </Card>
            <Card className="p-5 border-slate-200 bg-white">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-amber-100">
                  <MessageSquare className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Active Tasks</p>
                  <p className="text-xl font-bold text-slate-900">{pendingTasks.length}</p>
                </div>
              </div>
            </Card>
            <Card className="p-5 border-slate-200 bg-white">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-purple-100">
                  <HelpCircle className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Open Questions</p>
                  <p className="text-xl font-bold text-slate-900">{openQuestions.length}</p>
                </div>
              </div>
            </Card>
            <Card className="p-5 border-slate-200 bg-white">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-emerald-100">
                  <FileText className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Deliverables</p>
                  <p className="text-xl font-bold text-slate-900">{deliverables.length}</p>
                </div>
              </div>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
            <TabsList className="bg-muted/50 p-1">
              <TabsTrigger value="overview" className="data-[state=active]:bg-background">
                <TrendingUp className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="team" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Your Team
              </TabsTrigger>
              <TabsTrigger value="meetings" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Meetings
                {meetings.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {meetings.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="tasks" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Tasks & Q&A
              </TabsTrigger>
              <TabsTrigger value="documents" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Documents
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <Triage
                userType="client"
                userName={client?.contactName || client?.name || ""}
                userEmail={client?.email || ""}
                clientId={client?.id}
                programName="SEED Program"
                tasks={tasks}
                questions={questions}
                signedAgreements={signedAgreements as any}
                onAgreementSigned={(type) => {
                  setSignedAgreements((prev) => [...prev, type])
                }}
              />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ClientProgressCard
                  totalHours={progress.totalHours}
                  uniqueStudents={progress.uniqueStudents}
                  weeklyProgress={progress.weeklyProgress}
                  loading={loading}
                />
                <ClientTeamCard teamMembers={teamMembers} directors={directors} loading={loading} />
              </div>
              <ClientDeliverablesCard deliverables={deliverables} loading={loading} />
            </TabsContent>

            <TabsContent value="team">
              <ClientTeamCard teamMembers={teamMembers} directors={directors} loading={loading} />
            </TabsContent>

            <TabsContent value="meetings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Scheduled Meetings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {meetings.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>No meetings scheduled yet.</p>
                      <p className="text-sm mt-1">Your team will schedule meetings with you throughout the semester.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {meetings.map((meeting) => (
                        <div
                          key={meeting.id}
                          className="p-4 rounded-lg border bg-gradient-to-r from-teal-50 to-white border-teal-200"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <Badge variant="outline" className="bg-teal-100 text-teal-800 border-teal-200">
                                  {meeting.week_label}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {new Date(meeting.week_start).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                  })}{" "}
                                  -{" "}
                                  {new Date(meeting.week_end).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </span>
                              </div>
                              <h4 className="font-semibold text-lg text-slate-800">Client Meeting</h4>
                              <div className="flex items-center gap-4 mt-2 text-sm">
                                <span className="flex items-center gap-1 text-slate-600">
                                  <Clock className="h-4 w-4" />
                                  {meeting.start_time} - {meeting.end_time}
                                </span>
                                <span className="flex items-center gap-1 text-slate-600">
                                  <Badge variant="outline" className="text-xs">
                                    {meeting.minutes} min
                                  </Badge>
                                </span>
                              </div>
                              <div className="flex items-center gap-4 mt-2 text-sm">
                                {meeting.room_assignment && (
                                  <span className="flex items-center gap-1 text-slate-600">
                                    <MapPin className="h-4 w-4" />
                                    {meeting.room_assignment}
                                  </span>
                                )}
                                {meeting.zoom_link && (
                                  <a
                                    href={meeting.zoom_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-blue-600 hover:underline"
                                  >
                                    <Video className="h-4 w-4" />
                                    Join via Zoom
                                  </a>
                                )}
                              </div>
                              {meeting.notes && (
                                <p className="mt-2 text-sm text-slate-500 italic">Note: {meeting.notes}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tasks" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ClientTasksCard
                  tasks={tasks}
                  clientId={client?.id || ""}
                  clientName={client?.contactName || client?.name || "Client"}
                  clientEmail={client?.email || ""}
                  onCommentAdded={refreshTasks}
                  loading={loading}
                />
                <ClientQuestionsCard
                  questions={questions}
                  clientId={client?.id || ""}
                  clientName={client?.contactName || client?.name || "Client"}
                  clientEmail={client?.email || ""}
                  onQuestionAdded={refreshQuestions}
                  loading={loading}
                />
              </div>
            </TabsContent>

            <TabsContent value="documents" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ClientDocumentUpload
                  documents={clientDocuments}
                  clientId={client?.id || ""}
                  clientName={client?.contactName || client?.name || "Client"}
                  clientEmail={client?.email || ""}
                  onDocumentUploaded={refreshDocuments}
                  loading={loading}
                />
                <ClientDeliverablesCard deliverables={deliverables} loading={loading} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
