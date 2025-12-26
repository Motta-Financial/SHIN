"use client"

import { useState, useEffect, useCallback } from "react"
import { MainNavigation } from "@/components/main-navigation"
import { ClientPortalHeader } from "@/components/client-portal-header"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building2, Users, FileText, MessageSquare, TrendingUp, HelpCircle, AlertCircle } from "lucide-react"
import { Triage } from "@/components/triage"

import { ClientTeamCard } from "@/components/client-portal/client-team-card"
import { ClientTasksCard } from "@/components/client-portal/client-tasks-card"
import { ClientQuestionsCard } from "@/components/client-portal/client-questions-card"
import { ClientDocumentUpload } from "@/components/client-portal/client-document-upload"
import { ClientProgressCard } from "@/components/client-portal/client-progress-card"
import { ClientDeliverablesCard } from "@/components/client-portal/client-deliverables-card"

interface ClientData {
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

export default function ClientPortalPage() {
  const [availableClients, setAvailableClients] = useState<AvailableClient[]>([])
  const [selectedClientId, setSelectedClientId] = useState<string>("")

  const [loading, setLoading] = useState(true)
  const [client, setClient] = useState<ClientData | null>(null)
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

  useEffect(() => {
    const fetchAvailableClients = async () => {
      try {
        const res = await fetch("/api/clients")
        const data = await res.json()
        if (data.clients && data.clients.length > 0) {
          setAvailableClients(
            data.clients.map((c: any) => ({
              id: c.id,
              name: c.name,
              email: c.email,
            })),
          )
          // Auto-select first client
          setSelectedClientId(data.clients[0].id)
        }
      } catch (error) {
        console.error("Error fetching clients:", error)
      }
    }
    fetchAvailableClients()
  }, [])

  const fetchClientData = useCallback(async () => {
    if (!selectedClientId) return

    setLoading(true)
    try {
      const teamRes = await fetch(`/api/client-portal/team?clientId=${selectedClientId}`)
      const teamData = await teamRes.json()

      if (teamData.success && teamData.client) {
        setClient(teamData.client)
        setTeamMembers(teamData.teamMembers || [])
        setDirectors(teamData.directors || [])

        const clientId = teamData.client.id
        const clientEmail = teamData.client.email

        // Fetch other data in parallel
        const [tasksRes, questionsRes, docsRes, deliverablesRes, progressRes] = await Promise.all([
          fetch(`/api/client-portal/tasks?clientId=${clientId}`),
          fetch(`/api/client-portal/questions?clientId=${clientId}`),
          fetch(`/api/client-portal/client-documents?email=${encodeURIComponent(clientEmail)}`),
          fetch(`/api/client-portal/deliverables?clientId=${clientId}`),
          fetch(`/api/client-portal/weekly-progress?clientId=${clientId}`),
        ])

        const [tasksData, questionsData, docsData, deliverablesData, progressData] = await Promise.all([
          tasksRes.json(),
          questionsRes.json(),
          docsRes.json(),
          deliverablesRes.json(),
          progressRes.json(),
        ])

        setTasks(tasksData.tasks || [])
        setQuestions(questionsData.questions || [])
        setClientDocuments(docsData.documents || [])
        setDeliverables(deliverablesData.deliverables || [])
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
    if (client?.email) {
      fetch(`/api/client-portal/client-documents?email=${encodeURIComponent(client.email)}`)
        .then((res) => res.json())
        .then((data) => setClientDocuments(data.documents || []))
    }
  }

  const pendingTasks = tasks.filter((t) => t.status === "pending" || t.status === "in_progress")
  const openQuestions = questions.filter((q) => q.status === "open")

  if (availableClients.length === 0 && loading) {
    return (
      <div className="min-h-screen bg-slate-50 pt-[48px] pl-12">
        <MainNavigation />
        <div className="container mx-auto px-4 py-6">
          <Card className="p-8 text-center">
            <p className="text-slate-500">Loading clients...</p>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-[48px] pl-12">
      <MainNavigation />
      <ClientPortalHeader />

      <div className="container mx-auto px-4 py-6">
        <div className="mb-4 flex items-center gap-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-amber-800 font-medium">Demo Mode</p>
            <p className="text-xs text-amber-600">
              In production, clients will be authenticated and see only their own portal.
            </p>
          </div>
          <Select value={selectedClientId} onValueChange={setSelectedClientId}>
            <SelectTrigger className="w-[280px] bg-white">
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

        {/* Header */}
        <div className="mb-6 bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Building2 className="h-8 w-8 text-slate-300" />
                <div>
                  <h1 className="text-2xl font-bold">{loading ? "Loading..." : client?.name || "Client Portal"}</h1>
                  <p className="text-slate-300 text-sm">{client?.projectType || "Business Consulting Engagement"}</p>
                </div>
              </div>
              {client?.semester && <Badge className="bg-slate-600 text-slate-200 mt-2">{client.semester}</Badge>}
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="text-right">
                <p className="text-slate-400">Team Size</p>
                <p className="text-lg font-semibold">{teamMembers.length + directors.length}</p>
              </div>
              <div className="h-10 w-px bg-slate-600" />
              <div className="text-right">
                <p className="text-slate-400">Hours Logged</p>
                <p className="text-lg font-semibold">{progress.totalHours.toFixed(1)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card className="p-4 border-slate-200 bg-white">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Team Members</p>
                <p className="text-xl font-bold text-slate-900">{teamMembers.length + directors.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 border-slate-200 bg-white">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <MessageSquare className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Active Tasks</p>
                <p className="text-xl font-bold text-slate-900">{pendingTasks.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 border-slate-200 bg-white">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <HelpCircle className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Open Questions</p>
                <p className="text-xl font-bold text-slate-900">{openQuestions.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 border-slate-200 bg-white">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100">
                <FileText className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Deliverables</p>
                <p className="text-xl font-bold text-slate-900">{deliverables.length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Dashboard Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-background">
              <TrendingUp className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="team" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Your Team
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

          {/* Team Tab */}
          <TabsContent value="team">
            <ClientTeamCard teamMembers={teamMembers} directors={directors} loading={loading} />
          </TabsContent>

          {/* Tasks & Q&A Tab */}
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

          {/* Documents Tab */}
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
  )
}
